// process-calls: run every minute by pg_cron. For each call placed from the app that has
// finished, analyse it (OpenAI, same extractCheckIn as analyze-call), cache the result and send
// a Web Push notification to the family member who placed the call.
// Protected by the CRON_SECRET header (pg_cron sends it); not callable by app users.
import { createClient } from "npm:@supabase/supabase-js@2";
import { dayStatus, extractCheckIn } from "../_shared/analysis/extract.ts";
import { sendToUser } from "../_shared/push/send.ts";

const clean = (t: string) => t.replace(/\[[a-z ]+\]\s*/gi, "").trim();
const STATUS_PL = { ok: "Wszystko w porządku", zadzwon: "Warto zadzwonić", pilne: "PILNE" } as const;

Deno.serve(async (req) => {
  const json = (b: unknown, status = 200) => Response.json(b, { status });
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return json({ error: "forbidden" }, 403);

  const el = Deno.env.get("ELEVENLABS_API_KEY")!;
  const oa = Deno.env.get("OPENAI_API_KEY")!;
  const model = Deno.env.get("OPENAI_MODEL")!;
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const since = new Date(Date.now() - 3 * 3600_000).toISOString();
  const { data: pending } = await db
    .from("call_log")
    .select("id, conversation_id, user_id")
    .is("processed_at", null)
    .not("conversation_id", "is", null)
    .gte("created_at", since)
    .limit(5);

  const done: unknown[] = [];
  for (const row of pending ?? []) {
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${row.conversation_id}`, { headers: { "xi-api-key": el } });
    if (!r.ok) continue;
    const conv = await r.json();
    if (conv.status !== "done" && conv.status !== "failed") continue; // still ringing / talking / processing

    const who = conv.conversation_initiation_client_data?.dynamic_variables?.senior_name ?? "Bliska osoba";
    const transcript = (conv.transcript ?? [])
      .filter((t: { message?: string }) => t.message && t.message.trim() !== "...")
      .map((t: { role: string; message: string }) => ({ role: t.role === "agent" ? ("ai" as const) : ("senior" as const), text: clean(t.message) }));
    const answered = transcript.some((t: { role: string }) => t.role === "senior");

    let status = "nie_odebrala";
    let title = `${who}: nie odebrał(a) telefonu`;
    let body = "Asystent nie dodzwonił się. Możesz spróbować ponownie z aplikacji.";

    if (answered) {
      try {
        const checkIn = await extractCheckIn(transcript, { apiKey: oa, model });
        const day = dayStatus(checkIn);
        await db.from("live_analyses").upsert({ conversation_id: row.conversation_id, result: { checkIn, day }, model });
        status = day.status;
        title = `${who}: ${STATUS_PL[day.status]}`;
        const needs = checkIn.needs.map((n) => n.item).join(", ");
        body = [day.reasons.length ? `Powód: ${day.reasons.join(", ")}.` : checkIn.summary_pl, needs ? `Potrzebuje: ${needs}.` : ""].filter(Boolean).join(" ").slice(0, 220);
      } catch {
        status = "blad_analizy";
        title = `${who}: rozmowa zakończona`;
        body = "Zapis rozmowy jest w aplikacji.";
      }
    }

    if (row.user_id) await sendToUser(db, row.user_id, { title, body, url: `/app/rozmowy/${row.conversation_id}`, tag: row.conversation_id });
    await db.from("call_log").update({ processed_at: new Date().toISOString(), result_status: status }).eq("id", row.id);
    done.push({ id: row.id, status });
  }
  return json({ processed: done });
});
