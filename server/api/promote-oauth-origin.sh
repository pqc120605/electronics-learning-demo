#!/usr/bin/env bash
set -euo pipefail
umask 077

origin=https://mach-mo.vercel.app
host=mach-mo.vercel.app
public_api=https://machmo.tail3b04e8.ts.net:10000
preview_edge=http://127.0.0.1:8283
edge=http://127.0.0.1:8284
expected=7c27fbb8e9e714b2323c12483ca60bd815b6684a
runtime="${XDG_RUNTIME_DIR:?Run in the Mini PC user session}"
socket="$runtime/mach-mo-tailscale/tailscaled.sock"
ts="$HOME/.local/share/mach-mo/tailscale/bin/tailscale"
caddy="$HOME/.local/share/mach-mo/bin/caddy"
api_unit=mach-mo-api-staging.service
edge_unit=mach-mo-api-production-edge.service
user_units="$HOME/.config/systemd/user"
config="$HOME/.config/mach-mo/Caddyfile.oauth-production"
origin_config="$config.origin"
override="$user_units/$api_unit.d/90-oauth-production.conf"
unit="$user_units/$edge_unit"

fail() { printf '%s\n' "$*" >&2; exit 1; }
[[ $(id -u) != 0 && -x $ts && -S $socket ]] || fail 'The existing Mini PC user and Tailscale socket are required.'
[[ -x $caddy ]] || caddy=$(command -v caddy)
funnel() { "$ts" --socket="$socket" funnel "$@"; }
target() { funnel status | awk -v url="$public_api" '$1 == url { getline; print $NF }'; }

verify_health() {
  curl -fsS --retry 5 --retry-connrefused --retry-delay 1 --max-time 5 "$1/health" |
    node -e '
      const value = JSON.parse(require("node:fs").readFileSync(0, "utf8"))
      require("node:assert/strict").equal(value.commit, process.argv[1])
      require("node:assert/strict").equal(value.db, "ready")
    ' "$expected"
}

restore() {
  if [[ $(target) == "$edge" ]]; then
    funnel --bg --https=10000 "$preview_edge" || return
  fi
  if [[ -f $unit ]]; then systemctl --user disable --now "$edge_unit" || return; fi
  rm -f -- "$override" "$unit" "$config" "$origin_config" || return
  systemctl --user daemon-reload || return
  systemctl --user restart "$api_unit" || return
  verify_health "$preview_edge"
}

mode=${1:-check}
if [[ $mode == rollback ]]; then
  [[ -f $override && -f $unit && -f $config && -f $origin_config && $(target) == "$edge" ]] ||
    fail 'The production edge is not the active Funnel target.'
  restore
  printf '%s\n' 'Preview API restored.'
  exit
fi
[[ $mode == check || $mode == apply ]] || fail 'Use check, apply, or rollback.'
[[ $(target) == "$preview_edge" && -z $(ss -Hltn 'sport = :8284') ]] ||
  fail 'Funnel must still use the Preview edge and port 8284 must be available.'
for path in "$override" "$unit" "$config" "$origin_config"; do
  [[ ! -e $path && ! -L $path ]] || fail "File already exists: $path"
done
systemctl --user is-enabled mach-mo-api-preview-edge.service >/dev/null
systemctl --user is-active --quiet "$api_unit"
verify_health "$preview_edge"

work=$(mktemp -d "$runtime/machmo-oauth-production.XXXXXXXX")
changed=0
cleanup() {
  local status=$?
  trap - EXIT
  if (( status != 0 && changed )); then
    restore || printf '%s\n' 'Automatic rollback failed. Check the API and Funnel before deploying Vercel.' >&2
  fi
  rm -f -- "$work/Caddyfile"
  rmdir -- "$work"
  exit "$status"
}
trap cleanup EXIT

cat > "$work/Caddyfile" <<CADDY
{
	admin off
	auto_https off
}
http://:8284 {
	bind 127.0.0.1
	@api {
		path /health /session /session/logout /auth/login/google /auth/login/github /auth/callback/google /auth/callback/github /account /community/*
		not path /community/moderation/*
	}
	handle @api {
		rewrite * /api{uri}
		reverse_proxy 127.0.0.1:8281 {
			header_up Host $host
		}
	}
	handle {
		respond 404
	}
}
CADDY
"$caddy" validate --config "$work/Caddyfile" --adapter caddyfile
if [[ $mode == check ]]; then
  printf '%s\n' 'Production edge configuration validated.'
  exit
fi

release="$HOME/.local/share/mach-mo/api-staging/current"
bash "$release/server/api/backup-staging.sh" backup
install -d -m 700 "$user_units/$api_unit.d"
changed=1
install -m 600 "$work/Caddyfile" "$config"
# Override only the origins after the existing environment files have loaded.
printf 'PUBLIC_ORIGIN=%s\nMACHMO_S2_ORIGIN=%s\n' "$origin" "$origin" > "$origin_config"
printf '[Service]\nEnvironmentFile=%%h/.config/mach-mo/Caddyfile.oauth-production.origin\n' > "$override"
cat > "$unit" <<UNIT
[Unit]
Description=Mạch Mở production OAuth HTTPS upstream

[Service]
ExecStart="$caddy" run --config "$config" --adapter caddyfile
Restart=on-failure
RestartSec=3s
NoNewPrivileges=true

[Install]
WantedBy=default.target
UNIT
systemctl --user daemon-reload
systemctl --user restart "$api_unit"
systemctl --user enable --now "$edge_unit"
verify_health "$edge"
curl -fsS --max-time 5 "$edge/session" | node -e '
  const value = JSON.parse(require("node:fs").readFileSync(0, "utf8"))
  require("node:assert/strict").deepEqual(value, { user: null })
'
for provider in google github; do
  curl -sS --max-time 5 --output /dev/null --write-out '%{http_code}\n%{redirect_url}' "$edge/auth/login/$provider" |
    node -e '
      const assert = require("node:assert/strict")
      const [code, location] = require("node:fs").readFileSync(0, "utf8").split("\n")
      const [provider, origin] = process.argv.slice(1)
      assert.equal(code, "303")
      const url = new URL(location)
      assert.equal(url.host, provider === "google" ? "accounts.google.com" : "github.com")
      assert.ok(url.searchParams.get("redirect_uri") === origin + "/api/auth/callback/" + provider, "Unexpected OAuth callback")
    ' "$provider" "$origin"
done
logout=$(curl -sS --max-time 5 --output /dev/null --write-out '%{http_code}' -X POST \
  -H "Origin: $origin" -H 'X-Machmo-CSRF: 1' "$edge/session/logout")
[[ $logout == 204 ]] || fail 'The production edge did not accept same-origin logout.'
funnel --bg --https=10000 "$edge"
[[ $(target) == "$edge" ]] || fail 'Funnel has not switched to the production OAuth edge.'
printf '%s\n' 'Production API edge ready. Verify it from an external network before deploying Vercel.'
