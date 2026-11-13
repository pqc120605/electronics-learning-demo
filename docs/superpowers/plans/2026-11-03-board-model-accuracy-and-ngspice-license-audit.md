# Board Model Accuracy and ngspice License Audit Plan

> **For agentic workers:** Follow this plan inline. Use TDD for behavior changes; do not stage or commit.

**Goal:** Audit all 14 published board model manifests (15 GLB scenes including the separate LED assembly) against recorded CAD evidence and make the ngspice binary's redistribution status explicit and evidence-backed.

**Architecture:** Reuse the existing GLB structural audit, asset hash lock, board source manifests, and SPICE runtime provenance audit. Record CAD-reference accuracy separately from physical-board validation. Keep unresolved binary provenance as a release gate instead of inferring permission from the wrapper's MIT license.

**Tech Stack:** Node.js ESM, existing project test runner, Vite GLB parser, source/model manifests, official board and ngspice documentation.

**Spec:** User request in the current Mạch Mở session; current implementation and limits are described in `docs/board-model-sourcing.md` and `docs/MACH-MO-MVP-STATUS.md`.

## Global Constraints

- Preserve user changes; do not stage, commit, push, or publish.
- Distinguish source-CAD agreement from measured physical accuracy.
- Never state that `eecircuit-engine` MIT automatically licenses embedded ngspice WASM.
- Do not change model geometry unless an authoritative source proves the correction and alignment remains verifiable.
- Do not make legal conclusions; report distribution evidence and unresolved obligations.

## Review Focus

- A published GLB differs from its asset lock or source inventory hash; verify using the existing asset-lock tests and audit output.
- A pin anchor lies outside scene bounds or points to a missing node; verify with `audit-board-models.mjs`.
- An inherited/approximate anchor is described as direct board-specific CAD; audit each source record and state the evidence level in the report.
- The ESP32-S3-DevKitC-1 outline discrepancy is hidden or silently scaled; compare source PADS dimensions, official dimension PDF, and current model inventory.
- The published SPICE binary is described as cleared while source commit/module inventory remains unknown; pin a regression test to explicit `not-cleared` status.

---

### Task 1: Re-run existing provenance and geometry checks

**Files:**
- Read: `scripts/audit-board-models.mjs`, `scripts/audit-spice-engine.mjs`
- Read: `src/data/board-asset-lock.json`, board model inventories, and source records
- Test: existing `tests/data-integrity.test.mjs`, `tests/board-model-audit.test.mjs`

- [x] Run `node scripts/audit-board-models.mjs` and `npm.cmd run audit:spice-engine` from `electronics-learning-demo`; retain the full output.
- [x] Read the fresh board audit output and `src/data/board-asset-lock.json`; record each scene's hash prefix, node/hotspot counts, missing/orphan nodes, meshless feature count, anchor count, and out-of-bounds anchors. The first pass found Espressif's published S3 DevKitC-1 viewer was missing from both audit and hash exporters; imports and regression coverage are now complete.
- [x] Compare source hashes/transforms in `src/data/*inventory.json`, the per-board `SOURCE.md` files, and `src/data/boardModelSources.ts`; list exact dimensional differences only where both source and rendered measurements are recorded.
- [x] Mark physical-board fit and populated-part identity as unverified wherever there is no physical measurement/BOM confirmation.

### Task 2: Publish a board model accuracy report

**Files:**
- Create: `docs/board-model-accuracy-audit-2026-11-03.md`
- Reference: `src/data/boardModelSources.ts`, `src/data/*inventory.json`, `assets/boards/**/SOURCE.md`

- [x] Use the output of `node scripts/audit-board-models.mjs` to list all 14 board viewers and the separate ESP32 LED assembly with exact ID/revision from `src/data/boardModelSources.ts` and board source records.
- [x] For each entry, record current SHA prefix, structural/hotspot result, pin evidence basis (direct CAD, inherited, or none), reported component-body mapping, known dimension residual, and physical sample status.
- [x] Record the confirmed Espressif DevKitC-1 V1.1 discrepancy exactly as 62.865 mm source PADS outline versus 62.74 mm manufacturer dimension PDF; explain why the current source-aligned model is retained rather than silently altered.
- [x] Assign an explicit evidence conclusion per entry and state concrete next evidence needed, such as exact revision BOM or front/back physical measurements.

### Task 3: Make ngspice public redistribution status explicit

**Files:**
- Modify: `public/licenses/spice-engine-provenance.json`
- Modify: `public/licenses/NGSPICE-NOTICE.txt`, `public/licenses/README.txt`
- Modify: `docs/MACH-MO-MVP-STATUS.md`
- Test: `tests/spice-engine-provenance.test.mjs`

- [x] Add a failing test requiring the WASM public path and `not-cleared` redistribution status while source commit and compiled license inventory are unknown.
- [x] Run the focused test and confirm it fails for the missing status.
- [x] Record the actual public artifact path, current binary size/hash/runtime, missing source commit/build flags/component inventory, and the exact artifacts needed to clear distribution.
- [x] Correct the notice to include the upstream Modified BSD base; documented `tclspice`/`numparam` LGPLv2 and OSDI MPL 2.0 exceptions; XSPICE public-domain status; and the manual's GPL-linking discussion. Explicitly state that exact WASM component inventory is unavailable and `table.cm` presence is unestablished; also preserve the manual's note that Modified BSD is GPL-compatible.
- [x] Run `node --test tests/spice-engine-provenance.test.mjs` and `npm.cmd run audit:spice-engine` from `electronics-learning-demo`; regression suite confirms the license gate and public artifact hash, and the runtime smoke test solves the expected 2.5 V divider.

### Task 4: Update project status and verify

**Files:**
- Modify: `docs/MACH-MO-MVP-STATUS.md`
- Reference: `docs/board-model-accuracy-audit-2026-11-03.md`

- [x] Update the board and SPICE sections of `docs/MACH-MO-MVP-STATUS.md` to link the new model-accuracy report and mark public WASM redistribution `NOT CLEARED` until the exact source and license inventory is established.
- [x] Run, from `electronics-learning-demo`, `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, `node scripts/audit-board-models.mjs`, and `npm.cmd run audit:spice-engine`; all completed successfully (288/288 tests, typecheck/build exit 0, 15 scenes structurally valid, SPICE 2.5 V smoke test passed). `git diff --check` reports no whitespace errors; only existing LF/CRLF conversion warnings remain.
