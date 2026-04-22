import type { Page } from "@playwright/test";

/** Dashboard sidebars use a shared logout confirmation dialog (Yes / Cancel). */
export async function clickLogoutAndConfirm(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^logout$/i }).first().click();
  await page.getByRole("button", { name: /^yes$/i }).click();
}
