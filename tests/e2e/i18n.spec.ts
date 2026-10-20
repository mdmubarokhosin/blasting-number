import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./global-setup";

async function loginAdmin(page: Page): Promise<void> {
  await page.goto("/?auth=login");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="email"]').fill(ADMIN_EMAIL);
  await dialog.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await dialog.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/lists$/);
}

test.describe("multilingual public site", () => {
  test("defaults to English, switches to Bengali and remembers the choice", async ({
    page,
  }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("Your Blasting code list");
    await expect(
      page.getByRole("button", { name: "Log in" }).first(),
    ).toBeVisible();

    const selector = page.getByRole("combobox", { name: "Language" });
    await expect(selector).toHaveValue("en");
    await selector.selectOption("bn");

    await expect(heading).toContainText("আপনার Blasting কোড লিস্ট");
    await expect(
      page.getByRole("button", { name: "লগইন করুন" }).first(),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "আপনার Blasting কোড লিস্ট",
    );
    await expect(
      page.getByRole("combobox", { name: "ভাষা" }),
    ).toHaveValue("bn");
  });

  test("authenticated admin can manage languages and edit website content", async ({
    page,
  }) => {
    await loginAdmin(page);

    await page.goto("/admin/languages");
    await expect(
      page.getByRole("heading", { name: "Languages & translations" }),
    ).toBeVisible();
    const main = page.locator("#main-content");
    await expect(
      main.getByRole("heading", { name: /^English/ }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "Bengali" }),
    ).toBeVisible();
    await expect(main.getByText("Protected").first()).toBeVisible();

    await page.goto("/admin/settings");
    await expect(
      page.getByRole("heading", { name: "Website settings" }),
    ).toBeVisible();
    await expect(page.getByLabel("Website name")).not.toHaveValue("");
    await expect(page.getByLabel("Contact email")).toBeVisible();
    await expect(page.getByText("Branding", { exact: true })).toBeVisible();
  });

  test("admin creates, defaults and deletes a custom language", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/languages");

    await page.getByRole("button", { name: "New language" }).click();
    const editor = page.getByRole("dialog");
    await expect(editor).toBeVisible();
    await editor.locator('input[name="language-code"]').fill("es");
    await editor.locator('input[name="language-name"]').fill("Spanish");
    await editor.locator('input[name="language-native-name"]').fill("Spanish");
    await editor.getByRole("button", { name: "Add language" }).click();
    await expect(editor).not.toBeVisible();

    const spanishCard = page
      .locator(".card")
      .filter({ hasText: "Spanish" })
      .first();
    await expect(spanishCard).toBeVisible();
    await expect(spanishCard.getByText("Active", { exact: true })).toBeVisible();

    await spanishCard.getByRole("button", { name: "Make default" }).click();
    await expect(spanishCard.getByText("Default", { exact: true })).toBeVisible();

    const englishCard = page
      .locator(".card")
      .filter({ hasText: "English" })
      .first();
    await englishCard.getByRole("button", { name: "Make default" }).click();
    await expect(englishCard.getByText("Default", { exact: true })).toBeVisible();

    await spanishCard.getByRole("button", { name: "Delete Spanish" }).click();
    const confirm = page.getByRole("dialog");
    await expect(
      confirm.getByRole("heading", { name: "Delete language?" }),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(spanishCard).toHaveCount(0);

    await page.getByRole("button", { name: "Seed defaults" }).click();
    await expect(
      page.getByRole("heading", { name: /^English/ }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Bengali" }),
    ).toBeVisible();

    const seeded = await page.request.get(
      "http://127.0.0.1:9000/settings.json?ns=demo-blasting-e2e",
    );
    expect(seeded.ok()).toBe(true);
    const seedData = (await seeded.json()) as {
      languages: Record<string, { name: string; isDefault?: boolean }>;
      translations: Record<string, Record<string, string>>;
    };
    expect(seedData.languages.en).toMatchObject({
      name: "English",
      isDefault: true,
    });
    expect(seedData.languages.bn).toMatchObject({ name: "Bengali" });
    expect(Object.keys(seedData.translations)).toHaveLength(865);
  });
});
