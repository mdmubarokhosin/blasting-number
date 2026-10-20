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
import { defaultShiftRecords } from "../lib/defaults";
import { DEFAULT_ICON_KEY, iconExists } from "../lib/iconRegistry";
import { isShiftStatus, type ShiftRecord, type ShiftStatus } from "../types";
import { normalizeHex } from "../utils/colors";

function toNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function normalizeTime(value: unknown): string {
  const time = String(value ?? "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
}

export function coerceShift(
  id: string,
  raw: Record<string, unknown> | null,
): ShiftRecord | null {
  if (!raw) return null;
  const status: ShiftStatus = isShiftStatus(raw.status) ? raw.status : "active";
  return {
    id,
    name: String(raw.name ?? id),
    description: String(raw.description ?? ""),
    startTime: normalizeTime(raw.startTime),
    endTime: normalizeTime(raw.endTime),
    color: normalizeHex(String(raw.color ?? "#64748b")),
    icon: iconExists(String(raw.icon ?? "")) ? String(raw.icon) : DEFAULT_ICON_KEY,
    status,
    sortOrder: toNumber(raw.sortOrder, 999),
    createdAt: toNumber(raw.createdAt),
    updatedAt: toNumber(raw.updatedAt),
    createdBy: String(raw.createdBy ?? ""),
  };
}

export function subscribeShifts(
  cb: (shifts: ShiftRecord[]) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, "shifts"),
    (snap) => {
      const value = snap.val() as Record<string, Record<string, unknown>> | null;
      if (!value) {
        cb([]);
        return;
      }
      const out: ShiftRecord[] = [];
      for (const [id, raw] of Object.entries(value)) {
        const shift = coerceShift(id, raw);
        if (shift) out.push(shift);
      }
      out.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      cb(out);
    },
    (e) => onError?.(e),
  );
}

export async function fetchShifts(): Promise<ShiftRecord[]> {
  const snap = await get(ref(db, "shifts"));
  const value = snap.val() as Record<string, Record<string, unknown>> | null;
  if (!value) return [];
  return Object.entries(value)
    .map(([id, raw]) => coerceShift(id, raw))
    .filter((shift): shift is ShiftRecord => Boolean(shift));
}

export interface ShiftDraft {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  color: string;
  icon: string;
  status: ShiftStatus;
  sortOrder: number;
}

export async function createShift(draft: ShiftDraft, uid: string): Promise<void> {
  const now = Date.now();
  await set(ref(db, `shifts/${draft.id}`), {
    name: draft.name.trim(),
    description: draft.description.trim(),
    startTime: draft.startTime.trim(),
    endTime: draft.endTime.trim(),
    color: normalizeHex(draft.color),
    icon: iconExists(draft.icon) ? draft.icon : DEFAULT_ICON_KEY,
    status: draft.status,
    sortOrder: draft.sortOrder,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  });
}

export async function updateShift(
  shiftId: string,
  draft: Omit<ShiftDraft, "id">,
): Promise<void> {
  await update(ref(db, `shifts/${shiftId}`), {
    name: draft.name.trim(),
    description: draft.description.trim(),
    startTime: draft.startTime.trim(),
    endTime: draft.endTime.trim(),
    color: normalizeHex(draft.color),
    icon: iconExists(draft.icon) ? draft.icon : DEFAULT_ICON_KEY,
    status: draft.status,
    sortOrder: draft.sortOrder,
    updatedAt: Date.now(),
  });
}

export async function updateShiftStatus(
  shiftId: string,
  status: ShiftStatus,
): Promise<void> {
  await update(ref(db, `shifts/${shiftId}`), { status, updatedAt: Date.now() });
}

export async function deleteShift(shiftId: string): Promise<void> {
  await remove(ref(db, `shifts/${shiftId}`));
}

/** Creates only missing default shifts; existing configuration is preserved. */
export async function seedDefaultShifts(uid: string): Promise<number> {
  const current = await fetchShifts();
  const existing = new Set(current.map((shift) => shift.id));
  const seeds = defaultShiftRecords(Date.now(), uid).filter(
    (shift) => !existing.has(shift.id),
  );
  if (seeds.length === 0) return 0;
  const updates: Record<string, unknown> = {};
  for (const shift of seeds) {
    updates[`shifts/${shift.id}`] = {
      name: shift.name,
      description: shift.description,
      startTime: shift.startTime,
      endTime: shift.endTime,
      color: shift.color,
      icon: shift.icon,
      status: shift.status,
      sortOrder: shift.sortOrder,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
      createdBy: shift.createdBy,
    };
  }
  await update(ref(db), updates);
  return seeds.length;
}
