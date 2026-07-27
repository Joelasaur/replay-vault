import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listReplays } from "@/lib/replays.functions";
import { ReplayCard } from "@/components/ReplayCard";
import { DIVISIONS, RANKS, suggestReplayRank, type Rank } from "@/lib/replays";

const latestQuery = queryOptions({
  queryKey: ["replays", "latest"],
  queryFn: () => listReplays({ data: { limit: 8 } }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReplayVault — Learn Overwatch from replays at your rank" },
      {
        name: "description",
        content:
          "Find Overwatch replay codes shared by players one tier above yours. Filter by role, rank, hero, and map.",
      },
      { property: "og:title", content: "ReplayVault — Overwatch replay codes" },
      {
        property: "og:description",
        content: "Learn from replays one rank above yours. Tank, Damage, and Support.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(latestQuery),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(latestQuery);
  const [rank, setRank] = useState<Rank>("Gold");
  const [division, setDivision] = useState<number>(3);
  const suggested = suggestReplayRank(rank);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-14">
      <section className="grid gap-10 md:grid-cols-2 items-center">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            Study replays{" "}
            <span style={{ color: "var(--color-primary)" }}>one rank above</span> yours.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            A community-curated library of Overwatch replay codes. Filter by role, rank, hero, and
            map — then paste the code into Overwatch's replay viewer.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/replays"
              data-testid="cta-browse"
              className="rounded-md px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }}
            >
              Browse replays
            </Link>
            <Link
              to="/replays/new"
              data-testid="cta-submit"
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-2"
            >
              Submit a replay
            </Link>
          </div>
        </div>

        <div
          data-testid="rank-suggester"
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <h2 className="font-display text-lg font-semibold mb-4">Find replays for my rank</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-xs text-muted-foreground mb-1">Your rank</span>
              <select
                data-testid="my-rank"
                value={rank}
                onChange={(e) => setRank(e.target.value as Rank)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-xs text-muted-foreground mb-1">Your division</span>
              <select
                data-testid="my-division"
                value={division}
                onChange={(e) => setDivision(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            We suggest watching replays from{" "}
            <span
              data-testid="suggested-rank"
              className="font-semibold"
              style={{ color: "var(--color-accent)" }}
            >
              {suggested} {division}
            </span>
            .
          </p>
          <Link
            to="/replays"
            search={{ rank: suggested, division }}
            data-testid="go-suggested"
            className="mt-4 inline-block rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-foreground)",
            }}
          >
            Show me {suggested} {division} replays →
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold">Latest replays</h2>
          <Link to="/replays" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>
        <div data-testid="latest-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.replays.map((r) => (
            <ReplayCard key={r.id} replay={r} />
          ))}
        </div>
      </section>
    </div>
  );
}
