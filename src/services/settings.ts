import { onValue, ref, update, type Unsubscribe } from "firebase/database";
import { auth, db } from "../lib/firebase";
import { DEFAULT_SETTINGS, type AppSettings } from "../types";

function cloneDefaults(): AppSettings {
  return { ...DEFAULT_SETTINGS, features: { ...DEFAULT_SETTINGS.features } };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isSafeLogoUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function coerceSettings(raw: Record<string, unknown> | null): AppSettings {
  if (!raw) return cloneDefaults();
  const feats = (raw.features ?? {}) as Partial<AppSettings["features"]>;
  const logoUrl = text(raw.logoUrl, 500);
  return {
    brandName: text(raw.brandName, 60) || DEFAULT_SETTINGS.brandName,
    logoUrl: isSafeLogoUrl(logoUrl) ? logoUrl : "",
    contactEmail: text(raw.contactEmail, 254),
    contactPhone: text(raw.contactPhone, 60),
    contactAddress: text(raw.contactAddress, 300),
    features: {
      pdfExport: feats.pdfExport !== false,
      csvExport: feats.csvExport !== false,
      ocrScanner: feats.ocrScanner !== false,
      whatsappShare: feats.whatsappShare !== false,
    },
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : null,
  };
}

/** Public settings are readable without authentication (enforced by rules). */
export function subscribeSettings(
  cb: (s: AppSettings) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, "settings/app"),
    (snap) => cb(coerceSettings(snap.val())),
    (e) => onError?.(e),
  );
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");
  if (!isSafeLogoUrl(settings.logoUrl)) throw new Error("invalid-logo-url");
  await update(ref(db, "settings/app"), {
    brandName: settings.brandName.trim().slice(0, 60) || DEFAULT_SETTINGS.brandName,
    logoUrl: settings.logoUrl.trim().slice(0, 500),
    contactEmail: settings.contactEmail.trim().slice(0, 254),
    contactPhone: settings.contactPhone.trim().slice(0, 60),
    contactAddress: settings.contactAddress.trim().slice(0, 300),
    features: { ...settings.features },
    updatedAt: Date.now(),
    updatedBy: user.uid,
  });
}
