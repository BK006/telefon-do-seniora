import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartHandshake, PhoneCall, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { DEMO_PASSWORD, DEMO_USERS } from "@shared/synthetic/demo.ts";

const ACCOUNTS = [
  { role: "staff" as const, email: DEMO_USERS.staffKrakow.email, title: "Pracownik ośrodka", sub: "MOPS Kraków — Filia Podgórze", icon: Users },
  { role: "family" as const, email: DEMO_USERS.family.email, title: "Rodzina", sub: "Córka pani Haliny", icon: HeartHandshake },
];

export function Login() {
  const { signIn } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>(ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const acc = ACCOUNTS.find((a) => a.email === email.trim().toLowerCase());
    if (!acc || password !== DEMO_PASSWORD) {
      setError("Nieprawidłowy e-mail lub hasło. Użyj jednego z kont demo poniżej.");
      return;
    }
    signIn(acc.role);
    navigate(acc.role === "staff" ? "/panel" : "/rodzina");
  }

  return (
    <div className="grid min-h-dvh bg-stone-50 lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-teal-900 p-12 text-teal-50 lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <PhoneCall className="size-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">Telefon do seniora</span>
        </div>
        <div className="mt-auto max-w-lg">
          <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.025em] text-white">
            Codzienna rozmowa. Człowiek reaguje, gdy zmienia się wzorzec.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-teal-100/90">
            Asystent AI dzwoni raz dziennie do seniorów mieszkających samotnie. System uczy się normy każdej osoby i podpowiada
            ośrodkowi, kogo sprawdzić dziś — z cytatami, które to uzasadniają.
          </p>
          <ul className="mt-8 space-y-3 text-[15px] text-teal-50/90">
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />Bez diagnoz i porad medycznych — każdy alert kończy się na człowieku.</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />Senior wie, co zostanie przekazane, i może to wstrzymać.</li>
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Zaloguj się</h2>
          <p className="mt-1.5 text-sm text-stone-600">Wersja demonstracyjna — wyłącznie dane syntetyczne.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-white text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-white text-base" />
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <Button type="submit" className="h-11 w-full bg-teal-800 text-base hover:bg-teal-900 active:scale-[0.98] transition-transform duration-150">
              Zaloguj
            </Button>
          </form>

          <div className="mt-10">
            <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">Konta demo</p>
            <div className="mt-3 grid gap-2">
              {ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(DEMO_PASSWORD);
                    setError(null);
                  }}
                  aria-pressed={email === a.email}
                  className="flex items-center gap-3 rounded-xl bg-white p-3 text-left ring-1 ring-stone-200 transition-[box-shadow,transform] duration-150 hover:ring-stone-300 active:scale-[0.98] aria-pressed:ring-2 aria-pressed:ring-teal-700"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-stone-100 text-stone-700"><a.icon className="size-4.5" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{a.title}</span>
                    <span className="block truncate text-xs text-stone-500">{a.email} · {a.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
