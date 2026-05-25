create table if not exists clients (
  id uuid primary key,
  user_id text not null,
  name text not null,
  industry text not null default '',
  goals text not null default '',
  tone text not null default '',
  constraints text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key,
  user_id text not null,
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  channel text not null default 'mixed',
  status text not null default 'active',
  objective text not null default '',
  monthly_budget numeric(12, 2),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agency_tasks (
  id uuid primary key,
  user_id text not null,
  client_id uuid references clients(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  source_run_id uuid references runs(id) on delete set null,
  approval_id uuid,
  title text not null,
  description text not null default '',
  discipline text not null default 'operations',
  priority text not null default 'medium',
  status text not null default 'pending_approval',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key,
  user_id text not null,
  run_id uuid references runs(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action_type text not null,
  title text not null,
  summary text not null default '',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  decision_note text not null default '',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists action_events (
  id uuid primary key,
  user_id text not null,
  run_id uuid references runs(id) on delete cascade,
  workflow_id uuid references workflows(id) on delete set null,
  agent_id uuid,
  event_type text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists run_evaluations (
  id uuid primary key,
  user_id text not null,
  run_id uuid not null references runs(id) on delete cascade,
  citation_coverage double precision not null default 0,
  actionability double precision not null default 0,
  risk_control double precision not null default 0,
  completeness double precision not null default 0,
  overall_score double precision not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (run_id)
);

create index if not exists idx_clients_user_id on clients(user_id);
create index if not exists idx_campaigns_user_id on campaigns(user_id);
create index if not exists idx_campaigns_client_id on campaigns(client_id);
create index if not exists idx_agency_tasks_user_id on agency_tasks(user_id);
create index if not exists idx_agency_tasks_client_id on agency_tasks(client_id);
create index if not exists idx_approvals_user_id on approvals(user_id);
create index if not exists idx_approvals_status on approvals(status);
create index if not exists idx_action_events_run_id on action_events(run_id);
create index if not exists idx_run_evaluations_run_id on run_evaluations(run_id);
