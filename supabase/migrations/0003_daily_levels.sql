-- 0003_daily_levels.sql
-- Engine level per senior/day: feeds the alert trend chart and the evaluation view.
create table public.daily_levels (
  senior_id uuid not null references public.seniors (id) on delete cascade,
  date date not null,
  level smallint not null check (level between 0 and 3),
  kind public.alert_kind,
  calibrating boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  primary key (senior_id, date)
);
alter table public.daily_levels enable row level security;
revoke all on public.daily_levels from anon;
create policy daily_levels_staff_read on public.daily_levels
  for select to authenticated using (public.is_center_senior(senior_id));
