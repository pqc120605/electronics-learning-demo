#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() { printf '%s\n' "$*" >&2; exit 1; }
[[ $(id -u) != 0 ]] || fail 'Run S1 as the existing non-root Mini PC user.'
checkout=$(git -C "$(dirname -- "$0")" rev-parse --show-toplevel)
commit=$(git -C "$checkout" rev-parse HEAD)
mode=${1:-check}
expected=${2:-}
[[ $mode == check || $mode == bootstrap || $mode == deploy ]] || fail 'Use check, bootstrap or deploy.'
[[ $expected =~ ^[0-9a-f]{40}$ && $commit == "$expected" ]] || fail 'Checkout must match the supplied full commit SHA.'
[[ -z $(git -C "$checkout" status --porcelain -- server/api server/analytics server/community server/guide-ai) ]] ||
  fail 'Staging source has local changes.'

root="$HOME/.local/share/mach-mo/api-staging"
config="$HOME/.config/mach-mo"
runtime_env="$config/api-staging.env"
migration_env="$config/api-staging-migration.env"
pass_file="$config/api-staging.pgpass"
units="$HOME/.config/systemd/user"
unit=mach-mo-api-staging.service
socket="${XDG_RUNTIME_DIR:?A logged-in user session is required}/machmo-analytics-pg"
unset PGHOSTADDR PGSERVICE PGSERVICEFILE PGOPTIONS PGPASSWORD
admin=(psql -X --no-password -v ON_ERROR_STOP=1 -h "$socket" -p 55432 -U "$(id -un)" -d postgres)
for tool in node git tar curl flock systemctl pg_isready psql; do command -v "$tool" >/dev/null || fail "Missing tool: $tool"; done
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) process.exit(1)' || fail 'Node 22 or later is required.'
pg_isready -h "$socket" -p 55432 || fail 'The existing Mạch Mở PostgreSQL socket is unavailable.'

pg_source="$checkout/server/community/node_modules"
if [[ ! -d "$pg_source/pg" ]]; then
  pg_source="$HOME/.local/share/mach-mo/analytics/app/node_modules"
fi
node "$checkout/server/api/copy-staging-pg.mjs" "$pg_source" ||
  fail 'The locked pg dependencies are unavailable on this machine. Stop before installing anything.'

if [[ $mode == check ]]; then
  state=$("${admin[@]}" -Atc "SELECT CASE WHEN rolsuper THEN 'admin-ready' ELSE 'review-db-privileges' END FROM pg_catalog.pg_roles WHERE rolname=current_user")
  printf 'S1 check passed for %s, PostgreSQL %s\n' "$commit" "$state"
  exit 0
fi

[[ ! -L $root && ! -L $root/releases ]] || fail 'Use a regular staging release directory.'
install -d -m 700 "$root" "$root/releases" "$config" "$units"
exec 9>"$root/operations.lock"
flock -n 9 || fail 'Another S1 staging operation is running.'

if [[ $mode == bootstrap ]]; then
  for secret_file in "$runtime_env" "$migration_env" "$pass_file"; do
    [[ ! -e $secret_file && ! -L $secret_file ]] || fail 'Staging credentials already exist. Use deploy or inspect the staging setup.'
  done
  occupied=$("${admin[@]}" -Atc "SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname IN ('machmo_api_stg_owner','machmo_api_stg_app')) OR EXISTS (SELECT 1 FROM pg_catalog.pg_database WHERE datname='machmo_api_staging')")
  [[ $occupied == f ]] || fail 'Staging roles or database already exist. Review their ownership before proceeding.'
  draft=$(mktemp -d "$config/.api-staging-bootstrap.XXXXXXXX")
  owner_password=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')
  app_password=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')
  printf 'DATABASE_URL=postgresql://machmo_api_stg_app:%s@127.0.0.1:55432/machmo_api_staging\nPUBLIC_ORIGIN=https://mach-mo.vercel.app\nMACHMO_API_PORT=8281\nGUIDE_AI_PROVIDER=mock\n' "$app_password" > "$draft/runtime"
  printf 'DATABASE_OWNER_URL=postgresql://machmo_api_stg_owner:%s@127.0.0.1:55432/machmo_api_staging\n' "$owner_password" > "$draft/migration"
  printf '127.0.0.1:55432:machmo_api_staging:machmo_api_stg_owner:%s\n127.0.0.1:55432:machmo_api_restore_check:machmo_api_stg_owner:%s\n' "$owner_password" "$owner_password" > "$draft/pgpass"
  if ! "${admin[@]}" -q >/dev/null 2>&1 <<SQL
BEGIN;
CREATE ROLE machmo_api_stg_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '$owner_password';
CREATE ROLE machmo_api_stg_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '$app_password';
COMMIT;
CREATE DATABASE machmo_api_staging OWNER machmo_api_stg_owner;
REVOKE ALL ON DATABASE machmo_api_staging FROM PUBLIC;
GRANT CONNECT ON DATABASE machmo_api_staging TO machmo_api_stg_app;
SQL
  then
    fail 'Staging database bootstrap failed. The private recovery directory was retained. Do not share its contents.'
  fi
  unset owner_password app_password
  mv -T -- "$draft/runtime" "$runtime_env"
  mv -T -- "$draft/migration" "$migration_env"
  mv -T -- "$draft/pgpass" "$pass_file"
  rmdir -- "$draft"
  printf 'Staging database and separate credentials initialized.\n'
  exit 0
fi

for secret_file in "$runtime_env" "$migration_env"; do
  [[ -f $secret_file && ! -L $secret_file && $(stat -c '%a' "$secret_file") == 600 ]] || fail 'Staging environment files must be regular files with mode 600.'
done

release="$root/releases/$commit"
if [[ ! -e $release ]]; then
  draft=$(mktemp -d "$root/releases/.prepare.XXXXXXXX")
  git -C "$checkout" archive "$commit" server/api server/analytics server/community server/guide-ai | tar -x -C "$draft"
  node "$checkout/server/api/copy-staging-pg.mjs" "$pg_source" "$draft/server/community/node_modules"
  printf 'MACHMO_API_COMMIT=%s\n' "$commit" > "$draft/release.env"
  mv -T -- "$draft" "$release"
fi
[[ -d $release && ! -L $release && -f "$release/release.env" && -f "$release/server/api/main.mjs" ]] ||
  fail 'Staging release is incomplete.'

current="$root/current"
previous=
if [[ -L $current ]]; then
  previous=$(readlink -- "$current")
  [[ $(dirname -- "$previous") == "$root/releases" && $(basename -- "$previous") =~ ^[0-9a-f]{40}$ && -f "$previous/server/api/mach-mo-api-staging.service" ]] ||
    fail 'Current staging link is outside the managed releases.'
elif [[ -e $current ]]; then
  fail 'Current staging path is not a managed symlink.'
fi

switch_release() {
  ln -s -- "$1" "$root/.current-$$" && mv -Tf -- "$root/.current-$$" "$current"
}

activate() {
  install -m 644 "$1/server/api/mach-mo-api-staging.service" "$units/$unit" &&
    systemctl --user daemon-reload && systemctl --user restart "$unit"
}

wait_for_health() {
  local expected_commit=$1 attempt
  for attempt in {1..12}; do
    if curl -fsS --max-time 2 http://127.0.0.1:8281/api/health 2>/dev/null |
      node -e 'let b=""; process.stdin.on("data",c=>b+=c); process.stdin.on("end",()=>{try {const s=JSON.parse(b); if(s.commit!==process.argv[1]||s.db!=="ready")process.exit(1);console.log(JSON.stringify(s))}catch{process.exit(1)}});' "$expected_commit"; then
      return 0
    fi
    sleep 1
  done
  return 1
}

env -u DATABASE_OWNER_URL node --env-file="$migration_env" "$release/server/api/migrate.mjs"
switch_release "$release"
if activate "$release" && wait_for_health "$commit"; then
  systemctl --user enable "$unit"
  for job in backup monitor; do
    for kind in service timer; do
      file="mach-mo-api-staging-$job.$kind"
      install -m 644 "$release/server/api/$file" "$units/$file"
    done
  done
  systemctl --user daemon-reload
  systemctl --user enable --now mach-mo-api-staging-monitor.timer
  if systemctl --user is-enabled --quiet mach-mo-api-staging-backup.timer; then
    systemctl --user start mach-mo-api-staging-backup.timer
  else
    printf '%s\n' 'Backup timer installed. Enable after a successful restore-check on the dedicated verification database.'
  fi
  exit 0
fi
if [[ -n $previous ]]; then
  switch_release "$previous" && activate "$previous" && wait_for_health "$(basename -- "$previous")" ||
    fail 'Staging deploy and automatic recovery both failed. Inspect the staging service.'
  fail 'Staging deploy failed. The previous release is healthy again.'
fi
systemctl --user stop "$unit" || true
[[ -L $current && $(readlink -- "$current") == "$release" ]] && unlink -- "$current"
fail 'First staging deploy failed. The staging service was stopped.'
