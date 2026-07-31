import type { Page } from "@playwright/test";

function isListReplaysServerFunction(url: URL) {
  if (!url.pathname.startsWith("/_serverFn/")) return false;

  try {
    const encodedHandler = url.pathname.slice("/_serverFn/".length);
    const handler = JSON.parse(Buffer.from(encodedHandler, "base64url").toString("utf8"));
    return (
      typeof handler.export === "string" &&
      handler.export.startsWith("listReplays_createServerFn_handler")
    );
  } catch {
    return false;
  }
}

export async function mockReplayList(page: Page) {
  let requests = 0;

  await page.route(
    (url) => isListReplaysServerFunction(url),
    async (route) => {
      requests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "x-playwright-mock": "replay-list" },
        // TanStack server functions return a middleware envelope; the client
        // unwraps `result` before React Query receives the replay array.
        json: { result: [], context: {} },
      });
    },
  );

  return {
    requestCount: () => requests,
  };
}
