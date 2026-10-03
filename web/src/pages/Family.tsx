import { EyeOff, Mail, Moon, Soup, Users } from "lucide-react";
import { LevelBadge } from "@/components/LevelBadge";
import { fmtDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/levels";

const CATEGORY_PL: Record<string, string> = {
  sleep: "sen", appetite: "apetyt", mood: "samopoczucie", pain: "ból", social: "kontakt z ludźmi", activity: "wychodzenie z domu", safety: "bezpieczeństwo",
};

// Mirrors the family_check_ins view: consented categories only, minus what the senior
// withheld in a given call. In Supabase mode this masking happens in the database.
export function Family() {
  const { data, alerts } = useStore();
  const v = data.seniors.find((s) => s.s.display_name.startsWith("Halina"))!;
  const consent = new Set(v.s.family_consent);
  const week = v.s.days.slice(-7);
  const answered = week.filter((d) => d.answered);
  const avg = (xs: (number | null)[]) => {
    const n = xs.filter((x): x is number => x !== null);
    return n.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(1).replace(".", ",") : "—";
  };
  const famAlerts = alerts.filter((a) => a.seniorId === v.id && a.episode.categories.every((c) => consent.has(c)));
  const hidden = Object.keys(CATEGORY_PL).filter((c) => !consent.has(c));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm font-medium text-stone-500">Podsumowanie tygodnia · {fmtDate(week[0].date)} – {fmtDate(week[week.length - 1].date)}</p>
        <h1 className="mt-1 text-[2rem] leading-tight font-semibold tracking-[-0.02em]">Mama — {v.s.display_name}</h1>
        <p className="mt-2 text-[15px] text-stone-600">
          W tym tygodniu odbyło się {answered.length} z {week.length} codziennych rozmów. Widzisz tylko to, na co mama wyraziła zgodę.
        </p>
      </div>

      {famAlerts.filter((a) => a.status !== "resolved" && a.status !== "false_alarm").map((a) => (
        <section key={a.id} className="rounded-2xl bg-white p-5 ring-2 ring-orange-300">
          <LevelBadge level={a.episode.level} size="sm" />
          <h2 className="mt-2 text-lg font-semibold">{a.episode.explanation.headline}</h2>
          <p className="mt-1 text-[15px] text-stone-700">
            Ośrodek pomocy społecznej wie o tej zmianie. Status: <strong>{STATUS_LABEL[a.status].toLowerCase()}</strong>. Pracownik socjalny skontaktuje się z mamą,
            a w razie potrzeby z Tobą.
          </p>
        </section>
      ))}

      <div className="grid gap-3 sm:grid-cols-3">
        {consent.has("sleep") && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
            <Moon className="size-5 text-teal-800" aria-hidden />
            <p className="mt-3 text-sm text-stone-600">Sen (średnio)</p>
            <p className="text-2xl font-semibold tabular-nums">{avg(answered.map((d) => d.sleep_quality))}<span className="text-base text-stone-500">/5</span></p>
          </div>
        )}
        {consent.has("appetite") && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
            <Soup className="size-5 text-teal-800" aria-hidden />
            <p className="mt-3 text-sm text-stone-600">Apetyt (średnio)</p>
            <p className="text-2xl font-semibold tabular-nums">{avg(answered.map((d) => d.appetite))}<span className="text-base text-stone-500">/5</span></p>
          </div>
        )}
        {consent.has("social") && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
            <Users className="size-5 text-teal-800" aria-hidden />
            <p className="mt-3 text-sm text-stone-600">Dni z rozmową z kimś</p>
            <p className="text-2xl font-semibold tabular-nums">{answered.filter((d) => d.talked_to_someone).length}<span className="text-base text-stone-500">/{answered.length}</span></p>
          </div>
        )}
      </div>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="flex items-center gap-2 text-base font-semibold"><EyeOff className="size-4" aria-hidden />Czego nie widzisz</h2>
        <p className="mt-1 text-[15px] text-stone-600">
          Mama nie udostępnia rodzinie kategorii: {hidden.map((c) => CATEGORY_PL[c]).join(", ")}. Może to zmienić w każdej chwili, mówiąc o tym asystentowi lub
          pracownikowi ośrodka. Treści rozmów ani podsumowań tekstowych nie przekazujemy.
        </p>
      </section>

      <p className="flex items-center gap-2 text-sm text-stone-500"><Mail className="size-4" aria-hidden />To samo podsumowanie przychodzi e-mailem w każdy poniedziałek.</p>
    </div>
  );
}
