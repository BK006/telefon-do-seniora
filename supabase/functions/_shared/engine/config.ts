// All detection thresholds live here so the team can tune and defend them in one place.
// Pure TypeScript: no Deno/Node APIs, so the same file runs in Edge Functions and Vitest.

export const NUMERIC_METRICS = [
  "sleep_quality",
  "appetite",
  "mood",
  "pain",
  "avg_answer_words",
] as const;
export type NumericMetric = (typeof NUMERIC_METRICS)[number];

export const BOOL_METRICS = ["talked_to_someone", "left_home"] as const;
export type BoolMetric = (typeof BOOL_METRICS)[number];

export type Metric = NumericMetric | BoolMetric;

export const CONFIG = {
  // Personal norm = median + MAD over this many previous days...
  baselineWindowDays: 14,
  // ...and only once we have at least this many answered days (otherwise: calibration).
  minHistoryDays: 7,

  // A day is "worse than usual" for a metric when the robust z-score reaches this.
  zFlag: 2.0,
  // Level 2 via a single metric needs the flag to persist this many answered days in a row.
  persistDays: 3,

  // CUSUM accumulates small, repeated deviations: S = max(0, S + z - k). Alarm when S > h.
  // k = 1.0 targets shifts of ~2 robust SDs; k = 0.5 made naturally variable people drift into alarms.
  cusumK: 1.0,
  cusumH: 4.0,
  // Level 2 via CUSUM needs this many metrics alarming at the same time.
  cusumMinMetrics: 2,

  // Yes/no metrics (talked to someone, left home): a usually-"yes" answer (share >=
  // boolBaselineRate in the window) that is "no" boolStreakDays answered days in a row gives
  // level 1 on its own (it happens by chance ~once a month), and level 2 only together with
  // another signal or once it lasts boolStreakDaysAlone days.
  boolBaselineRate: 0.6,
  boolStreakDays: 3,
  boolStreakDaysAlone: 5,

  // Consecutive days without an answered call (after the same-day retry) -> "no contact".
  noContactDays: 2,

  // MAD can be 0 for very regular people; a floor stops tiny changes from looking huge.
  // Units are the metric's own scale (e.g. sleep quality 1–5).
  minScale: {
    sleep_quality: 0.75,
    appetite: 0.75,
    mood: 0.75,
    pain: 1.0,
    avg_answer_words: 2.5,
  } satisfies Record<NumericMetric, number>,

  // +1: higher is better (a drop is bad). -1: higher is worse (pain).
  direction: {
    sleep_quality: 1,
    appetite: 1,
    mood: 1,
    pain: -1,
    avg_answer_words: 1,
  } satisfies Record<NumericMetric, 1 | -1>,
} as const;

// Consent category each metric belongs to (used for family/centre masking of alerts).
export const METRIC_CATEGORY: Record<Metric, string> = {
  sleep_quality: "sleep",
  appetite: "appetite",
  mood: "mood",
  pain: "pain",
  avg_answer_words: "social",
  talked_to_someone: "social",
  left_home: "activity",
};

export const METRIC_LABEL_PL: Record<Metric, string> = {
  sleep_quality: "Sen",
  appetite: "Apetyt",
  mood: "Samopoczucie (deklarowane)",
  pain: "Ból",
  avg_answer_words: "Długość odpowiedzi",
  talked_to_someone: "Kontakt z ludźmi",
  left_home: "Wyjście z domu",
};

export const LEVEL_LABEL_PL = ["Stabilnie", "Obserwuj", "Skontaktuj się", "Pilne"] as const;
