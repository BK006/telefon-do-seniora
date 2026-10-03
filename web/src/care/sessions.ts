// Sample conversation history from the design handoff (synthetic, Halina Kowalska).
export interface Session {
  id: string;
  d: string;
  m: string;
  date: string;
  time: string;
  dur: string;
  st: "ok" | "retry" | "missed";
  sum: string;
  answers: { k: string; score?: number; text?: string; quote: string }[];
  withheld?: string[];
  transcript?: ["ai" | "s", string][];
}

export const SESSIONS: Session[] = [
  {
    id: "s1", d: "3", m: "paź", date: "Sobota, 3 października", time: "10:00", dur: "7 min", st: "ok",
    sum: "Słabo spała. Poprosiła o chleb i mleko. Wpadła do niej sąsiadka.",
    answers: [
      { k: "sen", score: 2, quote: "budziłam się co chwilę" },
      { k: "apetyt", score: 3, quote: "zjadłam pół bułki z masłem i herbatkę" },
      { k: "leki", text: "Wzięła poranne leki", quote: "te na ciśnienie wzięłam po śniadaniu" },
      { k: "wyjscie", text: "Nie wychodziła", quote: "dzisiaj nie, zimno jakoś" },
      { k: "kontakt", text: "Odwiedziła ją sąsiadka", quote: "pani Basia wpadła na kawę" },
      { k: "potrzeby", text: "Chleb i mleko", quote: "jakby ktoś mógł, to chleb i mleko by się przydało" },
    ],
    withheld: ["samop"],
    transcript: [
      ["ai", "Dzień dobry, Pani Halino, tu asystent AI Telefonu do seniora. Dzwonię w imieniu Kasi. Ma Pani chwilę?"],
      ["s", "A, dzień dobry. Mam, mam."],
      ["ai", "Jak Pani spała tej nocy?"],
      ["s", "Oj, kiepsko. Budziłam się co chwilę."],
      ["ai", "Przykro mi. A co Pani jadła na śniadanie?"],
      ["s", "Zjadłam pół bułki z masłem i herbatkę."],
      ["ai", "Czy wzięła Pani poranne leki?"],
      ["s", "Te na ciśnienie wzięłam po śniadaniu."],
      ["ai", "Wychodziła Pani dziś z domu?"],
      ["s", "Dzisiaj nie, zimno jakoś. Ale pani Basia wpadła na kawę."],
      ["ai", "To miło. A jak się Pani dziś czuje?"],
      ["s", "Tego to niech pan Kasi nie mówi, nie chcę, żeby się martwiła."],
      ["ai", "Dobrze, nie przekażę tego. Czy czegoś Pani potrzebuje?"],
      ["s", "Jakby ktoś mógł, to chleb i mleko by się przydało."],
      ["ai", "Przekażę Kasi. Dziękuję za rozmowę, zadzwonię wieczorem."],
    ],
  },
  {
    id: "s2", d: "2", m: "paź", date: "Piątek, 2 października", time: "12:00", dur: "5 min", st: "retry",
    sum: "Odebrała przy drugiej próbie. Rano była na działce.",
    answers: [
      { k: "sen", score: 2, quote: "znowu kiepsko, ale jakoś to będzie" },
      { k: "apetyt", score: 4, quote: "zupę pomidorową zjadłam cały talerz" },
      { k: "wyjscie", text: "Była na działce", quote: "od rana byłam na działce, zbierałam jabłka" },
    ],
  },
  {
    id: "s3", d: "1", m: "paź", date: "Czwartek, 1 października", time: "10:00", dur: "8 min", st: "ok",
    sum: "Rozwiązywała krzyżówki. Opowiadała o Zosi na studiach. Prosi o podwiezienie do lekarza w czwartek.",
    answers: [
      { k: "sen", score: 3, quote: "jako tako" },
      { k: "samop", score: 4, quote: "dobrze, Zosia dzwoniła" },
      { k: "kontakt", text: "Rozmawiała z wnuczką", quote: "Zosia dzwoniła z Krakowa" },
      { k: "potrzeby", text: "Podwiezienie do lekarza", quote: "w czwartek mam lekarza, ktoś by mnie zawiózł?" },
    ],
  },
  {
    id: "s4", d: "30", m: "wrz", date: "Środa, 30 września", time: "10:00", dur: "6 min", st: "ok",
    sum: "Mówiła, że budzi się w nocy. Poza tym jak zwykle.",
    answers: [
      { k: "sen", score: 3, quote: "budzę się w nocy, ale potem zasypiam" },
      { k: "apetyt", score: 4, quote: "pierogi odgrzałam" },
      { k: "samop", score: 4, quote: "dobrze, nie narzekam" },
    ],
  },
  {
    id: "s5", d: "29", m: "wrz", date: "Wtorek, 29 września", time: "12:00", dur: "5 min", st: "retry",
    sum: "Odebrała przy drugiej próbie. Wróciła z zakupów.",
    answers: [
      { k: "wyjscie", text: "Była na zakupach", quote: "byłam na rynku po warzywa" },
      { k: "samop", score: 4, quote: "całkiem dobrze" },
    ],
  },
  {
    id: "s6", d: "28", m: "wrz", date: "Poniedziałek, 28 września", time: "10:00", dur: "9 min", st: "ok",
    sum: "Opowiadała o kocie Mruczku i niedzielnym obiedzie u Tomka. Prosi o baterie do pilota.",
    answers: [
      { k: "samop", score: 5, quote: "wspaniale, u Tomka był rosół" },
      { k: "kontakt", text: "Obiad u syna", quote: "w niedzielę byłam u Tomka" },
      { k: "potrzeby", text: "Baterie do pilota", quote: "pilot mi nie działa, baterie by trzeba" },
    ],
  },
  { id: "s7", d: "27", m: "wrz", date: "Niedziela, 27 września", time: "10:00", dur: "—", st: "missed", sum: "Nie odebrała o 10:00 ani o 12:00. Była na obiedzie u syna.", answers: [] },
];

export const SESSION_STATUS = {
  ok: { label: "Odebrała", bg: "#DCF8EC", bd: "#9BEBC6", fg: "#146B47", icon: "check" as const },
  retry: { label: "Ponowiona", bg: "#EEE9FF", bd: "#C9BCFF", fg: "#5A3FD6", icon: "retry" as const },
  missed: { label: "Nie odebrała", bg: "#EFECF6", bd: "#DAD4E6", fg: "#463C5A", icon: "missed" as const },
};
