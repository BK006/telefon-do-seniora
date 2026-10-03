import { describe, expect, it } from "vitest";
import { evaluateSeries, mad, median } from "../supabase/functions/_shared/engine/detect.ts";
import { deriveEpisodes } from "../supabase/functions/_shared/engine/explain.ts";
import { evaluate } from "../supabase/functions/_shared/engine/evaluate.ts";
import type { DayRecord } from "../supabase/functions/_shared/engine/types.ts";
import { generateSeniors, type Scenario } from "../supabase/functions/_shared/synthetic/generate.ts";

const END = "2026-10-03";
const seniors = generateSeniors(END);
const run = (key: string) => {
  const s = seniors.find((x) => x.key === key)!;
  const results = evaluateSeries(s.days);
  return { s, results, episodes: deriveEpisodes(s.days, results) };
};
const byScenario = (sc: Scenario) => seniors.filter((s) => s.scenario === sc).map((s) => run(s.key));

function day(date: string, over: Partial<DayRecord> = {}): DayRecord {
  return {
    date, answered: true, sleep_quality: 4, appetite: 4, mood: 4, pain: 1, avg_answer_words: 12,
    talked_to_someone: true, left_home: true, red_flags: [], evidence: {}, ...over,
  };
}
const dates = (n: number) => Array.from({ length: n }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}`);

describe("robust statistics", () => {
  it("median and MAD", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(mad([4, 4, 4, 2])).toBe(0);
    expect(mad([1, 2, 3, 4, 5])).toBe(1);
  });
});

describe("rules on hand-made series", () => {
  it("a single bad day gives at most level 1", () => {
    const recs = dates(15).map((d, i) => day(d, i === 14 ? { sleep_quality: 1, appetite: 1 } : {}));
    const r = evaluateSeries(recs);
    expect(r[14].level).toBe(1);
  });

  it("calibration: no level 2 before 7 days of history, but red flags still escalate", () => {
    const recs = dates(5).map((d, i) => day(d, i >= 2 ? { sleep_quality: 1 } : {}));
    recs[4].red_flags = [{ type: "fall", evidence: "Przewróciłam się w łazience." }];
    const r = evaluateSeries(recs);
    expect(r.slice(0, 4).every((x) => x.level <= 1)).toBe(true);
    expect(r[4].level).toBe(3);
  });

  it("persistent deviation for 3 days escalates to level 2", () => {
    const recs = dates(20).map((d, i) => day(d, i >= 17 ? { sleep_quality: 1 } : {}));
    const r = evaluateSeries(recs);
    expect(r[16].level).toBe(0);
    expect(r[19].level).toBe(2);
    expect(r[19].kind).toBe("deviation");
  });

  it("two days without answer -> level 2 'no contact', not 'deterioration'", () => {
    const recs = dates(16).map((d, i) => day(d, i >= 14 ? { answered: false } : {}));
    const r = evaluateSeries(recs);
    expect(r[14].level).toBe(1);
    expect(r[15].level).toBe(2);
    expect(r[15].kind).toBe("no_contact");
  });
});

describe("synthetic scenarios", () => {
  it("stable seniors never reach level 2", () => {
    for (const { s, results } of byScenario("stable")) {
      expect(Math.max(...results.map((r) => r.level)), s.display_name).toBeLessThan(2);
    }
  });

  it("noisy-but-normal and chronic-pain seniors do NOT alert", () => {
    for (const { s, episodes } of [...byScenario("noisy_normal"), ...byScenario("chronic_pain")]) {
      expect(episodes.length, s.display_name).toBe(0);
    }
  });

  it("gradual decline is detected with an explanation and quotes", () => {
    for (const { s, episodes } of byScenario("gradual_decline")) {
      const e = episodes.find((x) => x.kind === "deviation");
      expect(e, s.display_name).toBeDefined();
      expect(e!.explanation.items.length).toBeGreaterThan(0);
      expect(e!.explanation.quotes.length).toBeGreaterThan(0);
    }
  });

  it("withdrawal is detected", () => {
    for (const { s, episodes } of byScenario("withdrawal")) {
      expect(episodes.some((x) => x.kind === "deviation"), s.display_name).toBe(true);
    }
  });

  it("sudden confusion -> immediate level 3", () => {
    for (const { s, results } of byScenario("sudden_confusion")) {
      expect(results[s.onset!].level).toBe(3);
    }
  });

  it("stops answering -> no_contact episode", () => {
    for (const { s, episodes } of byScenario("stops_answering")) {
      expect(episodes.some((x) => x.kind === "no_contact"), s.display_name).toBe(true);
    }
  });

  it("new enrolment stays in calibration", () => {
    for (const { results } of byScenario("new_enrolment")) {
      expect(results.every((r) => r.calibrating)).toBe(true);
    }
  });

  it("evaluation set: full recall, zero false alarms", () => {
    const summary = evaluate(seniors.map((s) => {
      const { episodes } = run(s.key);
      return { key: s.key, scenario: s.scenario, dates: s.days.map((d) => d.date), expected: s.expected, episodes };
    }));
    expect(summary.recall).toBe(1);
    expect(summary.falseAlarms).toBe(0);
  });
});
