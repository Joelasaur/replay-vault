import type { Rank, Role } from "@/lib/replays";
import { rankColorVar, roleColorVar } from "@/lib/replays";

const RANK_ICON_PATHS: Record<Rank, string> = {
  Bronze: "/images/ranks/bronze.webp",
  Silver: "/images/ranks/silver.webp",
  Gold: "/images/ranks/gold.webp",
  Platinum: "/images/ranks/platinum.webp",
  Diamond: "/images/ranks/diamond.webp",
  Master: "/images/ranks/master.webp",
  Grandmaster: "/images/ranks/grandmaster.webp",
  Champion: "/images/ranks/champion.webp",
};

export function RankIcon({ rank, division }: { rank: Rank; division: number }) {
  return (
    <span
      className="relative flex h-14 w-12 shrink-0 items-start justify-center"
      role="img"
      aria-label={`${rank} ${division}`}
    >
      <img src={RANK_ICON_PATHS[rank]} alt="" className="size-11 object-contain" loading="lazy" />
      <img
        src={`/images/divisions/${division}.webp`}
        alt=""
        className="absolute bottom-0 h-6 w-10 object-contain"
        loading="lazy"
      />
    </span>
  );
}

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
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: rankColorVar(rank),
        color: "var(--color-background)",
        border: `1px solid color-mix(in oklch, ${rankColorVar(rank)} 72%, white)`,
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
