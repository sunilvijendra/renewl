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
  return Date.UTC(y, m - 1, d) - 5.5 * 60 * 60 * 1000;
}

export function startOfTomorrowIstMs(now: number): number {
  return toStartOfDayIstMs(now) + 24 * 60 * 60 * 1000;
}

export function todayIsoIst(now: number): string {
  const { y, m, d } = istParts(now);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
