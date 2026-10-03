// health: infrastructure smoke test. Confirms the function runtime can reach the database
// with the service role and reports which required secrets are configured (names only,
// never values), so we can verify setup without exposing keys.
import { createClient } from "npm:@supabase/supabase-js@2";

const REQUIRED_SECRETS = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_AGENT_ID",
  "ELEVENLABS_WEBHOOK_SECRET",
  "RESEND_API_KEY",
];

Deno.serve(async () => {
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { count, error } = await db.from("seniors").select("*", { count: "exact", head: true });

  const secrets = Object.fromEntries(
    REQUIRED_SECRETS.map((name) => [name, Boolean(Deno.env.get(name))]),
  );

  return Response.json({
    ok: !error,
    db: error ? { error: error.message } : { seniors: count },
    secrets_configured: secrets,
    at: new Date().toISOString(),
  });
});
