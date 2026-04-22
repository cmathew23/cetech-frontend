import type { Page } from "@playwright/test";

export async function mockOnboardingGetStatus(
  page: Page,
  body: object,
): Promise<void> {
  await page.route("**/onboarding/status", async (route) => {
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

export async function unmockOnboardingRoutes(page: Page): Promise<void> {
  await page.unroute("**/onboarding/status");
}
