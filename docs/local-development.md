# Local Supabase development

ReplayVault uses a disposable local Supabase stack managed by the Supabase CLI
and run in Docker. See the [architecture decision](https://app.notion.com/p/3afc920a7e64813ca88beefd2bfed0e1)
for why the repository does not contain a Docker Compose file.

## Setup

1. Install Docker Desktop and allocate at least 7 GB of memory to Docker.
2. Run `bun install`.
3. Run `bun run db:start`.
4. Copy `.env.example` to the ignored `.env.local`.
5. Run `bun run db:status`. Copy `Publishable key` to both Supabase and Vite publishable-key variables in `.env.local`.
6. Run `bun run dev`.

The local API is `http://127.0.0.1:54321`, Studio is
`http://127.0.0.1:54323`, and the application is `http://127.0.0.1:8080`.

## Commands

| Command                                   | Purpose                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `bun run db:start`                        | Start Docker services and apply migrations plus seeds                        |
| `bun run db:stop`                         | Stop the local stack while preserving its Docker volume                      |
| `bun run db:status`                       | Show local service URLs and public development keys                          |
| `bun run db:reset`                        | **Destructively reset only the local database**, replay migrations, and seed |
| `bun run db:types`                        | Regenerate committed TypeScript database types from local schema             |
| `bunx supabase migration new <name>`      | Create a correctly named migration                                           |
| `bunx supabase db diff --local -f <name>` | Diff local schema into a migration                                           |

Never add `--linked` or a database URL to the reset command. Preview Branches
are ephemeral hosted review environments; the Coral Labs project is the sole
long-lived production backend. Neither is a substitute for this local stack.

## Deterministic fixtures

`supabase/seed.sql` is applied after migrations on first start and every reset.
It contains synthetic records only. The baseline includes 24 representative
replays: one for every combination of the three roles and eight rank tiers,
with varied divisions, heroes, maps, results, notes, and submitter names. This
keeps local product behavior useful beyond the minimum cases exercised by
Playwright.

The seeded login is:

- email: `player@replayvault.local`
- password: `replay-vault-local-only`

These public credentials are only for disposable local/preview fixtures. Never
reuse them for a real account or copy production data into the seed.

## Playwright

One-time setup:

```bash
cp .env.test.example .env.test.local
bunx playwright install
```

Run `bun run db:status`, then edit `.env.test.local`:

- Copy `API URL` to `VITE_SUPABASE_URL`.
- Copy `Publishable key` to `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Leave the seeded `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` unchanged.
- Set `E2E_API_MOCKS` and `E2E_BLOCK_BACKEND` to `true` or `false` as needed.

For a real-backend run:

```bash
bun run db:start
bun run db:reset
bun run test:e2e
```

Playwright starts the application dev server automatically. To run the mocked
suite instead, use `bun run test:e2e:mocked`.

| API mocks | Backend blocked | Behavior                              |
| --------- | --------------- | ------------------------------------- |
| `false`   | `false`         | Test the real local backend           |
| `true`    | `false`         | Use mocked backend responses          |
| `true`    | `true`          | Verify mocks cover all backend calls  |
| `false`   | `true`          | Demonstrate failure without a backend |

## Troubleshooting

- If Docker is stopped or containers fail health checks, start Docker Desktop,
  then run `bun run db:stop` followed by `bun run db:start`.
- For a clean local volume, run `bunx supabase stop --no-backup`, then start it.
- If a migration fails, fix the committed SQL and rerun `bun run db:reset`.
- Supabase CLI runtime state under `supabase/.temp` and `supabase/.branches` is
  ignored and must not be committed.
