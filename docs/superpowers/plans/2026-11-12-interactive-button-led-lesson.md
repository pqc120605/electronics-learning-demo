# Interactive Button LED Lesson Implementation Plan

> **For agentic workers:** Use the Mạch Mở task card and active lease for the current slice. Work task-by-task; do not start a later slice until its dependencies are accepted.

**Goal:** Make the existing `button-led` lesson a coherent interactive learning workspace: learners can inspect and edit a canonical button/LED circuit, press and release a virtual active-low button, and follow supported code events through the same stable circuit identities in breadboard, schematic, and 3D views.

**Architecture:** Keep the existing `/learn/:lessonId` and `/app/learn/:lessonId` routes and preflight/navigation model. Add the button lesson at its existing entry point, based on `CircuitDocV2`; use the current deterministic educational code-subset provider and emit typed events instead of parsing localized trace text. Correct four-leg switch placement with the same centered snap-error method already used by the assembly layout, without changing the source model or global tolerance.

**Tech Stack:** React, TypeScript strict mode, CircuitDocV2, current component registry/model manifest, `createNetIndexV2`, existing educational-program parser/provider, Vitest/Vite SSR unit tests, Playwright journeys.

**Spec and evidence:** `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md` §§1–2, 7–8, 12; `docs/agents/runs/MM-SIM-STAGE-REV2/lesson-matrix.md`; review findings recorded in `docs/agents/runs/MM-SIM-STAGE-REV3-BUTTON-LED/`.

## Global Constraints

- Preserve existing lesson routes, order, guided navigation, guest/local-first behavior, and all unrelated lesson behavior.
- Keep all electrical identities as stable `partId/pinId` and wire IDs; button press changes only the virtual input state, never static topology.
- Do not describe a code-subset trace as firmware execution, an electrical solve, voltage/current measurement, or physical validation.
- Do not invent board-clone internals, switch bounce/debounce behavior, ADC values, electrical limits, or physical dimensions.
- No new dependencies, remote services, Web Serial, device actions, learning-data persistence/schema changes, or hardware-configuration changes.
- Unsupported board/profile, incomplete wiring, malformed/unsupported code, or invalid topology must not produce signal highlights.
- Keep the V2 workspace's edit/run gates intact; do not enable unrestricted simulation as a side effect.
- Do not change the switch model manifest or global breadboard snapping tolerance to make the new fixture pass.

## Verified Current-Code Findings

1. `/learn/:lessonId` and `/app/learn/:lessonId` currently render `LessonPreflightPage`; `LessonPage` is the blink-only long lesson. The button slice must use the existing preflight route without redirecting or replacing blink.
2. `LessonCircuitWorkspace` currently renders breadboard and schematic tabs; it has no 3D tab, and its signal flow is hard-coded to GPIO 23 / the blink topology.
3. `evaluateProgram` returns localized `trace` strings for `input-branch`; those strings must not become a machine interface. Add typed read/branch/write events in the later trace slice.
4. The `button` model maps two physical legs to each logical contact: `contactA` legs at `(0,0)` and `(6.5,0)`, `contactB` legs at `(0,4.5)` and `(6.5,4.5)`. `footprintHoles` currently fixes the first leg to the anchor and applies a 0.7 mm residual limit, while `assemblyLayout.ts` centers residual error before accepting. The button therefore needs explicit centered fit in the CircuitDocV2 resolver; no manifest edit or tolerance increase.
5. `BreadboardEditor` uses `activeWireIds` for the wire list; the lesson canvas must also visibly highlight active wire paths. `CircuitSchematicV2` already accepts active endpoint keys, but selected-net state and 3D active wire IDs need explicit propagation.

## Review Focus

1. Four physical switch legs remain two contacts, and a press never unions static nets.
2. A supported input flow requires a complete, non-shorted topology and matching input/output aliases for the selected supported board profile.
3. Released `INPUT_PULLUP` is HIGH and pressed is LOW; the `if/else` output state follows the actual condition and must reverse when the condition is edited.
4. Unsupported/malformed code, unknown board profiles, broken LED/input wiring, or a missing series resistor create no synthetic trace/highlight.
5. Signal highlighting targets the same stable wire/net/part identities across breadboard, schematic, and 3D; labels accompany colors and controls work by keyboard.

---

## Slice A — Canonical Topology and Four-Leg Switch Fit

**Task ID:** `MM-SIM-STAGE-REV3A-BUTTON-TOPOLOGY`

**Files:**
- Modify `src/data/lessonCircuitDocs.ts` — add a fresh `button-led` CircuitDocV2 fixture; leave `blinkDoc` bytes/behavior unchanged.
- Modify `src/lib/mountResolve.ts` — center footprint residuals before snapping, bounded by the existing 0.7 mm maximum; return the current stable hole IDs.
- Modify `tests/lesson-circuit-docs.test.mjs` — canonical button document, unique IDs, expected net partition, valid G1–G4 document.
- Modify `tests/circuit-doc-v2.test.mjs` — exact switch footprint and mount acceptance, including 90° placement at column 20 / row `f` resolving to `20f,20e,22f,22e`.
- Modify `tests/assembly-layout-v2.test.mjs` — assert the 3D assembly projection for the fixture uses the same four hole identities as the 2D resolver.
- Modify `tests/layout-2d.test.mjs` — update the legacy geometry-blocked expectation because the centered resolver now permits the button draft migration; assert that the V1 sample still lays out without overlap and the migration remains copy-only.
- Write evidence only under `docs/agents/runs/MM-SIM-STAGE-REV3A-BUTTON-TOPOLOGY/`.

**Acceptance:** button fixture passes `validateCircuitDoc`; `contactA` and `contactB` each resolve to two legs; input and GND are distinct nets; LED series path and return match the blink topology; button contacts are not shorted together; 2D resolver and 3D assembly report matching hole IDs; malformed/off-grid placement remains rejected; legacy button sample migrates to a non-overlapping layout without modifying its V1 input; existing blink tests pass.

**Verification:** focused lesson-circuit-docs, CircuitDocV2 mount, and V2 assembly tests; then `npm.cmd run typecheck` and `npm.cmd test`.

## Slice B — Typed Active-Low Code Events

**Task ID:** `MM-SIM-STAGE-REV3B-BUTTON-TRACE`

**Files (scope to be leased after Slice A):** `src/lib/educationalProgram.ts`, new focused test `tests/educational-program-events.test.mjs`, and `docs/agents/runs/MM-SIM-STAGE-REV3B-BUTTON-TRACE/`. The existing `tests/regressions.test.mjs` is a broad cross-feature suite, so keep this new event contract in a narrow test file. Add other paths only after a lead scope update.

**Contract:** supported `input-branch` evaluation exposes typed `read`, `branch`, and `write` events with pin, sampled logic level, selected branch, output pin/level, and optional source line only where exact mapping exists. Keep human-readable trace for display, but never parse it for behavior. The parser must reject pin aliases that do not match the selected supported profile and must not emit events for malformed/unsupported code.

**Acceptance:** released HIGH / pressed LOW; LOW comparison selects true branch only when pressed; output levels reverse correctly when comparison polarity changes; no events for unsupported syntax/profile; existing code-subset lessons retain their current behavior and tests.

**Verification:** focused parser/evaluator tests; `npm.cmd run typecheck`; `npm.cmd test`.

## Slice C — Button Lesson Workspace and Cross-View Trace

**Task ID:** `MM-SIM-STAGE-REV3C-BUTTON-UI`

**Entry point:** conditionally mount a dedicated button lesson experience within the existing `LessonPreflightPage` route for `button-led`; keep the board/curriculum/navigation/preflight information and CTA available. Do not add a competing route or alter `LessonPage`'s blink flow.

### Information-dense, single-screen workspace (founder steering, 2026-11-12)

- On a 1440×900 desktop viewport, keep the lesson identity/progress, interactive circuit scene, schematic access, selected-part/net details, code, current provider output, and next/previous lesson actions in one application viewport. Avoid page-level vertical scrolling for the core flow; long text and code may scroll inside their own panels.
- Arrange the workspace as a compact lesson rail, a dominant synchronized circuit stage, and a contextual information/code panel. The schematic can dock, overlay, or resize beside the assembly; toggling views must preserve selection, button state, and typed-event context.
- Use progressive disclosure for beginners: Overview first, with direct tabs for Parts/Pinout, Code, and Output/Trace. Do not make the learner hunt below the scene for the next step. Keep the primary lesson action visible.
- Desktop should keep the virtual button control and concise provider-labeled result (`read level → selected branch → LED state`) visible beside the scene; long code and lesson text scroll inside their own panels. Keep previous/next lesson actions in the workspace rail.
- At 375×812, use a compact view switcher for Circuit, Schematic, Code, and Details rather than shrinking every panel into unreadable columns. Keep lesson progress and the current primary action reachable, retain the exact state across view switches, and avoid horizontal page overflow.
- A list/keyboard path must expose the same part, pin, net, and wire identities as the canvas. No interaction or styling may imply that an educational event is a firmware execution, electrical measurement, or physical observation.

**Scope proposal (final exact lease after Slice B):** `src/pages/LessonPreflightPage.tsx` and scoped CSS; a new `src/components/lesson/ButtonLedLessonLab.tsx` and CSS; `src/components/lesson/LessonCircuitWorkspace.tsx` and CSS; `src/components/builder/BreadboardEditor.tsx` and CSS; `src/components/builder/CircuitSchematicV2.tsx` and CSS; `src/components/builder/AssemblyStage.tsx` and CSS; `e2e/journeys.spec.mjs`; focused lesson workspace tests; run evidence under `docs/agents/runs/MM-SIM-STAGE-REV3C-BUTTON-UI/`. The lease must enumerate exact files and stay disjoint from any active lease.

**Acceptance:**
- Accessible native radio/toggle controls `Thả nút` / `Nhấn nút`, default released, visible HIGH/LOW status and one polite announcement; no color-only state.
- Supported typed code events and validated topology drive highlights on the exact button input path and LED path. Broken/missing/shorted nets, unknown board, or unsupported code produce no active highlights.
- Active paths are visibly highlighted in breadboard canvas and wire controls, schematic net selection/highlight, and 3D wire styles; selection is consistent by stable IDs.
- Selecting the switch exposes its two electrical contacts and four metal legs; explanatory text says the two leg pairs are internally grouped in the model and virtual press changes input state only.
- No source-line claim unless exact source spans are emitted. No claim of debounce, actual voltage/current, firmware execution, electrical solve, or physical switch operation.
- E2E at 375×812 and 1440×900 checks lesson route, default released HIGH, press→LOW/true branch/LED state, keyboard interaction, unsupported/malformed code no highlight, view switching preserving selection, and no horizontal overflow.
- Desktop E2E also asserts the core workspace panels and lesson actions fit within the viewport without page-level vertical scrolling at 1440×900; mobile E2E verifies the compact view switcher and persistent lesson action at 375×812.
- E2E verifies changing the input or lesson invalidates the previous result, and switching board profiles cannot display events for mismatched pin aliases.

**Verification:** focused tests, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local`, `npm.cmd run test:e2e`; screenshots and hashes recorded in the slice report.

## Sequence and Handoff

1. Execute only Slice A under its active exact-path lease.
2. Freeze/release Slice A, run its review and verification, then proceed to Slice B only if the fixture contract is accepted.
3. Freeze/release Slice B, then finalize the UI file lease and dispatch Slice C.
4. After each slice, update only the canonical task queue; keep this plan as design/sequence, not a second status board.
5. This plan does not claim parity with Learn Arduino/Learn ESP or conversion of the full 11-lesson curriculum. It establishes a tested interaction pattern to reuse for later lesson slices.
