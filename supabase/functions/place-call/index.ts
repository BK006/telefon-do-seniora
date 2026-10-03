// place-call: starts an outbound phone call from the ElevenLabs agent to a senior.
// The agent's prompt and first message are empty templates ({{system_prompt}}, {{first_message}});
// this function fills them per senior, so the backend fully controls what the agent says.
//
// Abuse protection (an open "call any number" endpoint would be a toll-fraud risk):
//  - service-role callers may dial any number;
//  - everyone else may only dial numbers listed in the ALLOWED_CALL_NUMBERS secret (demo).
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

function roleOf(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role as string;
  } catch {
    return "unknown";
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
  const allowed = (Deno.env.get("ALLOWED_CALL_NUMBERS") ?? "").split(",").map((s) => normalizePl(s.trim())).filter(Boolean);
  if (roleOf(req) !== "service_role" && !allowed.includes(to)) {
    return json({ error: "number not allowed for demo calls" }, 403);
  }

  const system_prompt = buildSystemPrompt(body.senior, body.questions?.length ? body.questions : DEFAULT_QUESTIONS);
  const first_message = buildFirstMessage(body.senior);
  if (body.preview) return json({ to, system_prompt, first_message });

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
  return json({ ok: true, to, conversation_id: out.conversation_id ?? null, sip_call_id: out.sip_call_id ?? null });
});
