import { test, expect } from "@playwright/test";

// Contrast to the bypass: this spec walks the actual sign-in UI so we can
// point at both approaches side by side.
test.use({ storageState: { cookies: [], origins: [] } });

test("user can sign in through the UI", async ({ page }) => {
  test.setTimeout(20_000);

  const email = process.env.E2E_TEST_EMAIL!;
  const password = process.env.E2E_TEST_PASSWORD!;
  test.skip(!email || !password, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");

  await page.goto("/auth");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-submit").click();

  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.getByTestId("sign-out")).toBeVisible();
});
