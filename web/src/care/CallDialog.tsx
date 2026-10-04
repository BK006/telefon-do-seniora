// "Zadzwoń teraz" confirmation: the number is pre-filled from the settings and must be
// confirmed (or changed) before the assistant dials. A changed number is saved back.
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Mascot } from "./Mascot";
import { useCare } from "./state";
import { Btn, Field, TextInput } from "./ui";

export const isPlMobile = (tel: string) => /^\d{9}$/.test(tel.replace(/\D/g, "").replace(/^48(?=\d{9}$)/, ""));

export function CallDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: (tel: string) => void }) {
  const { cfg } = useCare();
  const [tel, setTel] = useState(cfg.tel);

  useEffect(() => {
    if (open) setTel(cfg.tel);
  }, [open, cfg.tel]);

  const valid = isPlMobile(tel);
  const who = cfg.forma || cfg.imie || "bliska osoba";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="care rounded-[28px] border-2 border-[var(--line)] p-6 sm:max-w-[460px] sm:p-8">
        <div className="flex items-end gap-3">
          <Mascot size={64} mood="radosc" decorative />
          <div className="mb-1">
            <DialogTitle className="text-[26px] leading-tight font-black">Zadzwonić teraz?</DialogTitle>
            <DialogDescription className="text-[15px] font-bold text-[var(--plum-600)]">
              Asystent zadzwoni do: <span className="text-[var(--plum-900)]">{who}</span>
              {cfg.imie && cfg.forma ? ` (${cfg.imie})` : ""}
            </DialogDescription>
          </div>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onConfirm(tel.trim());
          }}
        >
          <Field label="Numer telefonu" htmlFor="call-tel" help="Sprawdź numer przed połączeniem. Dzwonimy tylko na polskie numery.">
            <div className="flex items-stretch gap-2">
              <span className="grid h-[54px] place-items-center rounded-[16px] border-2 border-[var(--line)] bg-[var(--bg-muted)] px-4 text-[17px] font-extrabold">+48</span>
              <TextInput id="call-tel" inputMode="tel" autoComplete="tel-national" value={tel} onChange={(e) => setTel(e.target.value)} className="flex-1" autoFocus placeholder="512 665 208" />
            </div>
          </Field>
          {!valid && tel.trim() !== "" && <p className="text-[15px] font-bold text-[var(--red-text)]">Wpisz 9 cyfr numeru telefonu.</p>}
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Btn type="submit" variant="mint" icon="phone" disabled={!valid} className="sm:flex-1">
              Zadzwoń
            </Btn>
            <Btn type="button" variant="white" onClick={() => onOpenChange(false)}>
              Anuluj
            </Btn>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
