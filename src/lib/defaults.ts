import type { CategoryRecord, RoleRecord, ShiftRecord } from "../types";
import { ALL_PERMISSION_IDS, permissionsToMap } from "./permissions";

export const MASTER_ROLE_KEY = "master-admin";
export const LEGACY_ADMIN_ROLE = "admin";
export const LEGACY_USER_ROLE = "user";
export const DEFAULT_ROLE_KEY = "operator";
/** Public self-registration always starts with this least-privilege role. */
export const DEFAULT_REGISTRATION_ROLE_KEY = "viewer";

export const PROTECTED_ROLE_KEYS = new Set([MASTER_ROLE_KEY, LEGACY_ADMIN_ROLE]);
/** Reserved legacy keys: "admin" would be interpreted as master, "user" as operator. */
export const RESERVED_ROLE_KEYS = new Set([MASTER_ROLE_KEY, LEGACY_ADMIN_ROLE, LEGACY_USER_ROLE]);

export function isMasterRoleKey(roleKey: string | null | undefined): boolean {
  return roleKey === MASTER_ROLE_KEY || roleKey === LEGACY_ADMIN_ROLE;
}

/** Maps a raw profile role to the role definition used by the UI. */
export function effectiveRoleKey(raw: string | null | undefined): string {
  if (raw === LEGACY_ADMIN_ROLE) return MASTER_ROLE_KEY;
  if (raw === LEGACY_USER_ROLE) return DEFAULT_ROLE_KEY;
  return raw || DEFAULT_ROLE_KEY;
}

interface DefaultRoleSeed {
  key: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  permissions: string[];
  protected?: boolean;
  isSystemRole?: boolean;
}

const DEFAULT_ROLE_SEEDS: DefaultRoleSeed[] = [
  {
    key: MASTER_ROLE_KEY,
    name: "Master Admin",
    description: "সর্বোচ্চ প্রশাসনিক কর্তৃত্ব; protected system role.",
    color: "#7c3aed",
    icon: "shield-check",
    permissions: ALL_PERMISSION_IDS,
    protected: true,
    isSystemRole: true,
  },
  {
    key: "admin-standard",
    name: "Admin",
    description: "দৈনন্দিন প্রশাসনিক কাজ পরিচালনা করে; Master role তৈরি/মুছতে পারে না।",
    color: "#2563eb",
    icon: "shield",
    permissions: [
      "dashboard.view",
      "users.view",
      "users.create",
      "users.edit",
      "users.assignRole",
      "users.disable",
      "roles.view",
      "categories.view",
      "categories.create",
      "categories.edit",
      "categories.manageAppearance",
      "categories.delete",
      "shifts.view",
      "shifts.create",
      "shifts.edit",
      "shifts.manageAppearance",
      "shifts.delete",
      "lists.view",
      "lists.create",
      "lists.editOwn",
      "lists.editAny",
      "lists.deleteOwn",
      "lists.deleteAny",
      "lists.export",
      "lists.manage",
      "quality.view",
      "audit.view",
      "settings.view",
      "settings.edit",
    ],
  },
  {
    key: "manager",
    name: "Manager",
    description: "তালিকা ও দৈনিক কার্যক্রম তদারকি করে।",
    color: "#0d9488",
    icon: "clipboard-list",
    permissions: [
      "dashboard.view",
      "users.view",
      "categories.view",
      "shifts.view",
      "lists.view",
      "lists.create",
      "lists.editOwn",
      "lists.editAny",
      "lists.deleteOwn",
      "lists.export",
      "lists.manage",
      "audit.view",
      "settings.view",
    ],
  },
  {
    key: "quality-checker",
    name: "Quality Checker",
    description: "কোয়ালিটি রিভিউ সম্পর্কিত অনুমতি রাখে (workflow প্রযোজ্য হলে)।",
    color: "#ea580c",
    icon: "badge-check",
    permissions: [
      "dashboard.view",
      "lists.view",
      "lists.export",
      "quality.view",
      "quality.review",
      "quality.approve",
      "quality.reject",
      "categories.view",
      "shifts.view",
    ],
  },
  {
    key: DEFAULT_ROLE_KEY,
    name: "Operator",
    description: "নিজের তালিকা তৈরি ও সম্পাদনা করে।",
    color: "#16a34a",
    icon: "hard-hat",
    permissions: [
      "lists.view",
      "lists.create",
      "lists.editOwn",
      "lists.deleteOwn",
      "lists.export",
      "categories.view",
      "shifts.view",
    ],
  },
  {
    key: "editor",
    name: "Editor",
    description: "তালিকা ও কোড সম্পাদনা করে, অন্য তালিকাও সংশোধন করতে পারে।",
    color: "#0891b2",
    icon: "pencil",
    permissions: [
      "lists.view",
      "lists.create",
      "lists.editOwn",
      "lists.editAny",
      "lists.deleteOwn",
      "lists.export",
      "categories.view",
      "shifts.view",
    ],
  },
  {
    key: "viewer",
    name: "Viewer",
    description: "শুধু তালিকা, ক্যাটাগরি ও শিফট দেখতে পারে।",
    color: "#64748b",
    icon: "eye",
    permissions: ["lists.view", "categories.view", "shifts.view"],
  },
  {
    key: "visitor",
    name: "Visitor",
    description: "প্রাথমিকভাবে কোনো ব্যবসায়িক অনুমতি নেই; প্রয়োজনে সম্পাদনা করুন।",
    color: "#94a3b8",
    icon: "user-round",
    permissions: [],
  },
];

interface DefaultShiftSeed {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  color: string;
  icon: string;
}

const DEFAULT_SHIFT_SEEDS: DefaultShiftSeed[] = [
  {
    id: "day",
    name: "দিন",
    description: "দিনের শিফট (সকাল ৬টা – সন্ধ্যা ৬টা)।",
    startTime: "06:00",
    endTime: "18:00",
    color: "#d97706",
    icon: "sun",
  },
  {
    id: "night",
    name: "রাত",
    description: "রাতের শিফট (সন্ধ্যা ৬টা – সকাল ৬টা)।",
    startTime: "18:00",
    endTime: "06:00",
    color: "#2563eb",
    icon: "moon",
  },
];

export function defaultShiftRecords(now = Date.now(), createdBy = "system"): ShiftRecord[] {
  return DEFAULT_SHIFT_SEEDS.map((seed, index) => ({
    id: seed.id,
    name: seed.name,
    description: seed.description,
    startTime: seed.startTime,
    endTime: seed.endTime,
    color: seed.color,
    icon: seed.icon,
    status: "active",
    sortOrder: index,
    createdAt: now,
    updatedAt: now,
    createdBy,
  }));
}

export function defaultRoleRecords(now = Date.now(), createdBy = "system"): RoleRecord[] {
  return DEFAULT_ROLE_SEEDS.map((seed, index) => ({
    id: seed.key,
    name: seed.name,
    description: seed.description,
    color: seed.color,
    icon: seed.icon,
    status: "active",
    permissions: permissionsToMap(seed.permissions),
    isSystemRole: seed.isSystemRole === true,
    protected: seed.protected === true,
    sortOrder: index,
    assignedUserCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy,
  }));
}

interface DefaultCategorySeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

const DEFAULT_CATEGORY_SEEDS: DefaultCategorySeed[] = [
  {
    id: "blasting",
    name: "Blasting",
    slug: "blasting",
    description: "Blasting উৎপাদন কোড।",
    color: "#dc2626",
    icon: "flame",
  },
  {
    id: "import",
    name: "Import",
    slug: "import",
    description: "ইমপোর্ট সংক্রান্ত কোড।",
    color: "#2563eb",
    icon: "arrow-down-to-line",
  },
  {
    id: "damaged",
    name: "Damaged",
    slug: "damaged",
    description: "ড্যামেজ/ত্রুটিপূর্ণ আইটেমের কোড।",
    color: "#d97706",
    icon: "triangle-alert",
  },
  {
    id: "return",
    name: "Return",
    slug: "return",
    description: "রিটার্ন/ফেরত কোড।",
    color: "#16a34a",
    icon: "rotate-ccw",
  },
];

export function defaultCategoryRecords(now = Date.now(), createdBy = "system"): CategoryRecord[] {
  return DEFAULT_CATEGORY_SEEDS.map((seed, index) => ({
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    color: seed.color,
    icon: seed.icon,
    status: "active",
    sortOrder: index,
    createdAt: now,
    updatedAt: now,
    createdBy,
  }));
}
