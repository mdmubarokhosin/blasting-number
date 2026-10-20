import type { BlastingList, CategoryRecord, ListItem } from "../types";

export const LEGACY_CATEGORY_COLOR = "#64748b";
export const LEGACY_CATEGORY_ICON = "tag";

export function sortCategories(categories: CategoryRecord[]): CategoryRecord[] {
  return [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}

export function activeCategories(categories: CategoryRecord[]): CategoryRecord[] {
  return sortCategories(categories.filter((category) => category.status === "active"));
}

function categoryMatches(category: CategoryRecord, ref: string): boolean {
  const needle = ref.trim().toLowerCase();
  if (!needle) return false;
  return (
    category.id.toLowerCase() === needle ||
    category.slug.toLowerCase() === needle ||
    category.name.toLowerCase() === needle
  );
}

export function findCategory(
  categories: CategoryRecord[],
  ref: string | null | undefined,
): CategoryRecord | null {
  if (!ref) return null;
  return categories.find((category) => categoryMatches(category, ref)) ?? null;
}

export function isLegacyCategory(category: Pick<CategoryRecord, "id" | "createdBy">): boolean {
  return category.createdBy === "legacy" || category.id.startsWith("legacy:");
}

export function itemCategoryFields(
  category: Pick<CategoryRecord, "id" | "name" | "createdBy">,
  code: string,
): { categoryId?: string; categoryName: string; code: string } {
  return {
    ...(isLegacyCategory(category) ? {} : { categoryId: category.id }),
    categoryName: category.name,
    code,
  };
}

export function legacyCategory(name: string): CategoryRecord {
  const safeName = name || "Uncategorized";
  return {
    id: `legacy:${safeName.toLowerCase()}`,
    name: safeName,
    slug: safeName.toLowerCase(),
    description: "পুরনো ডেটার ক্যাটাগরি — অ্যাডমিন থেকে migrate করুন।",
    color: LEGACY_CATEGORY_COLOR,
    icon: LEGACY_CATEGORY_ICON,
    status: "inactive",
    sortOrder: 9999,
    createdAt: 0,
    updatedAt: 0,
    createdBy: "legacy",
  };
}

/** Resolves an item's stable category id, falling back to its legacy name snapshot. */
export function resolveItemCategory(
  item: Pick<ListItem, "category" | "categoryId">,
  categories: CategoryRecord[],
): CategoryRecord {
  return (
    (item.categoryId ? findCategory(categories, item.categoryId) : null) ??
    findCategory(categories, item.category) ??
    legacyCategory(item.category || "Uncategorized")
  );
}

export interface CategoryUsage {
  category: CategoryRecord;
  count: number;
  legacy: boolean;
}

/** Counts items per category, including currently used legacy/unregistered names. */
export function categoryUsage(
  lists: BlastingList[],
  categories: CategoryRecord[],
): CategoryUsage[] {
  const counts = new Map<string, { category: CategoryRecord; count: number; legacy: boolean }>();
  for (const category of categories) {
    counts.set(category.id, { category, count: 0, legacy: false });
  }
  for (const list of lists) {
    for (const item of Object.values(list.items)) {
      const category = resolveItemCategory(item, categories);
      const current = counts.get(category.id);
      if (current) current.count += 1;
      else
        counts.set(category.id, {
          category,
          count: 1,
          legacy: category.createdBy === "legacy",
        });
    }
  }
  return [...counts.values()].sort(
    (a, b) =>
      Number(b.legacy) - Number(a.legacy) ||
      a.category.sortOrder - b.category.sortOrder ||
      a.category.name.localeCompare(b.category.name),
  );
}

/** Categories that can be selected for a new item (active only). */
export function selectableCategories(categories: CategoryRecord[]): CategoryRecord[] {
  return activeCategories(categories);
}

export function itemCategoryName(
  item: Pick<ListItem, "category" | "categoryId">,
  categories: CategoryRecord[],
): string {
  return resolveItemCategory(item, categories).name;
}
