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
import { defaultRoleRecords, MASTER_ROLE_KEY } from "../lib/defaults";
import { iconExists, DEFAULT_ICON_KEY } from "../lib/iconRegistry";
import { normalizeHex } from "../utils/colors";
import { isRoleStatus, type RoleRecord, type RoleStatus } from "../types";

function toNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function coerceRole(id: string, raw: Record<string, unknown> | null): RoleRecord | null {
  if (!raw) return null;
  const permissionsRaw = (raw.permissions ?? {}) as Record<string, unknown>;
  const permissions: Record<string, true> = {};
  for (const [key, value] of Object.entries(permissionsRaw)) {
    if (value === true) permissions[key] = true;
  }
  const status: RoleStatus = isRoleStatus(raw.status) ? raw.status : "active";
  return {
    id,
    name: String(raw.name ?? id),
    description: String(raw.description ?? ""),
    color: normalizeHex(String(raw.color ?? "#64748b")),
    icon: iconExists(String(raw.icon ?? "")) ? String(raw.icon) : DEFAULT_ICON_KEY,
    status,
    permissions,
    isSystemRole: raw.isSystemRole === true,
    protected: raw.protected === true,
    sortOrder: toNumber(raw.sortOrder, 999),
    assignedUserCount: toNumber(raw.assignedUserCount, 0),
    createdAt: toNumber(raw.createdAt),
    updatedAt: toNumber(raw.updatedAt),
    createdBy: String(raw.createdBy ?? ""),
  };
}

export function subscribeRoles(
  cb: (roles: RoleRecord[]) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, "roles"),
    (snap) => {
      const value = snap.val() as Record<string, Record<string, unknown>> | null;
      if (!value) {
        cb([]);
        return;
      }
      const out: RoleRecord[] = [];
      for (const [id, raw] of Object.entries(value)) {
        const role = coerceRole(id, raw);
        if (role) out.push(role);
      }
      out.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      cb(out);
    },
    (e) => onError?.(e),
  );
}

export async function fetchRoles(): Promise<RoleRecord[]> {
  const snap = await get(ref(db, "roles"));
  const value = snap.val() as Record<string, Record<string, unknown>> | null;
  if (!value) return [];
  return Object.entries(value)
    .map(([id, raw]) => coerceRole(id, raw))
    .filter((role): role is RoleRecord => Boolean(role));
}

export interface RoleDraft {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: RoleStatus;
  permissions: Record<string, true>;
  sortOrder: number;
}

export async function createRole(draft: RoleDraft, uid: string): Promise<void> {
  const now = Date.now();
  await set(ref(db, `roles/${draft.id}`), {
    name: draft.name.trim(),
    description: draft.description.trim(),
    color: normalizeHex(draft.color),
    icon: iconExists(draft.icon) ? draft.icon : DEFAULT_ICON_KEY,
    status: draft.status,
    permissions: draft.permissions,
    isSystemRole: false,
    protected: false,
    sortOrder: draft.sortOrder,
    assignedUserCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  });
}

export async function updateRole(
  roleId: string,
  draft: Omit<RoleDraft, "id">,
  options: { includePermissions?: boolean } = {},
): Promise<void> {
  const payload: Record<string, unknown> = {
    name: draft.name.trim(),
    description: draft.description.trim(),
    color: normalizeHex(draft.color),
    icon: iconExists(draft.icon) ? draft.icon : DEFAULT_ICON_KEY,
    status: draft.status,
    sortOrder: draft.sortOrder,
    updatedAt: Date.now(),
  };
  if (options.includePermissions !== false) payload.permissions = draft.permissions;
  await update(ref(db, `roles/${roleId}`), payload);
}

export async function deleteRole(roleId: string): Promise<void> {
  await remove(ref(db, `roles/${roleId}`));
}

export async function updateRoleStatus(roleId: string, status: RoleStatus): Promise<void> {
  await update(ref(db, `roles/${roleId}`), { status, updatedAt: Date.now() });
}

export async function syncRoleAssignedCount(roleId: string, count: number): Promise<void> {
  await update(ref(db, `roles/${roleId}`), {
    assignedUserCount: Math.max(0, count),
    updatedAt: Date.now(),
  });
}

/** Creates only the missing default roles; existing roles are never overwritten. */
export async function seedDefaultRoles(uid: string): Promise<number> {
  const current = await fetchRoles();
  const existing = new Set(current.map((role) => role.id));
  const seeds = defaultRoleRecords(Date.now(), uid).filter((role) => !existing.has(role.id));
  if (seeds.length === 0) return 0;
  const updates: Record<string, unknown> = {};
  for (const role of seeds) {
    updates[`roles/${role.id}`] = {
      name: role.name,
      description: role.description,
      color: role.color,
      icon: role.icon,
      status: role.status,
      permissions: role.permissions,
      isSystemRole: role.isSystemRole,
      protected: role.protected,
      sortOrder: role.sortOrder,
      assignedUserCount: role.assignedUserCount,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      createdBy: role.createdBy,
    };
  }
  await update(ref(db), updates);
  return seeds.length;
}

export function isMasterRole(role: Pick<RoleRecord, "id"> | null | undefined): boolean {
  return role?.id === MASTER_ROLE_KEY;
}
