import { useCallback, useEffect, useState } from "react";
import { analyzeCall, listCalls, type Analysis, type LiveCall } from "./api";
import { Link, useParams } from "react-router-dom";
import { Icon, TONE } from "./icons";
import { Mascot } from "./Mascot";
import { SESSION_STATUS, SESSIONS } from "./sessions";
import { QDEF, useCare } from "./state";
import { Btn, Card, SectionTitle } from "./ui";

const byId = Object.fromEntries(QDEF.map((q) => [q.id, q]));

// Real calls are cached per page load so list -> detail -> back doesn't refetch.
let liveCache: LiveCall[] | null = null;
function useLiveCalls() {
  const [calls, setCalls] = useState<LiveCall[] | null>(liveCache);
  const refresh = useCallback(async () => {
    setCalls(null);
    liveCache = await listCalls();
    setCalls(liveCache);
  }, []);
  useEffect(() => {
    if (liveCache === null) void refresh();
  }, [refresh]);
  return { calls, refresh };
}

const fmtStart = (ts: number | null) =>
  ts ? new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(ts * 1000)) : "—";
const fmtDur = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);

function LiveSection() {
  const { calls, refresh } = useLiveCalls();
  return (
    <section aria-labelledby="live-h" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionTitle>
            <span id="live-h">Historia połączeń</span>
          </SectionTitle>
          <p className="text-[15px] font-bold text-[var(--plum-600)]">Rozmowy, które asystent naprawdę przeprowadził przez telefon.</p>
        </div>
        <Btn variant="white" icon="retry" onClick={refresh} className="min-h-11">
          Odśwież
        </Btn>
      </div>
      {calls === null ? (
        <div className="skeleton h-24" aria-busy="true" />
      ) : calls.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-10 text-center">
          <Mascot size={120} mood="czeka" decorative />
          <h3 className="mt-4 text-[22px] font-black">Jeszcze nie było rozmów</h3>
          <p className="mt-1 max-w-sm text-[var(--plum-600)]">Pierwsza rozmowa pojawi się tutaj zaraz po zakończeniu połączenia, razem z analizą i zapisem.</p>
          <Link to="/app" className="btn3d btn3d-mint mt-5">
            <Icon name="phone" size={22} /> Zadzwoń teraz na próbę
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {calls.map((c) => (
            <li key={c.id}>
              <Link to={`/app/rozmowy/${c.id}`} className="card card-press flex items-center gap-4 p-4 sm:p-5">
                <span className="grid size-[60px] shrink-0 place-items-center rounded-2xl bg-[var(--mint-50)] text-[var(--mint-text)]">
                  <Icon name="phone" size={28} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[18px] font-black first-letter:uppercase">{fmtStart(c.startedAt)}</span>
                    <span className="text-[15px] font-bold text-[var(--plum-600)]">{c.status === "in-progress" ? "trwa…" : fmtDur(c.durationSecs)}</span>
                    <StatusChip st={c.answered ? "ok" : "missed"} />
                  </span>
                  <span className="mt-1 block text-[16px] text-[var(--plum-700)]">
                    {c.transcript.find((t) => t.role === "senior")?.text ? `„${c.transcript.filter((t) => t.role === "senior").slice(-3, -1).map((t) => t.text).join(" ") || c.transcript.find((t) => t.role === "senior")!.text}”` : "Brak wypowiedzi rozmówcy"}
                  </span>
                </span>
                <Icon name="chevronR" className="shrink-0 text-[var(--plum-400)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const DAY = {
  ok: { title: "Wszystko w porządku", bg: "#DCF8EC", bd: "#3DDC97", fg: "#146B47", icon: "check" as const },
  zadzwon: { title: "Warto zadzwonić", bg: "#FFF5D6", bd: "#FFC53D", fg: "#7A5600", icon: "phone" as const },
  pilne: { title: "Pilne", bg: "#FFE6EC", bd: "#F0466B", fg: "#B0183D", icon: "alert" as const },
};

function LiveAnalysis({ id }: { id: string }) {
  const [a, setA] = useState<Analysis | { error: string } | null>(null);
  useEffect(() => {
    let alive = true;
    analyzeCall(id).then((r) => alive && setA(r));
    return () => {
      alive = false;
    };
  }, [id]);
  if (a === null)
    return (
      <Card className="flex items-center gap-4">
        <Mascot size={56} mood="zamyslenie" decorative />
        <p className="font-extrabold text-[var(--plum-600)]">Analizuję rozmowę…</p>
      </Card>
    );
  if ("error" in a) return <p className="rounded-[20px] bg-[var(--bg-muted)] p-4 font-bold text-[var(--plum-700)]">{a.error}</p>;
  const ci = a.checkIn;
  const d = DAY[a.day.status];
  const score = (k: string, label: string, v: number | null, max: number, ev: string | null) => {
    const q = byId[k];
    if (v == null) return null;
    const t = TONE[q.c];
    return (
      <Card key={k} className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl" style={{ background: t.bg, color: t.fg }}>
            <Icon name={q.ic} size={22} />
          </span>
          <h3 className="text-[19px] font-black">{label}</h3>
        </div>
        <p className="mt-3 text-[24px] font-black tabular-nums">
          {v}/{max}
        </p>
        {ev && <p className="mt-2 rounded-2xl bg-[var(--bg-app)] px-4 py-3 text-[16px] italic">«{ev}»</p>}
      </Card>
    );
  };
  const fact = (k: string, label: string, v: boolean | null, yes: string, no: string, ev: string | null) => {
    const q = byId[k];
    if (v == null) return null;
    const t = TONE[q.c];
    return (
      <Card key={k} className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl" style={{ background: t.bg, color: t.fg }}>
            <Icon name={q.ic} size={22} />
          </span>
          <h3 className="text-[19px] font-black">{label}</h3>
        </div>
        <p className="mt-3 text-[18px] font-extrabold">{v ? yes : no}</p>
        {ev && <p className="mt-2 rounded-2xl bg-[var(--bg-app)] px-4 py-3 text-[16px] italic">«{ev}»</p>}
      </Card>
    );
  };
  return (
    <div className="space-y-5">
      <section className="flex items-start gap-4 rounded-[24px] border-2 p-5" style={{ background: d.bg, borderColor: d.bd }}>
        <span className="grid size-12 shrink-0 place-items-center rounded-full text-white" style={{ background: d.fg }}>
          <Icon name={d.icon} size={24} stroke={3} />
        </span>
        <div>
          <h2 className="text-[24px] font-black" style={{ color: d.fg }}>
            {d.title}
          </h2>
          {a.day.reasons.length > 0 && <p className="font-extrabold" style={{ color: d.fg }}>Powód: {a.day.reasons.join(", ")}</p>}
          <p className="mt-2 text-[17px]">{ci.summary_pl}</p>
        </div>
      </section>
      {ci.needs.length > 0 && (
        <Card>
          <h2 className="text-[20px] font-black">Potrzebuje</h2>
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
      <SectionTitle>Odpowiedzi</SectionTitle>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        {score("sen", "Sen", ci.sleep.quality, 5, ci.sleep.evidence)}
        {score("apetyt", "Apetyt", ci.appetite.level, 5, ci.appetite.evidence)}
        {score("samop", "Samopoczucie", ci.mood_self_report.level, 5, ci.mood_self_report.evidence)}
        {score("bol", ci.pain.location ? `Ból — ${ci.pain.location}` : "Ból", ci.pain.level, 10, ci.pain.evidence)}
        {fact("leki", "Leki", ci.medication.taken_as_planned, "Wzięła zgodnie z planem", "Nie wzięła", ci.medication.evidence)}
        {fact("wyjscie", "Wyjście z domu", ci.activity.left_home, "Wychodziła", "Nie wychodziła", ci.activity.evidence)}
        {fact("kontakt", "Kontakt z ludźmi", ci.social_contact.talked_to_someone, "Rozmawiała z kimś", "Z nikim nie rozmawiała", ci.social_contact.evidence)}
      </div>
      <p className="text-[14px] font-bold text-[var(--plum-600)]">
        Analiza: {a.model} (structured outputs). Każda wartość ma cytat jako dowód; tematy nieporuszone są pomijane, nie zgadywane. Status dnia liczą reguły, nie model.
      </p>
    </div>
  );
}

function LiveDetail({ id }: { id: string }) {
  const { calls } = useLiveCalls();
  const { cfg } = useCare();
  const c = calls?.find((x) => x.id === id);
  if (calls === null) return <div className="skeleton h-64" aria-busy="true" />;
  if (!c) return <p className="font-bold">Nie znaleziono tej rozmowy.</p>;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[30px] leading-tight font-black first-letter:uppercase">{fmtStart(c.startedAt)}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-3 font-bold text-[var(--plum-600)]">
          Prawdziwe połączenie · {fmtDur(c.durationSecs)} <StatusChip st={c.answered ? "ok" : "missed"} />
        </p>
      </div>
      {c.answered && <LiveAnalysis id={c.id} />}
      <section aria-labelledby="tr-h">
        <SectionTitle className="mb-4">
          <span id="tr-h">Zapis rozmowy</span>
        </SectionTitle>
        <ol className="space-y-3">
          {c.transcript.map((t, i) => {
            const ai = t.role === "ai";
            return (
              <li key={i} className={ai ? "flex justify-start" : "flex justify-end"}>
                <div className="max-w-[85%] border-2 px-4 py-3" style={{ background: ai ? "#F7F5FF" : "#DCF8EC", borderColor: ai ? "#E7E3F0" : "#B8F0D6", borderRadius: ai ? "6px 18px 18px 18px" : "18px 6px 18px 18px" }}>
                  <p className="text-[13px] font-black" style={{ color: ai ? "#5A3FD6" : "#146B47" }}>
                    {ai ? "Asystent AI" : cfg.relacja || "Rozmówca"}
                  </p>
                  <p className="text-[17px]">{t.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function StatusChip({ st }: { st: keyof typeof SESSION_STATUS }) {
  const s = SESSION_STATUS[st];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[14px] font-extrabold" style={{ background: s.bg, borderColor: s.bd, color: s.fg }}>
      <Icon name={s.icon} size={16} stroke={3} />
      {s.label}
    </span>
  );
}

export function CallsList() {
  return (
    <div className="space-y-5">
      <h1 className="text-[30px] font-black">Rozmowy</h1>
      <LiveSection />
    </div>
  );
}

export function CallDetail() {
  const { id } = useParams();
  const { cfg } = useCare();
  const [open, setOpen] = useState(false);
  if (id?.startsWith("conv_"))
    return (
      <div className="space-y-6">
        <Link to="/app/rozmowy" className="inline-flex items-center gap-1 rounded-lg text-[16px] font-extrabold text-[var(--violet-text)]">
          <Icon name="chevronL" size={20} /> Wszystkie rozmowy
        </Link>
        <LiveDetail id={id} />
      </div>
    );
  const s = SESSIONS.find((x) => x.id === id) ?? SESSIONS[0];
  const byId = Object.fromEntries(QDEF.map((q) => [q.id, q]));
  const answered = s.answers.map((a) => a.k);
  const withheld = s.withheld ?? [];
  const unanswered = cfg.questions.filter((q) => q.on && byId[q.id] && !answered.includes(q.id) && !withheld.includes(q.id));

  return (
    <div className="space-y-6">
      <Link to="/app/rozmowy" className="inline-flex items-center gap-1 rounded-lg text-[16px] font-extrabold text-[var(--violet-text)]">
        <Icon name="chevronL" size={20} /> Wszystkie rozmowy
      </Link>
      <div>
        <h1 className="text-[30px] leading-tight font-black">{s.date}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-[var(--plum-600)]">
          <span className="font-bold">
            {s.time} · {s.dur}
          </span>
          <StatusChip st={s.st} />
        </p>
        <p className="mt-3 text-[18px]">{s.sum}</p>
      </div>

      {s.st === "missed" ? (
        <Card className="flex items-center gap-5">
          <Mascot mood="troska" size={96} decorative />
          <div>
            <h2 className="text-[20px] font-black">Mama nie odebrała</h2>
            <ul className="mt-2 space-y-1 text-[var(--plum-700)]">
              <li>10:00 — pierwsza próba, bez odpowiedzi</li>
              <li>12:00 — druga próba, bez odpowiedzi</li>
            </ul>
          </div>
        </Card>
      ) : (
        <section aria-labelledby="ans-h" className="space-y-4">
          <SectionTitle>
            <span id="ans-h">Odpowiedzi</span>
          </SectionTitle>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
            {s.answers.map((a) => {
              const q = byId[a.k];
              const t = TONE[q.c];
              return (
                <Card key={a.k} className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl" style={{ background: t.bg, color: t.fg }}>
                      <Icon name={q.ic} size={22} />
                    </span>
                    <h3 className="text-[19px] font-black">{q.label}</h3>
                  </div>
                  {a.score != null && (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[24px] font-black tabular-nums">{a.score}/5</span>
                      <span className="flex gap-1" aria-hidden>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className="h-3 w-6 rounded-full" style={{ background: n <= a.score! ? t.stroke : "#E7E3F0" }} />
                        ))}
                      </span>
                    </div>
                  )}
                  {a.text && <p className="mt-3 text-[18px] font-extrabold">{a.text}</p>}
                  <p className="mt-3 rounded-2xl bg-[var(--bg-app)] px-4 py-3 text-[16px] italic">«{a.quote}»</p>
                </Card>
              );
            })}
            {unanswered.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-[24px] border-2 border-dashed border-[var(--line-strong)] p-5 text-[var(--plum-600)]">
                <Icon name={q.ic} size={22} />
                <span>
                  <span className="block font-black">{q.label}</span>
                  <span className="block text-[15px] font-bold">Nie rozmawialiśmy o tym</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {s.transcript && (
        <section>
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="card card-press flex w-full items-center justify-between p-5 text-left text-[19px] font-black">
            Zapis rozmowy
            <Icon name="chevronD" className={open ? "rotate-180 transition-transform duration-200" : "transition-transform duration-200"} />
          </button>
          {open && (
            <ol className="mt-4 space-y-3">
              {s.transcript.map(([w, t], i) => {
                const ai = w === "ai";
                return (
                  <li key={i} className={ai ? "flex justify-start" : "flex justify-end"}>
                    <div
                      className="max-w-[85%] border-2 px-4 py-3"
                      style={{
                        background: ai ? "#F7F5FF" : "#DCF8EC",
                        borderColor: ai ? "#E7E3F0" : "#B8F0D6",
                        borderRadius: ai ? "6px 18px 18px 18px" : "18px 6px 18px 18px",
                      }}
                    >
                      <p className="text-[13px] font-black" style={{ color: ai ? "#5A3FD6" : "#146B47" }}>
                        {ai ? "Asystent AI" : cfg.relacja || "Mama"}
                      </p>
                      <p className="text-[17px]">{t}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      {withheld.length > 0 && (
        <p className="flex items-center gap-3 rounded-[20px] bg-[var(--violet-50)] p-4 font-extrabold text-[var(--violet-text-dark)]">
          <Icon name="lock" /> Mama poprosiła, by nie przekazywać: {withheld.map((k) => byId[k].label.toLowerCase()).join(", ")}
        </p>
      )}
    </div>
  );
}
