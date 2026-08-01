#!/usr/bin/env bash
#
# supabase-db.sh — credential-safe manual database operations.
#
# Providers:
#   production  Coral Labs owned Supabase project. Backup only, never reset.
#   lovable     Lovable Cloud managed development backend. Dump/reset are NOT
#               exposed here; Lovable owns those operations.
#
# Usage:
#   scripts/supabase-db.sh backup production
#
# Credentials are read from an ignored local env file (default .env.backup,
# override with BACKUP_ENV_FILE). Nothing is ever echoed to stdout.
#
set -euo pipefail

SCRIPT_NAME="$(basename "$0")"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${BACKUP_ENV_FILE:-$REPO_ROOT/.env.backup}"
BACKUP_ROOT="${BACKUP_OUTPUT_DIR:-$REPO_ROOT/backups}"
# Allows tests to substitute a simulated Supabase CLI.
SUPABASE_BIN="${SUPABASE_BIN:-supabase}"

die() {
  echo "$SCRIPT_NAME: error: $*" >&2
  exit 1
}

log() {
  echo "$SCRIPT_NAME: $*"
}

usage() {
  cat <<'USAGE'
Usage: scripts/supabase-db.sh <command> <provider>

Commands:
  backup    Export roles, schema, and data with SHA-256 checksums.

Providers:
  production   Self-managed Supabase project (Coral Labs).

Unsupported by design:
  backup lovable, dump lovable, reset lovable, reset production
USAGE
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$(dirname "$1")" && sha256sum "$(basename "$1")")
  elif command -v shasum >/dev/null 2>&1; then
    (cd "$(dirname "$1")" && shasum -a 256 "$(basename "$1")")
  else
    die "no sha256sum or shasum available for checksum generation"
  fi
}

load_env_file() {
  [ -f "$ENV_FILE" ] || die "missing credential file '$ENV_FILE'. Copy .env.backup.example and fill it in (the file is git-ignored)."
  # shellcheck disable=SC1090
  set -a
  . "$ENV_FILE"
  set +a
}

# Verifies the connection string points at the expected project ref so a
# production backup can never be pointed at the wrong database by accident.
assert_expected_project_ref() {
  local conn="$1" expected="$2" found=""

  case "$conn" in
    *postgres.*) found="${conn#*postgres.}"; found="${found%%:*}" ;;
    *db.*.supabase.co*) found="${conn#*db.}"; found="${found%%.supabase.co*}" ;;
  esac

  [ -n "$found" ] || die "could not determine the Supabase project ref from the connection string"
  [ "$found" = "$expected" ] || die "connection string project ref does not match SUPABASE_PRODUCTION_PROJECT_REF; refusing to continue"
}

backup_production() {
  load_env_file

  local conn="${SUPABASE_PRODUCTION_DB_URL:-}"
  local expected_ref="${SUPABASE_PRODUCTION_PROJECT_REF:-}"

  [ -n "$conn" ] || die "SUPABASE_PRODUCTION_DB_URL is not set in $ENV_FILE"
  [ -n "$expected_ref" ] || die "SUPABASE_PRODUCTION_PROJECT_REF is not set in $ENV_FILE"

  assert_expected_project_ref "$conn" "$expected_ref"

  command -v "$SUPABASE_BIN" >/dev/null 2>&1 || die "Supabase CLI '$SUPABASE_BIN' not found on PATH"

  local stamp out_dir
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  out_dir="$BACKUP_ROOT/production/$stamp"
  mkdir -p "$out_dir"
  chmod 700 "$BACKUP_ROOT" "$BACKUP_ROOT/production" "$out_dir" 2>/dev/null || true

  log "backing up production project $expected_ref -> $out_dir"

  "$SUPABASE_BIN" db dump --db-url "$conn" --role-only -f "$out_dir/roles.sql"
  "$SUPABASE_BIN" db dump --db-url "$conn" -f "$out_dir/schema.sql"
  "$SUPABASE_BIN" db dump --db-url "$conn" --data-only --use-copy -f "$out_dir/data.sql"

  : >"$out_dir/SHA256SUMS"
  local f
  for f in roles.sql schema.sql data.sql; do
    [ -f "$out_dir/$f" ] || die "expected dump file '$f' was not produced"
    sha256_file "$out_dir/$f" >>"$out_dir/SHA256SUMS"
  done

  chmod 600 "$out_dir"/*.sql "$out_dir/SHA256SUMS" 2>/dev/null || true

  log "backup complete"
  log "checksums: $out_dir/SHA256SUMS"
  cat "$out_dir/SHA256SUMS"
}

main() {
  local command="${1:-}" provider="${2:-}"

  case "$command" in
    -h|--help|help|"")
      usage
      [ -n "$command" ] || exit 1
      exit 0
      ;;
  esac

  case "$command:$provider" in
    backup:production)
      backup_production
      ;;
    backup:lovable|dump:lovable|reset:lovable)
      die "the Lovable Cloud backend is managed by Lovable; '$command lovable' is not supported here. Use Lovable's own development reset/export workflow."
      ;;
    reset:production)
      die "resetting production is intentionally not supported."
      ;;
    *)
      usage
      die "unsupported command '$command' for provider '$provider'"
      ;;
  esac
}

main "$@"
