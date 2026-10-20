/** Stable, database-driven shift id. Legacy "day"/"night" ids remain supported. */
export type ShiftId = string;

/** Backward-compatible alias used by list records and forms. */
export type Shift = ShiftId;

/**
 * Role keys are dynamic and come from `/roles/{roleKey}`. The legacy values
 * "admin" and "user" are still accepted so existing data keeps working:
 * - "admin" → treated as the protected master-admin role
 * - "user"  → treated as the seeded "operator" role (or a safe legacy fallback)
 */
export type Role = string;

/** Stable, database-driven category id (e.g. "blasting"). Not a display name. */
export type CategoryId = string;

/** Legacy category display name / id. Kept as a string for old records. */
export type Category = string;

export type RoleStatus = "active" | "inactive";
export type CategoryStatus = "active" | "inactive";
export type ShiftStatus = "active" | "inactive";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  /** Raw role key from Firebase. Use AuthProvider's effective role key. */
  role: Role;
  active: boolean;
  /** epoch ms */
  createdAt: number;
  /** epoch ms | null */
  lastLogin: number | null;
}

export interface RoleRecord {
  id: Role;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: RoleStatus;
  /** Permission safe-keys → true (e.g. { users_view: true }). */
  permissions: Record<string, true>;
  isSystemRole: boolean;
  protected: boolean;
  sortOrder: number;
  assignedUserCount: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface CategoryRecord {
  id: CategoryId;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  status: CategoryStatus;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface ShiftRecord {
  id: ShiftId;
  name: string;
  description: string;
  /** HH:mm; empty when the shift has no fixed window. */
  startTime: string;
  /** HH:mm; empty when the shift has no fixed window. */
  endTime: string;
  color: string;
  icon: string;
  status: ShiftStatus;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface ListItem {
  id: string;
  /** Stable category id for new/migrated items. */
  categoryId?: CategoryId;
  /** Legacy display name snapshot retained for backward compatibility. */
  category: Category;
  code: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number | null;
}

export interface ListMeta {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  shift: Shift;
  ownerId: string;
  ownerName: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface BlastingList extends ListMeta {
  items: Record<string, ListItem>;
}

export type ActivityAction =
  | "login"
  | "logout"
  | "list_create"
  | "list_update"
  | "list_delete"
  | "item_add"
  | "item_edit"
  | "item_delete"
  | "user_create"
  | "user_edit"
  | "user_status_change"
  | "user_role_assign"
  | "role_change"
  | "role_create"
  | "role_update"
  | "role_delete"
  | "role_seed"
  | "category_create"
  | "category_update"
  | "category_delete"
  | "category_migrate"
  | "category_seed"
  | "shift_create"
  | "shift_update"
  | "shift_delete"
  | "shift_seed"
  | "status_change"
  | "settings_change"
  | "language_create"
  | "language_update"
  | "language_delete"
  | "language_default"
  | "translation_update"
  | "export_pdf"
  | "export_csv"
  | "audit_clear";

export interface ActivityLog {
  id: string;
  action: ActivityAction | string;
  details: string;
  actorUid: string;
  actorName: string;
  timestamp: number;
  targetType?: string;
  targetId?: string;
  actorRole?: string;
  outcome?: "success" | "failure";
}

export interface AppSettings {
  brandName: string;
  /** Absolute http(s) URL or a same-origin path beginning with "/". */
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  features: {
    pdfExport: boolean;
    csvExport: boolean;
    ocrScanner: boolean;
    whatsappShare: boolean;
  };
  updatedAt: number | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  brandName: "Blasting Number",
  logoUrl: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  features: {
    pdfExport: true,
    csvExport: true,
    ocrScanner: true,
    whatsappShare: true,
  },
  updatedAt: null,
};

export type LanguageStatus = "active" | "inactive";
export type TextDirection = "ltr" | "rtl";

export interface LanguageRecord {
  /** Stable language code used as the database key and translation index. */
  id: string;
  code: string;
  name: string;
  nativeName: string;
  direction: TextDirection;
  status: LanguageStatus;
  isDefault: boolean;
  sortOrder: number;
  protected: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface WebsiteContentField {
  key: string;
  label: string;
  labelBn?: string;
  group: string;
  multiline?: boolean;
  en: string;
  bn: string;
}

export type TranslationValues = Record<string, Record<string, string>>;

export function isShift(v: unknown): v is Shift {
  return typeof v === "string" && v.length > 0 && v.length <= 64 && /^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(v);
}

export function isShiftStatus(v: unknown): v is ShiftStatus {
  return v === "active" || v === "inactive";
}

export function isRoleStatus(v: unknown): v is RoleStatus {
  return v === "active" || v === "inactive";
}

export function isCategoryStatus(v: unknown): v is CategoryStatus {
  return v === "active" || v === "inactive";
}
