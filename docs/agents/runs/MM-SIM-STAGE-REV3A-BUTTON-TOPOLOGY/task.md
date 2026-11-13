# MM-SIM-STAGE-REV3A-BUTTON-TOPOLOGY — task card

## Outcome and authorization

- Request: founder asked Codex to continue the approved lesson-redesign plan continuously; this is the first implementation slice after Rev 2.
- Capability IDs / module: `LRN-01`, `LRN-02` / `M02`.
- Entry → exit depth: current lesson circuit fixture → canonical button-led CircuitDocV2 and correct four-leg footprint mapping; capability depth remains unassessed.
- Deliverable: `getLessonCircuitDoc('button-led')` returns a valid, fresh canonical document; CircuitDocV2 and assembly projections agree on the tact-switch holes.
- In scope: one button, one LED, one series resistor, breadboard, board profile fixture, explicit stable wire IDs, centered footprint fit bounded by the current 0.7 mm snap limit.
- Out of scope: parser/code trace, page/UI changes, active signal rendering, electrical solving, hardware changes, model manifest changes, changing global tolerance, persistence/schema migration.
- Execution authorization: direct user authorization to continue the plan. No additional product decision is required for this geometry/data slice.

## Ownership and permissions

- Accountable role: `software_engineer`.
- Filesystem writer: the assigned software-engineer builder, only while this lease is active.
- Independent reviewer: `qa_safety_reviewer` after lease freeze.
- Tester: `tester` for assigned checks; may not change source or assertions.
- Allowed paths (exact):
  - `src/data/lessonCircuitDocs.ts`
  - `src/lib/mountResolve.ts`
  - `tests/lesson-circuit-docs.test.mjs`
  - `tests/circuit-doc-v2.test.mjs`
  - `tests/assembly-layout-v2.test.mjs`
  - `tests/layout-2d.test.mjs` (lead-only scope addition: remove the stale expectation that the now-supported centered button mount remains blocked)
  - `docs/agents/runs/MM-SIM-STAGE-REV3A-BUTTON-TOPOLOGY/**`
- Forbidden: all other paths; especially `src/data/component-models.manifest.json`, `src/lib/assemblyLayout.ts`, `src/lib/circuitNetsV2.ts`, `src/lib/circuitDocV2.ts`, `package.json`, `package-lock.json`, `docs/claude-support/**`, `docs/hardware/**`, `.codex/**`, sibling `D:/StartupOS/app`, credentials, external calls, device operations.
- Baseline snapshot: `docs/agents/runs/MM-SIM-STAGE-REV3A-BUTTON-TOPOLOGY/base-snapshot.json`.
- Test artifacts: normal project test output only; no server or fixed port required.

## Inputs and contract

- Read packet: `docs/superpowers/plans/2026-11-12-interactive-button-led-lesson.md` (Slice A); `src/data/lessonCircuitDocs.ts`; `src/lib/mountResolve.ts`; `src/lib/circuitDocV2.ts`; `src/lib/circuitNetsV2.ts`; button geometry in `src/data/component-models.manifest.json`; `src/lib/assemblyLayout.ts` centered `tryMount` behavior; the three allowed test files.
- Facts checked: switch model has four metal legs grouped as `contactA`×2 and `contactB`×2; physical leg coordinates are `(0,0)`, `(6.5,0)`, `(0,4.5)`, `(6.5,4.5)` mm; current resolver anchors the first leg and rejects residual error over 0.7 mm; assembly layout centers residual error at the same 0.7 mm maximum.
- Assumptions: the fixture uses the current ESP32 DevKit educational model and current manifest switch geometry; these are reference model data, not physical validation of a user's clone or switch sample.
- Dependencies: Rev 2 lesson redesign baseline is complete; no other active task dependency.
- Consumes: `CircuitDocV2` schema 2, `validateCircuitDoc`, `createNetIndexV2`, `footprintHoles`, `getAssemblyPlanV2`.
- Produces: a fresh `button-led` CircuitDocV2 with board input and GND connected to separate contact nets, plus the existing LED output→series resistor→LED→GND route. For mount `{ kind:'breadboard', board:'bb1', col:20, row:5, rotation:90 }`, the four leg identities must be exactly `bb1:20f`, `bb1:20e`, `bb1:22f`, `bb1:22e`, grouped by `contactA` and `contactB` as declared by the manifest.
- Invariants: `blinkDoc` behavior and wire IDs unchanged; button press does not alter the CircuitDocV2 topology; existing 0.7 mm maximum residual remains; no unsupported physical/electrical claims.
- Recovery: source changes are limited to the listed files. Do not revert unrelated work. Lead may restore only this task's selected paths to the baseline if the slice cannot be integrated.

## Acceptance and verification

| Criterion | Expected observable behavior | Method | Required gate |
|---|---|---|---|
| A1 | Button fixture is a fresh clone with unique IDs and exact expected part/wire counts; `blink` is unchanged. | `tests/lesson-circuit-docs.test.mjs` | Software |
| A2 | CircuitDocV2 validates without errors; input and GND contact nets remain separate; LED route remains series and returns to GND. | Validator/net-index assertions in `tests/lesson-circuit-docs.test.mjs` | Software |
| A3 | Four legs resolve at the expected holes for the centered 90° button mount; invalid mounts remain rejected under 0.7 mm. | `tests/circuit-doc-v2.test.mjs` | Software |
| A4 | `getAssemblyPlanV2` reports the same four stable hole IDs for the fixture as the 2D resolver. | `tests/assembly-layout-v2.test.mjs` | Software |
| A5 | Existing blink, resistor rotation, and V2 assembly tests still pass. | Focused existing tests and full `npm.cmd test` | Software |
| A6 | TypeScript remains strict and valid. | `npm.cmd run typecheck` | Software |

- Material changes that invalidate evidence: any change to the fixture, switch geometry/mapping, resolver fitting, or these tests after review.
- Known baseline failures: none recorded for this selected-scope snapshot; verify fresh output rather than assuming.
- Required user decision: none.
- Ready check: exact scope and acceptance are complete; dependencies are available; user authorized continuation.

## Plan and handoff

1. Add the button fixture test and prove it fails before implementation.
2. Implement the minimal fixture and centered fit using the existing 0.7 mm bound; do not edit the manifest/global assembly implementation.
3. Run focused fixture, mount, and assembly tests; then typecheck and full unit tests.
4. Capture changed-file hashes and a final snapshot; freeze/release the lease before independent QA.
5. Return changed paths, actual command outputs, geometry limits, and any mismatch against the acceptance table. No recursive dispatch and no Claude.

The builder is not alone in the checkout. Preserve other work and do not revert another worker's changes. The lead owns queue, lease transitions, and final status.
