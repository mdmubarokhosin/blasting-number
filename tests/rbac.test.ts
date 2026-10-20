import { describe, expect, it } from "vitest";
import { resolvePermissions } from "../src/features/auth/AuthProvider";
import {
  ALL_PERMISSION_IDS,
  PERMISSION_BY_ID,
  hasRolePermission,
  normalizePermissionIds,
  permissionsToIds,
  permissionsToMap,
  removePermissionWithDependents,
} from "../src/lib/permissions";
import { effectiveRoleKey, isMasterRoleKey } from "../src/lib/defaults";
import { coerceCategory } from "../src/services/categories";
import { coerceRole } from "../src/services/roles";
import {
  findCategory,
  isLegacyCategory,
  itemCategoryFields,
  legacyCategory,
  resolveItemCategory,
} from "../src/utils/categories";
import { normalizeHex } from "../src/utils/colors";
import { resolveProfileRole, syntheticRole } from "../src/utils/roles";
import { makeCategory, makeItem, makeProfile, makeRole } from "./factories";

describe("permission helpers", () => {
  it("maps dots to database-safe keys and back", () => {
    const ids = ["users.view", "users.edit", "lists.editOwn"];
    const map = permissionsToMap(ids);
    expect(map).toEqual({ users_view: true, users_edit: true, lists_editOwn: true });
    expect(permissionsToIds(map)).toEqual(ids);
    expect(permissionsToIds({ unknown_key: true })).toEqual([]);
  });

  it("adds dependencies and removes dependents", () => {
    expect(normalizePermissionIds(["users.edit"])).toEqual(["users.view", "users.edit"]);
    expect(removePermissionWithDependents(["users.view", "users.create", "users.edit"], "users.view")).toEqual([]);
    expect(removePermissionWithDependents(["users.view", "users.create", "lists.view"], "lists.view")).toEqual(["users.view", "users.create"]);
  });

  it("never allows protected permissions outside the master role", () => {
    expect(normalizePermissionIds(["roles.assignMaster", "audit.clear"])).toEqual([]);
    expect(normalizePermissionIds(["roles.assignMaster"], true)).toContain("roles.assignMaster");
    expect(PERMISSION_BY_ID.get("roles.assignMaster")?.protected).toBe(true);
    expect(ALL_PERMISSION_IDS).toContain("audit.clear");
  });

  it("checks active role permissions and protects master-only ids", () => {
    const role = makeRole();
    expect(hasRolePermission(role, "lists.editOwn")).toBe(true);
    expect(hasRolePermission({ ...role, status: "inactive" }, "lists.editOwn")).toBe(false);
    expect(hasRolePermission(role, "audit.clear")).toBe(false);
    expect(hasRolePermission(role, "audit.clear", true)).toBe(true);
  });
});

describe("role resolution", () => {
  const operator = makeRole();
  const inactive = makeRole({ id: "viewer", status: "inactive", permissions: {} });

  it("maps legacy keys", () => {
    expect(effectiveRoleKey("admin")).toBe("master-admin");
    expect(effectiveRoleKey("user")).toBe("operator");
    expect(isMasterRoleKey("admin")).toBe(true);
    expect(isMasterRoleKey("admin-standard")).toBe(false);
  });

  it("gives masters every permission", () => {
    const result = resolvePermissions({ rawRole: "admin", roles: [operator] });
    expect(result.master).toBe(true);
    expect(result.permissionIds).toEqual(ALL_PERMISSION_IDS);
  });

  it("resolves an active database role", () => {
    const result = resolvePermissions({ rawRole: "operator", roles: [operator] });
    expect(result.role?.id).toBe("operator");
    expect(result.permissionIds).toContain("lists.create");
  });

  it("denies an inactive role and unrelated unknown role", () => {
    const viewer = resolvePermissions({ rawRole: "viewer", roles: [inactive] });
    expect(viewer.permissionIds).toEqual([]);
    const unknown = resolvePermissions({ rawRole: "ghost", roles: [operator] });
    expect(unknown.permissionIds).toEqual([]);
  });

  it("does not grant implicit legacy permissions when the operator role is missing", () => {
    const legacy = resolvePermissions({ rawRole: "user", roles: [] });
    expect(legacy.permissionIds).toEqual([]);
    expect(legacy.role).toBeNull();
    const waiting = resolvePermissions({ rawRole: "user", roles: [] });
    expect(waiting.permissionIds).toEqual([]);
  });

  it("resolves synthetic and database profile roles", () => {
    expect(resolveProfileRole(makeProfile({ role: "admin" }), []).protected).toBe(true);
    expect(resolveProfileRole(makeProfile({ role: "operator" }), [operator]).name).toBe("Operator");
    expect(syntheticRole("ghost").name).toBe("ghost");
  });
});

describe("category resolution", () => {
  const categories = [makeCategory(), makeCategory({ id: "import", name: "Import", slug: "import", sortOrder: 1 })];

  it("finds by id, slug or name case-insensitively", () => {
    expect(findCategory(categories, "BLASTING")?.id).toBe("blasting");
    expect(findCategory(categories, "import")?.name).toBe("Import");
    expect(findCategory(categories, "missing")).toBeNull();
    expect(findCategory(categories, null)).toBeNull();
  });

  it("prefers categoryId and falls back to the legacy name", () => {
    expect(resolveItemCategory(makeItem({ categoryId: "import", category: "Blasting" }), categories).id).toBe("import");
    expect(resolveItemCategory(makeItem({ categoryId: "gone", category: "Import" }), categories).id).toBe("import");
    expect(resolveItemCategory(makeItem({ categoryId: undefined, category: "Removed" }), categories).id).toBe("legacy:removed");
  });

  it("builds an inactive synthetic legacy category", () => {
    const legacy = legacyCategory("Old");
    expect(legacy.id).toBe("legacy:old");
    expect(legacy.status).toBe("inactive");
    expect(isLegacyCategory(legacy)).toBe(true);
    expect(isLegacyCategory(categories[0])).toBe(false);
    expect(itemCategoryFields(legacy, "A-1")).toEqual({
      categoryName: "Old",
      code: "A-1",
    });
    expect(itemCategoryFields(categories[0], "A-1")).toEqual({
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      code: "A-1",
    });
  });
});

describe("record coercion", () => {
  it("normalizes malformed role records", () => {
    const role = coerceRole("custom", {
      name: "Custom",
      status: "bogus",
      color: "#ABC",
      icon: "not-real",
      permissions: { lists_view: true, broken: false },
      sortOrder: "2",
    });
    expect(role?.status).toBe("active");
    expect(role?.color).toBe("#aabbcc");
    expect(role?.permissions).toEqual({ lists_view: true });
    expect(role?.icon).toBe("tag");
    expect(role?.sortOrder).toBe(999);
  });

  it("normalizes malformed category records", () => {
    const category = coerceCategory("custom", {
      name: "Custom",
      color: "red",
      icon: "not-real",
      status: "off",
    });
    expect(category?.status).toBe("active");
    expect(category?.color).toBe("#64748b");
    expect(category?.slug).toBe("custom");
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
  });
});
