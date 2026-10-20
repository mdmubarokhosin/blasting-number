export const COLOR_PRESETS = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#0891b2",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#c026d3",
  "#db2777",
  "#64748b",
  "#0f172a",
];

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

export function normalizeHex(value: string, fallback = "#64748b"): string {
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return fallback;
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = normalizeHex(hex).slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns the more readable foreground (white or near-black) for a background. */
export function readableTextColor(background: string): "#ffffff" | "#0f172a" {
  return contrastRatio(background, "#ffffff") >= contrastRatio(background, "#0f172a")
    ? "#ffffff"
    : "#0f172a";
}

export function tint(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function contrastWarning(background: string): string | null {
  if (!isValidHex(background)) return "সঠিক hex রঙ দিন (যেমন #2563eb)";
  const ratio = contrastRatio(background, "#ffffff");
  return ratio < 3 ? "সাদা টেক্সটের সঙ্গে contrast কম; গাঢ় রঙ বেছে নিন" : null;
}
