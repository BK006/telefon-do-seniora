import { evaluateSeries } from "../supabase/functions/_shared/engine/detect.ts";
import { deriveEpisodes } from "../supabase/functions/_shared/engine/explain.ts";
import { evaluate } from "../supabase/functions/_shared/engine/evaluate.ts";
import { generateSeniors } from "../supabase/functions/_shared/synthetic/generate.ts";
for (const [label, filter] of [["all 30", () => true], ["Kraków 26 (panel)", (s: { center: string }) => s.center === "krakow"]] as const) {
  const seniors = generateSeniors("2026-10-03").filter(filter);
  const r = evaluate(seniors.map((s) => { const res = evaluateSeries(s.days); return { key: s.key, scenario: s.scenario, dates: s.days.map((d) => d.date), expected: s.expected, episodes: deriveEpisodes(s.days, res) }; }));
  console.log(label, { seniors: seniors.length, seniorDays: r.seniorDays, detected: `${r.truePositives}/${r.positives}`, falseAlarms: r.falseAlarms, precision: r.precision, meanDelay: r.meanDelayDays });
}
