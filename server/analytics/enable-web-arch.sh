#!/usr/bin/env bash
set -euo pipefail
umask 077

app_root="$HOME/.local/share/mach-mo"
config="$HOME/.config/mach-mo/Caddyfile"
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
release=$(realpath -- "${1:?Pass the extracted web release directory}")
[[ "$release" == "$app_root/releases/"* ]]
test -f "$release/index.html"
test -f "$release/licenses/ngspice-selfbuild/release-files.json"
systemctl --user is-active --quiet machmo-analytics.service
exec 9>"$app_root/deploy-analytics.lock"
flock -n 9
test -L "$app_root/current"
current=$(readlink -f "$app_root/current")
caddy="$app_root/bin/caddy"
if [[ ! -x "$caddy" ]]; then caddy=/usr/bin/caddy; fi

stamp=$(date +%Y%m%d-%H%M%S)
backup="$config.before-analytics-$stamp"
candidate=$(mktemp "${config}.analytics.XXXXXXXX")
switch_dir=''
rollback=0
cleanup() {
  local status=$?
  trap - EXIT
  set +e
  if (( rollback )); then
    local restored=0
    cp -p -- "$backup" "$switch_dir/Caddyfile.restore" && mv -T -- "$switch_dir/Caddyfile.restore" "$config" || restored=1
    mv -T -- "$switch_dir/previous" "$app_root/current" || restored=1
    systemctl --user restart mach-mo-web.service || restored=1
    if (( restored )); then
      printf '%s\n' 'Analytics rollout failed and automatic rollback needs attention.' >&2
    else
      printf '%s\n' 'Analytics rollout failed. The prior release was restored.' >&2
    fi
  fi
  rm -f -- "$candidate"
  if [[ -n "$switch_dir" ]]; then
    rm -f -- "$switch_dir/current" "$switch_dir/previous" "$switch_dir/Caddyfile.restore"
    rmdir -- "$switch_dir"
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
if grep -Fq 'handle /api/analytics/events {' "$config"; then
  printf '%s\n' 'Caddy already has an analytics event route. Inspect before changing it.' >&2
  exit 1
fi
if [[ $(grep -Fc 'handle /api/* {' "$config") -ne 1 ]]; then
  printf '%s\n' 'The existing public Caddyfile layout differs. Inspect before changing it.' >&2
  exit 1
fi
awk '/handle \/api\/\* \{/ {
    print "    handle /api/analytics/events {"
    print "        reverse_proxy 127.0.0.1:8787"
    print "    }"
} {print}' "$config" > "$candidate"
printf '\n' >> "$candidate"
cat "$script_dir/Caddyfile.admin" >> "$candidate"
MACH_MO_ROOT="$app_root/current" "$caddy" validate --config "$candidate" --adapter caddyfile
cp -p -- "$config" "$backup"
switch_dir=$(mktemp -d "$app_root/switch.XXXXXXXX")
ln -s "$release" "$switch_dir/current"
ln -s "$current" "$switch_dir/previous"
rollback=1
mv -T -- "$candidate" "$config"
mv -T "$switch_dir/current" "$app_root/current"

public_read='http://127.0.0.1:8080/api/analytics/admin/summary?start=2026-11-17&end=2026-11-17'
private_read='http://127.0.0.1:8081/api/analytics/admin/summary?start=2026-11-17&end=2026-11-17'
systemctl --user restart mach-mo-web.service
curl -fsS --retry 4 --retry-connrefused --max-time 5 -o /dev/null http://127.0.0.1:8080/
[[ $(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "$public_read") == 404 ]]
[[ $(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' -H 'Origin: https://machmo.tail3b04e8.ts.net' -H 'Content-Type: application/json' --data '{}' http://127.0.0.1:8080/api/analytics/events) == 400 ]]
curl -fsS --max-time 5 -o /dev/null "$private_read"
rollback=0
printf 'Previous Caddy configuration: %s\nPrevious web release: %s\n' "$backup" "$current"
