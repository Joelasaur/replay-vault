import { Link } from "@tanstack/react-router";
import { RankBadge, RankIcon, ResultBadge, RoleBadge } from "./Badges";
import type { Rank, Role } from "@/lib/replays";

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
  submitter_ign: string;
};

export function ReplayCard({ replay }: { replay: Replay }) {
  return (
    <Link
      to="/replays/$id"
      params={{ id: replay.id }}
      data-testid={`replay-card-${replay.replay_code}`}
      className="block rounded-xl border border-border bg-surface p-4 hover:bg-surface-2 transition-colors"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <RoleBadge role={replay.role as Role} />
        <RankBadge rank={replay.rank as Rank} division={replay.division} />
        <ResultBadge result={replay.result as "Win" | "Loss"} />
        <span className="ml-auto text-xs text-muted-foreground">{replay.map}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <RankIcon rank={replay.rank as Rank} division={replay.division} />
          <div className="truncate font-display text-lg font-semibold">{replay.hero}</div>
        </div>
        <code
          data-testid="replay-code"
          className="shrink-0 text-sm font-mono px-2 py-0.5 rounded bg-surface-2 border border-border"
        >
          {replay.replay_code}
        </code>
      </div>
      {replay.notes ? (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{replay.notes}</p>
      ) : null}
      <div className="mt-2 text-xs text-muted-foreground">by {replay.submitter_ign}</div>
    </Link>
  );
}
