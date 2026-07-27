import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { listReplays } from "@/lib/replays.functions";
import { ReplayCard } from "@/components/ReplayCard";
import { ALL_HEROES, MAPS, RANKS, ROLES, DIVISIONS } from "@/lib/replays";

const searchSchema = z.object({
  role: z.string().optional(),
  hero: z.string().optional(),
  rank: z.string().optional(),
  division: z.coerce.number().int().min(1).max(5).optional(),
  map: z.string().optional(),
  result: z.enum(["Win", "Loss"]).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/replays")({
  head: () => ({
    meta: [
      { title: "Browse replays — ReplayVault" },
      {
        name: "description",
        content: "Filter Overwatch replay codes by role, rank, division, hero, map, and result.",
      },
      { property: "og:title", content: "Browse Overwatch replays" },
      {
        property: "og:description",
        content: "Filter Overwatch replay codes by role, rank, division, hero, map, and result.",
      },
    ],
  }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["replays", "list", deps],
        queryFn: () => listReplays({ data: deps }),
      }),
    ),
  component: Browse,
});

function Browse() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/replays" });
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["replays", "list", search],
      queryFn: () => listReplays({ data: search }),
    }),
  );

  function update(patch: Record<string, string | number | undefined>) {
    navigate({
      search: (prev) => {
        const next = { ...prev, ...patch };
        for (const k of Object.keys(next)) {
          const v = (next as Record<string, unknown>)[k];
          if (v === "" || v === undefined) delete (next as Record<string, unknown>)[k];
        }
        return next;
      },
    });
  }

  const selectCls =
    "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Browse replays</h1>
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside
          data-testid="filters"
          className="rounded-xl border border-border bg-surface p-4 h-fit space-y-3"
        >
          <FilterRow label="Role">
            <select
              data-testid="filter-role"
              value={search.role ?? ""}
              onChange={(e) => update({ role: e.target.value || undefined, hero: undefined })}
              className={selectCls}
            >
              <option value="">Any</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FilterRow>
          <FilterRow label="Hero">
            <select
              data-testid="filter-hero"
              value={search.hero ?? ""}
              onChange={(e) => update({ hero: e.target.value || undefined })}
              className={selectCls}
            >
              <option value="">Any</option>
              {ALL_HEROES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </FilterRow>
          <FilterRow label="Rank">
            <select
              data-testid="filter-rank"
              value={search.rank ?? ""}
              onChange={(e) => update({ rank: e.target.value || undefined })}
              className={selectCls}
            >
              <option value="">Any</option>
              {RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FilterRow>
          <FilterRow label="Division">
            <select
              data-testid="filter-division"
              value={search.division ?? ""}
              onChange={(e) =>
                update({ division: e.target.value ? Number(e.target.value) : undefined })
              }
              className={selectCls}
            >
              <option value="">Any</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </FilterRow>
          <FilterRow label="Map">
            <select
              data-testid="filter-map"
              value={search.map ?? ""}
              onChange={(e) => update({ map: e.target.value || undefined })}
              className={selectCls}
            >
              <option value="">Any</option>
              {MAPS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FilterRow>
          <FilterRow label="Result">
            <select
              data-testid="filter-result"
              value={search.result ?? ""}
              onChange={(e) =>
                update({ result: (e.target.value as "Win" | "Loss") || undefined })
              }
              className={selectCls}
            >
              <option value="">Any</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
            </select>
          </FilterRow>
          <FilterRow label="Search">
            <input
              data-testid="filter-search"
              type="text"
              placeholder="notes, IGN, code"
              value={search.q ?? ""}
              onChange={(e) => update({ q: e.target.value || undefined })}
              className={selectCls}
            />
          </FilterRow>
          <button
            data-testid="filter-clear"
            onClick={() => navigate({ search: {} })}
            className="w-full rounded-md border border-border px-2 py-1.5 text-xs hover:bg-surface-2"
          >
            Clear filters
          </button>
        </aside>

        <section>
          <div className="mb-3 text-sm text-muted-foreground" data-testid="results-count">
            {data.replays.length} {data.replays.length === 1 ? "replay" : "replays"}
          </div>
          {data.replays.length === 0 ? (
            <div
              data-testid="empty-state"
              className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground"
            >
              No replays match these filters yet.
            </div>
          ) : (
            <div data-testid="replay-grid" className="grid gap-4 sm:grid-cols-2">
              {data.replays.map((r) => (
                <ReplayCard key={r.id} replay={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
