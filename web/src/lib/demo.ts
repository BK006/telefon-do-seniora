// Demo data source: generates the synthetic dataset in the browser and runs the SAME
// engine code as the Edge Functions (imported via @shared). Used until the Supabase
// seed is loaded, and as an offline fallback for the live presentation.
import { evaluateSeries } from "@shared/engine/detect.ts";
import { deriveEpisodes, type Episode } from "@shared/engine/explain.ts";
import { evaluate, type EvalSummary } from "@shared/engine/evaluate.ts";
import type { DayResult } from "@shared/engine/types.ts";
import { generateSeniors, type SyntheticSenior } from "@shared/synthetic/generate.ts";
import type { AlertStatus } from "./levels";

export interface AlertEvent {
  at: string;
  actor: string;
  from: AlertStatus | null;
  to: AlertStatus;
  note?: string;
}

export interface AlertRecord {
  id: string;
  seniorId: string;
  episode: Episode;
  status: AlertStatus;
  events: AlertEvent[];
}

export interface SeniorView {
  id: string;
  s: SyntheticSenior;
  results: DayResult[];
  age: number;
  /** current priority: today's level, but an open alert keeps its level until a human closes it */
  level: 0 | 1 | 2 | 3;
  reason: string | null;
  calibrating: boolean;
  lastContact: string | null;
  daysSinceContact: number;
}

export interface Dataset {
  today: string;
  seniors: SeniorView[];
  alerts: AlertRecord[];
  evaluation: EvalSummary;
}

export const STAFF_NAME = "Anna Wiśniewska";

export function localToday() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function buildDataset(today = localToday()): Dataset {
  const raw = generateSeniors(today).filter((s) => s.center === "krakow");
  const seniors: SeniorView[] = [];
  const alerts: AlertRecord[] = [];
  const evalInputs = [];

  for (const s of raw) {
    const results = evaluateSeries(s.days);
    const episodes = deriveEpisodes(s.days, results);
    evalInputs.push({ key: s.key, scenario: s.scenario, dates: s.days.map((d) => d.date), expected: s.expected, episodes });

    episodes.forEach((e, i) => {
      const closed = e.endedOn !== null;
      const events: AlertEvent[] = [{ at: `${e.detectedOn}T10:30`, actor: "System", from: null, to: "new", note: "Alert wygenerowany automatycznie." }];
      if (closed) {
        events.push(
          { at: `${e.detectedOn}T11:05`, actor: STAFF_NAME, from: "new", to: "acknowledged", note: "Przyjęte do obsługi." },
          { at: `${e.detectedOn}T12:40`, actor: STAFF_NAME, from: "acknowledged", to: "contacted", note: "Rozmowa telefoniczna z seniorem." },
          { at: `${e.endedOn}T15:00`, actor: STAFF_NAME, from: "contacted", to: "resolved", note: "Sytuacja wyjaśniona, wskaźniki wróciły do normy." },
        );
      }
      alerts.push({ id: `${s.key}-a${i}`, seniorId: s.key, episode: e, status: closed ? "resolved" : "new", events });
    });

    const last = results[results.length - 1];
    const open = episodes.filter((e) => e.endedOn === null);
    const level = Math.max(last.level, ...open.map((e) => e.level)) as 0 | 1 | 2 | 3;
    const lastAnswered = [...s.days].reverse().find((d) => d.answered)?.date ?? null;
    seniors.push({
      id: s.key,
      s,
      results,
      age: 2026 - s.birth_year,
      level,
      reason:
        open[0]?.explanation.headline ??
        (last.level === 1
          ? last.reasons.some((r) => r.kind === "missed_call")
            ? "Nie odebrał(a) dziś — ponowna próba po południu"
            : "Pojedynczy gorszy sygnał"
          : last.calibrating
            ? `Kalibracja normy (${last.historyDays}/7 dni)`
            : null),
      calibrating: last.calibrating,
      lastContact: lastAnswered,
      daysSinceContact: lastAnswered ? dayDiff(lastAnswered, today) : 99,
    });
  }

  return { today, seniors, alerts, evaluation: evaluate(evalInputs) };
}

export function sortByPriority(list: SeniorView[]) {
  return [...list].sort(
    (a, b) => b.level - a.level || b.daysSinceContact - a.daysSinceContact || a.s.display_name.localeCompare(b.s.display_name, "pl"),
  );
}
