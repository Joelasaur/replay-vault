import { test as setup, expect, request } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { mockSession, supabaseStorageKey } from "./mocks/supabase-auth";

/**
 * Programmatic login → storage state.
 *
 * We POST directly to Supabase's token endpoint with the test user's
 * email + password, then write the resulting session JSON into the browser
 * context's localStorage under the key the Supabase JS client reads
 * (`sb-<project-ref>-auth-token`). Every other spec picks up this storage
 * state and starts already-signed-in — no login UI, no shared cookie
 * flakiness, and any spec can be run in isolation.
 */

const AUTH_FILE = path.join("playwright", ".auth", "user.json");

setup("authenticate test user via Supabase token endpoint", async ({ browser }) => {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  const EMAIL = process.env.E2E_TEST_EMAIL;
  const PASSWORD = process.env.E2E_TEST_PASSWORD;
  const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
  const isolatedUiMode =
    process.env.E2E_API_MOCKS === "true" || process.env.E2E_BLOCK_BACKEND === "true";

  if (!SUPABASE_URL) {
    throw new Error("Missing VITE_SUPABASE_URL / SUPABASE_URL. See README > Playwright.");
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  if (isolatedUiMode) {
    // Mocked and backend-blocked runs use the same committed synthetic session
    // as the auth route mocks. No browser or backend request is needed.
    fs.writeFileSync(
      AUTH_FILE,
      JSON.stringify({
        cookies: [],
        origins: [
          {
            origin: new URL(BASE_URL).origin,
            localStorage: [
              {
                name: supabaseStorageKey(SUPABASE_URL),
                value: JSON.stringify(mockSession()),
              },
            ],
          },
        ],
      }),
    );
    return;
  }

  if (!SUPABASE_KEY || !EMAIL || !PASSWORD) {
    throw new Error(
      "Missing env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, E2E_TEST_EMAIL, E2E_TEST_PASSWORD. See README > Playwright.",
    );
  }

  const storageKey = supabaseStorageKey(SUPABASE_URL);

  // 1. Exchange credentials for a session directly with Supabase Auth.
  const api = await request.newContext();
  const res = await api.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(res.ok(), `Token exchange failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const session = await res.json();

  // Supabase JS stores this exact shape under sb-<ref>-auth-token.
  const stored = {
    access_token: session.access_token,
    token_type: session.token_type ?? "bearer",
    expires_in: session.expires_in,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
    refresh_token: session.refresh_token,
    user: session.user,
  };

  // 2. Boot a browser, inject the session into localStorage before the app runs.
  const context = await browser.newContext();
  await context.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: storageKey, value: JSON.stringify(stored) },
  );

  const page = await context.newPage();
  await page.goto(BASE_URL);

  // 3. Verify the header now shows a signed-in state, then persist storage state.
  await expect(page.getByTestId("sign-out")).toBeVisible({ timeout: 10_000 });

  await context.storageState({ path: AUTH_FILE });
  await context.close();
});
