import { test, expect } from "@playwright/test";
import { blockApplicationBackend } from "./mocks/backend-guard";
import { mockReplayList } from "./mocks/replays";
import { mockSupabasePasswordLogin } from "./mocks/supabase-auth";

// Contrast to the bypass: this spec walks the actual sign-in UI so we can
// point at both approaches side by side.
test.use({ storageState: { cookies: [], origins: [] } });

test("user can sign in through the UI", { tag: "@mocked" }, async ({ page }) => {
  test.setTimeout(45_000);

  const mocksEnabled = process.env.E2E_API_MOCKS === "true";
  const backendBlocked = process.env.E2E_BLOCK_BACKEND === "true";
  const isolatedUiMode = mocksEnabled || backendBlocked;
  const email = isolatedUiMode ? "mock.user@replayvault.test" : process.env.E2E_TEST_EMAIL!;
  const password = isolatedUiMode ? "mock-password" : process.env.E2E_TEST_PASSWORD!;
  test.skip(!isolatedUiMode && (!email || !password), "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");

  // Playwright checks the newest matching route first. Register the guard
  // before explicit mocks so a mock wins and every missing mock is blocked.
  const backendGuard = backendBlocked ? await blockApplicationBackend(page) : undefined;
  const authMock = mocksEnabled ? await mockSupabasePasswordLogin(page, email) : undefined;
  const replayListMock = mocksEnabled ? await mockReplayList(page) : undefined;

  await page.goto("/auth");
  const submitButton = page.getByTestId("auth-submit");

  // The server-rendered form is disabled until React hydrates. Filling its
  // controlled inputs earlier can be overwritten when hydration completes.
  await expect(submitButton).toBeEnabled({ timeout: 10_000 });

  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);

  // Supabase password login completes through this token endpoint. Start
  // listening before the click so a fast response cannot be missed.
  // We add this check so that CI can tell us exactly where the UI failed (i.e, the missed supabase api call)
  const signInResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/auth/v1/token") &&
      response.url().includes("grant_type=password"),
    { timeout: 30_000 },
  );
  await submitButton.click();

  const signInResponse = await signInResponsePromise;
  expect(signInResponse.status(), "Supabase password sign-in should succeed").toBe(200);
  if (authMock) {
    expect(signInResponse.headers()["x-playwright-mock"]).toBe("supabase-password-login");
    expect(authMock.passwordLoginRequestCount()).toBe(1);
    expect(authMock.unexpectedAuthRequests()).toEqual([]);
  }
  if (backendGuard) {
    expect(
      backendGuard.blockedRequestLabels(),
      "Every application-backend request should have an explicit mock",
    ).toEqual([]);
  }

  // A successful token response precedes the app's auth-state update and
  // redirect, so verify both user-visible effects before finishing the test.
  await expect(page.getByTestId("sign-out")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("user-email")).toHaveText(email);
  await expect(page).toHaveURL(/\/$/);
  if (replayListMock) {
    await expect
      .poll(replayListMock.requestCount, {
        message: "The post-login home page should load its mocked replay list",
      })
      .toBe(1);
  }
});
