import { describe, expect, it } from "vitest";
import {
  DEFAULT_REGISTRATION_ROLE_KEY,
  defaultShiftRecords,
} from "../src/lib/defaults";
import {
  activeShifts,
  chartShiftUsage,
  findShift,
  isLegacyShiftId,
  resolveShift,
  selectableShifts,
  shiftFilterOptions,
  shiftName,
  shiftTimeLabel,
  shiftUsage,
  sortShifts,
} from "../src/utils/shifts";
import { makeList, makeShift } from "./factories";

const day = makeShift({ id: "day", name: "দিন", sortOrder: 0 });
const night = makeShift({
  id: "night",
  name: "রাত",
  icon: "moon",
  color: "#2563eb",
  sortOrder: 1,
});
const morning = makeShift({ id: "morning", name: "সকাল", sortOrder: 2 });
const expired = makeShift({
  id: "expired",
  name: "পুরনো",
  status: "inactive",
  sortOrder: 3,
});

describe("shift resolution", () => {
  it("preserves legacy day/night ids and seeds paired times", () => {
    expect(isLegacyShiftId("day")).toBe(true);
    expect(isLegacyShiftId("night")).toBe(true);
    expect(isLegacyShiftId("morning")).toBe(false);
    const seeds = defaultShiftRecords(100, "admin");
    expect(seeds.map((shift) => shift.id)).toEqual(["day", "night"]);
    expect(seeds[0]).toMatchObject({
      startTime: "06:00",
      endTime: "18:00",
      status: "active",
      createdBy: "admin",
    });
    expect(DEFAULT_REGISTRATION_ROLE_KEY).toBe("viewer");
  });

  it("sorts, filters and resolves records with safe fallbacks", () => {
    expect(
      sortShifts([expired, night, day, morning]).map((shift) => shift.id),
    ).toEqual(["day", "night", "morning", "expired"]);
    expect(
      activeShifts([expired, night, day]).map((shift) => shift.id),
    ).toEqual(["day", "night"]);
    expect(findShift([day], "missing")).toBeNull();
    expect(resolveShift("day", [day]).name).toBe("দিন");
    expect(resolveShift("removed", [day]).status).toBe("inactive");
    expect(shiftName("day", [])).toBe("দিন");
    expect(shiftName("removed", [])).toBe("removed");
    expect(shiftTimeLabel(day)).toBe("06:00 – 18:00");
    expect(shiftTimeLabel(makeShift({ startTime: "", endTime: "" }))).toBe(
      "সময় নির্ধারিত নয়",
    );
  });

  it("offers only active shifts while keeping the current inactive shift editable", () => {
    expect(
      selectableShifts([day, night, expired]).map((shift) => shift.id),
    ).toEqual(["day", "night"]);
    expect(
      selectableShifts([day, expired], "expired").map((shift) => shift.id),
    ).toEqual(["day", "expired"]);
    expect(selectableShifts([], "day").map((shift) => shift.id)).toEqual([
      "day",
      "night",
    ]);
  });

  it("builds filter options from active and referenced shifts", () => {
    const options = shiftFilterOptions(
      [
        makeList({ shift: "expired" }),
        makeList({ id: "l2", shift: "morning" }),
      ],
      [day, night, morning, expired],
    );
    expect(options.map((shift) => shift.id)).toEqual([
      "day",
      "night",
      "morning",
      "expired",
    ]);
  });
});

describe("shift usage", () => {
  const lists = [
    makeList({ id: "l1", shift: "day" }),
    makeList({ id: "l2", shift: "day" }),
    makeList({ id: "l3", shift: "removed" }),
  ];

  it("counts configured shifts and synthesizes legacy references", () => {
    const usage = shiftUsage(lists, [day, night, morning, expired]);
    const byId = new Map(usage.map((entry) => [entry.shift.id, entry]));
    expect(byId.get("day")?.count).toBe(2);
    expect(byId.get("night")?.count).toBe(0);
    expect(byId.get("removed")?.legacy).toBe(true);
    expect(byId.get("removed")?.shift.status).toBe("inactive");
    expect(usage[0]?.legacy).toBe(true);
  });

  it("charts active and referenced shifts but omits unused inactive ones", () => {
    const chart = chartShiftUsage(lists, [day, night, morning, expired]);
    expect(chart.map((entry) => entry.shift.id)).toEqual([
      "removed",
      "day",
      "night",
      "morning",
    ]);
  });
});
