import type { RoleRecord, UserProfile } from "../types";
import { effectiveRoleKey, isMasterRoleKey } from "../lib/defaults";

export function syntheticRole(key: string): RoleRecord {
  const master = isMasterRoleKey(key);
  return {
    id: key,
    name:
      key === "master-admin" || key === "admin"
        ? "Master Admin"
        : key === "user"
          ? "Operator"
          : key || "Unknown",
    description: "",
    color: master ? "#7c3aed" : "#64748b",
    icon: master ? "shield-check" : "user-round",
    status: "active",
    permissions: {},
    isSystemRole: master,
    protected: master,
    sortOrder: 999,
    assignedUserCount: 0,
    createdAt: 0,
    updatedAt: 0,
    createdBy: "legacy",
  };
}

export function resolveProfileRole(
  profile: Pick<UserProfile, "role">,
  roles: RoleRecord[],
): RoleRecord {
  const key = effectiveRoleKey(profile.role);
  return roles.find((role) => role.id === key) ?? syntheticRole(key);
}

export function roleLabel(profile: Pick<UserProfile, "role">, roles: RoleRecord[]): string {
  return resolveProfileRole(profile, roles).name;
}

/** Roles that are allowed to be assigned from the user management screen. */
export function assignableRoles(roles: RoleRecord[]): RoleRecord[] {
  return roles.filter(
    (role) => role.status === "active" && role.id !== "admin" && role.id !== "user",
  );
}
