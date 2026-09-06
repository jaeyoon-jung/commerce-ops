import { expect, test } from "@playwright/test";

test.describe("scaffold smoke", () => {
  test("redirects the bare root to the default Japanese locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ja$/);
  });

  test("renders Japanese content and a shadcn component", async ({ page }) => {
    await page.goto("/ja");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("コマースオペレーション");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");

    // The shadcn Button renders through Base UI's `render` prop as a link.
    const button = page.locator('[data-slot="button"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveText("ヘルスチェック");
  });

  test("renders Korean content on the ko locale", async ({ page }) => {
    await page.goto("/ko");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("커머스 운영");
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
    await expect(page.locator('[data-slot="button"]')).toHaveText("헬스 체크");
  });

  test("404s on an unsupported locale", async ({ page }) => {
    // next-intl treats an unknown first segment as a path, not a locale, so
    // this lands on /ja/fr and 404s there.
    const response = await page.goto("/fr");
    expect(response?.status()).toBe(404);
  });

  test("reports a reachable database and the seeded journey stages", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      database: "reachable",
      journeyStages: 8,
    });
  });
});
