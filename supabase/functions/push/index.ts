// push: save / remove this browser's Web Push subscription and send a test notification.
// Signed-in users only; a subscription is tied to the user from the JWT.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendToUser } from "../_shared/push/send.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function userIdOf(req: Request): string | null {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  try {
    const c = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return c.role === "authenticated" ? c.sub : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, status = 200) => Response.json(b, { status, headers: CORS });
  const userId = userIdOf(req);
  if (!userId) return json({ error: "login required" }, 401);

  const body = await req.json().catch(() => ({}));
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  if (body.action === "subscribe") {
    const s = body.subscription;
    if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) return json({ error: "invalid subscription" }, 400);
    const { error } = await db.from("push_subscriptions").upsert({
      endpoint: s.endpoint,
      p256dh: s.keys.p256dh,
      auth: s.keys.auth,
      user_id: userId,
      user_agent: req.headers.get("user-agent")?.slice(0, 200) ?? null,
    });
    return error ? json({ error: error.message }, 500) : json({ ok: true });
  }

  if (body.action === "unsubscribe") {
    if (body.endpoint) await db.from("push_subscriptions").delete().eq("endpoint", body.endpoint).eq("user_id", userId);
    return json({ ok: true });
  }

  if (body.action === "test") {
    const r = await sendToUser(db, userId, {
      title: "Telefon do seniora",
      body: "Powiadomienia działają. Tak dostaniesz informację po każdej rozmowie.",
      url: "/app",
      tag: "test",
    });
    return json({ ok: true, ...r });
  }

  return json({ error: "unknown action" }, 400);
});
