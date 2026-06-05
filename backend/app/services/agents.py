from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
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
    propose_monthly_actions,
    workspace_context,
)
from app.services.provider_keys import get_provider_key
from app.services.vector_store import retrieve


DEFAULT_AGENTS = [
    {
        "name": "Database Curator Agent",
        "role": "Document database specialist",
        "goal": "Inspect the uploaded knowledge base, identify relevant source documents, and explain what evidence is available.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Evidence Analyst Agent",
        "role": "Evidence synthesis specialist",
        "goal": "Synthesize retrieved document chunks into grounded findings, patterns, contradictions, and missing information.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Task Planner Agent",
        "role": "Action planning specialist",
        "goal": "Convert grounded findings into approval-gated implementation tasks with priorities and acceptance criteria.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Risk Reviewer Agent",
        "role": "Grounding and risk reviewer",
        "goal": "Check recommendations for unsupported claims, sensitive assumptions, risk, and missing citations.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Workflow Supervisor Agent",
        "role": "Workflow coordination specialist",
        "goal": "Resolve conflicts between agents and decide which findings should move to approval-gated tasks.",
        "tools": ["rag_retrieve"],
    },
    {
        "name": "Reporting Agent",
        "role": "DOCX report writer",
        "goal": "Create a concise, document-grounded report with evidence, approved-style priorities, risks, and next steps.",
        "tools": ["rag_retrieve"],
    },
]


def _agent_run_nodes(agent_id: str, agent_name: str) -> tuple[list[dict], list[dict]]:
    nodes = [
        {"id": "retrieve-agent-context", "type": "default", "position": {"x": 40, "y": 70}, "data": {"label": "Retrieve database context", "kind": "retrieve"}},
        {"id": agent_id, "type": "default", "position": {"x": 300, "y": 70}, "data": {"label": agent_name, "kind": "agent"}},
        {"id": "queue-document-tasks", "type": "default", "position": {"x": 560, "y": 70}, "data": {"label": "Queue approval-gated tasks", "kind": "create_task"}},
        {"id": "approval-gate", "type": "default", "position": {"x": 820, "y": 70}, "data": {"label": "Human approval gate", "kind": "approval"}},
        {"id": "evaluate-run", "type": "default", "position": {"x": 1080, "y": 70}, "data": {"label": "Evaluate run", "kind": "evaluate"}},
        {"id": "export-docx", "type": "default", "position": {"x": 1340, "y": 70}, "data": {"label": "DOCX report available", "kind": "export_docx"}},
    ]
    node_ids = [node["id"] for node in nodes]
    edges = [
        {"id": f"e-{source}-{target}", "source": source, "target": target, "animated": True}
        for source, target in zip(node_ids, node_ids[1:], strict=False)
    ]
    return nodes, edges


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
            insert into agents
              (id, user_id, name, role, goal, description, system_prompt, model, temperature, tools, trigger_type, trigger_config, status, permission_mode)
            values
              (%(id)s, %(user_id)s, %(name)s, %(role)s, %(goal)s, %(description)s, %(system_prompt)s,
               %(model)s, 0.2, %(tools)s::jsonb, 'manual', '{}'::jsonb, 'active', 'approval_required')
            """,
            {
                "id": agent_id,
                "user_id": user_id,
                "name": agent["name"],
                "role": agent["role"],
                "goal": agent["goal"],
                "description": agent["goal"],
                "system_prompt": f"{agent['role']}\n\n{agent['goal']}",
                "model": settings.anthropic_model,
                "tools": Jsonb(agent["tools"]),
            },
        )
        agent_ids[agent["name"]] = agent_id

    workflow_payload = _default_workflow_payload(agent_ids)
    legacy_workflow = run_one(
        "select id from workflows where user_id = %(user_id)s and name = 'Monthly PPC/SEO Operations Review'",
        {"user_id": user_id},
    )
    if legacy_workflow:
        run_query(
            """
            update workflows
            set name=%(name)s, description=%(description)s, nodes=%(nodes)s::jsonb,
                edges=%(edges)s::jsonb, updated_at=now()
            where id=%(id)s and user_id=%(user_id)s
            """,
            {
                "id": legacy_workflow["id"],
                "user_id": user_id,
                "name": workflow_payload["name"],
                "description": workflow_payload["description"],
                "nodes": Jsonb(workflow_payload["nodes"]),
                "edges": Jsonb(workflow_payload["edges"]),
            },
        )
    workflow_exists = run_one(
        "select id from workflows where user_id = %(user_id)s and name = %(name)s",
        {"user_id": user_id, "name": workflow_payload["name"]},
    )
    if not workflow_exists:
        run_query(
            """
            insert into workflows (id, user_id, name, description, nodes, edges)
            values (%(id)s, %(user_id)s, %(name)s, %(description)s, %(nodes)s::jsonb, %(edges)s::jsonb)
            """,
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "name": workflow_payload["name"],
                "description": workflow_payload["description"],
                "nodes": Jsonb(workflow_payload["nodes"]),
                "edges": Jsonb(workflow_payload["edges"]),
            },
        )
    return {"ok": True}


def _default_workflow_payload(agent_ids: dict[str, str]) -> dict:
    ordered = [
        "Database Curator Agent",
        "Evidence Analyst Agent",
        "Task Planner Agent",
        "Risk Reviewer Agent",
        "Workflow Supervisor Agent",
        "Reporting Agent",
    ]
    nodes = [{
        "id": "retrieve-database-context",
        "type": "default",
        "position": {"x": 40, "y": 70},
        "data": {"label": "Retrieve database context", "kind": "retrieve"},
    }]
    nodes.extend([
        {
            "id": agent_ids[name],
            "type": "default",
            "position": {"x": 260 + index * 220, "y": 120 if index % 2 else 30},
            "data": {"label": name, "kind": "agent"},
        }
        for index, name in enumerate(ordered)
        if name in agent_ids
    ])
    execution_nodes = [
        {
            "id": "queue-document-tasks",
            "type": "default",
            "position": {"x": 260 + len(ordered) * 220, "y": 30},
            "data": {"label": "Queue approval-gated tasks", "kind": "create_task"},
        },
        {
            "id": "approval-gate",
            "type": "default",
            "position": {"x": 480 + len(ordered) * 220, "y": 120},
            "data": {"label": "Human approval gate", "kind": "approval"},
        },
        {
            "id": "evaluate-run",
            "type": "default",
            "position": {"x": 700 + len(ordered) * 220, "y": 30},
            "data": {"label": "Evaluate run", "kind": "evaluate"},
        },
        {
            "id": "export-docx",
            "type": "default",
            "position": {"x": 920 + len(ordered) * 220, "y": 120},
            "data": {"label": "DOCX report available", "kind": "export_docx"},
        },
    ]
    nodes.extend(execution_nodes)
    ordered_node_ids = ["retrieve-database-context", *[agent_ids[name] for name in ordered if name in agent_ids], *[node["id"] for node in execution_nodes]]
    edges = [
        {"id": f"e-{source}-{target}", "source": source, "target": target, "animated": True}
        for source, target in zip(ordered_node_ids, ordered_node_ids[1:], strict=False)
    ]
    return {
        "name": "Document Operations Review",
        "description": "A document-grounded workflow retrieves database evidence, coordinates specialist agents, queues approval-gated tasks, evaluates quality, and exports a DOCX report.",
        "nodes": nodes,
        "edges": edges,
    }


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


def _node_label(node: dict, agent_by_id: dict[str, dict]) -> str:
    data = node.get("data") or {}
    agent = agent_by_id.get(node.get("id"))
    return data.get("label") or (agent["name"] if agent else node.get("id", "Workflow node"))


def _set_run_state(
    user_id: str,
    run_id: str,
    status: str,
    node_id: str | None = None,
    node_label: str | None = None,
    error_message: str | None = None,
    mark_started: bool = False,
    mark_completed: bool = False,
) -> None:
    run_query(
        """
        update runs
        set status = %(status)s,
            current_node_id = %(node_id)s,
            current_node_label = %(node_label)s,
            error_message = %(error_message)s,
            started_at = case when %(mark_started)s then coalesce(started_at, now()) else started_at end,
            completed_at = case when %(mark_completed)s then now() else completed_at end
        where id = %(run_id)s and user_id = %(user_id)s
        """,
        {
            "run_id": run_id,
            "user_id": user_id,
            "status": status,
            "node_id": node_id,
            "node_label": node_label,
            "error_message": error_message,
            "mark_started": mark_started,
            "mark_completed": mark_completed,
        },
    )


def _log_node_event(user_id: str, run_id: str, workflow_id: str | None, event_type: str, node: dict, kind: str, label: str, **payload: object) -> None:
    log_action_event(
        user_id,
        run_id,
        workflow_id,
        event_type,
        label,
        {"node_id": node.get("id"), "node_label": label, "kind": kind, **payload},
        agent_id=node.get("id") if kind == "agent" else None,
    )


def get_run_detail(user_id: str, run_id: str) -> dict:
    run = run_one(
        """
        select r.*, w.name as workflow_name, w.nodes as workflow_nodes, w.edges as workflow_edges,
               a.name as agent_name
        from runs r
        left join workflows w on w.id = r.workflow_id
        left join agents a on a.id = r.agent_id
        where r.id = %(id)s and r.user_id = %(user_id)s
        """,
        {"id": run_id, "user_id": user_id},
    )
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run["citations"] = run.get("citations") or []
    run["trace"] = run.get("trace") or []
    run["events"] = run_query("select * from action_events where run_id = %(run_id)s order by created_at", {"run_id": run_id})
    run["approvals"] = run_query("select * from approvals where run_id = %(run_id)s order by created_at", {"run_id": run_id})
    run["evaluation"] = run_one("select * from run_evaluations where run_id = %(run_id)s", {"run_id": run_id})
    if run.get("agent_id") and not run.get("workflow_nodes"):
        agent_node_id = str(run["agent_id"])
        run["workflow_nodes"], run["workflow_edges"] = _agent_run_nodes(agent_node_id, run.get("agent_name") or "Agent")
    return run


def create_workflow_run(user_id: str, workflow_id: str, prompt: str, trigger_source: str = "manual") -> dict:
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
        insert into runs (id, user_id, workflow_id, prompt, output, citations, trace, status, current_node_label, trigger_source)
        values (%(id)s, %(user_id)s, %(workflow_id)s, %(prompt)s, 'Run queued.', '[]'::jsonb, '[]'::jsonb, 'queued', 'Queued', %(trigger_source)s)
        """,
        {"id": run_id, "user_id": user_id, "workflow_id": workflow_id, "prompt": prompt, "trigger_source": trigger_source},
    )
    return get_run_detail(user_id, run_id)


def create_agent_run(user_id: str, agent_id: str, prompt: str, trigger_source: str = "manual") -> dict:
    api_key = get_provider_key(user_id, "anthropic")
    if not api_key:
        raise HTTPException(status_code=400, detail="Add your Anthropic API key before running agents")

    agent = run_one("select * from agents where id = %(id)s and user_id = %(user_id)s", {"id": agent_id, "user_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    run_id = str(uuid4())
    run_query(
        """
        insert into runs (id, user_id, agent_id, prompt, output, citations, trace, status, current_node_label, trigger_source, trigger_config)
        values (%(id)s, %(user_id)s, %(agent_id)s, %(prompt)s, 'Run queued.', '[]'::jsonb, '[]'::jsonb,
                'queued', 'Queued', %(trigger_source)s, %(trigger_config)s::jsonb)
        """,
        {
            "id": run_id,
            "user_id": user_id,
            "agent_id": agent_id,
            "prompt": prompt,
            "trigger_source": trigger_source,
            "trigger_config": Jsonb(agent.get("trigger_config") or {}),
        },
    )
    return get_run_detail(user_id, run_id)


async def execute_workflow_run(user_id: str, run_id: str) -> None:
    run = run_one(
        """
        select r.*, w.nodes, w.edges
        from runs r
        join workflows w on w.id = r.workflow_id
        where r.id = %(id)s and r.user_id = %(user_id)s
        """,
        {"id": run_id, "user_id": user_id},
    )
    if not run:
        return

    workflow_id = str(run["workflow_id"])
    prompt = run["prompt"]
    try:
        api_key = get_provider_key(user_id, "anthropic")
        if not api_key:
            raise HTTPException(status_code=400, detail="Add your Anthropic API key before running agents")

        _set_run_state(user_id, run_id, "running", mark_started=True)
        node_ids = ordered_node_ids(run["nodes"], run["edges"])
        node_by_id = {node["id"]: node for node in run["nodes"]}
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
            label = _node_label(node, agent_by_id)
            _set_run_state(user_id, run_id, "running", node_id=node_id, node_label=label)
            _log_node_event(user_id, run_id, workflow_id, "node_started", node, kind, label)

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
                    "Retrieved database knowledge from vector store",
                    {"citation_count": len(citations), "filenames": sorted({item["filename"] for item in citations})},
                )
                _log_node_event(user_id, run_id, workflow_id, "node_completed", node, kind, label, citation_count=len(citations))
                continue

            if kind == "create_task":
                proposals = propose_monthly_actions(user_id, run_id, workflow_id, prompt, running_notes)
                proposed_actions += len(proposals)
                running_notes += f"\n\n## Internal Actions\nQueued {len(proposals)} approval-gated document workflow tasks."
                _log_node_event(user_id, run_id, workflow_id, "node_completed", node, kind, label, proposed_actions=len(proposals))
                continue

            if kind == "approval":
                _set_run_state(user_id, run_id, "waiting_approval", node_id=node_id, node_label=label)
                log_action_event(
                    user_id,
                    run_id,
                    workflow_id,
                    "approval_required",
                    "Workflow paused persistent changes behind human approval",
                    {"pending_actions": proposed_actions, "node_id": node_id, "node_label": label},
                )
                _log_node_event(user_id, run_id, workflow_id, "node_completed", node, kind, label, pending_actions=proposed_actions)
                continue

            if kind == "evaluate":
                output = trace[-1]["output"] if trace else running_notes or "No agents were available to run."
                evaluation = evaluate_run(user_id, run_id, citations, trace, output, proposed_actions)
                log_action_event(
                    user_id,
                    run_id,
                    workflow_id,
                    "evaluation",
                    "Run evaluation completed",
                    {"overall_score": evaluation["overall_score"], "proposed_actions": proposed_actions},
                )
                _log_node_event(user_id, run_id, workflow_id, "node_completed", node, kind, label, overall_score=evaluation["overall_score"])
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
                _log_node_event(user_id, run_id, workflow_id, "node_completed", node, kind, label)
                continue

            agent = agent_by_id.get(node_id)
            if not agent:
                log_action_event(user_id, run_id, workflow_id, "skip", f"Skipped unsupported workflow node: {node_id}", {"kind": kind})
                _log_node_event(user_id, run_id, workflow_id, "node_completed", node, kind, label, skipped=True)
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
                f"Additional instructions:\n{agent.get('system_prompt') or agent.get('description') or 'Follow the user request using retrieved documents.'}\n"
                "You are part of a document-grounded AI workflow platform. "
                "Use the workspace context, retrieved source context, and previous agent notes. "
                "If evidence is missing, say what is missing. Keep output concise, actionable, and suitable for approval-gated execution. "
                "Write clean GitHub-flavored Markdown. Use headings, bullets, and tables when useful. "
                "Do not include emojis or decorative symbols."
            )
            user_message = (
                f"User request:\n{prompt}\n\n"
                f"Workspace:\n{agency_context}\n\n"
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
                {"output_preview": text[:900], "node_id": node_id, "node_label": label},
                agent_id=node_id,
            )
            running_notes += f"\n\n## {agent['name']}\n{text}"
            _log_node_event(user_id, run_id, workflow_id, "node_completed", node, kind, label, output_preview=text[:300])

        output = trace[-1]["output"] if trace else "No agents were available to run."
        if evaluation is None:
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
        pending = run_one(
            "select count(*) as count from approvals where run_id = %(run_id)s and status = 'pending'",
            {"run_id": run_id},
        )
        final_status = "waiting_approval" if pending and pending["count"] else "completed"
        final_label = "Waiting for approvals" if final_status == "waiting_approval" else "Completed"
        log_action_event(
            user_id,
            run_id,
            workflow_id,
            "run_completed",
            "Workflow run completed" if final_status == "completed" else "Workflow run completed with pending approvals",
            {"status": final_status, "pending_approvals": pending["count"] if pending else 0},
        )
        _set_run_state(user_id, run_id, final_status, node_label=final_label, mark_completed=True)
    except Exception as exc:
        message = getattr(exc, "detail", str(exc))
        run = run_one(
            "select workflow_id, current_node_id, current_node_label from runs where id = %(id)s and user_id = %(user_id)s",
            {"id": run_id, "user_id": user_id},
        )
        if run:
            log_action_event(
                user_id,
                run_id,
                str(run["workflow_id"]) if run.get("workflow_id") else None,
                "node_failed",
                "Workflow execution failed",
                {"error": str(message), "node_id": run.get("current_node_id"), "node_label": run.get("current_node_label")},
            )
        _set_run_state(
            user_id,
            run_id,
            "failed",
            node_id=run.get("current_node_id") if run else None,
            node_label=run.get("current_node_label") if run else "Failed",
            error_message=str(message),
            mark_completed=True,
        )


async def execute_agent_run(user_id: str, run_id: str) -> None:
    run = run_one(
        """
        select r.*, a.name as agent_name, a.role, a.goal, a.description, a.system_prompt, a.model, a.temperature, a.tools
        from runs r
        join agents a on a.id = r.agent_id
        where r.id = %(id)s and r.user_id = %(user_id)s
        """,
        {"id": run_id, "user_id": user_id},
    )
    if not run:
        return

    agent_id = str(run["agent_id"])
    prompt = run["prompt"]
    nodes, _ = _agent_run_nodes(agent_id, run["agent_name"])
    node_by_id = {node["id"]: node for node in nodes}
    try:
        api_key = get_provider_key(user_id, "anthropic")
        if not api_key:
            raise HTTPException(status_code=400, detail="Add your Anthropic API key before running agents")

        _set_run_state(user_id, run_id, "running", mark_started=True)
        agency_context, _, _, _ = workspace_context(user_id, prompt)
        citations: list[dict] = []
        context = ""
        trace: list[dict] = []
        running_notes = ""
        proposed_actions = 0
        evaluation = None

        retrieve_node = node_by_id["retrieve-agent-context"]
        _set_run_state(user_id, run_id, "running", node_id=retrieve_node["id"], node_label=retrieve_node["data"]["label"])
        _log_node_event(user_id, run_id, None, "node_started", retrieve_node, "retrieve", retrieve_node["data"]["label"])
        citations = retrieve(user_id, prompt, limit=8)
        context = "\n\n".join(
            f"[{idx + 1}] {item['filename']} chunk {item['chunk_index']}:\n{item['content']}"
            for idx, item in enumerate(citations)
        )
        log_action_event(
            user_id,
            run_id,
            None,
            "retrieve",
            "Retrieved database knowledge from vector store",
            {"citation_count": len(citations), "filenames": sorted({item["filename"] for item in citations})},
        )
        _log_node_event(user_id, run_id, None, "node_completed", retrieve_node, "retrieve", retrieve_node["data"]["label"], citation_count=len(citations))

        agent_node = node_by_id[agent_id]
        _set_run_state(user_id, run_id, "running", node_id=agent_id, node_label=run["agent_name"])
        _log_node_event(user_id, run_id, None, "node_started", agent_node, "agent", run["agent_name"])
        client = AsyncAnthropic(api_key=api_key)
        system = (
            f"You are {run['agent_name']}. Role: {run['role']}.\n"
            f"Goal: {run['goal']}\n"
            f"Additional instructions:\n{run.get('system_prompt') or run.get('description') or 'Follow the user request using retrieved documents.'}\n"
            "You run inside a document-grounded academic workflow platform. "
            "Use only workspace context and retrieved source context. "
            "If evidence is missing, say what is missing. Write clean GitHub-flavored Markdown without decorative symbols."
        )
        user_message = (
            f"User request:\n{prompt}\n\n"
            f"Workspace:\n{agency_context}\n\n"
            f"Retrieved source context:\n{context or 'No source context found.'}"
        )
        response = await client.messages.create(
            model=run["model"] or get_settings().anthropic_model,
            max_tokens=900,
            temperature=float(run["temperature"] or 0.2),
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )
        output = "\n".join(block.text for block in response.content if getattr(block, "type", "") == "text")
        trace.append({"agent_id": agent_id, "agent_name": run["agent_name"], "output": output})
        running_notes = f"\n\n## {run['agent_name']}\n{output}"
        log_action_event(
            user_id,
            run_id,
            None,
            "agent_output",
            f"{run['agent_name']} completed its step",
            {"output_preview": output[:900], "node_id": agent_id, "node_label": run["agent_name"]},
            agent_id=agent_id,
        )
        _log_node_event(user_id, run_id, None, "node_completed", agent_node, "agent", run["agent_name"], output_preview=output[:300])

        task_node = node_by_id["queue-document-tasks"]
        _set_run_state(user_id, run_id, "running", node_id=task_node["id"], node_label=task_node["data"]["label"])
        _log_node_event(user_id, run_id, None, "node_started", task_node, "create_task", task_node["data"]["label"])
        proposals = propose_monthly_actions(user_id, run_id, None, prompt, running_notes)
        proposed_actions += len(proposals)
        _log_node_event(user_id, run_id, None, "node_completed", task_node, "create_task", task_node["data"]["label"], proposed_actions=len(proposals))

        approval_node = node_by_id["approval-gate"]
        if proposed_actions:
            _set_run_state(user_id, run_id, "waiting_approval", node_id=approval_node["id"], node_label=approval_node["data"]["label"])
            log_action_event(
                user_id,
                run_id,
                None,
                "approval_required",
                "Workflow paused persistent changes behind human approval",
                {"pending_actions": proposed_actions, "node_id": approval_node["id"], "node_label": approval_node["data"]["label"]},
            )
            _log_node_event(user_id, run_id, None, "node_completed", approval_node, "approval", approval_node["data"]["label"], pending_actions=proposed_actions)

        eval_node = node_by_id["evaluate-run"]
        _set_run_state(user_id, run_id, "running", node_id=eval_node["id"], node_label=eval_node["data"]["label"])
        _log_node_event(user_id, run_id, None, "node_started", eval_node, "evaluate", eval_node["data"]["label"])
        evaluation = evaluate_run(user_id, run_id, citations, trace, output, proposed_actions)
        log_action_event(
            user_id,
            run_id,
            None,
            "evaluation",
            "Run evaluation completed",
            {"overall_score": evaluation["overall_score"], "proposed_actions": proposed_actions},
        )
        _log_node_event(user_id, run_id, None, "node_completed", eval_node, "evaluate", eval_node["data"]["label"], overall_score=evaluation["overall_score"])

        export_node = node_by_id["export-docx"]
        _set_run_state(user_id, run_id, "running", node_id=export_node["id"], node_label=export_node["data"]["label"])
        _log_node_event(user_id, run_id, None, "node_started", export_node, "export_docx", export_node["data"]["label"])
        log_action_event(user_id, run_id, None, "export_docx", "DOCX report is available for this run", {"download_path": f"/api/runs/{run_id}/docx"})
        _log_node_event(user_id, run_id, None, "node_completed", export_node, "export_docx", export_node["data"]["label"])

        run_query(
            """
            update runs
            set output = %(output)s, citations = %(citations)s::jsonb, trace = %(trace)s::jsonb
            where id = %(id)s and user_id = %(user_id)s
            """,
            {"id": run_id, "user_id": user_id, "output": output, "citations": Jsonb(citations), "trace": Jsonb(trace)},
        )
        pending = run_one("select count(*) as count from approvals where run_id = %(run_id)s and status = 'pending'", {"run_id": run_id})
        final_status = "waiting_approval" if pending and pending["count"] else "completed"
        final_label = "Waiting for approvals" if final_status == "waiting_approval" else "Completed"
        log_action_event(
            user_id,
            run_id,
            None,
            "run_completed",
            "Agent run completed with pending approvals" if final_status == "waiting_approval" else "Agent run completed",
            {"status": final_status, "pending_approvals": pending["count"] if pending else 0},
        )
        _set_run_state(user_id, run_id, final_status, node_label=final_label, mark_completed=True)
    except Exception as exc:
        message = getattr(exc, "detail", str(exc))
        current = run_one(
            "select current_node_id, current_node_label from runs where id = %(id)s and user_id = %(user_id)s",
            {"id": run_id, "user_id": user_id},
        )
        log_action_event(
            user_id,
            run_id,
            None,
            "node_failed",
            "Agent execution failed",
            {"error": str(message), "node_id": current.get("current_node_id") if current else None, "node_label": current.get("current_node_label") if current else None},
        )
        _set_run_state(
            user_id,
            run_id,
            "failed",
            node_id=current.get("current_node_id") if current else None,
            node_label=current.get("current_node_label") if current else "Failed",
            error_message=str(message),
            mark_completed=True,
        )


def _scheduled_agent_due(agent: dict) -> bool:
    if agent.get("trigger_type") != "scheduled" or agent.get("status") != "active":
        return False
    last_run = agent.get("last_scheduled_run_at")
    if not last_run:
        return True
    if isinstance(last_run, str):
        last_run = datetime.fromisoformat(last_run.replace("Z", "+00:00"))
    schedule_text = " ".join(str(value).lower() for value in (agent.get("trigger_config") or {}).values())
    now = datetime.now(timezone.utc)
    interval = timedelta(hours=1)
    if "daily" in schedule_text:
        interval = timedelta(days=1)
    elif "weekly" in schedule_text:
        interval = timedelta(days=7)
    elif "hour" in schedule_text:
        interval = timedelta(hours=1)
    elif "minute" in schedule_text:
        interval = timedelta(minutes=15)
    return now - last_run >= interval


def create_due_scheduled_agent_runs(user_id: str) -> list[dict]:
    agents = run_query(
        """
        select * from agents
        where user_id = %(user_id)s and trigger_type = 'scheduled' and status = 'active'
        order by created_at
        """,
        {"user_id": user_id},
    )
    created = []
    for agent in agents:
        if not _scheduled_agent_due(agent):
            continue
        prompt = (agent.get("trigger_config") or {}).get("prompt") or f"Run scheduled review for {agent['name']} using the current document database."
        run = create_agent_run(user_id, str(agent["id"]), prompt, trigger_source="scheduled")
        run_query(
            "update agents set last_scheduled_run_at = now(), updated_at = now() where id = %(id)s and user_id = %(user_id)s",
            {"id": agent["id"], "user_id": user_id},
        )
        created.append(run)
    return created


async def run_workflow(user_id: str, workflow_id: str, prompt: str) -> dict:
    run = create_workflow_run(user_id, workflow_id, prompt)
    await execute_workflow_run(user_id, run["id"])
    return get_run_detail(user_id, run["id"])
