# SDD ledger — Interactive Electronics Learning Rev 2

Plan: `docs/superpowers/plans/2026-11-11-interactive-electronics-learning-rev2.md`
Spec: `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md` §12
Execution: native, one source writer. Founder approved the design, versioned storage direction, implementation plan and direct editing on 2026-11-12.

## Preflight

- Existing completed work: canonical LED fixture, CircuitDocV2 adapters, immutable basic edits. Re-run affected tests after integration; do not duplicate these files.
- Existing v4 storage is `machmo-builder-session`; it is pin-only and must remain byte-identical. V1 project export is separate and must refuse hole endpoint loss.
- `createNetIndexV2` already owns pin/hole/strip connectivity; use it for editor, schematic, assembly and lesson projections.
- Board profile `esp32DevkitModel.features` contains documented board subcomponent descriptions; reuse by stable `feature.id`.
- Git root/status command currently errors (`fatal: cannot change to 'D:/StartupOS'`); no commit/worktree operation until root is clarified. Source edits remain in the authorized product folder.
- No dependencies, sibling app edits, Claude, device operations or external service calls.

## Tasks

- Task 1 storage v5: implemented; full suite and typecheck pass.
- Task 2 immutable wire endpoint/role edits: implemented; full suite and typecheck pass.
- Task 3 2D breadboard wire editor: implemented; full suite and typecheck pass.
- Task 4 conventional schematic: implemented; full suite and typecheck pass.
- Task 5 V2 3D projection: implemented; full suite and typecheck pass. Geometry remains limited to recorded CAD/parametric evidence.
- Task 6 workbench integration: implemented; full suite, typecheck and local build pass.
- Task 7 information-rich lesson, board feature inspector and provider-backed signal flow: implemented for the canonical LED lesson; full suite, typecheck and local build pass.
- Task 8 E2E and evidence report: complete. Full Playwright run passed 43/43, including migration preservation/export refusal, stable cross-view wire identity, lesson topology and information flows at 375×812 and 1440×900; both screenshots captured.

## Decisions

- Ruling: keep schema-v4 drafts read-only while a migration decision is pending — Task 8 showed the legacy autosave could rewrite the raw v4 value before explicit v5 consent, contrary to the byte-preservation requirement — this temporarily disables legacy editing until the user accepts or leaves the preview.

## Final verification — 2026-11-12

| Command | Result |
| --- | --- |
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd test` | exit 0; 486 passed, 0 failed, 0 skipped |
| `npm.cmd run build:local` | exit 0 |
| `npm.cmd run test:e2e` | exit 0; 43 passed, 0 failed |

Browser evidence: `.tmp/playwright-results/journeys-lesson-code-steps-ff3eb-feature-selection-is-shared/lesson-circuit-375.png` and `lesson-circuit-1440.png`.

## Post-stage handoff

- Lesson inventory: `docs/agents/runs/MM-SIM-STAGE-REV2/lesson-matrix.md`.
- Recommended next slice: `button-led`, because it follows `blink` in the curriculum, has an existing supported code-subset provider and legacy wiring preset, and has CAD-backed button/LED/resistor models. Key contract: four button legs map to two logical contacts; INPUT_PULLUP is active-low; no electrical solve is implied.
- Follow-on implementation plan: `docs/superpowers/plans/2026-11-12-interactive-button-led-lesson.md`. It is intentionally a separate reviewed slice; Rev 2 files are not expanded to cover every lesson.
