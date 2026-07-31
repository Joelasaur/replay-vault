# ReplayVault

A community replay repository for Overwatch. Players share replay codes, tag them with role / hero / rank / map / result, and comment. Public browsing is open to everyone; submitting a replay and commenting require signing in.

Built with TanStack Start + React + Tailwind, backed by Lovable Cloud (Supabase Postgres + Auth). Instrumented end-to-end with Playwright — including a **programmatic login bypass** so authed UI tests never touch the sign-in page.

## Local dev

```bash
bun install
bun run dev
```

App runs on <http://localhost:8080>.

## Playwright

The whole point of the test suite is to demonstrate two techniques:

1. **Bypass the login UI in tests.** `tests/auth.setup.ts` exchanges the test user's email + password for a Supabase session **by hitting `/auth/v1/token` directly** with `apikey: <publishable key>`, then injects the returned session JSON into `localStorage` under `sb-<project-ref>-auth-token` — the exact key the Supabase JS client reads on boot. Playwright saves the resulting browser context to `playwright/.auth/user.json` (`storageState`), and every other authed spec loads that state and starts already-signed-in.
2. **Keep specs tightly scoped.** Because storage state is portable, `submit.spec.ts` and `comment.spec.ts` can each be run in isolation and go straight to the feature under test — no shared beforeEach navigating a login form, no cookie leakage, no cross-spec ordering.

For contrast, `tests/login-ui.spec.ts` walks the actual sign-in form so an interviewer can compare both approaches side by side.

### API mocking

Run the real-backend suite normally:

```bash
bun run test:e2e
```

To run only specs tagged `@mocked`, without `auth.setup.ts` or Supabase Auth:

```bash
bun run test:e2e:mocked
```

Mock mode currently covers `login-ui.spec.ts`. Its Playwright route fulfills
the password-token request with a synthetic Supabase session, so the real form,
Supabase client, auth context, redirect, and signed-in header still run without
contacting the authentication backend.

Backend blocking is a separate diagnostic option:

```bash
# Demonstrate the UI test failing with its backend unavailable.
bun run test:e2e:blocked

# Prove that the mocks cover every browser request to our backend.
E2E_BLOCK_BACKEND=true bun run test:e2e:mocked
```

The guard still allows the app document, scripts, styles, images, and unrelated
third parties. It blocks Supabase plus same-origin `fetch`/XHR requests and logs
each missing mock as `[backend blocked]`.

### Ask Codex to add or update mocks

Give Codex the spec name and use this prompt:

```text
Add or update API mocks for tests/<spec>.spec.ts. Run the spec once against the
real backend with tracing enabled, inspect its backend requests and responses,
then add sanitized typed mocks under tests/mocks/. Tag the spec @mocked if
needed. Do not copy credentials, authorization headers, or live tokens into the
repository. Finally, run the spec with E2E_API_MOCKS=true and
E2E_BLOCK_BACKEND=true, and keep adding mocks until it passes without any
[backend blocked] requests. Do not change application behavior or weaken test
assertions.
```

Codex may ask for permission to run the local server or contact the configured
test backend. Keep test credentials in the ignored `.env.test.local`; never
paste them into the prompt. Review the resulting fixtures for sensitive data
before committing them.

### Setup

1. Create a test user through the app once:
   - Start dev server, open `/auth`, click "No account? Create one".
   - Register with an email + password you're OK using for testing.
2. Copy `.env.test.example` to the ignored `.env.test.local` file and fill in:
   ```bash
   cp .env.test.example .env.test.local
   ```
   ```
   E2E_TEST_EMAIL=you+e2e@example.com
   E2E_TEST_PASSWORD=your-test-password
   E2E_BASE_URL=http://localhost:8080   # or a deployed URL
   ```
   Playwright loads secrets from `.env.test.local`, then fills in the existing
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from Lovable's
   tracked `.env`.
3. Run:
   ```bash
   bunx playwright install    # once
   bunx playwright test
   ```

### Spec map

| Spec                      | Uses storage state? | What it proves                                              |
| ------------------------- | ------------------- | ----------------------------------------------------------- |
| `auth.setup.ts`           | writes it           | Token exchange + localStorage injection works.              |
| `browse.spec.ts`          | no                  | Anonymous users can browse + filter; submit gates redirect. |
| `filter-deeplink.spec.ts` | no                  | Filter state is URL-driven and shareable.                   |
| `submit.spec.ts`          | yes                 | Authed submit works without visiting `/auth`.               |
| `comment.spec.ts`         | yes                 | Authed comment works without visiting `/auth`.              |
| `login-ui.spec.ts`        | no                  | Real or mocked full-UI login flow works.                    |

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
context you provide. It tests its proposed repair with the real Playwright
workflow before opening a draft PR. For PR failures, the repair branch starts
from the real PR head while verification recreates the merge with its base
branch. If that test fails, Codex gets the new failure log and may revise its
fix once. After two failed test runs, the repair stops without opening a PR.

### Codex repair feedback

On an open
[`codex/ci-fix-*`](https://github.com/Joelasaur/replay-vault/pulls?q=is%3Apr+is%3Aopen+label%3Acodex-ci-repair)
PR, start a conversation comment with `/codex`:

```text
/codex Why is this change needed?
/codex Update the fix without changing the Playwright version.
```

Codex will either reply with clarification or push a follow-up commit to the
same PR. Only repository collaborators can run these commands.
