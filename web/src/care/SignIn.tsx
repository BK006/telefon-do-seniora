import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./auth";
import { Icon } from "./icons";
import { Mascot } from "./Mascot";
import { Btn, Field, TextInput } from "./ui";

export function SignIn() {
  const { session, signIn } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={next} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError(err);
    else nav(next, { replace: true });
  }

  return (
    <div className="care grid min-h-dvh place-items-center bg-[var(--bg-app)] px-5 py-10">
      <div className="w-full max-w-[440px]">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2 rounded-xl">
          <Mascot size={44} decorative />
          <span className="text-[22px] font-black text-[var(--violet-text)]">Telefon do seniora</span>
        </Link>

        <div className="card mt-6 p-6 sm:p-8">
          <div className="flex items-end gap-3">
            <Mascot size={64} mood="radosc" decorative />
            <div className="mb-1">
              <h1 className="text-[28px] leading-tight font-black">Zaloguj się</h1>
              <p className="text-[15px] font-bold text-[var(--plum-600)]">Zobacz, jak czuje się Twoja bliska osoba.</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            <Field label="E-mail" htmlFor="si-email">
              <TextInput id="si-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Hasło" htmlFor="si-pass">
              <TextInput id="si-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            {error && (
              <p role="alert" className="flex items-center gap-2 rounded-2xl bg-[#FFE6EC] px-4 py-3 font-bold text-[var(--red-text)]">
                <Icon name="alert" size={20} /> {error}
              </p>
            )}
            <Btn lg type="submit" disabled={busy || !email || !password} className="w-full">
              {busy ? "Loguję…" : "Zaloguj się"}
            </Btn>
          </form>
        </div>

        <p className="mt-5 text-center text-[15px] font-bold text-[var(--plum-600)]">
          Wersja demonstracyjna na HackYeah 2026. Dane logowania dla jury są w zgłoszeniu.
        </p>
      </div>
    </div>
  );
}
