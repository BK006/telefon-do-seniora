// Quick onboarding. mode "fresh": shown every time someone enters the app, with an empty
// form. mode "edit": opened from Settings, pre-filled with the current profile.
// Everything saved here goes straight into the agent's dynamic prompt via place-call.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { placeCall } from "./api";
import { isPlMobile } from "./CallDialog";
import { Mascot } from "./Mascot";
import { useCare, type CareConfig } from "./state";
import { Btn, Chip, Field, TextInput } from "./ui";

const RELATIONS: { label: string; vocative: string; plec: "f" | "m" }[] = [
  { label: "Mama", vocative: "Mamo", plec: "f" },
  { label: "Tata", vocative: "Tato", plec: "m" },
  { label: "Babcia", vocative: "Babciu", plec: "f" },
  { label: "Dziadek", vocative: "Dziadku", plec: "m" },
];

export function QuickStart({ open, onOpenChange, mode = "fresh" }: { open: boolean; onOpenChange: (o: boolean) => void; mode?: "fresh" | "edit" }) {
  const { cfg, setCfg } = useCare();
  const nav = useNavigate();
  const [relacja, setRelacja] = useState("");
  const [custom, setCustom] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [imie, setImie] = useState("");
  const [forma, setForma] = useState("");
  const [plec, setPlec] = useState<"f" | "m">("f");
  const [tel, setTel] = useState("");
  const [caller, setCaller] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset the form every time the dialog opens: empty for "fresh", current profile for "edit".
  useEffect(() => {
    if (!open) return;
    const edit = mode === "edit";
    const known = RELATIONS.some((r) => r.label === cfg.relacja);
    setRelacja(edit && known ? cfg.relacja : "");
    setIsCustom(edit && !known && !!cfg.relacja);
    setCustom(edit && !known ? cfg.relacja : "");
    setImie(edit ? cfg.imie : "");
    setForma(edit ? cfg.forma : "");
    setPlec(edit ? cfg.plec : "f");
    setTel(edit ? cfg.tel : "");
    setCaller(edit ? cfg.callerName : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const close = () => onOpenChange(false);

  const pickRelation = (r: (typeof RELATIONS)[number]) => {
    setIsCustom(false);
    setRelacja(r.label);
    setPlec(r.plec);
    if (!forma || RELATIONS.some((x) => x.vocative === forma)) setForma(r.vocative);
  };

  const patch = (): Partial<CareConfig> => ({
    relacja: isCustom ? custom.trim() || "Bliska osoba" : relacja || "Bliska osoba",
    imie: imie.trim(),
    forma: forma.trim() || imie.trim(),
    plec,
    tel: tel.trim(),
    callerName: caller.trim(),
  });

  const valid = imie.trim().length > 1 && isPlMobile(tel) && (relacja !== "" || (isCustom && custom.trim() !== ""));

  async function saveAndCall() {
    const p = patch();
    setCfg(p);
    setBusy(true);
    const r = await placeCall({ ...cfg, ...p });
    setBusy(false);
    close();
    if (r.ok) toast.success(`Asystent dzwoni: ${p.forma}`, { description: `Numer +48 ${p.tel}. Zapis pojawi się w zakładce Rozmowy.` });
    else toast.message("Połączenie", { description: r.message });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="care max-h-[92dvh] overflow-y-auto rounded-[28px] border-2 border-[var(--line)] p-6 sm:max-w-[560px] sm:p-8">
        <div className="flex items-end gap-3">
          <Mascot size={72} mood="radosc" decorative />
          <div className="mb-2">
            <DialogTitle className="text-[26px] leading-tight font-black">{mode === "edit" ? "Do kogo dzwonimy" : "Do kogo mam dzwonić?"}</DialogTitle>
            <DialogDescription className="text-[15px] font-bold text-[var(--plum-600)]">
              {mode === "edit" ? "Zmień osobę, formę zwracania się albo numer." : "Kilka szybkich pytań — resztę ustawisz później."}
            </DialogDescription>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <Field label="Kim jest dla Ciebie?">
            <div className="flex flex-wrap gap-2">
              {RELATIONS.map((r) => (
                <Chip key={r.label} on={!isCustom && relacja === r.label} onClick={() => pickRelation(r)}>
                  {r.label}
                </Chip>
              ))}
              <Chip on={isCustom} onClick={() => setIsCustom(true)}>
                Ktoś inny
              </Chip>
            </div>
            {isCustom && (
              <div className="space-y-2 pt-1">
                <TextInput aria-label="Kim jest ta osoba" placeholder="np. Ciocia, Sąsiadka, Pan Józef" value={custom} onChange={(e) => setCustom(e.target.value)} />
                <div className="flex gap-2">
                  <Chip on={plec === "f"} onClick={() => setPlec("f")}>
                    Kobieta
                  </Chip>
                  <Chip on={plec === "m"} onClick={() => setPlec("m")}>
                    Mężczyzna
                  </Chip>
                </div>
              </div>
            )}
          </Field>

          <Field label="Imię i nazwisko" htmlFor="qs-imie">
            <TextInput id="qs-imie" value={imie} onChange={(e) => setImie(e.target.value)} autoComplete="off" placeholder="np. Halina Kowalska" />
          </Field>

          <Field label="Jak asystent ma się zwracać?" htmlFor="qs-forma" help="Dokładnie tymi słowami zacznie rozmowę, np. „Pani Halino”, „Mamo”, „Panie Józefie”.">
            <TextInput id="qs-forma" value={forma} onChange={(e) => setForma(e.target.value)} placeholder="np. Pani Halino, Mamo" />
          </Field>

          <Field label="Numer telefonu" htmlFor="qs-tel">
            <div className="flex items-stretch gap-2">
              <span className="grid h-[54px] place-items-center rounded-[16px] border-2 border-[var(--line)] bg-[var(--bg-muted)] px-4 text-[17px] font-extrabold">+48</span>
              <TextInput id="qs-tel" inputMode="tel" autoComplete="tel-national" value={tel} onChange={(e) => setTel(e.target.value)} className="flex-1" placeholder="512 665 208" />
            </div>
          </Field>

          <Field label="Twoje imię w dopełniaczu (opcjonalnie)" htmlFor="qs-caller" help="Asystent powie: „Dzwonię w imieniu Kasi”.">
            <TextInput id="qs-caller" value={caller} onChange={(e) => setCaller(e.target.value)} placeholder="np. Kasi, Tomka" />
          </Field>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
          <Btn variant="mint" icon="phone" disabled={!valid || busy} onClick={saveAndCall} className="sm:flex-1">
            {busy ? "Łączę…" : "Zapisz i zadzwoń teraz"}
          </Btn>
          <Btn
            variant="white"
            disabled={!valid}
            onClick={() => {
              setCfg(patch());
              close();
              toast.success("Zapisano. Asystent użyje tych danych w następnej rozmowie.");
            }}
          >
            Zapisz
          </Btn>
        </div>
        <button
          type="button"
          onClick={() => {
            close();
            nav("/kreator");
          }}
          className="mt-4 w-full text-center text-[15px] font-extrabold text-[var(--violet-text)] underline-offset-4 hover:underline"
        >
          Wolę pełną konfigurację (7 kroków)
        </button>
      </DialogContent>
    </Dialog>
  );
}
