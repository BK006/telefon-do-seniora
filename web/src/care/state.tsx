import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { IconName, Tone } from "./icons";

export interface QuestionCfg {
  id: string;
  label: string;
  desc: string;
  /** what the agent should find out (goes into the system prompt) */
  ask: string;
  on: boolean;
  ic: IconName;
  c: Tone;
  own?: boolean;
}

export interface CareConfig {
  imie: string;
  forma: string;
  plec: "f" | "m";
  rok: string;
  tel: string;
  relacja: string;
  callerName: string;
  slabiej: boolean;
  krotkie: boolean;
  choroby: string[];
  historia: string;
  leki: { n: string; t: string }[];
  ruch: string[];
  zaint: string[];
  bliscy: string[];
  tematy: string;
  unikac: string[];
  questions: QuestionCfg[];
  dni: boolean[];
  sloty: string[];
  retryH: 1 | 2 | 3;
  retryMax: 1 | 2 | 3;
  zgoda: boolean;
}

export const QDEF: QuestionCfg[] = [
  { id: "sen", label: "Sen", desc: "Jak minęła noc", ask: "jak minęła noc i jaki był sen (dobry / średni / zły, czy były pobudki)", on: true, ic: "moon", c: "blue" },
  { id: "apetyt", label: "Apetyt", desc: "Co dziś jadła", ask: "co było dziś do jedzenia i jak z apetytem", on: true, ic: "fork", c: "orange" },
  { id: "samop", label: "Samopoczucie", desc: "Jak się dziś czuje, jej słowami", ask: "jakie jest dziś samopoczucie — tylko własnymi słowami rozmówcy", on: true, ic: "smile", c: "purple" },
  { id: "bol", label: "Ból", desc: "Czy coś ją boli", ask: "czy coś boli, gdzie i jak mocno (bez dopytywania o diagnozę)", on: true, ic: "heart", c: "red" },
  { id: "leki", label: "Leki", desc: "Czy wzięła leki o swojej porze", ask: "czy leki zostały wzięte o zwykłej porze", on: true, ic: "pill", c: "green" },
  { id: "wyjscie", label: "Wyjście z domu", desc: "Czy była dziś na zewnątrz", ask: "czy było dziś wyjście z domu", on: true, ic: "door", c: "yellow" },
  { id: "kontakt", label: "Kontakt z ludźmi", desc: "Z kim ostatnio rozmawiała", ask: "czy była dziś rozmowa z kimś i z kim", on: true, ic: "people", c: "blue" },
  { id: "potrzeby", label: "Czy czegoś potrzebuje", desc: "Zakupy, lekarstwa, pomoc", ask: "czy czegoś potrzeba (zakupy, leki, pomoc, podwiezienie)", on: true, ic: "bag", c: "orange" },
];

export const SAMPLE: CareConfig = {
  imie: "Halina Kowalska",
  forma: "Pani Halino",
  plec: "f",
  rok: "1946",
  tel: "601 234 567",
  relacja: "Mama",
  callerName: "Kasi",
  slabiej: true,
  krotkie: false,
  choroby: ["Nadciśnienie", "Zwyrodnienie stawów"],
  historia: "Operacja zaćmy w 2021 roku. Od kilku lat bolą ją kolana.",
  leki: [
    { n: "Lek na ciśnienie", t: "08:00" },
    { n: "Witamina D", t: "08:00" },
    { n: "Tabletka na noc", t: "21:00" },
  ],
  ruch: ["Trudności ze schodami"],
  zaint: ["Ogród", "Radio", "Krzyżówki", "Kot", "Wnuki"],
  bliscy: ["Kasia (córka)", "Tomek (syn)", "Zosia (wnuczka)", "Mruczek (kot)"],
  tematy: "Działka i jabłonie, „Lista Przebojów Trójki”, Zosia na studiach w Krakowie, przepisy na ciasto drożdżowe.",
  unikac: ["Śmierć taty", "Polityka"],
  questions: QDEF.map((q) => ({ ...q })),
  dni: [true, true, true, true, true, true, true],
  sloty: ["10:00", "18:00"],
  retryH: 2,
  retryMax: 2,
  zgoda: true,
};

// Blank form for a fresh onboarding: nothing about any person is pre-filled.
export const EMPTY: CareConfig = {
  imie: "",
  forma: "",
  plec: "f",
  rok: "",
  tel: "",
  relacja: "",
  callerName: "",
  slabiej: false,
  krotkie: false,
  choroby: [],
  historia: "",
  leki: [],
  ruch: [],
  zaint: [],
  bliscy: [],
  tematy: "",
  unikac: [],
  questions: QDEF.map((q) => ({ ...q })),
  dni: [true, true, true, true, true, true, true],
  sloty: ["10:00"],
  retryH: 2,
  retryMax: 2,
  zgoda: false,
};

export interface Need {
  t: string;
  src: string;
  done: boolean;
}

export type DashState = "ok" | "zadzwon" | "pilne" | "nieodebrala" | "pusty" | "ladowanie";

interface Store {
  cfg: CareConfig;
  setCfg: (patch: Partial<CareConfig>) => void;
  replaceCfg: (c: CareConfig) => void;
  needs: Need[];
  toggleNeed: (i: number) => void;
  dash: DashState;
  setDash: (d: DashState) => void;
  pause: { on: boolean; until: string; why: string };
  setPause: (p: Partial<Store["pause"]>) => void;
}

const Ctx = createContext<Store | null>(null);

// Per-viewer convenience only (demo config survives reloads); guarded for private mode.
function load<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch {
    return fallback;
  }
}
function save(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function CareProvider({ children }: { children: ReactNode }) {
  const [cfg, setCfgState] = useState<CareConfig>(() => load("tds.care.cfg", EMPTY));
  // Sample needs, shown only in the demo dashboard states.
  const [needs, setNeeds] = useState<Need[]>([
    { t: "Chleb i mleko", src: "z rozmowy 3 paź", done: false },
    { t: "Podwiezienie do lekarza w czwartek, 8 października", src: "z rozmowy 1 paź", done: false },
    { t: "Baterie do pilota", src: "z rozmowy 28 wrz", done: true },
  ]);
  const [dash, setDash] = useState<DashState>("pusty"); // clean start: no calls yet
  const [pause, setPauseState] = useState({ on: false, until: "2026-10-15", why: "Mama jest w sanatorium" });

  useEffect(() => save("tds.care.cfg", cfg), [cfg]);

  return (
    <Ctx.Provider
      value={{
        cfg,
        setCfg: (patch) => setCfgState((c) => ({ ...c, ...patch })),
        replaceCfg: setCfgState,
        needs,
        toggleNeed: (i) => setNeeds((n) => n.map((x, j) => (j === i ? { ...x, done: !x.done } : x))),
        dash,
        setDash,
        pause,
        setPause: (p) => setPauseState((s) => ({ ...s, ...p })),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCare() {
  const s = useContext(Ctx);
  if (!s) throw new Error("CareProvider missing");
  return s;
}

export const DN = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
export const DF = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];

export function daysText(dni: boolean[]) {
  const n = dni.filter(Boolean).length;
  if (n === 7) return "Codziennie";
  if (n === 5 && dni.slice(0, 5).every(Boolean)) return "Od poniedziałku do piątku";
  if (n === 0) return "Nie wybrano dni";
  return "W dni: " + DN.filter((_, i) => dni[i]).join(", ");
}

export function callSummary(c: CareConfig) {
  const proby = (n: number) => (n === 1 ? "raz" : `${n} razy`);
  const kto = c.relacja.toLowerCase() || "osoba";
  return `${daysText(c.dni)} o ${c.sloty.join(" i ")}. Jeśli ${kto} nie odbierze, asystent spróbuje jeszcze ${proby(c.retryMax)}, co ${c.retryH} h.`;
}

export function introSentence(c: CareConfig) {
  return `Dzień dobry, ${c.forma || "Pani Halino"}, tu asystent AI Telefonu do seniora. Dzwonię w imieniu ${c.callerName || "rodziny"}, żeby chwilę porozmawiać. Jestem programem komputerowym, a nie człowiekiem.`;
}
