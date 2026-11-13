# SDD ledger — plan: docs/superpowers/plans/2026-11-11-interactive-electronics-learning-stage-a.md

Plan: `docs/superpowers/plans/2026-11-11-interactive-electronics-learning-stage-a.md`
Spec: `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md`
Execution: Native, one writer.

Ruling: use the current project checkout after the user explicitly authorized direct edits — the parent repo is at `4119a1131bec2fdc70a0de7cf4b87adcf5545661`, 37 commits behind `origin/main`, and the complete `electronics-learning-demo/` directory is untracked, so a new worktree from the parent revision would omit the project files — cost if wrong: source edits share the existing project path rather than an isolated Git worktree.

Pre-flight shared interfaces:
- Task 1 → Task 2/4/5: `getLessonCircuitDoc('blink')` supplies the canonical sample; current docs/tests establish stable pin IDs and the 220 Ω example.
- Task 2/3 → Task 4: adapters and pure edit operations supply the workbench state boundary; legacy storage remains schema 4 and project bundles remain v1.
- Task 1/2/3 → Task 5: lesson workspace consumes the canonical document, compatibility projections, edit helpers, stable selection and layout separation.
- Task 4/5 → Task 6: E2E verifies cross-view identity and storage recovery on the integrated snapshot.

- Task 0 baseline: `npm.cmd test` → exit 0, 448/448 pass, duration 225.9 s; output `.tmp/stage-a-baseline-test.txt`.
Task 0: complete — fixed the PCB viewer theme and geometry. Original failure evidence: near-white `#e8f0f1` text on cream `#e8f2f2`; the ESP32 manifest contains five open Edge.Cuts path fragments which were filled independently, creating the diagonal black wedge in the board silhouette. `Pcb2DViewer.tsx` joins contiguous fragments within the 0.02 mm export-rounding tolerance into one closed path; manifest and source CAD remain unchanged. New E2E covers contrast, exact F.Cu/B.Cu counts, zones and outline closure at 1440×900 and 375×812. `npm.cmd run typecheck` exit 0; `npm.cmd run build:local` exit 0; focused E2E `npm.cmd run test:e2e -- --grep "PCB copper viewer"` exit 0 (1 passed, 7.3 s). Browser measured 13.51:1 net selector, 12.27:1 inspector heading; F.Cu 285 objects / 10 zones, B.Cu 83 / 0 zones. Screenshot: `.tmp/pcb-copper-panel-fixed.png`; mobile: `.tmp/pcb-copper-mobile-panel.png`. Unrelated favicon 404 remains.
Task 1: complete — canonical blink CircuitDocV2 fixture uses stable board/breadboard/resistor/LED IDs, sourced 220 Ω lesson value, and three explicit jumpers (GPIO→resistor strip; LED cathode→rail; rail→GND). R-to-LED is shared breadboard-strip connectivity, not an extra jumper. `node --test tests/lesson-circuit-docs.test.mjs`: expected RED before implementation (missing fixture module, 3 tests); after implementation 3/3 pass. `npm.cmd run typecheck`: exit 0.
Task 2: complete — pure `projectDocToTopology` uses CircuitDocV2 net membership and real pin IDs, emits stable projected connections, and reports hole-only/single-pin nets rather than inventing endpoints. Layout maps to display percentages and breadboard assembly mounts separately. `legacyWorkspaceToDoc` reuses the current schema-v4 migration without mutating data; `docToLegacyWorkspace` rejects hole-endpoint loss and preserves source extensions. `node --test tests/circuit-doc-adapters.test.mjs tests/migrate-v1-v2.test.mjs`: 8/8 pass; `npm.cmd run typecheck`: exit 0.
Task 3: complete — added pure immutable edit helpers for part/wire add/remove, value changes and separate layout moves. Invalid topology edits retain the original document and surface validator errors; removePart refuses live wire/openPins references; expect counters are recalculated. `node --test tests/circuit-doc-edits.test.mjs`: 5/5 pass; `npm.cmd run typecheck`: exit 0. Existing geometry provenance warnings remain visible and are not treated as edit errors.
Task 4: pending
Task 5: pending
Task 6: pending
