import { useNavigate } from "react-router-dom";
import { Mascot } from "./Mascot";
import { Btn, Card } from "./ui";
import { Icon, IconTile, type IconName, type Tone } from "./icons";

const HOW: { n: number; title: string; text: string; icon: IconName; tone: Tone }[] = [
  { n: 1, title: "Ustaw rozmowy", text: "Napisz, jak zwracać się do mamy, o czym lubi rozmawiać i o co ją pytać.", icon: "sliders", tone: "green" },
  { n: 2, title: "Asystent dzwoni", text: "Codziennie o wybranej porze. Krótko, ciepło i zawsze uprzejmie.", icon: "phone", tone: "blue" },
  { n: 3, title: "Dostajesz podsumowanie", text: "E-mail i pulpit pokażą, jak mama się czuje i czy czegoś potrzebuje.", icon: "mail", tone: "orange" },
];
const TRUST: { title: string; text: string; icon: IconName; tone: Tone }[] = [
  { title: "Zawsze przedstawia się jako AI", text: "Pierwsze zdanie każdej rozmowy mówi, że dzwoni asystent, a nie człowiek.", icon: "bot", tone: "blue" },
  { title: "Nie stawia diagnoz", text: "Słucha i przekazuje Ci to, co usłyszał. Nie udziela porad medycznych.", icon: "shield", tone: "green" },
  { title: "Nigdy nie prosi o pieniądze ani hasła", text: "Nie pyta o PIN, numer konta, kody ani dane logowania.", icon: "lock", tone: "purple" },
];

export function Landing() {
  const nav = useNavigate();
  return (
    <div className="care min-h-dvh bg-white">
      <header className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="flex items-center gap-2.5 rounded-xl">
          <Mascot size={44} decorative />
          <span className="text-[22px] font-black text-[var(--violet-text)]">Telefon do seniora</span>
        </a>
        <Btn variant="white" onClick={() => nav("/app")} className="min-h-12 px-5">
          Zaloguj się
        </Btn>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <section className="grid items-center gap-10 py-10 sm:py-16 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="text-[clamp(34px,5.4vw,58px)] leading-[1.08] font-black tracking-[-0.02em]">
              Codzienny telefon do mamy, nawet gdy nie możesz zadzwonić
            </h1>
            <p className="mt-5 max-w-xl text-[20px] leading-relaxed text-[var(--plum-600)]">
              Asystent AI dzwoni o stałej porze, ciepło rozmawia i pyta o to, co dla Ciebie ważne. Ty dostajesz krótkie podsumowanie: jak mama się czuje i czy
              czegoś potrzebuje.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Btn lg onClick={() => nav("/kreator")}>
                Zacznij za darmo
              </Btn>
              <Btn lg variant="white" onClick={() => nav("/app")}>
                Zobacz przykładowy pulpit
              </Btn>
            </div>
          </div>
          <div className="relative mx-auto flex w-full max-w-[420px] flex-col items-center">
            <div className="relative z-10 mb-[-18px] self-start rounded-[24px] rounded-bl-[6px] border-2 border-[var(--line)] bg-white px-5 py-4 text-[19px] font-extrabold shadow-[0_4px_0_var(--line)]">
              Dzień dobry, Pani Halino! Jak się dziś spało?
            </div>
            <div className="grid aspect-square w-full place-items-center rounded-full bg-[var(--mint-50)]">
              <Mascot size={260} mood="radosc" />
            </div>
          </div>
        </section>

        <section aria-labelledby="how-h" className="py-10">
          <h2 id="how-h" className="text-[30px] font-black">Jak to działa</h2>
          <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
            {HOW.map((s) => (
              <Card key={s.n}>
                <IconTile name={s.icon} tone={s.tone} />
                <p className="mt-4 text-[15px] font-extrabold text-[var(--plum-600)]">Krok {s.n}</p>
                <h3 className="text-[20px] font-black">{s.title}</h3>
                <p className="mt-1 text-[var(--plum-600)]">{s.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="trust-h" className="my-10 rounded-[28px] bg-[var(--bg-app)] p-6 sm:p-10">
          <h2 id="trust-h" className="text-[30px] font-black">Bezpiecznie dla mamy</h2>
          <div className="mt-6 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {TRUST.map((t) => (
              <div key={t.title} className="flex gap-4">
                <IconTile name={t.icon} tone={t.tone} size={48} />
                <div>
                  <h3 className="text-[18px] font-black">{t.title}</h3>
                  <p className="text-[var(--plum-600)]">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-5 py-16 text-center">
          <Mascot size={110} mood="radosc" sparks />
          <h2 className="max-w-xl text-[30px] leading-tight font-black">Pierwszą rozmowę zaplanujesz w 5 minut</h2>
          <Btn lg onClick={() => nav("/kreator")}>
            Zacznij za darmo <Icon name="chevronR" size={22} />
          </Btn>
          <a href="/ops" className="mt-4 text-[15px] font-bold text-[var(--violet-text)] underline-offset-4 hover:underline">
            Jesteś z ośrodka pomocy społecznej? Zobacz panel dla OPS
          </a>
        </section>
      </main>
    </div>
  );
}
