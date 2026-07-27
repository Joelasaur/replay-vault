import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("filter state is deep-linkable", async ({ page }) => {
  await page.goto("/replays?rank=Master&division=1");
  await expect(page.getByTestId("filter-rank")).toHaveValue("Master");
  await expect(page.getByTestId("filter-division")).toHaveValue("1");
});
