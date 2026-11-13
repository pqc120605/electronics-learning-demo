# Attempt 1 — builder handoff

Date: 2026-11-12. Status: product writes frozen for independent QA. Canonical lease/status updates belong to the lead.

## Fix and root cause

The mobile lesson's expanded playback console reduced the stage viewport while the selected-wire panel retained its previous vertical spacing. At 375×812 this clipped the lower edit controls even with the stage at scrollTop 0. The fix is scoped to the lesson parent CSS: compact rail spacing and ellipsized neighbour titles (full accessible text remains), compact wire-panel gaps, and tighter console line/gap spacing. All existing wire actions and their 44 px control targets remain. The permanent layout still scrolls the circuit content when needed; primary selected-wire actions are fully exposed at scrollTop 0 for all three event frames and stale state.

The 3D marker received `projectedPin` directly from selection, independent of current event membership. The parent now passes that pin only when `frame.activeKeys.has(projectedPin)`. Read/branch retain the selected input marker; write and stale/empty frames clear it. Inspector selection remains unchanged. The visible provider limitation was shortened without changing its meaning.

## Exact changed files

- `src/components/lesson/ButtonLedLessonLab.tsx`: marker membership guard and shorter limitation copy.
- `src/components/lesson/ButtonLedLessonLab.css`: mobile-only rail, editor-panel and console spacing adjustments.
- `e2e/journeys.spec.mjs`: new mobile full-visibility test and desktop/mobile actual-WebGL marker tests. Existing wiring assertions are unchanged, including role/edit/delete/reset and the scrollTop 0 checks.

No edits to BreadboardEditor, AssemblyStage, interpreter, topology, data, schema, storage, dependencies or queue. Final three-file SHA-256 values are in `final-snapshot.json`.

## TDD and fresh verification

| Check | Actual result |
| --- | --- |
| RED: `npm.cmd run test:e2e -- --grep "mobile selected-wire controls\|3D event marker" --max-failures=2` | Exit 1. Two expected failures: mobile edit button viewport ratio 0.473; write frame retained one GPIO18 marker instead of zero. Third marker test not run due max-failures limit. Preserved screenshots/traces in `red-artifacts/`. |
| First focused fix run | Exit 1, 7/8 passed. Original desktop/mobile wiring, both marker tests, playback and reduced motion passed. The stricter new full-visibility test still found the role selector partly clipped (ratio 0.800); this prompted the final mobile console spacing adjustment. |
| Final: `npm.cmd run test:e2e -- --grep "mobile selected-wire controls\|3D event marker\|button LED wiring preserves endpoint identity\|signal playback follows one event\|reduced motion keeps signal"` | Exit 0, **8/8 passed**, 39.4 s. No skipped tests. Runner also completed `tsc -b` and local Vite build, 281 modules. |
| `npm.cmd run typecheck` | Exit 0, no diagnostics. |
| `node --check e2e/journeys.spec.mjs` | Exit 0. |

Loopback execution worked through the approved local test path. No full E2E or full unit suite was run by the attempt-1 builder. The final E2E run covers desktop 1440×900 and mobile 375×812, all manual/playback controls, all three event frames, stale invalidation, reduced motion, original wiring operations and page bounds. Both marker tests reached actual canvas/marker assertions and had zero WebGL fallback skips. The inspector retained `board-1:input` while the write/stale marker disappeared.

Preserved final evidence: `focused-report/index.html` (includes marker/playback screenshot attachments) and `focused-artifacts/` (including mobile/desktop wiring screenshots). The final mobile wiring screenshot was visually inspected; role, both endpoint edits, delete and reset controls are fully visible above the console. This is browser UI evidence, not physical or electrical validation.

## Handoff

Three leased files are frozen at `final-snapshot.json`; no test runner is waiting. Lead should release/freeze the canonical lease, obtain independent QA, then arrange the required final full unit suite/typecheck/local build/full E2E on the reviewed snapshot. No task completion, release or hardware validation verdict is claimed here.
