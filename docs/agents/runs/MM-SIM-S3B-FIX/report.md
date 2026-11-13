# MM-SIM-S3B-FIX report

Date: 2026-11-10

## Changes

- `src/lib/circuitDocV2.ts`: validate breadboard occupancy through `occupancy(doc)`. A hole that contains component legs and wire endpoints now produces one G4 error naming the hole, every colliding `partId:pinId`, and each `wireId.end`. Gate selection now uses `canMount().code`, with no message-text regex.
- `src/lib/mountResolve.ts`: every failed `canMount` result carries a stable `G2` or `G4` code. Missing type/geometry/legs is G2; illegal footprint placement, same-strip shorts, and occupied holes are G4.
- `src/lib/breadboardGrid.ts`: object rows must be exactly one character from `a` to `j`. F3 is handled by removing the unused group arithmetic and clarifying that `railGroup` is metadata only; rails remain equally spaced with no modeled group gap, and `railVerified` remains false.
- `tests/circuit-doc-v2.test.mjs`: regression coverage for a wire endpoint sharing a resistor-leg hole, stable G2/G4 codes, and resistor placement rotated 90° and 270° across rows.
- `tests/breadboard-grid.test.mjs`: malformed row objects (`''` and `'ab'`) are rejected consistently by all requested hole helpers.

## Verification

- Before this fix: 423 existing test cases. This count is the current 427 total minus the four newly added cases; the earlier baseline command output was truncated before its summary.
- Red phase: `node --test --test-concurrency=1 tests/breadboard-grid.test.mjs tests/circuit-doc-v2.test.mjs` — exit 1 as expected, 15 passed / 3 failed. The failures reproduced F1, F2, and F4; rotation already matched the expected hole sets.
- Focused after-fix: `node --test --test-concurrency=1 tests/breadboard-grid.test.mjs tests/circuit-doc-v2.test.mjs` — exit 0, 18/18 passed.
- `npm.cmd run typecheck` — exit 0.
- `npm.cmd test` — exit 0, 427/427 passed, 0 skipped.
- Build was not requested and was not run.

## Changed file SHA-256

| File | SHA-256 |
|---|---|
| `src/lib/breadboardGrid.ts` | `FDF360315B90E5B6ACDFD834B0E61867946780FDDF29A130A99ADF939E498B44` |
| `src/lib/circuitDocV2.ts` | `00C10053AAF89B17CF600E3E073AF3637AE6686BD98B518AC4CC899E5F0C6084` |
| `src/lib/mountResolve.ts` | `B9F71ABED27C4FEDA62F34CE65AC0F51545817580348F5A90B368CB8A957014E` |
| `tests/circuit-doc-v2.test.mjs` | `C2DD7A0B191580CDF3EAC5F243371E817A921CECFA055A1BAB191A5408CBA8C0` |
| `tests/breadboard-grid.test.mjs` | `F1CD42CE12D6203D6ADCAEDD07309A90259FAB5026E5C4CBD2153C433B6CDCE5` |

No dependency, schema, manifest, assembly layout, or lesson data was changed. No Claude review was requested or performed.
