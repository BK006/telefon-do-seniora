-- 0005_call_log.sql
-- Every outbound call placed through place-call: used for the hourly rate limit
-- (public demo with a shared jury account) and as an audit trail. Service role only.
create table public.call_log (
  id bigint generated always as identity primary key,
  conversation_id text,
  to_number text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);
create index call_log_created_idx on public.call_log (created_at desc);
alter table public.call_log enable row level security;
revoke all on public.call_log from anon, authenticated;
