import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icons";
import { Mascot } from "./Mascot";
import { QuickStart } from "./QuickStart";
import { useCare } from "./state";

const TABS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/app", label: "Dziś", icon: "home", end: true },
  { to: "/app/rozmowy", label: "Rozmowy", icon: "chat" },
  { to: "/app/pytania", label: "Pytania", icon: "list" },
  { to: "/app/ustawienia", label: "Ustawienia", icon: "sliders" },
];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Avatar({ size = 44 }: { size?: number }) {
  const { cfg } = useCare();
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-black" style={{ width: size, height: size, background: "#FFE8F0", color: "#B0245A", fontSize: size * 0.36 }} aria-hidden>
      {initials(cfg.imie) || "?"}
    </span>
  );
}

export function CareShell() {
  const { cfg } = useCare();
  const navCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-2xl border-2 px-4 text-[17px] font-extrabold transition-colors duration-150",
      isActive ? "border-[var(--violet-200)] bg-[var(--violet-50)] text-[var(--violet-text)]" : "border-transparent text-[var(--plum-700)] hover:bg-[var(--bg-app)]",
    );

  return (
    <div className="care min-h-dvh bg-[var(--bg-app)] md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r-2 border-[var(--line)] bg-white p-5 md:flex">
        <NavLink to="/" className="flex items-center gap-2 rounded-xl px-1">
          <Mascot size={40} decorative />
          <span className="text-[19px] leading-tight font-black text-[var(--violet-text)]">Telefon do seniora</span>
        </NavLink>
        <nav aria-label="Główna nawigacja" className="mt-8 flex flex-col gap-1.5">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={(s) => cn(navCls(s), "h-[54px]")}>
              <Icon name={t.icon} size={24} />
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl border-2 border-[var(--line)] p-3">
          <Avatar size={40} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-black">{cfg.relacja}</span>
            <span className="block truncate text-[13px] font-bold text-[var(--plum-600)]">{cfg.imie}</span>
          </span>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-[var(--line)] bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <NavLink to="/" className="flex items-center gap-2">
          <Mascot size={34} decorative />
          <span className="text-[17px] font-black text-[var(--violet-text)]">Telefon do seniora</span>
        </NavLink>
        <Avatar size={38} />
      </header>

      <main className="mx-auto w-full max-w-[1000px] px-4 pt-5 pb-28 md:px-10 md:pt-9 md:pb-12">
        <Outlet />
      </main>
      <QuickStart />

      {/* Mobile bottom tab bar */}
      <nav aria-label="Nawigacja" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-1 border-t-2 border-[var(--line)] bg-white/95 px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={(s) => cn(navCls(s), "min-h-14 flex-col justify-center gap-0.5 px-1 text-[14px]")}>
            <Icon name={t.icon} size={26} />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export { Avatar };
