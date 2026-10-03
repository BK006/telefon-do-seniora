// Hand-drawn 24×24 stroke icons from the design handoff (round caps, heavy stroke).
export const I = {
  home: "M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z",
  chat: "M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  phone: "M6.5 3.5h3l1.5 4.5-2.2 1.4a11 11 0 0 0 5.8 5.8l1.4-2.2 4.5 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z",
  missed: "M6.5 5.5h3l1.5 4.5-2.2 1.4a11 11 0 0 0 5.8 5.8l1.4-2.2 4.5 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 7.5a2 2 0 0 1 2-2z M16 3l5 5M21 3l-5 5",
  alert: "M12 3.5l9.5 16.5h-19z M12 10v4.5 M12 17.5v.01",
  retry: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3 M4.5 4v4h4",
  x: "M7 7l10 10M17 7L7 17",
  dot: "M12 12h.01",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  fork: "M7 3v8a2 2 0 0 0 4 0V3M9 11v10M16 3c-1.7 0-3 2.2-3 5s1.3 4 3 4v9",
  smile: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M8.5 14a4.5 4.5 0 0 0 7 0 M9 9.5v.01 M15 9.5v.01",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z",
  pill: "M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7z M8.5 8.5l7 7",
  door: "M10 4H5v16h5 M14 8l4 4-4 4 M18 12H9",
  people: "M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14a6 6 0 0 1 3.5 6",
  bag: "M5 8h14l-1 12H6z M9 8V6.5a3 3 0 0 1 6 0V8",
  user: "M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M4.5 20.5a7.5 7.5 0 0 1 15 0",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  mail: "M3 6h18v12H3z M3 7l9 6 9-6",
  shield: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M8.5 12l2.5 2.5 4.5-5",
  bot: "M6 8h12v11H6z M12 4v4 M9.5 13v.01 M14.5 13v.01 M9.5 16h5 M3 12v3M21 12v3",
  lock: "M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  custom: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7 M12 17v.01",
  chevronR: "M9 6l6 6-6 6",
  chevronL: "M15 6l-6 6 6 6",
  chevronD: "M6 9l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  flame: "M12 21c-4 0-7-2.7-7-6.5 0-3 2-5 3.5-6.5.3 2 1.5 3 2.5 3.5C11 8 12 5 14.5 3c.5 3 4.5 5.5 4.5 11 0 4-3 7-7 7z",
  play: "M8 5.5v13l11-6.5z",
  pause: "M8 5v14M16 5v14",
} as const;

export type IconName = keyof typeof I;

export function Icon({ name, size = 24, stroke = 2.75, className, color }: { name: IconName; size?: number; stroke?: number; className?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? "currentColor"} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={I[name]} />
    </svg>
  );
}

export const TONE = {
  blue: { bg: "#EEE9FF", fg: "#5A3FD6", stroke: "#7C5CFF" },
  orange: { bg: "#FFE8F0", fg: "#B0245A", stroke: "#FF7AA2" },
  purple: { bg: "#E6EEFF", fg: "#2D56B0", stroke: "#6E9BFF" },
  red: { bg: "#FFE6EC", fg: "#B0183D", stroke: "#F0466B" },
  green: { bg: "#DCF8EC", fg: "#146B47", stroke: "#3DDC97" },
  yellow: { bg: "#FFF5D6", fg: "#7A5600", stroke: "#FFC53D" },
} as const;
export type Tone = keyof typeof TONE;

export function IconTile({ name, tone, size = 52, iconSize }: { name: IconName; tone: Tone; size?: number; iconSize?: number }) {
  const t = TONE[tone];
  return (
    <span className="grid shrink-0 place-items-center rounded-2xl" style={{ width: size, height: size, background: t.bg, color: t.fg }}>
      <Icon name={name} size={iconSize ?? Math.round(size * 0.5)} />
    </span>
  );
}
