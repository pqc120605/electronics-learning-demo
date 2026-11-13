# MM-SW-P1-L11 — Implementation report

Date: 2026-11-09
Status: implementation and acceptance checks complete; independent QA verdict: pass.

## Scope delivered

Added a standalone Vietnamese lesson at `/app/robot-simulation`, discoverable from `/app`. The virtual controls, obstacle scenario, and learner self-marked steps use component-local React state only. The lesson explicitly says it is illustrative and does not control, measure, or validate real hardware. No Web Serial, external service, package, persistence, schema, or learner-data collection was added.

The self-marked progress disappears when the page is unmounted; it is not presented as an assessment.

## Changed files and SHA-256

| File | SHA-256 |
|---|---|
| `src/pages/RobotSimulationLessonPage.tsx` | `6BC131BE6AF2ED5EDF961716F94FEC772E7498E26F3ABDEA9F757A57C0E41255` |
| `src/pages/RobotSimulationLessonPage.css` | `194D52B946A858F1B495CBBD1C78DE6CBE850F283E0D8B36B4D85BB25439D09B` |
| `src/App.tsx` | `020972B30C37C78C508499C6915E04235619E2149AF377FEB46D863DE78F56DB` |
| `src/pages/AppHomePage.tsx` | `6519F9BA08D10B98F2C3B68E1BAF035E4735B5C5E9C802AD41BF765E9AF9287A` |
| `e2e/journeys.spec.mjs` | `5C116CC0B92C1DAFC53DBC954CC13EC714A6066C191ECD66A03023751DF5DC1A` |

Full snapshot manifest: [final-snapshot.json](final-snapshot.json).

## Verification

| Command | Result |
|---|---|
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd test` | exit 0; 408 passed, 0 failed, 0 skipped |
| `npm.cmd run build:local` | exit 0 |
| `npm.cmd run test:e2e` | exit 0; 40 passed, including offline test |

The new Playwright journey visits from the app home, exercises five virtual movement commands and the obstacle case, marks all three steps complete, and checks `scrollWidth <= clientWidth` at 375×812 and 1440×900. The e2e command required permission for local loopback access; it was rerun with that permission and completed successfully.

## Independent QA

Read-only review by the queue-assigned QA role, performed with GPT-6 Luna: **pass**. See [qa-review.md](qa-review.md). The reviewer inspected the source and acceptance coverage; it did not independently rerun the commands.

## Evidence note

The prescribed initial TDD red run was not captured as reliable evidence. Final behavior is covered by the successful new e2e journey and the full successful test/build checks above.
