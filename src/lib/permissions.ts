import type { RoleRecord } from "../types";

export interface PermissionDefinition {
  id: string;
  /** Safe RTDB key (dots are not allowed in Firebase keys). */
  key: string;
  module: string;
  moduleLabel: string;
  label: string;
  description: string;
  dependencies: string[];
  /** High-risk permission that can only belong to the protected master role. */
  protected?: boolean;
}

const def = (
  id: string,
  module: string,
  moduleLabel: string,
  label: string,
  description: string,
  dependencies: string[] = [],
  protectedPermission = false,
): PermissionDefinition => ({
  id,
  key: id.replace(/\./g, "_"),
  module,
  moduleLabel,
  label,
  description,
  dependencies,
  protected: protectedPermission,
});

export const PERMISSIONS: PermissionDefinition[] = [
  def("dashboard.view", "dashboard", "ড্যাশবোর্ড", "ড্যাশবোর্ড দেখা", "সংক্ষিপ্ত পরিসংখ্যান ও চার্ট দেখা"),
  def("users.view", "users", "ইউজার", "ইউজার দেখা", "ব্যবহারকারীর তালিকা ও প্রোফাইল দেখা"),
  def("users.create", "users", "ইউজার", "ইউজার তৈরি", "নতুন ব্যবহারকারী অ্যাকাউন্ট তৈরি", ["users.view"]),
  def("users.edit", "users", "ইউজার", "ইউজার সম্পাদনা", "নাম ও অ্যাকাউন্ট তথ্য সম্পাদনা", ["users.view"]),
  def("users.assignRole", "users", "ইউজার", "রোল assign", "ব্যবহারকারীকে রোল দেওয়া বা প্রত্যাহার", ["users.view"]),
  def("users.disable", "users", "ইউজার", "অ্যাকাউন্ট নিষ্ক্রিয়/সক্রিয়", "অ্যাকাউন্ট চালু বা বন্ধ করা", ["users.view"]),
  def("roles.view", "roles", "রোল ও অনুমতি", "রোল দেখা", "রোল তালিকা ও পারমিশন ম্যাট্রিক্স দেখা"),
  def("roles.create", "roles", "রোল ও অনুমতি", "রোল তৈরি", "নতুন কাস্টম রোল তৈরি", ["roles.view"]),
  def("roles.edit", "roles", "রোল ও অনুমতি", "রোল সম্পাদনা", "রোলের নাম, রঙ ও অনুমতি পরিবর্তন", ["roles.view"]),
  def("roles.delete", "roles", "রোল ও অনুমতি", "রোল মুছে ফেলা", "অব্যবহৃত কাস্টম রোল মুছে ফেলা", ["roles.view"]),
  def(
    "roles.assignMaster",
    "roles",
    "রোল ও অনুমতি",
    "Master Admin নিয়োগ",
    "অন্য ব্যবহারকারীকে Master Admin করা (শুধু protected master)",
    ["roles.view"],
    true,
  ),
  def("categories.view", "categories", "ক্যাটাগরি", "ক্যাটাগরি দেখা", "ক্যাটাগরি তালিকা ও বিবরণ দেখা"),
  def("categories.create", "categories", "ক্যাটাগরি", "ক্যাটাগরি তৈরি", "নতুন ক্যাটাগরি তৈরি", ["categories.view"]),
  def("categories.edit", "categories", "ক্যাটাগরি", "ক্যাটাগরি সম্পাদনা", "নাম, বিবরণ, স্ট্যাটাস ও ক্রম পরিবর্তন", ["categories.view"]),
  def(
    "categories.manageAppearance",
    "categories",
    "ক্যাটাগরি",
    "রঙ ও আইকন নিয়ন্ত্রণ",
    "ক্যাটাগরির রঙ, আইকন ও ভিজ্যুয়াল পরিবর্তন",
    ["categories.edit"],
  ),
  def("categories.delete", "categories", "ক্যাটাগরি", "ক্যাটাগরি মুছে ফেলা", "অব্যবহৃত ক্যাটাগরি মুছে ফেলা", ["categories.view"]),
  def("shifts.view", "shifts", "শিফট", "শিফট দেখা", "শিফট তালিকা ও সময়সূচি দেখা"),
  def("shifts.create", "shifts", "শিফট", "শিফট তৈরি", "নতুন শিফট তৈরি", ["shifts.view"]),
  def("shifts.edit", "shifts", "শিফট", "শিফট সম্পাদনা", "নাম, সময়, স্ট্যাটাস ও ক্রম পরিবর্তন", ["shifts.view"]),
  def(
    "shifts.manageAppearance",
    "shifts",
    "শিফট",
    "শিফটের রঙ ও আইকন",
    "শিফটের রঙ, আইকন ও ভিজ্যুয়াল পরিবর্তন",
    ["shifts.edit"],
  ),
  def("shifts.delete", "shifts", "শিফট", "শিফট মুছে ফেলা", "অব্যবহৃত শিফট মুছে ফেলা", ["shifts.view"]),
  def("lists.view", "lists", "তালিকা", "তালিকা দেখা", "সব তালিকা ও কোড দেখা"),
  def("lists.create", "lists", "তালিকা", "তালিকা তৈরি", "নতুন তালিকা তৈরি", ["lists.view"]),
  def("lists.editOwn", "lists", "তালিকা", "নিজের তালিকা সম্পাদনা", "নিজের তালিকা ও কোড সম্পাদনা", ["lists.view"]),
  def("lists.editAny", "lists", "তালিকা", "যেকোনো তালিকা সম্পাদনা", "অন্যের তালিকাও সম্পাদনা", ["lists.view"]),
  def("lists.deleteOwn", "lists", "তালিকা", "নিজের তালিকা মুছে ফেলা", "নিজের তালিকা মুছে ফেলা", ["lists.view"]),
  def("lists.deleteAny", "lists", "তালিকা", "যেকোনো তালিকা মুছে ফেলা", "অন্যের তালিকাও মুছে ফেলা", ["lists.view"]),
  def("lists.export", "lists", "তালিকা", "এক্সপোর্ট", "PDF, CSV ও শেয়ার", ["lists.view"]),
  def("lists.manage", "lists", "তালিকা", "তালিকা ব্যবস্থাপনা", "অ্যাডমিন তালিকা ম্যানেজমেন্ট পেজ", ["lists.view", "lists.deleteAny"]),
  def("quality.view", "quality", "কোয়ালিটি", "কোয়ালিটি দেখা", "কোয়ালিটি রিভিউ তালিকা দেখা"),
  def("quality.review", "quality", "কোয়ালিটি", "রিভিউ করা", "রেকর্ড পর্যালোচনা", ["quality.view"]),
  def("quality.approve", "quality", "কোয়ালিটি", "অনুমোদন", "রেকর্ড অনুমোদন", ["quality.view"]),
  def("quality.reject", "quality", "কোয়ালিটি", "প্রত্যাখ্যান", "রেকর্ড প্রত্যাখ্যান", ["quality.view"]),
  def("audit.view", "audit", "অডিট", "অডিট লগ দেখা", "প্রশাসনিক কার্যক্রমের লগ"),
  def("audit.clear", "audit", "অডিট", "অডিট লগ মুছে ফেলা", "সব লগ স্থায়ীভাবে মুছে ফেলা", ["audit.view"], true),
  def("settings.view", "settings", "সেটিংস", "সেটিংস দেখা", "অ্যাপ সেটিংস ও ফিচার দেখা"),
  def("settings.edit", "settings", "সেটিংস", "সেটিংস সম্পাদনা", "ব্র্যান্ডিং ও ফিচার পরিবর্তন", ["settings.view"]),
];

export const PERMISSION_BY_ID = new Map(PERMISSIONS.map((p) => [p.id, p]));
export const PERMISSION_BY_KEY = new Map(PERMISSIONS.map((p) => [p.key, p]));
export const ALL_PERMISSION_IDS = PERMISSIONS.map((p) => p.id);
export const PERMISSION_MODULES = [...new Set(PERMISSIONS.map((p) => p.module))];

export function moduleLabel(module: string): string {
  return PERMISSIONS.find((p) => p.module === module)?.moduleLabel ?? module;
}

export function permissionsToIds(permissions: Record<string, unknown> | undefined): string[] {
  if (!permissions) return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(permissions)) {
    if (value === true && PERMISSION_BY_KEY.has(key)) {
      out.push(PERMISSION_BY_KEY.get(key)!.id);
    }
  }
  return out;
}

export function permissionsToMap(ids: string[]): Record<string, true> {
  const map: Record<string, true> = {};
  for (const id of ids) {
    const permission = PERMISSION_BY_ID.get(id);
    if (permission) map[permission.key] = true;
  }
  return map;
}

/** Adds required dependencies (e.g. users.edit requires users.view). */
export function normalizePermissionIds(ids: string[], allowProtected = false): string[] {
  const selected = new Set<string>();
  const visit = (id: string) => {
    const permission = PERMISSION_BY_ID.get(id);
    if (!permission) return;
    if (permission.protected && !allowProtected) return;
    if (selected.has(id)) return;
    selected.add(id);
    for (const dependency of permission.dependencies) visit(dependency);
  };
  for (const id of ids) visit(id);
  return ALL_PERMISSION_IDS.filter((id) => selected.has(id));
}

/**
 * Removes a permission and every permission that depends on it (transitively).
 * Used when an admin unchecks a parent permission in the matrix.
 */
export function removePermissionWithDependents(ids: string[], id: string): string[] {
  const removed = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const permission of PERMISSIONS) {
      if (removed.has(permission.id)) continue;
      if (permission.dependencies.some((dependency) => removed.has(dependency))) {
        removed.add(permission.id);
        changed = true;
      }
    }
  }
  return ids.filter((permissionId) => !removed.has(permissionId));
}

export function rolePermissionIds(role: RoleRecord | null | undefined): string[] {
  if (!role) return [];
  return permissionsToIds(role.permissions);
}

export function hasRolePermission(
  role: RoleRecord | null | undefined,
  permissionId: string,
  isMaster = false,
): boolean {
  if (isMaster) return true;
  if (!role || role.status !== "active") return false;
  const permission = PERMISSION_BY_ID.get(permissionId);
  if (!permission) return false;
  if (permission.protected) return false;
  return role.permissions[permission.key] === true;
}

/**
 * Permissions that make the admin panel relevant. A role that only has
 * list/self-service permissions does not get an admin entry.
 */
const ADMIN_ENTRY_PERMISSIONS = [
  "dashboard.view",
  "users.view",
  "roles.view",
  "categories.create",
  "categories.edit",
  "categories.delete",
  "categories.manageAppearance",
  "shifts.create",
  "shifts.edit",
  "shifts.manageAppearance",
  "shifts.delete",
  "lists.manage",
  "quality.view",
  "audit.view",
  "audit.clear",
  "settings.view",
  "settings.edit",
];

export function isStaffPermissionSet(permissionIds: string[]): boolean {
  return permissionIds.some((id) => ADMIN_ENTRY_PERMISSIONS.includes(id));
}
