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
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  GitBranch,
  KeyRound,
  ListChecks,
  LogOut,
  Play,
  RefreshCw,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiDownload, apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type Agent = {
  id: string;
  name: string;
  role: string;
  goal: string;
  model: string;
  temperature: number;
  tools: string[];
};

type Workflow = {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
};

type ClientRow = {
  id: string;
  name: string;
  industry: string;
  goals: string;
  tone: string;
  constraints: string;
  status: string;
  created_at: string;
};

type CampaignRow = {
  id: string;
  client_id: string;
  client_name?: string;
  name: string;
  channel: string;
  status: string;
  objective: string;
  monthly_budget: number | null;
  notes: string;
  created_at: string;
};

type AgencyTaskRow = {
  id: string;
  client_id: string | null;
  client_name?: string;
  campaign_id: string | null;
  campaign_name?: string;
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
  chunk_count: number;
  created_at: string;
};

type RunRow = {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  prompt: string;
  output: string;
  overall_score?: number | null;
  created_at: string;
};

type RunResult = {
  id: string;
  output: string;
  citations: Array<{ filename: string; chunk_index: number; score: number; content: string }>;
  trace: Array<{ agent_name: string; output: string }>;
  events: ActionEvent[];
  approvals: ApprovalRow[];
  evaluation: RunEvaluation | null;
};

const tabs = [
  ["setup", KeyRound, "Setup"],
  ["clients", Users, "Clients"],
  ["campaigns", BriefcaseBusiness, "Campaigns"],
  ["documents", Database, "Documents"],
  ["agents", Bot, "Agents"],
  ["workflow", GitBranch, "Workflow"],
  ["run", Play, "Run"],
  ["approvals", ClipboardCheck, "Approvals"],
  ["tasks", ListChecks, "Tasks"],
  ["agency-runs", BarChart3, "Agency Runs"],
  ["reports", FileText, "Reports"],
] as const;

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
      <section className="auth-box panel stack">
        <div>
          <h1>ModelWeave</h1>
          <p className="muted">AI workforce platform for PPC and SEO agency operations.</p>
        </div>
        <div className="row">
          <button className={mode === "signin" ? "primary" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button className={mode === "signup" ? "primary" : ""} onClick={() => setMode("signup")}>Register</button>
        </div>
        <label className="stack small">Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="stack small">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="primary" onClick={submit}>{mode === "signin" ? "Sign in" : "Create account"}</button>
        {message && <p className="small muted">{message}</p>}
      </section>
    </main>
  );
}

function Workspace({ session }: { session: Session }) {
  const [active, setActive] = useState<(typeof tabs)[number][0]>("setup");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [tasks, setTasks] = useState<AgencyTaskRow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [notice, setNotice] = useState("");

  async function refresh() {
    const [keyStatus, clientRows, campaignRows, agentRows, workflowRows, documentRows, taskRows, approvalRows, runRows] = await Promise.all([
      apiFetch<{ configured: boolean }>("/provider-key/status"),
      apiFetch<ClientRow[]>("/clients"),
      apiFetch<CampaignRow[]>("/campaigns"),
      apiFetch<Agent[]>("/agents"),
      apiFetch<Workflow[]>("/workflows"),
      apiFetch<DocumentRow[]>("/documents"),
      apiFetch<AgencyTaskRow[]>("/tasks"),
      apiFetch<ApprovalRow[]>("/approvals"),
      apiFetch<RunRow[]>("/runs"),
    ]);
    setProviderConfigured(keyStatus.configured);
    setClients(clientRows);
    setCampaigns(campaignRows);
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
    setNotice("Default PPC/SEO agency workforce, Harbor Homeware workspace, and monthly operations workflow are ready.");
  }

  useEffect(() => {
    refresh().catch((error) => setNotice(error.message));
  }, []);

  const activeTitle = tabs.find(([id]) => id === active)?.[2] ?? "Workspace";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><GitBranch size={22} /> ModelWeave</div>
        <p className="small muted">Signed in as<br />{session.user.email}</p>
        <nav className="nav">
          {tabs.map(([id, Icon, label]) => (
            <button key={id} className={active === id ? "active" : ""} onClick={() => setActive(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <button onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Sign out</button>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <h1>{activeTitle}</h1>
            <p className="muted">Run an approval-gated AI workforce for PPC and SEO agency delivery.</p>
          </div>
          <div className="row">
            <span className="badge">{providerConfigured ? "API key configured" : "API key missing"}</span>
            <button onClick={() => refresh()}><RefreshCw size={16} /> Refresh</button>
          </div>
        </div>
        {notice && <p className="panel small">{notice}</p>}
        {active === "setup" && <SetupPanel bootstrap={bootstrap} setNotice={setNotice} setProviderConfigured={setProviderConfigured} />}
        {active === "clients" && <ClientsPanel clients={clients} refresh={refresh} setNotice={setNotice} />}
        {active === "campaigns" && <CampaignsPanel clients={clients} campaigns={campaigns} refresh={refresh} setNotice={setNotice} />}
        {active === "documents" && <DocumentsPanel documents={documents} refresh={refresh} setNotice={setNotice} />}
        {active === "agents" && <AgentsPanel agents={agents} refresh={refresh} setNotice={setNotice} />}
        {active === "workflow" && <WorkflowPanel agents={agents} workflows={workflows} refresh={refresh} setNotice={setNotice} />}
        {active === "run" && <RunPanel workflows={workflows} refresh={refresh} setNotice={setNotice} />}
        {active === "approvals" && <ApprovalsPanel approvals={approvals} refresh={refresh} setNotice={setNotice} />}
        {active === "tasks" && <TasksPanel tasks={tasks} />}
        {active === "agency-runs" && <AgencyRunsPanel runs={runs} />}
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
        <h2>PPC/SEO agency workforce</h2>
        <p className="muted">Create Harbor Homeware, agency campaigns, specialist agents, and the Monthly PPC/SEO Operations Review workflow.</p>
        <button className="secondary" onClick={bootstrap}><GitBranch size={16} /> Create agency defaults</button>
      </div>
    </section>
  );
}

function ClientsPanel({ clients, refresh, setNotice }: {
  clients: ClientRow[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const empty = {
    name: "",
    industry: "",
    goals: "",
    tone: "Clear, practical, and client-ready.",
    constraints: "Use synthetic data only.",
    status: "active",
  };
  const [draft, setDraft] = useState(empty);

  async function createClient() {
    await apiFetch("/clients", { method: "POST", body: JSON.stringify(draft) });
    setDraft(empty);
    await refresh();
    setNotice("Client workspace created.");
  }

  return (
    <section className="grid two">
      <div className="panel stack">
        <h2>Create client workspace</h2>
        <input placeholder="Client name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <input placeholder="Industry" value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value })} />
        <textarea placeholder="Goals" value={draft.goals} onChange={(event) => setDraft({ ...draft, goals: event.target.value })} />
        <textarea placeholder="Constraints" value={draft.constraints} onChange={(event) => setDraft({ ...draft, constraints: event.target.value })} />
        <button className="primary" disabled={!draft.name} onClick={createClient}><Users size={16} /> Create client</button>
      </div>
      <div className="panel">
        <h2>Clients</h2>
        <table className="table">
          <thead><tr><th>Name</th><th>Industry</th><th>Goals</th><th>Status</th></tr></thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td><strong>{client.name}</strong><br /><span className="small muted">{client.tone}</span></td>
                <td>{client.industry}</td>
                <td>{client.goals}</td>
                <td><span className="badge">{client.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CampaignsPanel({ clients, campaigns, refresh, setNotice }: {
  clients: ClientRow[];
  campaigns: CampaignRow[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const [draft, setDraft] = useState({
    client_id: "",
    name: "",
    channel: "ppc",
    status: "active",
    objective: "",
    monthly_budget: "",
    notes: "",
  });

  useEffect(() => {
    if (!draft.client_id && clients[0]) setDraft((current) => ({ ...current, client_id: clients[0].id }));
  }, [clients, draft.client_id]);

  async function createCampaign() {
    await apiFetch("/campaigns", {
      method: "POST",
      body: JSON.stringify({ ...draft, monthly_budget: draft.monthly_budget ? Number(draft.monthly_budget) : null }),
    });
    setDraft({ client_id: clients[0]?.id ?? "", name: "", channel: "ppc", status: "active", objective: "", monthly_budget: "", notes: "" });
    await refresh();
    setNotice("Campaign created.");
  }

  return (
    <section className="grid two">
      <div className="panel stack">
        <h2>Create campaign</h2>
        <select value={draft.client_id} onChange={(event) => setDraft({ ...draft, client_id: event.target.value })}>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
        <input placeholder="Campaign name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <select value={draft.channel} onChange={(event) => setDraft({ ...draft, channel: event.target.value })}>
          <option value="ppc">PPC</option>
          <option value="seo">SEO</option>
          <option value="content">Content</option>
          <option value="mixed">Mixed</option>
        </select>
        <textarea placeholder="Objective" value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} />
        <input placeholder="Monthly budget" value={draft.monthly_budget} onChange={(event) => setDraft({ ...draft, monthly_budget: event.target.value })} />
        <textarea placeholder="Notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        <button className="primary" disabled={!draft.client_id || !draft.name} onClick={createCampaign}><BriefcaseBusiness size={16} /> Create campaign</button>
      </div>
      <div className="panel">
        <h2>Campaigns</h2>
        <table className="table">
          <thead><tr><th>Name</th><th>Client</th><th>Channel</th><th>Objective</th><th>Budget</th></tr></thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td><strong>{campaign.name}</strong><br /><span className="small muted">{campaign.status}</span></td>
                <td>{campaign.client_name}</td>
                <td><span className="badge">{campaign.channel}</span></td>
                <td>{campaign.objective}</td>
                <td>{campaign.monthly_budget ?? "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

  return (
    <section className="grid">
      <div className="panel row">
        <input type="file" accept=".pdf,.txt,.md,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <button className="primary" disabled={!file} onClick={upload}><Upload size={16} /> Upload</button>
        <button onClick={seed}><Database size={16} /> Load synthetic PPC/SEO corpus</button>
      </div>
      <div className="panel">
        <h2>Indexed documents</h2>
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Chunks</th><th>Created</th></tr></thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}><td>{doc.filename}</td><td>{doc.content_type}</td><td>{doc.chunk_count}</td><td>{new Date(doc.created_at).toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AgentsPanel({ agents, refresh, setNotice }: {
  agents: Agent[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const emptyAgent = { name: "", role: "", goal: "", model: "claude-sonnet-4-6", temperature: 0.2, tools: ["rag_retrieve"] };
  const [draft, setDraft] = useState(emptyAgent);

  async function createAgent() {
    await apiFetch("/agents", { method: "POST", body: JSON.stringify(draft) });
    setDraft(emptyAgent);
    await refresh();
    setNotice("Agent created.");
  }

  return (
    <section className="grid two">
      <div className="panel stack">
        <h2>Create agent</h2>
        <input placeholder="Name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <input placeholder="Role" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
        <textarea placeholder="Goal" value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} />
        <input placeholder="Model" value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />
        <button className="primary" disabled={!draft.name || !draft.role} onClick={createAgent}>Create</button>
      </div>
      <div className="panel">
        <h2>Agents</h2>
        <table className="table">
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td><strong>{agent.name}</strong><br /><span className="small muted">{agent.role}</span></td>
                <td>{agent.goal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WorkflowPanel({ agents, workflows, refresh, setNotice }: {
  agents: Agent[];
  workflows: Workflow[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const selected = workflows.find((workflow) => workflow.id === selectedId) ?? workflows[0];
  const [name, setName] = useState(selected?.name ?? "Custom Workflow");
  const [description, setDescription] = useState(selected?.description ?? "");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

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
    ["retrieve", "Retrieve agency knowledge"],
    ["create_task", "Queue approval-gated tasks"],
    ["update_campaign", "Queue campaign update"],
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
          {agents.map((agent) => (
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

function RunPanel({ workflows, refresh, setNotice }: {
  workflows: Workflow[];
  refresh: () => Promise<void>;
  setNotice: (message: string) => void;
}) {
  const [workflowId, setWorkflowId] = useState("");
  const [prompt, setPrompt] = useState("Prepare next month's PPC and SEO execution plan for Harbor Homeware.");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => {
    if (!workflowId && workflows[0]) setWorkflowId(workflows[0].id);
  }, [workflows, workflowId]);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const output = await apiFetch<RunResult>("/runs", { method: "POST", body: JSON.stringify({ workflow_id: workflowId, prompt }) });
      setResult(output);
      await refresh();
      setNotice("Workflow run completed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="grid">
      <div className="panel stack">
        <select value={workflowId} onChange={(event) => setWorkflowId(event.target.value)}>
          {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
        </select>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        <button className="primary" disabled={!workflowId || running} onClick={run}><Play size={16} /> {running ? "Running..." : "Run agents"}</button>
      </div>
      {result && (
        <div className="grid two">
          <div className="panel stack">
            <h2>Final output</h2>
            {result.evaluation && <ScoreCard evaluation={result.evaluation} />}
            <div className="output">{result.output}</div>
            <button onClick={() => downloadRun(result.id)}><Download size={16} /> Download DOCX</button>
          </div>
          <div className="panel stack">
            <h2>Execution timeline</h2>
            {result.events.map((event) => (
              <p key={event.id} className="small"><strong>{event.event_type}</strong>: {event.title}</p>
            ))}
            <h2>Approval-gated actions</h2>
            {result.approvals.map((approval) => (
              <p key={approval.id} className="small"><strong>{approval.status}</strong> - {approval.title}</p>
            ))}
            <h2>Agent trace and sources</h2>
            {result.trace.map((item, index) => <details key={index}><summary>{item.agent_name}</summary><p className="output">{item.output}</p></details>)}
            {result.citations.map((citation, index) => (
              <p key={index} className="small"><strong>{citation.filename}</strong> chunk {citation.chunk_index} score {citation.score.toFixed(3)}</p>
            ))}
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
    <section className="panel">
      <h2>Human approval queue</h2>
      <table className="table">
        <thead><tr><th>Action</th><th>Type</th><th>Status</th><th>Summary</th><th>Decision</th></tr></thead>
        <tbody>
          {approvals.map((approval) => (
            <tr key={approval.id}>
              <td><strong>{approval.title}</strong><br /><span className="small muted">{new Date(approval.created_at).toLocaleString()}</span></td>
              <td>{approval.action_type}</td>
              <td><span className="badge">{approval.status}</span></td>
              <td>{approval.summary}</td>
              <td>
                {approval.status === "pending" ? (
                  <div className="row">
                    <button className="primary" onClick={() => decide(approval.id, "approve")}><CheckCircle2 size={16} /> Approve</button>
                    <button onClick={() => decide(approval.id, "reject")}><XCircle size={16} /> Reject</button>
                  </div>
                ) : (
                  <span className="small muted">Decision recorded</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TasksPanel({ tasks }: { tasks: AgencyTaskRow[] }) {
  return (
    <section className="panel">
      <h2>Agency tasks</h2>
      <table className="table">
        <thead><tr><th>Task</th><th>Client</th><th>Campaign</th><th>Discipline</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td><strong>{task.title}</strong><br /><span className="small muted">{task.description}</span></td>
              <td>{task.client_name ?? "N/A"}</td>
              <td>{task.campaign_name ?? "N/A"}</td>
              <td>{task.discipline}</td>
              <td>{task.priority}</td>
              <td><span className="badge">{task.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AgencyRunsPanel({ runs }: { runs: RunRow[] }) {
  const [selectedRun, setSelectedRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<ActionEvent[]>([]);
  const [evaluation, setEvaluation] = useState<RunEvaluation | null>(null);

  async function inspect(run: RunRow) {
    setSelectedRun(run);
    const [eventRows, evalRow] = await Promise.all([
      apiFetch<ActionEvent[]>(`/runs/${run.id}/events`),
      apiFetch<RunEvaluation>(`/runs/${run.id}/evaluation`).catch(() => null),
    ]);
    setEvents(eventRows);
    setEvaluation(evalRow);
  }

  return (
    <section className="grid two">
      <div className="panel">
        <h2>Agency runs</h2>
        <table className="table">
          <thead><tr><th>Workflow</th><th>Prompt</th><th>Score</th><th>Inspect</th></tr></thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{run.workflow_name ?? run.workflow_id}</td>
                <td>{run.prompt.slice(0, 140)}</td>
                <td>{run.overall_score ?? "N/A"}</td>
                <td><button onClick={() => inspect(run)}><BarChart3 size={16} /> Timeline</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel stack">
        <h2>{selectedRun ? "Run timeline" : "Select a run"}</h2>
        {evaluation && <ScoreCard evaluation={evaluation} />}
        {events.map((event) => (
          <p key={event.id} className="small"><strong>{event.event_type}</strong>: {event.title}</p>
        ))}
      </div>
    </section>
  );
}

function ReportsPanel({ runs }: { runs: RunRow[] }) {
  return (
    <section className="panel">
      <h2>Run history</h2>
      <table className="table">
        <thead><tr><th>Prompt</th><th>Output</th><th>Score</th><th>Created</th><th>Export</th></tr></thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>{run.prompt.slice(0, 120)}</td>
              <td>{run.output.slice(0, 180)}</td>
              <td>{run.overall_score ?? "N/A"}</td>
              <td>{new Date(run.created_at).toLocaleString()}</td>
              <td><button onClick={() => downloadRun(run.id)}><Download size={16} /> DOCX</button></td>
            </tr>
          ))}
        </tbody>
      </table>
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
