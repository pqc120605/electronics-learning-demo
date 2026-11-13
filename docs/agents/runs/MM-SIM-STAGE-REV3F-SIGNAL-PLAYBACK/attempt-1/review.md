# Independent QA review — attempt 1

- Date: 2026-11-12
- Reviewer role: qa_safety_reviewer
- Verdict: **pass — source review**
- Snapshot: `final-snapshot.json`; all three current source/test hashes were confirmed by the reviewer.
- Scope: attempt-1 task and builder report; `ButtonLedLessonLab.tsx`, `ButtonLedLessonLab.css`, `e2e/journeys.spec.mjs`; original playback implementation and updated E2E assertions.

## Findings

No blocking findings.

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| O1 | Low, coverage | The E2E marker path explicitly skips when WebGL is unavailable; a fallback should not count as actual 3D verification. | Accepted. Tester must report skip separately and verify the full suite obtains a real WebGL run for this host. |

## Verified by source review

- Mobile spacing adjustments in `ButtonLedLessonLab.css:216–241` are scoped to the Button LED layout. Control heights, focus styles, DOM order and actions remain intact.
- `ButtonLedLessonLab.tsx:298` only passes a selection marker when its key is present in `frame.activeKeys`; write frames exclude selected GPIO18, while stale/empty frames clear it. Inspector selection remains independent.
- Playback event mapping, timer cleanup and reduced-motion behavior remain unchanged.
- The shortened boundary copy at `ButtonLedLessonLab.tsx:382` still distinguishes educational logic from electrical measurements and firmware execution.
- New mobile assertions require full viewport intersection (`ratio: 1`) after stage scroll reset across read/branch/write/stale states; original wiring assertions remain present.
- New desktop/mobile marker checks verify GPIO18 during read/branch, absence during GPIO23 write/stale state, and preserve inspector selection. The fallback branch is explicitly skipped rather than treated as 3D verification.

## Not verified by QA

QA did not execute tests or browser scenarios. Full unit suite, typecheck, local build, full E2E, actual WebGL result and final hashes remain Tester/lead responsibilities. This review does not grant final acceptance or release approval.
