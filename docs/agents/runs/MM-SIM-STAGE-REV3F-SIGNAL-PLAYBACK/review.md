# Independent QA review — MM-SIM-STAGE-REV3F-SIGNAL-PLAYBACK

- Date: 2026-11-12
- Reviewer role: qa_safety_reviewer
- Verdict: **pass — source review only**
- Snapshot: `final-snapshot.json`; all five current source/test hashes were confirmed by the reviewer.
- Scope: task acceptance, builder report, five snapshot files, design §12.5–12.6, and supporting net/occupancy/3D projection code.

## Findings

| ID | Severity | Finding | Required action |
|---|---|---|---|
| O1 | Low | `e2e/journeys.spec.mjs:47–50` accepts either rendered canvas or WebGL fallback and checks shared status/selection; it does not prove that actual 3D wire/part geometry matches the current event frame. | Tester should inspect read/branch/write projection in real WebGL where available and verify stale clearing, reporting fallback separately. |
| O2 | Low | `ButtonLedLessonLab.tsx:118,298` keeps the selected `tracedPin` marker independent of the current trace event. Reviewer considers this selection feedback, but it could be mistaken for the active trace pin when input is selected during write. | Tester should verify the marker is not presented as the current event endpoint. |

## Verified by source review

- Read/branch frames use the input net only; write uses output/series nets only.
- Related parts, occupied holes and wire IDs derive from canonical identities; direction remains `none`.
- Invalid, stale, unsupported, disconnected and out-of-range contexts produce empty frames.
- Input/code/topology/board edits invalidate the run; timer effects clean up, manual navigation and reduced-motion changes stop automatic advancing.
- Native buttons are keyboard operable; the polite atomic status exposes event, source line/snippet and interpreter limits.
- Frame and selection state remain above the view projections.
- E2E assertions materially check event-specific net/wire behavior, keyboard action, pause, stale clearing and reduced motion.

## Not verified in this review

No unit, browser or physical/electrical checks were run by QA. Responsive layout, screen-reader observation, and actual WebGL projection remain for Tester. This source review is not final acceptance or public release approval.
