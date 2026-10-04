import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./icons";
import { Mascot } from "./Mascot";
import { EMPTY, useCare } from "./state";
import { StepForm, STEPS, StepTip } from "./steps";
import { Btn } from "./ui";

const scrollTop = () => {
  try {
    window.scrollTo({ top: 0 });
  } catch {
    /* ignore */
  }
};

export function Wizard() {
  const nav = useNavigate();
  const { cfg, replaceCfg } = useCare();
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const blocked = last && !cfg.zgoda;

  useEffect(() => {
    // Every wizard run starts blank (no pre-filled person, number or consent).
    replaceCfg({ ...EMPTY, questions: EMPTY.questions.map((q) => ({ ...q })) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="care min-h-dvh bg-white">
      <div className="mx-auto max-w-[760px] px-5 pt-6 pb-40 sm:px-6 sm:pt-8">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => nav("/")} aria-label="Zamknij kreator" className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--plum-600)] hover:bg-[var(--bg-app)]">
            <Icon name="x" size={26} stroke={3} />
          </button>
          <div className="relative h-[18px] flex-1 overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-valuemin={1} aria-valuemax={7} aria-valuenow={step + 1} aria-label="Postęp kreatora">
            <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--violet-600)] transition-[width] duration-[250ms] ease-out" style={{ width: `${((step + 1) / 7) * 100}%` }}>
              <div className="mx-2.5 mt-1 h-[5px] rounded-full bg-[var(--violet-300)]" />
            </div>
          </div>
          <span className="w-10 text-right text-[16px] font-extrabold text-[var(--plum-600)] tabular-nums">{step + 1}/7</span>
        </div>

        <div className="mt-6">
          <StepTip step={step} />
        </div>
        <h1 className="mt-4 text-[30px] leading-tight font-black">{STEPS[step].title}</h1>
        <div className="mt-6">
          <StepForm step={step} />
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-[var(--line)] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[760px] items-center gap-3 px-5 py-4 sm:px-6">
          <Btn
            variant="white"
            disabled={step === 0}
            onClick={() => {
              setStep((s) => s - 1);
              scrollTop();
            }}
          >
            Wstecz
          </Btn>
          <div className="flex-1 text-right">
            {blocked && <p className="mb-2 text-[14px] font-bold text-[var(--plum-600)]">Zaznacz zgodę, aby zaplanować rozmowę.</p>}
            <Btn
              lg
              disabled={blocked}
              className="w-full sm:w-auto"
              onClick={() => {
                if (last) nav("/gotowe");
                else {
                  setStep((s) => s + 1);
                  scrollTop();
                }
              }}
            >
              {last ? "Zaplanuj pierwszą rozmowę" : "Dalej"}
            </Btn>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Success() {
  const nav = useNavigate();
  const { cfg, setDash } = useCare();
  return (
    <div className="care grid min-h-dvh place-items-center bg-white px-6 py-12 text-center">
      <div className="flex max-w-lg flex-col items-center">
        <div className="pop-in">
          <Mascot size={200} sparks />
        </div>
        <h1 className="mt-6 text-[34px] leading-tight font-black">Pierwsza rozmowa zaplanowana!</h1>
        <p className="mt-3 text-[19px] text-[var(--plum-600)]">
          Asystent zadzwoni do {cfg.forma ? `„${cfg.forma}”` : "mamy"} jutro o {cfg.sloty[0]}. Po rozmowie dostaniesz powiadomienie na telefon.
        </p>
        <Btn
          lg
          className="mt-8"
          onClick={() => {
            setDash("pusty");
            nav("/app");
          }}
        >
          Przejdź do pulpitu
        </Btn>
      </div>
    </div>
  );
}
