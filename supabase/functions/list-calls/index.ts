// list-calls: real phone conversations of the agent, for the "Rozmowy" tab.
// The ElevenLabs key stays server-side. Only signed-in users can read calls, and only
// calls to Polish (+48) numbers placed by this agent are returned.
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
const norm = (n: string) => n.replace(/[^\d+]/g, "").replace(/^00/, "+").replace(/^(\d{9})$/, "+48$1");
// Expressive-mode audio tags like "[gentle] " are for the voice, not for people reading.
const clean = (t: string) => t.replace(/\[[a-z ]+\]\s*/gi, "").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, status = 200) => Response.json(b, { status, headers: CORS });
  if (!isSignedIn(req)) return json({ error: "login required" }, 401);
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  const agent = Deno.env.get("ELEVENLABS_AGENT_ID");
  if (!key || !agent) return json({ error: "missing secrets" }, 500);

  const h = { "xi-api-key": key };
  const list = await fetch(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agent}&page_size=15`, { headers: h });
  if (!list.ok) return json({ error: "elevenlabs list error", status: list.status }, 502);
  const { conversations = [] } = await list.json();

  const details = await Promise.all(
    conversations.slice(0, 10).map(async (c: { conversation_id: string }) => {
      const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${c.conversation_id}`, { headers: h });
      return r.ok ? r.json() : null;
    }),
  );

  const calls = details
    .filter((d) => d && norm(d.metadata?.phone_call?.external_number ?? "").startsWith("+48"))
    .map((d) => ({
      id: d.conversation_id,
      status: d.status, // "done" | "in-progress" | "failed" ...
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
