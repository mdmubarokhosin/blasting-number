import type {
  ActivityLog,
  BlastingList,
  CategoryRecord,
  ListItem,
  RoleRecord,
  ShiftRecord,
  UserProfile,
} from "../src/types";

export function makeItem(overrides: Partial<ListItem> = {}): ListItem {
  return {
    id: "item-1",
    category: "Blasting",
    code: "A1-L12-BM-1011",
    createdBy: "user-1",
    createdByName: "রাকিব",
    createdAt: 1_000,
    updatedAt: null,
    ...overrides,
  };
}

export function makeList(overrides: Partial<BlastingList> = {}): BlastingList {
  const item = makeItem();
  return {
    id: "list-1",
    date: "2026-10-19",
    shift: "day",
    ownerId: "user-1",
    ownerName: "রাকিব",
    note: "",
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
    items: overrides.items ?? { [item.id]: item },
  };
}

export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: "user-1",
    email: "user@example.com",
    displayName: "রাকিব",
    role: "user",
    active: true,
    createdAt: 1_000,
    lastLogin: null,
    ...overrides,
  };
}

export function makeLog(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: "log-1",
    action: "login",
    details: "লগইন করেছেন",
    actorUid: "user-1",
    actorName: "রাকিব",
    timestamp: 1_000,
    ...overrides,
  };
}

export function makeShift(overrides: Partial<ShiftRecord> = {}): ShiftRecord {
  return {
    id: "day",
    name: "দিন",
    description: "দিনের শিফট",
    startTime: "06:00",
    endTime: "18:00",
    color: "#d97706",
    icon: "sun",
    status: "active",
    sortOrder: 0,
    createdAt: 1_000,
    updatedAt: 1_000,
    createdBy: "system",
    ...overrides,
  };
}

export function makeRole(overrides: Partial<RoleRecord> = {}): RoleRecord {
  return {
    id: "operator",
    name: "Operator",
    description: "নিজের তালিকা তৈরি ও সম্পাদনা করে।",
    color: "#16a34a",
    icon: "hard-hat",
    status: "active",
    permissions: {
      lists_view: true,
      lists_create: true,
      lists_editOwn: true,
      lists_deleteOwn: true,
      lists_export: true,
      categories_view: true,
    },
    isSystemRole: false,
    protected: false,
    sortOrder: 4,
    assignedUserCount: 0,
    createdAt: 1_000,
    updatedAt: 1_000,
    createdBy: "system",
    ...overrides,
  };
}

export function makeCategory(
  overrides: Partial<CategoryRecord> = {},
): CategoryRecord {
  return {
    id: "blasting",
    name: "Blasting",
    slug: "blasting",
    description: "Blasting উৎপাদন কোড।",
    color: "#dc2626",
    icon: "flame",
    status: "active",
    sortOrder: 0,
    createdAt: 1_000,
    updatedAt: 1_000,
    createdBy: "system",
    ...overrides,
  };
}
