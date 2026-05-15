-- HotSeat: public.sessions hardening migration
-- Run in Supabase SQL editor (or psql) against the target project.

create table if not exists public.sessions (
  session_id text primary key,
  persona text not null,
  repo_url text not null,
  messages text not null,
  turn_count integer default 0,
  started_at text not null,
  ended_at text,
  report text,
  user_id text,
  display_name text
);

alter table public.sessions
  add column if not exists user_id text,
  add column if not exists feedback text,
  add column if not exists display_name text;

alter table public.sessions enable row level security;

do $$
begin
  create policy sessions_user_select on public.sessions
    for select to authenticated
    using (auth.uid()::text = user_id);
exception when duplicate_object then
  null;
end $$;

-- Optional: enable realtime replication for session updates.
do $$
begin
  alter publication supabase_realtime add table public.sessions;
exception when duplicate_object then
  null;
when others then
  -- Ignore permission/environment differences.
  null;
end $$;

