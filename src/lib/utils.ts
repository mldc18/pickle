export function getCurrentTime(): Date {
  return new Date();
}

export function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDayName(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();
}

export function formatShortMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

export function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Earliest month the association tracks. */
const EARLIEST_MONTH = "2026-04";

export function get6MonthRange(): string[] {
  const months: string[] = [];
  const now = new Date();
  // past 2 months, current month, future 3 months
  for (let i = 2; i >= -3; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i);
    const key = getMonthKey(d);
    if (key >= EARLIEST_MONTH) months.push(key);
  }
  return months;
}

export function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i);
    const key = getMonthKey(d);
    if (key >= EARLIEST_MONTH) months.push(key);
  }
  return months;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/** Capitalize each word: "john doe" → "John Doe" */
function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Short display name: "Clarence Aquino" → "Clarence A." */
export function shortName(firstName: string, lastName: string): string {
  const f = capitalize(firstName.trim());
  const l = lastName.trim();
  return l ? `${f} ${l[0].toUpperCase()}.` : f;
}
