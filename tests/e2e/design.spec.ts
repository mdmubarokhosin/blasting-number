import { expect, test, type Locator, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./global-setup";
import { selectTestLanguage } from "./helpers";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
];

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

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return (
      Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth
    );
  });
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(
    1,
  );
}

async function expectHorizontallyCentered(
  parent: Locator,
  child: Locator,
): Promise<void> {
  const [parentBox, childBox] = await Promise.all([
    parent.boundingBox(),
    child.boundingBox(),
  ]);
  expect(parentBox).not.toBeNull();
  expect(childBox).not.toBeNull();
  const parentCenter = parentBox!.x + parentBox!.width / 2;
  const childCenter = childBox!.x + childBox!.width / 2;
  expect(Math.abs(parentCenter - childCenter)).toBeLessThanOrEqual(2);
}

test.describe("responsive centered layout", () => {
  test.beforeEach(async ({ page }) => {
    await selectTestLanguage(page, "bn");
  });

  test("landing content stays centered without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/");
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await expectNoHorizontalOverflow(page);

      const hero = page.getByRole("heading", { level: 1 });
      const heroSection = hero.locator("xpath=ancestor::section[1]");
      await expectHorizontallyCentered(heroSection, hero);

      const featureCard = page.locator(".bn-feature-card").first();
      await featureCard.scrollIntoViewIfNeeded();
      await expectHorizontallyCentered(
        featureCard,
        featureCard.locator(".bn-icon-tile"),
      );
    }
  });

  test("list and profile cards are centered at every breakpoint", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/lists/new");
    await page.getByLabel("তারিখ").fill("2026-10-20");
    await page.getByLabel("নোট (ঐচ্ছিক)").fill("ডিজাইন রিগ্রেশন");
    await page.getByRole("button", { name: "তালিকা তৈরি করুন" }).click();
    await expect(page).toHaveURL(/\/lists\/[^/]+$/);
    await page.goto("/lists");

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await expectNoHorizontalOverflow(page);

      const statCard = page.locator(".bn-stat-card").first();
      await expectHorizontallyCentered(
        statCard,
        statCard.locator(".bn-stat-value"),
      );

      const listCard = page
        .locator(".bn-card-center")
        .filter({ hasText: "ডিজাইন রিগ্রেশন" })
        .first();
      await expect(listCard).toBeVisible();
      await expectHorizontallyCentered(
        listCard,
        listCard.getByText(/তৈরি করেছেন/),
      );
      await expect(listCard.locator(".card__footer")).toHaveCSS(
        "justify-content",
        "center",
      );
    }

    await page.goto("/profile");
    await expectNoHorizontalOverflow(page);
    const profileHeader = page.locator(".bn-card-center").first();
    await expectHorizontallyCentered(
      profileHeader,
      profileHeader.getByText("E2E Admin"),
    );
  });

  test("admin category, shift and role cards center their controls and actions", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/categories");
    await expect(
      page.getByRole("heading", { name: "ক্যাটাগরি" }),
    ).toBeVisible();

    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expectNoHorizontalOverflow(page);
      const categoryCard = page
        .locator(".bn-card-center")
        .filter({ hasText: "Blasting" })
        .first();
      await expect(categoryCard).toBeVisible();
      await expect(categoryCard.locator(".card__footer")).toHaveCSS(
        "justify-content",
        "center",
      );
      await expectHorizontallyCentered(
        categoryCard,
        categoryCard.locator(".card__footer .bn-card-actions"),
      );
    }

    await page.goto("/admin/shifts");
    await expect(page.getByRole("heading", { name: "শিফট" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const shiftCard = page
      .locator(".bn-card-center")
      .filter({ hasText: "দিন" })
      .first();
    await expect(shiftCard).toBeVisible();
    await expect(shiftCard.locator(".card__footer")).toHaveCSS(
      "justify-content",
      "center",
    );

    await page.goto("/admin/roles");
    await expectNoHorizontalOverflow(page);
    const roleCard = page
      .locator(".bn-card-center")
      .filter({ hasText: "Master Admin" })
      .first();
    await expect(roleCard).toBeVisible();
    await expect(roleCard.locator(".card__header")).toHaveCSS(
      "text-align",
      "center",
    );

    await page.getByRole("button", { name: "নতুন রোল" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.locator(".modal__header, [class*='modal__header']").first(),
    ).toHaveCSS("text-align", "center");
  });
});
