from uuid import uuid4
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from psycopg.types.json import Jsonb

from app.core.config import get_settings
from app.core.security import CurrentUser, get_current_user
from app.db.database import run_one, run_query
from app.services.agents import bootstrap_defaults, run_workflow
from app.services.documents import chunk_text, extract_text
from app.services.provider_keys import has_provider_key, save_provider_key
from app.services.reports import build_run_docx
from app.services.vector_store import index_chunks

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


@router.get("/health")
def health() -> dict:
    return {"ok": True, "app": get_settings().app_name}


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"id": user.id, "email": user.email}


@router.post("/bootstrap")
def bootstrap(user: CurrentUser = Depends(get_current_user)) -> dict:
    return bootstrap_defaults(user.id)


@router.get("/provider-key/status")
def provider_key_status(provider: str = "anthropic", user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"provider": provider, "configured": has_provider_key(user.id, provider)}


@router.put("/provider-key")
def provider_key(body: ProviderKeyIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    save_provider_key(user.id, body.provider, body.api_key)
    return {"provider": body.provider, "configured": True}


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
    corpus_dir = Path(__file__).resolve().parents[3] / "data" / "synthetic-corpus"
    if not corpus_dir.exists():
        corpus_dir = Path(__file__).resolve().parents[4] / "data" / "synthetic-corpus"
    if not corpus_dir.exists():
        raise HTTPException(status_code=404, detail="Synthetic corpus directory not found")

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
    return run_query("select id, workflow_id, prompt, output, created_at from runs where user_id = %(user_id)s order by created_at desc", {"user_id": user.id})


@router.get("/runs/{run_id}/docx")
def run_docx(run_id: str, user: CurrentUser = Depends(get_current_user)) -> Response:
    run = run_one("select * from runs where id = %(id)s and user_id = %(user_id)s", {"id": run_id, "user_id": user.id})
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    data = build_run_docx(run)
    return Response(
        data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="modelweave-report-{run_id}.docx"'},
    )
