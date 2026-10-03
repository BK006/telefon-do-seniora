// extractCheckIn: the ONLY place that knows which LLM provider turns a transcript into a
// structured check-in. Swap the provider here and nothing else changes.
// Rules baked into the schema + prompt: if the senior did not talk about something -> null,
// never guessed; every value carries a verbatim quote as evidence.

export interface CheckIn {
  sleep: { quality: number | null; evidence: string | null };
  appetite: { level: number | null; evidence: string | null };
  mood_self_report: { level: number | null; evidence: string | null };
  pain: { level: number | null; location: string | null; evidence: string | null };
  social_contact: { talked_to_someone: boolean | null; evidence: string | null };
  medication: { taken_as_planned: boolean | null; evidence: string | null };
  activity: { left_home: boolean | null; evidence: string | null };
  needs: { item: string; evidence: string }[];
  red_flags: { type: "fall" | "cannot_get_up" | "chest_pain" | "confusion" | "no_food_or_water" | "other"; evidence: string }[];
  withheld_categories: ("sleep" | "appetite" | "mood" | "pain" | "social" | "medication" | "activity")[];
  summary_pl: string;
}

const scored = (desc: string) => ({
  type: "object",
  additionalProperties: false,
  required: ["value", "evidence"],
  properties: { value: { type: ["integer", "null"], description: desc }, evidence: { type: ["string", "null"] } },
});
const yesNo = (desc: string) => ({
  type: "object",
  additionalProperties: false,
  required: ["value", "evidence"],
  properties: { value: { type: ["boolean", "null"], description: desc }, evidence: { type: ["string", "null"] } },
});

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sleep", "appetite", "mood_self_report", "pain", "pain_location", "social_contact", "medication", "activity", "needs", "red_flags", "withheld_categories", "summary_pl"],
  properties: {
    sleep: scored("Sleep quality 1-5 (1 very bad, 5 very good) as the senior described it; null if not discussed."),
    appetite: scored("Appetite 1-5; null if not discussed."),
    mood_self_report: scored("Mood 1-5 ONLY from what the senior said about themselves; null if not discussed."),
    pain: scored("Pain 0-10 (0 none) as described; null if not discussed."),
    pain_location: { type: ["string", "null"] },
    social_contact: yesNo("Did the senior talk to anyone today (besides this call)? null if not discussed."),
    medication: yesNo("Did the senior take medication as planned? null if not discussed."),
    activity: yesNo("Did the senior leave home today? null if not discussed."),
    needs: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["item", "evidence"], properties: { item: { type: "string", description: "Short Polish noun phrase, e.g. 'Papier toaletowy'" }, evidence: { type: "string" } } },
    },
    red_flags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "evidence"],
        properties: { type: { type: "string", enum: ["fall", "cannot_get_up", "chest_pain", "confusion", "no_food_or_water", "other"] }, evidence: { type: "string" } },
      },
    },
    withheld_categories: { type: "array", items: { type: "string", enum: ["sleep", "appetite", "mood", "pain", "social", "medication", "activity"] } },
    summary_pl: { type: "string", description: "2-3 neutral sentences in Polish for the family. No diagnosis, no advice." },
  },
} as const;

const SYSTEM = `You convert a Polish phone conversation between an AI assistant and an elderly person into a structured record.
Rules:
- Use ONLY what the senior said. If a topic was not discussed, use null. Never guess or infer.
- Every non-null value must have "evidence": a short verbatim quote of the senior's words (Polish, as transcribed).
- Mood comes only from the senior's own words, never from tone.
- red_flags: only if the senior mentions a fall, being unable to get up, chest pain, confusion/disorientation, or having no food/water ("other" for comparably urgent safety issues).
- withheld_categories: topics the senior explicitly asked NOT to pass on to the family.
- needs: concrete things the senior asked for or said they lack.
- summary_pl: neutral, factual, Polish, no medical advice or diagnosis.`;

interface Raw {
  sleep: { value: number | null; evidence: string | null };
  appetite: { value: number | null; evidence: string | null };
  mood_self_report: { value: number | null; evidence: string | null };
  pain: { value: number | null; evidence: string | null };
  pain_location: string | null;
  social_contact: { value: boolean | null; evidence: string | null };
  medication: { value: boolean | null; evidence: string | null };
  activity: { value: boolean | null; evidence: string | null };
  needs: CheckIn["needs"];
  red_flags: CheckIn["red_flags"];
  withheld_categories: CheckIn["withheld_categories"];
  summary_pl: string;
}

const clamp = (v: number | null, lo: number, hi: number) => (v == null ? null : Math.max(lo, Math.min(hi, Math.round(v))));

export async function extractCheckIn(transcript: { role: "ai" | "senior"; text: string }[], opts: { apiKey: string; model: string }): Promise<CheckIn> {
  const text = transcript.map((t) => `${t.role === "ai" ? "ASYSTENT" : "SENIOR"}: ${t.text}`).join("\n");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: text },
      ],
      response_format: { type: "json_schema", json_schema: { name: "check_in", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const raw = JSON.parse(data.choices[0].message.content) as Raw;
  // Scale bounds are enforced here rather than in the schema (portable across providers).
  return {
    sleep: { quality: clamp(raw.sleep.value, 1, 5), evidence: raw.sleep.evidence },
    appetite: { level: clamp(raw.appetite.value, 1, 5), evidence: raw.appetite.evidence },
    mood_self_report: { level: clamp(raw.mood_self_report.value, 1, 5), evidence: raw.mood_self_report.evidence },
    pain: { level: clamp(raw.pain.value, 0, 10), location: raw.pain_location, evidence: raw.pain.evidence },
    social_contact: { talked_to_someone: raw.social_contact.value, evidence: raw.social_contact.evidence },
    medication: { taken_as_planned: raw.medication.value, evidence: raw.medication.evidence },
    activity: { left_home: raw.activity.value, evidence: raw.activity.evidence },
    needs: raw.needs,
    red_flags: raw.red_flags,
    withheld_categories: raw.withheld_categories,
    summary_pl: raw.summary_pl,
  };
}

/** Day status from rules, not from the model: explainable and testable. */
export function dayStatus(c: CheckIn): { status: "ok" | "zadzwon" | "pilne"; reasons: string[] } {
  if (c.red_flags.length) return { status: "pilne", reasons: c.red_flags.map((f) => f.evidence) };
  const reasons: string[] = [];
  if (c.sleep.quality != null && c.sleep.quality <= 2) reasons.push("słaby sen");
  if (c.appetite.level != null && c.appetite.level <= 2) reasons.push("słaby apetyt");
  if (c.mood_self_report.level != null && c.mood_self_report.level <= 2) reasons.push("gorsze samopoczucie");
  if (c.pain.level != null && c.pain.level >= 6) reasons.push(`silny ból${c.pain.location ? ` (${c.pain.location})` : ""}`);
  if (c.medication.taken_as_planned === false) reasons.push("leki nie zgodnie z planem");
  return { status: reasons.length ? "zadzwon" : "ok", reasons };
}
