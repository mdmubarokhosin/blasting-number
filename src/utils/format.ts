import type { ShiftRecord } from "../types";
import { shiftName } from "./shifts";

/** today in YYYY-MM-DD (local time) */
export function todayISO(): string {
  const d = new Date();
  return toISO(d);
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function isValidISO(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00`));
}

export function localeFor(language = "en"): string {
  if (language === "bn") return "bn-BD";
  if (language === "en") return "en-GB";
  return language;
}

/** Localized long date; ISO date strings are interpreted in local time. */
export function formatDate(iso: string, language = "en"): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(localeFor(language), {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Backward-compatible Bengali helper used by older screens/tests. */
export function formatDateBN(iso: string, language = "bn"): string {
  return formatDate(iso, language);
}

/** Relative / localized timestamp for logs (epoch ms). */
export function formatTimestamp(
  ts: number | null | undefined,
  language = "en",
): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const isBn = language === "bn";
  if (diff < 60_000) return isBn ? "এইমাত্র" : "just now";
  if (diff < 3_600_000) {
    const minutes = Math.floor(diff / 60_000).toLocaleString(localeFor(language));
    return isBn ? `${minutes} মিনিট আগে` : `${minutes} min ago`;
  }
  if (diff < 86_400_000) {
    const hours = Math.floor(diff / 3_600_000).toLocaleString(localeFor(language));
    return isBn ? `${hours} ঘণ্টা আগে` : `${hours} hr ago`;
  }
  try {
    return `${d.toLocaleDateString(localeFor(language))} ${d.toLocaleTimeString(localeFor(language), {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return d.toLocaleString();
  }
}

export function formatDateFull(
  ts: number | null | undefined,
  language = "en",
): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString(localeFor(language), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function shiftLabel(shift: string, shifts: ShiftRecord[] = []): string {
  return shiftName(shift, shifts);
}

/** Groups epoch-ms timestamps into YYYY-MM-DD buckets (local time). */
export function groupByDay(timestamps: number[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of timestamps) {
    if (!t) continue;
    const key = toISO(new Date(t));
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/** Inclusive list of YYYY-MM-DD between two ISO dates (max 400 entries). */
export function dateRange(fromISOStr: string, toISOStr: string): string[] {
  if (!isValidISO(fromISOStr) || !isValidISO(toISOStr)) return [];
  const out: string[] = [];
  let cur = fromISOStr;
  let guard = 0;
  while (cur <= toISOStr && guard < 400) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
}
