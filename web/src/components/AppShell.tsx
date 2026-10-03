import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FlaskConical, LogOut, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STAFF_NAV = [
  { to: "/panel", label: "Kogo sprawdzić dziś", end: true },
  { to: "/panel/zbiorczo", label: "Zbiorczo" },
  { to: "/symulator", label: "Symulator rozmowy" },
];

export function AppShell() {
  const { role, signOut } = useStore();
  const navigate = useNavigate();
  const nav = role === "family" ? [{ to: "/rodzina", label: "Podsumowanie tygodnia", end: true }] : STAFF_NAV;

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      {/* Translucent chrome: content scrolls underneath, no hard divider */}
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-stone-50/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <NavLink to={role === "family" ? "/rodzina" : "/panel"} className="flex items-center gap-2.5 rounded-lg outline-offset-4">
            <span className="grid size-9 place-items-center rounded-xl bg-teal-800 text-white shadow-sm">
              <PhoneCall className="size-4.5" aria-hidden />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Telefon do seniora</span>
          </NavLink>
          <nav aria-label="Główna nawigacja" className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors duration-150 hover:text-stone-900",
                    isActive && "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-900 ring-1 ring-violet-200 sm:inline-flex">
              <FlaskConical className="size-3.5" aria-hidden /> Dane syntetyczne
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut();
                navigate("/ops");
              }}
            >
              <LogOut aria-hidden /> Wyloguj
            </Button>
          </div>
        </div>
        <nav aria-label="Nawigacja mobilna" className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn("shrink-0 rounded-lg px-3 py-1.5 text-sm text-stone-600", isActive && "bg-white text-stone-900 ring-1 ring-stone-200")
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
