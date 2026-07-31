import { test, expect } from "./fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test(
  "anonymous user can get a suggested filter for replays from the landing page",
  { tag: "@mocked" },
  async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("nav-signin")).toBeVisible();
    await page.getByTestId("my-rank").selectOption("Bronze");
    await page.getByTestId("my-division").selectOption("2");

    await expect(page.getByTestId("go-suggested")).toContainText("Show me Silver 2 replays");
    await page.getByTestId("go-suggested").click();
    // Playwright doesn't support asserting on url substrings for some reason
    await expect(page).toHaveURL((url) => url.pathname === "/replays");
    const selectedRankOption = page.getByTestId("filter-rank").locator("option:checked");
    await expect(selectedRankOption).toHaveText("Silver");

    // Get the list of replay cards, it should be exactly 1
    // This assertion can be flaky if we don't have control over the data in the website
    // Would require either mocking or seeding our own test db
    const cards = page.locator('[data-testid^="replay-card-"]');
    await expect(cards).toHaveCount(1);

    await expect(page.getByTestId("rank-badge-Silver-2")).toHaveText("Silver 2");
  },
);
