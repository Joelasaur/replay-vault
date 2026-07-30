# ReplayVault

A community replay repository for Overwatch. Players share replay codes, tag them with role / hero / rank / map / result, and comment. Public browsing is open to everyone; submitting a replay and commenting require signing in.

Built with TanStack Start + React + Tailwind, backed by Lovable Cloud (Supabase Postgres + Auth). Instrumented end-to-end with Playwright — including a **programmatic login bypass** so authed UI tests never touch the sign-in page.

## Local dev

```bash
bun install
bun run dev
```

App runs on <http://localhost:8080>.

## Playwright — the interview-facing part

The whole point of the test suite is to demonstrate two techniques:

1. **Bypass the login UI in tests.** `tests/auth.setup.ts` exchanges the test user's email + password for a Supabase session **by hitting `/auth/v1/token` directly** with `apikey: <publishable key>`, then injects the returned session JSON into `localStorage` under `sb-<project-ref>-auth-token` — the exact key the Supabase JS client reads on boot. Playwright saves the resulting browser context to `playwright/.auth/user.json` (`storageState`), and every other authed spec loads that state and starts already-signed-in.
2. **Keep specs tightly scoped.** Because storage state is portable, `submit.spec.ts` and `comment.spec.ts` can each be run in isolation and go straight to the feature under test — no shared beforeEach navigating a login form, no cookie leakage, no cross-spec ordering.

For contrast, `tests/login-ui.spec.ts` walks the actual sign-in form so an interviewer can compare both approaches side by side.

### Setup

1. Create a test user through the app once:
   - Start dev server, open `/auth`, click "No account? Create one".
   - Register with an email + password you're OK using for testing.
2. Copy `.env.test.example` to `.env` (or `.env.test.local` — Playwright loads via `dotenv/config`) and fill in:
   ```
   VITE_SUPABASE_URL=...           # already in .env, copy across
   VITE_SUPABASE_PUBLISHABLE_KEY=...
   E2E_TEST_EMAIL=you+e2e@example.com
   E2E_TEST_PASSWORD=your-test-password
   E2E_BASE_URL=http://localhost:8080   # or a deployed URL
   ```
3. Run:
   ```bash
   bunx playwright install    # once
   bunx playwright test
   ```

### Spec map

| Spec                       | Uses storage state? | What it proves                                              |
| -------------------------- | ------------------- | ----------------------------------------------------------- |
| `auth.setup.ts`            | writes it           | Token exchange + localStorage injection works.              |
| `browse.spec.ts`           | no                  | Anonymous users can browse + filter; submit gates redirect. |
| `filter-deeplink.spec.ts`  | no                  | Filter state is URL-driven and shareable.                   |
| `submit.spec.ts`           | yes                 | Authed submit works without visiting `/auth`.               |
| `comment.spec.ts`          | yes                 | Authed comment works without visiting `/auth`.              |
| `login-ui.spec.ts`         | no                  | Full-UI login flow still works.                             |

## GitHub

Sync this project to GitHub from the Lovable editor: Plus (+) → GitHub → Connect project. Then clone locally to keep iterating.

### Codex CI repair

1. Open a failed workflow run and copy the **run ID** from its URL:
   ```text
   https://github.com/Joelasaur/replay-vault/actions/runs/123456789
   ```
   In this example, the run ID is `123456789`. If the URL also contains
   `/job/987654321`, ignore that second number.
2. Open [Actions → Codex CI Repair](https://github.com/Joelasaur/replay-vault/actions/workflows/codex-ci-repair.yml),
   then click **Run workflow**.
3. Enter the run ID. Optionally add context that may help Codex interpret the
   failure, then start the workflow. For example:
   ```text
   The push run passed, but the pull_request run failed. A push run tests the
   branch commit directly, while a pull_request run tests GitHub's temporary
   merge of that branch with the latest main branch. Investigate whether this
   is an integration failure in the synthetic merge commit.
   ```

Codex receives the run event, branch, commit, failed logs, and any optional
context you provide, then opens a draft repair PR for review.

### Codex repair feedback

On an open
[`codex/ci-fix-*`](https://github.com/Joelasaur/replay-vault/pulls?q=is%3Apr+is%3Aopen+label%3Acodex-ci-repair)
PR, start a comment with `/codex`:

```text
/codex Why is this change needed?
/codex Update the fix without changing the Playwright version.
```

Codex will either reply with clarification or push a follow-up commit to the
same PR. Only repository collaborators can run these commands.
