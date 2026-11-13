# In-house Circuit Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an in-browser educational logic/behavior simulator for supported board/component projects without conflating simulation with 3D assembly.

**Architecture:** Consume the circuit project and component catalogue from the library and assembly plans. Use a deterministic virtual clock/event queue, typed program IR, and small part behavior models running locally in the browser. Do not run arbitrary firmware or claim SPICE/electrical accuracy. Keep an engine seam so other providers can be considered later.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite, existing block/C++ lesson IR.

**Spec:** `docs/superpowers/specs/2026-10-30-circuit-builder-simulation-design.md`

## Global Constraints

- Depends on the board/component data from `2026-10-30-electronics-library.md` and the circuit project model from `2026-10-30-circuit-assembly.md`.
- Do not run arbitrary firmware, `eval`, or `Function`; accept only typed IR produced by supported blocks or the existing bounded code parser.
- Declare simulation support separately from model availability and board family.
- Analog input/output are educational abstractions unless a documented calculation is implemented; do not imply SPICE accuracy.
- Unsupported board, component, pin mapping, or code must produce diagnostics and never be silently ignored.
- Do not add or run automated tests unless the user asks; follow the manual acceptance checks in this plan.

## Review Focus

- MCU family is supported but exact board pin mapping is not: support must be board-specific.
- Engine behavior is educational rather than full analog: disclose limits and avoid electrical-accuracy claims.
- Unsupported part/wire/IR is present: stop and display diagnostics; do not ignore it.
- A program contains runaway loops or delays: operation/event budgets must keep the UI responsive.
- Pause/step/reset and virtual inputs must produce deterministic replay.

## File Structure

- `src/types/simulation.ts` — engine state, operations, diagnostics and part behavior values.
- `src/lib/simulation/SimulationEngine.ts` — deterministic runtime and lifecycle.
- `src/lib/simulation/programCompiler.ts` — normalize supported block/C++ output into constrained IR.
- `src/lib/simulation/partBehaviors.ts` — deterministic input/output behavior for supported parts.
- `src/lib/simulation/validateCircuit.ts` — board/part/pin/topology diagnostics.
- `src/data/simulationPrograms.ts` — starter simulation projects and board/program mappings.
- `src/components/circuit/SimulationPanel.tsx` — controls, GPIO/part states, trace and logs.
- `src/pages/CircuitBuilderPage.tsx` — connect circuit workspace to the engine.

## Task 1: Define constrained simulation program and state types

**Files:**
- Create: `src/types/simulation.ts`
- Modify: `src/lib/lessonProgramIr.ts` only additively, preserving the current ESP32 LED lesson behavior.

**Interfaces:**
- `SimulationOperation`: typed `pinMode`, digital write/read, analog read abstraction, PWM abstraction and bounded delay.
- `SimulationProgram`: `{ boardId, boardVariant, setup, loop, sourceMode, maxCycles }`.
- `SimulationSnapshot`: `{ status, virtualTimeMs, pins, parts, logs, activeOperation, diagnostics }`.
- `SimulationDiagnostic`: `{ severity: 'info' | 'warning' | 'error', code, message, partInstanceId? }`.

- [ ] Define types and exact supported operation names; reject unknown operations.
- [ ] Set explicit limits for operations per tick, delay horizon and event count.
- [ ] Represent digital and abstract analog values as distinct types so code cannot mistake an abstract sensor reading for measured voltage.
- [ ] Preserve the current `LedProgramIr` and generated C++ output; add a normalization layer rather than changing lesson semantics.
- [ ] Record the supported code subset and non-goals in Vietnamese-facing labels: no free C++ compiler, no instruction-set emulation, no SPICE.

## Task 2: Validate board mapping and circuit graph

**Files:**
- Create: `src/lib/simulation/validateCircuit.ts`
- Modify: `src/data/boards.ts`
- Modify: `src/data/components.ts`
- Modify: `src/types/circuitProject.ts`

**Interfaces:**
- `SimulationBoardMapping`: exact board ID/variant, logic level, supported pin IDs, pin capabilities and source IDs.
- `SimulationPartMapping`: exact component ID/variant, behavior ID, supported pin roles and limitations.
- `validateCircuit(project, program): SimulationDiagnostic[]`.

- [x] Define board-specific GPIO alias profiles for all 21 boards currently listed in the catalogue. This only enables the same narrow logic LED exercise; it does not claim firmware emulation on each MCU.
- [ ] Validate board/revision, part variants, operation pins, wire endpoints and whether every endpoint resolves.
- [ ] Block unknown pins, unsupported part behavior, incompatible code operations and malformed connections with specific diagnostics.
- [ ] Add sourced safety checks only where exact board/component facts support them; do not infer from a related MCU family.
- [ ] Manually inspect a valid LED project and invalid board/pin/component projects; confirm diagnostics identify each blocking issue.

## Task 3: Implement deterministic virtual runtime and part behavior

**Files:**
- Create: `src/lib/simulation/SimulationEngine.ts`
- Create: `src/lib/simulation/partBehaviors.ts`
- Modify: `src/types/simulation.ts`

**Interfaces:**
- `SimulationEngine.start(project, program)`, `step()`, `pause()`, `resume()`, `reset()`, `snapshot()`.
- `PartBehavior` consumes the current pin/net state, virtual inputs and virtual time; returns new pin/net/part states and logs.

- [ ] Implement virtual-time scheduling and deterministic event queue; no UI callbacks from the engine core.
- [ ] Implement GPIO mode/write/read and bounded `delay` operations; loop execution yields after the configured budget.
- [ ] Implement LED on/off, button state, potentiometer/LDR abstract input, buzzer tone state and servo angle state as educational models.
- [ ] Add virtual sensor input controls only for parts whose behavior mapping exists; label inputs as simulated values.
- [ ] Ensure `reset` restores initial project/program/virtual inputs, `step` advances one operation/event, and identical inputs yield identical snapshots.
- [ ] Add a serial-style log only for explicitly modeled program output; do not claim hardware UART fidelity.

## Task 4: Normalize supported blocks and text code into simulator IR

**Files:**
- Create: `src/lib/simulation/programCompiler.ts`
- Modify: `src/lib/lessonProgramIr.ts`
- Modify: `src/lib/parseSupportedArduinoSubset.ts`
- Modify: `src/components/lesson/BlockCodeWorkspace.tsx` only to expose stable operation mapping if needed.

- [ ] Reuse block IR and existing parser results as inputs; keep code generation separate from simulation execution.
- [ ] Map only supported `pinMode`, `digitalWrite`, `digitalRead`, `analogRead` via declared virtual input, PWM abstraction and bounded `delay` constructs.
- [ ] Preserve unknown source text and show a diagnostic; never silently skip an unrecognized statement.
- [ ] Add a bounded loop/cycle model and reject unbounded operations that exceed the engine budget.
- [ ] Do not change existing ESP32 LED block-to-code output or silently replace a user's C++ draft when changing modes.

## Task 5: Add simulation controls, trace and starter circuits

**Files:**
- Create: `src/components/circuit/SimulationPanel.tsx`
- Create: `src/data/simulationPrograms.ts`
- Modify: `src/pages/CircuitBuilderPage.tsx`
- Modify: `src/styles/app.css`

- [ ] Show `Lắp ráp trực quan` separately from `Mô phỏng giáo dục`; include a persistent note that this is not SPICE/full MCU firmware emulation.
- [ ] Add run/pause/step/reset, speed control, GPIO state, virtual input controls, component output states, timeline and bounded logs.
- [ ] Trace the active operation to its source block/code line, physical/logical pin and affected part using the same operation event.
- [ ] Add starter circuits for LED blink and button-controlled LED first; add potentiometer/LDR only if their selected board pins and part mapping are supported.
- [ ] Add temperature/OLED, HC-SR04 and servo templates only when each part behavior and connection mapping exists; mark unsupported template parts clearly.
- [ ] Disable run when diagnostics contain errors and show exact reasons; allow assembly editing regardless.
- [ ] Manually check run/pause/step/reset, input adjustment, unsupported source, budget exhaustion, stable replay and visible limitations.

## Task 6: Build and manual acceptance review

**Files:**
- No new files expected.

- [ ] Run `npm run build` from `electronics-learning-demo` and resolve TypeScript/build errors.
- [ ] Manually check a supported Uno R3 circuit, supported ESP32 LED lesson, unsupported board, unsupported part, invalid pin, malformed wire, unsupported C++ statement and event-budget stop.
- [ ] Confirm the app never claims electrical voltage/current/firmware accuracy beyond the actual behavior models.
- [ ] Confirm no user code or project is sent to an external simulator and no arbitrary code is executed.

## Review Focus Mapping

- Board vs MCU support → Tasks 2 and 6.
- Educational vs analog accuracy → Tasks 1, 3 and 5.
- Unsupported topology/code → Tasks 2 and 4.
- Runaway program → Tasks 1, 3 and 6.
- Determinism/control lifecycle → Tasks 3 and 5.

## Provider feasibility and current implemented subset

- [x] Compare browser/service integration, in-house logic runtime, MCU emulators and CAD-to-GLB; record license, privacy and backend requirements in `docs/superpowers/specs/2026-10-30-web-simulation-provider-adr.md`.
- [x] Add target registry in `src/data/simulationTargets.ts`, board-specific pin alias/source labels, and migrate saved IDs from the first four demo choices.
- [x] Require code pin to match selected target's exercise alias before run/step.
- [ ] Expand the interpreter from LED output to button/digitalRead; add an explicit program input op and board mapping.
- [ ] Add deterministic analog input abstraction for potentiometer/LDR and map only to targets with documented ADC pin aliases.
- [ ] Add actual firmware provider only after product owner selects a licensed integration and approves user-code transfer/privacy model. Do not count the 21 logic profiles as firmware simulators.
