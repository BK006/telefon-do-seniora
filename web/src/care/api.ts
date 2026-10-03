// Calls the Edge Functions with the signed-in user's JWT. Only the public project URL and
// anon key reach the browser; the ElevenLabs/OpenAI keys live in Supabase secrets. The server
// requires a logged-in user, dials only +48 numbers and rate-limits calls.
import type { SeniorProfile } from "@shared/agent/prompt.ts";
import type { CareConfig } from "./state";
import { supabase } from "./auth";

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

async function authHeaders(): Promise<Record<string, string>> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  return { Authorization: `Bearer ${token ?? ANON}`, apikey: ANON ?? "" };
}

export function toProfile(c: CareConfig): SeniorProfile {
  return {
    fullName: c.imie,
    address: c.forma,
    gender: c.plec,
    birthYear: Number(c.rok) || undefined,
    relation: c.relacja.toLowerCase(),
    callerName: c.callerName,
    hardOfHearing: c.slabiej,
    shortCalls: c.krotkie,
    conditions: c.choroby,
    history: c.historia,
    meds: c.leki.filter((l) => l.n).map((l) => ({ name: l.n, time: l.t })),
    mobility: c.ruch,
    interests: c.zaint,
    closePeople: c.bliscy,
    favouriteTopics: c.tematy,
    avoidTopics: c.unikac,
  };
}

export async function placeCall(c: CareConfig): Promise<{ ok: true; conversationId: string | null } | { ok: false; message: string }> {
  if (!URL_ || !ANON) return { ok: false, message: "Połączenia telefoniczne nie są skonfigurowane w tej wersji demo." };
  try {
    const res = await fetch(`${URL_}/functions/v1/place-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        to_number: c.tel,
        senior: toProfile(c),
        questions: c.questions.filter((q) => q.on).map((q) => ({ id: q.id, label: q.label, prompt: q.ask })),
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, conversationId: out.conversation_id ?? null };
    if (res.status === 401) return { ok: false, message: "Zaloguj się ponownie, aby zadzwonić." };
    if (res.status === 403) return { ok: false, message: "Asystent dzwoni tylko na polskie numery (+48, 9 cyfr)." };
    if (res.status === 429) return { ok: false, message: "Osiągnięto limit połączeń demo na tę godzinę. Spróbuj za chwilę." };
    if (String(out.error ?? "").includes("missing secrets")) return { ok: false, message: "Połączenia czekają na konfigurację klucza ElevenLabs." };
    return { ok: false, message: "Nie udało się połączyć. Spróbuj ponownie za chwilę." };
  } catch {
    return { ok: false, message: "Brak połączenia z serwerem." };
  }
}

export interface LiveCall {
  id: string;
  status: string;
  startedAt: number | null;
  durationSecs: number;
  answered: boolean;
  title: string | null;
  summary: string | null;
  transcript: { role: "ai" | "senior"; text: string }[];
}

/** Real phone calls of the agent to Polish numbers (signed-in users only, filtered server-side). */
export async function listCalls(): Promise<LiveCall[]> {
  if (!URL_ || !ANON) return [];
  try {
    const res = await fetch(`${URL_}/functions/v1/list-calls`, { headers: await authHeaders() });
    if (!res.ok) return [];
    const out = await res.json();
    return out.calls ?? [];
  } catch {
    return [];
  }
}

export interface Analysis {
  checkIn: {
    sleep: { quality: number | null; evidence: string | null };
    appetite: { level: number | null; evidence: string | null };
    mood_self_report: { level: number | null; evidence: string | null };
    pain: { level: number | null; location: string | null; evidence: string | null };
    social_contact: { talked_to_someone: boolean | null; evidence: string | null };
    medication: { taken_as_planned: boolean | null; evidence: string | null };
    activity: { left_home: boolean | null; evidence: string | null };
    needs: { item: string; evidence: string }[];
    red_flags: { type: string; evidence: string }[];
    withheld_categories: string[];
    summary_pl: string;
  };
  day: { status: "ok" | "zadzwon" | "pilne"; reasons: string[] };
  model: string;
}

/** OpenAI structured analysis of a real call (cached server-side after the first run). */
export async function analyzeCall(conversationId: string): Promise<Analysis | { error: string }> {
  if (!URL_ || !ANON) return { error: "Analiza niedostępna w tej wersji." };
  try {
    const res = await fetch(`${URL_}/functions/v1/analyze-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok) return out as Analysis;
    if (res.status === 409) return { error: "Rozmowa jeszcze trwa — analiza pojawi się po jej zakończeniu." };
    if (res.status === 422) return { error: "Rozmówca nic nie powiedział, nie ma czego analizować." };
    return { error: "Nie udało się przeanalizować rozmowy." };
  } catch {
    return { error: "Brak połączenia z serwerem." };
  }
}
