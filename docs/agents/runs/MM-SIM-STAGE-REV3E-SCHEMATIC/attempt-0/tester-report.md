# Tester report — attempt 0

**Verdict:** FAIL on full E2E; source hashes unchanged.  
**Environment:** Windows 10.0.26300 x64; Node 24.21.0; npm 11.19.0; Playwright 1.64.1; local Chromium `Google Chrome for Testing 156.0.8078.4`.  
**Date:** 2026-11-12.

## Commands

| Command | Exit | Result |
|---|---:|---|
| `node --test tests/schematic-layout-v2.test.mjs tests/circuit-schematic-v2.test.mjs tests/circuit-doc-edits.test.mjs` | 0 | 17 passed, 0 failed/skipped |
| `npm.cmd run typecheck` | 0 | Passed |
| `npm.cmd test` | 0 | 508 passed, 0 failed/skipped; 334.0 s |
| `npm.cmd run build:local` | 0 | Passed; Vite transformed 281 modules |
| `npm.cmd run test:e2e` (sandbox) | 1, interrupted | Build passed; 0 tests started; local loopback probe failed `EACCES`; stopped with Ctrl+C |
| `npm.cmd run test:e2e` (approved local-loopback escalation) | 1 | 48 passed, 2 failed; 2.9 min; normal config, one worker, zero retries |

## E2E findings

1. **New schematic journey at 375×812:** `e2e/journeys.spec.mjs:289` timed out expecting one overlay path for `w-input-to-button`, got zero. The screenshot shows the selected hole is highlighted; `BreadboardProjection` omits path geometry when a pin/hole endpoint lies outside its horizontal picker viewport. This does not prove selection state was lost. The test did not bring both endpoints into the visible picker regions before requiring the overlay path.
2. **Existing lesson code-highlight journey at 1440×900:** `e2e/journeys.spec.mjs:610` expected 3 `.net-active` elements but received 6 because both canonical line groups and bridge overlay groups share that class. Source confirms the broad selector now counts both representations.

Both Rev3D endpoint wire journeys passed at 1440×900 and 375×812. Rev3E desktop passed at 1440×900. The rest of the mobile schematic journey after line 289 was not run.

## Artifacts

- `../tester-artifacts/full-e2e-report/index.html`
- `../tester-artifacts/teaching-schematic-1440x900.png`
- `../tester-artifacts/teaching-schematic-375x812.png`
- `../tester-artifacts/full-e2e-results/`

All six hashes matched `final-snapshot.json` before and after test. Product source, test assertions, queue and configuration were not modified by Tester.
