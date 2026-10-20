import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./global-setup";
import { selectTestLanguage } from "./helpers";

test.describe("admin panel", () => {
  test.beforeEach(async ({ page }) => {
    await selectTestLanguage(page, "bn");
    await page.goto("/?auth=login");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="email"]').fill(ADMIN_EMAIL);
    await dialog.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await dialog.getByRole("button", { name: "লগইন করুন" }).click();
    await expect(page).toHaveURL(/\/lists$/);
  });

  test("admin reaches the dashboard with live stats", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "ড্যাশবোর্ড" }),
    ).toBeVisible();
    await expect(page.getByText("মোট ইউজার")).toBeVisible();
    await expect(
      page.getByText("সক্রিয় অ্যাকাউন্ট", { exact: true }),
    ).toBeVisible();
  });

  test("master can open dynamic role and category management", async ({
    page,
  }) => {
    await page.goto("/admin/roles");
    await expect(
      page.getByRole("heading", { name: "রোল ও অনুমতি" }),
    ).toBeVisible();
    await expect(page.getByText("Master Admin", { exact: true })).toBeVisible();
    await expect(page.getByText("Operator", { exact: true })).toBeVisible();

    await page.goto("/admin/categories");
    await expect(
      page.getByRole("heading", { name: "ক্যাটাগরি" }),
    ).toBeVisible();
    await expect(page.getByText("Blasting", { exact: true })).toBeVisible();
    await expect(page.getByText("Import", { exact: true })).toBeVisible();

    await page.goto("/admin/shifts");
    await expect(page.getByRole("heading", { name: "শিফট" })).toBeVisible();
    await expect(page.getByText("দিন", { exact: true })).toBeVisible();
    await expect(page.getByText("রাত", { exact: true })).toBeVisible();
  });

  test("master creates and deletes a custom role", async ({ page }) => {
    await page.goto("/admin/roles");
    await page.getByRole("button", { name: "নতুন রোল" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("রোল কী").fill("supervisor-e2e");
    await dialog.getByLabel("নাম", { exact: true }).fill("Supervisor E2E");
    await dialog.getByRole("button", { name: "রোল তৈরি করুন" }).click();
    await expect(
      page.getByText("Supervisor E2E", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Supervisor E2E মুছুন" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "মুছে ফেলুন" })
      .click();
    await expect(page.getByText("Supervisor E2E", { exact: true })).toHaveCount(
      0,
    );
  });

  test("master creates and deletes a custom category", async ({ page }) => {
    await page.goto("/admin/categories");
    await page.getByRole("button", { name: "নতুন ক্যাটাগরি" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("ক্যাটাগরি কী / slug").fill("packaging-e2e");
    await dialog.getByLabel("নাম", { exact: true }).fill("Packaging E2E");
    await dialog.getByRole("button", { name: "ক্যাটাগরি তৈরি করুন" }).click();
    await expect(
      page.getByText("Packaging E2E", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Packaging E2E মুছুন" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "মুছে ফেলুন" })
      .click();
    await expect(page.getByText("Packaging E2E", { exact: true })).toHaveCount(
      0,
    );
  });

  test("master creates and deletes a dynamic shift", async ({ page }) => {
    await page.goto("/admin/shifts");
    await page.getByRole("button", { name: "নতুন শিফট" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("শিফট কী").fill("afternoon-e2e");
    await dialog.getByLabel("নাম", { exact: true }).fill("Afternoon E2E");
    await dialog.getByRole("button", { name: "শিফট তৈরি করুন" }).click();
    await expect(
      page.getByText("Afternoon E2E", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Afternoon E2E মুছুন" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "মুছে ফেলুন" })
      .click();
    await expect(page.getByText("Afternoon E2E", { exact: true })).toHaveCount(
      0,
    );
  });

  test("admin user management lists the seeded admin account", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: "ইউজার ম্যানেজমেন্ট" }),
    ).toBeVisible();
    await expect(page.getByRole("table").getByText(ADMIN_EMAIL)).toBeVisible();
  });

  test("settings rejects an empty brand name and saves a valid one", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "ওয়েবসাইট সেটিংস" })).toBeVisible();

    const brand = page.getByLabel("ওয়েবসাইটের নাম");
    const save = page.getByRole("button", { name: "সংরক্ষণ" });

    await brand.fill("");
    await expect(page.getByText("ওয়েবসাইটের নাম দিন")).toBeVisible();
    await expect(save).toBeDisabled();

    await brand.fill("E2E Blasting");
    await expect(save).toBeEnabled();
    await save.click();
    await expect(
      page.getByText("ওয়েবসাইট সেটিংস সংরক্ষিত হয়েছে"),
    ).toBeVisible();

    await page.getByRole("button", { name: "ওয়েবসাইট কনটেন্ট" }).click();
    await expect(page.getByText("হিরো শিরোনাম")).toBeVisible();
    await page
      .locator("summary")
      .filter({ hasText: "প্রশ্নোত্তর" })
      .first()
      .click();
    await expect(page.getByText("প্রশ্নোত্তর সেকশনের শিরোনাম")).toBeVisible();
  });
});
