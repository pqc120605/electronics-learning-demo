#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() { printf '%s\n' "$*" >&2; exit 1; }

[[ $(id -u) != 0 && $(uname -m) == x86_64 ]] || fail 'Run as the Mini PC Linux amd64 user, without sudo.'
dir=$(cd "$(dirname -- "$0")" && pwd)
rev=${1:-}
[[ $rev =~ ^[a-f0-9]{40}$ && $(git -C "$dir" rev-parse HEAD) == "$rev" ]] ||
  fail 'Pass the full SHA of the checked-out compiler release.'
[[ -x /usr/bin/podman && $(/usr/bin/podman info --format '{{.Host.Security.Rootless}} {{.Host.CgroupsVersion}}') == 'true v2' ]] ||
  fail 'Rootless Podman with cgroups v2 is required.'
[[ -z $(git -C "$dir" status --porcelain) ]] || fail 'The release checkout has uncommitted changes.'

root="$HOME/.local/share/mach-mo/avr-compiler"
units="$HOME/.config/systemd/user"
unit=mach-mo-avr-compiler.service
release="$root/releases/$rev"
current="$root/current"
install -d -m 700 "$root/releases" "$units"
exec 9>"$root/deploy.lock"
flock -n 9 || fail 'A compiler deployment is already running.'

if [[ ! -f $release/image.env ]]; then
  install -d -m 700 "$release"
  tag="localhost/machmo-avr:${rev:0:12}"
  /usr/bin/podman build --pull=missing --tag "$tag" --file "$dir/Containerfile" "$dir"
  image=$(/usr/bin/podman image inspect --format '{{.Id}}' "$tag")
  if [[ $image =~ ^[a-f0-9]{64}$ ]]; then image="sha256:$image"; fi
  [[ $image =~ ^sha256:[a-f0-9]{64}$ ]] || fail 'Unable to resolve the resulting immutable image ID.'
  install -m 644 "$dir/service.mjs" "$release/service.mjs"
  printf 'MACHMO_COMPILER_IMAGE=%s\n' "$image" > "$release/image.env"
fi
image=$(sed -n 's/^MACHMO_COMPILER_IMAGE=//p' "$release/image.env")
[[ $image =~ ^sha256:[a-f0-9]{64}$ ]] && /usr/bin/podman image exists "$image" ||
  fail 'The pinned compiler image is missing.'

previous=$(readlink -- "$current" || true)
switch_current() { ln -s -- "$1" "$root/.current-$$" && mv -Tf -- "$root/.current-$$" "$current"; }
rollback() {
  local result=$?
  trap - EXIT
  if (( result != 0 )); then
    if [[ -n $previous ]]; then
      switch_current "$previous" && systemctl --user restart "$unit" ||
        printf '%s\n' 'Compiler rollback failed. Check the compiler unit.' >&2
    else
      systemctl --user disable --now "$unit" || true
    fi
  fi
  exit "$result"
}
trap rollback EXIT

install -m 644 "$dir/mach-mo-avr-compiler.service" "$units/$unit"
switch_current "$release"
systemctl --user daemon-reload
systemctl --user enable "$unit"
systemctl --user restart "$unit"
api=http://127.0.0.1:8285/api/tools/arduino
curl -fsS --retry 4 --retry-connrefused --max-time 4 -H 'Host: mach-mo.vercel.app' "$api/status"
printf '\n'

# An incomplete sketch reaches the real compiler without producing a firmware image.
result=$(mktemp "$root/probe.XXXXXXXX")
status=$(curl -sS --max-time 55 --output "$result" --write-out '%{http_code}' \
  -H 'Host: mach-mo.vercel.app' -H 'Origin: https://mach-mo.vercel.app' \
  -H 'X-Machmo-CSRF: 1' -H 'Content-Type: application/json' \
  -d '{"board":"arduino-uno-r3","source":"void setup(){ syntax error here; } void loop(){}"}' "$api/compile" || true)
if [[ $status != 422 ]] || ! grep -q '<sketch>/sketch.ino:' "$result"; then
  cat "$result" >&2
  rm -f -- "$result"
  fail 'Compiler probe did not return the expected sketch diagnostic.'
fi
rm -f -- "$result"
printf 'Rootless Arduino compiler verified on loopback for %s\n' "$rev"
