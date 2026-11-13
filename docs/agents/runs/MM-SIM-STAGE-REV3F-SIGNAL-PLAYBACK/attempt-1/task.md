# Attempt 1 — fix mobile wire controls and disambiguate trace marker

## Inputs

- Original scope and contracts: `../task.md`
- Failed verification: `../attempt-0/tester-artifacts/report.md`
- Original failure screenshot/trace: `../attempt-0/tester-artifacts/mobile-wiring-failure/`
- Starting snapshot: `base-snapshot.json` (three exact leased files, SHA-256)

## Findings to close

1. At 375×812, when `.button-lab-stage-scroll.scrollTop = 0`, selected-wire role, delete and reset controls are below the clipped stage viewport. Preserve the existing E2E assertions; make the editing controls reachable within the screen without relying on additional scroll.
2. During a write event to GPIO23, the selected GPIO18 scene marker has no explicit selected-state label and can be mistaken for the current event endpoint; it also remains after a stale/invalidated run. Make the event marker only represent a pin that participates in the current frame, while preserving selected identity and explicit selection information in the inspector. Add E2E checks for active and stale states in actual 3D when WebGL is available; report fallback separately.

## Exact lease

- `src/components/lesson/ButtonLedLessonLab.tsx`
- `src/components/lesson/ButtonLedLessonLab.css`
- `e2e/journeys.spec.mjs`
- Attempt-local reports/artifacts under `docs/agents/runs/MM-SIM-STAGE-REV3F-SIGNAL-PLAYBACK/attempt-1/**`

No `BreadboardEditor`, `AssemblyStage`, topology, interpreter, data, schema, package, hardware, firmware, or global navigation changes. Do not weaken or delete existing assertions. Use TDD: add/adjust focused E2E assertions before the UI fix.

## Exit checks

- Existing mobile wiring journey passes at 375×812 with stage scroll reset to zero and all asserted controls in view.
- In 3D playback, selecting GPIO18 while the current write frame is GPIO23 does not show an unlabeled GPIO18 event marker; selected GPIO18 remains explicitly identifiable in the inspector. Stale state clears any event marker.
- Read/branch/write playback, view synchronization, reduced motion, and desktop/mobile layout remain intact.
- Reviewer and Tester verify a fresh frozen snapshot. Full unit suite, typecheck, final local build and full E2E are rerun; browser assertions are not relaxed.
