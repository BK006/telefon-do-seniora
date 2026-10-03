// Pattern-change detection. Deliberately simple and explainable:
//  1. personal norm = median + MAD of the previous 14 days (robust to the odd bad day),
//  2. robust z-score of today vs that norm,
//  3. escalate only when the change persists (several days) or accumulates (CUSUM)
//     across several metrics at once,
//  4. red flags and "no contact" are rule-based and bypass the statistics.
import {
  BOOL_METRICS,
  type BoolMetric,
  CONFIG,
  NUMERIC_METRICS,
  type NumericMetric,
} from "./config.ts";
import type { BoolScore, DayRecord, DayResult, NumericScore, Reason } from "./types.ts";

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Median absolute deviation. */
export function mad(xs: number[]): number | null {
  const m = median(xs);
  if (m === null) return null;
  return median(xs.map((x) => Math.abs(x - m)));
}

/** 1.4826 makes MAD comparable to a standard deviation for normal data. */
export function robustScale(madValue: number, metric: NumericMetric): number {
  return Math.max(1.4826 * madValue, CONFIG.minScale[metric]);
}

/** Positive = worse than this person's norm, in robust standard deviations. */
export function badnessZ(value: number, med: number, madValue: number, metric: NumericMetric): number {
  return (CONFIG.direction[metric] * (med - value)) / robustScale(madValue, metric);
}

function round(x: number | null, digits = 2): number | null {
  if (x === null || !Number.isFinite(x)) return null;
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

/**
 * Evaluate a senior's whole history day by day (records sorted by date, one per day).
 * Each day only looks at the past, exactly like the live pipeline would.
 */
export function evaluateSeries(records: DayRecord[]): DayResult[] {
  const results: DayResult[] = [];
  const cusum = Object.fromEntries(NUMERIC_METRICS.map((m) => [m, 0])) as Record<NumericMetric, number>;
  const streak = Object.fromEntries(NUMERIC_METRICS.map((m) => [m, 0])) as Record<NumericMetric, number>;
  const boolStreak = Object.fromEntries(BOOL_METRICS.map((m) => [m, 0])) as Record<BoolMetric, number>;
  let noContactStreak = 0;

  for (let i = 0; i < records.length; i++) {
    const today = records[i];
    const from = Math.max(0, i - CONFIG.baselineWindowDays);
    // Window = answered days, minus days that were already part of a level-2+ alert.
    // That freezes the norm during an episode, so a slow decline does not quietly become
    // "the new normal". (Excluding every single flagged day instead would shrink the MAD of
    // naturally variable people and cause false alarms — we tested that.)
    const windowIdx = Array.from({ length: i - from }, (_, k) => from + k)
      .filter((j) => records[j].answered && results[j].level < 2);
    const historyDays = records.slice(0, i).filter((r) => r.answered).length;
    const calibrating = historyDays < CONFIG.minHistoryDays;
    const reasons: Reason[] = [];

    noContactStreak = today.answered ? 0 : noContactStreak + 1;

    // ---- numeric metrics ----
    const numeric = {} as Record<NumericMetric, NumericScore>;
    for (const m of NUMERIC_METRICS) {
      const hist = windowIdx
        .map((j) => records[j][m])
        .filter((v): v is number => v !== null);
      const med = hist.length >= CONFIG.minHistoryDays ? median(hist) : null;
      const md = med !== null ? mad(hist) : null;
      const value = today.answered ? today[m] : null;
      let z: number | null = null;
      let flagged = false;

      if (value !== null && med !== null && md !== null) {
        z = badnessZ(value, med, md, m);
        flagged = z >= CONFIG.zFlag;
        // CUSUM only starts once calibration is over.
        if (!calibrating) cusum[m] = Math.max(0, cusum[m] + z - CONFIG.cusumK);
        // Streak counts consecutive answered days with a flag; a normal day resets it,
        // a day without data for this metric (null / no call) leaves it unchanged.
        streak[m] = flagged ? streak[m] + 1 : 0;
      }

      numeric[m] = {
        value,
        median: round(med),
        mad: round(md),
        z: round(z),
        cusum: round(cusum[m]) ?? 0,
        flagged,
        streak: streak[m],
      };

      if (flagged) reasons.push({ kind: "z", metric: m, level: 1 });
      if (streak[m] >= CONFIG.persistDays) {
        reasons.push({ kind: "persist", metric: m, level: 2, days: streak[m] });
      }
    }

    const cusumAlarms = NUMERIC_METRICS.filter((m) => cusum[m] > CONFIG.cusumH);
    for (const m of cusumAlarms) {
      reasons.push({ kind: "cusum", metric: m, level: cusumAlarms.length >= CONFIG.cusumMinMetrics ? 2 : 1 });
    }

    // ---- yes/no metrics ----
    const bool = {} as Record<BoolMetric, BoolScore>;
    for (const m of BOOL_METRICS) {
      const hist = windowIdx
        .map((j) => records[j][m])
        .filter((v): v is boolean => v !== null);
      const rate = hist.length >= CONFIG.minHistoryDays ? hist.filter(Boolean).length / hist.length : null;
      const value = today.answered ? today[m] : null;
      if (value === true) boolStreak[m] = 0;
      else if (value === false && rate !== null && rate >= CONFIG.boolBaselineRate) boolStreak[m] += 1;
      const flagged = boolStreak[m] >= CONFIG.boolStreakDays;
      bool[m] = { value, rate: round(rate), streak: boolStreak[m], flagged };
      if (flagged) {
        const alone = boolStreak[m] >= CONFIG.boolStreakDaysAlone;
        reasons.push({ kind: "bool_streak", metric: m, level: alone ? 2 : 1, days: boolStreak[m] });
      }
    }
    // A yes/no streak corroborated by any other abnormal signal today -> level 2.
    const otherSignals = reasons.filter((r) => r.kind === "z" || r.kind === "cusum" || r.kind === "persist");
    const boolReasons = reasons.filter((r) => r.kind === "bool_streak");
    if (boolReasons.length >= 2 || (boolReasons.length >= 1 && otherSignals.length >= 1)) {
      for (const r of boolReasons) r.level = 2;
    }

    // ---- contact ----
    if (noContactStreak >= CONFIG.noContactDays) {
      reasons.push({ kind: "no_contact", level: 2, days: noContactStreak });
    } else if (noContactStreak === 1) {
      reasons.push({ kind: "missed_call", level: 1, days: 1 });
    }

    // ---- red flags: always urgent, even during calibration ----
    if (today.answered && today.red_flags.length > 0) {
      reasons.push({ kind: "red_flag", level: 3 });
    }

    // ---- final level ----
    let level = reasons.reduce<number>((acc, r) => Math.max(acc, r.level), 0) as 0 | 1 | 2 | 3;
    if (calibrating && level === 2) level = 1; // no level-2 alerts without a personal norm

    let kind: DayResult["kind"] = null;
    if (level === 3) kind = "red_flag";
    else if (level >= 1 && reasons.some((r) => r.kind === "no_contact" || r.kind === "missed_call") &&
      !reasons.some((r) => r.level === 2 && r.kind !== "no_contact")) kind = "no_contact";
    else if (level >= 1) kind = "deviation";

    results.push({
      date: today.date,
      level,
      kind,
      calibrating,
      historyDays,
      noContactStreak,
      numeric,
      bool,
      reasons,
    });
  }
  return results;
}
