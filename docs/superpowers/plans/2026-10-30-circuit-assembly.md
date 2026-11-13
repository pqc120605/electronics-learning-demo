# Circuit Assembly Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let learners assemble a documented circuit from the board and component library, connect named pins on a breadboard canvas, and keep the project separate from any claims of electrical simulation.

**Architecture:** Define a circuit project model with stable instance/pin IDs, then render it in a dedicated workspace using the existing React app. Reuse the component catalogue from the electronics-library plan; persist a learner's draft locally. The first version is visual assembly with sourced warnings, not an electrical solver.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite, existing CSS system and board viewer utilities.

**Spec:** `docs/superpowers/specs/2026-10-30-circuit-builder-simulation-design.md`

## Global Constraints

- This plan depends on the component schema and catalogue records from `2026-10-30-electronics-library.md`.
- Board revision, pin endpoint and component variant must be explicit in a project.
- Visual proximity or 3D selection is never proof of an electrical net.
- Warn only for rules supported by known, sourced data; show unknown instead of assuming.
- Do not add or run automated tests unless the user asks; follow the acceptance checks in this plan during implementation.

## Review Focus

- A component moves but its wire stays attached to screen coordinates: wires must bind to stable part-instance pin endpoints.
- A component has no placement/model asset: render a labeled schematic-style placeholder, not a false 3D board/package.
- A saved circuit refers to a board/component removed from catalogue: load safely and explain missing records.
- User adds an incompatible board/part: mark unknown/unsupported; do not silently approve it.
- Keyboard/touch users cannot make wire connections: provide a non-drag connection flow.

## File Structure

- `src/types/circuitProject.ts` — circuit, instance, pin endpoint and wire types.
- `src/lib/circuitProjectStorage.ts` — versioned local draft read/write and migration handling.
- `src/pages/CircuitBuilderPage.tsx` — route composition and workspace state.
- `src/components/circuit/ComponentPalette.tsx` — searchable catalogue palette.
- `src/components/circuit/CircuitCanvas.tsx` — board/breadboard and placed parts.
- `src/components/circuit/WireLayer.tsx` — routed wire rendering anchored to pins.
- `src/components/circuit/PartInspector.tsx` — sourced pinout, electrical facts, compatibility and safety notes.
- `src/components/circuit/CircuitTemplates.tsx` — starter projects.
- `src/App.tsx` — `/build` route.
- `src/styles/app.css` — responsive workspace styling.

## Task 1: Define circuit project model and local persistence

**Files:**
- Create: `src/types/circuitProject.ts`
- Create: `src/lib/circuitProjectStorage.ts`

**Interfaces:**
- `CircuitProject`: `{ schemaVersion, id, title, boardId, boardVariant, parts, wires, updatedAt }`.
- `CircuitPartInstance`: `{ instanceId, componentId, variantId?, x, y, rotation }`.
- `CircuitPinEndpoint`: `{ instanceId, pinId }`.
- `CircuitWire`: `{ id, from, to, color }`.
- Storage API: `loadCircuitProject(id)`, `saveCircuitProject(project)`, `listCircuitProjects()`, `deleteCircuitProject(id)`.

- [ ] Write TypeScript types with stable IDs independent of canvas coordinates.
- [ ] Implement versioned `localStorage` serialization and parsing; malformed or unknown schema versions return a recoverable error state without deleting stored data.
- [ ] Store only board/component IDs and instance data, not duplicated source specifications or binary model files.
- [ ] Define whether project IDs are UUIDs and use one implementation consistently.
- [ ] Manually create, reload, rename, and delete a draft; verify that a missing catalogue record is reported instead of crashing.

## Task 2: Create workspace shell and component palette

**Files:**
- Create: `src/pages/CircuitBuilderPage.tsx`
- Create: `src/components/circuit/ComponentPalette.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Route `/build` creates or opens a local circuit project.
- Palette consumes `ComponentDefinition[]` from `src/data/components.ts` and emits selected component ID/variant.

- [ ] Add a clear workspace header with project title, board selector, save status, undo/reset affordance and mode label `Lắp ráp trực quan`.
- [ ] Build category/search palette using canonical component records; visually distinguish 3D model availability from simulation support.
- [ ] Add only board variants present in the board catalogue. A preview board can be used as a diagram reference but must not claim a verified physical model.
- [ ] Support adding a part by click/tap as well as drag, so pointer drag is not the only interaction.
- [ ] Style keyboard focus and narrow screen layout; keep component details reachable without forcing a page-length scroll.

## Task 3: Render board, breadboard, parts and anchored wires

**Files:**
- Create: `src/components/circuit/CircuitCanvas.tsx`
- Create: `src/components/circuit/WireLayer.tsx`
- Modify: `src/pages/CircuitBuilderPage.tsx`

**Interfaces:**
- Canvas consumes a `CircuitProject`, component definitions and callbacks for add/move/rotate/remove/select/connect.
- Wire endpoints resolve through `instanceId + pinId`; coordinates are calculated from current part placement and declared pin anchor.

- [ ] Render the circuit board/breadboard using current available assets where status permits; otherwise render an explicitly labeled diagram placeholder.
- [ ] Place parts from the palette; support move, rotate and remove without losing endpoint identities.
- [ ] Show pin anchors only for pins defined by the component schema. Never invent connector pin order.
- [ ] Implement click/tap-to-connect flow with start pin, end pin, cancel and keyboard-accessible alternative; render wires from pin anchors so moving a part updates wires.
- [ ] Provide wire color selection limited to visual convention and label it as convention, not electrical inference.
- [ ] Manually exercise adding/removing/moving/rotating a part and connecting its pins; verify wires stay attached and unknown pins cannot be selected.

## Task 4: Part inspector, source-backed cautions and project templates

**Files:**
- Create: `src/components/circuit/PartInspector.tsx`
- Create: `src/components/circuit/CircuitTemplates.tsx`
- Modify: `src/pages/CircuitBuilderPage.tsx`
- Modify: `src/data/components.ts` only for verified source-backed fields needed by starter circuits.

- [ ] Show plain-language purpose, pinout, voltage/logic limits, interface, compatibility, source links and model/simulation status for selected parts.
- [ ] Show electrical warning only when the involved board/component facts are sourced; unknown compatibility is shown as unknown.
- [ ] Add templates for LED + resistor, button input, potentiometer/LDR reading, temperature sensor + OLED, HC-SR04 and servo where board/component definitions cover every connection.
- [ ] Each template has an explicit parts list, pin-to-pin wiring map, learning objective and safety note.
- [ ] Add reset/clear with a confirmation or undoable action; preserve the saved project until user confirms.
- [ ] Manually load every template and compare the displayed wiring/instructions to its declared pin map.

## Task 5: Save behavior and acceptance review

**Files:**
- Modify: `src/pages/CircuitBuilderPage.tsx`
- No new files expected.

- [ ] Autosave after meaningful edits, show saved/unsaved/error state and provide retry if local storage is unavailable.
- [ ] Handle removed board/component IDs with a visible recovery message and allow the user to remove/replace unavailable parts.
- [ ] Run `npm run build` from `electronics-learning-demo` and resolve TypeScript/build errors.
- [ ] Manually check add/connect/move/rotate/remove, reload persistence, keyboard access, narrow layout and all starter circuits.
- [ ] Confirm the UI labels this as visual assembly and does not enable a false “Run simulation” success state.

## Review Focus Mapping

- Stable wire endpoints → Tasks 1 and 3.
- Missing model → Tasks 2 and 3.
- Stale stored project → Tasks 1 and 5.
- Incompatible component → Tasks 2 and 4.
- Keyboard/touch access → Tasks 2 and 3.
