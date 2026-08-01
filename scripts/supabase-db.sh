#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly ENV_FILE="${SUPABASE_BACKUP_ENV_FILE:-$REPO_ROOT/.env.backup.local}"
readonly CLI_VERSION="2.111.0"
readonly PRODUCTION_PROJECT_REF="wtvevvzseuevhpeyrnsy"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/supabase-db.sh backup production

Commands:
  backup  Export production roles, schema, and data into an ignored timestamped directory.

Configuration:
  Copy .env.backup.example to .env.backup.local and add the production Session pooler URL.
EOF
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

load_config() {
  [[ -f "$ENV_FILE" ]] || fail "Missing $ENV_FILE. Copy .env.backup.example to .env.backup.local first."

  # This is a developer-owned, ignored shell environment file. Never commit it.
  # shellcheck disable=SC1090
  source "$ENV_FILE"
}

validate_database_url() {
  local database_url="$1"

  [[ -n "$database_url" ]] || fail "The production database URL is missing from $ENV_FILE."
  [[ "$database_url" == postgresql://* || "$database_url" == postgres://* ]] || \
    fail "The production value must be a PostgreSQL connection string."
  [[ "$database_url" != *'[PASSWORD]'* && "$database_url" != *'[PROJECT-REF]'* && "$database_url" != *'[SESSION-POOLER-HOST]'* ]] || \
    fail "Replace every placeholder in the production database URL."
  [[ "$database_url" == *"$PRODUCTION_PROJECT_REF"* ]] || \
    fail "The connection string does not contain expected production project ref $PRODUCTION_PROJECT_REF."
}

run_supabase() {
  if [[ -n "${SUPABASE_CLI:-}" ]]; then
    "$SUPABASE_CLI" "$@"
  else
    bunx "supabase@$CLI_VERSION" "$@"
  fi
}

checksum_file() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1"
  else
    sha256sum "$1"
  fi
}

backup_database() {
  local database_url="$1"
  local timestamp backup_dir suffix

  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup_dir="${SUPABASE_BACKUP_ROOT:-$REPO_ROOT/backups/supabase}/production/$timestamp"
  suffix=1
  while [[ -e "$backup_dir" ]]; do
    backup_dir="${SUPABASE_BACKUP_ROOT:-$REPO_ROOT/backups/supabase}/production/${timestamp}-$suffix"
    suffix=$((suffix + 1))
  done
  mkdir -p "$backup_dir"
  chmod 700 "$backup_dir"

  printf 'Creating production backup in %s\n' "$backup_dir"
  run_supabase db dump --db-url "$database_url" --file "$backup_dir/roles.sql" --role-only
  run_supabase db dump --db-url "$database_url" --file "$backup_dir/schema.sql"
  run_supabase db dump --db-url "$database_url" --file "$backup_dir/data.sql" --data-only --use-copy \
    --exclude storage.buckets_vectors --exclude storage.vector_indexes

  {
    printf 'environment=production\n'
    printf 'created_at_utc=%s\n' "$timestamp"
    printf 'supabase_cli_version=%s\n' "$CLI_VERSION"
  } > "$backup_dir/manifest.txt"
  {
    checksum_file "$backup_dir/roles.sql"
    checksum_file "$backup_dir/schema.sql"
    checksum_file "$backup_dir/data.sql"
  } > "$backup_dir/checksums.sha256"
  chmod 600 "$backup_dir"/*

  printf 'Backup complete: %s\n' "$backup_dir"
  printf 'Keep this directory private; it may contain application user data.\n'
}

main() {
  local command="${1:-}"
  local target="${2:-}"
  local database_url

  [[ "$command" == 'backup' && "$target" == 'production' ]] || { usage; exit 1; }

  load_config
  database_url="${PRODUCTION_SUPABASE_DB_URL:-}"
  validate_database_url "$database_url"
  backup_database "$database_url"
}

main "$@"
