-- 0006_push.sql
-- Web Push subscriptions of signed-in family members (service role only) and call processing state.
create table public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  user_id uuid not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

alter table public.call_log add column processed_at timestamptz;
alter table public.call_log add column result_status text;
