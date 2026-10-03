const dtf = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });
const dtfLong = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" });
const dtfShort = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" });

const asDate = (iso: string) => new Date(iso.length === 10 ? iso + "T12:00:00" : iso);

export const fmtDate = (iso: string) => dtf.format(asDate(iso));
export const fmtDateLong = (iso: string) => dtfLong.format(asDate(iso));
export const fmtDateShort = (iso: string) => dtfShort.format(asDate(iso)).replace(".", "");
export const fmtTime = (iso: string) => iso.slice(11, 16);

export function relDay(iso: string, today: string) {
  const d = Math.round((Date.parse(today) - Date.parse(iso.slice(0, 10))) / 86_400_000);
  if (d <= 0) return "dziś";
  if (d === 1) return "wczoraj";
  return `${d} dni temu`;
}
