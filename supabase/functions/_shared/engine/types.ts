import type { BoolMetric, Metric, NumericMetric } from "./config.ts";

export type RedFlagType =
  | "fall"
  | "cannot_get_up"
  | "chest_pain"
  | "confusion"
  | "no_food_or_water"
  | "other";

export interface RedFlag {
  type: RedFlagType;
  evidence: string;
}

/** One calendar day for one senior. Missing call == answered:false. */
export interface DayRecord {
  date: string; // YYYY-MM-DD
  answered: boolean;
  sleep_quality: number | null;
  appetite: number | null;
  mood: number | null;
  pain: number | null;
  avg_answer_words: number | null;
  talked_to_someone: boolean | null;
  left_home: boolean | null;
  red_flags: RedFlag[];
  /** quotes keyed by consent category: sleep, appetite, mood, pain, social, activity, safety */
  evidence: Record<string, string>;
}

export interface NumericScore {
  value: number | null;
  median: number | null;
  mad: number | null;
  /** "badness" z: positive = worse than usual, regardless of metric direction */
  z: number | null;
  cusum: number;
  flagged: boolean;
  streak: number;
}

export interface BoolScore {
  value: boolean | null;
  rate: number | null; // share of "yes" in the baseline window
  streak: number; // consecutive answered "no" days while usually "yes"
  flagged: boolean;
}

export type ReasonKind = "z" | "persist" | "cusum" | "bool_streak" | "no_contact" | "missed_call" | "red_flag";

export interface Reason {
  kind: ReasonKind;
  metric?: Metric;
  level: 1 | 2 | 3;
  days?: number;
}

export interface DayResult {
  date: string;
  level: 0 | 1 | 2 | 3;
  kind: "deviation" | "red_flag" | "no_contact" | null;
  calibrating: boolean;
  historyDays: number;
  noContactStreak: number;
  numeric: Record<NumericMetric, NumericScore>;
  bool: Record<BoolMetric, BoolScore>;
  reasons: Reason[];
}
