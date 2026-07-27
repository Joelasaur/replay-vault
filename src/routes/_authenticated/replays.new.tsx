import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createReplay } from "@/lib/replays.functions";
import {
  ALL_HEROES,
  DIVISIONS,
  HEROES_BY_ROLE,
  MAPS,
  RANKS,
  ROLES,
  type Rank,
  type Role,
  type Result,
} from "@/lib/replays";

export const Route = createFileRoute("/_authenticated/replays/new")({
  head: () => ({
    meta: [
      { title: "Submit a replay — ReplayVault" },
      { name: "description", content: "Share an Overwatch replay code with the community." },
    ],
  }),
  component: NewReplay,
});

function NewReplay() {
  const submit = useServerFn(createReplay);
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("Support");
  const [hero, setHero] = useState<string>("Moira");
  const [rank, setRank] = useState<Rank>("Gold");
  const [division, setDivision] = useState(3);
  const [replayCode, setReplayCode] = useState("");
  const [map, setMap] = useState<string>(MAPS[0]);
  const [result, setResult] = useState<Result>("Win");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          role,
          hero,
          rank,
          division,
          replay_code: replayCode.trim(),
          map,
          result,
          notes,
        },
      }),
    onSuccess: ({ id }) => navigate({ to: "/replays/$id", params: { id } }),
  });

  const heroChoices = HEROES_BY_ROLE[role] ?? ALL_HEROES;
  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-6">Submit a replay</h1>
      <form
        data-testid="new-replay-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Field label="Role">
          <select
            data-testid="new-role"
            value={role}
            onChange={(e) => {
              const nextRole = e.target.value as Role;
              setRole(nextRole);
              setHero(HEROES_BY_ROLE[nextRole][0]);
            }}
            className={inputCls}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Hero">
          <select
            data-testid="new-hero"
            value={hero}
            onChange={(e) => setHero(e.target.value)}
            className={inputCls}
          >
            {heroChoices.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Rank">
            <select
              data-testid="new-rank"
              value={rank}
              onChange={(e) => setRank(e.target.value as Rank)}
              className={inputCls}
            >
              {RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Division">
            <select
              data-testid="new-division"
              value={division}
              onChange={(e) => setDivision(Number(e.target.value))}
              className={inputCls}
            >
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Replay code">
          <input
            data-testid="new-code"
            type="text"
            required
            maxLength={20}
            value={replayCode}
            onChange={(e) => setReplayCode(e.target.value.toUpperCase())}
            placeholder="e.g. AB12CD"
            className={`${inputCls} font-mono uppercase`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Map">
            <select
              data-testid="new-map"
              value={map}
              onChange={(e) => setMap(e.target.value)}
              className={inputCls}
            >
              {MAPS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Result">
            <select
              data-testid="new-result"
              value={result}
              onChange={(e) => setResult(e.target.value as Result)}
              className={inputCls}
            >
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
            </select>
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea
            data-testid="new-notes"
            rows={4}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What should viewers pay attention to?"
            className={inputCls}
          />
        </Field>

        {mutation.error ? (
          <p role="alert" data-testid="new-error" className="text-sm text-destructive">
            {(mutation.error as Error).message}
          </p>
        ) : null}

        <button
          type="submit"
          data-testid="new-submit"
          disabled={mutation.isPending}
          className="w-full rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
          }}
        >
          {mutation.isPending ? "Submitting…" : "Submit replay"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
