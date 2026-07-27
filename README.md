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
