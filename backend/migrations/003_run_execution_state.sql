alter table runs
  add column if not exists status text not null default 'completed',
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists error_message text,
  add column if not exists current_node_id text,
  add column if not exists current_node_label text;

update runs
set status = 'completed'
where status not in ('queued', 'pending', 'running', 'waiting_approval', 'completed', 'failed');

create index if not exists idx_runs_status on runs(status);
create index if not exists idx_runs_created_at on runs(created_at);
