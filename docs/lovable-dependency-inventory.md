# Lovable dependency inventory

Issue #67 authorizes a complete, destructive migration. Lovable database rows,
Auth users, sessions, password hashes, and Storage objects are discarded.

| Surface                                                | Classification | Repository action                                                                   |
| ------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------- |
| PostgreSQL schema, grants, RLS, triggers, indexes      | Retain         | Committed Supabase migrations are the source of truth                               |
| Test/demo database contents and Auth users             | Remove         | Replaced with deterministic synthetic `supabase/seed.sql`                           |
| Supabase browser/server clients and generated types    | Retain         | Repository-owned code; regenerate from local schema                                 |
| Lovable Vite wrapper and private package registry      | Replace        | Explicit Vite, TanStack Start, Nitro, React, Tailwind, and path plugins             |
| Lovable browser error hooks                            | Remove         | Standard server/browser logging remains; independent observability is separate work |
| `.lovable/` editor metadata                            | Remove         | No runtime or engineering source of truth remains there                             |
| Tracked backend environment variables                  | Remove         | Safe example plus ignored per-environment files                                     |
| Google OAuth broker                                    | Remove         | No broker integration exists in this checkout; use direct Supabase OAuth if added   |
| Storage, Edge Functions, scheduled jobs                | Remove         | No required repository implementation or assets were found                          |
| Lovable hosting, domains, GitHub sync, access, billing | Remove         | No longer part of the repository workflow; disconnect remaining external access     |
| Production backup verification                         | Defer          | Issue #27 is shelved and outside this migration                                     |
