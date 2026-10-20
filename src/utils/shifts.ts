import { defaultShiftRecords } from "../lib/defaults";
import type { BlastingList, ShiftRecord } from "../types";

export const LEGACY_SHIFT_IDS = ["day", "night"] as const;
const LEGACY_SHIFT_NAMES: Record<string, string> = {
  day: "দিন",
  night: "রাত",
};

export function isLegacyShiftId(id: string): boolean {
  return id === "day" || id === "night";
}

export function sortShifts(shifts: ShiftRecord[]): ShiftRecord[] {
  return [...shifts].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}

export function activeShifts(shifts: ShiftRecord[]): ShiftRecord[] {
  return sortShifts(shifts.filter((shift) => shift.status === "active"));
}

export function findShift(
  shifts: ShiftRecord[],
  id: string | null | undefined,
): ShiftRecord | null {
  if (!id) return null;
  return shifts.find((shift) => shift.id === id) ?? null;
}

/** Display-safe fallback for deleted/legacy shift references. */
export function syntheticShift(id: string): ShiftRecord {
  const seeded = defaultShiftRecords(0, "legacy").find(
    (shift) => shift.id === id,
  );
  if (seeded) return seeded;
  return {
    id,
    name: id || "অজানা শিফট",
    description: "পুরনো বা মুছে ফেলা শিফট — শুধু ঐতিহাসিক রেকর্ডে দেখা যাচ্ছে।",
    startTime: "",
    endTime: "",
    color: "#64748b",
    icon: "layers",
    status: "inactive",
    sortOrder: 9999,
    createdAt: 0,
    updatedAt: 0,
    createdBy: "legacy",
  };
}

export function resolveShift(id: string, shifts: ShiftRecord[]): ShiftRecord {
  return findShift(shifts, id) ?? syntheticShift(id);
}

export function shiftName(id: string, shifts: ShiftRecord[]): string {
  return findShift(shifts, id)?.name ?? LEGACY_SHIFT_NAMES[id] ?? id;
}

export function shiftTimeLabel(
  shift: Pick<ShiftRecord, "startTime" | "endTime">,
): string {
  if (!shift.startTime || !shift.endTime) return "সময় নির্ধারিত নয়";
  return `${shift.startTime} – ${shift.endTime}`;
}

/**
 * Options for creating/editing a list. Only active shifts are offered, plus the
 * current (possibly inactive or deleted) shift so old records stay editable.
 * With no shift configuration at all, the legacy day/night fallbacks are used.
 */
export function selectableShifts(
  shifts: ShiftRecord[],
  currentId?: string,
): ShiftRecord[] {
  const source = shifts.length > 0 ? shifts : defaultShiftRecords(0, "legacy");
  const active = activeShifts(source);
  if (!currentId) return active;
  if (active.some((shift) => shift.id === currentId)) return active;
  const current = findShift(source, currentId) ?? syntheticShift(currentId);
  return [...active, current];
}

/** Filter chips should include active shifts and any shift used by loaded lists. */
export function shiftFilterOptions(
  lists: BlastingList[],
  shifts: ShiftRecord[],
): ShiftRecord[] {
  const source = shifts.length > 0 ? shifts : defaultShiftRecords(0, "legacy");
  const used = new Set(lists.map((list) => list.shift));
  return sortShifts(
    source.filter((shift) => shift.status === "active" || used.has(shift.id)),
  );
}

export interface ShiftUsage {
  shift: ShiftRecord;
  count: number;
  legacy: boolean;
}

export function shiftUsage(
  lists: BlastingList[],
  shifts: ShiftRecord[],
): ShiftUsage[] {
  const usage = new Map<string, ShiftUsage>();
  for (const shift of shifts) {
    usage.set(shift.id, { shift, count: 0, legacy: false });
  }
  for (const list of lists) {
    const current = usage.get(list.shift);
    if (current) {
      current.count += 1;
      continue;
    }
    usage.set(list.shift, {
      shift: findShift(shifts, list.shift) ?? syntheticShift(list.shift),
      count: 1,
      legacy: !findShift(shifts, list.shift),
    });
  }
  return [...usage.values()].sort(
    (a, b) =>
      Number(b.legacy) - Number(a.legacy) ||
      a.shift.sortOrder - b.shift.sortOrder ||
      a.shift.name.localeCompare(b.shift.name),
  );
}

export function chartShiftUsage(
  lists: BlastingList[],
  shifts: ShiftRecord[],
): ShiftUsage[] {
  return shiftUsage(lists, shifts).filter(
    (entry) => entry.count > 0 || entry.shift.status === "active",
  );
}
