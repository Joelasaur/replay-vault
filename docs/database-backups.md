# Database backup workflows

ReplayVault currently has two backend environments with different ownership models:

- **Lovable development:** Lovable Cloud manages the backend (`ixgmlsclkbggsecyfeps`). It does not expose the PostgreSQL credentials required by the Supabase CLI workflow below.
- **Production:** Coral Labs directly owns the standalone Supabase project (`wtvevvzseuevhpeyrnsy`). It is on the Free plan until launch needs justify an upgrade.

Do not assume that the Supabase-compatible URL and publishable key used by the Lovable application grant direct database administration access. They are application credentials, not a PostgreSQL connection string or database password.

## Standalone production database

The repository provides an occasional manual dump for the independently managed production project. It does not provide a production reset command.

### One-time setup

The workflow requires Bun, Docker Desktop, and the production database connection string. The Supabase CLI runs its compatible `pg_dump` through Docker.

1. Copy the ignored configuration template:

   ```bash
   cp .env.backup.example .env.backup.local
   chmod 600 .env.backup.local
   ```

2. In the standalone production Supabase project, open **Connect**, choose **Session pooler**, and copy its connection string into `.env.backup.local`. Session pooler is preferred because direct connections require IPv6 or Supabase's IPv4 add-on.
3. Replace the password placeholder with the database password. Percent-encode special characters in the password. Do not use a publishable API key or service-role key; neither is a database password.

The script checks that the URL contains the production project ref before doing anything. The ignored `.env.backup.local` and `backups/` directory must never be committed or uploaded as CI artifacts.

### Create a production backup

```bash
bun run db:backup:production
```

The command writes a timestamped directory under `backups/supabase/production/` containing:

- `roles.sql`: custom database roles;
- `schema.sql`: schema, functions, triggers, policies, and privileges;
- `data.sql`: table data in PostgreSQL `COPY` format;
- `manifest.txt`: environment, timestamp, and pinned CLI version;
- `checksums.sha256`: SHA-256 checksums for all three SQL exports.

The workflow uses Supabase CLI `2.111.0` and Supabase-specific dump filtering. A normal dump without `--data-only` contains no table data, which is why all three exports are required.

Treat every backup as sensitive. The data export can contain email addresses stored by the application, replay submissions, and comments. Store retained copies in private encrypted storage and delete them when no longer useful.

Supabase CLI filters Supabase-managed schemas such as `auth` and `storage`. This workflow preserves application schema and data; it is not a complete export of hosted-project configuration or authentication records.

## Lovable Cloud development database

There is intentionally no local Lovable dump or reset command in this repository. Lovable Cloud owns the database administration boundary and does not provide the Session Pooler connection string and database password expected by `supabase db dump` or `supabase db reset`.

For now, manage and export development data through Lovable Cloud. Lovable documents table-level export under **Cloud → Database → Table → Export CSV**. Ask Lovable to add its supported reset/export workflow to this branch rather than passing the public project URL or publishable key to the Supabase CLI.

If Lovable cannot provide a repeatable managed workflow, use an independently owned Supabase development project or Supabase preview branches when that infrastructure is introduced. Do not invent or scrape Lovable database credentials.

## Recovery and restore proof

A successful production dump plus matching checksums proves that application data can be exported; it does **not** prove recovery. Restoring over either active hosted environment is intentionally excluded because it is destructive and may conflict with provider-managed schemas.

Before launch, issue #27 and the Phase 6 restore drill must establish the production RPO/RTO and restore a backup into a separate disposable Supabase project. Follow Supabase's current [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) instructions, then verify migrations, row counts, authentication, RLS behavior, and application smoke tests.

## Retention policy before launch

- **Lovable:** follow the managed export/retention behavior documented by Lovable when that workflow is added.
- **Production while empty or pre-launch:** take a dump before destructive or difficult-to-reverse work and retain it only as long as needed to validate the change.
- **After real-user launch:** replace this provisional policy during Phase 6. The current candidate is included daily backups on Supabase Pro, with a 24-hour RPO, an eight-hour RTO, and seven-day retention. Reassess PITR when losing one day of activity becomes unacceptable.

## Supabase Storage caveat

This CLI workflow does not export the Supabase-managed Storage schema or stored files. Supabase's managed database backups may preserve Storage metadata, but they do **not** restore deleted Storage objects. The proposed post-v1 gameplay-screenshot feature therefore needs a separate object-backup and restore policy before it accepts irreplaceable uploads. That feature and its Storage backup implementation are outside Production Launch v1.
