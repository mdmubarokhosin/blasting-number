import { describe, expect, it } from "vitest";
import { translateDynamic } from "../src/i18n/dynamic";
import { UI_BY_SOURCE, UI_CATALOG } from "../src/i18n/uiCatalog";
import { WEBSITE_CONTENT_FIELDS } from "../src/i18n/content";

describe("dynamic interface localization", () => {
  it("localizes activity messages with variable values", () => {
    expect(translateDynamic("E2E Admin লগইন করেছেন", "en")).toBe(
      "E2E Admin logged in",
    );
    expect(
      translateDynamic('নতুন ভাষা "French" (fr) যোগ করা হয়েছে', "en"),
    ).toBe('New language "French" (fr) added');
    expect(translateDynamic('"বাংলা" ডিফল্ট ভাষা করা হয়েছে', "en")).toBe(
      '"বাংলা" set as default language',
    );
    expect(
      translateDynamic("12টি ডুপ্লিকেট কোড বাদ দেওয়া হয়েছে", "en"),
    ).toBe("12 duplicate codes skipped");
    expect(translateDynamic("3 সক্রিয় অ্যাকাউন্ট · 2 অ্যাডমিন", "en")).toBe(
      "3 active accounts · 2 admins",
    );
  });

  it("preserves Bengali and falls back to English for other languages", () => {
    expect(translateDynamic("তালিকা তৈরি হয়েছে", "bn")).toBeNull();
    expect(translateDynamic("তালিকা তৈরি হয়েছে", "fr")).toBeNull();
    expect(translateDynamic("তালিকা তৈরি হয়েছে", "en")).toBeNull();
  });
});

describe("translation catalogs", () => {
  it("has unique UI keys and complete English/Bengali values", () => {
    const keys = UI_CATALOG.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const entry of UI_CATALOG) {
      expect(entry.key.length).toBeLessThanOrEqual(200);
      expect(entry.bn.trim().length).toBeGreaterThan(0);
      expect(entry.en.trim().length).toBeGreaterThan(0);
      expect(UI_BY_SOURCE.get(entry.bn)?.key).toBe(entry.key);
    }
  });

  it("has complete website content fields", () => {
    const keys = WEBSITE_CONTENT_FIELDS.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const field of WEBSITE_CONTENT_FIELDS) {
      expect(field.en.trim().length).toBeGreaterThan(0);
      expect(field.bn.trim().length).toBeGreaterThan(0);
      expect(field.label.trim().length).toBeGreaterThan(0);
    }
  });
});
