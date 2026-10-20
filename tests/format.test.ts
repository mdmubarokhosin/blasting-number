import { describe, expect, it } from "vitest";
import { addDays, dateRange, groupByDay, isValidISO, toISO } from "../src/utils/format";

describe("date helpers", () => {
  it("adds and subtracts days across month boundaries", () => {
    expect(addDays("2026-10-19", 1)).toBe("2026-10-20");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("validates ISO dates", () => {
    expect(isValidISO("2026-10-19")).toBe(true);
    expect(isValidISO("2026-13-01")).toBe(false);
    expect(isValidISO("19/10/2026")).toBe(false);
  });

  it("builds inclusive date ranges", () => {
    expect(dateRange("2026-10-17", "2026-10-19")).toEqual([
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
    ]);
    expect(dateRange("2026-10-19", "2026-10-17")).toEqual([]);
  });

  it("formats a Date as local ISO day", () => {
    expect(toISO(new Date(2026, 9, 5))).toBe("2026-10-05");
  });

  it("groups timestamps by day", () => {
    const day1 = new Date(2026, 9, 19, 10).getTime();
    const day1b = new Date(2026, 9, 19, 22).getTime();
    const day2 = new Date(2026, 9, 20, 1).getTime();
    const grouped = groupByDay([day1, day1b, day2]);
    expect(grouped.get("2026-10-19")).toBe(2);
    expect(grouped.get("2026-10-20")).toBe(1);
  });
});
