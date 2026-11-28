#!/usr/bin/env bash
set -euo pipefail
umask 077

mode=${1:-}
[[ $mode == enable || $mode == disable ]] || { echo 'Usage: configure-edge.sh enable|disable' >&2; exit 2; }
checkout=$(git -C "$(dirname -- "$0")" rev-parse --show-toplevel)
config="$HOME/.config/mach-mo/Caddyfile.oauth-production"
edge=http://127.0.0.1:8284
status=/tools/firmware-fixtures/r1/status
unit=mach-mo-api-production-edge.service
lock="$HOME/.local/share/mach-mo/api-staging/dashboard-edge.lock"
caddy="$HOME/.local/share/mach-mo/bin/caddy"
[[ -x $caddy ]] || caddy=$(command -v caddy)
[[ -f $config && ! -L $config ]]
systemctl --user is-active --quiet "$unit"

exec 9>"$lock"
flock -n 9

health=$(curl -fsS --max-time 5 "$edge/health")
verify_ready() {
  node -e 'const h = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
    if (h.revision !== "60cdc46a7126156d03ba1b74f3bce42dabb59aa642a412e44f75a286528d8509"
       || !Array.from({ length: 11 }, (_, i) => "A" + (i + 2)).every(stage => h.stages?.includes(stage))) process.exit(1)'
}
if [[ $mode == enable ]]; then
  curl -fsS --max-time 5 -H 'Host: mach-mo.vercel.app' "http://127.0.0.1:8286/api$status" | verify_ready
fi

features=$(node "$checkout/server/api/production-edge.mjs" --read "$config")
read -r ai compiler firmware <<< "$features"
args=()
if (( ai )); then args+=(--enable-ai); fi
if (( compiler )); then args+=(--enable-compiler); fi
if [[ $mode == enable ]]; then args+=(--enable-firmware); fi

candidate=$(mktemp "$config.firmware.XXXXXXXX")
backup=$(mktemp "$config.before-firmware.XXXXXXXX")
changed=0
cleanup() {
  local code=$?
  trap - EXIT
  if (( code != 0 && changed )); then
    if cp -p -- "$backup" "$candidate" && mv -Tf -- "$candidate" "$config"; then
      systemctl --user restart "$unit" || printf 'Restore the edge using %s\n' "$backup" >&2
    fi
  fi
  rm -f -- "$candidate"
  exit "$code"
}
trap cleanup EXIT
node "$checkout/server/api/production-edge.mjs" "${args[@]}" > "$candidate"
"$caddy" validate --config "$candidate" --adapter caddyfile
cp -p -- "$config" "$backup"
mv -Tf -- "$candidate" "$config"
changed=1
systemctl --user restart "$unit"

after=$(curl -fsS --retry 3 --retry-connrefused --retry-delay 1 --max-time 5 "$edge/health")
node -e 'const [a,b]=process.argv.slice(1).map(JSON.parse); if (a.commit !== b.commit || a.ai !== b.ai || b.db !== "ready") process.exit(1)' "$health" "$after"
if (( compiler )); then curl -fsS --max-time 5 "$edge/tools/arduino/status" >/dev/null; fi
if [[ $mode == enable ]]; then
  curl -fsS --max-time 5 "$edge$status" | verify_ready
else
  [[ "$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "$edge$status")" == 404 ]]
fi
printf 'Firmware routing %s. Previous edge saved at %s\n' "$mode" "$backup"
