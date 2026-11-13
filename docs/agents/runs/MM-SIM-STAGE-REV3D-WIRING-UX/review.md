# Independent review — MM-SIM-STAGE-REV3D-WIRING-UX

- Review date: 2026-11-12
- Reviewer: independent read-only technical reviewer
- Snapshot: [`final-snapshot.json`](final-snapshot.json)
- Verdict: **PASS**.

## Review

- The new Select/Connect state is isolated to the button lesson; inspecting an endpoint no longer starts a connection implicitly.
- Endpoint keys use canonical pin/hole IDs. Duplicate and identical endpoints are rejected, new IDs remain unique, and successful add/edit/role/delete/reset operations update the canonical document through existing validators.
- Rejected edits never commit a candidate document or create a new run; the original endpoint and wire remain intact. Valid topology changes clear the old educational trace.
- Keyboard roving focus is implemented for endpoint selection, with pointer drag/click paths retained. Role, endpoint, net and delete controls remain available in the selected-wire panel.
- The 400 tie-point breadboard assumption and educational trace labels remain explicit. The new Connect mode applies only to the lesson-specific use of the shared editor.
- Independent SHA-256 reads matched all five leased paths; see `final-snapshot.json`. Reviewer made no edits and ran no suites.

## Residual limits

The current browser assertions cover keyboard/click connection selection, successful drag, cancel, endpoint edit and rejection. They do not test Escape or pointer-cancel midway through a drag. Touch-device behavior was not manually tested; the mobile path uses two endpoint selections. Tester evidence is required for actual responsive viewport fit and commands.

## Accessibility regression re-review — repaired snapshot

- Full E2E on the first reviewed snapshot found `label-content-name-mismatch` for the board endpoint controls at both 375 px and 1440 px.
- The one-file repair makes each accessible name begin with the exact visible pin text (`partId · pin label`), then adds the stable endpoint ID and context.
- Independent read-only re-review: **PASS**. The repaired source hash matches `repaired-snapshot.json` (`c95f363a4f1ed7201cd183e95c2b2053911cc8dfe1a95925ddf33c12dfac1bd2`).
- No assertions were changed. Full verification on the repaired snapshot is pending in `tester-report.md`.

## Legacy workbench label preservation — retry 2

- The full-suite run showed two existing workbench journeys depended on the pre-existing non-lesson endpoint accessible name.
- The retry keeps `Chọn chân ${partId} ${label}` unchanged outside lesson mode; Button LED lesson mode still starts with the exact visible pin text and appends its stable endpoint ID.
- Independent read-only re-review: **PASS**. The source hash matches `candidate-snapshot-attempt2.json` (`a8bdc9dbd7885106881dd4f3ee19bde6c6208b180ad1bb6f463885bf0d9961fe`).
- No test assertions were changed. Full verification on the repaired snapshot is pending.
