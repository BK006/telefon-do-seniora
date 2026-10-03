import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, PhoneOff } from "lucide-react";
import { LevelBadge } from "@/components/LevelBadge";
import { LEVELS } from "@/lib/levels";
import { sortByPriority, type SeniorView } from "@/lib/demo";
import { fmtDateLong, relDay } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function LevelStrip({ v }: { v: SeniorView }) {
  // 30 days of engine levels; height + colour + an accessible text summary.
  const days = v.results.slice(-30);
  const worst = Math.max(...days.map((d) => d.level));
  return (
    <div className="hidden items-end gap-[2px] lg:flex" role="img" aria-label={`Ostatnie ${days.length} dni, najwyższy poziom: ${LEVELS[worst].label}`}>
      {days.map((d) => (
        <span
          key={d.date}
          className={cn("w-[4px] rounded-full", d.level === 0 ? "h-2 bg-stone-300" : LEVELS[d.level].dot, d.level === 1 && "h-3.5", d.level === 2 && "h-5", d.level === 3 && "h-6")}
        />
      ))}
    </div>
  );
}

export function Today() {
  const { data, alerts } = useStore();
  const [filter, setFilter] = useState<number | null>(null);
  const sorted = useMemo(() => sortByPriority(data.seniors), [data.seniors]);
  const counts = [0, 1, 2, 3].map((l) => data.seniors.filter((s) => s.level === l).length);
  const list = filter === null ? sorted : sorted.filter((s) => s.level === filter);
  const openAlertsBySenior = new Map(alerts.filter((a) => !["resolved", "false_alarm"].includes(a.status)).map((a) => [a.seniorId, a]));
  const needAction = counts[2] + counts[3];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500 first-letter:uppercase">{fmtDateLong(data.today)}</p>
          <h1 className="mt-1 text-[2rem] leading-tight font-semibold tracking-[-0.02em]">Kogo sprawdzić dziś</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-600">
            {needAction > 0
              ? `${needAction} ${needAction === 1 ? "osoba wymaga" : "osoby wymagają"} kontaktu. Pozostali są w swojej normie albo mieli pojedynczy gorszy dzień.`
              : "Nikt nie wymaga dziś kontaktu."}{" "}
            Lista jest posortowana według pilności.
          </p>
        </div>
      </div>

      <div role="group" aria-label="Filtruj według poziomu" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[3, 2, 1, 0].map((l) => {
          const m = LEVELS[l];
          const active = filter === l;
          return (
            <button
              key={l}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(active ? null : l)}
              className={cn(
                "group rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200 transition-[box-shadow,transform] duration-150 ease-out active:scale-[0.98]",
                "hover:ring-stone-300",
                active && "ring-2 ring-stone-900",
              )}
            >
              <div className="flex items-center justify-between">
                <LevelBadge level={l} size="sm" />
                <span className="text-xs text-stone-500">{active ? "Pokaż wszystkich" : "Filtruj"}</span>
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{counts[l]}</p>
              <p className="text-xs text-stone-500">{m.hint}</p>
            </button>
          );
        })}
      </div>

      <section aria-labelledby="list-h" className="mt-8 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
        <h2 id="list-h" className="sr-only">Lista seniorów</h2>
        <ul className="divide-y divide-stone-100">
          {list.map((v) => {
            const alert = openAlertsBySenior.get(v.id);
            return (
              <li key={v.id}>
                <Link
                  to={`/panel/senior/${v.id}`}
                  className="group flex items-center gap-4 px-4 py-4 transition-colors duration-150 hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:outline-none sm:px-5"
                >
                  <div className="w-36 shrink-0">
                    <LevelBadge level={v.level} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-base font-semibold">{v.s.display_name}</span>
                      <span className="text-sm text-stone-500">{v.age} lat · {v.s.city}</span>
                    </p>
                    <p className={cn("mt-0.5 truncate text-sm", v.level >= 2 ? "text-stone-800" : "text-stone-500")}>
                      {v.reason ?? "Bez zmian względem normy"}
                      {alert && alert.status !== "new" && <span className="ml-2 text-stone-500">· {alert.status === "acknowledged" ? "przyjęty" : alert.status === "contacted" ? "po kontakcie" : "wizyta zaplanowana"}</span>}
                    </p>
                  </div>
                  <LevelStrip v={v} />
                  <div className="hidden w-28 shrink-0 text-right text-sm sm:block">
                    {v.daysSinceContact >= 1 ? (
                      <span className="inline-flex items-center gap-1 text-orange-800"><PhoneOff className="size-3.5" aria-hidden />{relDay(v.lastContact ?? data.today, data.today)}</span>
                    ) : (
                      <span className="text-stone-500">rozmowa dziś</span>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-stone-400 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
