# Rev3D final snapshot — independent tester report

Date: 2026-11-12, completed approximately 16:05 Asia/Bangkok. Result: **FAIL — acceptance 7 is not met: full E2E exits 1, 46 passed / 2 failed.** No implementation or assertion edits were made.

## Environment and frozen scope

- Windows, PowerShell, product checkout `D:/StartupOS/electronics-learning-demo`.
- Node `v24.21.0`; npm `11.19.0`; Playwright `1.64.1`; Chromium revision directory `chromium-1248`, executable product version `156.0.8078.4`.
- Preview `http://127.0.0.1:5196`, strict port, 1 worker, retries 0. Tester held exclusive build/dist and configured Playwright output while running commands strictly sequentially.
- Initial `repaired-snapshot.json` SHA-256: `63983f74ccace403099ca26a723293f352e1ab06f58c7378fc8c4213a6b55d43`. Its editor hash matched before the focused test. Lead then supplied the complete five-file final manifest; all five matched before typecheck and again after E2E. The focused test ran on the same editor bytes.
- Final manifest `final-snapshot.json` SHA-256 before and after: `e9120d4b153a5bf158db31860073d75d8aecaf95e9724cb1116d0afb78488afb`.

| File | Expected = before = after SHA-256 |
| --- | --- |
| `src/components/builder/BreadboardEditor.tsx` | `c95f363a4f1ed7201cd183e95c2b2053911cc8dfe1a95925ddf33c12dfac1bd2` |
| `src/components/builder/BreadboardEditor.css` | `cca1d73798c21fcb2498bccdb4d53b747b09668c82af9c2658f740f813081caa` |
| `src/components/lesson/ButtonLedLessonLab.tsx` | `2344c6957bb8ef72717fd2b17c06be92bbd7a4308114bd3fe61f64f9eaa042e8` |
| `src/components/lesson/ButtonLedLessonLab.css` | `025ad281c9486073743241fd446c74a3cbb2650dbd7b4f25e71aa65228e99e61` |
| `e2e/journeys.spec.mjs` | `8708343cbcd9536b0fe3e939c4a13a5f38108e65ed2d10e3f032d1d94ec8c081` |

No drift detected within the assigned manifest. This does not hash every file in the repository.

## Executed checks

Expected: each assigned command exits 0, focused 8 tests and full E2E 48 tests pass. Actual commands and exit codes:

| Order | Exact command | Exit | Actual |
| --- | --- | --- | --- |
| 1 | `node --test tests/circuit-doc-edits.test.mjs` | 0 | 8 tests, 8 pass, 0 fail/skip/cancel/todo; 4985.2811 ms |
| 2 | `npm.cmd run typecheck` | 0 | No TypeScript diagnostics |
| 3 | `npm.cmd test` | 0 | 503 tests, 503 pass, 0 fail/skip/cancel/todo; 246131.3821 ms |
| 4 | `npm.cmd run build:local` | 0 | Vite 8.3.5, 281 modules transformed, built in 1.76 s |
| 5a | `npm.cmd run test:e2e -- --reporter=line` | 1 | Sandboxed attempt stalled after WebServer startup warning, before test enumeration; tester interrupted with Ctrl+C. No tests started, no explicit socket denial printed. |
| 5b | `npm.cmd run test:e2e -- --reporter=line` | 1 | Same command rerun with accepted elevated local-loopback-only justification: 48 executed, 46 passed, 2 failed, 3.9 min |

The E2E wrapper itself rebuilt TypeScript/Vite before each attempt. Console command evidence is in the tester session. The line reporter does not generate a fresh HTML report; existing HTML output must not be treated as this run's evidence. `.tmp/playwright-results/.last-run.json` reports failed status and two failed test IDs.

## Coverage actually exercised

- All 16 axe route/viewport cases passed, including `/learn/button-led` at 375px and 1440px. These assertions reject serious/critical violations for the configured WCAG tags and check horizontal overflow; this is not a complete accessibility certification.
- Both new wire-editing journeys passed at 1440×900 and 375×812: selection vs connect modes; keyboard/pointer creation; endpoint edits; invalid/duplicate rejection; role change; deletion/reset; stable identities and stale trace clearing.
- Desktop/mobile button workspace checks and unknown-board reference-state check passed. Pointer drag/undo and Tab/Enter schematic/3D connection checks passed.
- Storage, import/export, firmware-model, SPICE, kit, and offline regression journeys completed except the two failures below.

## Blocking findings

### 1. Migration journey cannot find the renamed non-lesson 3V3 control

- Environment: Chromium, default 1440×1000 viewport, local built preview, final snapshot above.
- Reproduction: run the full E2E command; `e2e/journeys.spec.mjs:470` accepts a v4 migration, enters the breadboard editor, then line 510 clicks `getByRole('button', { name: /Chọn chân board-1 3V3/ })`.
- Expected: locate the 3V3 endpoint, create/edit the jumper, and continue persistence/cross-view assertions.
- Actual: locator never matches; test times out at 60000 ms. Error context contains the present control `board-1 · 3V3; Chọn chân board-1:vcc` (line 316), rather than the expected legacy name.
- Reproducibility: observed once in this complete run; no retry configured or performed. Deterministic name/locator mismatch is directly visible in captured DOM and source.
- Evidence: `.tmp/playwright-results/journeys-accepting-a-v4-mi-742a0-ross-view-selection-persist/{error-context.md,test-failed-1.png,trace.zip}`. Source name construction: `BreadboardEditor.tsx:223`.

### 2. Lesson circuit integration journey cannot find the renamed GPIO LED control

- Environment: same Chromium preview/snapshot; test starts its viewport loop with 375×812.
- Reproduction: `e2e/journeys.spec.mjs:562` deletes `w-gpio-to-resistor`, confirms incomplete topology, then line 581 clicks exact accessible name `Chọn chân board-1 GPIO LED`.
- Expected: reconnect the LED endpoint, restore the canonical net, then complete trace and board-feature integration checks at both viewports.
- Actual: locator never matches; test times out at 60000 ms. Error context line 544 shows `board-1 · GPIO LED; Chọn chân board-1:ledOut`.
- Reproducibility: observed once in this complete run; no retry. Same name construction accounts for both failures.
- Evidence: `.tmp/playwright-results/journeys-lesson-code-steps-ff3eb-feature-selection-is-shared/{error-context.md,test-failed-1.png,trace.zip}`.

Both failures occur at control lookup before endpoint activation; they do not establish that the subsequent editing/persistence behavior is broken or working. They block the required full-suite pass and reduce coverage of the later assertions in these tests. Tests/assertions were left unchanged.

## NOT_RUN and limitations

- No assigned command skipped. Assertions after each timeout, and the later viewport iteration of the second failed test, were not reached.
- No manual screen-reader, additional browser, physical hardware, device/flash, public-release, or deployment checks assigned or run. `build:local` remains an internal technical build, not public artifact clearance.
- No source changes, dependency installs, secrets access, external uploads, or queue/review/snapshot edits by this tester. Only this report and normal command-generated build/Playwright outputs were written.
- Required next step: lead resolves the accessible-name regression, freezes a new snapshot, and assigns affected verification again. Current evidence applies only to the hashes above.
