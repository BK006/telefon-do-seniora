// list-calls: real phone conversations for the "Rozmowy" tab.
// Source of truth is call_log: only calls placed through the app (place-call) are shown, newest
// first. Only signed-in users can read them. The ElevenLabs key stays server-side.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function isSignedIn(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  try {
    const role = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role;
    return role === "authenticated" || role === "service_role";
  } catch {
    return false;
  }
}
// Expressive-mode audio tags like "[gentle] " are for the voice, not for people reading.
const clean = (t: string) => t.replace(/\[[a-z ]+\]\s*/gi, "").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, status = 200) => Response.json(b, { status, headers: CORS });
  if (!isSignedIn(req)) return json({ error: "login required" }, 401);
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) return json({ error: "missing secrets" }, 500);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: logged } = await db
    .from("call_log")
    .select("conversation_id")
    .not("conversation_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const details = await Promise.all(
    (logged ?? []).map(async (c: { conversation_id: string }) => {
      const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${c.conversation_id}`, { headers: { "xi-api-key": key } });
      return r.ok ? r.json() : null;
    }),
  );

  const calls = details.filter(Boolean).map((d) => ({
    id: d.conversation_id,
    status: d.status, // "initiated" | "in-progress" | "processing" | "done" | "failed"
    startedAt: d.metadata?.start_time_unix_secs ?? null,
    durationSecs: d.metadata?.call_duration_secs ?? 0,
    answered: (d.transcript ?? []).some((t: { role: string; message?: string }) => t.role === "user" && t.message && t.message !== "..."),
    title: d.analysis?.call_summary_title ?? null,
    summary: d.analysis?.transcript_summary ?? null,
    transcript: (d.transcript ?? [])
      .filter((t: { message?: string }) => t.message && t.message.trim() !== "...")
      .map((t: { role: string; message: string }) => ({ role: t.role === "agent" ? "ai" : "senior", text: clean(t.message) })),
  }));

  return json({ calls });
});
