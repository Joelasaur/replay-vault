# Database backups

This document covers backup and reset boundaries for Replay Vault's local,
preview, and production environments.

## Provider boundaries

| Environment               | Lifecycle                  | Backup                         | Reset                          |
| ------------------------- | -------------------------- | ------------------------------ | ------------------------------ |
| Local Supabase in Docker  | Disposable                 | None; recreate from repository | `bun run db:reset`             |
| Supabase Preview Branches | Ephemeral per pull request | None; recreate from repository | Recreate the Preview Branch    |
| Coral Labs production     | Long-lived hosted Supabase | `bun run db:backup:production` | Intentionally no reset command |

Committed migrations and `supabase/seed.sql` are the recovery source for local
and preview environments. They do not use production data or require database
exports.

There is intentionally **no production reset command**. Destroying production
data is not a scripted operation.

## Credential handling

1. Copy `.env.backup.example` to `.env.backup`.
2. Fill in `SUPABASE_PRODUCTION_DB_URL` (Session Pooler string) and
   `SUPABASE_PRODUCTION_PROJECT_REF`.
3. `.env.backup` and `backups/` are git-ignored. Neither credentials nor backup
   artifacts belong in Git.

Before any operation the script parses the project ref out of the connection
string and compares it with `SUPABASE_PRODUCTION_PROJECT_REF`. A mismatch aborts
the run. The connection string is never printed.

Override the credential file with `BACKUP_ENV_FILE=/path/to/file` and the output
location with `BACKUP_OUTPUT_DIR=/path/to/dir`.

## Running a backup

```bash
bun run db:backup:production
```

Output goes to `backups/production/<UTC timestamp>/`:

| File         | Contents                                           |
| ------------ | -------------------------------------------------- |
| `roles.sql`  | Application roles (`supabase db dump --role-only`) |
| `schema.sql` | Application schema DDL                             |
| `data.sql`   | Table data via `COPY`                              |
| `SHA256SUMS` | SHA-256 checksum for each of the three dumps       |

Verify a backup later with:

```bash
cd backups/production/<timestamp> && sha256sum -c SHA256SUMS
```

## What is _not_ covered

- Supabase-managed schemas outside the application schema, and hosted-project
  configuration (auth settings, API keys, extensions enabled in the dashboard).
- Supabase Storage objects. Gameplay screenshot uploads are out of scope for
  Launch v1 and will need their own object-backup policy when introduced.
- Restore procedures and recovery objectives (RPO/RTO). Restoring into a
  disposable target and validating it is a Phase 6 drill, tracked separately.
  Treat these artifacts as unvalidated until that drill runs.

## Retention

Backups are local, private, and manually created. Keep them on encrypted disk,
prune old timestamped directories yourself, and do not attach them to issues or
pull requests.

## CI

`.github/workflows/database-backup.yml` runs the same command on demand
(`workflow_dispatch` only). GitHub restricts `workflow_dispatch` to users with
write access, and the workflow additionally verifies the actor's repository
permission is `write` or `admin` before doing anything. The connection string is
read from the `SUPABASE_PRODUCTION_DB_URL` repository secret; artifacts are
uploaded with a short retention window and are never committed.

The backup script and workflow target only the Coral Labs production project.

## References

- [Supabase: Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase: Database Backups](https://supabase.com/docs/guides/platform/backups)
