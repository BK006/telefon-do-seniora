import { cn } from "@/lib/utils";
import { LEVELS } from "@/lib/levels";

export function LevelBadge({ level, size = "md", className }: { level: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const m = LEVELS[level];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base",
        m.badge,
        className,
      )}
    >
      <Icon aria-hidden className={size === "lg" ? "size-4.5" : "size-3.5"} strokeWidth={2.25} />
      {m.label}
    </span>
  );
}
