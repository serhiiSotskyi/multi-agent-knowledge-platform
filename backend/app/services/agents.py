from collections import defaultdict, deque
from uuid import uuid4

from anthropic import AsyncAnthropic
from fastapi import HTTPException
from psycopg.types.json import Jsonb

from app.core.config import get_settings
from app.db.database import run_one, run_query
from app.services.agency import (
    ensure_agency_defaults,
    evaluate_run,
    log_action_event,
    propose_campaign_update,
    propose_monthly_actions,
    workspace_context,
)
from app.services.provider_keys import get_provider_key
from app.services.vector_store import retrieve


DEFAULT_AGENTS = [
    {
        "name": "Account Manager Agent",
        "role": "Client context and delivery owner",
        "goal": "Translate client goals, constraints, and stakeholder expectations into a clear agency work brief.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "PPC Strategist",
        "role": "Paid search specialist",
        "goal": "Find PPC budget, keyword, negative keyword, ad copy, and landing-page actions that can improve account performance.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "SEO Strategist",
        "role": "SEO specialist",
        "goal": "Identify technical SEO, content, search-intent, and organic growth actions for the next delivery sprint.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Data Analyst Agent",
        "role": "Marketing performance analyst",
        "goal": "Detect trends, anomalies, weak spots, and evidence-backed priorities from synthetic PPC/SEO performance data.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Content Strategist Agent",
        "role": "Search content strategist",
        "goal": "Turn SEO and PPC findings into briefs, content priorities, landing-page ideas, and messaging recommendations.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "QA/Compliance Agent",
        "role": "Grounding, brand, and risk reviewer",
        "goal": "Check whether recommendations are grounded, clear, risk-aware, and safe for a client-facing agency workflow.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Workflow Supervisor Agent",
        "role": "Agency operations supervisor",
        "goal": "Resolve conflicts between specialists and decide the final execution priorities for the agency team.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Reporting Agent",
        "role": "Client-ready report writer",
        "goal": "Create a concise monthly operations report with approved-style priorities, evidence, risks, and next steps.",
        "tools": ["rag_retrieve"],
    },
]


def bootstrap_defaults(user_id: str) -> dict:
    ensure_agency_defaults(user_id)
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
        "select id from workflows where user_id = %(user_id)s and name = 'Monthly PPC/SEO Operations Review'",
        {"user_id": user_id},
    )
    if not workflow_exists:
        ordered = [
            "Account Manager Agent",
            "Data Analyst Agent",
            "SEO Strategist",
            "PPC Strategist",
            "Content Strategist Agent",
            "QA/Compliance Agent",
            "Workflow Supervisor Agent",
            "Reporting Agent",
        ]
        nodes = [{
            "id": "retrieve-agency-context",
            "type": "default",
            "position": {"x": 40, "y": 70},
            "data": {"label": "Retrieve agency knowledge", "kind": "retrieve"},
        }]
        nodes.extend([
            {
                "id": agent_ids[name],
                "type": "default",
                "position": {"x": 260 + index * 220, "y": 120 if index % 2 else 30},
                "data": {"label": name, "kind": "agent"},
            }
            for index, name in enumerate(ordered)
        ])
        execution_nodes = [
            {
                "id": "queue-monthly-actions",
                "type": "default",
                "position": {"x": 260 + len(ordered) * 220, "y": 30},
                "data": {"label": "Queue approval-gated tasks", "kind": "create_task"},
            },
            {
                "id": "queue-campaign-update",
                "type": "default",
                "position": {"x": 480 + len(ordered) * 220, "y": 120},
                "data": {"label": "Queue campaign update", "kind": "update_campaign"},
            },
            {
                "id": "approval-gate",
                "type": "default",
                "position": {"x": 700 + len(ordered) * 220, "y": 30},
                "data": {"label": "Human approval gate", "kind": "approval"},
            },
            {
                "id": "evaluate-run",
                "type": "default",
                "position": {"x": 920 + len(ordered) * 220, "y": 120},
                "data": {"label": "Evaluate run", "kind": "evaluate"},
            },
            {
                "id": "export-docx",
                "type": "default",
                "position": {"x": 1140 + len(ordered) * 220, "y": 30},
                "data": {"label": "DOCX report available", "kind": "export_docx"},
            },
        ]
        nodes.extend(execution_nodes)
        ordered_node_ids = ["retrieve-agency-context", *[agent_ids[name] for name in ordered], *[node["id"] for node in execution_nodes]]
        edges = [
            {"id": f"e-{source}-{target}", "source": source, "target": target, "animated": True}
            for source, target in zip(ordered_node_ids, ordered_node_ids[1:], strict=False)
        ]
        run_query(
            """
            insert into workflows (id, user_id, name, description, nodes, edges)
            values (%(id)s, %(user_id)s, %(name)s, %(description)s, %(nodes)s::jsonb, %(edges)s::jsonb)
            """,
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "name": "Monthly PPC/SEO Operations Review",
                "description": "A vertical agency workforce reviews client context, PPC/SEO evidence, proposes approval-gated actions, and produces a client-ready report.",
                "nodes": Jsonb(nodes),
                "edges": Jsonb(edges),
            },
        )
    return {"ok": True}


def ordered_node_ids(nodes: list[dict], edges: list[dict]) -> list[str]:
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


def _node_kind(node: dict, agent_by_id: dict[str, dict]) -> str:
    data = node.get("data") or {}
    kind = data.get("kind") or node.get("type")
    if node.get("id") in agent_by_id:
        return "agent"
    return kind or "agent"


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

    run_id = str(uuid4())
    run_query(
        """
        insert into runs (id, user_id, workflow_id, prompt, output, citations, trace)
        values (%(id)s, %(user_id)s, %(workflow_id)s, %(prompt)s, 'Run in progress.', '[]'::jsonb, '[]'::jsonb)
        """,
        {"id": run_id, "user_id": user_id, "workflow_id": workflow_id, "prompt": prompt},
    )

    node_ids = ordered_node_ids(workflow["nodes"], workflow["edges"])
    node_by_id = {node["id"]: node for node in workflow["nodes"]}
    agent_ids = [node_id for node_id in node_ids if run_one(
        "select id from agents where id::text = %(id)s and user_id = %(user_id)s",
        {"id": node_id, "user_id": user_id},
    )]
    agents = run_query(
        "select * from agents where user_id = %(user_id)s and id::text = any(%(ids)s)",
        {"user_id": user_id, "ids": agent_ids},
    )
    agent_by_id = {str(agent["id"]): agent for agent in agents}
    agency_context, _, _, _ = workspace_context(user_id, prompt)
    citations: list[dict] = []
    context = ""

    client = AsyncAnthropic(api_key=api_key)
    running_notes = ""
    trace: list[dict] = []
    proposed_actions = 0
    evaluation = None
    for node_id in node_ids:
        node = node_by_id.get(node_id, {"id": node_id, "data": {}})
        kind = _node_kind(node, agent_by_id)
        if kind == "retrieve":
            citations = retrieve(user_id, prompt, limit=8)
            context = "\n\n".join(
                f"[{idx + 1}] {item['filename']} chunk {item['chunk_index']}:\n{item['content']}"
                for idx, item in enumerate(citations)
            )
            log_action_event(
                user_id,
                run_id,
                workflow_id,
                "retrieve",
                "Retrieved agency knowledge from vector store",
                {"citation_count": len(citations), "filenames": sorted({item["filename"] for item in citations})},
            )
            continue

        if kind == "create_task":
            proposals = propose_monthly_actions(user_id, run_id, workflow_id, prompt, running_notes)
            proposed_actions += len(proposals)
            running_notes += f"\n\n## Internal Actions\nQueued {len(proposals)} approval-gated agency tasks."
            continue

        if kind == "update_campaign":
            approval = propose_campaign_update(user_id, run_id, workflow_id, prompt, running_notes)
            proposed_actions += 1 if approval else 0
            running_notes += "\n\n## Internal Actions\nQueued a campaign note update for approval."
            continue

        if kind == "approval":
            log_action_event(
                user_id,
                run_id,
                workflow_id,
                "approval_gate",
                "Workflow paused persistent changes behind human approval",
                {"pending_actions": proposed_actions},
            )
            continue

        if kind == "evaluate":
            continue

        if kind == "export_docx":
            log_action_event(
                user_id,
                run_id,
                workflow_id,
                "export_docx",
                "Client-ready DOCX report is available for this run",
                {"download_path": f"/api/runs/{run_id}/docx"},
            )
            continue

        agent = agent_by_id.get(node_id)
        if not agent:
            log_action_event(user_id, run_id, workflow_id, "skip", f"Skipped unsupported workflow node: {node_id}", {"kind": kind})
            continue
        if not context:
            citations = retrieve(user_id, prompt, limit=8)
            context = "\n\n".join(
                f"[{idx + 1}] {item['filename']} chunk {item['chunk_index']}:\n{item['content']}"
                for idx, item in enumerate(citations)
            )
        system = (
            f"You are {agent['name']}. Role: {agent['role']}.\n"
            f"Goal: {agent['goal']}\n"
            "You are part of an AI workforce for a PPC/SEO agency. "
            "Use the agency workspace, retrieved source context, and previous agent notes. "
            "If evidence is missing, say what is missing. Keep output concise, actionable, and suitable for approval-gated execution."
        )
        user_message = (
            f"User request:\n{prompt}\n\n"
            f"Agency workspace:\n{agency_context}\n\n"
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
        trace.append({"agent_id": node_id, "agent_name": agent["name"], "output": text})
        log_action_event(
            user_id,
            run_id,
            workflow_id,
            "agent_output",
            f"{agent['name']} completed its step",
            {"output_preview": text[:900]},
            agent_id=node_id,
        )
        running_notes += f"\n\n## {agent['name']}\n{text}"

    output = trace[-1]["output"] if trace else "No agents were available to run."
    evaluation = evaluate_run(user_id, run_id, citations, trace, output, proposed_actions)
    log_action_event(
        user_id,
        run_id,
        workflow_id,
        "evaluation",
        "Run evaluation completed",
        {"overall_score": evaluation["overall_score"], "proposed_actions": proposed_actions},
    )
    run_query(
        """
        update runs
        set output = %(output)s, citations = %(citations)s::jsonb, trace = %(trace)s::jsonb
        where id = %(id)s and user_id = %(user_id)s
        """,
        {
            "id": run_id,
            "user_id": user_id,
            "output": output,
            "citations": Jsonb(citations),
            "trace": Jsonb(trace),
        },
    )
    events = run_query("select * from action_events where run_id = %(run_id)s order by created_at", {"run_id": run_id})
    approvals = run_query("select * from approvals where run_id = %(run_id)s order by created_at", {"run_id": run_id})
    return {
        "id": run_id,
        "output": output,
        "citations": citations,
        "trace": trace,
        "events": events,
        "approvals": approvals,
        "evaluation": evaluation,
    }
