import { test, expect } from "@playwright/test";

test("authed user can comment on a replay", async ({ page }) => {
  await page.goto("/replays");
  const firstCard = page.getByTestId(/^replay-card-/).first();
  await firstCard.click();

  await expect(page.getByTestId("comment-form")).toBeVisible();
  const body = `Great replay — ${Date.now()}`;
  await page.getByTestId("comment-body").fill(body);
  await page.getByTestId("comment-submit").click();

  await expect(page.locator('[data-testid="comment"]', { hasText: body })).toBeVisible();
});
