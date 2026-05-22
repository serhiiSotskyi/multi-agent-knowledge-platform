create table if not exists provider_keys (
  id uuid primary key,
  user_id text not null,
  provider text not null,
  encrypted_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists agents (
  id uuid primary key,
  user_id text not null,
  name text not null,
  role text not null,
  goal text not null default '',
  model text not null,
  temperature double precision not null default 0.2,
  tools jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflows (
  id uuid primary key,
  user_id text not null,
  name text not null,
  description text not null default '',
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key,
  user_id text not null,
  filename text not null,
  content_type text not null default '',
  status text not null default 'indexed',
  chunk_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key,
  document_id uuid not null references documents(id) on delete cascade,
  user_id text not null,
  chunk_index integer not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists runs (
  id uuid primary key,
  user_id text not null,
  workflow_id uuid references workflows(id) on delete set null,
  prompt text not null,
  output text not null,
  citations jsonb not null default '[]'::jsonb,
  trace jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agents_user_id on agents(user_id);
create index if not exists idx_workflows_user_id on workflows(user_id);
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_chunks_user_id on document_chunks(user_id);
create index if not exists idx_runs_user_id on runs(user_id);

