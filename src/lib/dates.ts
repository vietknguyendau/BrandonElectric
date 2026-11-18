import { business } from "@/config/business";

/** Dates are stored as plain "YYYY-MM-DD" strings (no time zone drift). */
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayISO(timeZone = business.timeZone, now = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

export function isValidISODate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(toUTC(s));
  return d.toISOString().slice(0, 10) === s;
}

/** "Tue, Nov 24, 2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(toUTC(iso)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function relativeDays(iso: string, today: string): string {
  const n = daysBetween(today, iso);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}
