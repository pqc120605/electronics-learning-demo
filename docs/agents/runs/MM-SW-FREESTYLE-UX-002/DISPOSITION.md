# QA disposition

| Finding | Decision | Resolution | Regression evidence |
|---|---|---|---|
| Later replacements overwrite current work | ACCEPT_FIXED | Archive current workspace before blank/sample/board replacement and restore; expose recovery/raw downloads in Bản nháp; failed archive prevents destructive replacement | freestyle-drafts.test.mjs; later replacement/restore browser case |
| Final buffered data lost | ACCEPT_FIXED | publishBufferedFrame on manual stop, natural completion and error before invalidating generation | first-frame stop browser case |
| STM32 estimated anchors treated as exact | ACCEPT_FIXED | Reject STM32 reconstructed pad anchors; retain reference board model; omit and diagnose unresolved 3D wires | freestyle-presentation.test.mjs |
| Combined board/part query uses stale doc | ACCEPT_FIXED | workspaceWithFreestyleBoard and atomic intent application before one update | combined URL/reload browser case |
| Session-only current work cannot be downloaded | ACCEPT_FIXED | Dialog receives current workspace and downloads it without consulting localStorage | quota browser case reads downloaded JSON |

Additional verification: source-matched Pico 3V3(OUT)/VBUS labels; correct radians for 3D gestures/buttons; scene remount/disposal on board identity change. No dependencies, schema version, hardware configuration or approval changed.

Final regression corrections (16/11): the initial full browser run was 148/156, not PASS. Fixed the underlying SVG accessible-name mismatch, preserved original noncompact lesson picker DOM/geometry, displayed unsupported-board notice on the blank bench, resolved explicit part handoff by adding only its required breadboard, and corrected dark active-view contrast. The outdated fallback-board test wording was updated to the authorized empty-first behavior and strengthened with no-art/no-selected-board assertions. Three mobile cases cover live button/knob controls and short landscape; grid min-content overflow and input placement were fixed. No failing assertion was skipped or weakened to manufacture a pass. Final suite results are recorded separately.
