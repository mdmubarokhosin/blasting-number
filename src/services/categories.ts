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
import { defaultCategoryRecords } from "../lib/defaults";
import { DEFAULT_ICON_KEY, iconExists } from "../lib/iconRegistry";
import { isCategoryStatus, type BlastingList, type CategoryRecord, type CategoryStatus } from "../types";
import { normalizeHex } from "../utils/colors";
import { findCategory } from "../utils/categories";

function toNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function coerceCategory(
  id: string,
  raw: Record<string, unknown> | null,
): CategoryRecord | null {
  if (!raw) return null;
  const status: CategoryStatus = isCategoryStatus(raw.status) ? raw.status : "active";
  return {
    id,
    name: String(raw.name ?? id),
    slug: String(raw.slug ?? id),
    description: String(raw.description ?? ""),
    color: normalizeHex(String(raw.color ?? "#64748b")),
    icon: iconExists(String(raw.icon ?? "")) ? String(raw.icon) : DEFAULT_ICON_KEY,
    status,
    sortOrder: toNumber(raw.sortOrder, 999),
    createdAt: toNumber(raw.createdAt),
    updatedAt: toNumber(raw.updatedAt),
    createdBy: String(raw.createdBy ?? ""),
  };
}

export function subscribeCategories(
  cb: (categories: CategoryRecord[]) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, "categories"),
    (snap) => {
      const value = snap.val() as Record<string, Record<string, unknown>> | null;
      if (!value) {
        cb([]);
        return;
      }
      const out: CategoryRecord[] = [];
      for (const [id, raw] of Object.entries(value)) {
        const category = coerceCategory(id, raw);
        if (category) out.push(category);
      }
      out.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      cb(out);
    },
    (e) => onError?.(e),
  );
}

export async function fetchCategories(): Promise<CategoryRecord[]> {
  const snap = await get(ref(db, "categories"));
  const value = snap.val() as Record<string, Record<string, unknown>> | null;
  if (!value) return [];
  return Object.entries(value)
    .map(([id, raw]) => coerceCategory(id, raw))
    .filter((category): category is CategoryRecord => Boolean(category));
}

export interface CategoryDraft {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  status: CategoryStatus;
  sortOrder: number;
}

export async function createCategory(draft: CategoryDraft, uid: string): Promise<void> {
  const now = Date.now();
  await set(ref(db, `categories/${draft.id}`), {
    name: draft.name.trim(),
    slug: draft.slug.trim().toLowerCase(),
    description: draft.description.trim(),
    color: normalizeHex(draft.color),
    icon: iconExists(draft.icon) ? draft.icon : DEFAULT_ICON_KEY,
    status: draft.status,
    sortOrder: draft.sortOrder,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  });
}

export async function updateCategory(
  categoryId: string,
  draft: Omit<CategoryDraft, "id">,
): Promise<void> {
  await update(ref(db, `categories/${categoryId}`), {
    name: draft.name.trim(),
    description: draft.description.trim(),
    color: normalizeHex(draft.color),
    icon: iconExists(draft.icon) ? draft.icon : DEFAULT_ICON_KEY,
    status: draft.status,
    sortOrder: draft.sortOrder,
    updatedAt: Date.now(),
  });
}

export async function updateCategoryStatus(
  categoryId: string,
  status: CategoryStatus,
): Promise<void> {
  await update(ref(db, `categories/${categoryId}`), { status, updatedAt: Date.now() });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await remove(ref(db, `categories/${categoryId}`));
}

/** Creates only missing default categories; existing configuration is preserved. */
export async function seedDefaultCategories(uid: string): Promise<number> {
  const current = await fetchCategories();
  const existing = new Set(current.map((category) => category.id));
  const seeds = defaultCategoryRecords(Date.now(), uid).filter(
    (category) => !existing.has(category.id),
  );
  if (seeds.length === 0) return 0;
  const updates: Record<string, unknown> = {};
  for (const category of seeds) {
    updates[`categories/${category.id}`] = {
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      icon: category.icon,
      status: category.status,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      createdBy: category.createdBy,
    };
  }
  await update(ref(db), updates);
  return seeds.length;
}

/**
 * Backfills `categoryId` on legacy items by matching their old category name.
 * Existing `categoryId` values are never overwritten.
 */
export async function migrateLegacyCategoryReferences(
  lists: BlastingList[],
  categories: CategoryRecord[],
): Promise<number> {
  const updates: Record<string, unknown> = {};
  let migrated = 0;
  const now = Date.now();
  for (const list of lists) {
    for (const item of Object.values(list.items)) {
      if (item.categoryId) continue;
      const category = findCategory(categories, item.category);
      if (!category || category.status !== "active") continue;
      updates[`lists/${list.id}/items/${item.id}/categoryId`] = category.id;
      updates[`lists/${list.id}/items/${item.id}/category`] = category.name;
      updates[`lists/${list.id}/items/${item.id}/updatedAt`] = now;
      migrated += 1;
    }
  }
  if (migrated > 0) await update(ref(db), updates);
  return migrated;
}
