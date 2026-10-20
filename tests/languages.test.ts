import { describe, expect, it } from "vitest";
import {
  BASE_LANGUAGE_CODES,
  buildDefaultLanguageSeed,
  buildSeedTranslations,
  coerceLanguage,
  defaultLanguageRecords,
  isValidLanguageCode,
  normalizeLanguageList,
  translationStorageKey,
} from "../src/services/languages";
import { UI_CATALOG } from "../src/i18n/uiCatalog";
import { WEBSITE_CONTENT_FIELDS } from "../src/i18n/content";

describe("language helpers", () => {
  it("validates BCP-47-like lowercase codes", () => {
    expect(isValidLanguageCode("en")).toBe(true);
    expect(isValidLanguageCode("pt-br")).toBe(true);
    expect(isValidLanguageCode("EN")).toBe(false);
    expect(isValidLanguageCode("e")).toBe(false);
    expect(isValidLanguageCode("../en")).toBe(false);
    expect([...BASE_LANGUAGE_CODES]).toEqual(["en", "bn"]);
  });

  it("stores dotted logical keys safely", () => {
    expect(translationStorageKey("site.hero.title")).toBe(
      "site__hero__title",
    );
    expect(translationStorageKey("ui.abc123")).toBe("ui__abc123");
  });

  it("always has exactly one active English default", () => {
    const normalized = normalizeLanguageList(defaultLanguageRecords(1));
    expect(normalized.filter((language) => language.isDefault)).toHaveLength(1);
    expect(normalized.find((language) => language.isDefault)?.code).toBe("en");
    expect(normalized.find((language) => language.code === "en")).toMatchObject({
      status: "active",
      protected: true,
    });
    expect(normalized.find((language) => language.code === "bn")).toMatchObject({
      protected: true,
    });
  });

  it("falls back to English when stored defaults are inconsistent", () => {
    const records = defaultLanguageRecords(1).map((language) => ({
      ...language,
      isDefault: false,
    }));
    const normalized = normalizeLanguageList(records);
    expect(normalized.find((language) => language.isDefault)?.code).toBe("en");
  });

  it("repairs partial base records and keeps English complete", () => {
    const ghost = coerceLanguage("en", { isDefault: false, updatedAt: 1 });
    expect(ghost).toMatchObject({
      code: "en",
      name: "English",
      nativeName: "English",
      status: "active",
      protected: true,
      sortOrder: 0,
    });
    const seed = buildDefaultLanguageSeed(
      { en: { isDefault: false } },
      "system",
      1,
    );
    expect(seed["settings/languages/en"]).toMatchObject({
      code: "en",
      name: "English",
      nativeName: "English",
      isDefault: true,
      protected: true,
      createdBy: "system",
    });
    expect(seed["settings/languages/bn"]).toMatchObject({
      name: "Bengali",
      isDefault: false,
      protected: true,
    });
  });

  it("materializes both base records without replacing a custom default", () => {
    const spanish = {
      code: "es",
      name: "Spanish",
      nativeName: "Español",
      direction: "ltr",
      status: "active",
      isDefault: true,
      sortOrder: 2,
      protected: false,
    };
    const seed = buildDefaultLanguageSeed({ es: spanish }, "system", 1);
    expect(seed["settings/languages/en"]).toMatchObject({
      isDefault: false,
      name: "English",
    });
    expect(seed["settings/languages/bn"]).toMatchObject({
      isDefault: false,
      name: "Bengali",
    });
  });

  it("seeds both languages for every UI and website string", () => {
    const seed = buildSeedTranslations(["en", "bn"]);
    const expected = UI_CATALOG.length + WEBSITE_CONTENT_FIELDS.length;
    expect(Object.keys(seed)).toHaveLength(expected);
    for (const values of Object.values(seed)) {
      expect(values.en?.trim().length ?? 0).toBeGreaterThan(0);
    }
    expect(seed[translationStorageKey("site.subtitle")]?.bn).toContain(
      "স্মার্ট",
    );
  });
});
