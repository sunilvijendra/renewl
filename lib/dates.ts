const IST_TZ = "Asia/Kolkata";

function istParts(input: number | string): { y: number; m: number; d: number } {
  const date = typeof input === "string" ? new Date(input) : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date input: ${String(input)}`);
  }
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const y = Number.parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const m = Number.parseInt(parts.find((p) => p.type === "month")!.value, 10);
  const d = Number.parseInt(parts.find((p) => p.type === "day")!.value, 10);
  return { y, m, d };
}

export function toStartOfDayIstMs(input: number | string): number {
  const { y, m, d } = istParts(input);
  // IST is UTC+5:30 (no DST). Midnight IST = previous day 18:30 UTC.
  return Date.UTC(y, m - 1, d) - 5.5 * 60 * 60 * 1000;
}

export function startOfTomorrowIstMs(now: number): number {
  const today = toStartOfDayIstMs(now);
  return today + 24 * 60 * 60 * 1000;
}

export function formatIstDate(ms: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

export function formatIstDateInputValue(ms: number): string {
  // YYYY-MM-DD in IST, suitable for <input type="date">.
  const { y, m, d } = istParts(ms);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function formatRelativeIst(ms: number, now: number = Date.now()): string {
  const todayIst = toStartOfDayIstMs(now);
  const targetIst = toStartOfDayIstMs(ms);
  const diffDays = Math.round((targetIst - todayIst) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 1 && diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < -1 && diffDays > -7) return `${-diffDays} days ago`;
  return formatIstDate(ms);
}
