import { test, expect } from "@playwright/test";

// Uses the storage state produced by auth.setup.ts — no login UI touched.
test("authed user can submit a replay without visiting /auth", async ({ page }) => {
  await page.goto("/replays/new");
  await expect(page.getByTestId("new-replay-form")).toBeVisible();

  const code = `E2E${Date.now().toString(36).toUpperCase()}`.slice(0, 15);
  await page.getByTestId("new-role").selectOption("Damage");
  await page.getByTestId("new-hero").selectOption("Tracer");
  await page.getByTestId("new-rank").selectOption("Diamond");
  await page.getByTestId("new-division").selectOption("3");
  await page.getByTestId("new-code").fill(code);
  await page.getByTestId("new-map").selectOption("Ilios");
  await page.getByTestId("new-result").selectOption("Win");
  await page.getByTestId("new-notes").fill("E2E-created replay.");

  await page.getByTestId("new-submit").click();

  await expect(page).toHaveURL(/\/replays\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("detail-code")).toHaveText(code);
});
