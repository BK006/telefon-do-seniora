// Episode-level evaluation against labelled synthetic scenarios.
// A "true" case is a senior/scenario whose labels reach level >= 2 at some day.
// An engine episode counts as a hit if it is detected no earlier than 2 days before
// the first labelled level-2 day (small tolerance for early but correct detection).
// Any other engine episode is a false alarm.
import type { Episode } from "./explain.ts";

export interface EvalInput {
  key: string;
  scenario: string;
  dates: string[];
  expected: number[];
  episodes: Episode[];
}

export interface EvalCaseResult {
  key: string;
  scenario: string;
  expectedAlert: boolean;
  detected: boolean;
  delayDays: number | null;
  falseAlarms: number;
}

export interface EvalSummary {
  cases: EvalCaseResult[];
  positives: number;
  truePositives: number;
  recall: number;
  episodes: number;
  falseAlarms: number;
  precision: number;
  seniorDays: number;
  falseAlarmsPer100SeniorDays: number;
  meanDelayDays: number | null;
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function evaluate(inputs: EvalInput[]): EvalSummary {
  const cases: EvalCaseResult[] = [];
  let seniorDays = 0;
  for (const s of inputs) {
    seniorDays += s.dates.length;
    const firstIdx = s.expected.findIndex((l) => l >= 2);
    const firstDate = firstIdx >= 0 ? s.dates[firstIdx] : null;
    let detected = false;
    let delay: number | null = null;
    let falseAlarms = 0;
    for (const e of s.episodes) {
      const ok = firstDate !== null && dayDiff(firstDate, e.detectedOn) >= -2;
      if (ok && !detected) {
        detected = true;
        delay = Math.max(0, dayDiff(firstDate!, e.detectedOn));
      } else if (!ok) {
        falseAlarms++;
      }
    }
    cases.push({ key: s.key, scenario: s.scenario, expectedAlert: firstDate !== null, detected, delayDays: delay, falseAlarms });
  }
  const positives = cases.filter((c) => c.expectedAlert).length;
  const tp = cases.filter((c) => c.expectedAlert && c.detected).length;
  const fa = cases.reduce((a, c) => a + c.falseAlarms, 0);
  const episodes = tp + fa;
  const delays = cases.map((c) => c.delayDays).filter((d): d is number => d !== null);
  return {
    cases,
    positives,
    truePositives: tp,
    recall: positives ? tp / positives : 1,
    episodes,
    falseAlarms: fa,
    precision: episodes ? tp / episodes : 1,
    seniorDays,
    falseAlarmsPer100SeniorDays: (fa / seniorDays) * 100,
    meanDelayDays: delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null,
  };
}
