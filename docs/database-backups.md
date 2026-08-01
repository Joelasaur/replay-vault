# Database backups

This document covers backup and reset boundaries for the two backends behind
Replay Vault.

## Provider boundaries

| Backend | Owner | Backup | Reset |
| --- | --- | --- | --- |
| Production Supabase project | Coral Labs (self-managed) | `bun run db:backup:production` | Not provided |
| Lovable Cloud development backend | Lovable | Lovable's own workflow | Lovable's own workflow |

Lovable Cloud does not expose PostgreSQL administration credentials (database
password, service role key, pooler connection string), so the CLI-based backup
in this repository cannot target it. `scripts/supabase-db.sh` rejects
`backup lovable`, `dump lovable`, and `reset lovable` explicitly rather than
pretending to support them. Development resets and exports must be requested
through Lovable, which performs them inside its own management boundary.

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

| File | Contents |
| --- | --- |
| `roles.sql` | Application roles (`supabase db dump --role-only`) |
| `schema.sql` | Application schema DDL |
| `data.sql` | Table data via `COPY` |
| `SHA256SUMS` | SHA-256 checksum for each of the three dumps |

Verify a backup later with:

```bash
cd backups/production/<timestamp> && sha256sum -c SHA256SUMS
```

## What is *not* covered

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

Adding a future environment means adding one more provider branch in
`scripts/supabase-db.sh` and one more choice in the workflow's `environment`
input.

## References

- [Supabase: Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase: Database Backups](https://supabase.com/docs/guides/platform/backups)
