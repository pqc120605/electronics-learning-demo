# Workspace Simulation and Observation Plan

> **Status:** Implementation landed; manual browser acceptance is partial. The approved scope was implemented directly in the current workspace. Typecheck/build passed. Browser checks cover educational stepping, bounded Uno AVR8js output and board-switch invalidation, plus the standalone LDR calculator → SPICE solver → return-to-lesson flow. The workspace-originated SPICE result/fingerprint round trip and malformed/expired/oversized handoffs remain unverified. No automated tests were added or run in this slice.

## Goal

Bring the current lesson simulator, the bounded ATmega328P firmware worker, and the existing SPICE workbench into one understandable workspace flow. Show only traces and measurements emitted by the provider that produced them, invalidate stale results when the project changes, and explain unsupported capabilities without suggesting that the board is fully emulated.

## Scope

### Included

- A shared capability and run-state model for the builder.
- Keep the current educational interpreter and fixed scenarios, while making their simulated inputs, logic traces, and limitations explicit.
- An opt-in Intel HEX firmware mode for the currently supported Arduino Uno R3 and Nano classic targets only. Reuse the existing AVR8js worker, GPIO D13 model, and UART transmit callback.
- A unified observation panel for provider-backed digital output, UART text, and SPICE waveforms.
- A bounded, expiring, local-only result handoff between the workspace and SPICE workbench.
- Clearing/stopping old sessions and observations when board, lesson, code, wiring, or selected runtime changes.
- Accessible status, error, and capability messages in the existing Mạch Mở visual system.

### Excluded

- ESP32, Pico, STM32, or any firmware target beyond Uno/Nano ATmega328P.
- Full peripheral fidelity, physical board verification, MCU-to-SPICE co-simulation, or inferred voltage/current from logic traces.
- KiCad/EasyEDA authoring, PCB routing, or claiming that a PCB view is electrically connected to the solver.
- Publicly releasing the current SPICE engine binary before its provenance and redistribution gate is cleared. Keep the existing release gate authoritative.
- Cloud execution, account requirements, project uploads, arbitrary user scripts, or new runtime dependencies.

## Existing implementation to preserve

- `src/simulation/contracts.ts` already defines provider descriptors, requests, trace events, run reports, and a future stateful engine seam.
- `src/lib/simulationProviders.ts` resolves the current code-subset interpreter and fixed educational scenarios by lesson and board.
- `src/lib/logicTrace.ts` computes the builder's current named digital/logic flow. Its comments explicitly distinguish this from measured voltage/current.
- `src/lib/avr8jsRunner.ts` runs bounded ATmega328P firmware and records D13 transitions; `avr8js` 0.21.1 exposes `AVRUSART.onByteTransmit`.
- `src/workers/avr8js.worker.ts` and `src/pages/FirmwareHexToolPage.tsx` already provide a worker lifecycle for the isolated firmware tool.
- `src/simulation/spice.worker.ts` returns bounded result series; `src/simulation/spiceNetlist.ts` validates netlists and caps result points.
- `src/lib/workspaceSpice.ts` and `src/pages/SpiceWorkbenchPage.tsx` already implement a session-storage handoff and a 30-second worker timeout.
- `src/pages/CircuitBuilderPage.tsx` owns the lesson simulation and views. Keep its current lesson flow and saved project format backward-compatible; avoid a broad page rewrite in this slice.

## Design decisions

1. The selected board/lesson/provider determines which instruments are enabled. Model availability alone never enables an instrument.
2. Educational provider output remains labeled as an educational behavior model. The current program parser and fixed scenarios remain unchanged in meaning.
3. Firmware mode is explicit and opt-in. It requires a valid Intel HEX file and a supported exact target. A file upload does not imply the firmware was compiled for that target; the UI asks for target confirmation and shows this limitation.
4. AVR trace events use simulated cycles/time and actual AVR8js D13/UART callbacks. They do not imply every board pin or peripheral is modeled.
5. SPICE instruments use solver result columns and units/names when supplied. No values are calculated from wire color, animation, CAD geometry, net labels, or the educational trace.
6. A SPICE handoff is tied to a workspace revision and has schema version, the existing 30-minute TTL, and a 1 MiB serialized-result cap. Invalid, expired, mismatched, or oversized data is discarded with a recoverable message.
7. Run state is explicit: `ready`, `running`, `completed`, `stopped`, `unsupported`, `invalid`, `timeout`, and `failed`. Stopped/old worker messages cannot overwrite a newer run.
8. No package, model, firmware, or SPICE binary is added by this phase.

## Files and responsibilities

### Modify

- `src/simulation/contracts.ts` — define typed capability IDs, instrument IDs, session status, provider event units/source metadata, and run identity. Preserve existing descriptor fields where possible and keep old report consumers compiling.
- `src/lib/simulationProviders.ts` — declare exact provider capabilities and board/lesson limits; expose one resolver result that includes supported instruments and user-facing reason codes.
- `src/lib/avr8jsRunner.ts` — capture bounded UART transmit bytes alongside D13 transitions, keep output/transition caps, and expose the final snapshot with exact target and simulated time.
- `src/workers/avr8js.worker.ts` — include `runId` in requests/responses; emit bounded frames, UART chunks, completion, stop, timeout/error states; ignore stale/cancelled work.
- `src/pages/FirmwareHexToolPage.tsx` — reuse the same worker message types/lifecycle helper as the builder rather than maintaining a divergent protocol.
- `src/lib/workspaceSpice.ts` — add a separate versioned result envelope/key and read/write/clear helpers with TTL, run/workspace revision match, and serialized-size cap; do not change existing handoff schema semantics.
- `src/simulation/spice.worker.ts` — echo run identity and include axis/measurement unit metadata only when the engine result identifies it; retain existing input/output caps and cancellation behavior.
- `src/pages/SpiceWorkbenchPage.tsx` — save a successful workspace-originated run result under its handoff ID and return to the builder with that ID; keep standalone SPICE usage unchanged.
- `src/pages/CircuitBuilderPage.tsx` — add explicit runtime selection for supported modes, session invalidation on relevant edits, consume a matching SPICE result, and connect provider events to the observation panel. Keep lesson changes, project save/import/export, and current educational run/step behavior intact.
- `src/styles/app.css` and the new panel stylesheet — style responsive instrument tabs, trace list, serial output, waveform placeholder/result, and status/error states.
- `README.md`, `docs/MACH-MO-MVP-STATUS.md`, and `docs/superpowers/specs/2026-11-03-mach-mo-capability-expansion-design.md` — record shipped support and limitations only after implementation has been verified.

### Create

- `src/components/builder/SimulationInstrumentsPanel.tsx` — accessible, provider-driven tabs for Digital trace, Serial Monitor, and SPICE waveform. Hide/disable unsupported instruments with a reason instead of showing fabricated values.
- `src/lib/workspaceSimulationSession.ts` — pure lifecycle/fingerprint helpers for project revision, run identity, invalidation, and mapping provider outputs into display-ready events.
- `src/simulation/avr8jsProtocol.ts` — shared typed request/response protocol for the AVR worker and both callers.

## Implementation tasks

### 1. Formalize provider capabilities and session identity

- Add stable capability/instrument unions and extend trace events with optional unit, target, simulated-time, and source-kind metadata.
- Add a deterministic workspace fingerprint from normalized board ID, lesson ID, code, ordered part/pin identities, and ordered wires. Exclude viewport/camera state and presentation-only selections.
- Make resolver output list enabled instruments and a user-facing support explanation. Keep unsupported states explicit; do not infer support from the component catalogue.
- Ensure old saved projects without a revision field still load through the existing migration path.

### 2. Harden and extend the AVR8js worker protocol

- Define one request/response protocol with a monotonically increasing `runId`; responses from other IDs are ignored by callers.
- Keep the existing one-simulated-second cycle budget. Add a wall-clock timeout and stop acknowledgement; ensure termination clears timers/listeners.
- Attach a bounded `AVRUSART.onByteTransmit` callback, decode bytes into text without dropping split UTF-8 sequences, cap retained text/events, and flag truncation.
- Include D13 state, transitions, simulated milliseconds, cycles, target, UART text, and trace truncation in snapshots.
- Keep target confirmation for Uno/Nano. Do not expose D13 as a generic external LED output unless the workspace circuit explicitly maps that output and the UI says the emulator only models the built-in D13 pin.

### 3. Add the unified observation panel to the builder

- Add runtime choices: `Bài học` (existing provider) and `Firmware HEX` (only when target is Uno R3/Nano classic). If another target is selected, explain the exact constraint and keep the educational provider available where supported.
- Put HEX file selection, target confirmation, run/stop, and parser/target error in the panel; do not silently replace the lesson code editor or existing project code.
- Render lesson trace and logic flow with an educational-model label. Render firmware D13/UART only from worker snapshots, with simulated time and target visible.
- Add a single observation status header for ready/running/completed/stopped/unsupported/invalid/timeout/failed. Use `aria-live` for state changes, not every fast trace event.
- Preserve existing run/step controls and current educational behavior; route them through the same lifecycle vocabulary without forcing the educational provider into a worker.
- On any change to board, lesson, code, part topology, or runtime choice: stop the old worker, increment run identity, clear outputs tied to the old fingerprint, and return to a truthful ready/invalid state.

### 4. Return bounded SPICE observations to the matching workspace

- Keep the current SPICE workbench route as the solver surface. After a successful run from a workspace handoff, store the returned series in the versioned result envelope with handoff ID, workspace fingerprint, analysis kind, point count, units when known, warnings, and creation time.
- Add a 1 MiB serialized-result check before writing session storage. On quota/serialization failure, preserve the SPICE result in its own page and show an actionable message; do not lose it or navigate as if it was saved.
- Return through the existing `returnTo` route with a result ID. In the builder, accept only a matching, unexpired result and clear it after consumption or explicit dismissal.
- Plot only actual SPICE series. For unknown/complex units or unavailable axis metadata, label values as solver output and show that the plot is not a measurement of the physical board.
- Leave the public build gate in place. This task does not clear the current engine's release provenance.

### 5. Manual acceptance and release checks

- Run `npm.cmd run typecheck` and `npm.cmd run build:local` from `electronics-learning-demo`; do not bypass the `check:public-release` gate for public builds.
- In the browser, verify: educational blink still works; an invalid circuit blocks execution; Uno and Nano accept confirmed compatible HEX; unsupported ESP32 firmware mode is explained; D13 transitions and UART text come from the worker; stop/re-run does not show old events; changing board/code/wires clears prior outputs; SPICE result returns only to the matching workspace; expired/malformed/oversized result is rejected without data loss.
- Check keyboard navigation and screen-reader labels for runtime selection, file input, tabs, trace, errors, and status announcements. Check 375 px and desktop layout.
- Inspect console/network only for failures introduced by this slice. Do not claim hardware accuracy, all-board firmware support, SPICE release clearance, or complete WCAG conformance from these checks.
- Do not add or run automated tests in this implementation slice unless the project owner asks for test work; existing typecheck/build and the listed manual acceptance are the planned verification boundary.

## Completion criteria

- One workspace panel clearly distinguishes lesson behavior, AVR8js firmware output, and SPICE solver output.
- No displayed output survives a project revision change unless it is explicitly identified as a saved historical run.
- Unsupported board/provider combinations explain what is missing and keep safe supported modes available.
- UART and waveform views are backed by captured worker/solver output, bounded, and tied to a run and project revision.
- Public build remains blocked whenever the existing SPICE artifact release gate is not cleared.
- Typecheck/build and all manual acceptance items pass; documentation matches the implementation and its limitations.

## Risks and decisions fixed for this slice

- **SPICE result storage may exceed browser session storage.** Limit point count/series and serialized payload; if it still exceeds the cap, retain the result on the SPICE route and report that cross-route handoff was skipped.
- **HEX may target a different MCU than the selected board.** Require explicit target confirmation and label it user-asserted; firmware target is not inferred from Intel HEX.
- **D13 is not a general GPIO emulator.** Show it as the modeled ATmega328P D13/built-in LED observation. Do not map other GPIO pins until the emulator exports their states with evidence.
- **Public release status of the SPICE binary remains unresolved.** Keep the current gate and do not represent this plan as legal clearance.

## Execution notes

- Work directly in the existing workspace; do not create a new branch/worktree unless the owner requests it.
- Do not stage or commit because the repository already contains unrelated modifications and untracked work.
- No new package is required; the current project already includes `avr8js`, the SPICE worker, and the component libraries needed for the planned integration.

## Execution outcome — 2026-11-03

- Implemented the shared observation panel, explicit lesson/AVR runtime selection, bounded AVR8js D13/UART0 capture, workspace fingerprint invalidation, and expiring SPICE result return to the matching workspace.
- Verification completed: `npm.cmd run typecheck`, `npm.cmd run build:local`, and an HTTP GET to the local `/build?lesson=blink&guided=1` route (200).
- Browser acceptance completed partially: educational lesson stepping, Uno R3 sample HEX execution, D13 transition capture, empty UART0 capture for a non-Serial sample, stale AVR output invalidation on switching back to ESP32, and the LDR calculator → SPICE `.op` run → return link to `/build?lesson=analog-ldr&guided=1` were observed. The workspace-originated SPICE result/fingerprint round trip is still unverified because the current LDR topology includes MCU/GPIO and correctly disables that action. Malformed/expired/oversized result rejection, keyboard-only flow, screen-reader announcements, and mobile layout remain unverified.
- Hardware checks, MCU-to-SPICE co-simulation, public ngspice redistribution clearance, and all-board firmware support remain out of scope/unverified.
