-- 0001_schema.sql
-- Core data model for "Telefon do seniora".
-- Design notes:
--  * NULL in a check-in metric means "the senior did not talk about it" — never "normal".
--  * Every scored field has a quote in check_ins.evidence (keyed by category) so alerts can cite it.
--  * metric_scores and senior_status are caches written by the detection engine (Edge Function),
--    so the dashboard only reads and never recomputes statistics in the browser.

create extension if not exists pgcrypto;

create type public.share_category as enum (
  'sleep', 'appetite', 'mood', 'pain', 'social', 'medication', 'activity', 'safety'
);
create type public.alert_kind as enum ('deviation', 'red_flag', 'no_contact');
create type public.alert_status as enum (
  'new', 'acknowledged', 'contacted', 'visit_planned', 'resolved', 'false_alarm'
);
create type public.call_source as enum ('synthetic', 'simulator', 'phone');

-- Social welfare centre (OPS).
create table public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  created_at timestamptz not null default now()
);

-- Centre employee (social worker). One user belongs to one centre.
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete cascade,
  full_name text not null
);

create table public.seniors (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers (id) on delete cascade,
  display_name text not null,
  -- 'f' / 'm' — needed for correct Polish grammar in agent prompts ("spała pani" / "spał pan").
  gender text not null check (gender in ('f', 'm')),
  birth_year int not null check (birth_year between 1910 and 1970),
  city text not null,
  persona text,               -- short description of speaking style (synthetic data)
  phone_masked text,          -- display only, e.g. "+48 *** *** 412"
  scenario text,              -- synthetic scenario label, used for evaluation only
  created_at timestamptz not null default now()
);
create index seniors_center_idx on public.seniors (center_id);

-- What the senior agreed to share, per category and per recipient.
create table public.consents (
  senior_id uuid not null references public.seniors (id) on delete cascade,
  category public.share_category not null,
  share_with_center boolean not null default true,
  share_with_family boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (senior_id, category)
);

-- Family member <-> senior link. Family sees only linked seniors.
create table public.family_links (
  user_id uuid not null references auth.users (id) on delete cascade,
  senior_id uuid not null references public.seniors (id) on delete cascade,
  relation text not null,        -- e.g. "córka"
  digest_email text,             -- where the weekly digest goes (test mode)
  primary key (user_id, senior_id)
);
create index family_links_senior_idx on public.family_links (senior_id);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references public.seniors (id) on delete cascade,
  call_date date not null,
  started_at timestamptz not null default now(),
  attempt_no smallint not null default 1,
  answered boolean not null,
  duration_s int,
  source public.call_source not null,
  -- [{ "role": "agent" | "senior", "text": "..." }]
  transcript jsonb,
  external_id text unique,       -- ElevenLabs conversation_id (idempotent webhook)
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);
create index calls_senior_date_idx on public.calls (senior_id, call_date desc);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references public.calls (id) on delete cascade,
  senior_id uuid not null references public.seniors (id) on delete cascade,
  date date not null,
  sleep_quality smallint check (sleep_quality between 1 and 5),
  sleep_hours numeric(3, 1) check (sleep_hours between 0 and 16),
  appetite smallint check (appetite between 1 and 5),
  mood smallint check (mood between 1 and 5),
  pain smallint check (pain between 0 and 10),
  pain_location text,
  talked_to_someone boolean,
  meds_taken boolean,
  left_home boolean,
  avg_answer_words numeric(5, 1),
  -- { "sleep": "quote", "appetite": "quote", ... } — keys are share_category values
  evidence jsonb not null default '{}'::jsonb,
  -- [{ "type": "fall" | "cannot_get_up" | "chest_pain" | "confusion" | "no_food_or_water" | "other", "evidence": "quote" }]
  red_flags jsonb not null default '[]'::jsonb,
  withheld_categories public.share_category[] not null default '{}',
  summary_pl text,
  created_at timestamptz not null default now()
);
create index check_ins_senior_date_idx on public.check_ins (senior_id, date desc);

-- Engine output per senior/day/metric: lets the UI draw the personal "norm band".
create table public.metric_scores (
  senior_id uuid not null references public.seniors (id) on delete cascade,
  date date not null,
  metric text not null,
  value numeric,
  median numeric,
  mad numeric,
  z numeric,
  cusum numeric,
  calibrating boolean not null default false,
  primary key (senior_id, date, metric)
);

-- Current priority of each senior ("kogo sprawdzić dziś").
create table public.senior_status (
  senior_id uuid primary key references public.seniors (id) on delete cascade,
  level smallint not null default 0 check (level between 0 and 3),
  reason text,
  calibrating boolean not null default true,
  last_contact date,
  days_of_history int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references public.seniors (id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  kind public.alert_kind not null,
  status public.alert_status not null default 'new',
  title text not null,
  -- generated from data by the engine (metric, deviation, since when, quotes, checklist)
  explanation jsonb not null,
  categories public.share_category[] not null default '{}',
  started_on date not null,
  detected_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index alerts_senior_idx on public.alerts (senior_id, created_at desc);
-- At most one open alert per senior and kind; the engine updates it instead of spamming.
create unique index alerts_one_open_per_kind
  on public.alerts (senior_id, kind)
  where status not in ('resolved', 'false_alarm');

-- Closed-loop action log.
create table public.alert_events (
  id bigint generated always as identity primary key,
  alert_id uuid not null references public.alerts (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text,
  from_status public.alert_status,
  to_status public.alert_status not null,
  note text,
  at timestamptz not null default now()
);
create index alert_events_alert_idx on public.alert_events (alert_id, at);

-- Evaluation set: expected alert level per senior/day (synthetic ground truth).
create table public.eval_labels (
  senior_id uuid not null references public.seniors (id) on delete cascade,
  date date not null,
  expected_level smallint not null check (expected_level between 0 and 3),
  scenario text not null,
  primary key (senior_id, date)
);

create table public.digests (
  id uuid primary key default gen_random_uuid(),
  family_user_id uuid not null references auth.users (id) on delete cascade,
  senior_id uuid not null references public.seniors (id) on delete cascade,
  week_start date not null,
  payload jsonb not null,
  sent_at timestamptz,
  provider_id text,
  unique (family_user_id, senior_id, week_start)
);

-- Guard against re-running the synthetic seed.
create table public.seed_runs (
  id text primary key,
  ran_at timestamptz not null default now(),
  details jsonb
);
