// The 7 configuration steps. Shared by the onboarding wizard and by Settings → edit section.
import { useState, type DragEvent, type KeyboardEvent } from "react";
import { Mascot, type Mood } from "./Mascot";
import { Icon, IconTile, TONE, type IconName, type Tone } from "./icons";
import { callSummary, DF, DN, introSentence, useCare, type CareConfig, type QuestionCfg } from "./state";
import { AddField, Btn, Card, Chip, Field, RemovableChip, Segmented, SwitchRow, TextArea, TextInput, Toggle } from "./ui";

export const STEPS: { title: string; set: string; tip: string; mood: Mood; ic: IconName; c: Tone }[] = [
  { title: "O kim się troszczysz?", set: "O kim się troszczysz", tip: "Napisz, jak mama lubi, żeby się do niej zwracać. Użyję dokładnie tych słów.", mood: "radosc", ic: "user", c: "green" },
  { title: "Zdrowie i kontekst", set: "Zdrowie i kontekst", tip: "Dzięki temu nie zaproponuję spaceru po schodach, jeśli są dla mamy trudne. Niczego nie będę doradzać.", mood: "zamyslenie", ic: "heart", c: "red" },
  { title: "Co lubi i o czym rozmawiać", set: "Co lubi i o czym rozmawiać", tip: "O kocie i działce rozmawia się najprzyjemniej. Napisz też, czego lepiej nie poruszać.", mood: "radosc", ic: "star", c: "yellow" },
  { title: "Co mam zebrać w rozmowie?", set: "Pytania", tip: "Ułóż pytania w kolejności, w jakiej mam je zadawać. Wyłącz te, które nie są potrzebne.", mood: "zamyslenie", ic: "list", c: "blue" },
  { title: "Kiedy dzwonić?", set: "Kiedy dzwonić", tip: "Najlepiej o stałej porze, kiedy mama jest w domu, np. po śniadaniu.", mood: "czeka", ic: "calendar", c: "purple" },
  { title: "Jak mam Cię powiadamiać?", set: "Powiadomienia", tip: "Jeśli usłyszę coś niepokojącego, napiszę od razu. Resztę zbiorę w podsumowaniu.", mood: "troska", ic: "mail", c: "orange" },
  { title: "Podgląd i zgoda", set: "Przedstawienie asystenta i zgoda", tip: "Tak się przedstawię. Zawsze mówię, że jestem asystentem AI.", mood: "radosc", ic: "shield", c: "green" },
];

export function StepTip({ step, compact }: { step: number; compact?: boolean }) {
  const s = STEPS[step];
  return (
    <div className="flex items-end gap-3">
      <Mascot mood={s.mood} size={compact ? 76 : 96} decorative />
      <p className="relative mb-4 rounded-[20px] rounded-bl-[6px] border-2 border-[var(--line)] bg-white px-4 py-3 text-[16px] font-bold text-[var(--plum-700)]">{s.tip}</p>
    </div>
  );
}

function useDraft() {
  const [d, setD] = useState<Record<string, string>>({});
  return { get: (k: string) => d[k] ?? "", set: (k: string, v: string) => setD((p) => ({ ...p, [k]: v })) };
}

function multi(cfg: CareConfig, setCfg: (p: Partial<CareConfig>) => void, key: "choroby" | "ruch" | "zaint", options: string[]) {
  const sel = cfg[key];
  const all = options.concat(sel.filter((x) => !options.includes(x)));
  return all.map((o) => (
    <Chip key={o} on={sel.includes(o)} onClick={() => setCfg({ [key]: sel.includes(o) ? sel.filter((x) => x !== o) : sel.concat(o) } as Partial<CareConfig>)}>
      {o}
    </Chip>
  ));
}

export function StepForm({ step }: { step: number }) {
  const { cfg, setCfg } = useCare();
  const draft = useDraft();
  const addTo = (key: "choroby" | "zaint" | "bliscy" | "unikac" | "emaile", dk: string) => {
    const v = draft.get(dk).trim();
    if (!v) return;
    if (!cfg[key].includes(v)) setCfg({ [key]: cfg[key].concat(v) } as Partial<CareConfig>);
    draft.set(dk, "");
  };

  if (step === 0)
    return (
      <div className="space-y-6">
        <Field label="Imię i nazwisko" htmlFor="imie">
          <TextInput id="imie" value={cfg.imie} onChange={(e) => setCfg({ imie: e.target.value })} autoComplete="off" />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Rok urodzenia" htmlFor="rok">
            <TextInput id="rok" inputMode="numeric" value={cfg.rok} onChange={(e) => setCfg({ rok: e.target.value })} />
          </Field>
          <Field label="Płeć (do poprawnej formy: spała / spał)">
            <Segmented label="Płeć" value={cfg.plec} options={[["f", "Kobieta"], ["m", "Mężczyzna"]]} onChange={(v) => setCfg({ plec: v })} />
          </Field>
        </div>
        <Field label="Jak asystent ma się do niej zwracać?" htmlFor="forma">
          <TextInput id="forma" value={cfg.forma} onChange={(e) => setCfg({ forma: e.target.value })} />
          <div className="flex flex-wrap gap-2 pt-1">
            {["Pani Halino", "Pani Halinko", "Halinko", "Mamo"].map((o) => (
              <Chip key={o} on={cfg.forma === o} onClick={() => setCfg({ forma: o })}>
                {o}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Numer telefonu" htmlFor="tel" help="Na ten numer będzie dzwonił asystent.">
          <div className="flex items-stretch gap-2">
            <span className="grid h-[54px] place-items-center rounded-[16px] border-2 border-[var(--line)] bg-[var(--bg-muted)] px-4 text-[17px] font-extrabold">+48</span>
            <TextInput id="tel" inputMode="tel" autoComplete="tel-national" value={cfg.tel} onChange={(e) => setCfg({ tel: e.target.value })} className="flex-1" />
          </div>
        </Field>
        <Field label="Kim jest dla Ciebie?">
          <div className="flex flex-wrap gap-2">
            {["Mama", "Tata", "Babcia", "Dziadek", "Ciocia", "Inna osoba"].map((o) => (
              <Chip key={o} on={cfg.relacja === o} onClick={() => setCfg({ relacja: o, plec: ["Tata", "Dziadek"].includes(o) ? "m" : ["Mama", "Babcia", "Ciocia"].includes(o) ? "f" : cfg.plec })}>
                {o}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Twoje imię (w dopełniaczu)" htmlFor="caller" help="Asystent powie: „Dzwonię w imieniu Kasi”.">
          <TextInput id="caller" value={cfg.callerName} onChange={(e) => setCfg({ callerName: e.target.value })} />
        </Field>
        <Card className="divide-y-2 divide-[var(--bg-muted)] py-2">
          <SwitchRow label="Słabiej słyszy" desc="Asystent mówi wolniej i głośniej" checked={cfg.slabiej} onChange={(v) => setCfg({ slabiej: v })} />
          <SwitchRow label="Woli krótkie rozmowy" desc="Do 3 minut, tylko najważniejsze pytania" checked={cfg.krotkie} onChange={(v) => setCfg({ krotkie: v })} />
        </Card>
      </div>
    );

  if (step === 1)
    return (
      <div className="space-y-6">
        <div className="flex gap-3 rounded-[20px] bg-[var(--violet-50)] p-4 text-[var(--violet-text-dark)]">
          <Icon name="shield" className="mt-0.5 shrink-0" />
          <p className="font-bold">To kontekst dla asystenta, nie podstawa do porad medycznych. Asystent niczego nie diagnozuje i nie doradza w sprawie leków.</p>
        </div>
        <Field label="Choroby przewlekłe">
          <div className="flex flex-wrap gap-2">{multi(cfg, setCfg, "choroby", ["Nadciśnienie", "Cukrzyca", "Zwyrodnienie stawów", "Choroba serca", "Osteoporoza", "Problemy z pamięcią"])}</div>
          <AddField label="Dodaj chorobę" placeholder="Dodaj inną…" value={draft.get("choroby")} onChange={(v) => draft.set("choroby", v)} onAdd={() => addTo("choroby", "choroby")} />
        </Field>
        <Field label="Krótka historia chorób" htmlFor="hist">
          <TextArea id="hist" value={cfg.historia} onChange={(e) => setCfg({ historia: e.target.value })} />
        </Field>
        <Field label="Leki i pora ich brania">
          <ul className="space-y-2">
            {cfg.leki.map((l, i) => (
              <li key={i} className="flex gap-2">
                <TextInput aria-label={`Nazwa leku ${i + 1}`} value={l.n} onChange={(e) => setCfg({ leki: cfg.leki.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)) })} className="flex-1" />
                <TextInput aria-label={`Godzina leku ${i + 1}`} type="time" value={l.t} onChange={(e) => setCfg({ leki: cfg.leki.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)) })} className="w-32" />
                <button type="button" aria-label={`Usuń lek: ${l.n || "bez nazwy"}`} onClick={() => setCfg({ leki: cfg.leki.filter((_, j) => j !== i) })} className="grid w-[54px] shrink-0 place-items-center rounded-[16px] border-2 border-[var(--line)] text-[var(--plum-600)] hover:bg-[var(--bg-app)]">
                  <Icon name="x" size={20} />
                </button>
              </li>
            ))}
          </ul>
          <Btn variant="white" icon="plus" type="button" onClick={() => setCfg({ leki: cfg.leki.concat({ n: "", t: "08:00" }) })}>
            Dodaj lek
          </Btn>
        </Field>
        <Field label="Ograniczenia ruchowe">
          <div className="flex flex-wrap gap-2">{multi(cfg, setCfg, "ruch", ["Trudności ze schodami", "Chodzi o lasce", "Porusza się na wózku", "Nie wychodzi sama"])}</div>
        </Field>
      </div>
    );

  if (step === 2)
    return (
      <div className="space-y-6">
        <Field label="Zainteresowania">
          <div className="flex flex-wrap gap-2">{multi(cfg, setCfg, "zaint", ["Ogród", "Radio", "Krzyżówki", "Kot", "Wnuki", "Gotowanie", "Seriale", "Kościół", "Spacery"])}</div>
          <AddField label="Dodaj zainteresowanie" placeholder="Dodaj inne…" value={draft.get("zaint")} onChange={(v) => draft.set("zaint", v)} onAdd={() => addTo("zaint", "zaint")} />
        </Field>
        <Field label="Bliscy i zwierzęta" help="Asystent może o nich zapytać — np. „Dzwoniła Zosia?”">
          <div className="flex flex-wrap gap-2">
            {cfg.bliscy.map((b) => (
              <RemovableChip key={b} label={b} onRemove={() => setCfg({ bliscy: cfg.bliscy.filter((x) => x !== b) })} />
            ))}
          </div>
          <AddField label="Dodaj bliską osobę" placeholder="np. Zosia (wnuczka)" value={draft.get("bliscy")} onChange={(v) => draft.set("bliscy", v)} onAdd={() => addTo("bliscy", "bliscy")} />
        </Field>
        <Field label="Ulubione tematy rozmów" htmlFor="tematy">
          <TextArea id="tematy" value={cfg.tematy} onChange={(e) => setCfg({ tematy: e.target.value })} />
        </Field>
        <Field label="Tematy, których unikać">
          <div className="flex flex-wrap gap-2">
            {cfg.unikac.map((b) => (
              <RemovableChip key={b} tone="red" label={b} onRemove={() => setCfg({ unikac: cfg.unikac.filter((x) => x !== b) })} />
            ))}
          </div>
          <AddField label="Dodaj temat do unikania" placeholder="np. polityka" value={draft.get("unikac")} onChange={(v) => draft.set("unikac", v)} onAdd={() => addTo("unikac", "unikac")} />
        </Field>
      </div>
    );

  if (step === 3) return <QuestionsEditor />;

  if (step === 4)
    return (
      <div className="space-y-6">
        <Field label="W które dni?">
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Dni tygodnia">
            {DN.map((l, i) => {
              const on = cfg.dni[i];
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  aria-label={DF[i]}
                  onClick={() => setCfg({ dni: cfg.dni.map((v, j) => (j === i ? !v : v)) })}
                  className="btn3d size-14 min-h-0 rounded-full p-0 text-[16px]"
                  style={{ background: on ? "#6A4BEB" : "#fff", color: on ? "#fff" : "#463C5A", border: `2px solid ${on ? "#6A4BEB" : "#E7E3F0"}`, ["--sh" as string]: on ? "#4A2FC0" : "#E7E3F0" }}
                >
                  {l}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Chip on={cfg.dni.slice(0, 5).every(Boolean) && !cfg.dni[5] && !cfg.dni[6]} onClick={() => setCfg({ dni: [true, true, true, true, true, false, false] })}>
              Pn–Pt
            </Chip>
            <Chip on={cfg.dni.every(Boolean)} onClick={() => setCfg({ dni: Array(7).fill(true) })}>
              Codziennie
            </Chip>
          </div>
        </Field>
        <Field label="O której godzinie?">
          <div className="flex flex-wrap items-center gap-2">
            {cfg.sloty.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput aria-label={`Godzina ${i + 1}`} type="time" value={s} onChange={(e) => setCfg({ sloty: cfg.sloty.map((x, j) => (j === i ? e.target.value : x)) })} className="w-36" />
                {cfg.sloty.length > 1 && (
                  <button type="button" aria-label="Usuń godzinę" onClick={() => setCfg({ sloty: cfg.sloty.filter((_, j) => j !== i) })} className="grid size-[54px] place-items-center rounded-[16px] border-2 border-[var(--line)] text-[var(--plum-600)]">
                    <Icon name="x" size={20} />
                  </button>
                )}
              </div>
            ))}
            {cfg.sloty.length < 2 && (
              <Btn variant="white" icon="plus" type="button" onClick={() => setCfg({ sloty: cfg.sloty.concat("18:00") })}>
                Druga godzina
              </Btn>
            )}
          </div>
        </Field>
        <Card className="space-y-4">
          <h3 className="text-[20px] font-black">Gdy nie odbierze</h3>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="font-extrabold">Spróbuj ponownie po</span>
            <Segmented label="Ponów po" value={cfg.retryH} options={[[1, "1 h"], [2, "2 h"], [3, "3 h"]]} onChange={(v) => setCfg({ retryH: v })} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="font-extrabold">Maksymalnie prób</span>
            <Segmented label="Maksymalnie prób" value={cfg.retryMax} options={[[1, "1"], [2, "2"], [3, "3"]]} onChange={(v) => setCfg({ retryMax: v })} />
          </div>
        </Card>
        <p className="rounded-[20px] bg-[var(--mint-50)] p-4 font-extrabold text-[var(--mint-text)]">{callSummary(cfg)}</p>
      </div>
    );

  if (step === 5) {
    const P = cfg.pow;
    const setP = (k: keyof typeof P, v: boolean | string) => setCfg({ pow: { ...P, [k]: v } });
    const rows: { k: "natychmiast" | "podsum" | "tydz" | "potrzeby" | "nieodebrala"; label: string; desc: string; ic: IconName; c: Tone }[] = [
      { k: "natychmiast", label: "Natychmiast przy niepokojącym sygnale", desc: "Np. gdy mama wspomni o upadku albo poprosi o pomoc", ic: "alert", c: "red" },
      { k: "podsum", label: "Podsumowanie rozmów", desc: "Jak mama się czuje i o czym rozmawialiśmy", ic: "mail", c: "green" },
      { k: "tydz", label: "Tygodniowe podsumowanie", desc: "W niedzielę wieczorem", ic: "calendar", c: "purple" },
      { k: "potrzeby", label: "Gdy czegoś potrzebuje", desc: "Zakupy, lekarstwa, pomoc", ic: "bag", c: "orange" },
      { k: "nieodebrala", label: "Gdy nie odbierze 2 dni z rzędu", desc: "Po wszystkich ponownych próbach", ic: "missed", c: "blue" },
    ];
    return (
      <div className="space-y-6">
        <Field label="Na jakie adresy e-mail?">
          <div className="flex flex-wrap gap-2">
            {cfg.emaile.map((m) => (
              <RemovableChip key={m} label={m} onRemove={() => setCfg({ emaile: cfg.emaile.filter((x) => x !== m) })} />
            ))}
          </div>
          <AddField label="Dodaj adres e-mail" placeholder="adres@email.pl" value={draft.get("email")} onChange={(v) => draft.set("email", v)} onAdd={() => addTo("emaile", "email")} />
        </Field>
        <Card className="py-2">
          {rows.map((r, i) => (
            <div key={r.k} className={i ? "border-t-2 border-[var(--bg-muted)]" : ""}>
              <SwitchRow label={r.label} desc={r.desc} checked={P[r.k]} onChange={(v) => setP(r.k, v)} icon={<IconTile name={r.ic} tone={r.c} size={44} />} />
              {r.k === "podsum" && P.podsum && (
                <div className="pb-3 pl-[60px]">
                  <Segmented label="Jak często podsumowanie" value={P.tryb} options={[["kazda", "Po każdej rozmowie"], ["dzien", "Raz dziennie"]]} onChange={(v) => setP("tryb", v)} />
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return <PreviewConsent />;
}

function PreviewConsent() {
  const { cfg, setCfg } = useCare();
  const [speaking, setSpeaking] = useState(false);
  const intro = introSentence(cfg);
  const speak = () => {
    try {
      const ss = window.speechSynthesis;
      if (!ss) return;
      ss.cancel();
      const u = new SpeechSynthesisUtterance(intro);
      u.lang = "pl-PL";
      u.rate = cfg.slabiej ? 0.82 : 1;
      u.onend = () => setSpeaking(false);
      setSpeaking(true);
      ss.speak(u);
    } catch {
      setSpeaking(false);
    }
  };
  const active = cfg.questions.filter((q) => q.on).length;
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-[20px] font-black">Tak przedstawi się asystent</h3>
        <div className="mt-4 flex items-end gap-3">
          <Mascot size={84} decorative />
          <p className="mb-3 rounded-[20px] rounded-bl-[6px] bg-[var(--violet-50)] px-4 py-3 text-[17px] font-bold text-[var(--violet-text-dark)]">„{intro}”</p>
        </div>
        <Btn variant="mint" icon={speaking ? "pause" : "play"} className="mt-5" type="button" onClick={speak}>
          {speaking ? "Odtwarzam…" : "Odsłuchaj"}
        </Btn>
      </Card>
      <Card>
        <h3 className="text-[20px] font-black">Podsumowanie</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[180px_1fr]">
          <dt className="font-extrabold text-[var(--plum-600)]">Do kogo</dt>
          <dd>{cfg.imie} · „{cfg.forma}” · +48 {cfg.tel}</dd>
          <dt className="font-extrabold text-[var(--plum-600)]">Kiedy</dt>
          <dd>{callSummary(cfg)}</dd>
          <dt className="font-extrabold text-[var(--plum-600)]">Pytania</dt>
          <dd>{active} aktywne z {cfg.questions.length}</dd>
          <dt className="font-extrabold text-[var(--plum-600)]">Powiadomienia</dt>
          <dd>{cfg.emaile.join(", ") || "brak adresu"}</dd>
        </dl>
      </Card>
      <label className="flex cursor-pointer items-start gap-4 rounded-[24px] border-2 p-5" style={{ borderColor: cfg.zgoda ? "var(--violet-200)" : "var(--line)", background: cfg.zgoda ? "var(--violet-50)" : "#fff" }}>
        <input type="checkbox" checked={cfg.zgoda} onChange={(e) => setCfg({ zgoda: e.target.checked })} className="mt-1 size-7 shrink-0 accent-[#4A2FC0]" />
        <span className="text-[18px] font-extrabold">{cfg.relacja || "Ta osoba"} wie o codziennych rozmowach z asystentem AI i się na nie zgadza.</span>
      </label>
    </div>
  );
}

export function QuestionsEditor() {
  const { cfg, setCfg } = useCare();
  const [drag, setDrag] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const qs = cfg.questions;
  const update = (id: string, patch: Partial<QuestionCfg>) => setCfg({ questions: qs.map((q) => (q.id === id ? { ...q, ...patch } : q)) });
  const move = (id: string, dir: number) => {
    const arr = qs.slice();
    const i = arr.findIndex((q) => q.id === id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setCfg({ questions: arr });
  };

  return (
    <div className="space-y-3">
      <p className="text-[15px] font-bold text-[var(--plum-600)]">
        Aktywne: {qs.filter((q) => q.on).length} z {qs.length}. Przeciągnij uchwyt lub użyj strzałek, aby zmienić kolejność.
      </p>
      <ol className="space-y-3">
        {qs.map((q, i) => {
          const t = TONE[q.c];
          return (
            <li
              key={q.id}
              onDragOver={(e: DragEvent) => {
                e.preventDefault();
                if (!drag || drag === q.id) return;
                const arr = qs.slice();
                const from = arr.findIndex((x) => x.id === drag);
                const to = arr.findIndex((x) => x.id === q.id);
                const [m] = arr.splice(from, 1);
                arr.splice(to, 0, m);
                setCfg({ questions: arr });
              }}
              className="flex items-center gap-3 rounded-[24px] border-2 p-3 pr-4 transition-[border-color,opacity] duration-150"
              style={{ background: q.on ? "#fff" : "#F7F5FF", borderColor: drag === q.id ? "#C9BCFF" : "#E7E3F0", opacity: drag === q.id ? 0.6 : 1 }}
            >
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  try {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", q.id);
                  } catch {
                    /* ignore */
                  }
                  setDrag(q.id);
                }}
                onDragEnd={() => setDrag(null)}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    move(q.id, -1);
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    move(q.id, 1);
                  }
                }}
                aria-label={`Przesuń pytanie: ${q.label}. Pozycja ${i + 1} z ${qs.length}. Użyj strzałek w górę i w dół.`}
                className="grid h-12 w-8 cursor-grab place-items-center rounded-lg text-[var(--plum-400)] active:cursor-grabbing"
              >
                <Icon name="grip" size={22} stroke={3.5} />
              </button>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: q.on ? t.bg : "#EFECF6", color: q.on ? t.fg : "#6F6782" }}>
                <Icon name={q.ic} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-black" style={{ color: q.on ? "#2B2140" : "#5E5470" }}>
                  {q.label}
                </span>
                <span className="block text-[15px] font-bold text-[var(--plum-600)]">{q.desc}</span>
              </span>
              <Toggle checked={q.on} onChange={(v) => update(q.id, { on: v })} label={`Pytanie aktywne: ${q.label}`} />
            </li>
          );
        })}
      </ol>
      {adding ? (
        <AddField
          label="Treść własnego pytania"
          placeholder="np. Czy podlała pani kwiaty?"
          value={draft}
          onChange={setDraft}
          onAdd={() => {
            const v = draft.trim();
            if (!v) return;
            setCfg({ questions: qs.concat({ id: "w" + Date.now(), label: v, desc: "Własne pytanie", ask: v, on: true, ic: "custom", c: "purple", own: true }) });
            setDraft("");
            setAdding(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[var(--line-strong)] text-[17px] font-extrabold text-[var(--violet-text)] hover:bg-[var(--bg-app)]"
        >
          <Icon name="plus" size={22} /> Dodaj własne pytanie
        </button>
      )}
    </div>
  );
}
