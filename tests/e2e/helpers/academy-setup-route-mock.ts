import type { Page } from "@playwright/test";

export async function mockAcademySetupPost(
  page: Page,
  body: object,
  status = 200,
): Promise<void> {
  await page.route("**/onboarding/academy-setup", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

export async function unmockAcademySetupPost(page: Page): Promise<void> {
  await page.unroute("**/onboarding/academy-setup");
}
