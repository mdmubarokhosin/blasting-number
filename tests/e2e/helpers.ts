import type { Page } from "@playwright/test";

export async function selectTestLanguage(
  page: Page,
  language: "en" | "bn",
): Promise<void> {
  await page.addInitScript((code) => {
    try {
      window.localStorage.setItem("blasting-number.language", code);
    } catch {
      // localStorage can be unavailable before an origin is assigned.
    }
  }, language);
}
