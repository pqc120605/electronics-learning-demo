# Independent review — audit fixes

Date: 2026-11-17. Reviewer: `audit_fixes_qa`, GPT-6.1 Sol High, read-only. Builders: Codex lead and `audit_catalog_fixes`, separate leases. No Claude calls.

## Final verdict: PASS for code scope

Reviewed snapshot: [review-snapshot-3.json](review-snapshot-3.json). All **25 file hashes** matched; no remaining verified finding. Final full test/browser results are a separate lead-owned verification gate. This review does not grant public release, physical/model verification or hardware approval.

The reviewer inspected the earlier 23-file snapshot, requested correction of motor protection claims for preserved legacy drafts, and re-reviewed the revised implementation. Protection claims now derive from actual topology; incomplete old drafts get an explicit warning, without automatic rewriting. G6 retains both displayed 2D diagnostics and 3D route checks, including R8 bend warnings.

## Snapshot-3 delta

Exactly four files differ from snapshot 2:

- `src/components/builder/BreadboardDiagram.tsx`
- `tests/breadboard-diagram.test.mjs`
- `e2e/audit-fixes.spec.mjs`
- `e2e/journeys.spec.mjs`

Reviewer confirmed occupied SVG holes keep stable endpoint IDs, role, roving tabIndex, focus/Enter/Space handlers and membership in arrow-key navigation. Inline `pointerEvents:none` overrides the general pointer-events rule, allowing the mounted terminal underneath to receive pointer input. The occupied-hole accessible label explains the keyboard/detailed-grid path.

For a deliberate pointer request to select an occupied hole itself, the existing journey now opens the detailed hole grid, selects that hole, then closes the grid. G4 rejection, unchanged wire list, retained ready trace, and one-screen assertions remain intact. Keyboard input still exercises the SVG hole. The new static regression checks the occupied SVG control exists and yields pointer input. Reviewer read the RED and GREEN logs (15/15 focused pass), but did not execute tests or edit any source/assertion.

The new reference-board E2E locator is scoped to the CAD reference warning rather than matching multiple unrelated warnings; URL, active tab, execution board, selected reference board and reference-mode assertions are unchanged.

Prior snapshot-2 PASS carries forward for unchanged bytes.

## Final CSS follow-up: snapshot 4

Final reviewed snapshot: [review-snapshot-4.json](review-snapshot-4.json). All25 hashes matched; only `src/styles/one-screen.css` differs from snapshot3. Verdict **PASS**.

Affected E2E found that a sticky zoom toolbar could intercept the VCC endpoint after scrolling on mobile. The selector now uses `position:static`, removing top/z-index overlay positioning while retaining control size and separate canvas scrolling. No tests or endpoint semantics changed in this delta.

Reviewer read `e2e-affected-4.log` (8/8 passed, including both wiring journeys) and [browser-toolbar-keyboard-final.json](evidence/browser-toolbar-keyboard-final.json): VCC center hits `board-1:vcc`, toolbar position is static, ArrowDown from10b focuses occupied10c. Reviewer did not execute tests or edit files. No new verified finding; prior PASS carries forward for all other bytes.

## Final test-only follow-up

Independent verdict **PASS** on [snapshot 5](review-snapshot-5.json). All 26 hashes matched. The prior 25 files retain their snapshot-4 hashes.

The guided workspace test now scrolls the new jumper into view before sampling points. It still requires `elementFromPoint` to resolve that exact wire, clicks the sampled point, checks that the wire editor opens, deletes the wire and checks the count returns from five to four. The browser evidence records 0 of 99 sample points hitting the clipped wire and 80 of 99 after scrolling. The same browser session clicked and removed the wire. [Viewport evidence](evidence/browser-wire-viewport.json).

The SPICE task's ten paths in `externalDrift` are outside this review. Final checks and remaining limits are recorded in [report.md](report.md).
