#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() { printf '%s\n' "$*" >&2; exit 1; }
[[ $(id -u) != 0 ]] || fail 'Run S1 as an existing non-root user.'
root="$HOME/.local/share/mach-mo/api-staging"
backups="$root/backups"
pass_file="$HOME/.config/mach-mo/api-staging.pgpass"
[[ -f $pass_file && ! -L $pass_file && $(stat -c '%a' "$pass_file") == 600 ]] || fail 'A staging-only pass file with mode 600 is required.'
unset PGHOSTADDR PGSERVICE PGSERVICEFILE PGOPTIONS PGPASSWORD
export PGPASSFILE="$pass_file"
export PGCONNECT_TIMEOUT=5
db_args=(--no-password --host=127.0.0.1 --port=55432 --username=machmo_api_stg_owner)
name_pattern='^machmo_api_staging-[0-9]{8}T[0-9]{6}Z[.]dump$'
mode=${1:-backup}

[[ ! -L $root && ! -L $backups ]] || fail 'Backup directory must not be a symlink.'
install -d -m 700 "$root" "$backups"
exec 9>"$root/backup.lock"
flock -n 9 || fail 'Another staging backup or restore check is running.'

if [[ $mode == backup ]]; then
  name="machmo_api_staging-$(date -u +%Y%m%dT%H%M%SZ).dump"
  [[ ! -e "$backups/$name" ]] || fail 'Backup timestamp already exists.'
  temporary=$(mktemp "$backups/.dump.XXXXXXXX")
  trap 'unlink -- "$temporary"' EXIT
  pg_dump "${db_args[@]}" --dbname=machmo_api_staging --format=custom --file="$temporary"
  pg_restore --list "$temporary" >/dev/null
  mv -T -- "$temporary" "$backups/$name"
  trap - EXIT
  mapfile -t files < <(find "$backups" -maxdepth 1 -type f -printf '%f\n' | LC_ALL=C sort -r)
  kept=0
  for old in "${files[@]}"; do
    [[ $old =~ $name_pattern ]] || continue
    kept=$((kept + 1))
    if (( kept > 7 )); then unlink -- "$backups/$old"; fi
  done
  printf 'Staging backup verified: %s\n' "$name"
  exit 0
fi

[[ $mode == restore-check ]] || fail 'Use backup or restore-check <backup basename>.'
name=${2:-}
target=machmo_api_restore_check
[[ $name =~ $name_pattern && -f "$backups/$name" && ! -L "$backups/$name" ]] || fail 'Use a verified staging backup basename.'
psql_target=(psql -X "${db_args[@]}" --dbname="$target" -v ON_ERROR_STOP=1 -At)
empty=$("${psql_target[@]}" -c "SELECT current_database()='machmo_api_restore_check'
  AND current_user='machmo_api_stg_owner'
  AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname IN ('machmo_community','machmo_analytics'))
  AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public')
  AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_database d CROSS JOIN LATERAL aclexplode(coalesce(d.datacl, acldefault('d',d.datdba))) a WHERE d.datname=current_database() AND a.grantee=0 AND a.privilege_type='CONNECT')")
[[ $empty == t ]] || fail 'Restore-check requires the dedicated, empty database with PUBLIC connect revoked.'
pg_restore "${db_args[@]}" --dbname="$target" --single-transaction --exit-on-error --no-owner --no-acl "$backups/$name"
"${psql_target[@]}" -c "SELECT 'migrations=' || count(*) FROM public.schema_migrations; SELECT 'events=' || count(*) FROM machmo_analytics.events; SELECT 'sessions=' || count(*) FROM machmo_community.sessions;"
