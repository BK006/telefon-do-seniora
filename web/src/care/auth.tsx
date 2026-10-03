// Real Supabase Auth (email + password). For the hackathon there is one admin account for
// the jury; the anon key in the browser is public by design, the password is checked by Supabase.
import { createClient, type Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase = URL_ && ANON ? createClient(URL_, ANON) : null;

interface AuthState {
  session: Session | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return "Logowanie nie jest skonfigurowane w tej wersji.";
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error) return null;
    return error.message.toLowerCase().includes("invalid") ? "Nieprawidłowy e-mail lub hasło." : "Nie udało się zalogować. Spróbuj ponownie.";
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return <Ctx.Provider value={{ session, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const s = useContext(Ctx);
  if (!s) throw new Error("AuthProvider missing");
  return s;
}

/** Protects family-app routes. Without Supabase config (local dev) the demo stays open. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth();
  const loc = useLocation();
  if (!supabase) return children;
  if (!ready) return null;
  if (!session) return <Navigate to={`/logowanie?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}
