from __future__ import annotations

from uuid import uuid4

from fastapi import HTTPException
from psycopg.types.json import Jsonb

from app.db.database import run_one, run_query


DEFAULT_CLIENT = {
    "name": "Academic Demo Workspace",
    "industry": "Synthetic document operations",
    "goals": "Demonstrate document-grounded agent execution, approval-gated task creation, and report generation without real company data.",
    "tone": "Clear, practical, evidence-grounded, and suitable for academic review.",
    "constraints": "Use only synthetic documents uploaded to the database. Do not claim live access to external business systems.",
}

DEFAULT_CAMPAIGNS = [
    {
        "name": "Harbor Homeware Paid Search Efficiency",
        "channel": "ppc",
        "objective": "Improve conversion efficiency by tightening keyword intent, negative keywords, and landing-page alignment.",
        "monthly_budget": 12500,
        "notes": "Synthetic campaign used for academic demonstration of PPC operations.",
    },
    {
        "name": "Harbor Homeware Organic Growth Sprint",
        "channel": "seo",
        "objective": "Increase qualified organic sessions through content gap work, technical fixes, and search-intent mapping.",
        "monthly_budget": None,
        "notes": "Synthetic campaign used for academic demonstration of SEO operations.",
    },
]


def ensure_agency_defaults(user_id: str) -> dict:
    client = run_one(
        "select * from clients where user_id = %(user_id)s and name = %(name)s",
        {"user_id": user_id, "name": DEFAULT_CLIENT["name"]},
    )
    if not client:
        client_id = str(uuid4())
        run_query(
            """
            insert into clients (id, user_id, name, industry, goals, tone, constraints)
            values (%(id)s, %(user_id)s, %(name)s, %(industry)s, %(goals)s, %(tone)s, %(constraints)s)
            """,
            {"id": client_id, "user_id": user_id, **DEFAULT_CLIENT},
        )
        client = run_one("select * from clients where id = %(id)s", {"id": client_id})

    return {"ok": True, "client_id": str(client["id"])}


def select_client(user_id: str, prompt: str = "") -> dict | None:
    clients = run_query("select * from clients where user_id = %(user_id)s order by created_at", {"user_id": user_id})
    if not clients:
        ensure_agency_defaults(user_id)
        clients = run_query("select * from clients where user_id = %(user_id)s order by created_at", {"user_id": user_id})
    prompt_lower = prompt.lower()
    for client in clients:
        if client["name"].lower() in prompt_lower:
            return client
    return clients[0] if clients else None


def workspace_context(user_id: str, prompt: str = "") -> tuple[str, dict | None, list[dict], list[dict]]:
    client = select_client(user_id, prompt)
    if not client:
        return "No client workspace has been created yet.", None, [], []
    campaigns = run_query(
        "select * from campaigns where user_id = %(user_id)s and client_id = %(client_id)s order by created_at",
        {"user_id": user_id, "client_id": client["id"]},
    )
    tasks = run_query(
        """
        select title, discipline, priority, status
        from agency_tasks
        where user_id = %(user_id)s and client_id = %(client_id)s
        order by created_at desc
        limit 8
        """,
        {"user_id": user_id, "client_id": client["id"]},
    )
    task_text = "\n".join(f"- {task['title']} [{task['discipline']}, {task['priority']}, {task['status']}]" for task in tasks)
    context = (
        f"Workspace: {client['name']}\n"
        f"Domain: {client['industry']}\n"
        f"Goals: {client['goals']}\n"
        f"Tone: {client['tone']}\n"
        f"Constraints: {client['constraints']}\n\n"
        f"Recent approved or proposed tasks:\n{task_text or 'No tasks yet.'}"
    )
    return context, client, campaigns, tasks


def log_action_event(
    user_id: str,
    run_id: str,
    workflow_id: str | None,
    event_type: str,
    title: str,
    payload: dict | list | None = None,
    agent_id: str | None = None,
) -> dict:
    event_id = str(uuid4())
    run_query(
        """
        insert into action_events (id, user_id, run_id, workflow_id, agent_id, event_type, title, payload)
        values (%(id)s, %(user_id)s, %(run_id)s, %(workflow_id)s, %(agent_id)s, %(event_type)s, %(title)s, %(payload)s::jsonb)
        """,
        {
            "id": event_id,
            "user_id": user_id,
            "run_id": run_id,
            "workflow_id": workflow_id,
            "agent_id": agent_id,
            "event_type": event_type,
            "title": title,
            "payload": Jsonb(payload or {}),
        },
    )
    return run_one("select * from action_events where id = %(id)s", {"id": event_id})


def _excerpt(text: str, limit: int = 800) -> str:
    normalized = " ".join(text.split())
    return normalized[:limit]


def _primary_campaign(campaigns: list[dict], channel: str) -> dict | None:
    for campaign in campaigns:
        if campaign["channel"] == channel:
            return campaign
    return campaigns[0] if campaigns else None


def create_task_proposal(
    user_id: str,
    run_id: str,
    workflow_id: str | None,
    client: dict,
    campaign: dict | None,
    title: str,
    description: str,
    discipline: str,
    priority: str,
) -> dict:
    task_id = str(uuid4())
    approval_id = str(uuid4())
    payload = {
        "task_id": task_id,
        "client_id": str(client["id"]),
        "campaign_id": str(campaign["id"]) if campaign else None,
        "title": title,
        "description": description,
        "discipline": discipline,
        "priority": priority,
    }
    run_query(
        """
        insert into agency_tasks
          (id, user_id, client_id, campaign_id, source_run_id, approval_id, title, description, discipline, priority)
        values
          (%(id)s, %(user_id)s, %(client_id)s, %(campaign_id)s, %(source_run_id)s, %(approval_id)s,
           %(title)s, %(description)s, %(discipline)s, %(priority)s)
        """,
        {
            "id": task_id,
            "user_id": user_id,
            "client_id": client["id"],
            "campaign_id": campaign["id"] if campaign else None,
            "source_run_id": run_id,
            "approval_id": approval_id,
            "title": title,
            "description": description,
            "discipline": discipline,
            "priority": priority,
        },
    )
    run_query(
        """
        insert into approvals (id, user_id, run_id, entity_type, entity_id, action_type, title, summary, payload)
        values (%(id)s, %(user_id)s, %(run_id)s, 'agency_task', %(entity_id)s, 'create_task', %(title)s, %(summary)s, %(payload)s::jsonb)
        """,
        {
            "id": approval_id,
            "user_id": user_id,
            "run_id": run_id,
            "entity_id": task_id,
            "title": f"Approve task: {title}",
            "summary": description,
            "payload": Jsonb(payload),
        },
    )
    log_action_event(
        user_id,
        run_id,
        workflow_id,
        "approval_created",
        f"Task proposal queued: {title}",
        {"approval_id": approval_id, "task_id": task_id, "discipline": discipline, "priority": priority},
    )
    return run_one(
        """
        select t.*, a.status as approval_status
        from agency_tasks t
        join approvals a on a.id = t.approval_id
        where t.id = %(id)s
        """,
        {"id": task_id},
    )


def propose_monthly_actions(user_id: str, run_id: str, workflow_id: str | None, prompt: str, notes: str) -> list[dict]:
    ensure_agency_defaults(user_id)
    _, client, campaigns, _ = workspace_context(user_id, prompt)
    if not client:
        return []
    evidence = _excerpt(notes)
    proposals = [
        create_task_proposal(
            user_id,
            run_id,
            workflow_id,
            client,
            None,
            "Validate retrieved evidence against the user request",
            f"Review the retrieved document evidence, identify unsupported claims, and mark any gaps that require additional source material. Evidence: {evidence}",
            "research",
            "high",
        ),
        create_task_proposal(
            user_id,
            run_id,
            workflow_id,
            client,
            None,
            "Convert agent findings into an approved work queue",
            f"Turn the strongest agent recommendations into clear follow-up tasks with owners, priorities, and acceptance criteria. Evidence: {evidence}",
            "operations",
            "high",
        ),
        create_task_proposal(
            user_id,
            run_id,
            workflow_id,
            client,
            None,
            "Prepare a document-grounded report appendix",
            f"Create a concise appendix mapping key recommendations to source documents and citations for the final DOCX output. Evidence: {evidence}",
            "reporting",
            "medium",
        ),
    ]
    log_action_event(
        user_id,
        run_id,
        workflow_id,
        "tasks_proposed",
        "Document-grounded task plan queued for approval",
        {"count": len(proposals), "workspace": client["name"]},
    )
    return proposals


def propose_campaign_update(user_id: str, run_id: str, workflow_id: str, prompt: str, notes: str) -> dict | None:
    _, client, campaigns, _ = workspace_context(user_id, prompt)
    if not client or not campaigns:
        return None
    campaign = campaigns[0]
    approval_id = str(uuid4())
    payload = {
        "campaign_id": str(campaign["id"]),
        "notes_append": f"AI monthly operations recommendation from run {run_id}: {_excerpt(notes, 600)}",
    }
    run_query(
        """
        insert into approvals (id, user_id, run_id, entity_type, entity_id, action_type, title, summary, payload)
        values (%(id)s, %(user_id)s, %(run_id)s, 'campaign', %(entity_id)s, 'update_campaign',
                %(title)s, %(summary)s, %(payload)s::jsonb)
        """,
        {
            "id": approval_id,
            "user_id": user_id,
            "run_id": run_id,
            "entity_id": campaign["id"],
            "title": f"Approve campaign note update: {campaign['name']}",
            "summary": "Append the agent-reviewed monthly operations recommendation to the campaign notes.",
            "payload": Jsonb(payload),
        },
    )
    log_action_event(
        user_id,
        run_id,
        workflow_id,
        "approval_created",
        f"Campaign update queued: {campaign['name']}",
        {"approval_id": approval_id, "campaign_id": str(campaign["id"])},
    )
    return run_one("select * from approvals where id = %(id)s", {"id": approval_id})


def evaluate_run(user_id: str, run_id: str, citations: list[dict], trace: list[dict], output: str, proposed_actions: int) -> dict:
    citation_coverage = min(1.0, len(citations) / 6)
    actionability = min(1.0, proposed_actions / 4)
    lowered = output.lower()
    risk_control = 1.0 if "risk" in lowered or "approval" in lowered or "constraint" in lowered else 0.65
    completeness = min(1.0, (len(output) / 1200) * 0.5 + (len(trace) / 8) * 0.5)
    overall = round((citation_coverage + actionability + risk_control + completeness) / 4, 3)
    evaluation_id = str(uuid4())
    notes = (
        f"Scores are heuristic for the academic MVP: citations={len(citations)}, "
        f"agent_steps={len(trace)}, proposed_actions={proposed_actions}."
    )
    run_query(
        """
        insert into run_evaluations
          (id, user_id, run_id, citation_coverage, actionability, risk_control, completeness, overall_score, notes)
        values
          (%(id)s, %(user_id)s, %(run_id)s, %(citation_coverage)s, %(actionability)s,
           %(risk_control)s, %(completeness)s, %(overall_score)s, %(notes)s)
        on conflict (run_id) do update
        set citation_coverage=excluded.citation_coverage,
            actionability=excluded.actionability,
            risk_control=excluded.risk_control,
            completeness=excluded.completeness,
            overall_score=excluded.overall_score,
            notes=excluded.notes
        """,
        {
            "id": evaluation_id,
            "user_id": user_id,
            "run_id": run_id,
            "citation_coverage": citation_coverage,
            "actionability": actionability,
            "risk_control": risk_control,
            "completeness": completeness,
            "overall_score": overall,
            "notes": notes,
        },
    )
    return run_one("select * from run_evaluations where run_id = %(run_id)s", {"run_id": run_id})


def _complete_run_if_no_pending_approvals(user_id: str, run_id: str | None) -> None:
    if not run_id:
        return
    pending = run_one(
        "select count(*) as count from approvals where run_id = %(run_id)s and user_id = %(user_id)s and status = 'pending'",
        {"run_id": run_id, "user_id": user_id},
    )
    if pending and pending["count"] == 0:
        run_query(
            """
            update runs
            set status = 'completed',
                current_node_id = null,
                current_node_label = 'Completed',
                completed_at = coalesce(completed_at, now())
            where id = %(run_id)s and user_id = %(user_id)s and status = 'waiting_approval'
            """,
            {"run_id": run_id, "user_id": user_id},
        )


def approve_action(user_id: str, approval_id: str, note: str = "") -> dict:
    approval = run_one(
        "select * from approvals where id = %(id)s and user_id = %(user_id)s",
        {"id": approval_id, "user_id": user_id},
    )
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval["status"] != "pending":
        return approval

    if approval["action_type"] == "create_task" and approval["entity_id"]:
        run_query(
            "update agency_tasks set status='approved', updated_at=now() where id=%(id)s and user_id=%(user_id)s",
            {"id": approval["entity_id"], "user_id": user_id},
        )
    elif approval["action_type"] == "update_campaign" and approval["entity_id"]:
        payload = approval["payload"] or {}
        run_query(
            """
            update campaigns
            set notes = trim(notes || E'\n\n' || %(notes_append)s), updated_at = now()
            where id = %(id)s and user_id = %(user_id)s
            """,
            {"id": approval["entity_id"], "user_id": user_id, "notes_append": payload.get("notes_append", "")},
        )

    run_query(
        """
        update approvals
        set status='approved', decision_note=%(note)s, decided_at=now()
        where id=%(id)s and user_id=%(user_id)s
        """,
        {"id": approval_id, "user_id": user_id, "note": note},
    )
    _complete_run_if_no_pending_approvals(user_id, str(approval["run_id"]) if approval.get("run_id") else None)
    return run_one("select * from approvals where id = %(id)s", {"id": approval_id})


def reject_action(user_id: str, approval_id: str, note: str = "") -> dict:
    approval = run_one(
        "select * from approvals where id = %(id)s and user_id = %(user_id)s",
        {"id": approval_id, "user_id": user_id},
    )
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval["action_type"] == "create_task" and approval["entity_id"]:
        run_query(
            "update agency_tasks set status='rejected', updated_at=now() where id=%(id)s and user_id=%(user_id)s",
            {"id": approval["entity_id"], "user_id": user_id},
        )
    run_query(
        """
        update approvals
        set status='rejected', decision_note=%(note)s, decided_at=now()
        where id=%(id)s and user_id=%(user_id)s
        """,
        {"id": approval_id, "user_id": user_id, "note": note},
    )
    _complete_run_if_no_pending_approvals(user_id, str(approval["run_id"]) if approval.get("run_id") else None)
    return run_one("select * from approvals where id = %(id)s", {"id": approval_id})
