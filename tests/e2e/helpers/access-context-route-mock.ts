import type { Page } from "@playwright/test";

/** Intercept GET /me/app-context (glob pattern ends with me/app-context). */
export async function mockAccessContextGet(
  page: Page,
  body: object,
): Promise<void> {
  await page.route("**/me/app-context", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

export async function unmockAccessContext(page: Page): Promise<void> {
  await page.unroute("**/me/app-context");
}
