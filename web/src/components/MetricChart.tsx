import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CONFIG, METRIC_LABEL_PL, type BoolMetric, type NumericMetric } from "@shared/engine/config.ts";
import type { DayResult } from "@shared/engine/types.ts";
import { fmtDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOMAIN: Record<NumericMetric, [number, number]> = {
  sleep_quality: [1, 5],
  appetite: [1, 5],
  mood: [1, 5],
  pain: [0, 10],
  avg_answer_words: [0, 30],
};
const UNIT: Record<NumericMetric, string> = { sleep_quality: "/5", appetite: "/5", mood: "/5", pain: "/10", avg_answer_words: " słów" };

export function MetricChart({ metric, results }: { metric: NumericMetric; results: DayResult[] }) {
  const [lo, hi] = DOMAIN[metric];
  const rows = results.map((r) => {
    const s = r.numeric[metric];
    const scale = s.mad !== null ? Math.max(1.4826 * s.mad, CONFIG.minScale[metric]) : null;
    // The band is the personal norm: median ± one robust SD. Values outside it are not alarming
    // by themselves — the engine needs persistence or accumulation to escalate.
    const band = s.median !== null && scale !== null ? [Math.max(lo, s.median - scale), Math.min(hi, s.median + scale)] : null;
    return { date: r.date, value: s.value, band, median: s.median, flagged: s.flagged };
  });
  const last = rows[rows.length - 1];
  const lastWithValue = [...rows].reverse().find((r) => r.value !== null);
  const flaggedDays = rows.slice(-7).filter((r) => r.flagged).length;

  return (
    <figure className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{METRIC_LABEL_PL[metric]}</span>
        <span className={cn("text-xs tabular-nums", flaggedDays ? "font-medium text-orange-800" : "text-stone-500")}>
          {lastWithValue?.value != null ? `ostatnio ${lastWithValue.value}${UNIT[metric]}` : "brak danych"}
          {last.median != null && ` · norma ${last.median}${UNIT[metric]}`}
        </span>
      </figcaption>
      <div className="mt-2 h-36" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 6, right: 6, bottom: 0, left: -28 }}>
            <CartesianGrid vertical={false} stroke="#e7e5e4" strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} interval={6} />
            <YAxis domain={[lo, hi]} tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} allowDecimals={false} width={48} />
            <Tooltip
              cursor={{ stroke: "#a8a29e", strokeDasharray: "3 3" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }}
              labelFormatter={(d) => fmtDateShort(String(d))}
              formatter={(v, name) => (name === "band" ? null : [`${v}${UNIT[metric]}`, "Wartość"])}
            />
            <Area dataKey="band" stroke="none" fill="#0f766e" fillOpacity={0.12} isAnimationActive={false} connectNulls />
            <Line
              dataKey="value"
              stroke="#1c1917"
              strokeWidth={1.75}
              isAnimationActive={false}
              connectNulls={false}
              dot={(p: { cx?: number; cy?: number; payload?: { flagged: boolean }; index?: number }) =>
                p.cx == null || p.cy == null ? <g key={p.index} /> : (
                  <circle key={p.index} cx={p.cx} cy={p.cy} r={p.payload?.flagged ? 3.5 : 2} fill={p.payload?.flagged ? "#c2410c" : "#1c1917"} stroke="white" strokeWidth={1} />
                )
              }
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        {METRIC_LABEL_PL[metric]}: ostatnia wartość {lastWithValue?.value ?? "brak"}, norma {last.median ?? "w kalibracji"}. Dni poza normą w ostatnim tygodniu: {flaggedDays}.
      </p>
    </figure>
  );
}

export function BoolStrip({ metric, results }: { metric: BoolMetric; results: DayResult[] }) {
  const last = results[results.length - 1].bool[metric];
  const yes = metric === "talked_to_someone" ? "rozmawiał(a) z kimś" : "wyszedł(a) z domu";
  return (
    <figure className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{METRIC_LABEL_PL[metric]}</span>
        <span className={cn("text-xs", last.flagged ? "font-medium text-orange-800" : "text-stone-500")}>
          {last.streak > 0 ? `${last.streak} dni z rzędu „nie”` : last.rate != null ? `zwykle „tak” w ${Math.round(last.rate * 100)}% dni` : "kalibracja"}
        </span>
      </figcaption>
      <ol className="mt-3 flex gap-[3px]" aria-label={`${METRIC_LABEL_PL[metric]}, ostatnie ${results.length} dni`}>
        {results.map((r) => {
          const v = r.bool[metric].value;
          return (
            <li
              key={r.date}
              title={`${fmtDateShort(r.date)}: ${v === null ? "brak danych" : v ? yes : "nie"}`}
              className={cn("h-6 flex-1 rounded-[4px]", v === null ? "bg-stone-100" : v ? "bg-teal-700" : "bg-orange-300", r.bool[metric].flagged && "ring-2 ring-orange-600 ring-offset-1")}
            >
              <span className="sr-only">{fmtDateShort(r.date)}: {v === null ? "brak danych" : v ? "tak" : "nie"}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-2 flex gap-3 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-teal-700" />tak</span>
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-orange-300" />nie</span>
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-stone-100 ring-1 ring-stone-200" />brak rozmowy / nie powiedział(a)</span>
      </div>
    </figure>
  );
}
