# Mạch Mở Stage A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ESP32 LED lesson and its linked workbench use one live `CircuitDocV2` topology for parts, pins, wires, net identity, selection and code-flow highlighting.

**Architecture:** Add one reviewed ESP32 LED `CircuitDocV2` fixture and a small compatibility boundary for the existing schematic/assembly components. In the workbench, v2 topology becomes the in-memory source of truth while the existing schema-4 workspace and version-1 project bundle remain the persistence/export formats through explicit adapters; display layout stays separate. The lesson page consumes the same circuit document and exposes synchronized scene, schematic, connection, inspector and code-flow selection without changing routes or claiming unsupported ESP32 execution or electrical results.

**Tech Stack:** TypeScript strict, React, Vite, existing `CircuitDocV2`/`createNetIndexV2`/`layout2D`/`mountResolve` modules, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md`

## Global Constraints

- Keep current navigation, route destinations, lesson sequence and guest/local-first behavior.
- Use stable `partId`/`pinId` identities for topology and selection.
- Do not write a new storage key, bump workspace/project schema, overwrite drafts, or silently migrate saved data.
- Keep visual layout separate from electrical topology.
- Keep educational logic traces, supported firmware execution, analog solver output and physical measurement distinct.
- Mark CAD-backed, parametric and unknown geometry honestly; unsupported endpoints or mounts must remain explicit.
- Do not add dependencies, cloud services, accounts, telemetry, remote builds or device operations.
- Preserve the existing SPICE release gates and only enable SPICE handoff when current support checks accept the projected graph.
- Browser evidence at 375 px and 1440 px is required; if browser execution is unavailable, report `NOT_RUN`.
- Do not edit `D:/StartupOS/app`, read secrets, contact external services, or copy competitor assets, source, text, styles or curriculum.

## Review Focus

- **Legacy draft or bundle contains unsupported part/pin/hole data:** preserve the source bytes and show an actionable incompatibility; pin with adapter tests using malformed and future-version fixtures.
- **A v2 hole endpoint cannot be represented by an existing pin-only view:** do not invent a wire endpoint; expose an unresolved diagnostic and keep the v2 graph intact; pin with projection tests for hole-to-hole, hole-to-pin and unconnected-hole cases.
- **A display-only drag/rotation changes electrical connectivity:** layout updates must not alter `CircuitDocV2`; pin with reducer tests that compare net partitions before/after a layout action.
- **A code line is outside the supported parser/provider subset:** highlight no circuit object for that line and show the parser/provider limitation; pin with code-flow tests for supported actions, delays and unsupported lines.
- **A board clone or component has illustrative/unknown geometry:** keep the evidence label visible in inspector and assembly; pin with render-state tests for CAD, parametric and unknown geometry classifications.

---

## File Map

- Create `src/data/lessonCircuitDocs.ts`: canonical lesson circuit documents and lookup for the Stage A ESP32 LED sample.
- Create `src/lib/circuitDocAdapters.ts`: pure conversions between v2 topology, existing pin-based view models and legacy schema-4 / bundle-v1 payloads; return warnings rather than dropping unsupported data.
- Create `src/lib/circuitDocEdits.ts`: pure v2 edit operations for the workbench actions used in Stage A; layout-only edits remain in a separate layout object.
- Create `src/components/lesson/LessonCircuitWorkspace.tsx` and `.css`: responsive scene/schematic/connection/inspector workspace driven by one `CircuitDocV2` and stable selection keys.
- Modify `src/components/pcb/pcb-viewer.css`: bring the copper-layer viewer into the new warm paper/navy interface, fix control and inspector contrast, and keep copper fills/materials distinct from the page surface.
- Modify `src/pages/LessonPage.tsx`: mount the shared lesson workspace for the ESP32 LED activity and connect lesson/code-step selection to it without changing lesson routes or existing navigation.
- Modify `src/pages/CircuitBuilderPage.tsx`: make `CircuitDocV2` the live topology state for the selected lesson; adapt existing view components and persistence boundaries rather than changing their stored formats.
- Create `tests/lesson-circuit-docs.test.mjs`, `tests/circuit-doc-adapters.test.mjs`, `tests/circuit-doc-edits.test.mjs`, and `tests/lesson-circuit-workspace.test.mjs`: fixture, topology, compatibility, reducer, and component behavior checks.
- Modify `e2e/journeys.spec.mjs`: first add PCB copper-layer/contrast regressions, then add the Stage A cross-view journey and responsive assertions.
- Create `docs/agents/runs/MM-SIM-STAGE-A/report.md`: exact snapshot hashes, verification output, browser evidence or `NOT_RUN`, and remaining limitations.

## Task 1: Canonical ESP32 LED CircuitDocV2 fixture

**Files:**
- Create: `src/data/lessonCircuitDocs.ts`
- Test: `tests/lesson-circuit-docs.test.mjs`

**Interfaces:**
- Consumes: `CircuitDocV2`, `componentRegistry`, `validateCircuitDoc`, `createNetIndexV2`.
- Produces: `getLessonCircuitDoc(lessonId: string): CircuitDocV2 | null`, returning a fresh deep copy so callers cannot mutate the shared fixture.
- Stable fixture IDs: `board-1`, `bb-1`, `res-1`, `led-1`; jumper IDs `w-gpio-to-resistor`, `w-led-cathode-to-rail`, `w-rail-to-gnd`. The resistor-to-LED connection is made by their shared breadboard strip, not a fabricated extra jumper.

- [x] **Step 1: Add failing fixture tests.** Assert schema, stable IDs, 220 Ω value, validity, connectivity and deep-copy behavior.
- [x] **Step 2: Run the focused test and confirm it fails** because `lessonCircuitDocs.ts` is not present (3 expected failures).
- [x] **Step 3: Implement the fixture using verified existing registry pin IDs.** The resistor-to-LED continuity is modeled by a shared breadboard strip; jumper wires terminate at explicit holes and the ESP32 pins.
- [x] **Step 4: Run `node --test tests/lesson-circuit-docs.test.mjs`** (3/3 pass) and `npm.cmd run typecheck` (exit 0).

## Task 2: Pure adapters and explicit layout boundary

**Files:**
- Create: `src/lib/circuitDocAdapters.ts`
- Test: `tests/circuit-doc-adapters.test.mjs`
- Read only: `src/lib/migrateV1toV2.ts`, `src/types/circuitWorkspace.ts`, `src/types/circuitTopology.ts`, `src/lib/circuitNetsV2.ts`, `src/lib/layout2D.ts`.

**Interfaces:**
- Consumes: `CircuitDocV2`, `CircuitWorkspaceDocument`, `CircuitPart`, `CircuitConnection`, `createNetIndexV2`, `layout2D`.
- Produces:
  - `projectDocToTopology(doc, layout): { parts: CircuitPart[]; connections: CircuitConnection[]; unresolved: ProjectionIssue[] }` for the existing schematic and assembly surfaces.
  - `legacyWorkspaceToDoc(workspace, lessonId): { status: 'ok'; doc: CircuitDocV2; warnings: string[] } | { status: 'unsupported' | 'invalid'; reason: string }` using existing migration semantics without writing storage.
  - `docToLegacyWorkspace(doc, source): { status: 'ok'; workspace: CircuitWorkspaceDocument; warnings: string[] } | { status: 'unsupported'; reason: string }`, preserving all non-topology source fields and refusing lossy writes when a hole endpoint cannot be represented by the legacy pin-only format.
  - `ProjectionIssue` carries `code`, `message`, and affected stable IDs; it must not fabricate an endpoint.

- [x] **Step 1: Write failing adapter tests** for IDs, separate layout, hole projection/rejection and schema-4 preservation.
- [x] **Step 2: Run `node --test tests/circuit-doc-adapters.test.mjs` and confirm the missing adapter exports fail** (5 expected failures).
- [x] **Step 3: Implement projection using only pin identities in the same `createNetIndexV2` net.** Hole-only and single-pin nets return `ProjectionIssue`; layout is converted to view percentages separately from topology.
- [x] **Step 4: Implement pure legacy conversions** through `migrateWorkspaceV1ToV2`, preserve the source object/extensions and refuse writes that would drop hole endpoints.
- [x] **Step 5: Run `node --test tests/circuit-doc-adapters.test.mjs tests/migrate-v1-v2.test.mjs`** (8/8 pass); `npm.cmd run typecheck` exit 0.

## Task 3: V2 topology edit operations for Stage A

**Files:**
- Create: `src/lib/circuitDocEdits.ts`
- Test: `tests/circuit-doc-edits.test.mjs`

**Interfaces:**
- Consumes: `CircuitDocV2`, `CircuitEndpointV2`, `createNetIndexV2`, `validateCircuitDoc`.
- Produces pure operations:
  - `select` is UI-only and is not part of the document.
  - `movePartLayout(layout, partId, position)` changes layout state only.
  - `addPart(doc, part)` / `removePart(doc, partId)` / `addWire(doc, wire)` / `removeWire(doc, wireId)` / `setPartValue(doc, partId, value)` return `{ doc, issues }`; the source doc is not mutated. `removePart` refuses while a wire or `openPins` entry refers to one of its pins.
  - Every topology edit recalculates `expect.partCount`, `expect.wireCount`, and `expect.netCount`; invalid edits return issues and leave the prior document usable.

- [x] **Step 1: Write tests** proving add/remove part, add/remove wire and value edits are immutable and update the right fields; a layout move leaves serialized `CircuitDocV2` and all `netOf()` equivalence pairs unchanged; invalid duplicate endpoints are refused with G4 diagnostics. Example:

```js
test('moving a part changes layout but preserves electrical nets', () => {
  const before = getLessonCircuitDoc('blink')
  const beforeIndex = createNetIndexV2(before)
  const beforeSameNet = beforeIndex.netOf('res-1:a') === beforeIndex.netOf('board-1:ledOut')
  const nextLayout = movePartLayout({ 'res-1': { x: 40, y: 50 } }, 'res-1', { x: 70, y: 20 })
  const afterIndex = createNetIndexV2(before)
  assert.equal(nextLayout['res-1'].x, 70)
  assert.equal(afterIndex.netOf('res-1:a') === afterIndex.netOf('board-1:ledOut'), beforeSameNet)
  assert.equal(JSON.stringify(before), JSON.stringify(getLessonCircuitDoc('blink')))
})
```
- [x] **Step 2: Run the focused test and confirm it fails because the edit module is absent.**
- [x] **Step 3: Implement the pure edit helpers.** Use a copied doc, run `validateCircuitDoc`, and return the original topology unchanged when new errors appear. Never alter IDs of existing parts or wires.
- [x] **Step 4: Run `node --test tests/circuit-doc-edits.test.mjs`** (5/5 pass); `npm.cmd run typecheck` exit 0.

## Task 4: Make CircuitBuilderPage use v2 topology in memory

**Files:**
- Modify: `src/pages/CircuitBuilderPage.tsx`
- Use: `src/data/lessonCircuitDocs.ts`, `src/lib/circuitDocAdapters.ts`, `src/lib/circuitDocEdits.ts`
- Test: `tests/circuit-doc-adapters.test.mjs`, `tests/circuit-doc-edits.test.mjs`, existing `tests/circuit-nets-v2.test.mjs`, `tests/migrate-v1-v2.test.mjs`.

**Interfaces:**
- `CircuitDocV2` is the owner of part IDs, pin IDs, wire endpoints and connectivity while the workbench is open.
- Existing schematic/assembly/PCB/firmware/logic/SPICE surfaces receive derived compatibility projections. Selection is a stable `{ kind: 'part' | 'pin' | 'wire' | 'net'; key: string }` and does not mutate topology.
- Existing schema-4 autosave and version-1 bundle exports remain behind the adapter; persist/export only when conversion is lossless. Preserve source draft and show a recoverable warning when it is not.

- [ ] **Step 1: Add an adapter regression fixture** that opens the ESP32 LED lesson from the legacy query and asserts every view projection comes from the same v2 `partId`/`pinId`/wire IDs and net index.
- [ ] **Step 2: Run the focused regression and observe failure** because workbench topology is still initialized from independent `placed`/`wires` state.
- [ ] **Step 3: Initialize the workbench document once.** Use the canonical doc for the LED lesson; for existing workspace drafts, adapt in memory without writing a v2 key or overwriting the original object. Keep a separate layout state for x/y and assembly mount positions.
- [ ] **Step 4: Replace topology mutation entry points with the pure v2 edit helpers.** Wire add/remove, part add/remove and part-value edits must update the doc first, then derive legacy view projections. A display-only move/rotate updates layout and cannot change `netOf()`.
- [ ] **Step 5: Route save, autosave and project import/export through the compatibility adapter.** If the edited graph cannot be represented in schema 4/bundle v1, retain the current draft and show a clear message explaining which hole connection prevents lossless save; do not silently drop it or write a new storage key.
- [ ] **Step 6: Preserve current simulator gates.** Generate logic/firmware/SPICE inputs only from adapters accepted by the corresponding existing support check; retain provider and target labels.
- [ ] **Step 7: Run `npm.cmd run typecheck` and targeted tests** (`node --test tests/circuit-doc-adapters.test.mjs tests/circuit-doc-edits.test.mjs tests/circuit-nets-v2.test.mjs tests/migrate-v1-v2.test.mjs`) and fix regressions within the owned files.

## Task 5: Shared lesson circuit workspace and synchronized selection

**Files:**
- Create: `src/components/lesson/LessonCircuitWorkspace.tsx`
- Create: `src/components/lesson/LessonCircuitWorkspace.css`
- Modify: `src/pages/LessonPage.tsx`
- Test: `tests/lesson-circuit-workspace.test.mjs`

**Interfaces:**
- Props: `{ doc: CircuitDocV2; selected: CircuitSelection | null; onSelect(selection): void; activeAction: LessonCircuitAction | null; boardProfileId: string }`.
- `LessonCircuitAction` identifies exact `partId`, optional `pinId`, optional `wireId` and a textual reason from the supported lesson action map; unsupported lines produce no synthetic action.
- Parts, pins, wires and nets use the stable identity keys already defined by `CircuitDocV2` and `createNetIndexV2`.

- [ ] **Step 1: Add a server-rendered component test** for the accessible connection list, inspector identity, geometry provenance label, unsupported projection message and simulation-truth label. Cover pointer and keyboard selection in Task 6 E2E, where browser events can be exercised.
- [ ] **Step 2: Run the focused test and confirm the component is absent.**
- [ ] **Step 3: Implement the responsive workspace.** Use the canonical doc for connection list, schematic projection and dynamic assembly projection; include a keyboard-operable list equivalent for canvas selection; display source/clone profile and `cad`/`parametric`/`unknown` geometry state in the inspector.
- [ ] **Step 4: Keep board profile changes reference-only unless the existing lesson preflight says the target is supported.** Render an explicit unsupported/reference message rather than reusing ESP32-specific geometry as if it belonged to another board.
- [ ] **Step 5: Replace only the ESP32 LED lesson's current circuit exploration region** in `LessonPage.tsx`; preserve URL routes, lesson sequence, checklist, code editor and existing navigation. Connect current lesson steps and parsed supported code actions to stable IDs in the shared workspace. Example action mapping:

```ts
const ledActionByKind = {
  pinMode: { partId: 'board-1', pinId: 'gpio23' },
  digitalWrite: { partId: 'board-1', pinId: 'gpio23', wireId: 'w-led-out' },
  delay: null,
} as const
```

Use the exact existing registry pin ID for GPIO 23; do not add a synthetic `gpio23` pin if the registry uses another ID.
- [ ] **Step 6: Keep the blink animation labeled as an educational visual trace.** Do not label it voltage/current simulation or ESP32 firmware execution.
- [ ] **Step 7: Run `node --test tests/lesson-circuit-workspace.test.mjs`, `npm.cmd run typecheck`, and targeted existing lesson tests.**

## Task 6: End-to-end Stage A acceptance and evidence

**Files:**
- Modify: `e2e/journeys.spec.mjs`
- Create: `docs/agents/runs/MM-SIM-STAGE-A/report.md`

- [ ] **Step 1: Add one E2E journey** from `/app/learn/esp32-led` to the guided workbench and back; assert the canonical IDs are visible in connection list, schematic and assembly, and a selection/code step highlights the same identity across views.
- [ ] **Step 2: Run the journey at 375×812 and 1440×900.** Assert the next action, inspector, connection list and simulation label remain usable and `document.documentElement.scrollWidth <= clientWidth`.
- [ ] **Step 3: Exercise import/export preservation** with an existing schema-4 draft and version-1 project bundle fixture. Compare the original persisted JSON before/after navigation; assert no new v2 storage key is written and no source bytes were overwritten.
- [ ] **Step 4: Run `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local`, and `npm.cmd run test:e2e`.** Record exact exit codes and test counts; do not claim a browser check passed if the browser is unavailable.
- [ ] **Step 5: Capture browser evidence** for both viewports using the project Playwright setup. If the local browser control is unavailable, record `NOT_RUN` and reason, and keep the visual acceptance open.
- [ ] **Step 6: Write `docs/agents/runs/MM-SIM-STAGE-A/report.md`** with the changed-file list, SHA-256 for each changed implementation/test file, commands/results, viewport evidence, unsupported geometry/provider limits, migration behavior, and remaining defects.
- [ ] **Step 7: Review the Stage A snapshot** against the acceptance criteria in the spec; only then mark this stage complete and prepare a separate Stage B plan based on measured coverage gaps.

## Completion Gate

Stage A is accepted only when all six tasks pass, the same canonical IDs and topology appear across the lesson and workbench projections, legacy draft/bundle data is recoverable without silent writes, the prescribed checks have fresh passing evidence, and both viewports have browser evidence or an explicit `NOT_RUN` record. Stage A acceptance does not claim end-state parity with Learn Arduino or Learn ESP; it unlocks a measured Stage B plan. Stages B–D remain separate plans and must continue until the end-state parity matrix in the spec is satisfied.

## Prerequisite Task 0: Fix the PCB copper viewer before the new slice

**Files:**
- Modify: `src/components/pcb/pcb-viewer.css`
- Modify: `src/components/pcb/Pcb2DViewer.tsx` (join source Edge.Cuts fragments before filling the board; keep the source manifest unchanged)
- Test: `e2e/journeys.spec.mjs`

- [x] **Step 1: Add browser regressions** for selected-side controls, text contrast, exact F.Cu/B.Cu feature counts, zone visibility, and one closed board outline.
- [x] **Step 2: Confirm the original failures** from the user screenshot and browser computed styles (near-white text on cream controls), and inspect the source manifest showing five open outline fragments. The first sandboxed Playwright invocation stalled before a test result; reran the focused test with local browser permissions after the fix.
- [x] **Step 3: Restyle the viewer** with shared cream/navy/red colors while retaining the dark canvas and gold copper. Join source Edge.Cuts fragments only when endpoints meet within a 0.02 mm tolerance; the source manifest remains unchanged.
- [x] **Step 4: Run the focused E2E regression at 1440 px and 375 px**; exact layer counts and zone behavior pass. Browser contrast measured 13.51:1 for the net selector and 12.27:1 for inspector heading; the corrected outline has one `M` and closes with `Z`.
- [x] **Step 5: Record baseline 448/448 and the focused regression result in the Stage A ledger; then proceed to Task 1.**

## Execution Notes

- Keep one writer in the shared checkout. Do not dispatch parallel implementers for the shared topology contract.
- Do not stage or commit until the repository root is correctly resolved; current workspace commands have reported a root-resolution error, so first verify the actual Git root during implementation.
- If the actual code requires a file outside this map or a lossy storage/schema change, stop and update this plan before changing that boundary.
