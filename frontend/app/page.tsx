"use client";

import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  AlertCircle,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  Download,
  Eye,
  FileText,
  GitBranch,
  KeyRound,
  ListChecks,
  Loader2,
  LogOut,
  PauseCircle,
  Save,
  Play,
  RefreshCw,
  Trash2,
  Upload,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { apiDownload, apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type Agent = {
  id: string;
  name: string;
  role: string;
  goal: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  tools: string[];
  status: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  permission_mode: string;
  created_at: string;
  updated_at?: string;
};

type AgentDetail = Agent & {
  runs: RunRow[];
};

type Workflow = {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
};

type AgencyTaskRow = {
  id: string;
  client_id: string | null;
  client_name?: string;
  title: string;
  description: string;
  discipline: string;
  priority: string;
  status: string;
  created_at: string;
};

type ApprovalRow = {
  id: string;
  run_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action_type: string;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
};

type ActionEvent = {
  id: string;
  agent_id?: string | null;
  event_type: string;
  title: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type RunEvaluation = {
  id: string;
  run_id: string;
  citation_coverage: number;
  actionability: number;
  risk_control: number;
  completeness: number;
  overall_score: number;
  notes: string;
};

type DocumentRow = {
  id: string;
  filename: string;
  content_type: string;
  status: string;
  chunk_count: number;
  created_at: string;
};

type DocumentDetail = DocumentRow & {
  content: string;
  chunks: Array<{ id: string; chunk_index: number; content: string; metadata: Record<string, unknown>; created_at: string }>;
};

type RunStatus = "queued" | "pending" | "running" | "waiting_approval" | "completed" | "failed";
type NodeStatus = "waiting" | "running" | "completed" | "approval_required" | "failed";
type Citation = { filename: string; chunk_index: number; score: number; content: string };

type RunRow = {
  id: string;
  workflow_id?: string | null;
  workflow_name?: string;
  agent_id?: string | null;
  agent_name?: string | null;
  trigger_source?: string;
  prompt: string;
  output: string;
  status: RunStatus;
  current_node_id?: string | null;
  current_node_label?: string | null;
  error_message?: string | null;
  overall_score?: number | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};

type RunResult = {
  id: string;
  workflow_id?: string | null;
  workflow_name?: string;
  agent_id?: string | null;
  agent_name?: string | null;
  trigger_source?: string;
  workflow_nodes?: Node[];
  workflow_edges?: Edge[];
  prompt: string;
  status: RunStatus;
  current_node_id?: string | null;
  current_node_label?: string | null;
  error_message?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  output: string;
  citations: Citation[];
  trace: Array<{ agent_name: string; output: string }>;
  events: ActionEvent[];
  approvals: ApprovalRow[];
  evaluation: RunEvaluation | null;
};

const tabs = [
  ["setup", KeyRound, "Setup"],
  ["documents", Database, "Database"],
  ["agents", Bot, "Agents"],
  ["workflow", GitBranch, "Workflows"],
  ["run", Play, "Runs"],
  ["approvals", ClipboardCheck, "Approvals"],
  ["tasks", ListChecks, "Tasks"],
  ["reports", FileText, "Reports"],
] as const;

const terminalStatuses: RunStatus[] = ["completed", "waiting_approval", "failed"];
const hiddenLegacyAgentNames = new Set(["PPC Strategist", "SEO Analyst"]);

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "N/A";
}

function statusTone(status?: string | null) {
  if (!status) return "neutral";
  const normalized = status.toLowerCase();
  if (["completed", "approved", "active", "indexed", "api key configured"].includes(normalized)) return "success";
  if (["running"].includes(normalized)) return "running";
  if (["queued", "pending", "pending_approval", "waiting_approval", "draft", "manual", "scheduled"].includes(normalized)) return "warning";
  if (["failed", "rejected", "api key missing"].includes(normalized)) return "danger";
  return "neutral";
}

function plainTextPreview(markdown: string, maxLength = 180) {
  const text = (markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, " ")
    .replace(/\|/g, " / ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text || "No content yet.";
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function reportTitle(markdown: string) {
  const heading = markdown.match(/^#\s+(.+)$/m) || markdown.match(/^##\s+(.+)$/m);
  return heading ? plainTextPreview(heading[1], 90) : plainTextPreview(markdown, 90);
}

function runTitle(row: Pick<RunRow, "workflow_name" | "workflow_id" | "agent_name" | "agent_id">) {
  return row.workflow_name || row.agent_name || row.workflow_id || row.agent_id || "Run";
}

function StatusBadge({ status }: { status?: string | null }) {
  return <span className={`badge badge-${statusTone(status)}`}>{status || "unknown"}</span>;
}

function MarkdownContent({ content, compact = false }: { content: string; compact?: boolean }) {
  return (
    <div className={`markdown ${compact ? "markdown-compact" : ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content || "No content yet."}
      </ReactMarkdown>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="auth-page">Loading...</div>;
  if (!session) return <AuthPanel />;
  return <Workspace session={session} />;
}

function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("");
    const emailRedirectTo = typeof window === "undefined" ? undefined : window.location.origin;
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo },
          });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup") setMessage("Registration created. Check your email to confirm your account.");
  }

  return (
    <main className="auth-page">
      <section className="auth-box">
        <div className="auth-brand">
          <span className="brand-mark"><GitBranch size={20} /></span>
          <div>
            <h1>ModelWeave</h1>
            <p>Document-grounded agent workflow platform.</p>
          </div>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">Workspace control plane</p>
          <h2>Run specialist agents with retrieval, approvals, and DOCX reporting.</h2>
          <p className="muted">Use synthetic documents to demonstrate service-oriented LLM workflows without real company data.</p>
        </div>
        <div className="auth-tabs">
          <button className={mode === "signin" ? "primary" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button className={mode === "signup" ? "primary" : ""} onClick={() => setMode("signup")}>Register</button>
        </div>
        <label className="stack small">Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="stack small">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="primary" onClick={submit}>{mode === "signin" ? "Sign in" : "Create account"}</button>
        {message && <p className="notice-card small">{message}</p>}
      </section>
    </main>
  );
}

function Workspace({ session }: { session: Session }) {
  const [active, setActive] = useState<(typeof tabs)[number][0]>("setup");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [tasks, setTasks] = useState<AgencyTaskRow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [notice, setNotice] = useState("");

  async function refresh() {
    const [keyStatus, agentRows, workflowRows, documentRows, taskRows, approvalRows, runRows] = await Promise.all([
      apiFetch<{ configured: boolean }>("/provider-key/status"),
      apiFetch<Agent[]>("/agents"),
      apiFetch<Workflow[]>("/workflows"),
      apiFetch<DocumentRow[]>("/documents"),
      apiFetch<AgencyTaskRow[]>("/tasks"),
      apiFetch<ApprovalRow[]>("/approvals"),
      apiFetch<RunRow[]>("/runs"),
    ]);
    setProviderConfigured(keyStatus.configured);
    setAgents(agentRows);
    setWorkflows(workflowRows);
    setDocuments(documentRows);
    setTasks(taskRows);
    setApprovals(approvalRows);
    setRuns(runRows);
  }

  async function bootstrap() {
    await apiFetch("/bootstrap", { method: "POST", body: "{}" });
    await refresh();
    setNotice("Default document agents and the Document Operations Review workflow are ready.");
  }

  useEffect(() => {
    refresh().catch((error) => setNotice(error.message));
  }, []);

  const activeTitle = tabs.find(([id]) => id === active)?.[2] ?? "Workspace";
  const pendingApprovals = approvals.filter((approval) => approval.status === "pending").length;
  const completedRuns = runs.filter((run) => run.status === "completed").length;
  const visibleAgentCount = agents.filter((agent) => !hiddenLegacyAgentNames.has(agent.name)).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <span className="brand-mark"><GitBranch size={20} /></span>
          <div>
            <div className="brand">ModelWeave</div>
            <p className="small muted">Document Agents</p>
          </div>
        </div>
        <div className="workspace-card">
          <p className="eyebrow">Account</p>
          <p className="workspace-email">{session.user.email}</p>
          <div className="row">
            <StatusBadge status={providerConfigured ? "API key configured" : "API key missing"} />
          </div>
        </div>
        <nav className="nav">
          {tabs.map(([id, Icon, label]) => (
            <button key={id} className={active === id ? "active" : ""} onClick={() => setActive(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-metrics">
          <span><strong>{visibleAgentCount}</strong><br />agents</span>
          <span><strong>{documents.length}</strong><br />docs</span>
          <span><strong>{pendingApprovals}</strong><br />pending</span>
          <span><strong>{completedRuns}</strong><br />runs</span>
        </div>
        <button className="ghost signout-button" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Sign out</button>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <p className="eyebrow">ModelWeave control plane</p>
            <h1>{activeTitle}</h1>
            <p className="muted">Run approval-gated agents over a document database with audit trails and DOCX outputs.</p>
          </div>
          <div className="topbar-actions">
            <button className="primary" onClick={bootstrap}><Sparkles size={16} /> Create defaults</button>
            <button onClick={() => refresh()}><RefreshCw size={16} /> Refresh</button>
          </div>
        </div>
        {notice && <p className="notice-card small">{notice}</p>}
        {active === "setup" && <SetupPanel bootstrap={bootstrap} setNotice={setNotice} setProviderConfigured={setProviderConfigured} />}
        {active === "documents" && <DocumentsPanel documents={documents} refresh={refresh} setNotice={setNotice} />}
        {active === "agents" && <AgentsPanel agents={agents} refresh={refresh} setNotice={setNotice} />}
        {active === "workflow" && <WorkflowPanel agents={agents} workflows={workflows} refresh={refresh} setNotice={setNotice} />}
        {active === "run" && <RunPanel workflows={workflows} runs={runs} refresh={refresh} setNotice={setNotice} />}
        {active === "approvals" && <ApprovalsPanel approvals={approvals} refresh={refresh} setNotice={setNotice} />}
        {active === "tasks" && <TasksPanel tasks={tasks} />}
        {active === "reports" && <ReportsPanel runs={runs} />}
      </main>
    </div>
  );
}

function SetupPanel({ bootstrap, setNotice, setProviderConfigured }: {
  bootstrap: () => Promise<void>;
  setNotice: (message: string) => void;
  setProviderConfigured: (configured: boolean) => void;
}) {
  const [key, setKey] = useState("");

  async function saveKey() {
    await apiFetch("/provider-key", { method: "PUT", body: JSON.stringify({ provider: "anthropic", api_key: key }) });
    setKey("");
    setProviderConfigured(true);
    setNotice("Anthropic API key saved for your account.");
  }

  return (
    <section className="grid two">
      <div className="panel stack">
        <h2>Bring your own model key</h2>
        <p className="muted">Each user supplies an Anthropic API key. The backend stores it encrypted and uses it only for that user's agent runs.</p>
        <input type="password" placeholder="sk-ant-..." value={key} onChange={(event) => setKey(event.target.value)} />
        <button className="primary" disabled={!key} onClick={saveKey}><KeyRound size={16} /> Save key</button>
      </div>
      <div className="panel stack">
        <h2>Default document agents</h2>
        <p className="muted">Create reusable document agents and a default workflow for retrieval, task proposals, approvals, evaluation, and DOCX export.</p>
        <button className="secondary" onClick={bootstrap}><GitBranch size={16} /> Create defaults</button>
      </div>
    </section>
  );
}

function DocumentsPanel({ documents, refresh, setNotice }: {
  documents: DocumentRow[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<DocumentDetail | null>(null);
  const [edit, setEdit] = useState({ filename: "", content_type: "", status: "indexed" });

  async function upload() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await apiFetch("/documents", { method: "POST", body: form });
    setFile(null);
    await refresh();
    setNotice("Document indexed.");
  }

  async function seed() {
    const result = await apiFetch<{ indexed_documents: number }>("/documents/seed-synthetic", { method: "POST", body: "{}" });
    await refresh();
    setNotice(`Synthetic corpus loaded: ${result.indexed_documents} new documents.`);
  }

  async function openDocument(documentId: string) {
    const detail = await apiFetch<DocumentDetail>(`/documents/${documentId}`);
    setSelected(detail);
    setEdit({ filename: detail.filename, content_type: detail.content_type, status: detail.status });
  }

  async function saveDocument() {
    if (!selected) return;
    const updated = await apiFetch<DocumentRow>(`/documents/${selected.id}`, {
      method: "PUT",
      body: JSON.stringify(edit),
    });
    await refresh();
    await openDocument(updated.id);
    setNotice("Document metadata updated.");
  }

  async function removeDocument(documentId: string) {
    const confirmed = window.confirm("Delete this document from Postgres and Qdrant? This cannot be undone.");
    if (!confirmed) return;
    await apiFetch(`/documents/${documentId}`, { method: "DELETE" });
    if (selected?.id === documentId) setSelected(null);
    await refresh();
    setNotice("Document deleted from database and vector index.");
  }

  return (
    <section className="grid">
      <div className="panel row">
        <input type="file" accept=".pdf,.txt,.md,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <button className="primary" disabled={!file} onClick={upload}><Upload size={16} /> Upload</button>
        <button onClick={seed}><Database size={16} /> Load synthetic document corpus</button>
      </div>
      <div className="grid two">
        <div className="panel">
          <h2>Database documents</h2>
          <table className="table">
            <thead><tr><th>Name</th><th>Type</th><th>Chunks</th><th>Created</th><th>Manage</th></tr></thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td><strong>{doc.filename}</strong><br /><StatusBadge status={doc.status} /></td>
                  <td><span className="file-pill">{doc.content_type || "file"}</span></td>
                  <td>{doc.chunk_count}</td>
                  <td>{formatDate(doc.created_at)}</td>
                  <td>
                    <div className="row">
                      <button onClick={() => openDocument(doc.id)}><Eye size={16} /> Open</button>
                      <button onClick={() => removeDocument(doc.id)}><Trash2 size={16} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel stack">
          <h2>{selected ? "Database record" : "Open a database document"}</h2>
          {selected ? (
            <>
              <label className="stack small">Filename<input value={edit.filename} onChange={(event) => setEdit({ ...edit, filename: event.target.value })} /></label>
              <label className="stack small">Content type<input value={edit.content_type} onChange={(event) => setEdit({ ...edit, content_type: event.target.value })} /></label>
              <label className="stack small">Status<input value={edit.status} onChange={(event) => setEdit({ ...edit, status: event.target.value })} /></label>
              <button className="primary" disabled={!edit.filename} onClick={saveDocument}><Save size={16} /> Save metadata</button>
              <p className="small muted">{selected.chunk_count} indexed chunks. This view shows reconstructed indexed text, not the original uploaded file.</p>
              <div className="document-preview"><MarkdownContent content={selected.content || "No indexed content available."} /></div>
            </>
          ) : (
            <p className="muted">Use Open to read indexed document content, rename a document, update metadata, or delete it from the database and vector index.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function AgentsPanel({ agents, refresh, setNotice }: {
  agents: Agent[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const visibleAgents = agents.filter((agent) => !hiddenLegacyAgentNames.has(agent.name));
  const emptyAgent = {
    instructions: "",
    name: "",
    description: "",
    model: "claude-sonnet-4-6",
    trigger_type: "manual",
    schedule: "",
    status: "draft",
  };
  const [draft, setDraft] = useState(emptyAgent);
  const [selected, setSelected] = useState<AgentDetail | null>(null);
  const [runPrompt, setRunPrompt] = useState("");

  async function createAgent() {
    const name = draft.name || agentNameFromInstructions(draft.instructions);
    const payload = {
      name,
      role: "Document-grounded agent",
      goal: draft.instructions,
      description: draft.description || draft.instructions,
      system_prompt: draft.instructions,
      model: draft.model,
      temperature: 0.2,
      tools: ["rag_retrieve", "task_proposal", "docx_report"],
      trigger_type: draft.trigger_type,
      trigger_config: {
        schedule: draft.trigger_type === "scheduled" ? draft.schedule || "daily" : "",
        prompt: draft.instructions,
      },
      status: draft.status,
      permission_mode: "approval_required",
    };
    const created = await apiFetch<Agent>("/agents", { method: "POST", body: JSON.stringify(payload) });
    setDraft(emptyAgent);
    await refresh();
    await openAgent(created.id);
    setNotice("Agent draft created.");
  }

  async function openAgent(agentId: string) {
    const detail = await apiFetch<AgentDetail>(`/agents/${agentId}`);
    setSelected(detail);
    setRunPrompt(String(detail.trigger_config?.prompt || `Review the document database as ${detail.name} and propose next steps.`));
  }

  async function runAgent() {
    if (!selected) return;
    await apiFetch<RunResult>(`/agents/${selected.id}/run`, { method: "POST", body: JSON.stringify({ prompt: runPrompt }) });
    await refresh();
    await openAgent(selected.id);
    setNotice("Agent run queued and background execution started.");
  }

  async function runScheduled() {
    const result = await apiFetch<{ created_runs: number }>("/agents/scheduler/run-due", { method: "POST", body: "{}" });
    await refresh();
    setNotice(result.created_runs ? `${result.created_runs} scheduled run(s) started.` : "No scheduled agents are due right now.");
  }

  return (
    <section className="grid two">
      <div className="panel stack">
        <div className="section-heading">
          <div>
            <h2>Create agent</h2>
            <p className="muted">Describe what the agent should do. ModelWeave turns it into a reusable document-grounded worker.</p>
          </div>
          <button onClick={runScheduled}><Clock3 size={16} /> Run due schedules</button>
        </div>
        <textarea
          className="tall"
          placeholder="Example: Review uploaded policy documents, find operational risks, cite evidence, and propose tasks that require approval before becoming final."
          value={draft.instructions}
          onChange={(event) => setDraft({ ...draft, instructions: event.target.value })}
        />
        <input placeholder="Optional name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <textarea placeholder="Optional description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        <input placeholder="Model" value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />
        <div className="grid two compact-grid">
          <label className="stack small">Trigger
            <select value={draft.trigger_type} onChange={(event) => setDraft({ ...draft, trigger_type: event.target.value })}>
              <option value="manual">Manual</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </label>
          <label className="stack small">Status
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </label>
        </div>
        {draft.trigger_type === "scheduled" && (
          <input placeholder="Schedule text, for example: daily, hourly, weekly" value={draft.schedule} onChange={(event) => setDraft({ ...draft, schedule: event.target.value })} />
        )}
        <button className="primary" disabled={!draft.instructions} onClick={createAgent}><Bot size={16} /> Create draft agent</button>
      </div>
      <div className="panel stack">
        <h2>Reusable agents</h2>
        <div className="agent-card-grid">
          {visibleAgents.map((agent) => (
            <button key={agent.id} className={`agent-card ${selected?.id === agent.id ? "selected" : ""}`} onClick={() => openAgent(agent.id)}>
              <span className="row spread"><strong>{agent.name}</strong><StatusBadge status={agent.status} /></span>
              <span className="small muted">{plainTextPreview(agent.description || agent.goal, 110)}</span>
              <span className="row"><StatusBadge status={agent.trigger_type} /><span className="small muted">{agent.model}</span></span>
            </button>
          ))}
        </div>
        {visibleAgents.length === 0 && <EmptyState title="No agents yet" body="Create a draft agent from a plain-English instruction." />}
        <div className="divider" />
        <h2>{selected ? selected.name : "Agent details"}</h2>
        {selected ? (
          <div className="stack">
            <div className="grid two compact-grid">
              <div className="mini-card"><p className="eyebrow">Trigger</p><StatusBadge status={selected.trigger_type} /></div>
              <div className="mini-card"><p className="eyebrow">Permission</p><StatusBadge status={selected.permission_mode} /></div>
            </div>
            <div className="mini-card">
              <p className="eyebrow">System instructions</p>
              <MarkdownContent content={selected.system_prompt || selected.goal} compact />
            </div>
            <div className="mini-card">
              <p className="eyebrow">Tools</p>
              <div className="row">{selected.tools.map((tool) => <span key={tool} className="badge badge-neutral">{tool}</span>)}</div>
            </div>
            <textarea value={runPrompt} onChange={(event) => setRunPrompt(event.target.value)} />
            <button className="primary" disabled={!runPrompt} onClick={runAgent}><Play size={16} /> Run now</button>
            <h3>Recent runs</h3>
            {selected.runs.length ? (
              <table className="table">
                <thead><tr><th>Prompt</th><th>Status</th><th>Trigger</th><th>Created</th></tr></thead>
                <tbody>
                  {selected.runs.map((run) => (
                    <tr key={run.id}>
                      <td>{plainTextPreview(run.prompt, 120)}</td>
                      <td><StatusBadge status={run.status} /></td>
                      <td>{run.trigger_source || "manual"}</td>
                      <td>{formatDate(run.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="small muted">No runs for this agent yet.</p>}
          </div>
        ) : <EmptyState title="No agent selected" body="Choose an agent to inspect its configuration and run history." />}
      </div>
    </section>
  );
}

function agentNameFromInstructions(instructions: string) {
  const words = instructions.replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 4);
  return words.length ? `${words.map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(" ")} Agent` : "Document Agent";
}

function WorkflowPanel({ agents, workflows, refresh, setNotice }: {
  agents: Agent[];
  workflows: Workflow[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const defaultWorkflow = workflows.find((workflow) => workflow.name === "Document Operations Review") ?? workflows[0];
  const selected = workflows.find((workflow) => workflow.id === selectedId) ?? defaultWorkflow;
  const [name, setName] = useState(selected?.name ?? "Custom Workflow");
  const [description, setDescription] = useState(selected?.description ?? "");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const visibleAgents = agents.filter((agent) => !hiddenLegacyAgentNames.has(agent.name));

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setName(selected.name);
      setDescription(selected.description);
      setNodes(selected.nodes || []);
      setEdges(selected.edges || []);
    }
  }, [selected?.id]);

  const nodeAgentIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);
  const systemNodes = [
    ["retrieve", "Retrieve database context"],
    ["create_task", "Queue approval-gated tasks"],
    ["approval", "Human approval gate"],
    ["evaluate", "Evaluate run"],
    ["export_docx", "DOCX report available"],
  ] as const;

  function addAgent(agent: Agent) {
    if (nodeAgentIds.has(agent.id)) return;
    setNodes((current) => [
      ...current,
      {
        id: agent.id,
        type: "default",
        position: { x: 80 + current.length * 180, y: 100 + (current.length % 2) * 120 },
        data: { label: agent.name },
      },
    ]);
  }

  function addSystemNode(kind: string, label: string) {
    setNodes((current) => [
      ...current,
      {
        id: `${kind}-${Date.now()}`,
        type: "default",
        position: { x: 80 + current.length * 180, y: 100 + (current.length % 2) * 120 },
        data: { label, kind },
      },
    ]);
  }

  function onConnect(connection: Connection) {
    setEdges((current) => addEdge({ ...connection, animated: true }, current));
  }

  async function save() {
    const payload = { name, description, nodes, edges };
    if (selectedId) await apiFetch(`/workflows/${selectedId}`, { method: "PUT", body: JSON.stringify(payload) });
    else await apiFetch("/workflows", { method: "POST", body: JSON.stringify(payload) });
    await refresh();
    setNotice("Workflow saved.");
  }

  return (
    <section className="grid">
      <div className="panel row">
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
        </select>
        <button onClick={() => { setSelectedId(""); setName("Custom Workflow"); setDescription(""); setNodes([]); setEdges([]); }}>New workflow</button>
        <button className="primary" onClick={save}>Save workflow</button>
      </div>
      <div className="grid two">
        <div className="panel stack">
          <h2>Workflow details</h2>
          <input value={name} onChange={(event) => setName(event.target.value)} />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          <h3>Available agents</h3>
          {visibleAgents.map((agent) => (
            <button key={agent.id} onClick={() => addAgent(agent)} disabled={nodeAgentIds.has(agent.id)}>
              <Bot size={16} /> {agent.name}
            </button>
          ))}
          <h3>Execution nodes</h3>
          {systemNodes.map(([kind, label]) => (
            <button key={kind} onClick={() => addSystemNode(kind, label)}>
              <GitBranch size={16} /> {label}
            </button>
          ))}
        </div>
        <div className="flow-wrap">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </section>
  );
}

function RunPanel({ workflows, runs, refresh, setNotice }: {
  workflows: Workflow[];
  runs: RunRow[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const [workflowId, setWorkflowId] = useState("");
  const [prompt, setPrompt] = useState("Review the current document database, identify grounded recommendations, queue approval-gated tasks, and produce a DOCX-ready summary.");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<RunResult | null>(null);
  const defaultWorkflow = workflows.find((workflow) => workflow.name === "Document Operations Review") ?? workflows[0];
  const selectedWorkflow = workflows.find((workflow) => workflow.id === workflowId) ?? defaultWorkflow;
  const activeRun = Boolean(result && !terminalStatuses.includes(result.status));
  const displayedRun = selectedHistory ?? result;

  useEffect(() => {
    if (!workflowId && defaultWorkflow) setWorkflowId(defaultWorkflow.id);
  }, [defaultWorkflow, workflowId]);

  useEffect(() => {
    if (!result || terminalStatuses.includes(result.status)) return;
    const timer = window.setInterval(async () => {
      try {
        const next = await apiFetch<RunResult>(`/runs/${result.id}`);
        setResult(next);
        if (selectedHistory?.id === next.id) setSelectedHistory(next);
        if (terminalStatuses.includes(next.status)) {
          await refresh();
          setNotice(next.status === "failed" ? "Workflow run failed." : "Workflow run finished.");
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Unable to refresh run status.");
      }
    }, 1300);
    return () => window.clearInterval(timer);
  }, [result?.id, result?.status, refresh, setNotice]);

  async function run() {
    setRunning(true);
    setResult(null);
    setSelectedHistory(null);
    try {
      const output = await apiFetch<RunResult>("/runs", { method: "POST", body: JSON.stringify({ workflow_id: workflowId, prompt }) });
      setResult(output);
      setNotice("Workflow run started.");
    } finally {
      setRunning(false);
    }
  }

  async function inspect(runRow: RunRow) {
    const detail = await apiFetch<RunResult>(`/runs/${runRow.id}`);
    setSelectedHistory(detail);
  }

  return (
    <section className="grid">
      <div className="grid two">
        <div className="panel stack">
          <h2>Manual workflow run</h2>
          <p className="muted">Runs start immediately, then pause only if an approval gate is reached.</p>
          <select value={workflowId} onChange={(event) => setWorkflowId(event.target.value)}>
            {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
          </select>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          <button className="primary" disabled={!workflowId || running || activeRun} onClick={run}>
            {activeRun ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
            {activeRun ? "Agents running" : running ? "Starting..." : "Run workflow"}
          </button>
        </div>
        <div className="panel">
          <h2>Run history</h2>
          {runs.length ? (
            <table className="table">
              <thead><tr><th>Run</th><th>Prompt</th><th>Trigger</th><th>Status</th><th>Inspect</th></tr></thead>
              <tbody>
                {runs.map((runRow) => (
                  <tr key={runRow.id}>
                    <td><strong>{runTitle(runRow)}</strong><br /><span className="small muted">{formatDate(runRow.created_at)}</span></td>
                    <td>{plainTextPreview(runRow.prompt, 110)}</td>
                    <td><StatusBadge status={runRow.trigger_source || "manual"} /></td>
                    <td><StatusBadge status={runRow.status} /></td>
                    <td><button onClick={() => inspect(runRow)}><BarChart3 size={16} /> Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState title="No runs yet" body="Run a workflow or agent to create execution history." />}
        </div>
      </div>
      {displayedRun && (
        <div className="grid">
          <div className="panel stack">
            <div className="run-header">
              <div>
                <h2>{displayedRun.workflow_name ?? displayedRun.agent_name ?? selectedWorkflow?.name ?? "Run"}</h2>
                <p className="muted">{displayedRun.current_node_label || plainTextPreview(displayedRun.prompt, 120)}</p>
              </div>
              <div className="row">
                <StatusBadge status={displayedRun.trigger_source || "manual"} />
                <StatusBadge status={displayedRun.status} />
              </div>
            </div>
            <RunProgressFlow result={displayedRun} workflow={selectedWorkflow} />
            {displayedRun.error_message && <p className="error-text"><AlertCircle size={16} /> {displayedRun.error_message}</p>}
          </div>
          <div className="grid two">
          <div className="panel stack">
            <h2>Final output</h2>
            {displayedRun.evaluation && <ScoreCard evaluation={displayedRun.evaluation} />}
            <div className="report-preview"><MarkdownContent content={displayedRun.output} /></div>
            <button onClick={() => downloadRun(displayedRun.id)}><Download size={16} /> Download DOCX</button>
          </div>
          <div className="panel stack">
            <h2>Execution timeline</h2>
            <EventTimeline events={displayedRun.events} />
            <h2>Approval-gated actions</h2>
            {displayedRun.approvals.length ? displayedRun.approvals.map((approval) => (
              <div key={approval.id} className="mini-card">
                <div className="row spread"><strong>{approval.title}</strong><StatusBadge status={approval.status} /></div>
                <MarkdownContent content={approval.summary} compact />
              </div>
            )) : <p className="small muted">No approval-gated actions yet.</p>}
            <h2>Agent trace and sources</h2>
            {displayedRun.trace.map((item, index) => <details key={index} className="trace-item"><summary>{item.agent_name}</summary><MarkdownContent content={item.output} /></details>)}
            <CitationList citations={displayedRun.citations} />
          </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ScoreCard({ evaluation }: { evaluation: RunEvaluation }) {
  return (
    <div className="score-grid">
      <span><strong>{evaluation.overall_score.toFixed(2)}</strong><br />Overall</span>
      <span><strong>{evaluation.citation_coverage.toFixed(2)}</strong><br />Citations</span>
      <span><strong>{evaluation.actionability.toFixed(2)}</strong><br />Actions</span>
      <span><strong>{evaluation.risk_control.toFixed(2)}</strong><br />Risk</span>
    </div>
  );
}

function eventNodeId(event: ActionEvent) {
  const value = event.payload?.node_id;
  return typeof value === "string" ? value : undefined;
}

function nodeStatusMap(result: RunResult, nodes: Node[]) {
  const statuses = new Map<string, NodeStatus>();
  nodes.forEach((node) => statuses.set(node.id, result.status === "completed" && result.events.length === 0 ? "completed" : "waiting"));
  result.events.forEach((event) => {
    const nodeId = eventNodeId(event);
    if (!nodeId) return;
    if (event.event_type === "node_started") statuses.set(nodeId, "running");
    if (event.event_type === "node_completed") statuses.set(nodeId, "completed");
    if (event.event_type === "node_failed") statuses.set(nodeId, "failed");
    if (event.event_type === "approval_required") statuses.set(nodeId, "approval_required");
  });
  if (result.current_node_id && result.status === "running") statuses.set(result.current_node_id, "running");
  if (result.current_node_id && result.status === "waiting_approval") statuses.set(result.current_node_id, "approval_required");
  if (result.status === "failed" && result.current_node_id) statuses.set(result.current_node_id, "failed");
  return statuses;
}

function statusPrefix(status: NodeStatus) {
  if (status === "completed") return "OK";
  if (status === "running") return "RUN";
  if (status === "approval_required") return "WAIT";
  if (status === "failed") return "!";
  return "--";
}

function RunProgressFlow({ result, workflow }: { result: RunResult; workflow?: Workflow }) {
  const baseNodes = result.workflow_nodes?.length ? result.workflow_nodes : workflow?.nodes ?? [];
  const baseEdges = result.workflow_edges?.length ? result.workflow_edges : workflow?.edges ?? [];
  const statuses = nodeStatusMap(result, baseNodes);
  const nodes = baseNodes.map((node) => {
    const status = statuses.get(node.id) ?? "waiting";
    const label = typeof node.data?.label === "string" ? node.data.label : node.id;
    return {
      ...node,
      draggable: false,
      selectable: false,
      className: `run-node run-node-${status}`,
      data: { ...node.data, label: `${statusPrefix(status)} ${label}` },
    };
  });
  const edges = baseEdges.map((edge) => ({
    ...edge,
    animated: edge.target === result.current_node_id || edge.source === result.current_node_id,
    className: edge.target === result.current_node_id || edge.source === result.current_node_id ? "run-edge-active" : "",
  }));

  if (!nodes.length) return <EmptyState title="No workflow graph" body="This run does not have saved workflow nodes to render." />;

  return (
    <div className="flow-wrap progress-flow">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}>
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function EventTimeline({ events }: { events: ActionEvent[] }) {
  if (!events.length) return <p className="small muted">No execution events have been recorded yet.</p>;
  return (
    <div className="timeline-list">
      {events.map((event) => (
        <div key={event.id} className={`timeline-item timeline-${statusTone(event.event_type.includes("failed") ? "failed" : event.event_type.includes("approval") ? "pending" : event.event_type.includes("started") ? "running" : "completed")}`}>
          <span className="timeline-icon">
            {event.event_type.includes("failed") ? <AlertCircle size={15} /> : event.event_type.includes("started") ? <Loader2 size={15} className="spin" /> : event.event_type.includes("approval") ? <PauseCircle size={15} /> : <CheckCircle2 size={15} />}
          </span>
          <span><strong>{event.title}</strong><br /><span className="small muted">{event.event_type} - {formatDate(event.created_at)}</span></span>
        </div>
      ))}
    </div>
  );
}

function CitationList({ citations }: { citations: Citation[] }) {
  if (!citations.length) return <p className="small muted">No citations returned yet.</p>;
  return (
    <div className="citation-list">
      {citations.map((citation, index) => (
        <details key={`${citation.filename}-${citation.chunk_index}-${index}`} className="citation-item">
          <summary>{citation.filename} - chunk {citation.chunk_index} - score {citation.score.toFixed(3)}</summary>
          <MarkdownContent content={citation.content} compact />
        </details>
      ))}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <Clock3 size={18} />
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function ApprovalsPanel({ approvals, refresh, setNotice }: {
  approvals: ApprovalRow[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  async function decide(id: string, action: "approve" | "reject") {
    await apiFetch(`/approvals/${id}/${action}`, { method: "POST", body: JSON.stringify({ note: `${action === "approve" ? "approved" : "rejected"} from dashboard` }) });
    await refresh();
    setNotice(action === "approve" ? "Approval applied." : "Approval rejected.");
  }

  return (
    <section className="grid">
      <div className="section-heading">
        <div>
          <h2>Human approval queue</h2>
          <p className="muted">Persistent task changes stay pending until a human decision is recorded.</p>
        </div>
        <StatusBadge status={`${approvals.filter((approval) => approval.status === "pending").length} pending`} />
      </div>
      {approvals.length === 0 ? <EmptyState title="No approvals yet" body="Run a workflow or agent to queue approval-gated task proposals." /> : (
        <div className="approval-grid">
          {approvals.map((approval) => (
            <article key={approval.id} className="approval-card">
              <div className="approval-card-header">
                <div>
                  <h3>{approval.title}</h3>
                  <p className="small muted">{formatDate(approval.created_at)} - {approval.action_type} - {approval.entity_type}</p>
                </div>
                <StatusBadge status={approval.status} />
              </div>
              <MarkdownContent content={approval.summary || "No summary provided."} compact />
              {approval.status === "pending" ? (
                <div className="row">
                  <button className="primary" onClick={() => decide(approval.id, "approve")}><CheckCircle2 size={16} /> Approve</button>
                  <button onClick={() => decide(approval.id, "reject")}><XCircle size={16} /> Reject</button>
                </div>
              ) : (
                <p className="small muted">Decision recorded.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TasksPanel({ tasks }: { tasks: AgencyTaskRow[] }) {
  return (
    <section className="panel">
      <h2>Approved task queue</h2>
      <p className="muted">Tasks are durable follow-up work items created by agents after approval decisions.</p>
      <table className="table">
        <thead><tr><th>Task</th><th>Workspace</th><th>Discipline</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td><strong>{task.title}</strong><MarkdownContent content={task.description} compact /></td>
              <td>{task.client_name ?? "Document workspace"}</td>
              <td>{task.discipline}</td>
              <td>{task.priority}</td>
              <td><StatusBadge status={task.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ReportsPanel({ runs }: { runs: RunRow[] }) {
  const [selectedRun, setSelectedRun] = useState<RunResult | null>(null);

  async function preview(runId: string) {
    setSelectedRun(await apiFetch<RunResult>(`/runs/${runId}`));
  }

  return (
    <section className="grid two">
      <div className="panel">
        <h2>Run history</h2>
        <table className="table">
          <thead><tr><th>Report</th><th>Status</th><th>Score</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td><strong>{reportTitle(run.output)}</strong><br /><span className="small muted">{runTitle(run)} - {plainTextPreview(run.prompt, 110)}</span></td>
                <td><StatusBadge status={run.status} /></td>
                <td>{run.overall_score ?? "N/A"}</td>
                <td>{formatDate(run.created_at)}</td>
                <td><div className="row"><button onClick={() => preview(run.id)}><Eye size={16} /> Preview</button><button className="primary" onClick={() => downloadRun(run.id)}><Download size={16} /> DOCX</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel stack">
        <h2>{selectedRun ? reportTitle(selectedRun.output) : "Report preview"}</h2>
        {selectedRun ? (
          <>
            <div className="row spread"><StatusBadge status={selectedRun.status} />{selectedRun.evaluation && <span className="badge badge-success">Score {selectedRun.evaluation.overall_score.toFixed(2)}</span>}</div>
            <div className="report-preview"><MarkdownContent content={selectedRun.output} /></div>
            <button className="primary" onClick={() => downloadRun(selectedRun.id)}><Download size={16} /> Download DOCX</button>
          </>
        ) : <EmptyState title="No report selected" body="Select Preview to read a formatted report before downloading the DOCX." />}
      </div>
    </section>
  );
}

async function downloadRun(runId: string) {
  const blob = await apiDownload(`/runs/${runId}/docx`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `modelweave-report-${runId}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}
