import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, remove, set, update } from "firebase/database";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

/**
 * Realtime Database rules tests for the dynamic RBAC model.
 * Run locally with: npm run test:rules
 * No real Firebase project is contacted.
 */

let testEnv: RulesTestEnvironment;

const RULES = readFileSync(
  fileURLToPath(new URL("../../firebase/database.rules.json", import.meta.url)),
  "utf8",
);

const NOW = 1_700_000_000_000;

function permissionMap(keys: string[]): Record<string, true> {
  return Object.fromEntries(keys.map((key) => [key, true] as const));
}

function role(
  id: string,
  keys: string[],
  options: {
    status?: "active" | "inactive";
    protected?: boolean;
    system?: boolean;
  } = {},
) {
  return {
    name: id,
    description: `${id} role`,
    color: "#2563eb",
    icon: "shield",
    status: options.status ?? "active",
    permissions: permissionMap(keys),
    isSystemRole: options.system ?? false,
    protected: options.protected ?? false,
    sortOrder: 1,
    assignedUserCount: 0,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "system",
  };
}

function profile(uid: string, email: string, roleKey: string, active = true) {
  return {
    uid,
    email,
    displayName: `User ${uid}`,
    role: roleKey,
    active,
    createdAt: NOW,
    lastLogin: NOW,
    updatedAt: NOW,
  };
}

function list(ownerId: string, ownerName: string) {
  return {
    date: "2026-10-19",
    shift: "day",
    ownerId,
    ownerName,
    note: "test",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function item(createdBy: string, categoryId?: string, category = "Blasting") {
  return {
    ...(categoryId ? { categoryId } : {}),
    category,
    code: "A1-L12-BM-1011",
    createdBy,
    createdByName: `User ${createdBy}`,
    createdAt: NOW,
    updatedAt: null,
  };
}

function category(id: string, status: "active" | "inactive" = "active") {
  return {
    name: id,
    slug: id,
    description: `${id} category`,
    color: "#2563eb",
    icon: "tag",
    status,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "system",
  };
}

function shift(id: string, status: "active" | "inactive" = "active") {
  return {
    name: id,
    description: `${id} shift`,
    startTime: "06:00",
    endTime: "18:00",
    color: "#2563eb",
    icon: "clock",
    status,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "system",
  };
}

function language(
  code: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    code,
    name: code === "en" ? "English" : "Bengali",
    nativeName: code === "en" ? "English" : "বাংলা",
    direction: "ltr",
    status: "active",
    isDefault: code === "en",
    sortOrder: code === "en" ? 0 : 1,
    protected: true,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "system",
    ...overrides,
  };
}

function logEntry(actorUid: string) {
  return {
    action: "login",
    details: "লগইন করেছেন",
    actorUid,
    actorName: `User ${actorUid}`,
    timestamp: NOW,
  };
}

function dbFor(uid: string, email = `${uid}@example.com`) {
  return testEnv.authenticatedContext(uid, { email }).database();
}

const OPERATOR_PERMISSIONS = [
  "lists_view",
  "lists_create",
  "lists_editOwn",
  "lists_deleteOwn",
  "lists_export",
  "categories_view",
  "shifts_view",
];

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-blasting-rules",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: RULES,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    const roles: Record<string, unknown> = {
      "master-admin": role("master-admin", [], {
        protected: true,
        system: true,
      }),
      "admin-standard": role("admin-standard", [
        "dashboard_view",
        "users_view",
        "users_create",
        "users_edit",
        "users_assignRole",
        "users_disable",
        "roles_view",
        "categories_view",
        "categories_create",
        "categories_edit",
        "categories_manageAppearance",
        "categories_delete",
        "lists_view",
        "lists_create",
        "lists_editOwn",
        "lists_editAny",
        "lists_deleteOwn",
        "lists_deleteAny",
        "lists_export",
        "lists_manage",
        "audit_view",
        "settings_view",
        "settings_edit",
      ]),
      manager: role("manager", [
        "dashboard_view",
        "users_view",
        "categories_view",
        "lists_view",
        "lists_editAny",
        "lists_deleteAny",
        "lists_manage",
        "audit_view",
        "settings_view",
      ]),
      operator: role("operator", OPERATOR_PERMISSIONS),
      viewer: role("viewer", ["lists_view", "categories_view", "shifts_view"]),
      shiftman: role("shiftman", [
        "shifts_view",
        "shifts_create",
        "shifts_edit",
        "shifts_manageAppearance",
        "shifts_delete",
      ]),
      hr: role("hr", [
        "users_view",
        "users_create",
        "users_edit",
        "users_assignRole",
        "users_disable",
      ]),
      catman: role("catman", [
        "categories_view",
        "categories_create",
        "categories_edit",
        "categories_delete",
      ]),
      "inactive-role": role("inactive-role", ["lists_view"], {
        status: "inactive",
      }),
    };
    for (const [id, value] of Object.entries(roles))
      await set(ref(db, `roles/${id}`), value);

    await set(ref(db, "categories/blasting"), category("blasting"));
    await set(ref(db, "categories/import"), category("import"));
    await set(ref(db, "categories/archived"), category("archived", "inactive"));

    await set(ref(db, "shifts/day"), shift("day"));
    await set(ref(db, "shifts/night"), shift("night"));
    await set(ref(db, "shifts/morning"), shift("morning"));
    await set(ref(db, "shifts/evening"), shift("evening", "inactive"));

    await set(
      ref(db, "profiles/alice"),
      profile("alice", "alice@example.com", "user"),
    );
    await set(
      ref(db, "profiles/bob"),
      profile("bob", "bob@example.com", "operator"),
    );
    await set(
      ref(db, "profiles/carol"),
      profile("carol", "carol@example.com", "operator", false),
    );
    await set(
      ref(db, "profiles/admin"),
      profile("admin", "admin@example.com", "admin"),
    );
    await set(
      ref(db, "profiles/master2"),
      profile("master2", "master2@example.com", "master-admin"),
    );
    await set(
      ref(db, "profiles/manager"),
      profile("manager", "manager@example.com", "manager"),
    );
    await set(ref(db, "profiles/hr"), profile("hr", "hr@example.com", "hr"));
    await set(
      ref(db, "profiles/catman"),
      profile("catman", "catman@example.com", "catman"),
    );
    await set(
      ref(db, "profiles/viewer"),
      profile("viewer", "viewer@example.com", "viewer"),
    );
    await set(
      ref(db, "profiles/shiftman"),
      profile("shiftman", "shiftman@example.com", "shiftman"),
    );
    await set(
      ref(db, "profiles/inactiveRole"),
      profile("inactiveRole", "inactiveRole@example.com", "inactive-role"),
    );

    await set(ref(db, "lists/listA"), list("alice", "User alice"));
    await set(ref(db, "lists/listB"), list("bob", "User bob"));
    await set(ref(db, "lists/listA/items/i1"), item("alice"));
    await set(ref(db, "activityLogs/log1"), logEntry("alice"));
    await set(ref(db, "settings/app"), {
      brandName: "Blasting Number",
      features: {
        pdfExport: true,
        csvExport: true,
        ocrScanner: true,
        whatsappShare: true,
      },
      updatedAt: NOW,
    });
    await set(ref(db, "settings/languages/en"), language("en"));
    await set(ref(db, "settings/languages/bn"), language("bn"));
    await set(
      ref(db, "settings/translations/site__title/en"),
      "Blasting Number",
    );
    await set(
      ref(db, "settings/translations/site__title/bn"),
      "ব্লাস্টিং নম্বর",
    );
  });
});

describe("unauthenticated access", () => {
  it("reads only public settings and cannot write", async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(get(ref(db, "lists")));
    await assertFails(get(ref(db, "profiles/alice")));
    await assertFails(get(ref(db, "roles")));
    await assertFails(get(ref(db, "categories")));
    await assertFails(get(ref(db, "shifts")));
    await assertFails(get(ref(db, "activityLogs")));
    await assertSucceeds(get(ref(db, "settings/app")));
    await assertSucceeds(get(ref(db, "settings/languages")));
    await assertSucceeds(get(ref(db, "settings/translations")));
    await assertFails(set(ref(db, "lists/evil"), list("alice", "x")));
    await assertFails(
      set(ref(db, "settings/languages/fr"), language("fr")),
    );
    await assertFails(
      set(ref(db, "settings/translations/site__title/fr"), "x"),
    );
  });
});

describe("profiles and dynamic roles", () => {
  it("user reads own profile but not others or the profile list", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(get(ref(alice, "profiles/alice")));
    await assertFails(get(ref(alice, "profiles/bob")));
    await assertFails(get(ref(alice, "profiles")));
  });

  it("users with users.view can read every profile", async () => {
    const manager = dbFor("manager");
    await assertSucceeds(get(ref(manager, "profiles")));
    await assertSucceeds(get(ref(manager, "profiles/bob")));
  });

  it("new users can self-register only as an active Viewer", async () => {
    const dave = dbFor("dave");
    await assertSucceeds(
      set(
        ref(dave, "profiles/dave"),
        profile("dave", "dave@example.com", "viewer"),
      ),
    );
    const eve = dbFor("eve");
    await assertFails(
      set(ref(eve, "profiles/eve"), profile("eve", "eve@example.com", "user")),
    );
    const frank = dbFor("frank");
    await assertFails(
      set(
        ref(frank, "profiles/frank"),
        profile("frank", "frank@example.com", "operator"),
      ),
    );
    const grace = dbFor("grace");
    await assertFails(
      set(
        ref(grace, "profiles/grace"),
        profile("grace", "grace@example.com", "master-admin"),
      ),
    );
    const heidi = dbFor("heidi");
    await assertFails(
      set(
        ref(heidi, "profiles/heidi"),
        profile("heidi", "heidi@example.com", "viewer", false),
      ),
    );
  });

  it("Viewer can read shared data but cannot write lists", async () => {
    const viewer = dbFor("viewer");
    await assertSucceeds(get(ref(viewer, "lists")));
    await assertSucceeds(get(ref(viewer, "categories")));
    await assertSucceeds(get(ref(viewer, "shifts")));
    await assertFails(
      set(ref(viewer, "lists/viewerList"), list("viewer", "User viewer")),
    );
    await assertFails(
      update(ref(viewer, "profiles/viewer"), { role: "operator" }),
    );
  });

  it("self role/status/uid/email changes are blocked", async () => {
    const alice = dbFor("alice");
    await assertFails(update(ref(alice, "profiles/alice"), { role: "viewer" }));
    await assertFails(update(ref(alice, "profiles/alice"), { active: false }));
    await assertFails(update(ref(alice, "profiles/alice"), { uid: "hacker" }));
    await assertFails(
      update(ref(alice, "profiles/alice"), { email: "other@example.com" }),
    );
    await assertSucceeds(
      update(ref(alice, "profiles/alice"), { displayName: "নতুন নাম" }),
    );
  });

  it("inactive users cannot update their profile or read lists", async () => {
    const carol = dbFor("carol");
    await assertFails(
      update(ref(carol, "profiles/carol"), { displayName: "не" }),
    );
    await assertFails(get(ref(carol, "lists")));
  });

  it("a user whose role is inactive loses permission-based access", async () => {
    const db = dbFor("inactiveRole");
    await assertFails(get(ref(db, "lists")));
    await assertFails(get(ref(db, "categories")));
  });

  it("hr can assign an active role but cannot self-change or assign master", async () => {
    const hr = dbFor("hr");
    await assertSucceeds(update(ref(hr, "profiles/bob"), { role: "viewer" }));
    await assertFails(update(ref(hr, "profiles/hr"), { role: "viewer" }));
    await assertFails(
      update(ref(hr, "profiles/bob"), { role: "master-admin" }),
    );
    await assertFails(
      update(ref(hr, "profiles/bob"), { role: "does-not-exist" }),
    );
    await assertFails(
      update(ref(hr, "profiles/bob"), { role: "inactive-role" }),
    );
  });

  it("hr can disable a normal account but not a master account", async () => {
    const hr = dbFor("hr");
    await assertSucceeds(update(ref(hr, "profiles/bob"), { active: false }));
    await assertFails(update(ref(hr, "profiles/master2"), { active: false }));
    await assertFails(
      update(ref(hr, "profiles/master2"), { role: "operator" }),
    );
  });

  it("manager without assign/edit permissions cannot modify profiles", async () => {
    const manager = dbFor("manager");
    await assertFails(update(ref(manager, "profiles/bob"), { role: "viewer" }));
    await assertFails(
      update(ref(manager, "profiles/bob"), { displayName: "Nope" }),
    );
  });

  it("master can promote and demote other masters but cannot change self", async () => {
    const admin = dbFor("admin");
    await assertSucceeds(
      update(ref(admin, "profiles/bob"), { role: "master-admin" }),
    );
    await assertSucceeds(
      update(ref(admin, "profiles/master2"), { role: "operator" }),
    );
    await assertFails(
      update(ref(admin, "profiles/admin"), { role: "operator" }),
    );
    await assertFails(update(ref(admin, "profiles/admin"), { active: false }));
  });

  it("hr can create a profile for a new auth user with an active role", async () => {
    const hr = dbFor("hr");
    await assertSucceeds(
      set(
        ref(hr, "profiles/newbie"),
        profile("newbie", "newbie@example.com", "viewer"),
      ),
    );
    await assertFails(
      set(
        ref(hr, "profiles/newmaster"),
        profile("newmaster", "newmaster@example.com", "master-admin"),
      ),
    );
  });
});

describe("lists and permissions", () => {
  it("operator creates/updates/deletes own list but not another's", async () => {
    const alice = dbFor("alice");
    const bob = dbFor("bob");
    await assertSucceeds(
      set(ref(alice, "lists/newByAlice"), list("alice", "User alice")),
    );
    await assertFails(set(ref(alice, "lists/forBob"), list("bob", "User bob")));
    await assertSucceeds(update(ref(alice, "lists/listA"), { note: "আপডেট" }));
    await assertFails(update(ref(bob, "lists/listA"), { note: "হ্যাক" }));
    await assertFails(remove(ref(bob, "lists/listA")));
    await assertSucceeds(remove(ref(alice, "lists/listA")));
  });

  it("validates list/date and configured active shifts", async () => {
    const alice = dbFor("alice");
    await assertFails(
      set(ref(alice, "lists/badShift"), {
        ...list("alice", "User alice"),
        shift: "midday",
      }),
    );
    await assertFails(
      set(ref(alice, "lists/inactiveShift"), {
        ...list("alice", "User alice"),
        shift: "evening",
      }),
    );
    await assertSucceeds(
      set(ref(alice, "lists/morningList"), {
        ...list("alice", "User alice"),
        shift: "morning",
      }),
    );
    await assertFails(
      set(ref(alice, "lists/badDate"), {
        ...list("alice", "User alice"),
        date: "19-10-2026",
      }),
    );
  });

  it("keeps legacy day/night lists editable and allows fallback without shift config", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(
      update(ref(alice, "lists/listA"), { note: "legacy still works" }),
    );

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await remove(ref(ctx.database(), "shifts"));
    });
    await assertSucceeds(
      set(ref(alice, "lists/noConfigDay"), {
        ...list("alice", "User alice"),
        shift: "day",
      }),
    );
    await assertFails(
      set(ref(alice, "lists/noConfigCustom"), {
        ...list("alice", "User alice"),
        shift: "morning",
      }),
    );
  });

  it("manager with editAny/deleteAny can manage another user's list", async () => {
    const manager = dbFor("manager");
    await assertSucceeds(
      update(ref(manager, "lists/listB"), { note: "manager edit" }),
    );
    await assertSucceeds(remove(ref(manager, "lists/listB")));
  });

  it("owner can add items with an active categoryId, others cannot", async () => {
    const alice = dbFor("alice");
    const bob = dbFor("bob");
    await assertSucceeds(
      set(
        ref(alice, "lists/listA/items/i2"),
        item("alice", "import", "Import"),
      ),
    );
    await assertFails(
      set(ref(bob, "lists/listA/items/i3"), item("bob", "import", "Import")),
    );
    await assertFails(
      set(
        ref(alice, "lists/listA/items/i4"),
        item("alice", "archived", "Archived"),
      ),
    );
    await assertFails(
      set(
        ref(alice, "lists/listA/items/i5"),
        item("alice", "not-a-category", "Hacked"),
      ),
    );
  });

  it("legacy items without categoryId remain editable", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(
      update(ref(alice, "lists/listA/items/i1"), {
        code: "B2-L3-BM-2022",
        updatedAt: NOW + 1,
      }),
    );
    await assertFails(update(ref(alice, "lists/listA/items/i1"), { code: "" }));
  });

  it("item creator identity cannot be forged and others cannot delete items", async () => {
    const alice = dbFor("alice");
    const bob = dbFor("bob");
    await assertFails(
      set(
        ref(alice, "lists/listA/items/forged"),
        item("someone-else", "blasting"),
      ),
    );
    await assertFails(update(ref(bob), { "lists/listA/items/i1": null }));
    await assertSucceeds(
      update(ref(alice), {
        "lists/listA/items/i1": null,
        "lists/listA/updatedAt": NOW + 1,
      }),
    );
  });
});

describe("shifts", () => {
  it("active users can read shifts; only shift managers can write", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(get(ref(alice, "shifts")));
    await assertFails(set(ref(alice, "shifts/afternoon"), shift("afternoon")));

    const shiftman = dbFor("shiftman");
    await assertSucceeds(
      set(ref(shiftman, "shifts/afternoon"), shift("afternoon")),
    );
    await assertSucceeds(
      update(ref(shiftman, "shifts/morning"), {
        name: "Morning",
        updatedAt: NOW + 1,
      }),
    );
    await assertSucceeds(remove(ref(shiftman, "shifts/afternoon")));
  });

  it("validates shift ids, time pairs and appearance permissions", async () => {
    const shiftman = dbFor("shiftman");
    await assertFails(set(ref(shiftman, "shifts/Bad Key"), shift("bad")));
    await assertFails(
      set(ref(shiftman, "shifts/noEnd"), {
        ...shift("noEnd"),
        startTime: "08:00",
        endTime: "",
      }),
    );
    await assertSucceeds(
      update(ref(shiftman, "shifts/morning"), {
        color: "#16a34a",
        updatedAt: NOW + 1,
      }),
    );

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.database();
      await set(
        ref(db, "roles/shiftbasic"),
        role("shiftbasic", ["shifts_view", "shifts_edit"]),
      );
      await set(
        ref(db, "profiles/shiftbasic"),
        profile("shiftbasic", "shiftbasic@example.com", "shiftbasic"),
      );
    });
    const basic = dbFor("shiftbasic");
    await assertSucceeds(
      update(ref(basic, "shifts/morning"), {
        name: "Morning 2",
        updatedAt: NOW + 1,
      }),
    );
    await assertFails(
      update(ref(basic, "shifts/morning"), {
        color: "#dc2626",
        updatedAt: NOW + 1,
      }),
    );
  });

  it("reserved day/night shifts cannot be deleted", async () => {
    const shiftman = dbFor("shiftman");
    await assertFails(remove(ref(shiftman, "shifts/day")));
    await assertFails(remove(ref(shiftman, "shifts/night")));
  });
});

describe("roles", () => {
  it("authenticated active users can read roles but only master can write", async () => {
    const manager = dbFor("manager");
    await assertSucceeds(get(ref(manager, "roles")));
    await assertFails(
      update(ref(manager, "roles/viewer"), {
        name: "Hacked",
        updatedAt: NOW + 1,
      }),
    );

    const admin = dbFor("admin");
    await assertSucceeds(
      set(
        ref(admin, "roles/custom"),
        role("custom", ["lists_view"], { status: "active" }),
      ),
    );
  });

  it("rejects invalid role payloads and reserved legacy keys", async () => {
    const admin = dbFor("admin");
    await assertFails(
      set(ref(admin, "roles/bad"), { ...role("bad", []), status: "enabled" }),
    );
    await assertFails(
      set(ref(admin, "roles/bad2"), { ...role("bad2", []), color: "red" }),
    );
    await assertFails(set(ref(admin, "roles/admin"), role("admin", [])));
    await assertFails(set(ref(admin, "roles/user"), role("user", [])));
  });

  it("protected/system master role cannot be deactivated or deleted", async () => {
    const admin = dbFor("admin");
    await assertFails(
      update(ref(admin, "roles/master-admin"), { status: "inactive" }),
    );
    await assertFails(
      update(ref(admin, "roles/master-admin"), { protected: false }),
    );
    await assertFails(remove(ref(admin, "roles/master-admin")));
  });

  it("custom role can be deleted only when unused and unprotected", async () => {
    const admin = dbFor("admin");
    await set(ref(admin, "roles/custom"), role("custom", []));
    await assertSucceeds(remove(ref(admin, "roles/custom")));

    await set(ref(admin, "roles/used"), {
      ...role("used", []),
      assignedUserCount: 2,
    });
    await assertFails(remove(ref(admin, "roles/used")));

    await set(ref(admin, "roles/protected-custom"), {
      ...role("protected-custom", []),
      protected: true,
    });
    await assertFails(remove(ref(admin, "roles/protected-custom")));
  });

  it("only users with users.assignRole may update role counts, not metadata", async () => {
    const hr = dbFor("hr");
    await assertSucceeds(set(ref(hr, "roles/viewer/assignedUserCount"), 3));
    await assertSucceeds(
      update(ref(hr, "roles/viewer"), { updatedAt: NOW + 2 }),
    );
    await assertFails(update(ref(hr, "roles/viewer"), { name: "Hacked" }));

    const alice = dbFor("alice");
    await assertFails(set(ref(alice, "roles/viewer/assignedUserCount"), 9));
  });
});

describe("categories", () => {
  it("operator can read but not create/update/delete categories", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(get(ref(alice, "categories")));
    await assertFails(
      set(ref(alice, "categories/packaging"), category("packaging")),
    );
    await assertFails(
      update(ref(alice, "categories/import"), { name: "Hacked" }),
    );
    await assertFails(remove(ref(alice, "categories/import")));
  });

  it("category manager can create/edit/delete with valid payloads", async () => {
    const catman = dbFor("catman");
    await assertSucceeds(
      set(ref(catman, "categories/packaging"), category("packaging")),
    );
    await assertSucceeds(
      update(ref(catman, "categories/packaging"), { name: "Packaging" }),
    );
    await assertSucceeds(remove(ref(catman, "categories/packaging")));
    await assertFails(
      set(ref(catman, "categories/bad"), {
        ...category("bad"),
        color: "#xyzxyz",
      }),
    );
    await assertFails(
      set(ref(catman, "categories/badSlug"), {
        ...category("badSlug"),
        slug: "Bad Slug",
      }),
    );
  });

  it("category slug is immutable after creation", async () => {
    const catman = dbFor("catman");
    await assertFails(
      update(ref(catman, "categories/import"), { slug: "renamed" }),
    );
    const admin = dbFor("admin");
    await assertFails(
      update(ref(admin, "categories/import"), { slug: "renamed" }),
    );
  });

  it("appearance changes require categories.manageAppearance", async () => {
    const catman = dbFor("catman");
    await assertSucceeds(
      update(ref(catman, "categories/import"), {
        ...category("import"),
        name: "Import 2",
      }),
    );
    await assertFails(
      update(ref(catman, "categories/import"), {
        ...category("import"),
        color: "#16a34a",
      }),
    );
    const admin = dbFor("admin");
    await assertSucceeds(
      update(ref(admin, "categories/import"), {
        ...category("import"),
        color: "#16a34a",
      }),
    );
  });
});

describe("activity logs (append-only)", () => {
  it("active users append their own entries only", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(
      set(ref(alice, "activityLogs/logAlice"), logEntry("alice")),
    );
    await assertFails(
      set(ref(alice, "activityLogs/logForged"), logEntry("bob")),
    );
  });

  it("existing entries cannot be edited", async () => {
    const admin = dbFor("admin");
    const alice = dbFor("alice");
    await assertFails(
      update(ref(admin, "activityLogs/log1"), { details: "edited" }),
    );
    await assertFails(
      update(ref(alice, "activityLogs/log1"), { details: "edited" }),
    );
  });

  it("audit.view can read logs; audit.clear (master) can delete", async () => {
    const manager = dbFor("manager");
    await assertSucceeds(get(ref(manager, "activityLogs")));
    await assertFails(remove(ref(manager, "activityLogs/log1")));

    const alice = dbFor("alice");
    await assertFails(get(ref(alice, "activityLogs")));

    const admin = dbFor("admin");
    await assertSucceeds(remove(ref(admin, "activityLogs/log1")));
  });

  it("rejects oversized details and inactive authors", async () => {
    const alice = dbFor("alice");
    await assertFails(
      set(ref(alice, "activityLogs/logHuge"), {
        ...logEntry("alice"),
        details: "x".repeat(501),
      }),
    );
    const carol = dbFor("carol");
    await assertFails(
      set(ref(carol, "activityLogs/logCarol"), logEntry("carol")),
    );
  });
});

describe("settings", () => {
  it("everyone reads public settings; only settings.edit writes", async () => {
    const alice = dbFor("alice");
    const manager = dbFor("manager");
    const admin = dbFor("admin");
    const publicDb = testEnv.unauthenticatedContext().database();
    await assertSucceeds(get(ref(alice, "settings/app")));
    await assertSucceeds(get(ref(manager, "settings/app")));
    await assertSucceeds(get(ref(publicDb, "settings/app")));
    await assertFails(
      update(ref(alice, "settings/app"), { brandName: "Hack" }),
    );
    await assertFails(
      update(ref(manager, "settings/app"), { brandName: "Hack" }),
    );
    await assertSucceeds(
      update(ref(admin, "settings/app"), {
        brandName: "Blasting Pro",
        updatedAt: NOW + 1,
      }),
    );
  });

  it("rejects invalid settings payloads", async () => {
    const admin = dbFor("admin");
    await assertFails(update(ref(admin, "settings/app"), { brandName: "" }));
    await assertFails(
      set(ref(admin, "settings/app"), {
        brandName: "ok",
        features: { pdfExport: "yes" },
      }),
    );
    await assertFails(
      update(ref(admin, "settings/app"), {
        brandName: "x".repeat(61),
      }),
    );
    await assertFails(
      update(ref(admin, "settings/app"), { contactEmail: "x".repeat(255) }),
    );
  });

  it("manages languages and translations with settings.edit only", async () => {
    const admin = dbFor("admin");
    const manager = dbFor("manager");
    await assertFails(
      set(ref(manager, "settings/languages/fr"), language("fr", {
        protected: false,
        isDefault: false,
      })),
    );
    await assertSucceeds(
      set(
        ref(admin, "settings/languages/fr"),
        language("fr", {
          name: "French",
          nativeName: "Français",
          protected: false,
          isDefault: false,
        }),
      ),
    );
    await assertSucceeds(
      set(ref(admin, "settings/translations/site__title/fr"), "Numéro"),
    );
    await assertFails(
      set(ref(manager, "settings/translations/site__title/fr"), "Hack"),
    );
    await assertFails(
      set(
        ref(admin, "settings/translations/site__title/fr"),
        "x".repeat(5001),
      ),
    );
    await assertFails(
      set(ref(admin, `settings/translations/${"k".repeat(201)}/fr`), "x"),
    );
  });

  it("keeps English active/protected and language codes immutable", async () => {
    const admin = dbFor("admin");
    await assertFails(
      update(ref(admin, "settings/languages/en"), { status: "inactive" }),
    );
    await assertFails(
      update(ref(admin, "settings/languages/en"), { protected: false }),
    );
    await assertFails(
      set(ref(admin, "settings/languages/en"), language("en", {
        protected: false,
      })),
    );
    await assertFails(
      update(ref(admin, "settings/languages/bn"), { protected: false }),
    );
    await assertFails(
      update(ref(admin, "settings/languages/bn"), { code: "bangla" }),
    );
  });

  it("blocks deleting protected/default languages but allows custom ones", async () => {
    const admin = dbFor("admin");
    await assertFails(remove(ref(admin, "settings/languages/en")));
    await assertFails(remove(ref(admin, "settings/languages/bn")));
    await assertSucceeds(
      set(
        ref(admin, "settings/languages/de"),
        language("de", {
          name: "German",
          nativeName: "Deutsch",
          protected: false,
          isDefault: false,
        }),
      ),
    );
    await assertSucceeds(remove(ref(admin, "settings/languages/de")));
  });
});
