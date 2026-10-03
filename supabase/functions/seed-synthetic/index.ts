// seed-synthetic: one-off load of synthetic demo data (30 seniors x 30 days).
// Guarded twice: only the service role may call it, and seed_runs blocks a second run.
// Everything shown in the dashboard is produced by the same engine code as the live pipeline.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { BOOL_METRICS, NUMERIC_METRICS } from "../_shared/engine/config.ts";
import { evaluateSeries } from "../_shared/engine/detect.ts";
import { deriveEpisodes } from "../_shared/engine/explain.ts";
import { evaluate } from "../_shared/engine/evaluate.ts";
import { generateSeniors } from "../_shared/synthetic/generate.ts";
import { DEMO_CENTERS, DEMO_PASSWORD, DEMO_USERS } from "../_shared/synthetic/demo.ts";

const SEED_ID = "synthetic-v1";

function isServiceRole(req: Request): boolean {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (token && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true;
  try {
    // The gateway already verified the JWT signature (verify_jwt = true); we only read the role.
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

async function ensureUser(db: SupabaseClient, email: string, full_name: string): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (data?.user) return data.user.id;
  // Already exists -> find it.
  const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
  const u = list?.users.find((x) => x.email === email);
  if (!u) throw new Error(`cannot create user ${email}: ${error?.message}`);
  return u.id;
}

async function insert(db: SupabaseClient, table: string, rows: unknown[], chunk = 500) {
  for (let i = 0; i < rows.length; i += chunk) {
    const { error } = await db.from(table).insert(rows.slice(i, i + chunk));
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

Deno.serve(async (req) => {
  if (!isServiceRole(req)) return Response.json({ error: "forbidden" }, { status: 403 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: already } = await db.from("seed_runs").select("id").eq("id", SEED_ID).maybeSingle();
  if (already) return Response.json({ error: "already seeded", seed: SEED_ID }, { status: 409 });

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Remove leftovers of a partial earlier run (cascades to everything below).
    await db.from("centers").delete().in("name", Object.values(DEMO_CENTERS).map((c) => c.name));

    const { data: centers, error: cErr } = await db.from("centers").insert(Object.values(DEMO_CENTERS)).select();
    if (cErr) throw cErr;
    const centerId = {
      krakow: centers!.find((c) => c.name === DEMO_CENTERS.krakow.name)!.id,
      wieliczka: centers!.find((c) => c.name === DEMO_CENTERS.wieliczka.name)!.id,
    };

    const staffK = await ensureUser(db, DEMO_USERS.staffKrakow.email, DEMO_USERS.staffKrakow.full_name);
    const staffW = await ensureUser(db, DEMO_USERS.staffWieliczka.email, DEMO_USERS.staffWieliczka.full_name);
    const family = await ensureUser(db, DEMO_USERS.family.email, DEMO_USERS.family.full_name);
    await db.from("staff").upsert([
      { user_id: staffK, center_id: centerId.krakow, full_name: DEMO_USERS.staffKrakow.full_name },
      { user_id: staffW, center_id: centerId.wieliczka, full_name: DEMO_USERS.staffWieliczka.full_name },
    ]);

    const seniors = generateSeniors(today);
    const { data: seniorRows, error: sErr } = await db.from("seniors").insert(
      seniors.map((s) => ({
        center_id: centerId[s.center],
        display_name: s.display_name,
        gender: s.gender,
        birth_year: s.birth_year,
        city: s.city,
        persona: s.persona,
        phone_masked: s.phone_masked,
        scenario: s.scenario,
      })),
    ).select("id, display_name");
    if (sErr) throw sErr;
    const idOf = new Map(seniorRows!.map((r) => [r.display_name, r.id as string]));

    const ALL = ["sleep", "appetite", "mood", "pain", "social", "medication", "activity", "safety"];
    const consents = [], calls = [], checkIns = [], scores = [], levels = [], labels = [], statuses = [];
    const alerts: Record<string, unknown>[] = [];
    const evalInputs = [];

    for (const s of seniors) {
      const sid = idOf.get(s.display_name)!;
      for (const c of ALL) {
        consents.push({ senior_id: sid, category: c, share_with_center: true, share_with_family: s.family_consent.includes(c) });
      }

      const results = evaluateSeries(s.days);
      const episodes = deriveEpisodes(s.days, results);
      evalInputs.push({ key: s.key, scenario: s.scenario, dates: s.days.map((d) => d.date), expected: s.expected, episodes });

      s.days.forEach((d, i) => {
        const startedAt = `${d.date}T${String(9 + (i % 3)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00+02:00`;
        const callId = crypto.randomUUID();
        if (!d.answered) {
          // first attempt + same-day retry, both unanswered
          calls.push({ id: callId, senior_id: sid, call_date: d.date, started_at: startedAt, attempt_no: 1, answered: false, source: "synthetic" });
          calls.push({ id: crypto.randomUUID(), senior_id: sid, call_date: d.date, started_at: startedAt.replace(/T\d\d/, "T14"), attempt_no: 2, answered: false, source: "synthetic" });
        } else {
          calls.push({
            id: callId, senior_id: sid, call_date: d.date, started_at: startedAt, attempt_no: 1, answered: true,
            duration_s: 90 + Math.round((d.avg_answer_words ?? 8) * 6), source: "synthetic",
            transcript: s.transcripts[i], analyzed_at: startedAt,
          });
          checkIns.push({
            call_id: callId, senior_id: sid, date: d.date,
            sleep_quality: d.sleep_quality, appetite: d.appetite, mood: d.mood, pain: d.pain,
            talked_to_someone: d.talked_to_someone, left_home: d.left_home, meds_taken: true,
            avg_answer_words: d.avg_answer_words, evidence: d.evidence, red_flags: d.red_flags,
            withheld_categories: s.display_name.startsWith("Halina") && i % 9 === 4 ? ["mood"] : [],
            summary_pl: s.summaries[i],
          });
        }
        const r = results[i];
        for (const m of NUMERIC_METRICS) {
          const x = r.numeric[m];
          scores.push({ senior_id: sid, date: d.date, metric: m, value: x.value, median: x.median, mad: x.mad, z: x.z, cusum: x.cusum, calibrating: r.calibrating });
        }
        for (const m of BOOL_METRICS) {
          const x = r.bool[m];
          scores.push({ senior_id: sid, date: d.date, metric: m, value: x.value === null ? null : Number(x.value), median: x.rate, calibrating: r.calibrating });
        }
        levels.push({ senior_id: sid, date: d.date, level: r.level, kind: r.kind, calibrating: r.calibrating, reasons: r.reasons });
        labels.push({ senior_id: sid, date: d.date, expected_level: s.expected[i], scenario: s.scenario });
      });

      // Alerts: finished episodes were handled by a human in the past; ongoing ones are open.
      for (const e of episodes) {
        const closed = e.endedOn !== null;
        alerts.push({
          id: crypto.randomUUID(), senior_id: sid, level: e.level, kind: e.kind,
          status: closed ? "resolved" : "new", title: e.explanation.headline, explanation: e.explanation,
          categories: e.categories, started_on: e.startedOn, detected_on: e.detectedOn,
          created_at: `${e.detectedOn}T10:30:00+02:00`, updated_at: `${e.endedOn ?? e.detectedOn}T15:00:00+02:00`,
          _closed: closed, _ended: e.endedOn,
        });
      }

      const last = results[results.length - 1];
      const open = episodes.filter((e) => e.endedOn === null);
      const level = Math.max(last.level, ...open.map((e) => e.level));
      const lastAnswered = [...s.days].reverse().find((d) => d.answered)?.date ?? null;
      statuses.push({
        senior_id: sid, level,
        reason: open[0]?.explanation.headline ?? (last.level === 1 ? "Pojedynczy gorszy sygnał — obserwuj" : null),
        calibrating: last.calibrating, last_contact: lastAnswered, days_of_history: s.days.filter((d) => d.answered).length,
      });
    }

    const events = [];
    for (const a of alerts) {
      const closed = a._closed as boolean;
      const ended = a._ended as string | null;
      delete a._closed;
      delete a._ended;
      if (closed && ended) {
        const d0 = a.detected_on as string;
        events.push(
          { alert_id: a.id, actor_id: staffK, actor_name: DEMO_USERS.staffKrakow.full_name, from_status: "new", to_status: "acknowledged", note: "Przyjęte do obsługi.", at: `${d0}T11:05:00+02:00` },
          { alert_id: a.id, actor_id: staffK, actor_name: DEMO_USERS.staffKrakow.full_name, from_status: "acknowledged", to_status: "contacted", note: "Rozmowa telefoniczna z seniorem i córką.", at: `${d0}T12:40:00+02:00` },
          { alert_id: a.id, actor_id: staffK, actor_name: DEMO_USERS.staffKrakow.full_name, from_status: "contacted", to_status: "resolved", note: "Sytuacja wyjaśniona, wskaźniki wróciły do normy.", at: `${addDays(ended, 0)}T15:00:00+02:00` },
        );
      }
    }

    await insert(db, "consents", consents);
    await insert(db, "family_links", [{ user_id: family, senior_id: idOf.get("Halina K.")!, relation: "córka", digest_email: DEMO_USERS.family.email }]);
    await insert(db, "calls", calls);
    await insert(db, "check_ins", checkIns);
    await insert(db, "metric_scores", scores, 1000);
    await insert(db, "daily_levels", levels, 1000);
    await insert(db, "eval_labels", labels, 1000);
    await insert(db, "senior_status", statuses);
    await insert(db, "alerts", alerts);
    await insert(db, "alert_events", events);

    const summary = evaluate(evalInputs);
    await db.from("seed_runs").insert({ id: SEED_ID, details: { today, summary } });

    return Response.json({
      ok: true,
      seniors: seniors.length,
      calls: calls.length,
      check_ins: checkIns.length,
      alerts: alerts.length,
      evaluation: { recall: summary.recall, falseAlarms: summary.falseAlarms, precision: summary.precision, meanDelayDays: summary.meanDelayDays },
    });
  } catch (e) {
    return Response.json({ error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
});
