# Mini PC analytics implementation plan

> Execution uses the existing checkout with a lead-owned, disjoint scope. Each implementation slice has focused verification. The design is `docs/superpowers/specs/2026-11-17-mach-mo-mini-pc-analytics-design.md`, approved by the user on 2026-11-17.

**Goal:** Run the OPS-05 demo analytics slice with PostgreSQL and a private dashboard on the Arch mini PC.

1. Add HTTP contract tests for the public write and private summary listeners. Implement request validation, bounded ingestion, and PostgreSQL schema/queries under `server/analytics/`. Verify retention, least-privilege grants, and summary boundaries against a disposable PostgreSQL instance.
2. Reuse existing event emitters and dashboard. Track navigation only in the configured analytics build. Switch `/admin` to local access only on the SSH dashboard origin and preserve Supabase mode. Update privacy copy and verify route tracking and failure modes.
3. Add Caddy and systemd deployment configuration, a retention policy, backup/restore commands, and a rollback path. Public Caddy proxies exactly the write endpoint. The private dashboard listener must reject untrusted hosts. Keep credentials on the mini PC and retain the previous release.
4. Run focused Node and Chromium checks and the ngspice public build gate. Prepare a separate release package with hashes. Verify installed Node/PostgreSQL and SSH forwarding on the mini PC before cutover. Shepherd installation and test an event from demo HTTPS through the private dashboard. Record actual evidence and limitations.

Scope excludes accounts, community, project sync and remote compilation. Tests must distinguish HTTP request counts, browser events, and estimated tab sessions.
