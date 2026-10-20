import type { Category } from "../types";

/** "Blasting A1-L12-BM-1011 1/2" → { category, code } */
export function parseItem(str: string): { category: string; code: string } {
  const idx = str.indexOf(" ");
  if (idx === -1) return { category: str, code: "" };
  return { category: str.slice(0, idx), code: str.slice(idx + 1) };
}

/**
 * Normalizes the quantity/extra part of a code the same way the original app did:
 * "10pic" → "10Pic", "10PCS" → "10Pcs".
 */
export function formatExtraText(text: string): string {
  if (!text) return "";
  let formatted = text
    .replace(/(\d+)\s*PIC/gi, "$1Pic")
    .replace(/(\d+)\s*PCS/gi, "$1Pcs");
  formatted = formatted.replace(/\bpic\b/gi, "Pic").replace(/\bpcs\b/gi, "Pcs");
  return formatted;
}

export interface ParsedCode {
  /** code part, e.g. "A1-L12-BM-1011" */
  code: string;
  /** quantity/extra part, e.g. "1/2" or "10Pic" */
  extra: string;
  /** canonical stored value, e.g. "A1-L12-BM-1011 1/2" */
  value: string;
}

/**
 * Splits a raw user entry into code + normalized extra, mirroring the original
 * `addNumber()` behaviour: leading [A-Za-z0-9-]+ is the code, the rest is extra text.
 */
export function normalizeEntry(raw: string): ParsedCode {
  const entry = raw.trim();
  if (!entry) return { code: "", extra: "", value: "" };

  const match = entry.match(/^([a-zA-Z0-9-]+)(.*)$/);
  if (!match) return { code: entry.toUpperCase(), extra: "", value: entry.toUpperCase() };

  const code = match[1].toUpperCase();
  const extra = formatExtraText(match[2].trim());
  return { code, extra, value: extra ? `${code} ${extra}` : code };
}

export interface DuplicateEntry {
  date: string;
  shift: string;
  code: string;
  category?: Category;
}

/** Case-insensitive duplicate check used by the global duplicate checker. */
export function findDuplicate(
  code: string,
  entries: DuplicateEntry[],
): { date: string; shift: string; category?: Category } | null {
  const target = code.trim().toLowerCase();
  if (!target) return null;
  for (const e of entries) {
    if (e.code.trim().toLowerCase() === target) {
      return { date: e.date, shift: e.shift, category: e.category };
    }
  }
  return null;
}

/** Escapes a code for safe use inside a single-quoted HTML/JS attribute (legacy UI helper). */
export function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

/** Splits code into highlighted segments: code body + extra (quantity). */
export function splitCode(code: string): { body: string; extra: string } {
  const m = code.match(/^([A-Z0-9-]+)(.*)$/);
  if (!m) return { body: code, extra: "" };
  return { body: m[1], extra: m[2].trim() };
}
