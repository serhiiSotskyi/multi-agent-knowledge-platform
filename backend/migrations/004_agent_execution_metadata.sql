alter table agents
  add column if not exists description text not null default '',
  add column if not exists system_prompt text not null default '',
  add column if not exists trigger_type text not null default 'manual',
  add column if not exists trigger_config jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'draft',
  add column if not exists permission_mode text not null default 'approval_required',
  add column if not exists last_scheduled_run_at timestamptz;

update agents
set system_prompt = trim(role || E'\n\n' || goal)
where system_prompt = '';

alter table runs
  add column if not exists agent_id uuid references agents(id) on delete set null,
  add column if not exists trigger_source text not null default 'manual',
  add column if not exists trigger_config jsonb not null default '{}'::jsonb;

update runs
set status = 'queued'
where status = 'pending';

create index if not exists idx_runs_agent_id on runs(agent_id);
create index if not exists idx_runs_trigger_source on runs(trigger_source);
create index if not exists idx_agents_trigger_status on agents(user_id, trigger_type, status);
