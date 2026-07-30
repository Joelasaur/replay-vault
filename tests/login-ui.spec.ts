import { test, expect } from "@playwright/test";

// Contrast to the bypass: this spec walks the actual sign-in UI so we can
// point at both approaches side by side.
test.use({ storageState: { cookies: [], origins: [] } });

test("user can sign in through the UI", async ({ page }) => {
  test.setTimeout(45_000);

  const email = process.env.E2E_TEST_EMAIL!;
  const password = process.env.E2E_TEST_PASSWORD!;
  test.skip(!email || !password, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");

  await page.goto("/auth");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);

  // Supabase password login completes through this token endpoint. Start
  // listening before the click so a fast response cannot be missed.
  const signInResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/auth/v1/token") &&
      response.url().includes("grant_type=password"),
    { timeout: 30_000 },
  );
  await page.getByTestId("auth-submit").click();

  const signInResponse = await signInResponsePromise;
  expect(signInResponse.status(), "Supabase password sign-in should succeed").toBe(200);

  // A successful token response precedes the app's auth-state update and
  // redirect, so verify both user-visible effects before finishing the test.
  await expect(page.getByTestId("sign-out")).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/$/);
});
