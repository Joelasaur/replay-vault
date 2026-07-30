import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Sign in through the application UI, then persist the resulting storage
 * state for every authenticated spec. This keeps UI authentication covered
 * without issuing a second password grant for the same test account.
 */

const AUTH_FILE = path.join("playwright", ".auth", "user.json");

setup("authenticate test user through the UI", async ({ page }) => {
  const EMAIL = process.env.E2E_TEST_EMAIL;
  const PASSWORD = process.env.E2E_TEST_PASSWORD;

  if (!EMAIL || !PASSWORD) {
    throw new Error("Missing env: E2E_TEST_EMAIL, E2E_TEST_PASSWORD. See README > Playwright.");
  }

  await page.goto("/auth");
  await page.getByTestId("auth-email").fill(EMAIL);
  await page.getByTestId("auth-password").fill(PASSWORD);
  await page.getByTestId("auth-submit").click();

  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.getByTestId("sign-out")).toBeVisible({ timeout: 10_000 });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
