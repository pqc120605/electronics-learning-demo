#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() { printf '%s\n' "$*" >&2; exit 1; }
checkout=$(git -C "$(dirname -- "$0")" rev-parse --show-toplevel)
commit=${1:-}
[[ $commit =~ ^[a-f0-9]{40}$ && $(git -C "$checkout" rev-parse HEAD) == "$commit" ]] ||
  fail 'Checkout must match the dashboard release commit.'

origin=https://mach-mo.vercel.app
edge=http://127.0.0.1:8284
config="$HOME/.config/mach-mo/Caddyfile.oauth-production"
edge_unit=mach-mo-api-production-edge.service
root="$HOME/.local/share/mach-mo/api-staging"
caddy="$HOME/.local/share/mach-mo/bin/caddy"
[[ -x $caddy ]] || caddy=$(command -v caddy)
[[ -f $config && ! -L $config ]] || fail 'Expected the existing production Caddyfile.'
systemctl --user is-active --quiet "$edge_unit" || fail 'Production edge is not running.'
bash "$checkout/server/api/staging-ops.sh" check "$commit"
install -d -m 700 "$root"
exec 9>"$root/dashboard-edge.lock"
flock -n 9 || fail 'Another dashboard release operation is running.'

candidate=$(mktemp "$config.dashboard.XXXXXXXX")
backup=
changed=0
cleanup() {
  local result=$?
  trap - EXIT
  if (( result != 0 && changed )); then
    if cp -p -- "$backup" "$candidate" && mv -Tf -- "$candidate" "$config" && systemctl --user restart "$edge_unit"; then
      printf '%s\n' 'Restored the previous production edge configuration.' >&2
    else
      printf 'Restore the production edge configuration from %s\n' "$backup" >&2
    fi
  fi
  rm -f -- "$candidate"
  exit "$result"
}
trap cleanup EXIT

node --input-type=module - "$config" "$candidate" <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs'
const [input, output] = process.argv.slice(2)
const config = readFileSync(input, 'utf8')
const matcher = /^([ \t]+path )[^\r\n]*\/auth\/login\/google[^\r\n]*$/gm
const matches = [...config.matchAll(matcher)]
if (matches.length !== 1 || !/header_up Host mach-mo\.vercel\.app\b/.test(config)) {
  throw new Error('The existing production edge matcher has an unexpected format.')
}
const paths = ['/feedback', '/analytics/events', '/admin/summary', '/admin/ai', '/admin/community',
  '/admin/system', '/admin/feedback', '/admin/sites', '/admin/sites/*', '/site-metrics/*']
writeFileSync(output, config.replace(matcher, (line, indent) => {
  const previous = line.slice(indent.length).trim().split(/\s+/)
  return indent + [...new Set([...previous, ...paths])].join(' ')
}))
NODE
"$caddy" validate --config "$candidate" --adapter caddyfile >/dev/null
bash "$checkout/server/api/backup-staging.sh" backup
bash "$checkout/server/api/staging-ops.sh" deploy "$commit"

backup=$(mktemp "$config.before-dashboard.XXXXXXXX")
cp -p -- "$config" "$backup"
mv -Tf -- "$candidate" "$config"
changed=1
systemctl --user restart "$edge_unit"
curl -fsS --retry 3 --retry-connrefused --retry-delay 1 --max-time 5 "$edge/health" |
  node -e 'const h=JSON.parse(require("node:fs").readFileSync(0,"utf8")); if(h.commit!==process.argv[1]||h.db!=="ready")process.exit(1); console.log(JSON.stringify(h))' "$commit"
for path in /admin/summary /admin/feedback /admin/sites; do
  status=$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "$edge$path")
  [[ $status == 401 ]] || fail "Expected guest access to $path to return 401, got $status."
done
status=$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' -X POST \
  -H "Origin: $origin" -H 'X-Machmo-CSRF: 1' -H 'Content-Type: application/json' -d '{}' "$edge/feedback")
[[ $status == 400 ]] || fail "Expected invalid feedback to return 400, got $status."
printf 'Dashboard backend ready. Previous Caddyfile saved at %s\n' "$backup"
