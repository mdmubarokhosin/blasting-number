import type { BlastingList, ListItem } from "../types";

export function listToArray(list: BlastingList): ListItem[] {
  return Object.values(list.items).sort((a, b) => a.createdAt - b.createdAt);
}
