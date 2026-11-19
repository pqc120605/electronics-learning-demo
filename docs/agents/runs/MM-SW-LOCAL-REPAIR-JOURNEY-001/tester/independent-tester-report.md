# Independent tester report — MM-SW-LOCAL-REPAIR-JOURNEY-001

Verdict: **pass for the assigned local browser acceptance scope**. No reproducible blocker found. Independent limited source disposition: **pass on the inspected repair validation and capstone evidence invariants**, with the review limits below. This is independent test evidence, not a claim of participant learning or retention.

## Target and method

- Executed 2026-11-18 21:01–21:04 UTC (2026-11-19 Asia/Bangkok), Windows 10.0.26300 x64, Playwright Chromium 156.0.8078.4, headless, reduced motion.
- Existing production preview: `http://127.0.0.1:5320`. Did not rebuild, deploy, start a server, run the lead suite, or use port 5196.
- Both 375×812 and 1440×900 used separate fresh browser contexts. Browser interactions used the rendered controls; scripts wrote only scratch/evidence files. Scripts: `.tmp/independent-repair-audit.mjs`, `.tmp/independent-repair-accessibility.mjs`, `.tmp/independent-repair-hashes.mjs`. All exited 0.
- Entry at browser-audit start and end: `/assets/index-DR-wjR03.js`, SHA-256 `c9826e6b42ee1588c16a325fd55cfc3b457b4358c9c06a477d750e420688b09a`.
- Independently hashed all 18 source/test files in `snapshot-reviewed.json`; all match. See `independent-source-hashes.json`. Bundle and source packet correspondence is evidence supplied by the lead build plus matching hashes; this tester did not reproduce that build.

## Executed behavior

All 11 grouped checks passed at each viewport (22 total):

1. Fresh `/app` first-circuit link opens with circuit visible in viewport.
2. Repairing before observing the fault does not award evidence.
3. Wrong prediction on the original fault does not award baseline evidence.
4. Hint and support guide show the current repair and next baseline step.
5. GND repair keeps selected position after reload; home resumes the correct repair; prediction must be selected again; correct original/repaired observations earn evidence.
6. Across-trench repair requires correct separate/connected observations around the position change.
7. Backwards LED repair earns the third modeled skill after the correct original/repaired observations.
8. Wrong capstone prediction records the actual LED-off observation without granting skill credit.
9. Prepared cases complete all three skills, persist on reload, and reset current skill credit after changing threshold to 70%, while retaining six earlier trials.
10. Projects action resumes those six trials and progressive practice list expands beyond its initial three entries.
11. Board catalog starts with eight results; `nucleo` returns four, nonsense returns zero, clearing and expanding reveals more than eight; document has no horizontal overflow.

No uncaught page exceptions or console errors in either journey. Browser result details: `independent-browser-results.json`.

Focused keyboard checks passed at both sizes: focused entry/action buttons activate with Enter, radio controls select using Space and ArrowDown, wrong prediction remains uncredited. Focused check button has a visible 3px teal outline with 3px offset. These checks exercised keyboard activation and radio selection, not a complete keyboard-only traversal.

Axe scan on the repair page after a wrong prediction: zero WCAG 2 A/AA / WCAG 2.1 AA violations at both sizes, 29 passing rules each. See `independent-accessibility-results.json`. This does not replace screen-reader testing.

Inspected PNGs for the mobile first circuit, desktop completed repair, and mobile focused feedback viewport: readable labels, visible feedback and focus, no observed obstructed action. PNGs include `375-first-circuit.png`, `1440-repairs-complete.png`, and both `*-keyboard-viewport.png`; further journey screenshots use viewport prefixes in this directory. Full-page PNGs include fixed navigation captures, so those images alone are not proof of every scroll position being unobstructed.

## Independent source disposition

Inspected `beginnerRepair.ts`, `beginnerCourseStorage.ts`, and `localCapstone.ts`, plus the relevant rendered repair/capstone component sections. No clear correctness blocker found in this focused read.

- Saved repair entries accept recognized repair IDs, boolean `fixed`, only the exact expected before/after values, require before evidence for non-null after evidence, and bound integral hint counts. Missing/malformed fields are rejected. Existing sessions without the optional repairs object remain accepted.
- Live repair observation awards baseline only for a correct prediction in the faulty state. Repaired evidence requires baseline plus a correct prediction in the fixed state. Changing position clears transient prediction/result in the component. This matches the actual browser rejection and persistence checks.
- Capstone decoded observations are reconstructed with `observeCapstone` and compared against the generated snapshot; stored result assertions are not blindly accepted. Current skill evidence filters by board and threshold and requires matching predictions. The GND skill requires ordered open/restored observations at the same input level. Threshold testing confirmed earlier records stay visible without counting for the new threshold.
- Browser replay showed that wrong observations remain in history and cannot satisfy the same skill until a correct prediction is observed. The earlier-correct evidence remains historical evidence when controls change, as intended by this progress model.

This was a targeted independent source check, not full architectural/security review of all 18 files or a substitute for all QA roles. No implementation or test assertions were edited.

## Limits and not run

No participant study, learning retention assessment, real kit/firmware/circuit-solver validation, screen reader, Safari/Firefox, physical device, external service, public release, or dependency installation. No independent rerun of the lead's unit/E2E suite, storage-quota/cross-tab/corrupt-data matrix, or capstone import/export matrix in this audit. Browser reload evidence is local browser storage persistence, not cloud backup or a guarantee against browser data deletion. No release gate conclusion is drawn.
