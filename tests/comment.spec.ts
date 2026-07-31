import { test, expect } from "./fixtures";

test.use({ authenticated: true });

test("authed user can comment on a replay", { tag: "@mocked" }, async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("sign-out")).toBeVisible();
  await page.getByTestId("nav-replays").click();
  const firstCard = page.getByTestId(/^replay-card-/).first();
  await firstCard.click();

  await expect(page.getByTestId("comment-form")).toBeVisible();
  const body = `Great replay — ${Date.now()}`;
  await page.getByTestId("comment-body").fill(body);
  await page.getByTestId("comment-submit").click();

  await expect(page.locator('[data-testid="comment"]', { hasText: body })).toBeVisible();
});
