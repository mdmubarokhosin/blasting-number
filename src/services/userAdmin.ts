import { ref, update } from "firebase/database";
import { auth, db } from "../lib/firebase";
import { effectiveRoleKey, isMasterRoleKey, MASTER_ROLE_KEY } from "../lib/defaults";
import type { RoleRecord, UserProfile } from "../types";
import { createManagedUser, createProfileForUid } from "./auth";

export function countProfilesByRole(profiles: UserProfile[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const profile of profiles) {
    const role = effectiveRoleKey(profile.role);
    counts[role] = (counts[role] ?? 0) + 1;
  }
  return counts;
}

function countUpdates(
  roles: RoleRecord[],
  counts: Record<string, number>,
): Record<string, number> {
  const updates: Record<string, number> = {};
  for (const role of roles) updates[`roles/${role.id}/assignedUserCount`] = counts[role.id] ?? 0;
  return updates;
}

/** Recomputes every role's assignedUserCount from the authoritative profile list. */
export async function syncAllRoleCounts(
  profiles: UserProfile[],
  roles: RoleRecord[],
): Promise<void> {
  if (roles.length === 0) return;
  const now = Date.now();
  const updates: Record<string, unknown> = {};
  const counts = countProfilesByRole(profiles);
  for (const role of roles) {
    updates[`roles/${role.id}/assignedUserCount`] = counts[role.id] ?? 0;
    updates[`roles/${role.id}/updatedAt`] = now;
  }
  await update(ref(db), updates);
}

export interface CreateUserWithRoleInput {
  email: string;
  password: string;
  displayName: string;
  roleKey: string;
}

export async function createUserWithRole(
  input: CreateUserWithRoleInput,
  profiles: UserProfile[],
  roles: RoleRecord[],
): Promise<string> {
  const role = roles.find((entry) => entry.id === input.roleKey);
  if (!role || role.status !== "active") throw new Error("role-inactive");
  const uid = await createManagedUser({ ...input, role: input.roleKey }, async (createdUid, email, displayName, roleKey) => {
    await createProfileForUid({ uid: createdUid, email, displayName, role: roleKey });
  });
  const counts = countProfilesByRole(profiles);
  counts[input.roleKey] = (counts[input.roleKey] ?? 0) + 1;
  try {
    await update(ref(db), countUpdates(roles, counts));
  } catch {
    // The account exists and is usable; a stale count is corrected by the role page sync.
  }
  return uid;
}

export async function assignUserRole(
  target: UserProfile,
  newRoleKey: string,
  actingUid: string,
  profiles: UserProfile[],
  roles: RoleRecord[],
): Promise<void> {
  if (target.uid === actingUid) throw new Error("self-role-change");
  const newRole = roles.find((role) => role.id === newRoleKey);
  if (!newRole || newRole.status !== "active") throw new Error("role-inactive");
  const actor = profiles.find((profile) => profile.uid === actingUid);
  const actorIsMaster = Boolean(actor && isMasterRoleKey(effectiveRoleKey(actor.role)));
  const targetIsMaster = isMasterRoleKey(effectiveRoleKey(target.role));
  // A master may step another master down; the acting master always remains,
  // so the last active master can never be removed. Self-demotion is blocked above.
  if (targetIsMaster && newRoleKey !== MASTER_ROLE_KEY && !actorIsMaster) {
    throw new Error("protected-role-change");
  }
  if (newRoleKey === MASTER_ROLE_KEY && !actorIsMaster) {
    throw new Error("master-assignment-forbidden");
  }

  const counts = countProfilesByRole(profiles);
  const oldKey = effectiveRoleKey(target.role);
  counts[oldKey] = Math.max(0, (counts[oldKey] ?? 0) - 1);
  counts[newRoleKey] = (counts[newRoleKey] ?? 0) + 1;

  await update(ref(db), {
    [`profiles/${target.uid}/role`]: newRoleKey,
    [`profiles/${target.uid}/updatedAt`]: Date.now(),
    ...countUpdates(roles, counts),
  });
}

export async function setUserActive(
  target: UserProfile,
  active: boolean,
  actingUid: string,
): Promise<void> {
  if (target.uid === actingUid) throw new Error("self-status-change");
  if (!active && isMasterRoleKey(effectiveRoleKey(target.role))) {
    throw new Error("protected-status-change");
  }
  await update(ref(db, `profiles/${target.uid}`), {
    active,
    updatedAt: Date.now(),
  });
}

export function currentActorUid(): string {
  return auth.currentUser?.uid ?? "";
}
