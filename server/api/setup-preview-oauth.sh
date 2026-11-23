#!/usr/bin/env bash
set -euo pipefail
set +x
umask 077

preview_host=mach-mo-git-codex-qd1-preview-health-mach-mo.vercel.app
origin="https://$preview_host"
funnel_host=machmo.tail3b04e8.ts.net
edge_unit=mach-mo-api-preview-edge
api_unit=mach-mo-api-staging.service
runtime="${XDG_RUNTIME_DIR:?A Mini PC user session is required}"
config="$HOME/.config/mach-mo/api-staging.env"
socket="$runtime/mach-mo-tailscale/tailscaled.sock"
ts="$HOME/.local/share/mach-mo/tailscale/bin/tailscale"
caddy="$HOME/.local/share/mach-mo/bin/caddy"
edge=http://127.0.0.1:8283
expected=7c27fbb8e9e714b2323c12483ca60bd815b6684a

fail() { printf '%s\n' "$*" >&2; exit 1; }
[[ $(id -u) != 0 ]] || fail 'Run as the existing Mini PC user.'
[[ -f "$config" && ! -L "$config" && $(stat -c '%a' "$config") == 600 ]] || fail 'Staging environment file must be a regular file with mode 600.'
[[ -x "$ts" && -S "$socket" ]] || fail 'The existing Mạch Mở Tailscale instance is unavailable.'
if [[ ! -x "$caddy" ]]; then caddy=$(command -v caddy); fi
[[ -z $(ss -Hltn 'sport = :8283') ]] || fail 'Port 8283 is already in use.'
curl -fsS --max-time 5 http://127.0.0.1:8282/health >/dev/null
routes=$("$ts" --socket="$socket" funnel status)
previous_proxy=$(awk -v url="https://$funnel_host:10000" '$1 == url { getline; print $NF }' <<<"$routes")
[[ "$previous_proxy" == http://127.0.0.1:8282 ]] || fail 'Funnel port 10000 must still point to the A3 health proxy.'

current_origin=$(awk '/^[[:space:]]*MACHMO_S2_ORIGIN=/{ sub(/^[^=]*=/, ""); value=$0 } END { print value }' "$config")
origins=$(awk '/^[[:space:]]*STAGING_ORIGINS=/{ sub(/^[^=]*=/, ""); value=$0 } END { print value }' "$config")
current_origin=${current_origin//\"/}
current_origin=${current_origin//\'/}
origins=${origins//\"/}
origins=${origins//\'/}
[[ -z "$current_origin" || "$current_origin" == "$origin" ]] || fail 'The staging API already serves another OAuth origin.'
if [[ ",$origins," != *",$origin,"* ]]; then origins="${origins:+$origins,}$origin"; fi

work=$(mktemp -d "$runtime/machmo-api-preview.XXXXXXXX")
cat > "$work/Caddyfile" <<CADDY
{
	admin off
	auto_https off
}
http://:8283 {
	bind 127.0.0.1
	@api path /health /session /session/logout /auth/login/google /auth/login/github /auth/callback/google /auth/callback/github /community/* /guide-ai/status /guide-ai/chat /guide-ai/feedback
	handle @api {
		rewrite * /api{uri}
		reverse_proxy 127.0.0.1:8281 {
			header_up Host $preview_host
		}
	}
	handle {
		respond 404
	}
}
CADDY
"$caddy" validate --config "$work/Caddyfile" --adapter caddyfile

read_private() {
  local key=$1
  read -r -s -p "$key: " "$key" </dev/tty
  printf '\n' >/dev/tty
  [[ ${!key} =~ ^[A-Za-z0-9._-]+$ ]] || fail "Invalid value for $key."
}
for key in GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
  read_private "$key"
done

backup=$(mktemp "$config.before-preview.XXXXXXXX")
candidate=$(mktemp "$config.preview.XXXXXXXX")
cp -p -- "$config" "$backup"
config_changed=0
edge_started=0
funnel_changed=0
cleanup() {
  local status=$?
  trap - EXIT
  if (( status != 0 )); then
    if (( funnel_changed )); then
      "$ts" --socket="$socket" funnel --bg --https=10000 "$previous_proxy" ||
        printf '%s\n' 'Failed to restore the previous Funnel target.' >&2
    fi
    if (( edge_started )); then systemctl --user stop "$edge_unit.service" || true; fi
    if (( config_changed )); then
      if cp -p -- "$backup" "$candidate" && mv -Tf -- "$candidate" "$config"; then
        systemctl --user restart "$api_unit" || printf '%s\n' 'The old configuration was restored. Check the staging service.' >&2
      else
        printf 'Restore the staging configuration from %s\n' "$backup" >&2
      fi
    fi
  fi
  if [[ -f "$candidate" ]]; then rm -- "$candidate"; fi
  exit "$status"
}
trap cleanup EXIT

awk '!/^[[:space:]]*(MACHMO_S2_ORIGIN|STAGING_ORIGINS|GITHUB_CLIENT_ID|GITHUB_CLIENT_SECRET|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET)=/' "$config" > "$candidate"
{
  printf 'MACHMO_S2_ORIGIN=%s\nSTAGING_ORIGINS=%s\n' "$origin" "$origins"
  for key in GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
    printf '%s=%s\n' "$key" "${!key}"
  done
  if ! grep -Eq '^[[:space:]]*SESSION_SECRET=' "$config"; then
    printf 'SESSION_SECRET=%s\n' "$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')"
  fi
} >> "$candidate"
unset GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET
mv -Tf -- "$candidate" "$config"
config_changed=1
systemctl --user restart "$api_unit"

systemd-run --user --collect --unit="$edge_unit" \
  --setenv="XDG_CONFIG_HOME=$work/config" --setenv="XDG_DATA_HOME=$work/data" \
  "$caddy" run --config "$work/Caddyfile" --adapter caddyfile
edge_started=1
health=$(curl -fsS --retry 4 --retry-connrefused --retry-delay 1 --max-time 5 "$edge/health")
node -e '
  const health = JSON.parse(process.argv[1])
  if (health.commit !== process.argv[2] || health.db !== "ready") process.exit(1)
  console.log(JSON.stringify(health))
' "$health" "$expected"
session=$(curl -fsS --max-time 5 "$edge/session")
node -e 'if (JSON.parse(process.argv[1]).user !== null) process.exit(1)' "$session"
printf '%s\n' 'Guest session OK.'
for provider in github google; do
  redirect=$(curl -fsS --max-time 5 -o /dev/null -w '%{http_code} %{redirect_url}' "$edge/auth/login/$provider?next=%2Fcommunity")
  case "$provider:$redirect" in
    'github:303 https://github.com/login/oauth/authorize?'*|'google:303 https://accounts.google.com/o/oauth2/v2/auth?'*)
      printf 'OAuth redirect ready for %s.\n' "$provider" ;;
    *) fail "OAuth redirect failed for $provider." ;;
  esac
done

funnel_changed=1
"$ts" --socket="$socket" funnel --bg --https=10000 "$edge"
printf 'Preview API is connected. Staging configuration backup: %s\n' "$backup"
