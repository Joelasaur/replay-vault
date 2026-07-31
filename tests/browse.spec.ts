import { test, expect } from "./fixtures";

// Public browse — no login needed. Reset storage state so we test the anon path.
test.use({ storageState: { cookies: [], origins: [] } });

test("anonymous user can browse and filter replays", { tag: "@mocked" }, async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("nav-signin")).toBeVisible();
  await page.getByTestId("nav-replays").click();
  await expect(page.getByTestId("filters")).toBeVisible();
  await expect(page.getByTestId("replay-grid")).toBeVisible();

  await page.getByTestId("filter-role").selectOption("Support");
  await expect(page.getByTestId("results-count")).toContainText(/replay/);

  // All visible role badges should now be Support.
  const badges = page.locator('[data-testid="role-badge-Support"]');
  await expect(badges.first()).toBeVisible();
});

test("submit link redirects anonymous users to auth", { tag: "@mocked" }, async ({ page }) => {
  await page.goto("/replays/new");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByTestId("auth-form")).toBeVisible();
});
