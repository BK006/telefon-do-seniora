// Deterministic synthetic data: 30 fictional seniors x 30 days of daily check-ins.
// No real people. Same seed -> same data, so tests, evaluation and the demo agree.
import type { DayRecord, RedFlag } from "../engine/types.ts";

export type Scenario =
  | "stable"
  | "noisy_normal" // often has a worse day, but that's their norm -> must NOT alert
  | "chronic_pain" // high pain every day, stable -> must NOT alert
  | "gradual_decline" // sleep + appetite slowly worsen
  | "withdrawal" // shorter answers, stops talking to people
  | "sudden_confusion" // one-day red flag
  | "stops_answering" // last days without contact
  | "new_enrolment"; // only a few days of history -> calibration

export interface SyntheticSenior {
  key: string;
  display_name: string;
  gender: "f" | "m";
  birth_year: number;
  city: string;
  persona: string;
  phone_masked: string;
  scenario: Scenario;
  center: "krakow" | "wieliczka";
  /** day index (0..days-1) when the scenario's change begins */
  onset: number | null;
  family_consent: string[];
  days: DayRecord[];
  /** expected alert level per day (ground truth for evaluation) */
  expected: number[];
  /** short transcripts, aligned with days (null when not answered) */
  transcripts: ({ role: "agent" | "senior"; text: string }[] | null)[];
  summaries: (string | null)[];
}

// ---------- RNG ----------
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- phrase banks (index by gender: [female, male]) ----------
type G = [string, string];
const pick = <T,>(rnd: () => number, xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const g = (p: G, gender: "f" | "m") => (gender === "f" ? p[0] : p[1]);

const SLEEP: Record<number, G[]> = {
  1: [["Prawie nie spałam, całą noc przewracałam się z boku na bok.", "Prawie nie spałem, całą noc przewracałem się z boku na bok."]],
  2: [
    ["Kiepsko spałam, budziłam się co chwilę.", "Kiepsko spałem, budziłem się co chwilę."],
    ["Oj, noc była ciężka, zasnęłam dopiero nad ranem.", "Oj, noc była ciężka, zasnąłem dopiero nad ranem."],
  ],
  3: [["Tak sobie, raz lepiej, raz gorzej.", "Tak sobie, raz lepiej, raz gorzej."], ["Średnio, ale da się żyć.", "Średnio, ale da się żyć."]],
  4: [["Spałam dobrze, tylko raz wstałam w nocy.", "Spałem dobrze, tylko raz wstałem w nocy."], ["Nie narzekam, wyspałam się.", "Nie narzekam, wyspałem się."]],
  5: [["Spałam jak dziecko!", "Spałem jak dziecko!"], ["Bardzo dobrze, aż się zdziwiłam.", "Bardzo dobrze, aż się zdziwiłem."]],
};
const APPETITE: Record<number, G[]> = {
  1: [["Nic mi nie smakuje, nic dziś nie jadłam.", "Nic mi nie smakuje, nic dziś nie jadłem."]],
  2: [["Zjadłam tylko trochę zupy, jakoś nie mam ochoty.", "Zjadłem tylko trochę zupy, jakoś nie mam ochoty."], ["Herbatę wypiłam i tyle.", "Herbatę wypiłem i tyle."]],
  3: [["Coś tam zjadłam, kanapkę.", "Coś tam zjadłem, kanapkę."]],
  4: [["Zjadłam obiad, pierogi sobie odgrzałam.", "Zjadłem obiad, pierogi sobie odgrzałem."], ["Normalnie, śniadanie i obiad.", "Normalnie, śniadanie i obiad."]],
  5: [["Apetyt dopisuje, ugotowałam rosół.", "Apetyt dopisuje, ugotowałem rosół."]],
};
const MOOD: Record<number, G[]> = {
  1: [["Źle się czuję, nic mi się nie chce.", "Źle się czuję, nic mi się nie chce."]],
  2: [["Smutno mi dzisiaj trochę.", "Smutno mi dzisiaj trochę."], ["Nie najlepiej, jakoś tak przygnębiająco.", "Nie najlepiej, jakoś tak przygnębiająco."]],
  3: [["Tak normalnie, bez rewelacji.", "Tak normalnie, bez rewelacji."]],
  4: [["Dobrze, dziękuję, że pani dzwoni.", "Dobrze, dziękuję, że pani dzwoni."]],
  5: [["Świetnie! Słońce świeci, to i humor jest.", "Świetnie! Słońce świeci, to i humor jest."]],
};
const PAIN_LOW: G[] = [["Nic mnie nie boli, chwała Bogu.", "Nic mnie nie boli, chwała Bogu."]];
const PAIN_MID: G[] = [["Kolano trochę dokucza, jak zawsze.", "Kolano trochę dokucza, jak zawsze."], ["Plecy bolą, ale to nic nowego.", "Plecy bolą, ale to nic nowego."]];
const PAIN_HIGH: G[] = [["Biodro boli mocno, ciężko chodzić.", "Biodro boli mocno, ciężko chodzić."]];
const SOCIAL_YES: G[] = [
  ["Sąsiadka zajrzała na kawę.", "Sąsiad zajrzał, pogadaliśmy chwilę."],
  ["Córka dzwoniła rano.", "Syn dzwonił rano."],
  ["Byłam w klubie seniora.", "Byłem w klubie seniora."],
];
const SOCIAL_NO: G[] = [["Nie, z nikim dziś nie rozmawiałam.", "Nie, z nikim dziś nie rozmawiałem."], ["Nikt nie dzwonił.", "Nikt nie dzwonił."]];
const ACTIVITY_YES: G[] = [["Byłam w sklepie po chleb.", "Byłem w sklepie po chleb."], ["Wyszłam na krótki spacer.", "Wyszedłem na krótki spacer."]];
const ACTIVITY_NO: G[] = [["Nie wychodziłam, nie miałam siły.", "Nie wychodziłem, nie miałem siły."]];
const WITHDRAWN_SHORT: G[] = [["Nie wiem.", "Nie wiem."], ["Może.", "Może."], ["Jakoś leci.", "Jakoś leci."]];

// ---------- roster ----------
interface Spec {
  name: string;
  gender: "f" | "m";
  age: number;
  city: string;
  persona: string;
  scenario: Scenario;
  center?: "krakow" | "wieliczka";
  onset?: number;
  base?: Partial<Record<"sleep" | "appetite" | "mood" | "pain" | "words", number>>;
  family?: string[];
}

const ROSTER: Spec[] = [
  { name: "Halina K.", gender: "f", age: 81, city: "Kraków", persona: "Gadatliwa, dużo opowiada o wnukach.", scenario: "gradual_decline", onset: 19, family: ["sleep", "appetite", "social", "activity", "safety"] },
  { name: "Zbigniew W.", gender: "m", age: 78, city: "Kraków", persona: "Konkretny, odpowiada krótko, były kolejarz.", scenario: "stable", base: { words: 7 } },
  { name: "Krystyna M.", gender: "f", age: 84, city: "Kraków", persona: "Ciepła, zawsze pyta o pogodę.", scenario: "withdrawal", onset: 17 },
  { name: "Stanisław P.", gender: "m", age: 86, city: "Kraków", persona: "Lubi żartować, słabo słyszy.", scenario: "sudden_confusion", onset: 28 },
  { name: "Teresa N.", gender: "f", age: 76, city: "Kraków", persona: "Nerwowa, często narzeka, ale szybko się uspokaja.", scenario: "noisy_normal" },
  { name: "Jan D.", gender: "m", age: 89, city: "Kraków", persona: "Wdowiec, mieszka sam w kamienicy.", scenario: "stops_answering", onset: 27 },
  { name: "Danuta S.", gender: "f", age: 80, city: "Kraków", persona: "Pogodna, chodzi do klubu seniora.", scenario: "stable" },
  { name: "Ryszard G.", gender: "m", age: 74, city: "Kraków", persona: "Ma przewlekły ból biodra, nie lubi o tym mówić.", scenario: "chronic_pain", base: { pain: 6 } },
  { name: "Barbara L.", gender: "f", age: 83, city: "Kraków", persona: "Dokładna, liczy godziny snu.", scenario: "stable" },
  { name: "Henryk Z.", gender: "m", age: 82, city: "Kraków", persona: "Mrukliwy, ale lubi te rozmowy.", scenario: "noisy_normal", base: { words: 8 } },
  { name: "Irena C.", gender: "f", age: 87, city: "Kraków", persona: "Bardzo grzeczna, nie chce nikomu robić kłopotu.", scenario: "gradual_decline", onset: 16 },
  { name: "Tadeusz B.", gender: "m", age: 79, city: "Kraków", persona: "Działkowiec, dużo czasu spędza na zewnątrz.", scenario: "stable" },
  { name: "Maria J.", gender: "f", age: 91, city: "Kraków", persona: "Najstarsza w grupie, mówi powoli.", scenario: "stable", base: { words: 9 } },
  { name: "Edward F.", gender: "m", age: 77, city: "Kraków", persona: "Samotny po śmierci żony, małomówny.", scenario: "withdrawal", onset: 15, base: { words: 11 } },
  { name: "Genowefa R.", gender: "f", age: 85, city: "Kraków", persona: "Śpiewa w chórze parafialnym.", scenario: "stable" },
  { name: "Władysław T.", gender: "m", age: 83, city: "Kraków", persona: "Były nauczyciel, lubi długie odpowiedzi.", scenario: "stable", base: { words: 22 } },
  { name: "Zofia H.", gender: "f", age: 79, city: "Kraków", persona: "Opiekuje się kotem, często o nim mówi.", scenario: "noisy_normal" },
  { name: "Kazimierz O.", gender: "m", age: 88, city: "Kraków", persona: "Weteran, dumny i niezależny.", scenario: "sudden_confusion", onset: 22 },
  { name: "Jadwiga E.", gender: "f", age: 82, city: "Kraków", persona: "Ma cukrzycę, pilnuje posiłków.", scenario: "stable" },
  { name: "Mieczysław U.", gender: "m", age: 80, city: "Kraków", persona: "Lubi radio i wiadomości.", scenario: "stable" },
  { name: "Elżbieta A.", gender: "f", age: 75, city: "Kraków", persona: "Niedawno zapisana do programu.", scenario: "new_enrolment", onset: 25 },
  { name: "Józef I.", gender: "m", age: 84, city: "Kraków", persona: "Nie lubi telefonów, ale odbiera.", scenario: "stops_answering", onset: 28 },
  { name: "Wanda Y.", gender: "f", age: 86, city: "Kraków", persona: "Często ma gorsze noce, to jej norma.", scenario: "noisy_normal", base: { sleep: 3 } },
  { name: "Czesław V.", gender: "m", age: 81, city: "Kraków", persona: "Spokojny, systematyczny.", scenario: "stable" },
  { name: "Stefania Ł.", gender: "f", age: 90, city: "Kraków", persona: "Ma ból pleców od lat.", scenario: "chronic_pain", base: { pain: 5 } },
  { name: "Leszek Ż.", gender: "m", age: 76, city: "Kraków", persona: "Majsterkowicz.", scenario: "stable" },
  // A second centre — only to demonstrate RLS isolation between centres.
  { name: "Aniela P.", gender: "f", age: 83, city: "Wieliczka", persona: "Mieszka na wsi pod Wieliczką.", scenario: "stable", center: "wieliczka" },
  { name: "Bronisław K.", gender: "m", age: 85, city: "Wieliczka", persona: "Hoduje kury.", scenario: "gradual_decline", onset: 18, center: "wieliczka" },
  { name: "Celina M.", gender: "f", age: 78, city: "Wieliczka", persona: "Pogodna i rozmowna.", scenario: "stable", center: "wieliczka" },
  { name: "Dariusz W.", gender: "m", age: 74, city: "Wieliczka", persona: "Niedawno owdowiał.", scenario: "noisy_normal", center: "wieliczka" },
];

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Small noise around a centre value: mostly the centre, sometimes +-1. */
function around(rnd: () => number, centre: number, spread: number) {
  const r = rnd();
  if (r < spread / 2) return centre - 1;
  if (r < spread) return centre + 1;
  return centre;
}

export function generateSeniors(endDate: string, days = 30, seed = 2026): SyntheticSenior[] {
  return ROSTER.map((spec, idx) => {
    const rnd = mulberry32(seed + idx * 7919);
    const startDay = spec.scenario === "new_enrolment" ? (spec.onset ?? 25) : 0;
    const out: SyntheticSenior = {
      key: `s${String(idx + 1).padStart(2, "0")}`,
      display_name: spec.name,
      gender: spec.gender,
      birth_year: 2026 - spec.age,
      city: spec.city,
      persona: spec.persona,
      phone_masked: `+48 *** *** ${String(100 + Math.floor(rnd() * 900))}`,
      scenario: spec.scenario,
      center: spec.center ?? "krakow",
      onset: spec.onset ?? null,
      family_consent: spec.family ?? (rnd() < 0.5 ? ["sleep", "appetite", "social", "safety"] : ["safety"]),
      days: [],
      expected: [],
      transcripts: [],
      summaries: [],
    };

    const baseSleep = spec.base?.sleep ?? 4;
    const baseApp = spec.base?.appetite ?? 4;
    const baseMood = spec.base?.mood ?? 4;
    const basePain = spec.base?.pain ?? (rnd() < 0.5 ? 1 : 2);
    const baseWords = spec.base?.words ?? 12 + Math.floor(rnd() * 6);
    const socialRate = spec.scenario === "withdrawal" ? 0.85 : 0.75;
    // Labelled-stable people don't go 4+ days without talking to anyone (that IS the signal).
    let socialMiss = 0;

    for (let d = startDay; d < days; d++) {
      const date = addDays(endDate, d - (days - 1));
      const onset = spec.onset ?? 99;
      const since = d - onset; // days since the scenario change began
      let answered = true;
      let expected = 0;
      const red_flags: RedFlag[] = [];
      const noisy = spec.scenario === "noisy_normal";

      // Noisy seniors swing widely every day, so their personal MAD is large.
      let sleep = noisy ? pick(rnd, [2, 3, 3, 4, 4, 5]) : around(rnd, baseSleep, 0.3);
      let appetite = noisy ? pick(rnd, [2, 3, 4, 4, 5]) : around(rnd, baseApp, 0.25);
      let mood = noisy ? pick(rnd, [2, 3, 3, 4, 5]) : around(rnd, baseMood, 0.3);
      let pain = clamp(around(rnd, basePain, 0.4), 0, 10);
      let words = Math.max(2, Math.round(baseWords + (rnd() - 0.5) * (noisy ? 8 : 4)));
      let social: boolean | null = rnd() < socialRate || socialMiss >= 2;
      socialMiss = social ? 0 : socialMiss + 1;
      let leftHome: boolean | null = rnd() < 0.75;

      if (spec.scenario === "gradual_decline" && since >= 0) {
        const drop = Math.min(2.5, 0.45 * (since + 1));
        sleep = clamp(Math.round(baseSleep - drop + (rnd() - 0.5) * 0.6), 1, 5);
        appetite = clamp(Math.round(baseApp - drop + (rnd() - 0.5) * 0.6), 1, 5);
        if (since >= 3) leftHome = rnd() < 0.3;
        expected = since >= 3 ? 2 : since >= 1 ? 1 : 0;
      }
      if (spec.scenario === "withdrawal" && since >= 0) {
        words = Math.max(2, Math.round(baseWords * Math.max(0.25, 1 - 0.12 * (since + 1))));
        social = rnd() < 0.1;
        mood = clamp(baseMood - (since > 4 ? 1 : 0), 1, 5);
        expected = since >= 3 ? 2 : since >= 1 ? 1 : 0;
      }
      if (spec.scenario === "sudden_confusion" && since === 0) {
        red_flags.push({
          type: "confusion",
          evidence: g(["Nie wiem, gdzie jestem… jaki dziś dzień? Szukam drzwi.", "Nie wiem, gdzie jestem… jaki dziś dzień? Szukam drzwi."], spec.gender),
        });
        words = Math.max(3, Math.round(words * 0.5));
        expected = 3;
      }
      if (spec.scenario === "stops_answering" && since >= 0) {
        answered = false;
        expected = since >= 1 ? 2 : 1;
      }

      // Some days the senior simply doesn't talk about a topic -> null, never guessed.
      const skip = (p: number) => rnd() < p;
      const rec: DayRecord = {
        date,
        answered,
        sleep_quality: answered && !skip(0.05) ? sleep : null,
        appetite: answered && !skip(0.05) ? appetite : null,
        mood: answered && !skip(0.08) ? mood : null,
        pain: answered && !skip(0.1) ? pain : null,
        avg_answer_words: answered ? words : null,
        talked_to_someone: answered && !skip(0.05) ? social : null,
        left_home: answered && !skip(0.1) ? leftHome : null,
        red_flags: answered ? red_flags : [],
        evidence: {},
      };

      if (answered) {
        const withdrawn = spec.scenario === "withdrawal" && since >= 3;
        const say = (bank: G[]) => (withdrawn && rnd() < 0.5 ? g(pick(rnd, WITHDRAWN_SHORT), spec.gender) : g(pick(rnd, bank), spec.gender));
        if (rec.sleep_quality !== null) rec.evidence.sleep = say(SLEEP[rec.sleep_quality]);
        if (rec.appetite !== null) rec.evidence.appetite = say(APPETITE[rec.appetite]);
        if (rec.mood !== null) rec.evidence.mood = say(MOOD[rec.mood]);
        if (rec.pain !== null) rec.evidence.pain = g(pick(rnd, rec.pain <= 2 ? PAIN_LOW : rec.pain <= 5 ? PAIN_MID : PAIN_HIGH), spec.gender);
        if (rec.talked_to_someone !== null) rec.evidence.social = say(rec.talked_to_someone ? SOCIAL_YES : SOCIAL_NO);
        if (rec.left_home !== null) rec.evidence.activity = g(pick(rnd, rec.left_home ? ACTIVITY_YES : ACTIVITY_NO), spec.gender);
        if (red_flags.length) rec.evidence.safety = red_flags[0].evidence;
      }

      out.days.push(rec);
      out.expected.push(expected);
      out.transcripts.push(answered ? buildTranscript(rec, spec) : null);
      out.summaries.push(answered ? buildSummary(rec, spec) : null);
    }
    return out;
  });
}

const QUESTIONS: Record<string, string[]> = {
  sleep: ["Jak się spało tej nocy?", "Jak minęła noc?"],
  appetite: ["Co dziś było dobrego do jedzenia?", "Jak z apetytem?"],
  mood: ["A jak samopoczucie?", "Jak się dziś pani czuje?"],
  pain: ["Czy coś dziś boli?"],
  social: ["Rozmawiała pani dziś z kimś?"],
  activity: ["Udało się dziś wyjść z domu?"],
  safety: ["Wszystko w porządku?"],
};

function buildTranscript(rec: DayRecord, spec: Spec) {
  const pan = spec.gender === "f" ? "Pani" : "Panie";
  const t: { role: "agent" | "senior"; text: string }[] = [
    { role: "agent", text: `Dzień dobry, tu asystent AI z ośrodka pomocy społecznej. ${pan} ${spec.name.split(" ")[0]}, dzwonię jak co dzień. Mam chwilę na krótką rozmowę?` },
    { role: "senior", text: "Dzień dobry, tak, proszę." },
  ];
  for (const [cat, text] of Object.entries(rec.evidence)) {
    const q = QUESTIONS[cat]?.[0] ?? "Jak się pani miewa?";
    t.push({ role: "agent", text: spec.gender === "m" ? q.replace("pani", "pan").replace("Rozmawiała", "Rozmawiał") : q });
    t.push({ role: "senior", text });
  }
  t.push({ role: "agent", text: "Dziękuję za rozmowę. Przekażę w ośrodku krótkie podsumowanie. Do usłyszenia jutro!" });
  return t;
}

function buildSummary(rec: DayRecord, spec: Spec) {
  const f = spec.gender === "f";
  const parts: string[] = [];
  if (rec.red_flags.length) parts.push(`${f ? "Seniorka" : "Senior"} ${f ? "była zdezorientowana" : "był zdezorientowany"}; asystent podał numer 112.`);
  if (rec.sleep_quality !== null) parts.push(`Sen oceniony na ${rec.sleep_quality}/5.`);
  if (rec.appetite !== null) parts.push(`Apetyt ${rec.appetite}/5.`);
  if (rec.talked_to_someone !== null) parts.push(rec.talked_to_someone ? "Miał(a) kontakt z bliskimi lub sąsiadami." : "Nie rozmawiał(a) dziś z nikim.");
  return parts.join(" ");
}
