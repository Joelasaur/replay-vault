import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getReplay, createComment } from "@/lib/replays.functions";
import { RankBadge, ResultBadge, RoleBadge } from "@/components/Badges";
import type { Rank, Role } from "@/lib/replays";
import { useAuth } from "@/lib/auth-context";

const replayQuery = (id: string) =>
  queryOptions({
    queryKey: ["replay", id],
    queryFn: () => getReplay({ data: { id } }),
  });

export const Route = createFileRoute("/replays/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Replay ${params.id.slice(0, 8)} — ReplayVault` },
      { name: "description", content: "View an Overwatch replay code and community comments." },
      { property: "og:title", content: "Overwatch replay — ReplayVault" },
      { property: "og:description", content: "View an Overwatch replay code and comments." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(replayQuery(params.id)),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(replayQuery(id));
  const r = data.replay;
  const [body, setBody] = useState("");
  const { user } = useAuth();
  const submitComment = useServerFn(createComment);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => submitComment({ data: { replay_id: id, body } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["replay", id] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <Link to="/replays" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to browse
      </Link>

      <article
        data-testid="replay-detail"
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <RoleBadge role={r.role as Role} />
          <RankBadge rank={r.rank as Rank} division={r.division} />
          <ResultBadge result={r.result as "Win" | "Loss"} />
          <span className="ml-auto text-sm text-muted-foreground">{r.map}</span>
        </div>
        <h1 className="font-display text-3xl font-bold">{r.hero}</h1>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs uppercase text-muted-foreground">Replay code</span>
          <code
            data-testid="detail-code"
            className="font-mono text-lg px-3 py-1 rounded-lg bg-surface-2 border border-border"
          >
            {r.replay_code}
          </code>
        </div>
        {r.notes ? <p className="mt-4 text-sm leading-relaxed">{r.notes}</p> : null}
        <p className="mt-4 text-xs text-muted-foreground">Submitted by {r.submitter_ign}</p>
      </article>

      <section data-testid="comments-section">
        <h2 className="font-display text-xl font-semibold mb-3">
          Comments ({data.comments.length})
        </h2>
        <ul className="space-y-3">
          {data.comments.map((c) => (
            <li
              key={c.id}
              data-testid="comment"
              className="rounded-lg border border-border bg-surface p-3"
            >
              <div className="text-xs text-muted-foreground mb-1">{c.author_ign}</div>
              <p className="text-sm">{c.body}</p>
            </li>
          ))}
          {data.comments.length === 0 ? (
            <li data-testid="comments-empty" className="text-sm text-muted-foreground">
              No comments yet.
            </li>
          ) : null}
        </ul>

        {user ? (
          <form
            data-testid="comment-form"
            className="mt-6 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (body.trim().length === 0) return;
              mutation.mutate();
            }}
          >
            <textarea
              data-testid="comment-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Share what stood out to you in this replay…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {mutation.error ? (
              <p role="alert" data-testid="comment-error" className="text-xs text-destructive">
                {(mutation.error as Error).message}
              </p>
            ) : null}
            <button
              type="submit"
              data-testid="comment-submit"
              disabled={mutation.isPending || body.trim().length === 0}
              className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }}
            >
              {mutation.isPending ? "Posting…" : "Post comment"}
            </button>
          </form>
        ) : (
          <div
            data-testid="comment-signin-cta"
            className="mt-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground"
          >
            <Link to="/auth" className="underline text-foreground">
              Sign in
            </Link>{" "}
            to leave a comment.
          </div>
        )}
      </section>
    </div>
  );
}
