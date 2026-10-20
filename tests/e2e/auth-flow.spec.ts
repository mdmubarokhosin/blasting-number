import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./global-setup";
import { selectTestLanguage } from "./helpers";

function uniqueEmail(): string {
  return `user${Date.now()}-${Math.floor(Math.random() * 10000)}@e2e.test`;
}

async function register(page: Page, email: string): Promise<void> {
  await selectTestLanguage(page, "bn");
  await page.goto("/?auth=register");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Viewer অ্যাকাউন্ট")).toBeVisible();
  await dialog.locator('input[name="displayName"]').fill("ই২ই ইউজার");
  await dialog.locator('input[name="email"]').fill(email);
  await dialog.locator('input[name="password"]').fill("User12345!");
  await dialog.getByRole("button", { name: "অ্যাকাউন্ট খুলুন" }).click();
  await expect(page).toHaveURL(/\/lists$/);
}

async function loginAdmin(page: Page): Promise<void> {
  await selectTestLanguage(page, "bn");
  await page.goto("/?auth=login");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="email"]').fill(ADMIN_EMAIL);
  await dialog.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await dialog.getByRole("button", { name: "লগইন করুন" }).click();
  await expect(page).toHaveURL(/\/lists$/);
}

test.describe("landing, auth and list flow", () => {
  test.beforeEach(async ({ page }) => {
    await selectTestLanguage(page, "bn");
  });

  test("landing renders and the login dialog opens", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Blasting",
    );
    await page.getByRole("button", { name: "লগইন করুন" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("লগইন", { exact: true })).toBeVisible();
  });

  test("unauthenticated /admin visit redirects to landing with the login dialog", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/auth=login/);
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("new registration starts as a read-only Viewer", async ({ page }) => {
    await register(page, uniqueEmail());
    await expect(
      page.getByRole("heading", { name: "আমার তালিকা" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "নতুন তালিকা" })).toHaveCount(
      0,
    );

    await page.goto("/lists/new");
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByText("অনুমতি নেই", { exact: true })).toBeVisible();
  });

  test("operator can create a list, add items, detect duplicates and copy all", async ({
    page,
  }) => {
    await loginAdmin(page);
    await expect(
      page.getByRole("heading", { name: "আমার তালিকা" }),
    ).toBeVisible();

    await page.goto("/lists/new");
    await page.getByLabel("তারিখ").fill("2026-10-19");
    await page.getByLabel("নোট (ঐচ্ছিক)").fill("E2E স্বয়ংক্রিয় তালিকা");
    await page.getByRole("button", { name: "তালিকা তৈরি করুন" }).click();
    await expect(page).toHaveURL(/\/lists\/[^/]+$/);

    const codes = "A1-L12-BM-1011\nA1-L12-BM-1012";
    await page.getByLabel("কোড (প্রতি লাইনে একটি)").fill(codes);
    await page.getByRole("button", { name: "কোড যোগ করুন" }).click();
    await expect(
      page.getByRole("table").getByText("A1-L12-BM-1011"),
    ).toBeVisible();
    await expect(
      page.getByRole("table").getByText("A1-L12-BM-1012"),
    ).toBeVisible();

    await page.getByLabel("কোড (প্রতি লাইনে একটি)").fill("A1-L12-BM-1011");
    await page.getByRole("button", { name: "কোড যোগ করুন" }).click();
    await expect(page.getByText(/ডুপ্লিকেট বাদ দেওয়া হয়েছে/)).toBeVisible();

    await page.getByRole("button", { name: "সব কপি" }).click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("A1-L12-BM-1011");
    expect(clipboard).toContain("A1-L12-BM-1012");
  });

  test("landing and auth dialog work on a mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Blasting",
    );
    await page.getByRole("button", { name: "ফ্রি অ্যাকাউন্ট খুলুন" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "অ্যাকাউন্ট খুলুন" }),
    ).toBeVisible();
  });
});
