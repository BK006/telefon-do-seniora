// Demo accounts for the jury. Synthetic test values only — they guard synthetic data.
export const DEMO_PASSWORD = "Demo-Senior-2026";

export const DEMO_USERS = {
  staffKrakow: { email: "pracownik@demo.test", full_name: "Anna Wiśniewska (pracownik socjalny)" },
  staffWieliczka: { email: "wieliczka@demo.test", full_name: "Piotr Zając (pracownik socjalny)" },
  family: { email: "rodzina@demo.test", full_name: "Magda K. (córka pani Haliny)" },
} as const;

export const DEMO_CENTERS = {
  krakow: { name: "MOPS Kraków — Filia Podgórze (demo)", city: "Kraków" },
  wieliczka: { name: "GOPS Wieliczka (demo)", city: "Wieliczka" },
} as const;
