import { evaluateSeries } from "../supabase/functions/_shared/engine/detect.ts";
import { deriveEpisodes } from "../supabase/functions/_shared/engine/explain.ts";
import { generateSeniors } from "../supabase/functions/_shared/synthetic/generate.ts";
for (const s of generateSeniors("2026-10-03")) {
  const r = evaluateSeries(s.days);
  const eps = deriveEpisodes(s.days, r);
  const lv = r.map((x) => x.level).join("");
  const ex = s.expected.join("");
  console.log(s.key, s.scenario.padEnd(17), lv, ex, eps.map((e) => `${e.kind}@${e.detectedOn.slice(5)}`).join(" "));
  if (eps.length && ["stable","noisy_normal","chronic_pain"].includes(s.scenario)) {
    for (const x of r) if (x.level>=2) console.log("   ", x.date, JSON.stringify(x.reasons));
  }
}
