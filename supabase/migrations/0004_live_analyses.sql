-- 0004_live_analyses.sql
-- Cache of OpenAI analyses of real phone calls (one per ElevenLabs conversation),
-- so the model is called once per call, not on every page view. Service role only.
create table public.live_analyses (
  conversation_id text primary key,
  result jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);
alter table public.live_analyses enable row level security;
revoke all on public.live_analyses from anon, authenticated;
