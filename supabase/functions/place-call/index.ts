// place-call: starts an outbound phone call from the ElevenLabs agent to a senior.
// The agent's prompt and first message are empty templates ({{system_prompt}}, {{first_message}});
// this function fills them per senior, so the backend fully controls what the agent says.
//
// Abuse protection (an open "call any number" endpoint would be a toll-fraud / harassment risk):
//  - only signed-in users (Supabase Auth JWT) or the service role may place calls;
//  - only Polish numbers (+48 followed by 9 digits);
//  - at most MAX_CALLS_PER_HOUR calls across the whole demo, logged in call_log.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildFirstMessage, buildSystemPrompt, DEFAULT_QUESTIONS, type Question, type SeniorProfile } from "../_shared/agent/prompt.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizePl(num: string) {
  const digits = num.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.length === 9) return "+48" + digits;
  return "+" + digits;
}

const MAX_CALLS_PER_HOUR = 20;
const PL_NUMBER = /^\+48\d{9}$/;

// The gateway already verified the JWT signature (verify_jwt = true); here we only read claims.
function claimsOf(req: Request): { role: string; sub?: string } {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return { role: "unknown" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: CORS });

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  const agentId = Deno.env.get("ELEVENLABS_AGENT_ID");
  const phoneId = Deno.env.get("ELEVENLABS_PHONE_NUMBER_ID");
  if (!apiKey || !agentId || !phoneId) {
    return json({ error: "missing secrets: ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID / ELEVENLABS_PHONE_NUMBER_ID" }, 500);
  }

  let body: { to_number?: string; senior?: SeniorProfile; questions?: Question[]; preview?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  if (!body.to_number || !body.senior?.fullName || !body.senior?.address) {
    return json({ error: "required: to_number, senior.fullName, senior.address" }, 400);
  }

  const to = normalizePl(body.to_number);
  const claims = claimsOf(req);
  if (claims.role !== "authenticated" && claims.role !== "service_role") {
    return json({ error: "login required" }, 401);
  }
  if (!PL_NUMBER.test(to)) return json({ error: "only Polish +48 numbers" }, 403);

  const system_prompt = buildSystemPrompt(body.senior, body.questions?.length ? body.questions : DEFAULT_QUESTIONS);
  const first_message = buildFirstMessage(body.senior);
  if (body.preview) return json({ to, system_prompt, first_message });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("call_log").select("id", { count: "exact", head: true }).gte("created_at", since);
  if ((count ?? 0) >= MAX_CALLS_PER_HOUR) return json({ error: "rate limit" }, 429);

  const res = await fetch("https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call", {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: agentId,
      agent_phone_number_id: phoneId,
      to_number: to,
      conversation_initiation_client_data: {
        dynamic_variables: { system_prompt, first_message, senior_name: body.senior.fullName },
      },
    }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: "elevenlabs error", status: res.status, detail: out }, 502);
  await db.from("call_log").insert({ conversation_id: out.conversation_id ?? null, to_number: to, user_id: claims.role === "authenticated" ? claims.sub : null });
  return json({ ok: true, to, conversation_id: out.conversation_id ?? null, sip_call_id: out.sip_call_id ?? null });
});
