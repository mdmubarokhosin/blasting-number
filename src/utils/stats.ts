import type {
  ActivityLog,
  BlastingList,
  CategoryRecord,
  ListItem,
  ShiftRecord,
  UserProfile,
} from "../types";
import { effectiveRoleKey, isMasterRoleKey } from "../lib/defaults";
import { toISO } from "./format";
import { listToArray } from "./listItems";
import { resolveItemCategory } from "./categories";

export interface ListStats {
  totalLists: number;
  totalItems: number;
  categoryCounts: Record<string, number>;
  shiftCounts: Record<string, number>;
  todayLists: number;
  todayItems: number;
}

export function listItems(list: BlastingList): ListItem[] {
  return listToArray(list);
}

export function computeListStats(
  lists: BlastingList[],
  categories: CategoryRecord[] = [],
  todayIso = toISO(new Date()),
  shifts: ShiftRecord[] = [],
): ListStats {
  const categoryCounts: Record<string, number> = {};
  for (const category of categories) categoryCounts[category.id] = 0;
  const shiftCounts: Record<string, number> =
    shifts.length > 0
      ? Object.fromEntries(shifts.map((shift) => [shift.id, 0]))
      : { day: 0, night: 0 };
  let totalItems = 0;
  let todayLists = 0;
  let todayItems = 0;

  for (const list of lists) {
    shiftCounts[list.shift] = (shiftCounts[list.shift] ?? 0) + 1;
    const isToday = list.date === todayIso;
    if (isToday) todayLists += 1;
    for (const item of Object.values(list.items)) {
      totalItems += 1;
      const key =
        categories.length > 0
          ? resolveItemCategory(item, categories).id
          : item.category;
      categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
      if (isToday) todayItems += 1;
    }
  }

  return {
    totalLists: lists.length,
    totalItems,
    categoryCounts,
    shiftCounts,
    todayLists,
    todayItems,
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  admins: number;
  newLast7Days: number;
}

export function computeUserStats(
  profiles: UserProfile[],
  now = Date.now(),
): UserStats {
  const weekAgo = now - 7 * 86_400_000;
  return {
    totalUsers: profiles.length,
    activeUsers: profiles.filter((p) => p.active).length,
    inactiveUsers: profiles.filter((p) => !p.active).length,
    admins: profiles.filter((p) => {
      const key = effectiveRoleKey(p.role);
      return isMasterRoleKey(key) || key === "admin-standard";
    }).length,
    newLast7Days: profiles.filter((p) => p.createdAt >= weekAgo).length,
  };
}

/** Lists per ISO day for a set of ISO dates. */
export function listCountsByDay(
  lists: BlastingList[],
  days: string[],
): number[] {
  const map = new Map<string, number>();
  for (const list of lists) map.set(list.date, (map.get(list.date) ?? 0) + 1);
  return days.map((day) => map.get(day) ?? 0);
}

export function itemCountsByDay(
  lists: BlastingList[],
  days: string[],
): number[] {
  const map = new Map<string, number>();
  for (const list of lists) {
    const count = Object.keys(list.items).length;
    map.set(list.date, (map.get(list.date) ?? 0) + count);
  }
  return days.map((day) => map.get(day) ?? 0);
}

export function activityCountsByDay(
  logs: ActivityLog[],
  days: string[],
): number[] {
  const map = new Map<string, number>();
  for (const log of logs) {
    if (!log.timestamp) continue;
    const key = toISO(new Date(log.timestamp));
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return days.map((day) => map.get(day) ?? 0);
}

export interface OwnerStat {
  uid: string;
  name: string;
  lists: number;
  items: number;
}

export function topOwners(lists: BlastingList[], limit = 8): OwnerStat[] {
  const map = new Map<string, OwnerStat>();
  for (const list of lists) {
    const key = list.ownerId || list.ownerName || "unknown";
    const current = map.get(key) ?? {
      uid: list.ownerId,
      name: list.ownerName || "unknown",
      lists: 0,
      items: 0,
    };
    current.lists += 1;
    current.items += Object.keys(list.items).length;
    map.set(key, current);
  }
  return [...map.values()]
    .sort((a, b) => b.items - a.items || b.lists - a.lists)
    .slice(0, limit);
}

/** True when the stats contain no real data to chart. */
export function isEmptyStats(stats: ListStats): boolean {
  return stats.totalLists === 0 && stats.totalItems === 0;
}

export function filterListsByDateRange(
  lists: BlastingList[],
  from: string | null,
  to: string | null,
): BlastingList[] {
  if (!from && !to) return lists;
  return lists.filter((list) => {
    if (from && list.date < from) return false;
    if (to && list.date > to) return false;
    return true;
  });
}

export function filterLogsByDateRange(
  logs: ActivityLog[],
  from: string | null,
  to: string | null,
): ActivityLog[] {
  if (!from && !to) return logs;
  const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : 0;
  const toTs = to
    ? new Date(`${to}T23:59:59.999`).getTime()
    : Number.MAX_SAFE_INTEGER;
  return logs.filter((log) => log.timestamp >= fromTs && log.timestamp <= toTs);
}
