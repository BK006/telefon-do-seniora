// analyze-call: turns a real phone conversation into a structured, quoted check-in (OpenAI)
// and caches it in live_analyses. Same privacy guard as list-calls: only conversations with
// demo test numbers (ALLOWED_CALL_NUMBERS) can be analysed through the public anon key.
import { createClient } from "npm:@supabase/supabase-js@2";
import { dayStatus, extractCheckIn } from "../_shared/analysis/extract.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const norm = (n: string) => n.replace(/[^\d+]/g, "").replace(/^00/, "+").replace(/^(\d{9})$/, "+48$1");
const clean = (t: string) => t.replace(/\[[a-z ]+\]\s*/gi, "").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, status = 200) => Response.json(b, { status, headers: CORS });

  const el = Deno.env.get("ELEVENLABS_API_KEY");
  const oa = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL");
  if (!el || !oa || !model) return json({ error: "missing secrets" }, 500);

  const { conversation_id, force } = await req.json().catch(() => ({}));
  if (!conversation_id || !/^conv_[a-z0-9]+$/i.test(conversation_id)) return json({ error: "conversation_id required" }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  if (!force) {
    const { data } = await db.from("live_analyses").select("result, model").eq("conversation_id", conversation_id).maybeSingle();
    if (data) return json({ ...data.result, model: data.model, cached: true });
  }

  const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversation_id}`, { headers: { "xi-api-key": el } });
  if (!r.ok) return json({ error: "conversation not found" }, 404);
  const conv = await r.json();
  const allowed = new Set((Deno.env.get("ALLOWED_CALL_NUMBERS") ?? "").split(",").map((s) => norm(s.trim())).filter(Boolean));
  if (!allowed.has(norm(conv.metadata?.phone_call?.external_number ?? ""))) return json({ error: "not allowed" }, 403);
  if (conv.status !== "done") return json({ error: "call still in progress" }, 409);

  const transcript = (conv.transcript ?? [])
    .filter((t: { message?: string }) => t.message && t.message.trim() !== "...")
    .map((t: { role: string; message: string }) => ({ role: t.role === "agent" ? ("ai" as const) : ("senior" as const), text: clean(t.message) }));
  if (!transcript.some((t: { role: string }) => t.role === "senior")) return json({ error: "no answers from senior" }, 422);

  try {
    const checkIn = await extractCheckIn(transcript, { apiKey: oa, model });
    const result = { checkIn, day: dayStatus(checkIn) };
    await db.from("live_analyses").upsert({ conversation_id, result, model });
    return json({ ...result, model, cached: false });
  } catch (e) {
    return json({ error: "analysis failed", detail: String((e as Error).message ?? e) }, 502);
  }
});
