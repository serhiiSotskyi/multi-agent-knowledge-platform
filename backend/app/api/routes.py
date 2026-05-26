from uuid import uuid4
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from psycopg.types.json import Jsonb

from app.core.config import get_settings
from app.core.security import CurrentUser, get_current_user
from app.db.database import run_one, run_query
from app.services.agency import approve_action, ensure_agency_defaults, reject_action
from app.services.agents import bootstrap_defaults, run_workflow
from app.services.documents import chunk_text, extract_text
from app.services.provider_keys import has_provider_key, save_provider_key
from app.services.reports import build_run_docx
from app.services.vector_store import delete_document_vectors, index_chunks, update_document_vector_filename

router = APIRouter()


class ProviderKeyIn(BaseModel):
    provider: str = "anthropic"
    api_key: str = Field(min_length=20)


class AgentIn(BaseModel):
    name: str
    role: str
    goal: str = ""
    model: str | None = None
    temperature: float = 0.2
    tools: list[str] = Field(default_factory=lambda: ["rag_retrieve"])


class WorkflowIn(BaseModel):
    name: str
    description: str = ""
    nodes: list[dict] = Field(default_factory=list)
    edges: list[dict] = Field(default_factory=list)


class RunIn(BaseModel):
    workflow_id: str
    prompt: str = Field(min_length=3)


class ClientIn(BaseModel):
    name: str
    industry: str = ""
    goals: str = ""
    tone: str = ""
    constraints: str = ""
    status: str = "active"


class CampaignIn(BaseModel):
    client_id: str
    name: str
    channel: str = "mixed"
    status: str = "active"
    objective: str = ""
    monthly_budget: float | None = None
    notes: str = ""


class TaskIn(BaseModel):
    client_id: str | None = None
    campaign_id: str | None = None
    title: str
    description: str = ""
    discipline: str = "operations"
    priority: str = "medium"
    status: str = "approved"


class ApprovalIn(BaseModel):
    entity_type: str
    entity_id: str | None = None
    action_type: str
    title: str
    summary: str = ""
    payload: dict = Field(default_factory=dict)


class DecisionIn(BaseModel):
    note: str = ""


class DocumentUpdateIn(BaseModel):
    filename: str
    content_type: str = ""
    status: str = "indexed"


def synthetic_corpus_dir() -> Path:
    current = Path(__file__).resolve()
    for parent in current.parents:
        for candidate in (
            parent / "data" / "synthetic-corpus",
            parent / "backend" / "data" / "synthetic-corpus",
        ):
            if candidate.exists():
                return candidate
    raise HTTPException(status_code=404, detail="Synthetic corpus directory not found")


@router.get("/health")
def health() -> dict:
    return {"ok": True, "app": get_settings().app_name}


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"id": user.id, "email": user.email}


@router.post("/bootstrap")
def bootstrap(user: CurrentUser = Depends(get_current_user)) -> dict:
    return bootstrap_defaults(user.id)


@router.post("/agency/bootstrap")
def bootstrap_agency(user: CurrentUser = Depends(get_current_user)) -> dict:
    return ensure_agency_defaults(user.id)


@router.get("/provider-key/status")
def provider_key_status(provider: str = "anthropic", user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"provider": provider, "configured": has_provider_key(user.id, provider)}


@router.put("/provider-key")
def provider_key(body: ProviderKeyIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    save_provider_key(user.id, body.provider, body.api_key)
    return {"provider": body.provider, "configured": True}


@router.get("/clients")
def list_clients(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run_query("select * from clients where user_id = %(user_id)s order by created_at", {"user_id": user.id})


@router.post("/clients")
def create_client(body: ClientIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    client_id = str(uuid4())
    run_query(
        """
        insert into clients (id, user_id, name, industry, goals, tone, constraints, status)
        values (%(id)s, %(user_id)s, %(name)s, %(industry)s, %(goals)s, %(tone)s, %(constraints)s, %(status)s)
        """,
        {"id": client_id, "user_id": user.id, **body.model_dump()},
    )
    return run_one("select * from clients where id = %(id)s", {"id": client_id})


@router.put("/clients/{client_id}")
def update_client(client_id: str, body: ClientIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    row = run_one("select id from clients where id = %(id)s and user_id = %(user_id)s", {"id": client_id, "user_id": user.id})
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")
    run_query(
        """
        update clients
        set name=%(name)s, industry=%(industry)s, goals=%(goals)s, tone=%(tone)s,
            constraints=%(constraints)s, status=%(status)s, updated_at=now()
        where id=%(id)s and user_id=%(user_id)s
        """,
        {"id": client_id, "user_id": user.id, **body.model_dump()},
    )
    return run_one("select * from clients where id = %(id)s", {"id": client_id})


@router.get("/campaigns")
def list_campaigns(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run_query(
        """
        select c.*, cl.name as client_name
        from campaigns c
        join clients cl on cl.id = c.client_id
        where c.user_id = %(user_id)s
        order by c.created_at
        """,
        {"user_id": user.id},
    )


@router.post("/campaigns")
def create_campaign(body: CampaignIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    client = run_one("select id from clients where id = %(id)s and user_id = %(user_id)s", {"id": body.client_id, "user_id": user.id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    campaign_id = str(uuid4())
    run_query(
        """
        insert into campaigns (id, user_id, client_id, name, channel, status, objective, monthly_budget, notes)
        values (%(id)s, %(user_id)s, %(client_id)s, %(name)s, %(channel)s, %(status)s, %(objective)s, %(monthly_budget)s, %(notes)s)
        """,
        {"id": campaign_id, "user_id": user.id, **body.model_dump()},
    )
    return run_one("select * from campaigns where id = %(id)s", {"id": campaign_id})


@router.put("/campaigns/{campaign_id}")
def update_campaign(campaign_id: str, body: CampaignIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    row = run_one("select id from campaigns where id = %(id)s and user_id = %(user_id)s", {"id": campaign_id, "user_id": user.id})
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    run_query(
        """
        update campaigns
        set client_id=%(client_id)s, name=%(name)s, channel=%(channel)s, status=%(status)s,
            objective=%(objective)s, monthly_budget=%(monthly_budget)s, notes=%(notes)s, updated_at=now()
        where id=%(id)s and user_id=%(user_id)s
        """,
        {"id": campaign_id, "user_id": user.id, **body.model_dump()},
    )
    return run_one("select * from campaigns where id = %(id)s", {"id": campaign_id})


@router.get("/tasks")
def list_tasks(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run_query(
        """
        select t.*, cl.name as client_name, c.name as campaign_name
        from agency_tasks t
        left join clients cl on cl.id = t.client_id
        left join campaigns c on c.id = t.campaign_id
        where t.user_id = %(user_id)s
        order by t.created_at desc
        """,
        {"user_id": user.id},
    )


@router.post("/tasks")
def create_task(body: TaskIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    task_id = str(uuid4())
    run_query(
        """
        insert into agency_tasks (id, user_id, client_id, campaign_id, title, description, discipline, priority, status)
        values (%(id)s, %(user_id)s, %(client_id)s, %(campaign_id)s, %(title)s, %(description)s, %(discipline)s, %(priority)s, %(status)s)
        """,
        {"id": task_id, "user_id": user.id, **body.model_dump()},
    )
    return run_one("select * from agency_tasks where id = %(id)s", {"id": task_id})


@router.put("/tasks/{task_id}")
def update_task(task_id: str, body: TaskIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    row = run_one("select id from agency_tasks where id = %(id)s and user_id = %(user_id)s", {"id": task_id, "user_id": user.id})
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    run_query(
        """
        update agency_tasks
        set client_id=%(client_id)s, campaign_id=%(campaign_id)s, title=%(title)s, description=%(description)s,
            discipline=%(discipline)s, priority=%(priority)s, status=%(status)s, updated_at=now()
        where id=%(id)s and user_id=%(user_id)s
        """,
        {"id": task_id, "user_id": user.id, **body.model_dump()},
    )
    return run_one("select * from agency_tasks where id = %(id)s", {"id": task_id})


@router.get("/approvals")
def list_approvals(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run_query("select * from approvals where user_id = %(user_id)s order by created_at desc", {"user_id": user.id})


@router.post("/approvals")
def create_approval(body: ApprovalIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    approval_id = str(uuid4())
    run_query(
        """
        insert into approvals (id, user_id, entity_type, entity_id, action_type, title, summary, payload)
        values (%(id)s, %(user_id)s, %(entity_type)s, %(entity_id)s, %(action_type)s, %(title)s, %(summary)s, %(payload)s::jsonb)
        """,
        {"id": approval_id, "user_id": user.id, **body.model_dump(), "payload": Jsonb(body.payload)},
    )
    return run_one("select * from approvals where id = %(id)s", {"id": approval_id})


@router.post("/approvals/{approval_id}/approve")
def approve_approval(approval_id: str, body: DecisionIn = DecisionIn(), user: CurrentUser = Depends(get_current_user)) -> dict:
    return approve_action(user.id, approval_id, body.note)


@router.post("/approvals/{approval_id}/reject")
def reject_approval(approval_id: str, body: DecisionIn = DecisionIn(), user: CurrentUser = Depends(get_current_user)) -> dict:
    return reject_action(user.id, approval_id, body.note)


@router.get("/agents")
def list_agents(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run_query("select * from agents where user_id = %(user_id)s order by created_at", {"user_id": user.id})


@router.post("/agents")
def create_agent(body: AgentIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    agent_id = str(uuid4())
    run_query(
        """
        insert into agents (id, user_id, name, role, goal, model, temperature, tools)
        values (%(id)s, %(user_id)s, %(name)s, %(role)s, %(goal)s, %(model)s, %(temperature)s, %(tools)s::jsonb)
        """,
        {
            "id": agent_id,
            "user_id": user.id,
            "name": body.name,
            "role": body.role,
            "goal": body.goal,
            "model": body.model or get_settings().anthropic_model,
            "temperature": body.temperature,
            "tools": Jsonb(body.tools),
        },
    )
    return run_one("select * from agents where id = %(id)s", {"id": agent_id})


@router.put("/agents/{agent_id}")
def update_agent(agent_id: str, body: AgentIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    row = run_one("select id from agents where id = %(id)s and user_id = %(user_id)s", {"id": agent_id, "user_id": user.id})
    if not row:
        raise HTTPException(status_code=404, detail="Agent not found")
    run_query(
        """
        update agents
        set name=%(name)s, role=%(role)s, goal=%(goal)s, model=%(model)s,
            temperature=%(temperature)s, tools=%(tools)s::jsonb, updated_at=now()
        where id=%(id)s and user_id=%(user_id)s
        """,
        {
            "id": agent_id,
            "user_id": user.id,
            "name": body.name,
            "role": body.role,
            "goal": body.goal,
            "model": body.model or get_settings().anthropic_model,
            "temperature": body.temperature,
            "tools": Jsonb(body.tools),
        },
    )
    return run_one("select * from agents where id = %(id)s", {"id": agent_id})


@router.get("/workflows")
def list_workflows(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run_query("select * from workflows where user_id = %(user_id)s order by created_at", {"user_id": user.id})


@router.post("/workflows")
def create_workflow(body: WorkflowIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    workflow_id = str(uuid4())
    run_query(
        """
        insert into workflows (id, user_id, name, description, nodes, edges)
        values (%(id)s, %(user_id)s, %(name)s, %(description)s, %(nodes)s::jsonb, %(edges)s::jsonb)
        """,
        {
            "id": workflow_id,
            "user_id": user.id,
            "name": body.name,
            "description": body.description,
            "nodes": Jsonb(body.nodes),
            "edges": Jsonb(body.edges),
        },
    )
    return run_one("select * from workflows where id = %(id)s", {"id": workflow_id})


@router.put("/workflows/{workflow_id}")
def update_workflow(workflow_id: str, body: WorkflowIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    row = run_one("select id from workflows where id = %(id)s and user_id = %(user_id)s", {"id": workflow_id, "user_id": user.id})
    if not row:
        raise HTTPException(status_code=404, detail="Workflow not found")
    run_query(
        """
        update workflows
        set name=%(name)s, description=%(description)s, nodes=%(nodes)s::jsonb,
            edges=%(edges)s::jsonb, updated_at=now()
        where id=%(id)s and user_id=%(user_id)s
        """,
        {
            "id": workflow_id,
            "user_id": user.id,
            "name": body.name,
            "description": body.description,
            "nodes": Jsonb(body.nodes),
            "edges": Jsonb(body.edges),
        },
    )
    return run_one("select * from workflows where id = %(id)s", {"id": workflow_id})


@router.get("/documents")
def list_documents(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run_query("select * from documents where user_id = %(user_id)s order by created_at desc", {"user_id": user.id})


@router.get("/documents/{document_id}")
def get_document(document_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    document = run_one(
        "select * from documents where id = %(id)s and user_id = %(user_id)s",
        {"id": document_id, "user_id": user.id},
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    chunks = run_query(
        """
        select id, chunk_index, content, metadata, created_at
        from document_chunks
        where document_id = %(document_id)s and user_id = %(user_id)s
        order by chunk_index
        """,
        {"document_id": document_id, "user_id": user.id},
    )
    document["chunks"] = chunks
    document["content"] = "\n\n".join(chunk["content"] for chunk in chunks)
    return document


@router.put("/documents/{document_id}")
def update_document(document_id: str, body: DocumentUpdateIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    document = run_one(
        "select * from documents where id = %(id)s and user_id = %(user_id)s",
        {"id": document_id, "user_id": user.id},
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    update_document_vector_filename(user.id, document_id, body.filename)
    run_query(
        """
        update documents
        set filename=%(filename)s, content_type=%(content_type)s, status=%(status)s
        where id=%(id)s and user_id=%(user_id)s
        """,
        {
            "id": document_id,
            "user_id": user.id,
            "filename": body.filename,
            "content_type": body.content_type or document["content_type"],
            "status": body.status,
        },
    )
    run_query(
        """
        update document_chunks
        set metadata = jsonb_set(metadata, '{filename}', to_jsonb(%(filename)s::text), true)
        where document_id = %(document_id)s and user_id = %(user_id)s
        """,
        {"document_id": document_id, "user_id": user.id, "filename": body.filename},
    )
    return run_one("select * from documents where id = %(id)s", {"id": document_id})


@router.delete("/documents/{document_id}")
def delete_document(document_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    document = run_one(
        "select id, filename from documents where id = %(id)s and user_id = %(user_id)s",
        {"id": document_id, "user_id": user.id},
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    delete_document_vectors(user.id, document_id)
    run_query("delete from documents where id = %(id)s and user_id = %(user_id)s", {"id": document_id, "user_id": user.id})
    return {"ok": True, "id": document_id, "filename": document["filename"]}


@router.post("/documents")
async def upload_document(file: UploadFile = File(...), user: CurrentUser = Depends(get_current_user)) -> dict:
    text, ext = await extract_text(file)
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No readable text found in uploaded document")
    document_id = str(uuid4())
    index_chunks(user.id, document_id, file.filename or "upload", chunks)
    run_query(
        """
        insert into documents (id, user_id, filename, content_type, status, chunk_count)
        values (%(id)s, %(user_id)s, %(filename)s, %(content_type)s, 'indexed', %(chunk_count)s)
        """,
        {
            "id": document_id,
            "user_id": user.id,
            "filename": file.filename or "upload",
            "content_type": ext,
            "chunk_count": len(chunks),
        },
    )
    for index, chunk in enumerate(chunks):
        run_query(
            """
            insert into document_chunks (id, document_id, user_id, chunk_index, content, metadata)
            values (%(id)s, %(document_id)s, %(user_id)s, %(chunk_index)s, %(content)s, %(metadata)s::jsonb)
            """,
            {
                "id": str(uuid4()),
                "document_id": document_id,
                "user_id": user.id,
                "chunk_index": index,
                "content": chunk,
                "metadata": Jsonb({"filename": file.filename, "content_type": ext}),
            },
        )
    return {"id": document_id, "filename": file.filename, "chunk_count": len(chunks)}


@router.post("/documents/seed-synthetic")
def seed_synthetic_documents(user: CurrentUser = Depends(get_current_user)) -> dict:
    corpus_dir = synthetic_corpus_dir()

    indexed = 0
    for path in sorted(corpus_dir.glob("*.md")):
        already = run_one(
            "select id from documents where user_id = %(user_id)s and filename = %(filename)s",
            {"user_id": user.id, "filename": path.name},
        )
        if already:
            continue
        text = path.read_text(encoding="utf-8")
        chunks = chunk_text(text)
        document_id = str(uuid4())
        index_chunks(user.id, document_id, path.name, chunks)
        run_query(
            """
            insert into documents (id, user_id, filename, content_type, status, chunk_count)
            values (%(id)s, %(user_id)s, %(filename)s, '.md', 'indexed', %(chunk_count)s)
            """,
            {
                "id": document_id,
                "user_id": user.id,
                "filename": path.name,
                "chunk_count": len(chunks),
            },
        )
        for index, chunk in enumerate(chunks):
            run_query(
                """
                insert into document_chunks (id, document_id, user_id, chunk_index, content, metadata)
                values (%(id)s, %(document_id)s, %(user_id)s, %(chunk_index)s, %(content)s, %(metadata)s::jsonb)
                """,
                {
                    "id": str(uuid4()),
                    "document_id": document_id,
                    "user_id": user.id,
                    "chunk_index": index,
                    "content": chunk,
                    "metadata": Jsonb({"filename": path.name, "content_type": ".md", "synthetic": True}),
                },
            )
        indexed += 1
    return {"indexed_documents": indexed}


@router.post("/runs")
async def run_agents(body: RunIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    return await run_workflow(user.id, body.workflow_id, body.prompt)


@router.get("/runs")
def list_runs(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run_query(
        """
        select r.id, r.workflow_id, w.name as workflow_name, r.prompt, r.output, r.created_at,
               e.overall_score
        from runs r
        left join workflows w on w.id = r.workflow_id
        left join run_evaluations e on e.run_id = r.id
        where r.user_id = %(user_id)s
        order by r.created_at desc
        """,
        {"user_id": user.id},
    )


@router.get("/runs/{run_id}/events")
def run_events(run_id: str, user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    run = run_one("select id from runs where id = %(id)s and user_id = %(user_id)s", {"id": run_id, "user_id": user.id})
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run_query("select * from action_events where run_id = %(run_id)s order by created_at", {"run_id": run_id})


@router.get("/runs/{run_id}/evaluation")
def run_evaluation(run_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    evaluation = run_one(
        """
        select e.*
        from run_evaluations e
        join runs r on r.id = e.run_id
        where e.run_id = %(run_id)s and r.user_id = %(user_id)s
        """,
        {"run_id": run_id, "user_id": user.id},
    )
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation


@router.get("/runs/{run_id}/docx")
def run_docx(run_id: str, user: CurrentUser = Depends(get_current_user)) -> Response:
    run = run_one("select * from runs where id = %(id)s and user_id = %(user_id)s", {"id": run_id, "user_id": user.id})
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run["evaluation"] = run_one("select * from run_evaluations where run_id = %(run_id)s", {"run_id": run_id})
    run["approvals"] = run_query("select * from approvals where run_id = %(run_id)s order by created_at", {"run_id": run_id})
    run["events"] = run_query("select * from action_events where run_id = %(run_id)s order by created_at", {"run_id": run_id})
    data = build_run_docx(run)
    return Response(
        data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="modelweave-report-{run_id}.docx"'},
    )
