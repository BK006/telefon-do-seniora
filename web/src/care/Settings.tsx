import { useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Icon, IconTile } from "./icons";
import { callSummary, useCare, type CareConfig } from "./state";
import { QuestionsEditor, StepForm, STEPS } from "./steps";
import { Btn, Card, Field, TextInput, Toggle } from "./ui";

export function Questions() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[30px] font-black">Pytania</h1>
        <p className="mt-1 text-[var(--plum-600)]">To asystent zbierze w każdej rozmowie. Zmiany obowiązują od następnego połączenia.</p>
      </div>
      <QuestionsEditor />
    </div>
  );
}

function sectionSummary(c: CareConfig, i: number) {
  return [
    `${c.imie} · „${c.forma}” · ${c.relacja}`,
    `Choroby: ${c.choroby.length} · Leki: ${c.leki.length}`,
    `${c.zaint.slice(0, 3).join(", ")}${c.zaint.length > 3 ? "…" : ""}`,
    `Aktywne: ${c.questions.filter((q) => q.on).length} z ${c.questions.length}`,
    callSummary(c).split(".")[0],
    `${c.emaile.length === 1 ? "1 adres" : `${c.emaile.length} adresy`} e-mail`,
    "Pierwsze zdanie rozmowy i zgoda",
  ][i];
}

export function Settings() {
  const { cfg, pause, setPause } = useCare();
  return (
    <div className="space-y-5">
      <h1 className="text-[30px] font-black">Ustawienia</h1>
      <Card>
        <div className="flex items-center gap-4">
          <IconTile name="pause" tone="purple" size={48} />
          <div className="flex-1">
            <h2 className="text-[20px] font-black">Wstrzymaj rozmowy</h2>
            <p className="text-[15px] font-bold text-[var(--plum-600)]">Np. na czas wyjazdu lub pobytu w szpitalu</p>
          </div>
          <Toggle checked={pause.on} onChange={(v) => setPause({ on: v })} label="Wstrzymaj rozmowy" />
        </div>
        {pause.on && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Do kiedy" htmlFor="until">
              <TextInput id="until" type="date" value={pause.until} onChange={(e) => setPause({ until: e.target.value })} />
            </Field>
            <Field label="Powód (widzisz tylko Ty)" htmlFor="why">
              <TextInput id="why" value={pause.why} onChange={(e) => setPause({ why: e.target.value })} />
            </Field>
            <p className="font-extrabold text-[var(--violet-text-dark)] sm:col-span-2">
              Asystent nie zadzwoni do {pause.until.split("-").reverse().join(".")}. Potem wróci do zwykłego planu.
            </p>
          </div>
        )}
      </Card>
      <ul className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.set}>
            <Link to={`/app/ustawienia/${i + 1}`} className="card card-press flex items-center gap-4 p-4 sm:p-5">
              <IconTile name={s.ic} tone={s.c} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block text-[18px] font-black">{s.set}</span>
                <span className="block truncate text-[15px] font-bold text-[var(--plum-600)]">{sectionSummary(cfg, i)}</span>
              </span>
              <Icon name="chevronR" className="shrink-0 text-[var(--plum-400)]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SettingsEdit() {
  const { n } = useParams();
  const idx = Math.max(0, Math.min(6, Number(n) - 1 || 0));
  const { cfg, replaceCfg } = useCare();
  const nav = useNavigate();
  const snapshot = useRef(cfg); // "Anuluj" restores what was there when the section opened

  return (
    <div className="space-y-5 pb-24">
      <Link to="/app/ustawienia" className="inline-flex items-center gap-1 rounded-lg text-[16px] font-extrabold text-[var(--violet-text)]">
        <Icon name="chevronL" size={20} /> Ustawienia
      </Link>
      <h1 className="text-[30px] leading-tight font-black">{STEPS[idx].title}</h1>
      <StepForm step={idx} />
      <div className="fixed inset-x-0 bottom-[76px] z-10 border-t-2 border-[var(--line)] bg-white/90 backdrop-blur-xl md:bottom-0 md:left-[248px]">
        <div className="mx-auto flex max-w-[1000px] justify-end gap-3 px-4 py-3 md:px-10">
          <Btn
            variant="white"
            onClick={() => {
              replaceCfg(snapshot.current);
              nav("/app/ustawienia");
            }}
          >
            Anuluj
          </Btn>
          <Btn
            onClick={() => {
              toast.success("Zapisano zmiany.");
              nav("/app/ustawienia");
            }}
          >
            Zapisz zmiany
          </Btn>
        </div>
      </div>
    </div>
  );
}
