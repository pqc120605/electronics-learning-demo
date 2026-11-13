# Button topology builder handoff

Task `MM-SIM-STAGE-REV3A-BUTTON-TOPOLOGY` · 2026-11-12

`getLessonCircuitDoc('button-led')` returns a fresh CircuitDocV2 with five parts, five wires and four connected nets. The button input wire uses `bb1:20g` and the return uses `bb1:22g` → `bb1:T-:3`. This leaves the four component leg holes available and preserves the blink LED series path. The contacts are separate in the document.

`footprintHoles` uses the same centered residual calculation as assembly placement and retains the 0.7 mm maximum residual. The tested mount at column 20, row 5 and rotation 90° resolves to `bb1:20f`, `bb1:20e`, `bb1:22f`, `bb1:22e` in both projections. `contactA` owns the first pair and `contactB` owns the second pair. These checks cover modeled geometry and connectivity.

## Verification

| Command | Stage | Exit | Result |
|---|---|---:|---|
| `node --test --test-concurrency=1 tests/lesson-circuit-docs.test.mjs tests/circuit-doc-v2.test.mjs tests/assembly-layout-v2.test.mjs` | Before implementation | 1 | 17 passed, 5 failed. Three failures from the absent fixture, one from the rejected switch mount and one from the rejected within-tolerance fit. |
| `node --test --test-concurrency=1 tests/lesson-circuit-docs.test.mjs tests/circuit-doc-v2.test.mjs tests/assembly-layout-v2.test.mjs` | After implementation | 0 | 22 passed. |
| `npm.cmd run typecheck` | After implementation | 0 | Passed. |
| `npm.cmd test` | After implementation | 1 | 490 passed, 1 failed, 491 total. |

The full-suite failure is `tests/layout-2d.test.mjs:91`. The legacy migration sample for `button-led` now has a legal mount via the centered resolver and passes the test's placement and body-overlap assertions. The final assertion still expects `button-led` in the list of samples blocked by geometry. The actual list is `buck-boost-concept`, `dc-motor-driver`, `mosfet-switch`. Updating the expectation requires lead action because that file is outside the builder lease.

## Builder snapshot

All five initial SHA-256 hashes matched `base-snapshot.json` before edits. These SHA-256 values identify the five files at builder handoff.

| File | SHA-256 |
|---|---|
| `src/data/lessonCircuitDocs.ts` | `4c9cdb503214ecf191d071261638f19ed686f6726e1d58491fc569a9aa4fef50` |
| `src/lib/mountResolve.ts` | `5771d2e7d7a14f13fc77d914d9ecbf186768b7664a347ce81485dc80a1634792` |
| `tests/lesson-circuit-docs.test.mjs` | `69ce6cda3baa5d2910a44ecb40de306dc7827a19d87e372f94a2faaca13c6dc3` |
| `tests/circuit-doc-v2.test.mjs` | `9c037a54cec1836e83b892949a725b9e08cd4440575946ab259b721293fe20e3` |
| `tests/assembly-layout-v2.test.mjs` | `4fd9c7bd00a8890b6254575e0cd16b896604618497568fac8b9b9fd96530dfd0` |
