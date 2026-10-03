import { Mic, PhoneCall, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const RULES = [
  "Pierwsze zdanie: „Dzień dobry, tu asystent AI z ośrodka pomocy społecznej” (art. 50 AI Act).",
  "Nigdy nie prosi o pieniądze, PIN, hasła, kody, PESEL ani numery kont.",
  "Przy upadku lub bólu w klatce piersiowej spokojnie mówi o numerze 112 — nie obiecuje, że pomoc już jedzie.",
  "Na końcu mówi, co przekaże, i pyta, czy senior się zgadza.",
  "W każdej chwili można poprosić o rozmowę z człowiekiem.",
];

export function Simulator() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-sm font-medium text-stone-500">Symulacja połączenia telefonicznego</p>
        <h1 className="mt-1 text-[2rem] leading-tight font-semibold tracking-[-0.02em]">Symulator rozmowy</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-stone-600">
          Porozmawiaj z asystentem tak, jak zrobiłby to senior. Po zakończeniu rozmowa przechodzi przez ten sam potok analizy i pojawia się w panelu ośrodka.
        </p>
        <ul className="mt-6 space-y-2.5">
          {RULES.map((r) => (
            <li key={r} className="flex gap-2.5 text-sm text-stone-700"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-800" aria-hidden />{r}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center justify-center rounded-[2rem] bg-stone-900 p-10 text-center text-stone-100 shadow-xl">
        <span className="grid size-24 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
          <PhoneCall className="size-9" aria-hidden />
        </span>
        <p className="mt-6 text-lg font-medium">Asystent „Telefon do seniora”</p>
        <p className="mt-1 text-sm text-stone-400">Polski, spokojny, dojrzały głos</p>
        <Button disabled className="mt-8 h-12 rounded-full bg-emerald-600 px-8 text-base text-white">
          <Mic aria-hidden /> Zadzwoń
        </Button>
        <p className="mt-4 max-w-xs text-xs text-stone-400">Rozmowa głosowa będzie dostępna po podłączeniu agenta ElevenLabs. Wymaga mikrofonu.</p>
      </div>
    </div>
  );
}
