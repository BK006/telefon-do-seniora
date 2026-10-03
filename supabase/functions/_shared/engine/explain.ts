// Turns engine output into alerts with human-readable explanations.
// Every sentence here is computed from data (values, norms, day counts, quotes) —
// no language model is involved, so the explanation cannot "make things up".
import {
  type BoolMetric,
  CONFIG,
  LEVEL_LABEL_PL,
  type Metric,
  METRIC_CATEGORY,
  METRIC_LABEL_PL,
  type NumericMetric,
} from "./config.ts";
import type { DayRecord, DayResult, RedFlagType } from "./types.ts";

export interface ExplanationItem {
  metric: Metric | "contact" | "safety";
  label: string;
  text: string;
  days?: number;
}

export interface Quote {
  date: string;
  category: string;
  text: string;
}

export interface Explanation {
  headline: string;
  level_label: string;
  items: ExplanationItem[];
  quotes: Quote[];
  checklist: string[];
}

export interface Episode {
  kind: "deviation" | "red_flag" | "no_contact";
  level: 2 | 3;
  startedOn: string;
  detectedOn: string;
  endedOn: string | null; // null = still ongoing on the last day
  categories: string[];
  explanation: Explanation;
}

const RED_FLAG_PL: Record<RedFlagType, string> = {
  fall: "upadek",
  cannot_get_up: "nie może wstać",
  chest_pain: "ból w klatce piersiowej",
  confusion: "dezorientacja / zagubienie",
  no_food_or_water: "brak jedzenia lub wody",
  other: "inny sygnał niepokoju",
};

const SCALE_SUFFIX: Record<NumericMetric, string> = {
  sleep_quality: "/5",
  appetite: "/5",
  mood: "/5",
  pain: "/10",
  avg_answer_words: " słów",
};

const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1).replace(".", ","));

function dayWord(n: number) {
  return n === 1 ? "dzień" : "dni";
}

// Checklists are next steps for a human, never medical advice.
const CHECKLIST: Record<Episode["kind"], string[]> = {
  deviation: [
    "Zadzwoń do seniora z numeru ośrodka i zapytaj, jak się czuje.",
    "Zapytaj, czy ma zapas jedzenia i potrzebnych leków oraz czy ktoś go odwiedza.",
    "Jeśli rozmowa potwierdza zmianę — zaplanuj wizytę w ciągu 24 godzin.",
    "W razie potrzeby poinformuj rodzinę (w zakresie zgody) lub lekarza rodzinnego seniora.",
    "Zapisz wynik kontaktu w dzienniku działań.",
  ],
  red_flag: [
    "Zadzwoń do seniora natychmiast.",
    "Jeśli senior nie odbiera lub potwierdza zagrożenie — wezwij pomoc (112) lub zorganizuj pilną wizytę.",
    "Powiadom osobę kontaktową z rodziny.",
    "Zapisz przebieg w dzienniku działań.",
  ],
  no_contact: [
    "Zadzwoń z numeru ośrodka (inny numer niż asystent).",
    "Skontaktuj się z rodziną lub sąsiadem z listy kontaktów.",
    "Jeśli do końca dnia brak kontaktu — zaplanuj wizytę domową.",
    "Zapisz wynik w dzienniku działań.",
  ],
};

function describeDay(day: DayResult): ExplanationItem[] {
  const items: ExplanationItem[] = [];
  const seen = new Set<string>();
  for (const r of day.reasons) {
    if (r.kind === "missed_call") continue;
    if (r.kind === "no_contact") {
      items.push({
        metric: "contact",
        label: "Brak kontaktu",
        text: `Senior nie odebrał telefonu od ${r.days} ${dayWord(r.days!)} (w tym ponowne próby tego samego dnia).`,
        days: r.days,
      });
      continue;
    }
    if (r.kind === "red_flag") continue; // described separately with the quote
    const m = r.metric!;
    if (seen.has(m)) continue;
    seen.add(m);

    if (m === "talked_to_someone" || m === "left_home") {
      const b = day.bool[m as BoolMetric];
      const usual = Math.round((b.rate ?? 0) * 100);
      const what = m === "talked_to_someone" ? "nie rozmawiał(a) z nikim" : "nie wychodził(a) z domu";
      items.push({
        metric: m,
        label: METRIC_LABEL_PL[m],
        text: `Od ${b.streak} ${dayWord(b.streak)} ${what}; zwykle „tak” w ${usual}% dni.`,
        days: b.streak,
      });
      continue;
    }

    const nm = m as NumericMetric;
    const s = day.numeric[nm];
    if (s.value === null || s.median === null) continue;
    const parts = [
      `${fmt(s.value)}${SCALE_SUFFIX[nm]}, zwykle ${fmt(s.median)}${SCALE_SUFFIX[nm]} (mediana z ${CONFIG.baselineWindowDays} dni)`,
    ];
    if (s.z !== null) parts.push(`odchylenie ${fmt(Math.round(s.z * 10) / 10)} od normy`);
    if (s.streak >= 2) parts.push(`od ${s.streak} ${dayWord(s.streak)} z rzędu`);
    else if (r.kind === "cusum") parts.push("narastające w ostatnich dniach");
    items.push({ metric: nm, label: METRIC_LABEL_PL[nm], text: parts.join(", ") + ".", days: s.streak || undefined });
  }
  return items;
}

function collectQuotes(records: DayRecord[], from: string, to: string, categories: string[], max = 4): Quote[] {
  const quotes: Quote[] = [];
  for (const r of [...records].reverse()) {
    if (r.date > to || r.date < from || !r.answered) continue;
    for (const c of categories) {
      const t = r.evidence[c];
      if (t) quotes.push({ date: r.date, category: c, text: t });
    }
    if (quotes.length >= max) break;
  }
  return quotes.slice(0, max);
}

function headlineFor(kind: Episode["kind"], items: ExplanationItem[], days: number): string {
  if (kind === "no_contact") return `Brak kontaktu od ${days} ${dayWord(days)}`;
  const labels = items.filter((i) => i.metric !== "contact").map((i) => i.label.toLowerCase());
  const list = labels.length > 2 ? `${labels.slice(0, 2).join(", ")} i inne` : labels.join(" i ");
  return `Zmiana wzorca: ${list || "kilka wskaźników"} — od ${days} ${dayWord(days)}`;
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) + 1;
}

/** Group daily results into alert episodes (level >= 2). */
export function deriveEpisodes(records: DayRecord[], results: DayResult[]): Episode[] {
  const episodes: Episode[] = [];
  let open: { kind: "deviation" | "no_contact"; startIdx: number; detectIdx: number; peakIdx: number } | null = null;

  const close = (endIdx: number | null) => {
    if (!open) return;
    const lastIdx = endIdx ?? results.length - 1;
    const detail = results[open.peakIdx];
    let items = describeDay(detail);
    if (items.length === 0) items = describeDay(results[open.detectIdx]);
    const metrics = items.map((i) => i.metric).filter((m): m is Metric => m in METRIC_CATEGORY);
    const categories = open.kind === "no_contact" ? ["safety"] : [...new Set(metrics.map((m) => METRIC_CATEGORY[m]))];
    const startedOn = results[open.startIdx].date;
    const lastDate = results[lastIdx].date;
    const days = open.kind === "no_contact" ? results[lastIdx].noContactStreak || 2 : daysBetween(startedOn, lastDate);
    episodes.push({
      kind: open.kind,
      level: 2,
      startedOn,
      detectedOn: results[open.detectIdx].date,
      endedOn: endIdx === null ? null : results[endIdx].date,
      categories,
      explanation: {
        headline: headlineFor(open.kind, items, days),
        level_label: LEVEL_LABEL_PL[2],
        items,
        quotes: open.kind === "no_contact" ? [] : collectQuotes(records, startedOn, lastDate, categories),
        checklist: CHECKLIST[open.kind],
      },
    });
    open = null;
  };

  for (let i = 0; i < results.length; i++) {
    const d = results[i];

    if (d.level === 3) {
      const rec = records[i];
      const flags = rec.red_flags;
      episodes.push({
        kind: "red_flag",
        level: 3,
        startedOn: d.date,
        detectedOn: d.date,
        // A red flag stays open until a human closes it; for history we treat it as handled
        // only once three calm days have followed.
        endedOn: i <= results.length - 4 ? d.date : null,
        categories: ["safety"],
        explanation: {
          headline: `Sygnał pilny: ${flags.map((f) => RED_FLAG_PL[f.type]).join(", ")}`,
          level_label: LEVEL_LABEL_PL[3],
          items: flags.map((f) => ({
            metric: "safety" as const,
            label: "Czerwona flaga",
            text: `W rozmowie padło: ${RED_FLAG_PL[f.type]}. Asystent poinformował o numerze 112.`,
          })),
          quotes: flags.map((f) => ({ date: d.date, category: "safety", text: f.evidence })),
          checklist: CHECKLIST.red_flag,
        },
      });
    }

    const kind = d.level >= 2 && d.kind !== "red_flag" ? d.kind : null;
    if (open && (d.level === 0 || (kind && kind !== open.kind))) close(i - 1 >= open.startIdx ? i - 1 : null);
    if (kind && (kind === "deviation" || kind === "no_contact") && !open) {
      // Episode starts at the first day of the run of non-zero levels leading up to it.
      let s = i;
      while (s > 0 && results[s - 1].level >= 1 && results[s - 1].kind === kind) s--;
      open = { kind, startIdx: s, detectIdx: i, peakIdx: i };
    }
    if (open && d.level >= 2 && d.reasons.length >= results[open.peakIdx].reasons.length) open.peakIdx = i;
  }
  close(null);
  return episodes;
}
