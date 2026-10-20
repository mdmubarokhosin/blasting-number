import { describe, expect, it } from "vitest";
import { categoryUsage } from "../src/utils/categories";
import {
  activityCountsByDay,
  computeListStats,
  computeUserStats,
  filterListsByDateRange,
  filterLogsByDateRange,
  itemCountsByDay,
  listCountsByDay,
  topOwners,
} from "../src/utils/stats";
import { makeCategory, makeItem, makeList, makeLog, makeProfile } from "./factories";

const categories = [
  makeCategory({ id: "blasting", name: "Blasting", sortOrder: 0 }),
  makeCategory({ id: "import", name: "Import", sortOrder: 1 }),
  makeCategory({ id: "damaged", name: "Damaged", sortOrder: 2 }),
  makeCategory({ id: "return", name: "Return", sortOrder: 3 }),
];

describe("computeListStats", () => {
  it("counts lists, items, categories and shifts", () => {
    const stats = computeListStats(
      [
        makeList({
          id: "l1",
          shift: "day",
          items: {
            a: makeItem({ id: "a", categoryId: "blasting", category: "Blasting" }),
            b: makeItem({ id: "b", categoryId: "import", category: "Import" }),
          },
        }),
        makeList({
          id: "l2",
          shift: "night",
          items: { c: makeItem({ id: "c", categoryId: "return", category: "Return" }) },
        }),
      ],
      categories,
      "2026-10-19",
    );
    expect(stats.totalLists).toBe(2);
    expect(stats.totalItems).toBe(3);
    expect(stats.categoryCounts).toEqual({
      blasting: 1,
      import: 1,
      damaged: 0,
      return: 1,
    });
    expect(stats.shiftCounts).toEqual({ day: 1, night: 1 });
    expect(stats.todayLists).toBe(2);
    expect(stats.todayItems).toBe(3);
  });

  it("keeps legacy item category names when no category records are supplied", () => {
    const stats = computeListStats([
      makeList({
        items: {
          a: makeItem({ id: "a", category: "Legacy A" }),
          b: makeItem({ id: "b", category: "Legacy A" }),
        },
      }),
    ]);
    expect(stats.categoryCounts).toEqual({ "Legacy A": 2 });
  });

  it("counts only matching day as today", () => {
    const stats = computeListStats([makeList({ date: "2026-10-18" })], categories, "2026-10-19");
    expect(stats.todayLists).toBe(0);
    expect(stats.todayItems).toBe(0);
  });
});

describe("computeUserStats", () => {
  it("splits active/inactive/admin and new users using effective roles", () => {
    const now = new Date(2026, 9, 19).getTime();
    const weekAgo = now - 8 * 86_400_000;
    const stats = computeUserStats(
      [
        makeProfile({ uid: "1", createdAt: now - 1_000 }),
        makeProfile({ uid: "2", active: false, createdAt: weekAgo }),
        makeProfile({ uid: "3", role: "admin", createdAt: weekAgo }),
        makeProfile({ uid: "4", role: "master-admin", createdAt: weekAgo }),
        makeProfile({ uid: "5", role: "admin-standard", createdAt: weekAgo }),
        makeProfile({ uid: "6", role: "manager", createdAt: weekAgo }),
      ],
      now,
    );
    expect(stats.totalUsers).toBe(6);
    expect(stats.activeUsers).toBe(5);
    expect(stats.inactiveUsers).toBe(1);
    expect(stats.admins).toBe(3);
    expect(stats.newLast7Days).toBe(1);
  });
});

describe("categoryUsage", () => {
  it("counts dynamic categories, unused categories and legacy names", () => {
    const usage = categoryUsage(
      [
        makeList({
          items: {
            a: makeItem({ id: "a", categoryId: "blasting", category: "Old Blasting" }),
            b: makeItem({ id: "b", category: "Removed Category" }),
          },
        }),
      ],
      categories,
    );
    const byId = new Map(usage.map((entry) => [entry.category.id, entry]));
    expect(byId.get("blasting")?.count).toBe(1);
    expect(byId.get("damaged")?.count).toBe(0);
    expect(byId.get("legacy:removed category")?.legacy).toBe(true);
    expect(usage[0]?.legacy).toBe(true);
  });
});

describe("chart series helpers", () => {
  const days = ["2026-10-18", "2026-10-19", "2026-10-20"];
  const lists = [
    makeList({
      id: "l1",
      date: "2026-10-19",
      items: { a: makeItem({ id: "a" }), b: makeItem({ id: "b" }) },
    }),
    makeList({ id: "l2", date: "2026-10-19", items: {} }),
    makeList({ id: "l3", date: "2026-10-20", items: { c: makeItem({ id: "c" }) } }),
  ];

  it("counts lists per day", () => {
    expect(listCountsByDay(lists, days)).toEqual([0, 2, 1]);
  });

  it("counts items per day", () => {
    expect(itemCountsByDay(lists, days)).toEqual([0, 2, 1]);
  });

  it("counts activity per day", () => {
    const logs = [
      makeLog({ id: "1", timestamp: new Date(2026, 9, 19, 8).getTime() }),
      makeLog({ id: "2", timestamp: new Date(2026, 9, 19, 20).getTime() }),
      makeLog({ id: "3", timestamp: new Date(2026, 9, 20, 1).getTime() }),
    ];
    expect(activityCountsByDay(logs, days)).toEqual([0, 2, 1]);
  });

  it("ranks top owners by item count", () => {
    const owners = topOwners(lists);
    expect(owners[0]?.uid).toBe("user-1");
    expect(owners[0]?.items).toBe(3);
  });
});

describe("date range filters", () => {
  it("filters lists inclusively", () => {
    const lists = [
      makeList({ id: "a", date: "2026-10-01" }),
      makeList({ id: "b", date: "2026-10-15" }),
      makeList({ id: "c", date: "2026-10-31" }),
    ];
    expect(filterListsByDateRange(lists, "2026-10-10", "2026-10-20").map((l) => l.id)).toEqual(["b"]);
    expect(filterListsByDateRange(lists, null, null)).toHaveLength(3);
  });

  it("filters logs inclusively", () => {
    const logs = [
      makeLog({ id: "a", timestamp: new Date(2026, 9, 1, 12).getTime() }),
      makeLog({ id: "b", timestamp: new Date(2026, 9, 15, 12).getTime() }),
    ];
    expect(filterLogsByDateRange(logs, "2026-10-10", "2026-10-20").map((l) => l.id)).toEqual(["b"]);
  });
});
