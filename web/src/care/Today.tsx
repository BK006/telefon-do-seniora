import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "./AppShell";
import { CallDialog } from "./CallDialog";
import { analyzeCall, listCalls, placeCall, type Analysis, type LiveCall } from "./api";
import { Icon, TONE, type IconName, type Tone } from "./icons";
import { Mascot, type Mood } from "./Mascot";
import { DF, DN, useCare, type DashState } from "./state";
import { Btn, Card, SectionTitle } from "./ui";

const STATUS: Record<"ok" | "zadzwon" | "pilne" | "nieodebrala", { title: string; bg: string; bd: string; fg: string; solid: string; icon: IconName; mood: Mood; text: string; meta: string; link: boolean }> = {
  ok: { title: "Wszystko w porządku", bg: "#DCF8EC", bd: "#3DDC97", fg: "#146B47", solid: "#1FB57A", icon: "check", mood: "radosc", link: true, text: "Mama zjadła śniadanie i miała gościa. Spała trochę gorzej niż zwykle. Poprosiła o chleb i mleko.", meta: "Rozmowa dziś o 10:00 · 7 min" },
  zadzwon: { title: "Warto zadzwonić", bg: "#FFF5D6", bd: "#FFC53D", fg: "#7A5600", solid: "#E0A100", icon: "phone", mood: "zamyslenie", link: true, text: "Mama czwarty dzień z rzędu mówi, że słabo śpi. Krótki telefon od Ciebie może ją ucieszyć.", meta: "Rozmowa dziś o 10:00 · 7 min" },
  pilne: { title: "Pilne", bg: "#FFE6EC", bd: "#F0466B", fg: "#B0183D", solid: "#D61F4B", icon: "alert", mood: "troska", link: true, text: "Mama powiedziała, że rano przewróciła się w kuchni. Sama wstała i mówi, że boli ją biodro.", meta: "Rozmowa dziś o 10:00 · 6 min" },
  nieodebrala: { title: "Nie odebrała", bg: "#EFECF6", bd: "#D3CDE0", fg: "#463C5A", solid: "#7D7590", icon: "missed", mood: "czeka", link: false, text: "Mama nie odebrała o 10:00. Asystent zadzwoni ponownie o 12:00 (druga z 2 prób). Jeśli znów się nie uda, napiszemy do Ciebie.", meta: "Następna próba: dziś, 12:00" },
};

const WEEK_STYLE = {
  ok: { bg: "#3DDC97", bd: "#3DDC97", bs: "solid", fg: "#10402C", icon: "check" as IconName, t: "odebrała" },
  retry: { bg: "#9C84FF", bd: "#9C84FF", bs: "solid", fg: "#2B2140", icon: "retry" as IconName, t: "ponowiona, odebrała" },
  missed: { bg: "#E7E3F0", bd: "#D3CDE0", bs: "solid", fg: "#463C5A", icon: "x" as IconName, t: "nie odebrała" },
  plan: { bg: "#FFFFFF", bd: "#D3CDE0", bs: "dashed", fg: "#A69FB5", icon: "dot" as IconName, t: "zaplanowana" },
};

const DEMO_STATES: [DashState, string][] = [
  ["ok", "W porządku"],
  ["zadzwon", "Warto zadzwonić"],
  ["pilne", "Pilne"],
  ["nieodebrala", "Nie odebrała"],
  ["pusty", "Prawdziwe dane"],
  ["ladowanie", "Ładowanie"],
];

const LIVE_STATUS = {
  ok: { title: "Wszystko w porządku", bg: "#DCF8EC", bd: "#3DDC97", fg: "#146B47", solid: "#1FB57A", icon: "check" as IconName, mood: "radosc" as Mood },
  zadzwon: { title: "Warto zadzwonić", bg: "#FFF5D6", bd: "#FFC53D", fg: "#7A5600", solid: "#E0A100", icon: "phone" as IconName, mood: "zamyslenie" as Mood },
  pilne: { title: "Pilne", bg: "#FFE6EC", bd: "#F0466B", fg: "#B0183D", solid: "#D61F4B", icon: "alert" as IconName, mood: "troska" as Mood },
};

/** Latest real call placed from the app, with its AI analysis — the dashboard's live state. */
function useLatestRealCall() {
  const [state, setState] = useState<{ call: LiveCall | null; analysis: Analysis | null; loading: boolean }>({ call: null, analysis: null, loading: true });
  useEffect(() => {
    let alive = true;
    (async () => {
      const calls = await listCalls();
      const call = calls[0] ?? null;
      let analysis: Analysis | null = null;
      if (call && call.status === "done" && call.answered) {
        const a = await analyzeCall(call.id);
        if (!("error" in a)) analysis = a;
      }
      if (alive) setState({ call, analysis, loading: false });
    })();
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

function LatestRealCall({ call, analysis }: { call: LiveCall; analysis: Analysis | null }) {
  const when = call.startedAt
    ? new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(call.startedAt * 1000))
    : "";
  if (!analysis) {
    const text = call.status !== "done" ? "Rozmowa trwa albo jest jeszcze przetwarzana. Odśwież za chwilę." : call.answered ? "Analiza rozmowy jest w przygotowaniu." : "Ostatnie połączenie nie zostało odebrane.";
    return (
      <Card className="flex items-center gap-4">
        <Mascot size={64} mood="czeka" decorative />
        <div className="flex-1">
          <p className="text-[15px] font-extrabold text-[var(--plum-600)] first-letter:uppercase">{when}</p>
          <p className="text-[18px] font-black">{text}</p>
        </div>
        <Link to={`/app/rozmowy/${call.id}`} className="font-extrabold text-[var(--violet-text)]">Szczegóły →</Link>
      </Card>
    );
  }
  const st = LIVE_STATUS[analysis.day.status];
  const ci = analysis.checkIn;
  return (
    <div className="space-y-4">
      <section className="flex items-center gap-5 rounded-[24px] border-2 p-5 sm:p-6" style={{ background: st.bg, borderColor: st.bd }} aria-labelledby="live-status-h">
        <span className="grid size-[60px] shrink-0 place-items-center self-start rounded-full text-white" style={{ background: st.solid }}>
          <Icon name={st.icon} size={30} stroke={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold" style={{ color: st.fg }}>Status po ostatniej rozmowie</p>
          <h2 id="live-status-h" className="text-[28px] leading-tight font-black" style={{ color: st.fg }}>{st.title}</h2>
          {analysis.day.reasons.length > 0 && <p className="font-extrabold" style={{ color: st.fg }}>Powód: {analysis.day.reasons.join(", ")}</p>}
          <p className="mt-1 text-[17px]">{ci.summary_pl}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-bold text-[var(--plum-600)]">
            <span className="first-letter:uppercase">{when}</span>
            <Link to={`/app/rozmowy/${call.id}`} className="font-extrabold text-[var(--violet-text)] underline-offset-4 hover:underline">Zobacz rozmowę →</Link>
          </p>
        </div>
        <div className="hidden sm:block"><Mascot size={84} mood={st.mood} decorative /></div>
      </section>
      {ci.needs.length > 0 && (
        <Card>
          <SectionTitle>Potrzebuje</SectionTitle>
          <ul className="mt-2 space-y-2">
            {ci.needs.map((n, i) => (
              <li key={i} className="flex items-start gap-3">
                <Icon name="bag" className="mt-0.5 shrink-0 text-[#B0245A]" />
                <span>
                  <span className="block text-[17px] font-extrabold">{n.item}</span>
                  <span className="block text-[15px] italic text-[var(--plum-600)]">«{n.evidence}»</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function MiniChart({ label, icon, tone, data }: { label: string; icon: IconName; tone: Tone; data: (number | null)[] }) {
  const t = TONE[tone];
  const X = (i: number) => +((i * 300) / 29).toFixed(1);
  const Y = (v: number) => +(88 - ((v - 1) / 4) * 72).toFixed(1);
  let d = "";
  let pen = false;
  let lx = 0;
  let ly = 0;
  data.forEach((v, i) => {
    if (v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${X(i)} ${Y(v)}`;
    pen = true;
    lx = X(i);
    ly = Y(v);
  });
  let k = 0;
  for (let i = 29; i >= 0 && data[i] != null && (data[i] as number) < 3; i--) k++;
  const withheld = data[29] == null;
  const status = withheld ? "Dziś mama poprosiła, by tego nie przekazywać" : k >= 2 ? `Ostatnie ${k} dni poniżej jej normy` : "W jej normie";
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl" style={{ background: t.bg, color: t.fg }}>
          <Icon name={icon} size={22} />
        </span>
        <div>
          <h3 className="text-[19px] font-black">{label}</h3>
          <p className="text-[15px]" style={{ color: k >= 2 ? "#B0245A" : "#463C5A", fontWeight: k >= 2 ? 900 : 700 }}>
            {status}
          </p>
        </div>
      </div>
      <svg viewBox="-8 -8 316 108" className="mt-4 w-full" role="img" aria-label={`${label}, ostatnie 30 dni. Zwykły poziom 3–4. ${status}.`}>
        <rect x="-4" y={Y(4) - 7} width="308" height={Y(3) - Y(4) + 14} rx="10" fill="#DCF8EC" />
        <text x="300" y={Y(4) - 11} textAnchor="end" fontSize="11" fontWeight="800" fill="#146B47">
          jej norma
        </text>
        <path d={d} fill="none" stroke={t.stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {!withheld && <circle cx={lx} cy={ly} r="7" fill={t.stroke} stroke="#fff" strokeWidth="3" />}
      </svg>
    </Card>
  );
}

export function Today() {
  const { cfg, setCfg, dash, setDash, needs, toggleNeed, pause, setPause } = useCare();
  const [askCall, setAskCall] = useState(false);
  const nav = useNavigate();
  const [skipped, setSkipped] = useState(false);
  const [calling, setCalling] = useState<"idle" | "dialing" | "done">("idle");
  const live = useLatestRealCall();
  const who = cfg.relacja || "Mama";
  const today = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  // "Zadzwoń teraz" always asks to confirm the number first (pre-filled from settings).
  function callNow() {
    setAskCall(true);
  }

  async function dial(tel: string) {
    setAskCall(false);
    if (tel !== cfg.tel) setCfg({ tel });
    setCalling("dialing");
    const r = await placeCall({ ...cfg, tel });
    if (r.ok) {
      toast.success(`Asystent dzwoni do: ${cfg.forma}`, { description: `Numer +48 ${tel}. Rozmowa pojawi się w zakładce Rozmowy.` });
      setCalling("done");
    } else {
      toast.message("Połączenie testowe", { description: r.message });
      setCalling("idle");
    }
  }

  const header = (
    <div className="flex items-center gap-4">
      <Avatar size={64} />
      <div>
        <h1 className="text-[30px] leading-tight font-black">{who}</h1>
        <p className="text-[var(--plum-600)]">
          {cfg.imie} · {today}
        </p>
      </div>
    </div>
  );

  const demoSwitch = (
    <details className="group rounded-2xl border-2 border-dashed border-[var(--line-strong)] bg-white/60 px-4 py-2 text-[15px]">
      <summary className="cursor-pointer font-extrabold text-[var(--plum-600)]">Demo: pokaż inny stan pulpitu</summary>
      <div className="flex flex-wrap gap-2 py-2" role="group" aria-label="Stan pulpitu (demo)">
        {DEMO_STATES.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={dash === v} onClick={() => setDash(v)} className="min-h-10 rounded-xl border-2 px-3 font-extrabold" style={{ background: dash === v ? "var(--violet-50)" : "#fff", borderColor: dash === v ? "var(--violet-200)" : "var(--line)", color: dash === v ? "var(--violet-text-dark)" : "var(--plum-700)" }}>
            {l}
          </button>
        ))}
      </div>
    </details>
  );

  if (dash === "ladowanie")
    return (
      <div className="space-y-6" aria-busy="true">
        {header}
        <CallDialog open={askCall} onOpenChange={setAskCall} onConfirm={dial} />
        <div className="flex items-center gap-4">
          <Mascot size={56} mood="zamyslenie" decorative />
          <p className="font-extrabold text-[var(--plum-600)]">Wczytuję ostatnie rozmowy…</p>
        </div>
        <div className="skeleton h-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="skeleton h-48" />
          <div className="skeleton h-48" />
        </div>
        {demoSwitch}
      </div>
    );

  if (dash === "pusty")
    return (
      <div className="space-y-6">
        {header}
        <CallDialog open={askCall} onOpenChange={setAskCall} onConfirm={dial} />
        {live.loading ? (
          <div className="skeleton h-40" aria-busy="true" />
        ) : live.call ? (
          <>
            <LatestRealCall call={live.call} analysis={live.analysis} />
            <Card className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold text-[var(--plum-600)]">Następna rozmowa</p>
                <p className="text-[22px] font-black">{calling === "dialing" ? `Asystent dzwoni do: ${cfg.forma}…` : `Jutro, ${cfg.sloty[0]}`}</p>
              </div>
              <Btn variant="mint" icon="phone" onClick={callNow} disabled={calling === "dialing"}>
                {calling === "dialing" ? "Łączę…" : "Zadzwoń teraz"}
              </Btn>
            </Card>
          </>
        ) : (
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <Mascot size={160} mood="czeka" />
          <h2 className="mt-5 text-[28px] font-black">Czekam na pierwszą rozmowę</h2>
          <p className="mt-2 max-w-md text-[var(--plum-600)]">
            Zadzwonię {cfg.dni.every(Boolean) ? "codziennie" : "w wybrane dni"} o {cfg.sloty[0]}. Po pierwszej rozmowie zobaczysz tu, jak {who.toLowerCase()} się czuje.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Btn variant="white" onClick={() => nav("/app/pytania")}>
              Sprawdź pytania
            </Btn>
            <Btn variant="mint" icon="phone" onClick={callNow} disabled={calling === "dialing"}>
              {calling === "dialing" ? "Łączę…" : "Zadzwoń teraz na próbę"}
            </Btn>
          </div>
        </Card>
        )}
        {demoSwitch}
      </div>
    );

  const st = STATUS[dash as keyof typeof STATUS] ?? STATUS.ok;
  const week = (["ok", "retry", "ok", "ok", "retry", dash === "nieodebrala" ? "missed" : "ok", "plan"] as const).map((k, i) => ({ ...WEEK_STYLE[k], l: DN[i], i }));
  const left = needs.filter((n) => !n.done).length;
  const sen = [4, 3, 4, 4, 3, 4, 3, 3, 4, 4, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 3, 3, 3, 3];
  if (dash === "zadzwon" || dash === "pilne") [26, 27, 28, 29].forEach((i) => (sen[i] = 2));
  else sen[29] = 2;
  const ap = [3, 4, 4, 3, 4, 4, 3, 4, 3, 4, 4, 4, 3, 3, 4, 4, 3, 4, 4, 3, 4, 3, 4, 4, 3, 4, 4, 4, 4, 3];
  const sm: (number | null)[] = [4, 4, 3, 4, 5, 4, 4, 3, 4, 4, 4, 5, 4, 3, 4, 4, 4, 3, 4, 4, 5, 4, 4, 3, 4, 5, 4, 4, 4, null];

  return (
    <div className="space-y-5">
      {header}
      <CallDialog open={askCall} onOpenChange={setAskCall} onConfirm={dial} />

      {pause.on && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[var(--violet-600)] px-5 py-4 text-white">
          <p className="flex items-center gap-2 text-[18px] font-extrabold">
            <Icon name="pause" /> Rozmowy wstrzymane do {pause.until.split("-").reverse().slice(0, 2).join(".")}
            {pause.why ? ` · ${pause.why}` : ""}
          </p>
          <Btn variant="white" onClick={() => setPause({ on: false })}>
            Wznów rozmowy
          </Btn>
        </div>
      )}

      {dash === "pilne" && (
        <section role="alert" className="rounded-[24px] border-4 border-[var(--red-500)] bg-[#FFF2F5] p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[15px] font-black tracking-wide text-[var(--red-text)] uppercase">
            <Icon name="alert" size={20} /> Pilne · dziś, 10:06
          </p>
          <p className="mt-2 text-[22px] leading-snug font-extrabold">Mama wspomniała o upadku. Asystent poinformował ją o numerze 112. Zadzwoń do niej teraz.</p>
          <a href={`tel:+48${cfg.tel.replace(/\s/g, "")}`} className="btn3d btn3d-urgent mt-5 min-h-16 w-full text-[19px]">
            <Icon name="phone" /> Zadzwoń do mamy
          </a>
        </section>
      )}

      <section className="flex items-center gap-5 rounded-[24px] border-2 p-5 sm:p-6" style={{ background: st.bg, borderColor: st.bd }} aria-labelledby="status-h">
        <span className="grid size-[60px] shrink-0 place-items-center self-start rounded-full text-white" style={{ background: st.solid }}>
          <Icon name={st.icon} size={30} stroke={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold" style={{ color: st.fg }}>
            Status dnia
          </p>
          <h2 id="status-h" className="text-[28px] leading-tight font-black" style={{ color: st.fg }}>
            {st.title}
          </h2>
          <p className="mt-1 text-[17px]">{st.text}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-bold text-[var(--plum-600)]">
            {st.meta}
            {st.link && (
              <Link to="/app/rozmowy/s1" className="font-extrabold text-[var(--violet-text)] underline-offset-4 hover:underline">
                Zobacz rozmowę →
              </Link>
            )}
          </p>
        </div>
        <div className="hidden sm:block">
          <Mascot size={84} mood={st.mood} decorative />
        </div>
      </section>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
        <Card>
          <div className="flex items-baseline justify-between gap-2">
            <SectionTitle>Potrzebuje</SectionTitle>
            <span className="text-[15px] font-extrabold text-[var(--plum-600)]">{left} do załatwienia</span>
          </div>
          <ul className="mt-3 space-y-1">
            {needs.map((n, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl p-2 hover:bg-[var(--bg-app)]">
                  <input type="checkbox" checked={n.done} onChange={() => toggleNeed(i)} className="mt-0.5 size-[26px] shrink-0 accent-[#4A2FC0]" aria-describedby={`need-${i}`} />
                  <span>
                    <span className="block text-[17px] font-extrabold" style={{ textDecoration: n.done ? "line-through" : "none", color: n.done ? "#6F6782" : "#2B2140" }}>
                      {n.t}
                    </span>
                    <span id={`need-${i}`} className="block text-[14px] font-bold text-[var(--plum-600)]">
                      {n.done ? "Załatwione" : n.src}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#FFF5D6] text-[#F5A800]">
              <Icon name="flame" size={26} />
            </span>
            <div>
              <SectionTitle>6 dni rozmów z rzędu</SectionTitle>
              <p className="text-[15px] font-bold text-[var(--plum-600)]">Najdłuższa seria: 14 dni</p>
            </div>
          </div>
          <ol className="mt-5 flex justify-between gap-1" aria-label="Rozmowy w tym tygodniu">
            {week.map((w) => (
              <li key={w.l} className="flex flex-col items-center gap-1.5">
                <span className="grid size-[38px] place-items-center rounded-full border-2" style={{ background: w.bg, borderColor: w.bd, borderStyle: w.bs, color: w.fg }}>
                  <Icon name={w.icon} size={18} stroke={3.5} />
                  <span className="sr-only">
                    {DF[w.i]}
                    {w.i === 5 ? " (dziś)" : ""}: {w.t}
                  </span>
                </span>
                <span className="text-[14px]" style={{ fontWeight: w.i === 5 ? 900 : 700, color: w.i === 5 ? "#2B2140" : "#5E5470" }} aria-hidden>
                  {w.l}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-bold text-[var(--plum-600)]">
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-[#3DDC97]" />odebrała</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-[#9C84FF]" />ponowiona</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-[#E7E3F0]" />nie odebrała</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-dashed border-[#D3CDE0]" />zaplanowana</span>
          </p>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-[var(--mint-50)] text-[var(--mint-text)]">
          <Icon name="calendar" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-[var(--plum-600)]">Najbliższa rozmowa</p>
          <p className="text-[22px] font-black" aria-live="polite">
            {skipped ? "Dzisiejsza rozmowa pominięta." : calling === "dialing" ? `Asystent dzwoni do: ${cfg.forma}…` : calling === "done" ? "Połączenie rozpoczęte — odbierz telefon" : `Dziś, ${cfg.sloty[cfg.sloty.length - 1]}`}
          </p>
        </div>
        {skipped ? (
          <Btn variant="white" onClick={() => setSkipped(false)}>
            Cofnij
          </Btn>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Btn variant="mint" icon="phone" onClick={callNow} disabled={calling === "dialing"}>
              {calling === "dialing" ? "Łączę…" : "Zadzwoń teraz"}
            </Btn>
            <Btn variant="white" onClick={() => setSkipped(true)}>
              Pomiń dziś
            </Btn>
          </div>
        )}
      </Card>

      <section aria-labelledby="trend-h">
        <SectionTitle className="mb-4">
          <span id="trend-h">Ostatnie 30 dni</span>
        </SectionTitle>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          <MiniChart label="Sen" icon="moon" tone="blue" data={sen} />
          <MiniChart label="Apetyt" icon="fork" tone="orange" data={ap} />
          <MiniChart label="Samopoczucie" icon="smile" tone="purple" data={sm} />
        </div>
      </section>

      {demoSwitch}
    </div>
  );
}
