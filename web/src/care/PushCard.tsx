import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon, IconTile } from "./icons";
import { disablePush, enablePush, getPushState, sendTestPush, type PushState } from "./push";
import { Btn, Card } from "./ui";

const WHAT = [
  { icon: "check" as const, text: "Po każdej rozmowie: status dnia i to, czego bliska osoba potrzebuje." },
  { icon: "alert" as const, text: "Od razu przy niepokojącym sygnale, np. gdy padnie słowo o upadku." },
  { icon: "missed" as const, text: "Gdy nie odbierze telefonu." },
];

export function PushCard() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState("unsupported"));
  }, []);

  async function run(fn: () => Promise<PushState>) {
    setBusy(true);
    try {
      setState(await fn());
    } catch (e) {
      toast.message("Powiadomienia", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-4">
        <IconTile name="phone" tone="blue" size={52} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-black">Powiadomienia na telefonie</h3>
          <p className="text-[15px] font-bold text-[var(--plum-600)]">Dodaj aplikację do ekranu głównego i włącz powiadomienia — tak będziemy się z Tobą kontaktować.</p>
        </div>
      </div>

      <ul className="space-y-2">
        {WHAT.map((w) => (
          <li key={w.text} className="flex items-start gap-3 text-[16px]">
            <Icon name={w.icon} size={20} className="mt-0.5 shrink-0 text-[var(--violet-text)]" />
            {w.text}
          </li>
        ))}
      </ul>

      {state === "needs-install" && (
        <div className="rounded-[20px] bg-[var(--violet-50)] p-4 text-[16px] font-bold text-[var(--violet-text-dark)]">
          Na iPhonie: otwórz tę stronę w Safari, stuknij <strong>Udostępnij</strong> → <strong>Do ekranu początkowego</strong>, uruchom aplikację z ikony i wróć tutaj, aby włączyć powiadomienia.
        </div>
      )}
      {state === "unsupported" && <p className="font-bold text-[var(--plum-600)]">Ta przeglądarka nie obsługuje powiadomień push. Spróbuj Chrome, Edge lub Safari (iOS 16.4+ po dodaniu do ekranu).</p>}
      {state === "denied" && <p className="font-bold text-[var(--red-text)]">Powiadomienia są zablokowane w ustawieniach przeglądarki. Odblokuj je dla tej strony i odśwież.</p>}

      <div className="flex flex-wrap items-center gap-3">
        {state === "on" ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--mint-200)] bg-[var(--mint-50)] px-3 py-1.5 font-extrabold text-[var(--mint-text)]">
              <Icon name="check" size={18} stroke={3} /> Włączone na tym urządzeniu
            </span>
            <Btn
              variant="white"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const n = await sendTestPush().catch(() => 0);
                setBusy(false);
                toast.success(n ? "Wysłano testowe powiadomienie." : "Nie udało się wysłać — spróbuj włączyć ponownie.");
              }}
            >
              Wyślij testowe
            </Btn>
            <button type="button" disabled={busy} onClick={() => run(disablePush)} className="font-extrabold text-[var(--plum-600)] underline-offset-4 hover:underline">
              Wyłącz
            </button>
          </>
        ) : (
          <Btn icon="phone" disabled={busy || state === null || state === "unsupported" || state === "needs-install" || state === "denied"} onClick={() => run(enablePush)}>
            {busy ? "Włączam…" : "Włącz powiadomienia"}
          </Btn>
        )}
      </div>
    </Card>
  );
}
