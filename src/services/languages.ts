import {
  get,
  onValue,
  ref,
  remove,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { db } from "../lib/firebase";
import {
  type LanguageRecord,
  type LanguageStatus,
  type TextDirection,
  type TranslationValues,
} from "../types";
import { UI_CATALOG } from "../i18n/uiCatalog";
import { WEBSITE_CONTENT_FIELDS } from "../i18n/content";

const LANGUAGE_CODE_RE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

export const BASE_LANGUAGE_CODES = new Set(["en", "bn"]);

export function defaultLanguageRecords(now = Date.now()): LanguageRecord[] {
  return [
    {
      id: "en",
      code: "en",
      name: "English",
      nativeName: "English",
      direction: "ltr",
      status: "active",
      isDefault: true,
      sortOrder: 0,
      protected: true,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
    },
    {
      id: "bn",
      code: "bn",
      name: "Bengali",
      nativeName: "বাংলা",
      direction: "ltr",
      status: "active",
      isDefault: false,
      sortOrder: 1,
      protected: true,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
    },
  ];
}

export function isValidLanguageCode(code: string): boolean {
  return LANGUAGE_CODE_RE.test(code) && code !== "__proto__" && code !== "prototype";
}

function coerceDirection(value: unknown): TextDirection {
  return value === "rtl" ? "rtl" : "ltr";
}

function coerceStatus(value: unknown): LanguageStatus {
  return value === "inactive" ? "inactive" : "active";
}

export function coerceLanguage(
  id: string,
  raw: Record<string, unknown> | null,
): LanguageRecord | null {
  if (!raw) return null;
  const code = typeof raw.code === "string" && isValidLanguageCode(raw.code) ? raw.code : id;
  if (!isValidLanguageCode(code)) return null;
  const isBase = BASE_LANGUAGE_CODES.has(code);
  const baseDefaults = isBase
    ? defaultLanguageRecords().find((language) => language.code === code)
    : undefined;
  return {
    id: code,
    code,
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim().slice(0, 60)
        : baseDefaults?.name ?? code,
    nativeName:
      typeof raw.nativeName === "string" && raw.nativeName.trim()
        ? raw.nativeName.trim().slice(0, 60)
        : typeof raw.name === "string" && raw.name.trim()
          ? raw.name.trim().slice(0, 60)
          : baseDefaults?.nativeName ?? code,
    direction: coerceDirection(raw.direction ?? baseDefaults?.direction),
    status: isBase && code === "en" ? "active" : coerceStatus(raw.status),
    isDefault: raw.isDefault === true,
    sortOrder:
      typeof raw.sortOrder === "number" && Number.isFinite(raw.sortOrder)
        ? Math.max(0, Math.min(9999, raw.sortOrder))
        : baseDefaults?.sortOrder ?? 999,
    protected: isBase || raw.protected === true,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
    createdBy: typeof raw.createdBy === "string" ? raw.createdBy.slice(0, 128) : "",
  };
}

export function normalizeLanguageList(records: LanguageRecord[]): LanguageRecord[] {
  const seen = new Set<string>();
  const out = records
    .filter((record) => {
      if (seen.has(record.code) || !isValidLanguageCode(record.code)) return false;
      seen.add(record.code);
      return true;
    })
    .map((record) => ({
      ...record,
      status: record.code === "en" ? "active" : record.status,
      protected: BASE_LANGUAGE_CODES.has(record.code) || record.protected,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  if (!out.some((record) => record.code === "en")) {
    out.unshift(...defaultLanguageRecords().filter((record) => record.code === "en"));
  }

  let defaults = out.filter((record) => record.isDefault && record.status === "active");
  if (defaults.length === 0) {
    const english = out.find((record) => record.code === "en");
    if (english) defaults = [english];
    else if (out[0]) defaults = [out[0]];
  }
  const defaultCode = defaults[0]?.code ?? "en";
  return out.map((record) => ({
    ...record,
    isDefault: record.code === defaultCode,
    status: record.code === defaultCode ? "active" : record.status,
  }));
}

export function subscribeLanguages(
  cb: (languages: LanguageRecord[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, "settings/languages"),
    (snapshot) => {
      const raw = snapshot.val() as Record<string, Record<string, unknown>> | null;
      if (!raw) {
        cb(defaultLanguageRecords());
        return;
      }
      const records = Object.entries(raw)
        .map(([id, value]) => coerceLanguage(id, value))
        .filter((language): language is LanguageRecord => Boolean(language));
      cb(normalizeLanguageList(records));
    },
    (error) => onError?.(error),
  );
}

export function subscribeTranslations(
  cb: (values: TranslationValues) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, "settings/translations"),
    (snapshot) => {
      const raw = snapshot.val() as Record<string, Record<string, unknown>> | null;
      const out: TranslationValues = {};
      if (raw) {
        for (const [key, languages] of Object.entries(raw)) {
          if (!languages || typeof languages !== "object") continue;
          const values: Record<string, string> = {};
          for (const [code, value] of Object.entries(languages)) {
            if (typeof value === "string" && value.length <= 5000) values[code] = value;
          }
          if (Object.keys(values).length > 0) out[key] = values;
        }
      }
      cb(out);
    },
    (error) => onError?.(error),
  );
}

/** Firebase keys cannot contain dots, so logical keys are flattened safely. */
export function translationStorageKey(key: string): string {
  return key.replace(/\./g, "__");
}

export interface LanguageDraft {
  code: string;
  name: string;
  nativeName: string;
  direction: TextDirection;
  status: LanguageStatus;
  sortOrder: number;
}

function languagePayload(draft: LanguageDraft, uid: string, now: number) {
  return {
    code: draft.code,
    name: draft.name.trim(),
    nativeName: draft.nativeName.trim() || draft.name.trim(),
    direction: draft.direction,
    status: draft.code === "en" ? "active" : draft.status,
    sortOrder: draft.sortOrder,
    protected: BASE_LANGUAGE_CODES.has(draft.code),
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  };
}

export async function createLanguage(draft: LanguageDraft, uid: string): Promise<void> {
  const code = draft.code.trim().toLowerCase();
  if (!isValidLanguageCode(code)) throw new Error("invalid-language-code");
  const existing = await get(ref(db, `settings/languages/${code}`));
  if (existing.exists()) throw new Error("language-already-exists");
  const now = Date.now();
  await set(ref(db, `settings/languages/${code}`), {
    ...languagePayload({ ...draft, code }, uid, now),
    isDefault: false,
  });
}

export async function updateLanguage(
  originalCode: string,
  draft: LanguageDraft,
  uid: string,
): Promise<void> {
  if (draft.code !== originalCode) throw new Error("language-code-immutable");
  const existing = await get(ref(db, `settings/languages/${originalCode}`));
  const fallback = BASE_LANGUAGE_CODES.has(originalCode)
    ? defaultLanguageRecords().find((language) => language.code === originalCode)
    : undefined;
  if (!existing.exists() && !fallback) throw new Error("language-not-found");
  const before =
    (existing.val() as Record<string, unknown> | null) ??
    (fallback as unknown as Record<string, unknown>);
  const now = Date.now();
  const payload: Record<string, unknown> = {
    ...languagePayload(draft, uid, now),
    createdAt: typeof before.createdAt === "number" ? before.createdAt : now,
    createdBy: typeof before.createdBy === "string" ? before.createdBy : uid,
  };
  delete payload.isDefault;
  if (BASE_LANGUAGE_CODES.has(originalCode)) {
    payload.code = originalCode;
    payload.protected = true;
  }
  if (before.isDefault === true && draft.status === "inactive" && originalCode !== "en") {
    throw new Error("default-language-must-stay-active");
  }
  await update(ref(db, `settings/languages/${originalCode}`), payload);
}

function isCompleteLanguageRecord(
  value: Record<string, unknown> | null | undefined,
  code: string,
): boolean {
  return Boolean(
    value &&
      value.code === code &&
      typeof value.name === "string" &&
      value.name.trim() &&
      typeof value.nativeName === "string" &&
      value.nativeName.trim() &&
      (value.direction === "ltr" || value.direction === "rtl") &&
      (value.status === "active" || value.status === "inactive") &&
      typeof value.sortOrder === "number" &&
      Number.isFinite(value.sortOrder),
  );
}

export function buildDefaultLanguageSeed(
  current: Record<string, Record<string, unknown>> | null,
  uid: string,
  now = Date.now(),
): Record<string, unknown> {
  const existing = Object.entries(current ?? {})
    .map(([id, value]) => coerceLanguage(id, value))
    .filter((language): language is LanguageRecord => Boolean(language));
  const hasActiveDefault = existing.some(
    (language) => language.isDefault && language.status === "active",
  );
  const updates: Record<string, unknown> = {};
  for (const language of defaultLanguageRecords(now)) {
    if (isCompleteLanguageRecord(current?.[language.code], language.code)) continue;
    updates[`settings/languages/${language.code}`] = {
      ...language,
      isDefault: !hasActiveDefault && language.code === "en",
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
    };
  }
  return updates;
}

export async function setDefaultLanguage(code: string): Promise<void> {
  const snapshot = await get(ref(db, "settings/languages"));
  const raw = snapshot.val() as Record<string, Record<string, unknown>> | null;
  const list = normalizeLanguageList(
    Object.entries(raw ?? {})
      .map(([id, value]) => coerceLanguage(id, value))
      .filter((language): language is LanguageRecord => Boolean(language)),
  );
  const target = list.find((language) => language.code === code);
  if (!target) throw new Error("language-not-found");
  const now = Date.now();
  const updates: Record<string, unknown> = {
    ...buildDefaultLanguageSeed(raw, "system", now),
  };
  const makeDefault = (languageCode: string) => {
    const fullPath = `settings/languages/${languageCode}`;
    const full = updates[fullPath] as Record<string, unknown> | undefined;
    if (full) {
      updates[fullPath] = {
        ...full,
        isDefault: true,
        status: "active",
        updatedAt: now,
      };
    } else {
      updates[`${fullPath}/isDefault`] = true;
      updates[`${fullPath}/status`] = "active";
      updates[`${fullPath}/updatedAt`] = now;
    }
  };
  const clearDefault = (languageCode: string) => {
    const fullPath = `settings/languages/${languageCode}`;
    const full = updates[fullPath] as Record<string, unknown> | undefined;
    if (full) {
      updates[fullPath] = { ...full, isDefault: false, updatedAt: now };
    } else {
      updates[`${fullPath}/isDefault`] = false;
      updates[`${fullPath}/updatedAt`] = now;
    }
  };
  for (const language of list) {
    if (language.code !== code && language.isDefault) clearDefault(language.code);
  }
  makeDefault(code);
  await update(ref(db), updates);
}

export async function deleteLanguage(code: string): Promise<void> {
  if (BASE_LANGUAGE_CODES.has(code)) throw new Error("protected-language");
  const snapshot = await get(ref(db, "settings/languages"));
  const raw = snapshot.val() as Record<string, Record<string, unknown>> | null;
  const list = normalizeLanguageList(
    Object.entries(raw ?? {})
      .map(([id, value]) => coerceLanguage(id, value))
      .filter((language): language is LanguageRecord => Boolean(language)),
  );
  if (list.length <= 1) throw new Error("last-language");
  const target = list.find((language) => language.code === code);
  if (!target) throw new Error("language-not-found");
  if (target.isDefault) throw new Error("default-language-delete-blocked");

  const translationsSnap = await get(ref(db, "settings/translations"));
  const translations = translationsSnap.val() as Record<string, Record<string, unknown>> | null;
  const updates: Record<string, unknown> = { [`settings/languages/${code}`]: null };
  for (const [storageKey, values] of Object.entries(translations ?? {})) {
    if (values && Object.prototype.hasOwnProperty.call(values, code)) {
      updates[`settings/translations/${storageKey}/${code}`] = null;
    }
  }
  await update(ref(db), updates);
}

export function defaultTranslationFor(key: string, languageCode: string): string {
  const ui = UI_CATALOG.find((entry) => entry.key === key);
  if (ui) return languageCode === "bn" ? ui.bn : ui.en;
  const field = WEBSITE_CONTENT_FIELDS.find((entry) => entry.key === key);
  if (!field) return "";
  return languageCode === "bn" ? field.bn : field.en;
}

export function buildSeedTranslations(languageCodes: string[]): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const code of languageCodes) {
    const source = code === "bn" ? "bn" : "en";
    for (const field of WEBSITE_CONTENT_FIELDS) {
      out[translationStorageKey(field.key)] = out[translationStorageKey(field.key)] ?? {};
      out[translationStorageKey(field.key)][code] =
        source === "bn" ? field.bn : field.en;
    }
    for (const entry of UI_CATALOG) {
      out[translationStorageKey(entry.key)] = out[translationStorageKey(entry.key)] ?? {};
      out[translationStorageKey(entry.key)][code] = source === "bn" ? entry.bn : entry.en;
    }
  }
  return out;
}

/**
 * Writes the bundled English/Bengali catalog into the database so every
 * visible string becomes database-managed. Existing translations are preserved.
 */
export async function seedTranslations(languageCodes: string[]): Promise<number> {
  const seed = buildSeedTranslations(languageCodes);
  const currentSnap = await get(ref(db, "settings/translations"));
  const current = currentSnap.val() as Record<string, Record<string, unknown>> | null;
  const updates: Record<string, unknown> = {};
  let count = 0;
  for (const [storageKey, values] of Object.entries(seed)) {
    for (const [code, value] of Object.entries(values)) {
      const existing = current?.[storageKey]?.[code];
      if (typeof existing !== "string" || existing.length === 0) {
        updates[`settings/translations/${storageKey}/${code}`] = value;
        count += 1;
      }
    }
  }
  if (count > 0) await update(ref(db), updates);
  return count;
}

export async function saveTranslationValues(
  values: Record<string, Record<string, string>>,
): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const [key, languages] of Object.entries(values)) {
    const storageKey = translationStorageKey(key);
    for (const [code, value] of Object.entries(languages)) {
      if (!isValidLanguageCode(code)) continue;
      updates[`settings/translations/${storageKey}/${code}`] = value.slice(0, 5000);
    }
  }
  if (Object.keys(updates).length > 0) await update(ref(db), updates);
}

export async function seedDefaultLanguages(uid: string): Promise<number> {
  const currentSnap = await get(ref(db, "settings/languages"));
  const current = currentSnap.val() as Record<string, Record<string, unknown>> | null;
  const updates = buildDefaultLanguageSeed(current, uid);
  const count = Object.keys(updates).length;
  if (count > 0) await update(ref(db), updates);
  return count;
}

export { remove as removeLanguageNode };
