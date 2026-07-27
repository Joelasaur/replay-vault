import type { Rank, Role } from "@/lib/replays";
import { rankColorVar, roleColorVar } from "@/lib/replays";

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      data-testid={`role-badge-${role}`}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `color-mix(in oklch, ${roleColorVar(role)} 20%, transparent)`,
        color: roleColorVar(role),
        border: `1px solid color-mix(in oklch, ${roleColorVar(role)} 40%, transparent)`,
      }}
    >
      {role}
    </span>
  );
}

export function RankBadge({ rank, division }: { rank: Rank; division: number }) {
  return (
    <span
      data-testid={`rank-badge-${rank}-${division}`}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `color-mix(in oklch, ${rankColorVar(rank)} 18%, transparent)`,
        color: rankColorVar(rank),
        border: `1px solid color-mix(in oklch, ${rankColorVar(rank)} 40%, transparent)`,
      }}
    >
      {rank} {division}
    </span>
  );
}

export function ResultBadge({ result }: { result: "Win" | "Loss" }) {
  const isWin = result === "Win";
  const color = isWin ? "var(--color-role-support)" : "var(--color-destructive)";
  return (
    <span
      data-testid={`result-badge-${result}`}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`,
        color,
        border: `1px solid color-mix(in oklch, ${color} 40%, transparent)`,
      }}
    >
      {result}
    </span>
  );
}
