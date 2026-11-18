# Self-build verification — 2026-11-17

Scope: OPS-09 release provenance and SIM-02 compatibility. No capability-depth increase or physical hardware validation claimed. No mini-PC deployment performed.

## Build

ngspice 45.2 source: `724dc77b9153dc75eaec474b1f7a44f1fcf5f362`. Wrapper source: `be15b07abaf2c8a77623e4fc700d260004fbfa5a`. Emscripten 4.0.10 base image digest is pinned in `scripts/ngspice-build/sources.json`. Autotools/package versions, configure headers, source patch, link map, object archives and sources are included in public license materials.

Final runtime header: `Tue Nov 17 08:58:08 UTC 2026`. WASM SHA-256 `3096ce2c499c3062472b9d7953f5141d75a019296e22b0142f4979e5894008ec`, bytes 4,519,343. Complete matching JS/WASM comes from a local dependency; offline npm installation changed only the engine dependency/lock entries. Preparation verifies all four files before copying.

Build corrections: export Git archives with LF rather than Windows autocrlf; omit current BSIM4 and HiSIM families after license-header inspection; use a WASM virtual interactive terminal to avoid treating Node stdin as an endless input circuit; retain exact source patch and relink state. These corrections are in the supplied clean-build recipe. Incremental final link amended main.c; bit-identical rebuilds at different embedded build times are not claimed.

## Executed by lead

- `node scripts/audit-spice-engine.mjs`: paired package/public hash, runtime header and DC divider pass (2.5 V).
- 39 focused SPICE tests: engine, calculator handoff, probe currents, packaging, browser loader, provenance, progress/routes and initial self-build tamper tests passed.
- `node --test tests/spice-self-build.test.mjs`: 3 passed, including repeated DC/transient/AC solves on one instance. RC at 5 ms = 4.966311656553341 V; AC at 159.154943 Hz magnitude = 0.7071067813906877.
- Six provenance/material tests pass, including every material hash and gate failure for a pending-review fixture.
- Archive-only wrapper reconstruction executed successfully; output hash matches delivered wrapper.
- `npm.cmd run build:local`: passed. Existing rp2040js eval warning remains outside changed scope; no new application eval introduced.
- Chromium Playwright: 2 existing SPICE probe tests passed (9.3 s) against the built site on isolated port 5289. Real worker solved node voltage/current (2.5 V/2.5 mA) and transient probe cursor updates.

The shared e2e port 5196 was occupied; a scoped config under `.tmp/ngspice-rebuild` used port 5289 without stopping another server. Initial provenance tests asserted the old unknown-source state; these were replaced with positive source/material integrity assertions and preserved negative gate/mutation cases.

Independent materials review: review.md. After applying review metadata, `npm.cmd run audit:spice-engine`, `npm.cmd run check:public-release`, and `npm.cmd run build:public` all exited 0. Eleven final provenance/packaging/runtime tests passed with the cleared manifest. The release output WASM hash matches the reviewed public source asset; required runtime source materials are present in `dist/licenses/ngspice-selfbuild/`. The existing rp2040js dependency warning remains; no claim of website-wide audit completion is made.

## Deployment boundary

Arch mini PC details supplied: i5-7500, 4 GB RAM, SSD 256 GB, no domain. Deployment guide: `docs/deployment/arch-mini-pc.md`. Need actual LAN address/Linux username and terminal or SSH handoff before transferring files. Drafts stay browser/origin-local; Supabase services and Arduino compilation are not implicitly hosted by this static server.
