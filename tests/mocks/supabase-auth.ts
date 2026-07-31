import type { Page } from "@playwright/test";

const MOCK_USER_ID = "00000000-0000-4000-8000-000000000001";

function base64Url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function mockAccessToken(email: string, expiresAt: number) {
  return [
    base64Url({ alg: "HS256", typ: "JWT" }),
    base64Url({
      aud: "authenticated",
      exp: expiresAt,
      iat: expiresAt - 3600,
      role: "authenticated",
      sub: MOCK_USER_ID,
      email,
    }),
    "mock-signature",
  ].join(".");
}

export async function mockSupabasePasswordLogin(page: Page, email: string) {
  let passwordLoginRequests = 0;
  const unexpectedAuthRequests: string[] = [];

  await page.route(
    (url) => url.pathname.startsWith("/auth/v1/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const isPasswordLogin =
        request.method() === "POST" &&
        url.pathname.endsWith("/auth/v1/token") &&
        url.searchParams.get("grant_type") === "password";

      if (!isPasswordLogin) {
        unexpectedAuthRequests.push(`${request.method()} ${url.pathname}${url.search}`);
        await route.abort("blockedbyclient");
        return;
      }

      passwordLoginRequests += 1;
      const now = new Date().toISOString();
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "x-playwright-mock": "supabase-password-login" },
        body: JSON.stringify({
          access_token: mockAccessToken(email, expiresAt),
          token_type: "bearer",
          expires_in: 3600,
          expires_at: expiresAt,
          refresh_token: "mock-refresh-token",
          user: {
            id: MOCK_USER_ID,
            aud: "authenticated",
            role: "authenticated",
            email,
            email_confirmed_at: now,
            phone: "",
            confirmed_at: now,
            last_sign_in_at: now,
            app_metadata: {
              provider: "email",
              providers: ["email"],
            },
            user_metadata: {
              email,
              email_verified: true,
              phone_verified: false,
              sub: MOCK_USER_ID,
            },
            identities: [],
            created_at: now,
            updated_at: now,
            is_anonymous: false,
          },
        }),
      });
    },
  );

  return {
    passwordLoginRequestCount: () => passwordLoginRequests,
    unexpectedAuthRequests: () => unexpectedAuthRequests,
  };
}
