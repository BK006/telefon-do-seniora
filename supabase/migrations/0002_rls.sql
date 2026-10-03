-- 0002_rls.sql
-- Row Level Security + consent enforcement.
--
-- Access model:
--  * staff (centre employee) sees seniors of their own centre only;
--  * family sees only linked seniors and only consented categories;
--  * nobody reads raw check_ins directly — both roles go through views that mask
--    non-consented categories IN THE DATABASE (not just in the UI);
--  * staff cannot read raw call transcripts (column-level grant), only quotes in evidence;
--  * Edge Functions write with the service role, which bypasses RLS.

-- ---------- helpers (security definer, so policies don't recurse into RLS) ----------

create or replace function public.my_center_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select center_id from public.staff where user_id = auth.uid()
$$;

create or replace function public.is_center_senior(p_senior uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.seniors s
    join public.staff st on st.center_id = s.center_id
    where s.id = p_senior and st.user_id = auth.uid()
  )
$$;

create or replace function public.is_family_senior(p_senior uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.family_links f
    where f.senior_id = p_senior and f.user_id = auth.uid()
  )
$$;

-- Categories a recipient may see for a senior. recipient: 'center' | 'family'.
create or replace function public.allowed_categories(p_senior uuid, p_recipient text)
returns public.share_category[]
language sql stable security definer set search_path = ''
as $$
  select coalesce(array_agg(c.category), '{}')
  from public.consents c
  where c.senior_id = p_senior
    and case p_recipient
          when 'center' then c.share_with_center
          when 'family' then c.share_with_family
          else false
        end
$$;

-- Who am I? Used by the frontend to route to the right view.
create or replace function public.my_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select case
    when exists (select 1 from public.staff where user_id = auth.uid()) then 'staff'
    when exists (select 1 from public.family_links where user_id = auth.uid()) then 'family'
    else 'none'
  end
$$;

-- ---------- enable RLS everywhere ----------

alter table public.centers        enable row level security;
alter table public.staff          enable row level security;
alter table public.seniors        enable row level security;
alter table public.consents       enable row level security;
alter table public.family_links   enable row level security;
alter table public.calls          enable row level security;
alter table public.check_ins      enable row level security;
alter table public.metric_scores  enable row level security;
alter table public.senior_status  enable row level security;
alter table public.alerts         enable row level security;
alter table public.alert_events   enable row level security;
alter table public.eval_labels    enable row level security;
alter table public.digests        enable row level security;
alter table public.seed_runs      enable row level security;

-- Anonymous users get nothing at all.
revoke all on all tables in schema public from anon;

-- ---------- policies ----------

create policy centers_staff_read on public.centers
  for select to authenticated using (id = public.my_center_id());

create policy staff_self_read on public.staff
  for select to authenticated using (center_id = public.my_center_id());

create policy seniors_read on public.seniors
  for select to authenticated
  using (public.is_center_senior(id) or public.is_family_senior(id));

create policy consents_read on public.consents
  for select to authenticated
  using (public.is_center_senior(senior_id) or public.is_family_senior(senior_id));

create policy family_links_read on public.family_links
  for select to authenticated
  using (user_id = auth.uid() or public.is_center_senior(senior_id));

-- calls: staff only, and without the transcript column (see grants below).
create policy calls_staff_read on public.calls
  for select to authenticated using (public.is_center_senior(senior_id));
revoke select on public.calls from authenticated;
grant select (id, senior_id, call_date, started_at, attempt_no, answered, duration_s, source, analyzed_at)
  on public.calls to authenticated;

-- check_ins: NO direct policy -> no direct access. Read via center_check_ins / family_check_ins.

create policy metric_scores_staff_read on public.metric_scores
  for select to authenticated using (public.is_center_senior(senior_id));

create policy senior_status_staff_read on public.senior_status
  for select to authenticated using (public.is_center_senior(senior_id));

create policy alerts_staff_read on public.alerts
  for select to authenticated using (public.is_center_senior(senior_id));

create policy alert_events_staff_read on public.alert_events
  for select to authenticated
  using (exists (select 1 from public.alerts a
                 where a.id = alert_id and public.is_center_senior(a.senior_id)));

create policy eval_labels_staff_read on public.eval_labels
  for select to authenticated using (public.is_center_senior(senior_id));

create policy digests_family_read on public.digests
  for select to authenticated using (family_user_id = auth.uid());

-- seed_runs: no policies -> service role only.

-- ---------- consent-enforcing views ----------
-- Views are owned by postgres and bypass RLS on check_ins; the WHERE clause and the
-- per-column CASE expressions are the access control. security_barrier prevents
-- user-supplied predicates from being pushed below the filter.

create or replace view public.center_check_ins with (security_barrier = true) as
with base as (
  select c.*, public.allowed_categories(c.senior_id, 'center') as allowed
  from public.check_ins c
  where public.is_center_senior(c.senior_id)
)
select
  id, call_id, senior_id, date,
  case when 'sleep'      = any(allowed) then sleep_quality end     as sleep_quality,
  case when 'sleep'      = any(allowed) then sleep_hours end       as sleep_hours,
  case when 'appetite'   = any(allowed) then appetite end          as appetite,
  case when 'mood'       = any(allowed) then mood end              as mood,
  case when 'pain'       = any(allowed) then pain end              as pain,
  case when 'pain'       = any(allowed) then pain_location end     as pain_location,
  case when 'social'     = any(allowed) then talked_to_someone end as talked_to_someone,
  case when 'medication' = any(allowed) then meds_taken end        as meds_taken,
  case when 'activity'   = any(allowed) then left_home end         as left_home,
  avg_answer_words,
  (select coalesce(jsonb_object_agg(k, v), '{}'::jsonb)
     from jsonb_each(evidence) e(k, v)
     where k = any(allowed::text[])) as evidence,
  case when 'safety' = any(allowed) then red_flags else '[]'::jsonb end as red_flags,
  withheld_categories,
  -- The free-text summary may mention any category, so it is shown only with full consent.
  case when allowed @> enum_range(null::public.share_category) then summary_pl end as summary_pl,
  created_at
from base;

-- Family: consented categories only AND minus what the senior withheld in that call.
-- No free-text summary at all (it could leak non-consented categories).
create or replace view public.family_check_ins with (security_barrier = true) as
with base as (
  select c.*,
         array(select unnest(public.allowed_categories(c.senior_id, 'family'))
               except select unnest(c.withheld_categories)) as allowed
  from public.check_ins c
  where public.is_family_senior(c.senior_id)
)
select
  senior_id, date,
  case when 'sleep'      = any(allowed) then sleep_quality end     as sleep_quality,
  case when 'sleep'      = any(allowed) then sleep_hours end       as sleep_hours,
  case when 'appetite'   = any(allowed) then appetite end          as appetite,
  case when 'mood'       = any(allowed) then mood end              as mood,
  case when 'pain'       = any(allowed) then pain end              as pain,
  case when 'social'     = any(allowed) then talked_to_someone end as talked_to_someone,
  case when 'medication' = any(allowed) then meds_taken end        as meds_taken,
  case when 'activity'   = any(allowed) then left_home end         as left_home,
  allowed as visible_categories
from base;

-- Family alerts: only alerts whose every category is consented for family.
create or replace view public.family_alerts with (security_barrier = true) as
select a.id, a.senior_id, a.level, a.kind, a.status, a.title, a.started_on, a.detected_on,
       -- strip quotes for family; they get the headline and the status, not the evidence
       a.explanation - 'quotes' - 'checklist' as explanation
from public.alerts a
where public.is_family_senior(a.senior_id)
  and a.categories <@ public.allowed_categories(a.senior_id, 'family');

revoke all on public.center_check_ins, public.family_check_ins, public.family_alerts from anon;
grant select on public.center_check_ins, public.family_check_ins, public.family_alerts to authenticated;

-- ---------- closed loop: status transitions go through one audited function ----------

create or replace function public.transition_alert(
  p_alert_id uuid,
  p_to public.alert_status,
  p_note text default null
)
returns public.alerts
language plpgsql security definer set search_path = ''
as $$
declare
  v_alert public.alerts;
  v_prev public.alert_status;
  v_name text;
begin
  select * into v_alert from public.alerts where id = p_alert_id for update;
  if v_alert.id is null or not public.is_center_senior(v_alert.senior_id) then
    raise exception 'alert not found' using errcode = 'P0002';
  end if;
  if v_alert.status in ('resolved', 'false_alarm') then
    raise exception 'alert already closed' using errcode = 'P0001';
  end if;
  if p_to = 'new' then
    raise exception 'cannot move back to new' using errcode = 'P0001';
  end if;

  v_prev := v_alert.status;
  select full_name into v_name from public.staff where user_id = auth.uid();

  update public.alerts set status = p_to, updated_at = now()
   where id = p_alert_id returning * into v_alert;

  insert into public.alert_events (alert_id, actor_id, actor_name, from_status, to_status, note)
  values (p_alert_id, auth.uid(), v_name, v_prev, p_to, p_note);

  return v_alert;
end;
$$;

revoke execute on function public.transition_alert(uuid, public.alert_status, text) from anon, public;
grant execute on function public.transition_alert(uuid, public.alert_status, text) to authenticated;

-- Consent changes by the centre (on the senior's request) — also audited via updated_at.
create or replace function public.set_consent(
  p_senior uuid,
  p_category public.share_category,
  p_family boolean
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_center_senior(p_senior) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.consents (senior_id, category, share_with_family)
  values (p_senior, p_category, p_family)
  on conflict (senior_id, category)
  do update set share_with_family = excluded.share_with_family, updated_at = now();
end;
$$;

revoke execute on function public.set_consent(uuid, public.share_category, boolean) from anon, public;
grant execute on function public.set_consent(uuid, public.share_category, boolean) to authenticated;
