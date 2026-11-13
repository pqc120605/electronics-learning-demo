# MM-SIM-S3C report

Date: 2026-11-10

## Deliverable

- Added `src/lib/circuitNetsV2.ts` with deterministic union-find connectivity for explicit wire endpoints, all logical breadboard holes grouped by `holeNet`, mounted part legs joined through `footprintHoles`, breadboard pin aliases joined to their represented holes, and ground aliases within one controller board joined intrinsically.
- The public API is `createNetIndexV2(doc, registry?)`, returning `netOf(key)` and `netsList()`. Endpoint keys remain `partId:pinId`; net records expose pin `endpoints`, canonical `holes`, `wireIds`, and a stable sort key. Unconnected declared component pins remain indexed as singleton nets.
- Added `tests/circuit-nets-v2.test.mjs` for the blink partition, v1 pin-to-pin partition compatibility across two examples, strip separation, and intrinsic ground aliases.
- `src/lib/circuitNets.ts` was not modified.

## Verification

- Red phase: new test initially failed because `circuitNetsV2.ts` did not yet exist.
- `node --test --test-concurrency=1 tests/circuit-nets-v2.test.mjs` — exit 0, 3/3 passed.
- `npm.cmd run typecheck` — exit 0.
- `npm.cmd test` — exit 0, 430/430 passed, 0 skipped.
- Build was not requested and was not run.

## Geometry note

The current LED manifest lists `cathode` as the first/anchor leg at offset 0 and `anode` at +2.54 mm. To preserve the required pin-to-`footprintHoles` mapping while placing anode at `bb1:14d` and cathode at `bb1:15d`, the test fixture uses the equivalent placement `{ col: 15, rotation: 180 }`. The spec's illustrative `{ col: 14, rotation: 0 }` mount would reverse those pin names under the current manifest. No manifest or layout change was made.

## Changed file SHA-256

| File | SHA-256 |
|---|---|
| `src/lib/circuitNetsV2.ts` | `985C777561E773E3962F3EF404360EE5412CB57F04AAFCD1035D97E1DAB73283` |
| `tests/circuit-nets-v2.test.mjs` | `F7318CD77B2302049588F714F9F4C8427EC7A3C779891021B96BD89BF46C78F9` |

