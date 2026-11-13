# MM-SIM-STAGE-REV3B-BUTTON-TRACE — task card

## Goal and authorization

- Goal: expose typed `read`, `branch`, and `write` events for supported `input-branch` lessons so a later lesson UI can map code actions to stable board pins and circuit identities.
- Authorization: founder authorized continuous implementation of the approved Button–LED lesson plan and asked for the three reference sites' useful interactions to be integrated into Mạch Mở. This slice is only the event contract; the one-screen UI is Slice C.
- Capability IDs / module: `WRK-02`, `WRK-03`, `WRK-06`, `WRK-07`, `LRN-02`, `SIM-01` / `M02`.
- Dependency: `MM-SIM-STAGE-REV3A-BUTTON-TOPOLOGY` is done, independently reviewed PASS, and verified on its frozen snapshot.

## Ownership and exact paths

- Accountable: software engineer; one active writer under the current task lease.
- Allowed paths: `src/lib/educationalProgram.ts`, `tests/educational-program-events.test.mjs`, `docs/agents/runs/MM-SIM-STAGE-REV3B-BUTTON-TRACE/**`.
- Forbidden: all other paths, especially `src/pages/**`, `src/components/**`, `src/data/**`, `package.json`, lockfiles, `docs/claude-support/**`, `docs/hardware/**`, `.codex/**`, sibling `D:/StartupOS/app`, secrets, and device/serial operations.
- The lead owns queue transitions and writes the final report/snapshot. The builder must not change queue or shared plan files.

## Contract

- Supported `input-branch` evaluation returns a typed, ordered event list: `read` (input pin and sampled HIGH/LOW), `branch` (condition, sampled level and selected `if`/`else`), `write` (output pin and resulting HIGH/LOW).
- `parseEducationalProgram` accepts an optional selected `boardId`; when supplied, input/output pin aliases must match that supported profile. Existing two-argument calls stay compatible until the UI slice passes the selected board explicitly.
- Include a source line only when it can be mapped exactly to the parsed supported statement. If mapping is ambiguous, omit it rather than guessing.
- Keep localized `trace` strings and all existing provider semantics unchanged; tests must pin those strings for button input.
- Button release is HIGH and press is LOW for `INPUT_PULLUP`; compare the actual sampled value to the code condition, so changing `LOW` to `HIGH` changes the selected branch without changing the sampled input.
- Events are educational code-subset evidence, not compiled firmware, electrical current/voltage, a solver result, or physical measurement.
- Unsupported/malformed code must not produce a successful parsed program or a typed event sequence.

## Acceptance

1. Released `button-led` (`== LOW`) yields read HIGH → `else` → the false-branch output; pressed yields read LOW → `if` → the true-branch output.
2. Reversing the comparison to `== HIGH` reverses the branch/output while preserving the sampled read level.
3. Events use the parser's board pin aliases, are ordered deterministically, and carry exact source lines for the supported read/condition/write statements where mapping succeeds.
4. `ir-alert` retains its active-low input semantics and emits the same typed event family.
5. With an explicit profile, correct button/sensor and LED aliases parse; mismatched aliases and unknown board IDs are rejected. Existing two-argument calls retain current compatibility.
6. Existing localized `trace` text and all existing non-input program behavior remain unchanged.
7. Unsupported syntax, malformed patterns and unknown lesson/profile paths do not emit a successful event trace.
8. `npm.cmd run typecheck` exits 0 and `npm.cmd test` exits 0; record exact test counts.

## Verification and limits

- Add focused tests first and reproduce a red result before implementation.
- Run the focused event tests, typecheck and full unit suite. No browser e2e is needed for this non-UI contract slice; Slice C owns browser tests.
- No physical/electrical claims. No data schema/storage changes, dependency, UI changes or device operations.

## Handoff

- Baseline snapshot: `docs/agents/runs/MM-SIM-STAGE-REV3B-BUTTON-TRACE/base-snapshot.json`.
- Freeze the product paths and return a concise handoff with changed-file hashes and actual test output. Lead obtains independent review before closure.
