import { expect, test, type Page } from "@playwright/test";

async function fillRegistrationFields(
  page: Page,
  values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  },
) {
  await page.getByLabel("Email").fill(values.email);
  await page.getByLabel("Password").fill(values.password);
  await page.getByLabel("First Name").fill(values.firstName);
  await page.getByLabel("Last Name").fill(values.lastName);
}

async function mockRegisterPost(page: Page, captured: { body: unknown }) {
  await page.route("**/auth/register", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    captured.body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "user-1",
            email: "new@example.com",
            roles: ["ATHLETE"],
          },
        },
      }),
    });
  });
}

async function mockCreateAcademyAdminPost(
  page: Page,
  captured: { body: unknown },
  options?: { status?: number; message?: string },
) {
  await page.route("**/auth/create/academy-admin", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    captured.body = route.request().postDataJSON();
    const status = options?.status ?? 200;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(
        status >= 200 && status < 300
          ? { success: true }
          : { success: false, message: options?.message ?? "Setup failed" },
      ),
    });
  });
}

test.describe("ordinary /register roles", () => {
  test("exposes ATHLETE and COACH and does not expose ACADEMY_ADMIN", async ({
    page,
  }) => {
    await page.goto("/register");
    const roleSelect = page.getByLabel("Role");
    await expect(roleSelect).toBeVisible();
    const optionTexts = await roleSelect.locator("option").allTextContents();
    expect(optionTexts).toContain("ATHLETE");
    expect(optionTexts).toContain("COACH");
    expect(optionTexts).not.toContain("ACADEMY_ADMIN");
    expect(optionTexts).not.toContain("ACADEMY ADMIN");
    await expect(roleSelect.locator('option[value="ACADEMY_ADMIN"]')).toHaveCount(
      0,
    );
  });

  test("Athlete registration still posts ATHLETE and does not change other fields", async ({
    page,
  }) => {
    const captured: { body: unknown } = { body: null };
    await mockRegisterPost(page, captured);
    await page.goto("/register");
    await fillRegistrationFields(page, {
      email: "athlete@example.com",
      password: "secret1",
      firstName: "Pat",
      lastName: "Athlete",
    });
    await page.getByLabel("Role").selectOption("ATHLETE");
    await page.getByRole("button", { name: /^Register$/ }).click();
    await expect
      .poll(() => captured.body)
      .toEqual({
        email: "athlete@example.com",
        password: "secret1",
        firstName: "Pat",
        lastName: "Athlete",
        role: "ATHLETE",
      });
    await expect(page.getByText("Account created successfully.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test("Coach registration still posts COACH and does not change other fields", async ({
    page,
  }) => {
    const captured: { body: unknown } = { body: null };
    await mockRegisterPost(page, captured);
    await page.goto("/register");
    await fillRegistrationFields(page, {
      email: "coach@example.com",
      password: "secret1",
      firstName: "Casey",
      lastName: "Coach",
    });
    await page.getByLabel("Role").selectOption("COACH");
    await page.getByRole("button", { name: /^Register$/ }).click();
    await expect
      .poll(() => captured.body)
      .toEqual({
        email: "coach@example.com",
        password: "secret1",
        firstName: "Casey",
        lastName: "Coach",
        role: "COACH",
      });
    await expect(page.getByText("Account created successfully.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});

test.describe("Academy Admin setup /create/academy-admin", () => {
  test("reads token from the query string and posts setup fields without role", async ({
    page,
  }) => {
    const captured: { body: unknown } = { body: null };
    await mockCreateAcademyAdminPost(page, captured);
    await page.goto("/create/academy-admin?token=setup-token-1");
    await expect(page.getByLabel("Role")).toHaveCount(0);
    await fillRegistrationFields(page, {
      email: "admin@example.com",
      password: "secret1",
      firstName: "Ada",
      lastName: "Admin",
    });
    await page.getByRole("button", { name: /^Register$/ }).click();
    await expect
      .poll(() => captured.body)
      .toEqual({
        setupToken: "setup-token-1",
        email: "admin@example.com",
        password: "secret1",
        firstName: "Ada",
        lastName: "Admin",
      });
    expect(captured.body).not.toHaveProperty("role");
    await expect(page.getByText("Account created successfully.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/, { timeout: 5_000 });
  });

  test("missing token prevents valid submission", async ({ page }) => {
    const captured: { body: unknown } = { body: null };
    await mockCreateAcademyAdminPost(page, captured);
    await page.goto("/create/academy-admin");
    await expect(
      page.getByText("This setup link is invalid or incomplete."),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Register$/ })).toHaveCount(0);
    expect(captured.body).toBeNull();
  });

  test("backend setup errors are displayed with the existing alert pattern", async ({
    page,
  }) => {
    const captured: { body: unknown } = { body: null };
    await mockCreateAcademyAdminPost(page, captured, {
      status: 400,
      message: "This setup token is invalid or has already been used.",
    });
    await page.goto("/create/academy-admin?token=used-token");
    await fillRegistrationFields(page, {
      email: "admin@example.com",
      password: "secret1",
      firstName: "Ada",
      lastName: "Admin",
    });
    await page.getByRole("button", { name: /^Register$/ }).click();
    await expect(
      page.getByText("This setup token is invalid or has already been used."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/create\/academy-admin/);
  });
});

test.describe("existing /login", () => {
  test("login page is unchanged: email, password, sign in, no role selector", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel("Role")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /create one/i })).toBeVisible();
  });
});
