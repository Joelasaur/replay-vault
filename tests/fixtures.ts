import { test as base, expect } from "@playwright/test";
import { blockApplicationBackend } from "./mocks/backend-guard";
import { mockReplayApi } from "./mocks/replays";
import { mockSupabaseCurrentUser, mockSupabasePasswordLogin } from "./mocks/supabase-auth";

type ReplayVaultFixtures = {
  authenticated: boolean;
  backendControls: void;
  testCredentials: {
    email: string;
    password: string;
  };
};

export const test = base.extend<ReplayVaultFixtures>({
  authenticated: [false, { option: true }],

  // Playwright fixtures require the first (possibly empty) fixture argument.
  // eslint-disable-next-line no-empty-pattern
  testCredentials: async ({}, provide) => {
    const isolatedUiMode =
      process.env.E2E_API_MOCKS === "true" || process.env.E2E_BLOCK_BACKEND === "true";
    const email = isolatedUiMode ? "mock.user@replayvault.test" : process.env.E2E_TEST_EMAIL;
    const password = isolatedUiMode ? "mock-password" : process.env.E2E_TEST_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set. See README > Playwright.");
    }

    await provide({ email, password });
  },

  backendControls: [
    async ({ authenticated, page, testCredentials }, runTest) => {
      // Register the fallback first because Playwright checks the newest
      // matching route first, allowing explicit mocks to take precedence.
      if (process.env.E2E_BLOCK_BACKEND === "true") {
        await blockApplicationBackend(page);
      }

      if (process.env.E2E_API_MOCKS === "true") {
        if (authenticated) {
          await mockSupabaseCurrentUser(page, testCredentials.email);
        }
        await mockSupabasePasswordLogin(page, testCredentials.email);
        await mockReplayApi(page);
      }

      await runTest();
    },
    { auto: true },
  ],
});

export { expect };
