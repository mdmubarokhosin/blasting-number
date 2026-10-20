import {
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { auth, db } from "../lib/firebase";
import type { BlastingList, ListItem, Shift } from "../types";
import { isShift } from "../types";
import { listToArray } from "../utils/listItems";

function coerceList(id: string, raw: Record<string, unknown> | null): BlastingList | null {
  if (!raw) return null;
  const itemsRaw = (raw.items ?? {}) as Record<string, Partial<ListItem>>;
  const items: Record<string, ListItem> = {};
  for (const [itemId, it] of Object.entries(itemsRaw)) {
    if (!it) continue;
    items[itemId] = {
      id: itemId,
      categoryId: typeof it.categoryId === "string" && it.categoryId ? it.categoryId : undefined,
      category: String(it.category ?? "Uncategorized"),
      code: String(it.code ?? ""),
      createdBy: String(it.createdBy ?? ""),
      createdByName: String(it.createdByName ?? ""),
      createdAt: typeof it.createdAt === "number" ? it.createdAt : 0,
      updatedAt: typeof it.updatedAt === "number" ? it.updatedAt : null,
    };
  }
  return {
    id,
    date: String(raw.date ?? ""),
    shift: isShift(raw.shift) ? raw.shift : "day",
    ownerId: String(raw.ownerId ?? ""),
    ownerName: String(raw.ownerName ?? ""),
    note: String(raw.note ?? ""),
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
    items,
  };
}

/**
 * Realtime subscription to lists. Authenticated active users may read all lists
 * (factory shared workspace); rules restrict writes to owner/admin.
 */
export function subscribeLists(
  cb: (lists: BlastingList[]) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, "lists"),
    (snap) => {
      const val = snap.val() as Record<string, Record<string, unknown>> | null;
      if (!val) {
        cb([]);
        return;
      }
      const out: BlastingList[] = [];
      for (const [id, raw] of Object.entries(val)) {
        const list = coerceList(id, raw);
        if (list) out.push(list);
      }
      out.sort((a, b) =>
        a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date),
      );
      cb(out);
    },
    (e) => onError?.(e),
  );
}

function currentUserName(): string {
  const user = auth.currentUser;
  return user?.displayName?.trim() || user?.email || "unknown";
}

export async function createList(input: {
  date: string;
  shift: Shift;
  note?: string;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");
  const newRef = push(ref(db, "lists"));
  const key = newRef.key;
  if (!key) throw new Error("could-not-create-key");
  const now = Date.now();
  await set(newRef, {
    date: input.date,
    shift: input.shift,
    note: (input.note ?? "").trim(),
    ownerId: user.uid,
    ownerName: currentUserName(),
    createdAt: now,
    updatedAt: now,
  });
  return key;
}

export async function updateListMeta(
  listId: string,
  patch: { date?: string; shift?: Shift; note?: string },
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: Date.now() };
  if (patch.date !== undefined) payload.date = patch.date;
  if (patch.shift !== undefined) payload.shift = patch.shift;
  if (patch.note !== undefined) payload.note = patch.note.trim();
  await update(ref(db, `lists/${listId}`), payload);
}

/** Removes a whole list (meta + items) atomically. */
export async function deleteList(listId: string): Promise<void> {
  await remove(ref(db, `lists/${listId}`));
}

export interface ItemCategoryInput {
  categoryId: string;
  categoryName: string;
  code: string;
}

function buildItem(categoryId: string, categoryName: string, code: string): Omit<ListItem, "id"> {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");
  const now = Date.now();
  return {
    categoryId,
    category: categoryName,
    code,
    createdBy: user.uid,
    createdByName: currentUserName(),
    createdAt: now,
    updatedAt: null,
  };
}

export async function addListItem(listId: string, input: ItemCategoryInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");
  const itemRef = push(ref(db, `lists/${listId}/items`));
  const key = itemRef.key;
  if (!key) throw new Error("could-not-create-key");
  await update(ref(db, `lists/${listId}`), {
    updatedAt: Date.now(),
    [`items/${key}`]: buildItem(input.categoryId, input.categoryName, input.code),
  });
  return key;
}

/** Adds several normalized items in one atomic multi-path update. */
export async function addListItems(listId: string, inputs: ItemCategoryInput[]): Promise<number> {
  if (inputs.length === 0) return 0;
  const payload: Record<string, unknown> = { updatedAt: Date.now() };
  for (const input of inputs) {
    const itemRef = push(ref(db, `lists/${listId}/items`));
    const key = itemRef.key;
    if (!key) throw new Error("could-not-create-key");
    payload[`items/${key}`] = buildItem(input.categoryId, input.categoryName, input.code);
  }
  await update(ref(db, `lists/${listId}`), payload);
  return inputs.length;
}

export async function updateListItem(
  listId: string,
  itemId: string,
  patch: { categoryId?: string; categoryName?: string; code?: string },
): Promise<void> {
  const now = Date.now();
  const payload: Record<string, unknown> = { updatedAt: now };
  if (patch.categoryId !== undefined) payload.categoryId = patch.categoryId;
  if (patch.categoryName !== undefined) payload.category = patch.categoryName;
  if (patch.code !== undefined) payload.code = patch.code;
  await update(ref(db), {
    [`lists/${listId}/items/${itemId}`]: payload,
    [`lists/${listId}/updatedAt`]: now,
  });
}

export async function deleteListItem(listId: string, itemId: string): Promise<void> {
  const now = Date.now();
  await update(ref(db), {
    [`lists/${listId}/items/${itemId}`]: null,
    [`lists/${listId}/updatedAt`]: now,
  });
}

/** All codes across all loaded lists — the global duplicate checker. */
export function collectCodes(
  lists: BlastingList[],
): { date: string; shift: string; code: string; category: string; categoryId?: string }[] {
  const out: { date: string; shift: string; code: string; category: string; categoryId?: string }[] =
    [];
  for (const list of lists) {
    for (const item of Object.values(list.items)) {
      out.push({
        date: list.date,
        shift: list.shift,
        code: item.code,
        category: item.category,
        categoryId: item.categoryId,
      });
    }
  }
  return out;
}

export { listToArray };
