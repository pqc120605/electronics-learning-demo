# Mini PC analytics verification

OPS-05 pilot. The completed build records approved page and learning events in PostgreSQL and renders a private report. Production deployment and live telemetry are pending SSH access.

- Four HTTP contract tests passed. They exercised private read rejection on the public listener, cross-origin/invalid/oversized writes, a global limit, host validation and Vietnam date bounds.
- One real PostgreSQL 17 integration test passed. It exercised 65 concurrent attempts for one session with 60 inserts, aggregation, rejected direct deletes and updates, and expiration of an event over 30 days old. `pg_dump` and `pg_restore` into an independent test database completed and restored 62 fixture rows.
- Chromium passed the final test against the flagged web build and PostgreSQL. The test observed the home page, a selected ESP32 lesson, exactly one page view for a dynamic lesson, HTTP 404 for public report access, and a rendered private dashboard. The test host used local HTTP routing, so it does not prove Caddy, SSH forwarding or Funnel on Arch.
- Independent Codex QA requested fixes to rollout rollback and duplicate page-view reporting. Both were implemented and reviewed again. QA passed the code follow-up. The rollback now starts before either live file is changed and smoke verifies that public Caddy reaches the write endpoint. Production rollback and real transport checks remain pending.
- Both Arch shell scripts passed `bash -n`. The final flagged `npm.cmd run build:public` passed, including the ngspice gate. The preexisting rp2040js bundler warning remained.

Bundle `.tmp/ngspice-rebuild/mach-mo-analytics-2026-11-17.tar.gz` (69,817,092 bytes), SHA-256 `117a5222657548d6b2938cc31580ea0ca4bc9d12b8c2176d6e7c8127eefc610e`. It includes the web build, upstream WASM source/relink notices, application server with locked dependencies, and deployment commands. The database password is generated on Arch.

SSH to the mini PC reached the host and was denied with the temporary key. No file transfer or service change to the live mini PC was performed. After the owner enables temporary SSH access, check installed runtime tools, stage the verified bundle, apply the local database setup, and verify the real public/private Caddy paths in `docs/deployment/arch-mini-pc-analytics.md`.

Follow-up: the owner added the temporary key and SSH succeeded. The release archive and extracted WASM matched their hashes on Arch. The web is staged at `~/.local/share/mach-mo/releases/2026-11-17-analytics-117a5222` and the backend at `~/.local/share/mach-mo/analytics/releases/2026-11-17-analytics-117a5222`. Both shell scripts passed `bash -n` on Arch. The installed Caddy validated the private configuration, the requested ports were free, and the previous web release remained active with HTTP 200. Node.js and PostgreSQL packages were absent during preflight. The owner started the Arch package installation and the deployment waits for these two packages.

## Live deployment passed on 2026-11-17

The owner installed Node.js 26.13.1 and PostgreSQL 18.7. The dedicated PostgreSQL cluster and API started under `volnexus`, and Caddy switched the `current` symlink to `2026-11-17-analytics-117a5222`. All four user services (PostgreSQL, API, Caddy and Tailscale) were active and enabled. PostgreSQL (55432), the API listeners (8787/8788), Caddy/HTTPS origin (8080), and the admin dashboard (8081) listen only on `127.0.0.1`. Both `/admin` and its summary returned 200 through private Caddy on Arch. The owner's SSH forward was not exercised from the laptop.

Chromium opened `https://machmo.tail3b04e8.ts.net/` (200). Its `page_view` returned 204, and the same public origin returned 404 for the private read path. The Windows runner still could not resolve the hostname via its default DNS, so Chromium used a public Tailscale relay returned by DNS-over-HTTPS, retaining the real hostname and validating TLS. On Arch the tagged fixture event was stored exactly once and its category appeared in the private day summary.

Created and restored `~/.local/share/mach-mo/analytics/backups/analytics-20261117-133252.dump` on Arch. The restored temporary database contained the same fixture event exactly once and was removed afterward. This backup is on the mini PC's SSD. The previous Caddyfile is `~/.config/mach-mo/Caddyfile.before-analytics-20261117-133109` and the previous web target remains `~/.local/share/mach-mo/releases/2026-11-17-4d174aa8`. Reboot was not tested. The deployment SSH key was revoked.
