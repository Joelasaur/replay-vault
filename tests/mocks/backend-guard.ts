import type { Page } from "@playwright/test";

type BlockedRequest = {
  method: string;
  resourceType: string;
  url: string;
};

/**
 * Blocks browser requests to the application's own backend so mocked tests
 * cannot accidentally fall through to real services. Supabase requests and
 * same-origin fetch/XHR calls are blocked, while page assets and unrelated
 * third parties remain available. Register this guard before explicit mocks
 * because Playwright gives the most recently registered matching route
 * precedence.
 */
export async function blockApplicationBackend(page: Page) {
  const appOrigin = new URL(process.env.E2E_BASE_URL ?? "http://localhost:8080").origin;
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : undefined;
  const blockedRequests: BlockedRequest[] = [];

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const isBrowserApiRequest = ["fetch", "xhr"].includes(request.resourceType());
    const isAppBackendRequest = url.origin === appOrigin && isBrowserApiRequest;
    const isSupabaseRequest = url.origin === supabaseOrigin;

    if (!isAppBackendRequest && !isSupabaseRequest) {
      await route.fallback();
      return;
    }

    blockedRequests.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url: request.url(),
    });
    console.error(
      `[backend blocked] ${request.method()} ${url.pathname}${url.search} (${request.resourceType()})`,
    );
    await route.abort("blockedbyclient");
  });

  return {
    blockedRequests: () => blockedRequests,
    blockedRequestLabels: () =>
      blockedRequests.map(({ method, resourceType, url }) => {
        const parsedUrl = new URL(url);
        return `${method} ${parsedUrl.pathname}${parsedUrl.search} (${resourceType})`;
      }),
  };
}
