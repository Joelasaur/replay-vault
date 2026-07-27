# Overwatch Replay Repository — Final Plan

Public replay-sharing site for Overwatch (all three roles). Built to showcase Playwright skills, including a programmatic-login bypass so authed UI tests never touch the login page.

## Repo handoff

Sync to GitHub via the Plus (+) menu → GitHub → Connect project. Then clone locally and refine with Claude.

## Auth + Playwright bypass approach

Lovable Cloud auth (Supabase) with email/password. To bypass login in Playwright:

1. A one-time `auth.setup.ts` project runs before the authed specs.
2. It POSTs to Supabase's token endpoint directly:
   `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` with the test user's email + password and `apikey: {PUBLISHABLE_KEY}`.
3. Response contains `access_token`, `refresh_token`, `user`, `expires_at`, etc.
4. The setup writes that session JSON into `localStorage` under the Supabase key `sb-<project-ref>-auth-token` via `page.addInitScript`, then saves the browser context as `playwright/.auth/user.json`.
5. Every authed spec declares `storageState: 'playwright/.auth/user.json'` and starts already-signed-in — no login UI, no redirects, no shared session flakiness.

This is exactly the "hit the auth API with credentials, inject the token, skip the page" pattern you want to demo. Also lets each spec bind tightly to the feature under test.

Test user creds live in `.env.test` (gitignored) as `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`. README documents creating the user once via the signup flow (or a seed script) before running tests.

## Scope

**Public (no login):** browse, filter, view replay detail, read comments.
**Requires login:** submit a replay, post a comment. Header shows Sign in / Sign out based on session.

Filters: Role (Tank / Damage / Support), Hero, Rank, Division, Map, Result, text search. "Suggest replays for my rank" helper mirrors your sheet's one-tier-up rule.

Out of v1: edit/delete, votes, moderation, dark-mode toggle, password reset UI (Supabase handles the email; not needed for the demo).

## Data model

```text
replays
  id uuid pk
  role text            -- Tank | Damage | Support
  hero text
  rank text            -- Bronze..Champion
  division int         -- 1..5
  replay_code text
  map text
  result text          -- Win | Loss
  notes text
  submitter_id uuid    -- auth.users.id
  submitter_ign text
  created_at timestamptz

comments
  id uuid pk
  replay_id uuid fk -> replays.id (cascade)
  author_id uuid     -- auth.users.id
  author_ign text
  body text
  created_at timestamptz

profiles
  id uuid pk -> auth.users.id
  ign text unique
  created_at timestamptz
```

RLS: public SELECT on `replays` and `comments`; INSERT restricted to `auth.uid() = submitter_id` / `author_id`. `profiles` auto-created via trigger on signup; user can set IGN on first submit if empty.

## Routes

```text
/                    Landing + suggest-my-rank + latest replays
/replays             Browse + filters (URL-driven state)
/replays/new         Submit (auth required — /_authenticated/)
/replays/$id         Detail + comments (comment form gated in-place)
/auth                Sign in / sign up (Lovable's managed page pattern)
```

## UI direction

Charcoal background, warm orange primary, cyan accent, Space Grotesk + Inter. Role-coded and rank-coded pills. All tokens in `src/styles.css`, no hardcoded colors in components.

## Playwright-friendliness (built in)

- `data-testid` on every interactive element and key surface.
- URL-driven filter state — tests deep-link.
- Distinct loading / empty / error states, each addressable.
- `playwright.config.ts` with `webServer` and two projects: `setup` (runs `auth.setup.ts`) and `chromium` (depends on setup, uses stored `storageState`).
- Specs: `browse.spec.ts` (public), `submit.spec.ts` (authed, no login UI), `comment.spec.ts` (authed), `filter-deeplink.spec.ts`, `login-ui.spec.ts` (walks the UI for contrast).
- README section explaining the bypass to your interviewer.

## Seed data

~24 replays spread across all three roles and every rank tier, using the codes/maps from your CSV plus additions for Tank (Reinhardt, D.Va, Winston, Orisa…) and Damage (Genji, Tracer, Ashe, Soldier…) alongside Support.

## Build order

1. Enable Lovable Cloud.
2. Design system tokens (role + rank palettes).
3. Migration: `replays`, `comments`, `profiles`, RLS, GRANTs, signup trigger, seed inserts.
4. Auth wiring (email/password) + `/_authenticated/` gate for `/replays/new`.
5. Server fns: `listReplays(filters)`, `getReplay`, `createReplay` (auth), `listComments`, `createComment` (auth).
6. Routes: `/`, `/replays`, `/replays/$id`, `/replays/new`, `/auth`. Header with session state.
7. `data-testid` pass.
8. Playwright config + `auth.setup.ts` + specs + README.
9. SEO heads, sitemap, robots.

## What you'll do at the end

- Create one test user via the signup form (or I can add a tiny seed script that calls the admin API).
- Put `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` + `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.test`.
- Run `bunx playwright test`.

Ready to build — reply "go" and I'll start.
