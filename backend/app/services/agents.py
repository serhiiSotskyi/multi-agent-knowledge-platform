from collections import defaultdict, deque
from uuid import uuid4

from anthropic import AsyncAnthropic
from fastapi import HTTPException
from psycopg.types.json import Jsonb

from app.core.config import get_settings
from app.db.database import run_one, run_query
from app.services.provider_keys import get_provider_key
from app.services.vector_store import retrieve


DEFAULT_AGENTS = [
    {
        "name": "Research Agent",
        "role": "Enterprise knowledge researcher",
        "goal": "Retrieve relevant source material and summarize what the knowledge base says.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "PPC Strategist",
        "role": "Paid search specialist",
        "goal": "Analyze PPC implications, risks, campaign setup issues, and performance questions.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "SEO Analyst",
        "role": "SEO specialist",
        "goal": "Analyze technical SEO, content, rankings, and organic growth recommendations.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Report Writer",
        "role": "Business report writer",
        "goal": "Turn agent findings into a concise business-ready answer or report.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Verifier Agent",
        "role": "Grounding and citation reviewer",
        "goal": "Check whether the final answer is supported by retrieved source snippets.",
        "tools": ["rag_retrieve"],
    },
]


def bootstrap_defaults(user_id: str) -> dict:
    existing = run_query("select id, name from agents where user_id = %(user_id)s", {"user_id": user_id})
    agent_ids: dict[str, str] = {row["name"]: str(row["id"]) for row in existing}
    settings = get_settings()
    for agent in DEFAULT_AGENTS:
        if agent["name"] in agent_ids:
            continue
        agent_id = str(uuid4())
        run_query(
            """
            insert into agents (id, user_id, name, role, goal, model, temperature, tools)
            values (%(id)s, %(user_id)s, %(name)s, %(role)s, %(goal)s, %(model)s, 0.2, %(tools)s::jsonb)
            """,
            {
                "id": agent_id,
                "user_id": user_id,
                "name": agent["name"],
                "role": agent["role"],
                "goal": agent["goal"],
                "model": settings.anthropic_model,
                "tools": Jsonb(agent["tools"]),
            },
        )
        agent_ids[agent["name"]] = agent_id

    workflow_exists = run_one(
        "select id from workflows where user_id = %(user_id)s and name = 'Cooperative Knowledge Report'",
        {"user_id": user_id},
    )
    if not workflow_exists:
        ordered = ["Research Agent", "PPC Strategist", "SEO Analyst", "Report Writer", "Verifier Agent"]
        nodes = [
            {
                "id": agent_ids[name],
                "type": "agent",
                "position": {"x": index * 230, "y": 120 if index % 2 else 40},
                "data": {"label": name},
            }
            for index, name in enumerate(ordered)
        ]
        edges = [
            {"id": f"e-{agent_ids[a]}-{agent_ids[b]}", "source": agent_ids[a], "target": agent_ids[b]}
            for a, b in zip(ordered, ordered[1:], strict=False)
        ]
        run_query(
            """
            insert into workflows (id, user_id, name, description, nodes, edges)
            values (%(id)s, %(user_id)s, %(name)s, %(description)s, %(nodes)s::jsonb, %(edges)s::jsonb)
            """,
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "name": "Cooperative Knowledge Report",
                "description": "Research, PPC, SEO, writing, and verification agents cooperate on a source-grounded answer.",
                "nodes": Jsonb(nodes),
                "edges": Jsonb(edges),
            },
        )
    return {"ok": True}


def ordered_agent_ids(nodes: list[dict], edges: list[dict]) -> list[str]:
    node_ids = [node["id"] for node in nodes]
    incoming: dict[str, int] = {node_id: 0 for node_id in node_ids}
    outgoing: dict[str, list[str]] = defaultdict(list)
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source in incoming and target in incoming:
            incoming[target] += 1
            outgoing[source].append(target)
    queue = deque([node_id for node_id in node_ids if incoming[node_id] == 0])
    result: list[str] = []
    while queue:
        node_id = queue.popleft()
        result.append(node_id)
        for target in outgoing[node_id]:
            incoming[target] -= 1
            if incoming[target] == 0:
                queue.append(target)
    return result if len(result) == len(node_ids) else node_ids


async def run_workflow(user_id: str, workflow_id: str, prompt: str) -> dict:
    api_key = get_provider_key(user_id, "anthropic")
    if not api_key:
        raise HTTPException(status_code=400, detail="Add your Anthropic API key before running agents")

    workflow = run_one(
        "select * from workflows where id = %(id)s and user_id = %(user_id)s",
        {"id": workflow_id, "user_id": user_id},
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    agent_ids = ordered_agent_ids(workflow["nodes"], workflow["edges"])
    agents = run_query(
        "select * from agents where user_id = %(user_id)s and id::text = any(%(ids)s)",
        {"user_id": user_id, "ids": agent_ids},
    )
    agent_by_id = {str(agent["id"]): agent for agent in agents}
    citations = retrieve(user_id, prompt, limit=6)
    context = "\n\n".join(
        f"[{idx + 1}] {item['filename']} chunk {item['chunk_index']}:\n{item['content']}"
        for idx, item in enumerate(citations)
    )

    client = AsyncAnthropic(api_key=api_key)
    running_notes = ""
    trace: list[dict] = []
    for agent_id in agent_ids:
        agent = agent_by_id.get(agent_id)
        if not agent:
            continue
        system = (
            f"You are {agent['name']}. Role: {agent['role']}.\n"
            f"Goal: {agent['goal']}\n"
            "Use only the provided source context and previous agent notes. "
            "If evidence is missing, say what is missing. Keep output concise and actionable."
        )
        user_message = (
            f"User request:\n{prompt}\n\n"
            f"Retrieved source context:\n{context or 'No source context found.'}\n\n"
            f"Previous agent notes:\n{running_notes or 'None yet.'}"
        )
        response = await client.messages.create(
            model=agent["model"] or get_settings().anthropic_model,
            max_tokens=900,
            temperature=float(agent["temperature"] or 0.2),
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )
        text = "\n".join(block.text for block in response.content if getattr(block, "type", "") == "text")
        trace.append({"agent_id": agent_id, "agent_name": agent["name"], "output": text})
        running_notes += f"\n\n## {agent['name']}\n{text}"

    output = trace[-1]["output"] if trace else "No agents were available to run."
    run_id = str(uuid4())
    run_query(
        """
        insert into runs (id, user_id, workflow_id, prompt, output, citations, trace)
        values (%(id)s, %(user_id)s, %(workflow_id)s, %(prompt)s, %(output)s, %(citations)s::jsonb, %(trace)s::jsonb)
        """,
        {
            "id": run_id,
            "user_id": user_id,
            "workflow_id": workflow_id,
            "prompt": prompt,
            "output": output,
            "citations": Jsonb(citations),
            "trace": Jsonb(trace),
        },
    )
    return {"id": run_id, "output": output, "citations": citations, "trace": trace}
