#!/usr/bin/env bash
# Releases only the tester site. Run from the project checkout on the Mini PC.
set -euo pipefail
umask 077

surface=${1:-tester}
case "$surface" in
  tester) port=8180 ;;
  tester-exercise) port=8182 ;;
  *) echo 'Usage: scripts/update-tester-web.sh [tester|tester-exercise]' >&2; exit 2 ;;
esac
root="$HOME/.local/share/mach-mo/$surface"
base="http://127.0.0.1:$port"
src="$(pwd -P)/dist"
revision=$(git rev-parse HEAD)
[[ "$revision" =~ ^[a-f0-9]{40}$ ]]
test -z "$(git status --porcelain)"
test -f "$src/index.html"
test -f "$src/licenses/ngspice-selfbuild/release-files.json"
test -z "$(find "$src" -type l -print -quit)"
node scripts/check-public-release-gates.mjs

install -d -m 700 "$root/releases" "$root/shared-assets"
exec 9>"$root/.update.lock"
flock -n 9
target="$root/releases/$revision"
manifest="$root/releases/$revision.sha256"
entry=$(node --input-type=module -e '
  import {readFileSync} from "node:fs";
  const entry = readFileSync("dist/index.html", "utf8").match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/)?.[1];
  if (!entry) throw Error("Missing web entry");
  console.log(entry);
')
test -f "$src$entry"
wasm_path=vendor/eecircuit-engine/spice.wasm
wasm_hash=$(sha256sum "$src/$wasm_path" | cut -d ' ' -f 1)
node --input-type=module -e '
  import {readFileSync} from "node:fs";
  const records = JSON.parse(readFileSync("public/licenses/spice-engine-provenance.json", "utf8"));
  if (records.buildArtifacts["spice.wasm"].sha256 !== process.argv[1]) throw Error("Build WASM hash mismatch");
' "$wasm_hash"

old=$(readlink -f "$root/current" 2>/dev/null || true)
if [[ -e "$root/current" || -L "$root/current" ]]; then
  test -L "$root/current"
  test -d "$old"
fi
if [[ -n "$old" && -d "$old" ]]; then [[ "$old" == "$root/releases/"* ]]; fi
scratch=$(mktemp -d "$root/.update.XXXXXXXX")
switched=false
complete=false
switch_to() {
  ln -s -- "$1" "$scratch/next"
  mv -T -- "$scratch/next" "$root/current"
}
cleanup() {
  local status=$?
  if [[ "$switched" == true && "$complete" != true ]]; then
    if [[ -n "$old" && -d "$old" ]]; then
      switch_to "$old"
      printf 'Restored %s\n' "$old" >&2
    elif [[ "$(readlink -f "$root/current" 2>/dev/null || true)" == "$target" ]]; then
      unlink "$root/current"
    fi
  fi
  if [[ -e "$scratch/manifest" ]]; then unlink "$scratch/manifest"; fi
  if [[ -L "$scratch/next" ]]; then unlink "$scratch/next"; fi
  rmdir -- "$scratch" 2>/dev/null || true
  return "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

(cd "$src" && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$scratch/manifest"
if [[ -d "$target" ]]; then
  cmp -s "$manifest" "$scratch/manifest"
  (cd "$target" && sha256sum --check --quiet "$manifest")
else
  stage=$(mktemp -d "$root/releases/.candidate.XXXXXXXX")
  cp -a -- "$src/." "$stage/"
  (cd "$stage" && sha256sum --check --quiet "$scratch/manifest")
  checksum=$(sha256sum "$scratch/manifest" | cut -d ' ' -f 1)
  printf '{"commit":"%s","surface":"%s","entry":"%s","wasmSha256":"%s","manifestSha256":"%s"}\n' \
    "$revision" "$surface" "$entry" "$wasm_hash" "$checksum" > "$stage/release.json"
  mv -T -- "$stage" "$target"
  mv -- "$scratch/manifest" "$manifest"
fi

# Vite names its emitted files by content. Keep old files available to open tabs after a switch.
publish_assets() {
  local archive="$1" asset destination
  while IFS= read -r -d '' asset; do
    destination="$root/shared-assets/${asset#"$archive/assets/"}"
    if [[ -e "$destination" ]]; then
      cmp -s -- "$asset" "$destination" || { echo "Conflicting asset: $destination" >&2; return 1; }
    else
      install -D -m 644 -- "$asset" "$destination"
    fi
  done < <(find "$archive/assets" -type f -print0)
}
if [[ -n "$old" && -d "$old/assets" ]]; then publish_assets "$old"; fi
publish_assets "$target"

if [[ "$old" != "$target" ]]; then
  switched=true
  switch_to "$target"
fi
curl -fsS --max-time 5 "$base/release.json" | grep -Fq "\"commit\":\"$revision\""
curl -fsS --max-time 5 "$base/app/tools/spice" | grep -Fq "$entry"
curl -fsS --max-time 5 -o /dev/null "$base$entry"
curl -fsSI --max-time 5 "$base/$wasm_path" | grep -iq 'Content-Type: application/wasm'
test "$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "$base/api/analytics/admin/summary")" = 404
complete=true
printf 'Tester release %s on %s\n' "$revision" "$base"
