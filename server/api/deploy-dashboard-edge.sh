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

shift
features=$(node "$checkout/server/api/production-edge.mjs" --read "$config")
read -r enable_ai enable_compiler <<< "$features"
for option in "$@"; do
  case "$option" in
    --enable-ai) enable_ai=1 ;;
    --disable-ai) enable_ai=0 ;;
    --enable-compiler) enable_compiler=1 ;;
    --disable-compiler) enable_compiler=0 ;;
    *) fail 'Expected --enable-ai, --disable-ai, --enable-compiler or --disable-compiler.' ;;
  esac
done
edge_args=()
if (( enable_ai )); then edge_args+=(--enable-ai); fi
if (( enable_compiler )); then edge_args+=(--enable-compiler); fi
compiler_ready() {
  curl -fsS --max-time 5 -H 'Host: mach-mo.vercel.app' "$1" |
    node -e 'const h=JSON.parse(require("node:fs").readFileSync(0,"utf8")); if(!h.ok||!h.boards?.includes("arduino-uno-r3"))process.exit(1)'
}
if (( enable_compiler )); then
  compiler_ready http://127.0.0.1:8285/api/tools/arduino/status ||
    fail 'Start and verify the rootless compiler service before enabling its public routes.'
fi
node "$checkout/server/api/production-edge.mjs" "${edge_args[@]}" > "$candidate"
"$caddy" validate --config "$candidate" --adapter caddyfile >/dev/null
bash "$checkout/server/api/backup-staging.sh" backup
bash "$checkout/server/api/staging-ops.sh" deploy "$commit"
if (( enable_ai )); then
  curl -fsS --max-time 8 "$edge/health" |
    node -e 'const h=JSON.parse(require("node:fs").readFileSync(0,"utf8")); if(!["ollama","openai"].includes(h.ai))process.exit(1)' ||
    fail 'A real AI provider must be ready before enabling AI at the public edge.'
fi

backup=$(mktemp "$config.before-dashboard.XXXXXXXX")
cp -p -- "$config" "$backup"
mv -Tf -- "$candidate" "$config"
changed=1
systemctl --user restart "$edge_unit"
curl -fsS --retry 3 --retry-connrefused --retry-delay 1 --max-time 5 "$edge/health" |
  node -e 'const h=JSON.parse(require("node:fs").readFileSync(0,"utf8")); if(h.commit!==process.argv[1]||h.db!=="ready")process.exit(1); console.log(JSON.stringify(h))' "$commit"
for path in /admin/summary /admin/feedback /admin/sites /projects /projects/shares /classes /community/moderation/reports; do
  status=$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "$edge$path")
  [[ $status == 401 ]] || fail "Expected guest access to $path to return 401, got $status."
done
status=$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' -X POST \
  -H "Origin: $origin" -H 'X-Machmo-CSRF: 1' -H 'Content-Type: application/json' -d '{}' "$edge/feedback")
[[ $status == 400 ]] || fail "Expected invalid feedback to return 400, got $status."
curl -fsS --max-time 5 "$edge/projects/gallery?limit=1" >/dev/null
expected_ai=unavailable
if (( enable_ai )); then expected_ai=signed-out; fi
curl -fsS --max-time 5 "$edge/guide-ai/status" |
  node -e 'const h=JSON.parse(require("node:fs").readFileSync(0,"utf8")); if(h.state!==process.argv[1])process.exit(1)' "$expected_ai"
if (( enable_compiler )); then compiler_ready "$edge/tools/arduino/status"; fi
printf 'Dashboard backend ready. Previous Caddyfile saved at %s\n' "$backup"
