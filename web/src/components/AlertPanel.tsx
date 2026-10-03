import { useState } from "react";
import { Check, Quote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LevelBadge } from "@/components/LevelBadge";
import type { AlertRecord } from "@/lib/demo";
import { fmtDate, fmtDateShort, fmtTime } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL, type AlertStatus } from "@/lib/levels";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORY_PL: Record<string, string> = {
  sleep: "sen", appetite: "apetyt", mood: "samopoczucie", pain: "ból", social: "kontakt", activity: "aktywność", safety: "bezpieczeństwo",
};

const NEXT_ACTION: Partial<Record<AlertStatus, { to: AlertStatus; label: string }>> = {
  new: { to: "acknowledged", label: "Przyjmij do obsługi" },
  acknowledged: { to: "contacted", label: "Skontaktowano się" },
  contacted: { to: "visit_planned", label: "Zaplanuj wizytę" },
  visit_planned: { to: "resolved", label: "Oznacz jako rozwiązany" },
};

export function AlertPanel({ alert }: { alert: AlertRecord }) {
  const { transition } = useStore();
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const e = alert.episode;
  const closed = alert.status === "resolved" || alert.status === "false_alarm";
  const next = NEXT_ACTION[alert.status];
  const stepIdx = STATUS_FLOW.indexOf(alert.status as (typeof STATUS_FLOW)[number]);

  function act(to: AlertStatus) {
    transition(alert.id, to, note);
    setNote("");
    toast.success(`Status: ${STATUS_LABEL[to]}`, { description: "Zapisano w dzienniku działań." });
  }

  return (
    <section
      aria-labelledby={`alert-${alert.id}`}
      className={cn("overflow-hidden rounded-2xl bg-white ring-1", e.level === 3 && !closed ? "ring-2 ring-red-500" : "ring-stone-200")}
    >
      <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 p-5", e.level === 3 && !closed && "bg-red-50/60")}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={e.level} size="sm" />
            <span className="text-xs text-stone-500">
              od {fmtDate(e.startedOn)} · wykryto {fmtDate(e.detectedOn)} · dotyczy: {e.categories.map((c) => CATEGORY_PL[c] ?? c).join(", ")}
            </span>
          </div>
          <h3 id={`alert-${alert.id}`} className="mt-2 text-lg font-semibold tracking-tight">{e.explanation.headline}</h3>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1", closed ? "bg-stone-100 text-stone-700 ring-stone-200" : "bg-sky-50 text-sky-900 ring-sky-200")}>
          {STATUS_LABEL[alert.status]}
        </span>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-medium tracking-wide text-stone-500 uppercase">Co się zmieniło względem normy</h4>
            <ul className="mt-2 space-y-2">
              {e.explanation.items.map((it, i) => (
                <li key={i} className="rounded-xl bg-stone-50 px-3 py-2.5 text-[15px] leading-snug">
                  <span className="font-semibold">{it.label}:</span> {it.text}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-stone-500">Wyjaśnienie wyliczone z danych (mediana i odchylenie z 14 dni), nie przez model językowy.</p>
          </div>

          {e.explanation.quotes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium tracking-wide text-stone-500 uppercase">Słowa seniora</h4>
              <ul className="mt-2 space-y-2">
                {e.explanation.quotes.map((q, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Quote className="mt-1 size-3.5 shrink-0 text-stone-400" aria-hidden />
                    <p className="text-[15px] leading-snug">
                      <span className="italic">„{q.text}”</span>
                      <span className="ml-1.5 text-xs whitespace-nowrap text-stone-500">{fmtDateShort(q.date)} · {CATEGORY_PL[q.category] ?? q.category}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-medium tracking-wide text-stone-500 uppercase">Sugerowane kroki</h4>
            <ul className="mt-2 space-y-1">
              {e.explanation.checklist.map((c, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 text-sm leading-snug hover:bg-stone-50">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0 accent-teal-700"
                      checked={!!checked[i]}
                      onChange={(ev) => setChecked((p) => ({ ...p, [i]: ev.target.checked }))}
                      disabled={closed}
                    />
                    <span className={cn(checked[i] && "text-stone-500 line-through")}>{c}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-stone-500">Lista kontrolna dla człowieka — to nie jest porada medyczna.</p>
          </div>

          {!closed && (
            <div className="space-y-2">
              <label htmlFor={`note-${alert.id}`} className="text-xs font-medium tracking-wide text-stone-500 uppercase">Notatka do dziennika</label>
              <Textarea id={`note-${alert.id}`} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Np. rozmawiałam z panią Haliną, córka odwiedzi ją jutro." className="min-h-20 bg-white" />
              <div className="flex flex-wrap gap-2">
                {next && (
                  <Button onClick={() => act(next.to)} className="bg-teal-800 hover:bg-teal-900 active:scale-[0.97] transition-transform duration-150">
                    <Check aria-hidden /> {next.label}
                  </Button>
                )}
                {alert.status !== "visit_planned" && alert.status !== "new" && (
                  <Button variant="outline" onClick={() => act("resolved")} className="active:scale-[0.97] transition-transform duration-150">Rozwiązany</Button>
                )}
                <Button variant="ghost" onClick={() => act("false_alarm")} className="text-stone-600 active:scale-[0.97] transition-transform duration-150">Fałszywy alarm</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-stone-100 bg-stone-50/60 p-5">
        <ol aria-label="Etapy obsługi alertu" className="flex flex-wrap items-center gap-1.5 text-xs">
          {STATUS_FLOW.map((s, i) => {
            const done = alert.status === "false_alarm" ? false : i <= stepIdx;
            return (
              <li key={s} className="flex items-center gap-1.5">
                <span className={cn("rounded-full px-2 py-0.5 ring-1", done ? "bg-teal-800 text-white ring-teal-800" : "bg-white text-stone-500 ring-stone-200")} aria-current={i === stepIdx ? "step" : undefined}>
                  {STATUS_LABEL[s]}
                </span>
                {i < STATUS_FLOW.length - 1 && <span className="h-px w-3 bg-stone-300" aria-hidden />}
              </li>
            );
          })}
          {alert.status === "false_alarm" && <li className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-stone-800">Fałszywy alarm</li>}
        </ol>
        <h4 className="mt-4 text-xs font-medium tracking-wide text-stone-500 uppercase">Dziennik działań</h4>
        <ol className="mt-2 space-y-1.5">
          {[...alert.events].reverse().map((ev, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-24 shrink-0 text-xs text-stone-500 tabular-nums">{fmtDateShort(ev.at.slice(0, 10))}, {fmtTime(ev.at)}</span>
              <span>
                <span className="font-medium">{STATUS_LABEL[ev.to]}</span>
                <span className="text-stone-500"> · {ev.actor}</span>
                {ev.note && <span className="block text-stone-600">{ev.note}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
