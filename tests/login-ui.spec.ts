import { test, expect } from "@playwright/test";

test("UI-authenticated session is available to browser tests", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("sign-out")).toBeVisible();
});
