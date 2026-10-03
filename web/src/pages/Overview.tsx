import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LevelBadge } from "@/components/LevelBadge";
import { fmtDateShort } from "@/lib/format";
import { useStore } from "@/lib/store";

const SCENARIO_PL: Record<string, string> = {
  stable: "Stabilny",
  noisy_normal: "Często gorszy dzień, ale w normie",
  chronic_pain: "Przewlekły ból, stabilny",
  gradual_decline: "Stopniowe pogorszenie snu i apetytu",
  withdrawal: "Narastające wycofanie",
  sudden_confusion: "Nagły epizod zagubienia",
  stops_answering: "Przestaje odbierać",
  new_enrolment: "Nowy w programie (kalibracja)",
};

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <p className="text-sm text-stone-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{sub}</p>
    </div>
  );
}

export function Overview() {
  const { data, alerts } = useStore();
  const counts = [0, 1, 2, 3].map((l) => data.seniors.filter((s) => s.level === l).length);
  const dates = data.seniors[0].results.map((r) => r.date);
  const trend = dates.map((date) => {
    const day = data.seniors.map((s) => s.results.find((r) => r.date === date)?.level ?? 0);
    return { date, contact: day.filter((l) => l === 2).length, urgent: day.filter((l) => l === 3).length, watch: day.filter((l) => l === 1).length };
  });
  const closed = alerts.filter((a) => a.status === "resolved" || a.status === "false_alarm");
  const fa = closed.filter((a) => a.status === "false_alarm").length;
  const ev = data.evaluation;
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  // group evaluation by scenario
  const byScenario = Object.entries(
    ev.cases.reduce<Record<string, { n: number; expected: boolean; detected: number; fa: number; delays: number[] }>>((acc, c) => {
      const g = (acc[c.scenario] ??= { n: 0, expected: c.expectedAlert, detected: 0, fa: 0, delays: [] });
      g.n++;
      if (c.detected) g.detected++;
      g.fa += c.falseAlarms;
      if (c.delayDays !== null) g.delays.push(c.delayDays);
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.02em]">Zbiorczo</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-600">Obciążenie ośrodka, trend alertów i to, jak dobrze silnik działa na oznaczonym zbiorze ewaluacyjnym.</p>
      </div>

      <section aria-labelledby="levels-h">
        <h2 id="levels-h" className="text-xl font-semibold tracking-tight">Seniorzy według poziomu ({data.seniors.length})</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[3, 2, 1, 0].map((l) => (
            <div key={l} className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
              <LevelBadge level={l} size="sm" />
              <p className="mt-3 text-3xl font-semibold tabular-nums">{counts[l]}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="trend-h" className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 id="trend-h" className="text-xl font-semibold tracking-tight">Trend: ilu seniorów wymagało kontaktu każdego dnia</h2>
        <div className="mt-4 h-64" role="img" aria-label="Wykres słupkowy liczby seniorów na poziomie Skontaktuj się i Pilne w ostatnich 30 dniach">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ left: -24, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#e7e5e4" strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }}
                labelFormatter={(d) => fmtDateShort(String(d))}
                formatter={(v, n) => [v, n === "contact" ? "Skontaktuj się" : n === "urgent" ? "Pilne" : "Obserwuj"]}
              />
              <Bar dataKey="contact" stackId="a" fill="#ea580c" radius={[0, 0, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="urgent" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          <span className="mr-1 inline-block size-2.5 rounded-sm bg-orange-600 align-middle" />Skontaktuj się
          <span className="mr-1 ml-4 inline-block size-2.5 rounded-sm bg-red-600 align-middle" />Pilne
        </p>
      </section>

      <section aria-labelledby="eval-h">
        <h2 id="eval-h" className="text-xl font-semibold tracking-tight">Trafność na zbiorze ewaluacyjnym</h2>
        <p className="mt-1 max-w-3xl text-sm text-stone-600">
          {ev.cases.length} seniorów, {ev.seniorDays} osobodni danych syntetycznych z oznaczonym oczekiwanym poziomem. To sprawdza logikę silnika, a nie
          skuteczność kliniczną — ta wymaga pilotażu na prawdziwych danych.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Wykryte pogorszenia" value={`${ev.truePositives}/${ev.positives}`} sub={`czułość ${pct(ev.recall)}`} />
          <Stat label="Fałszywe alarmy" value={String(ev.falseAlarms)} sub={`${ev.falseAlarmsPer100SeniorDays.toFixed(2)} na 100 osobodni`} />
          <Stat label="Precyzja alertów" value={pct(ev.precision)} sub={`${ev.episodes} alertów poziomu 2+`} />
          <Stat label="Średnie opóźnienie" value={ev.meanDelayDays === null ? "—" : `${ev.meanDelayDays.toFixed(1)} dnia`} sub="od oczekiwanego dnia alertu" />
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-xs text-stone-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Scenariusz</th>
                <th scope="col" className="px-4 py-3 font-medium">Seniorów</th>
                <th scope="col" className="px-4 py-3 font-medium">Oczekiwany alert</th>
                <th scope="col" className="px-4 py-3 font-medium">Wynik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {byScenario.map(([sc, g]) => (
                <tr key={sc}>
                  <td className="px-4 py-3">{SCENARIO_PL[sc] ?? sc}</td>
                  <td className="px-4 py-3 tabular-nums">{g.n}</td>
                  <td className="px-4 py-3">{g.expected ? "Tak" : "Nie"}</td>
                  <td className="px-4 py-3">
                    {g.expected
                      ? `${g.detected}/${g.n} wykryte${g.delays.length ? `, opóźnienie ${(g.delays.reduce((a, b) => a + b, 0) / g.delays.length).toFixed(1)} dnia` : ""}`
                      : g.fa === 0 ? "Bez alertu ✓" : `${g.fa} fałszywych alarmów`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          W pracy ośrodka: {closed.length} zamkniętych alertów, w tym {fa} oznaczonych jako fałszywy alarm ({closed.length ? pct(fa / closed.length) : "0%"}).
        </p>
      </section>
    </div>
  );
}
