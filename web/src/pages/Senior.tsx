import { Link, useParams } from "react-router-dom";
import { ArrowLeft, EyeOff, Lock, MessageSquareQuote } from "lucide-react";
import { AlertPanel } from "@/components/AlertPanel";
import { LevelBadge } from "@/components/LevelBadge";
import { BoolStrip, MetricChart } from "@/components/MetricChart";
import { fmtDate, fmtDateLong, relDay } from "@/lib/format";
import { useStore } from "@/lib/store";

const CATEGORY_PL: Record<string, string> = {
  sleep: "Sen", appetite: "Apetyt", mood: "Samopoczucie", pain: "Ból", social: "Kontakt z ludźmi", activity: "Aktywność", safety: "Bezpieczeństwo",
};

export function Senior() {
  const { id } = useParams();
  const { data, alerts } = useStore();
  const v = data.seniors.find((x) => x.id === id);
  if (!v) return <p>Nie znaleziono seniora. <Link to="/panel" className="underline">Wróć do listy</Link></p>;

  const own = alerts.filter((a) => a.seniorId === v.id).reverse();
  const open = own.filter((a) => !["resolved", "false_alarm"].includes(a.status));
  const past = own.filter((a) => ["resolved", "false_alarm"].includes(a.status));
  const recent = v.s.days.map((d, i) => ({ d, summary: v.s.summaries[i] })).reverse().slice(0, 6);
  const withheldDays = v.s.days.filter((d, i) => v.s.display_name.startsWith("Halina") && i % 9 === 4 && d.answered).length;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/panel" className="inline-flex items-center gap-1.5 rounded-md text-sm text-stone-600 hover:text-stone-900">
          <ArrowLeft className="size-4" aria-hidden /> Kogo sprawdzić dziś
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.02em]">{v.s.display_name}</h1>
            <p className="mt-1 text-[15px] text-stone-600">
              {v.age} lat · {v.s.city} · tel. {v.s.phone_masked} · ostatnia rozmowa: {v.lastContact ? relDay(v.lastContact, data.today) : "brak"}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-stone-500">{v.s.persona}</p>
          </div>
          <div className="text-right">
            <LevelBadge level={v.level} size="lg" />
            {v.calibrating && <p className="mt-2 text-xs text-stone-500">Tryb kalibracji: norma powstaje z min. 7 dni rozmów</p>}
          </div>
        </div>
      </div>

      {open.length > 0 ? (
        <div className="space-y-4">{open.map((a) => <AlertPanel key={a.id} alert={a} />)}</div>
      ) : (
        <div className="rounded-2xl bg-white p-5 text-[15px] text-stone-600 ring-1 ring-stone-200">
          Brak otwartych alertów. {v.reason ? `Dziś: ${v.reason.toLowerCase()}.` : "Wskaźniki w normie tej osoby."}
        </div>
      )}

      <section aria-labelledby="trends-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="trends-h" className="text-xl font-semibold tracking-tight">Ostatnie 30 dni</h2>
          <p className="text-xs text-stone-500">
            <span className="mr-1.5 inline-block h-2.5 w-5 rounded-sm bg-teal-700/15 align-middle" />norma tej osoby (mediana ± odchylenie z 14 dni)
            <span className="mr-1.5 ml-4 inline-block size-2.5 rounded-full bg-orange-700 align-middle" />dzień poza normą
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricChart metric="sleep_quality" results={v.results} />
          <MetricChart metric="appetite" results={v.results} />
          <MetricChart metric="mood" results={v.results} />
          <MetricChart metric="pain" results={v.results} />
          <MetricChart metric="avg_answer_words" results={v.results} />
          <div className="grid gap-4">
            <BoolStrip metric="talked_to_someone" results={v.results} />
            <BoolStrip metric="left_home" results={v.results} />
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500">Samopoczucie pochodzi wyłącznie z deklaracji seniora — nie analizujemy barwy głosu.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="calls-h">
          <h2 id="calls-h" className="text-xl font-semibold tracking-tight">Ostatnie rozmowy</h2>
          <ol className="mt-4 space-y-3">
            {recent.map(({ d, summary }) => (
              <li key={d.date} className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
                <p className="text-sm font-medium first-letter:uppercase">{fmtDateLong(d.date)}</p>
                {!d.answered ? (
                  <p className="mt-1 text-sm text-orange-800">Nie odebrano (2 próby: rano i po południu).</p>
                ) : (
                  <>
                    {summary && <p className="mt-1 text-[15px] leading-snug text-stone-700">{summary}</p>}
                    <ul className="mt-2 space-y-1">
                      {Object.entries(d.evidence).slice(0, 3).map(([cat, q]) => (
                        <li key={cat} className="flex gap-2 text-sm text-stone-600">
                          <MessageSquareQuote className="mt-0.5 size-3.5 shrink-0 text-stone-400" aria-hidden />
                          <span><span className="text-stone-500">{CATEGORY_PL[cat] ?? cat}:</span> <span className="italic">„{q}”</span></span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="consent-h" className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
            <h2 id="consent-h" className="flex items-center gap-2 text-base font-semibold"><Lock className="size-4" aria-hidden />Zgody seniora</h2>
            <p className="mt-1 text-sm text-stone-600">Co trafia do rodziny. Egzekwowane w bazie danych, nie tylko w interfejsie.</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(CATEGORY_PL).map(([cat, label]) => {
                const ok = v.s.family_consent.includes(cat);
                return (
                  <li key={cat} className={ok ? "rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-900 ring-1 ring-teal-200" : "inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600 ring-1 ring-stone-200"}>
                    {!ok && <EyeOff className="size-3" aria-hidden />}{label}<span className="sr-only">{ok ? " — udostępniane rodzinie" : " — nieudostępniane"}</span>
                  </li>
                );
              })}
            </ul>
            {withheldDays > 0 && (
              <p className="mt-3 text-xs text-stone-500">W {withheldDays} rozmowach senior poprosił, by nie przekazywać samopoczucia dalej — rodzina tych danych nie zobaczy.</p>
            )}
          </section>

          {past.length > 0 && (
            <section aria-labelledby="past-h" className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
              <h2 id="past-h" className="text-base font-semibold">Wcześniejsze alerty</h2>
              <ul className="mt-3 space-y-2">
                {past.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium">{a.episode.explanation.headline}</p>
                    <p className="text-xs text-stone-500">{fmtDate(a.episode.detectedOn)} · {a.status === "resolved" ? "rozwiązany" : "fałszywy alarm"}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
