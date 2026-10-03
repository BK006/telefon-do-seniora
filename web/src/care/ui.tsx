// Design-system primitives. shadcn/ui supplies the accessible behaviour (Switch, Input,
// Textarea); the handoff's tokens supply the look (3D buttons, 2px borders, rounded type).
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Switch as ShSwitch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icons";

type BtnVariant = "primary" | "mint" | "white" | "urgent";

export function Btn({ variant = "primary", lg, icon, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; lg?: boolean; icon?: IconName }) {
  return (
    <button {...rest} className={cn("btn3d", `btn3d-${variant}`, lg && "btn3d-lg", className)}>
      {icon && <Icon name={icon} size={22} />}
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("card p-[22px] max-sm:p-5", className)}>
      {children}
    </div>
  );
}

export function Chip({ on, onClick, children, removable }: { on?: boolean; onClick?: () => void; children: ReactNode; removable?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={removable ? undefined : !!on}
      className="inline-flex min-h-11 items-center gap-2 rounded-[14px] border-2 px-4 text-[16px] font-bold transition-[background-color,border-color,transform] duration-150 active:scale-[0.97]"
      style={{ background: on ? "var(--violet-50)" : "#fff", borderColor: on ? "var(--violet-200)" : "var(--line)", color: on ? "var(--violet-text-dark)" : "var(--plum-700)" }}
    >
      {on && !removable && <Icon name="check" size={18} stroke={3} />}
      {children}
    </button>
  );
}

export function RemovableChip({ label, onRemove, tone = "violet" }: { label: string; onRemove: () => void; tone?: "violet" | "red" }) {
  const red = tone === "red";
  return (
    <span
      className="inline-flex min-h-11 items-center gap-1 rounded-[14px] border-2 pr-1 pl-4 text-[16px] font-bold"
      style={{ background: red ? "#FFF2F5" : "var(--violet-50)", borderColor: red ? "#FFC2D1" : "var(--violet-200)", color: red ? "var(--red-text)" : "var(--violet-text-dark)" }}
    >
      {label}
      <button type="button" onClick={onRemove} aria-label={`Usuń: ${label}`} className="grid size-9 place-items-center rounded-[10px] hover:bg-white/70">
        <Icon name="x" size={16} stroke={3} />
      </button>
    </span>
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  // 58×34 switch from the handoff, on top of the shadcn/Radix switch for role + keyboard.
  return (
    <ShSwitch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      size="lg"
      className="data-checked:bg-[#6A4BEB] data-unchecked:bg-[#A69FB5]"
    />
  );
}

export function SwitchRow({ label, desc, checked, onChange, icon, iconTone }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; icon?: ReactNode; iconTone?: never }) {
  void iconTone;
  return (
    <label className="flex cursor-pointer items-center gap-4 py-3">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-extrabold">{label}</span>
        {desc && <span className="block text-[15px] font-bold text-[var(--plum-600)]">{desc}</span>}
      </span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </label>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1 rounded-[14px] bg-[var(--bg-muted)] p-1">
      {options.map(([v, l]) => {
        const on = v === value;
        return (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className="min-h-10 rounded-[11px] px-3.5 text-[15px] font-extrabold transition-[background-color,color,box-shadow] duration-150"
            style={{ background: on ? "#fff" : "transparent", color: on ? "var(--violet-text)" : "var(--plum-700)", boxShadow: on ? "0 2px 0 #D3CDE0" : "none" }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, help, htmlFor, children }: { label: string; help?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-[16px] font-extrabold">
        {label}
      </label>
      {children}
      {help && <p className="text-[15px] font-bold text-[var(--plum-600)]">{help}</p>}
    </div>
  );
}

export const inputCls =
  "h-[54px] rounded-[16px] border-2 border-[var(--line)] bg-[var(--bg-app)] px-4 text-[17px] font-bold text-[var(--plum-900)] shadow-none placeholder:text-[#8E86A0] focus-visible:border-[var(--violet-text)] focus-visible:ring-0 md:text-[17px]";

export function TextInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(inputCls, props.className)} />;
}

export function TextArea(props: React.ComponentProps<typeof Textarea>) {
  return <Textarea {...props} className={cn(inputCls, "h-auto min-h-28 py-3 leading-relaxed", props.className)} />;
}

export function AddField({ value, onChange, onAdd, placeholder, label }: { value: string; onChange: (v: string) => void; onAdd: () => void; placeholder: string; label: string }) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd();
      }}
    >
      <TextInput aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1" />
      <Btn type="submit" variant="white" icon="plus" className="shrink-0 px-4">
        Dodaj
      </Btn>
    </form>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-[22px] leading-tight font-black", className)}>{children}</h2>;
}
