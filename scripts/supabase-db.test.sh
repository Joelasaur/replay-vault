#!/usr/bin/env bash
#
# Verification for scripts/supabase-db.sh using a simulated Supabase CLI.
# Run with: bun run test:db-scripts
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$REPO_ROOT/scripts/supabase-db.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

pass=0
fail=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  ok   $name"
    pass=$((pass + 1))
  else
    echo "  FAIL $name (expected: $expected, got: $actual)"
    fail=$((fail + 1))
  fi
}

# --- simulated Supabase CLI -------------------------------------------------
mkdir -p "$WORK/bin"
cat >"$WORK/bin/supabase" <<'FAKE'
#!/usr/bin/env bash
set -euo pipefail
out=""
prev=""
for arg in "$@"; do
  if [ "$prev" = "-f" ]; then out="$arg"; fi
  prev="$arg"
done
[ -n "$out" ] || { echo "fake supabase: no -f target" >&2; exit 1; }
echo "-- simulated dump $*" > "$out"
FAKE
chmod +x "$WORK/bin/supabase"
export SUPABASE_BIN="$WORK/bin/supabase"

# --- credentials ------------------------------------------------------------
cat >"$WORK/.env.backup" <<'ENVFILE'
SUPABASE_PRODUCTION_DB_URL=postgresql://postgres.abcdefghijklmnopqrst:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_PRODUCTION_PROJECT_REF=abcdefghijklmnopqrst
ENVFILE

cat >"$WORK/.env.mismatch" <<'ENVFILE'
SUPABASE_PRODUCTION_DB_URL=postgresql://postgres.abcdefghijklmnopqrst:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_PRODUCTION_PROJECT_REF=zzzzzzzzzzzzzzzzzzzz
ENVFILE

echo "supabase-db.sh"

# 1. Happy path production backup.
status=0
BACKUP_ENV_FILE="$WORK/.env.backup" BACKUP_OUTPUT_DIR="$WORK/backups" \
  bash "$SCRIPT" backup production >"$WORK/out.log" 2>&1 || status=$?
check "backup production exits 0" 0 "$status"

dir="$(find "$WORK/backups/production" -mindepth 1 -maxdepth 1 -type d | head -n1)"
for f in roles.sql schema.sql data.sql SHA256SUMS; do
  [ -s "$dir/$f" ] && present=yes || present=no
  check "produces non-empty $f" yes "$present"
done

# 2. Checksums validate.
status=0
if command -v sha256sum >/dev/null 2>&1; then
  (cd "$dir" && sha256sum -c SHA256SUMS >/dev/null 2>&1) || status=$?
else
  (cd "$dir" && shasum -a 256 -c SHA256SUMS >/dev/null 2>&1) || status=$?
fi
check "checksums verify" 0 "$status"

# 3. Tampering breaks checksum verification.
echo "tampered" >>"$dir/data.sql"
status=0
if command -v sha256sum >/dev/null 2>&1; then
  (cd "$dir" && sha256sum -c SHA256SUMS >/dev/null 2>&1) || status=$?
else
  (cd "$dir" && shasum -a 256 -c SHA256SUMS >/dev/null 2>&1) || status=$?
fi
check "tampered file fails checksum" 1 "$status"

# 4. Project ref mismatch is rejected.
status=0
BACKUP_ENV_FILE="$WORK/.env.mismatch" BACKUP_OUTPUT_DIR="$WORK/backups2" \
  bash "$SCRIPT" backup production >/dev/null 2>&1 || status=$?
check "project ref mismatch is rejected" 1 "$status"

# 5. Missing credential file is rejected.
status=0
BACKUP_ENV_FILE="$WORK/nope.env" BACKUP_OUTPUT_DIR="$WORK/backups3" \
  bash "$SCRIPT" backup production >/dev/null 2>&1 || status=$?
check "missing credential file is rejected" 1 "$status"

# 6. Unsupported Lovable and reset invocations are rejected.
for args in "backup lovable" "dump lovable" "reset lovable" "reset production"; do
  status=0
  # shellcheck disable=SC2086
  BACKUP_ENV_FILE="$WORK/.env.backup" bash "$SCRIPT" $args >/dev/null 2>&1 || status=$?
  check "rejects '$args'" 1 "$status"
done

# 7. No credential material leaks into stdout.
if grep -q "secret" "$WORK/out.log"; then leaked=yes; else leaked=no; fi
check "no credentials in output" no "$leaked"

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
