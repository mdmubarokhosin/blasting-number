import type { BlastingList, UserProfile } from "../types";

export type PermissionCheck = (permissionId: string) => boolean;

function activeProfile(profile: UserProfile | null): profile is UserProfile {
  return Boolean(profile && profile.active !== false);
}

export function canEditList(args: {
  list: BlastingList;
  profile: UserProfile | null;
  can: PermissionCheck;
}): boolean {
  const { list, profile, can } = args;
  if (!activeProfile(profile)) return false;
  if (can("lists.editAny")) return true;
  return list.ownerId === profile.uid && can("lists.editOwn");
}

export function canDeleteList(args: {
  list: BlastingList;
  profile: UserProfile | null;
  can: PermissionCheck;
}): boolean {
  const { list, profile, can } = args;
  if (!activeProfile(profile)) return false;
  if (can("lists.deleteAny")) return true;
  return list.ownerId === profile.uid && can("lists.deleteOwn");
}

export function canCreateList(can: PermissionCheck): boolean {
  return can("lists.create");
}
