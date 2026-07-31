import { test, expect } from "./fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test("filter state is deep-linkable", { tag: "@mocked" }, async ({ page }) => {
  await page.goto("/replays?rank=Master&division=1");
  await expect(page.getByTestId("filter-rank")).toHaveValue("Master");
  await expect(page.getByTestId("filter-division")).toHaveValue("1");
});
