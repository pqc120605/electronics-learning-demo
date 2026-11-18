#!/usr/bin/env bash
set -euo pipefail
umask 077

root="$HOME/.local/share/mach-mo/analytics"
runtime_dir="$XDG_RUNTIME_DIR/machmo-analytics-pg"
units="$HOME/.config/systemd/user"
env_file="$root/service.env"
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
command -v node >/dev/null
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) process.exit(1)'
command -v initdb >/dev/null
command -v postgres >/dev/null
test -d "$script_dir/node_modules/pg"
install -d -m 700 "$root" "$units"

if [[ ! -f "$root/database/PG_VERSION" ]]; then
  initdb -D "$root/database" --auth-local=peer --auth-host=scram-sha-256 --encoding=UTF8 --locale=C.UTF-8
fi

cat > "$units/machmo-analytics-pg.service" <<'UNIT'
[Unit]
Description=Mạch Mở analytics PostgreSQL

[Service]
UMask=0077
RuntimeDirectory=machmo-analytics-pg
RuntimeDirectoryMode=0700
ExecStart=/usr/bin/postgres -D %h/.local/share/mach-mo/analytics/database -h 127.0.0.1 -p 55432 -k %t/machmo-analytics-pg -c shared_buffers=64MB -c max_connections=20
Restart=on-failure
RestartSec=3s

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now machmo-analytics-pg.service
for attempt in {1..15}; do
  pg_isready -q -h "$runtime_dir" -p 55432 && break
  sleep 1
done
pg_isready -h "$runtime_dir" -p 55432
admin_psql=(psql -X -v ON_ERROR_STOP=1 -h "$runtime_dir" -p 55432)
if [[ ! -f "$env_file" ]]; then
  password=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')
  if [[ $("${admin_psql[@]}" -d postgres -Atc "SELECT count(*) FROM pg_roles WHERE rolname='machmo_analytics_app'") == 0 ]]; then
    printf 'CREATE ROLE machmo_analytics_app LOGIN PASSWORD '\''%s'\'';\n' "$password" | "${admin_psql[@]}" -d postgres
  else
    printf 'ALTER ROLE machmo_analytics_app PASSWORD '\''%s'\'';\n' "$password" | "${admin_psql[@]}" -d postgres
  fi
  if [[ $("${admin_psql[@]}" -d postgres -Atc "SELECT count(*) FROM pg_database WHERE datname='machmo_analytics'") == 0 ]]; then
    "${admin_psql[@]}" -d postgres -c 'CREATE DATABASE machmo_analytics'
  fi
  "${admin_psql[@]}" -d postgres -c 'REVOKE CONNECT ON DATABASE machmo_analytics FROM PUBLIC; GRANT CONNECT ON DATABASE machmo_analytics TO machmo_analytics_app;'
  env_stage=$(mktemp "$root/service.env.XXXXXXXX")
  printf 'MACHMO_ANALYTICS_DATABASE_URL=postgresql://machmo_analytics_app:%s@127.0.0.1:55432/machmo_analytics\n' "$password" > "$env_stage"
  printf '%s\n' 'MACHMO_ANALYTICS_ORIGINS=https://machmo.tail3b04e8.ts.net' >> "$env_stage"
  mv -T -- "$env_stage" "$env_file"
  unset password
fi
"${admin_psql[@]}" -d machmo_analytics -f "$script_dir/schema.sql"

cat > "$units/machmo-analytics.service" <<'UNIT'
[Unit]
Description=Mạch Mở analytics API
Requires=machmo-analytics-pg.service
After=machmo-analytics-pg.service

[Service]
UMask=0077
EnvironmentFile=%h/.local/share/mach-mo/analytics/service.env
ExecStart=/usr/bin/node %h/.local/share/mach-mo/analytics/app/main.mjs
Restart=on-failure
RestartSec=3s
NoNewPrivileges=yes

[Install]
WantedBy=default.target
UNIT

ln -sfnT "$script_dir" "$root/app"
systemctl --user daemon-reload
systemctl --user enable machmo-analytics.service
systemctl --user restart machmo-analytics.service
for attempt in {1..15}; do
  if curl -fsS --max-time 3 -H 'Host: 127.0.0.1:8081' 'http://127.0.0.1:8788/api/analytics/admin/summary?start=2026-01-01&end=2026-01-01' -o /dev/null; then
    exit 0
  fi
  sleep 1
done
exit 1
