import type { Page, Request } from "@playwright/test";

const SEEDED_REPLAY_ID = "10000000-0000-4000-8000-000000000001";
const CREATED_REPLAY_ID = "20000000-0000-4000-8000-000000000001";
const MOCK_RESPONSE_HEADERS = {
  "cache-control": "no-store",
  "x-playwright-mock": "replay-api",
};

type Replay = {
  id: string;
  role: string;
  hero: string;
  rank: string;
  division: number;
  replay_code: string;
  map: string;
  result: string;
  notes: string;
  submitter_id: string;
  submitter_ign: string;
  created_at: string;
};

type Comment = {
  id: string;
  author_ign: string;
  body: string;
  created_at: string;
};

function serverFunctionName(url: URL) {
  if (!url.pathname.startsWith("/_serverFn/")) return undefined;
  try {
    const encodedHandler = url.pathname.slice("/_serverFn/".length);
    return JSON.parse(Buffer.from(encodedHandler, "base64url").toString("utf8")).export as string;
  } catch {
    return undefined;
  }
}

function decodeSeroval(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const node = value as {
    t?: number;
    s?: string | number;
    a?: unknown[];
    p?: { k?: string[]; v?: unknown[] };
  };

  if (node.t === 0) return Number(node.s);
  if (node.t === 1) return String(node.s);
  if (node.t === 2) return undefined;
  if (node.t === 9) return (node.a ?? []).map(decodeSeroval);
  if (node.t === 10) {
    return Object.fromEntries(
      (node.p?.k ?? []).map((key, index) => [key, decodeSeroval(node.p?.v?.[index])]),
    );
  }
  return undefined;
}

function requestData(request: Request) {
  const url = new URL(request.url());
  const raw =
    request.method() === "GET" ? url.searchParams.get("payload") : request.postData() || undefined;
  if (!raw) return {};

  const payload = JSON.parse(raw) as { t?: unknown };
  const decoded = decodeSeroval(payload.t) as { data?: Record<string, unknown> };
  return decoded?.data ?? {};
}

function serverFunctionResponse(result: unknown) {
  return { result, context: {} };
}

export async function mockReplayApi(page: Page) {
  const now = "2026-01-01T00:00:00.000Z";
  const replays = new Map<string, Replay>([
    [
      SEEDED_REPLAY_ID,
      {
        id: SEEDED_REPLAY_ID,
        role: "Support",
        hero: "Ana",
        rank: "Master",
        division: 1,
        replay_code: "MOCK01",
        map: "Ilios",
        result: "Win",
        notes: "Mocked replay for isolated UI tests.",
        submitter_id: "00000000-0000-4000-8000-000000000001",
        submitter_ign: "MockPlayer",
        created_at: now,
      },
    ],
  ]);
  const comments = new Map<string, Comment[]>([[SEEDED_REPLAY_ID, []]]);

  await page.route(
    (url) => serverFunctionName(url)?.startsWith("listReplays_createServerFn_handler") ?? false,
    async (route) => {
      const filters = requestData(route.request());
      const filtered = [...replays.values()].filter((replay) =>
        Object.entries(filters).every(([key, value]) => {
          if (key === "limit" || value === undefined) return true;
          return replay[key as keyof Replay] === value;
        }),
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: MOCK_RESPONSE_HEADERS,
        json: serverFunctionResponse({ replays: filtered }),
      });
    },
  );

  await page.route(
    (url) => serverFunctionName(url)?.startsWith("getReplay_createServerFn_handler") ?? false,
    async (route) => {
      const { id } = requestData(route.request()) as { id?: string };
      const replay = (id && replays.get(id)) ?? replays.get(SEEDED_REPLAY_ID);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: MOCK_RESPONSE_HEADERS,
        json: serverFunctionResponse({
          replay,
          comments: comments.get(replay?.id ?? "") ?? [],
        }),
      });
    },
  );

  await page.route(
    (url) => serverFunctionName(url)?.startsWith("createReplay_createServerFn_handler") ?? false,
    async (route) => {
      const data = requestData(route.request()) as Omit<
        Replay,
        "id" | "submitter_id" | "submitter_ign" | "created_at"
      >;
      replays.set(CREATED_REPLAY_ID, {
        ...data,
        id: CREATED_REPLAY_ID,
        submitter_id: "00000000-0000-4000-8000-000000000001",
        submitter_ign: "MockPlayer",
        created_at: now,
      });
      comments.set(CREATED_REPLAY_ID, []);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: MOCK_RESPONSE_HEADERS,
        json: serverFunctionResponse({ id: CREATED_REPLAY_ID }),
      });
    },
  );

  await page.route(
    (url) => serverFunctionName(url)?.startsWith("createComment_createServerFn_handler") ?? false,
    async (route) => {
      const data = requestData(route.request()) as { replay_id: string; body: string };
      const comment = {
        id: "30000000-0000-4000-8000-000000000001",
        author_ign: "MockPlayer",
        body: data.body,
        created_at: now,
      };
      comments.set(data.replay_id, [...(comments.get(data.replay_id) ?? []), comment]);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: MOCK_RESPONSE_HEADERS,
        json: serverFunctionResponse({ comment }),
      });
    },
  );
}
