# Analytics on the Arch mini PC

This is the OPS-05 demo slice. Public Caddy serves the existing site on loopback port 8080 and forwards only `/api/analytics/events` to the collector. The private admin origin is `http://127.0.0.1:8081`, reached through an authorized SSH forward. The user services use ports 8787/8788 for the API and 55432 for a dedicated local PostgreSQL cluster. There is no `sudo` requirement once Node.js 22+ and PostgreSQL binaries are installed.

## Build and verify

- The browser build uses `VITE_MACHMO_LOCAL_ANALYTICS=true` with `npm.cmd run build:public`. Keep its source/relink/notice files alongside the WASM. The analytics server installs locked dependencies in `server/analytics` using `npm.cmd ci --omit=dev --ignore-scripts`.
- Run `node --test tests/local-analytics.test.mjs`. With a disposable database and `MACHMO_TEST_DATABASE_URL` set, run `node --test server/analytics/postgres.test.mjs` after seeding exactly one event older than 30 days. Use fresh fixture contents per run. With the flagged web build and the database still running, set `MACHMO_ANALYTICS_E2E=1` and use Playwright config `server/analytics/playwright.config.mjs`. These tests use separate loopback origins for visitor and admin.
- The release bundle contains `web/` and `backend/`. Check checksum after transfer. Keep the previous web release directory and Caddyfile.

## Install and switch releases

1. Confirm `node`, `postgres`, `initdb` and `pg_isready` on Arch. If missing, install official `nodejs` and `postgresql` packages via Arch's normal system upgrade procedure. Do not initialize the system-wide database for this install. The dedicated user cluster and database grants are handled by `setup-arch.sh`.
2. Extract and stage the web folder under `~/.local/share/mach-mo/releases/` and the backend under a stable per-release directory within `~/.local/share/mach-mo/analytics/`. Preserve browser origin, permissions and all WASM license materials. Run `bash <backend>/setup-arch.sh`. The script creates local DB credentials with owner-only permissions and validates an empty or existing summary. Run it as `volnexus`, without sudo.
3. Run `bash <backend>/enable-web-arch.sh <staged-web-directory>`. It validates a candidate Caddyfile, backs up the old configuration, switches the release and checks public read rejection plus private summary. It rolls back to the old config and old release on a failed smoke check.
4. From the laptop, open a separate SSH port forward with authorized credentials: `ssh -N -L 8081:127.0.0.1:8081 volnexus@192.168.0.157`. Keep that terminal open and navigate to `http://127.0.0.1:8081/admin`. If the laptop port is in use, free it before opening the forward, because the dashboard checks this exact loopback origin. Do not add port 8081 to Funnel.
5. Use the public URL to open the home page and a lesson, then compare the private report. Check that the public summary route returns HTTP 404 and that the page remains usable when event collection is unavailable. An observed session means a tab session, not a verified unique person.

## Backup and rollback

Use the owner's local Unix socket for database maintenance. Create `pg_dump -Fc -n machmo_analytics` backups and retain a copy off the mini PC for disk failure. Test a backup by restoring into an empty test database with the same application role available. Use the restored database only after checking record counts and permissions. The server removes raw events older than 30 days at startup and once an hour while running. Handle backup retention separately according to the same purpose and access restrictions.

If a manual rollback is needed, use the previous Caddyfile and release path printed by `enable-web-arch.sh`, then restart `mach-mo-web.service`. Keep the database directory and backup files so the collected data can be recovered. Stopping `machmo-analytics.service` stops writes and reports. The separate database service can be shut down after saving a backup.
