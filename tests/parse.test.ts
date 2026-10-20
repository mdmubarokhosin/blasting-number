import { describe, expect, it } from "vitest";
import {
  findDuplicate,
  formatExtraText,
  normalizeEntry,
  parseItem,
  splitCode,
} from "../src/utils/parse";

describe("normalizeEntry", () => {
  it("uppercases the code and keeps the extra part", () => {
    const result = normalizeEntry("a1-l12-bm-1011 1/2");
    expect(result.code).toBe("A1-L12-BM-1011");
    expect(result.extra).toBe("1/2");
    expect(result.value).toBe("A1-L12-BM-1011 1/2");
  });

  it("normalizes quantity suffixes", () => {
    expect(normalizeEntry("abc 10pic").extra).toBe("10Pic");
    expect(normalizeEntry("abc 10 PCS").extra).toBe("10Pcs");
  });

  it("returns empty parts for blank input", () => {
    expect(normalizeEntry("   ")).toEqual({ code: "", extra: "", value: "" });
  });

  it("handles code-only input", () => {
    expect(normalizeEntry("abc-123").value).toBe("ABC-123");
  });
});

describe("formatExtraText", () => {
  it("converts pic/pcs tokens", () => {
    expect(formatExtraText("5pic")).toBe("5Pic");
    expect(formatExtraText("5 pcs")).toBe("5Pcs");
    expect(formatExtraText("")).toBe("");
  });
});

describe("findDuplicate", () => {
  const entries = [
    { date: "2026-10-01", shift: "day", code: "ABC 1/2", category: "Blasting" as const },
    { date: "2026-10-02", shift: "night", code: "XYZ", category: "Import" as const },
  ];

  it("matches case-insensitively and returns metadata", () => {
    expect(findDuplicate("abc 1/2", entries)).toEqual({
      date: "2026-10-01",
      shift: "day",
      category: "Blasting",
    });
  });

  it("returns null when no match", () => {
    expect(findDuplicate("abc", entries)).toBeNull();
    expect(findDuplicate("", entries)).toBeNull();
  });
});

describe("splitCode / parseItem", () => {
  it("splits body and extra", () => {
    expect(splitCode("A1-L12 1/2")).toEqual({ body: "A1-L12", extra: "1/2" });
    expect(splitCode("PLAIN")).toEqual({ body: "PLAIN", extra: "" });
  });

  it("parses category prefixes", () => {
    expect(parseItem("Blasting A1 B2")).toEqual({ category: "Blasting", code: "A1 B2" });
    expect(parseItem("Single")).toEqual({ category: "Single", code: "" });
  });
});
