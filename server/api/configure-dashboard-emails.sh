#!/usr/bin/env bash
set -euo pipefail
umask 077

[[ $(id -u) != 0 ]] || { printf '%s\n' 'Use the existing Mini PC user.' >&2; exit 1; }
checkout=$(git -C "$(dirname -- "$0")" rev-parse --show-toplevel)
cd "$checkout"
config="$HOME/.config/mach-mo"
dropin="$HOME/.config/systemd/user/mach-mo-api-staging.service.d"
env_file="$config/dashboard-access.env"
unit_config="$dropin/95-dashboard-access.conf"
for target in "$env_file" "$unit_config"; do
  [[ ! -L $target && ( ! -e $target || -f $target ) ]] || { printf '%s\n' 'Expected regular dashboard configuration files.' >&2; exit 1; }
done
read -r -s -p 'Email được xem dashboard (phân cách bằng dấu phẩy): ' emails </dev/tty
printf '\n' >/dev/tty
normalized=$(printf '%s' "$emails" | node --input-type=module -e '
  import { readFileSync } from "node:fs"
  import { normalizeDashboardEmail } from "./server/api/dashboard-access.mjs"
  const values = readFileSync(0, "utf8").split(",").map(normalizeDashboardEmail)
  if (values.length > 50 || values.some(value => !value || !/^[a-z0-9._+-]+@[a-z0-9.-]+$/.test(value))) {
    console.error("Danh sách phải có từ 1 đến 50 địa chỉ email hợp lệ.")
    process.exit(1)
  }
  process.stdout.write([...new Set(values)].join(","))
')
unset emails
install -d -m 700 "$config" "$dropin"
env_temp=$(mktemp "$config/.dashboard-access.XXXXXXXX")
unit_temp=$(mktemp "$dropin/.dashboard-access.XXXXXXXX")
trap 'rm -f -- "$env_temp" "$unit_temp"' EXIT
printf 'MACHMO_DASHBOARD_EMAILS=%s\n' "$normalized" > "$env_temp"
unset normalized
printf '[Service]\nEnvironmentFile=%%h/.config/mach-mo/dashboard-access.env\n' > "$unit_temp"
mv -Tf -- "$env_temp" "$env_file"
mv -Tf -- "$unit_temp" "$unit_config"
printf '%s\n' 'Dashboard email allowlist written. Deploy or restart the API to apply.'
