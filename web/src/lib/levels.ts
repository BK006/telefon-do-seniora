import { CircleCheck, Eye, Phone, Siren, type LucideIcon } from "lucide-react";

// Meaning is always carried by icon + text, colour is only a third, redundant cue (WCAG 1.4.1).
export interface LevelMeta {
  level: 0 | 1 | 2 | 3;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** badge classes: tinted background + dark text, AA contrast */
  badge: string;
  dot: string;
  ring: string;
}

export const LEVELS: LevelMeta[] = [
  {
    level: 0,
    label: "Stabilnie",
    hint: "W normie tej osoby",
    icon: CircleCheck,
    badge: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    dot: "bg-emerald-600",
    ring: "ring-emerald-200",
  },
  {
    level: 1,
    label: "Obserwuj",
    hint: "Pojedynczy gorszy sygnał",
    icon: Eye,
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  {
    level: 2,
    label: "Skontaktuj się",
    hint: "W ciągu 24 godzin",
    icon: Phone,
    badge: "bg-orange-100 text-orange-950 ring-orange-300",
    dot: "bg-orange-600",
    ring: "ring-orange-300",
  },
  {
    level: 3,
    label: "Pilne",
    hint: "Natychmiast",
    icon: Siren,
    badge: "bg-red-600 text-white ring-red-700",
    dot: "bg-red-600",
    ring: "ring-red-400",
  },
];

export const STATUS_LABEL: Record<string, string> = {
  new: "Nowy",
  acknowledged: "Przyjęty",
  contacted: "Skontaktowano",
  visit_planned: "Zaplanowana wizyta",
  resolved: "Rozwiązany",
  false_alarm: "Fałszywy alarm",
};

export const STATUS_FLOW = ["new", "acknowledged", "contacted", "visit_planned", "resolved"] as const;
export type AlertStatus = keyof typeof STATUS_LABEL;
