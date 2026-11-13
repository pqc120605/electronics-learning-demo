# MM-SIM-STAGE-REV3A-BUTTON-TOPOLOGY — lead integration report

**Date:** 2026-11-12  
**Scope:** Canonical `button-led` CircuitDocV2 fixture, centered four-leg footprint fit, cross-view hole identity, and the stale full-suite layout expectation.  
**Review status:** Pending independent review on the frozen snapshot.

## Result

The button lesson fixture is implemented and the regression suite is green. The four physical switch legs resolve to the same stable holes in the 2D mount resolver and 3D assembly plan. `contactA` and `contactB` remain separate electrical contacts; button input and ground remain on separate nets; the LED series path remains intact.

The lead added one path after the builder handoff: `tests/layout-2d.test.mjs`. Its old expected list still marked `button-led` as geometry-blocked even though the centered mount now migrates within the existing 0.7 mm bound. The list now retains only `buck-boost-concept`, `dc-motor-driver` and `mosfet-switch`. No circuit data, source geometry, manifest, assembly algorithm or global tolerance changed in this follow-up.

## Changed product files

- `src/data/lessonCircuitDocs.ts`
- `src/lib/mountResolve.ts`
- `tests/lesson-circuit-docs.test.mjs`
- `tests/circuit-doc-v2.test.mjs`
- `tests/assembly-layout-v2.test.mjs`
- `tests/layout-2d.test.mjs` — lead-only regression expectation update

The five builder files and their handoff hashes are recorded in `builder-handoff.md`. This report’s current hashes are in `final-snapshot.json`.

## Verification

| Command | Exit | Result |
|---|---:|---|
| `node --test --test-concurrency=1 tests/layout-2d.test.mjs` before assertion update | 1 | 4 passed, 1 failed; failure showed only the stale `button-led` blocked-list entry. |
| `node --test --test-concurrency=1 tests/layout-2d.test.mjs` after assertion update | 0 | 5 passed, 0 failed. |
| `npm.cmd run typecheck` | 0 | Passed. |
| `npm.cmd test` | 0 | 491 passed, 0 failed, 0 skipped. |
| `node D:/StartupOS/docs/agents/validate.mjs` after queue scope/lease correction | 0 | 62 tasks, 143 capabilities, warnings `[]`, errors `[]`. |

Builder-reported pre-integration evidence is retained in `builder-handoff.md`: focused Slice A tests 22/22 and typecheck passed; the first full suite was 490/491 before the lead fixed the stale assertion.

## Hashes

See `final-snapshot.json` for SHA-256 of all six changed source/test files. The evidence is tied to that exact frozen file snapshot; further edits require review and affected checks again.

## Limits and next step

- The footprint result verifies the project’s current manifest geometry and resolver contract; it does not prove a physical switch or board sample fits.
- Three unrelated legacy lesson geometries remain blocked and were not modified.
- No browser e2e, hardware/device operation, electrical solver result or physical measurement was claimed by this slice.
- The task is now handed to an independent reviewer. After review passes, the next approved slice is typed button input/read/branch/write events; do not begin the button lesson UI slice until that contract is accepted.

## Final post-review verification (2026-11-12)

The reviewer confirmed the frozen six-file hashes were unchanged. Lead reran:

| Command | Exit | Result |
|---|---:|---|
| `npm.cmd run typecheck` | 0 | Passed. |
| `npm.cmd test` | 0 | 491 passed, 0 failed, 0 skipped. |
| `node D:/StartupOS/docs/agents/validate.mjs` | 0 | 62 tasks, 143 capabilities, warnings `[]`, errors `[]`. |

The exact reviewed source/test hashes remain in `final-snapshot.json`; only review/run evidence and the canonical queue state changed after freeze.
