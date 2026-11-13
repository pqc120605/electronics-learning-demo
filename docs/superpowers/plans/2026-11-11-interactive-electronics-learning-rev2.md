# Interactive Electronics Learning Rev 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give one beginner circuit editable pin-to-hole jumpers, a conventional teaching schematic, a coherent 3D breadboard assembly, synchronized lesson steps, and reload-safe local drafts.

**Architecture:** Keep `CircuitDocV2` as electrical topology and stable identity source; derive editor, schematic, 3D and lesson views from it. Store new v2 documents in a separate version-5 workspace envelope only after explicit migration preview acceptance; never overwrite the schema-4 source. Implement one LED lesson end-to-end first, then expand only to lessons with supported geometry and simulation evidence.

**Tech Stack:** TypeScript strict, React, SVG/Three.js already in the project, Vite, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md` (Revision 2).

## Global Constraints

- Do not copy competitor assets, source code, text, styles, branding or lesson content.
- Keep `CircuitDocV2` IDs and pin identities stable; display layout does not change topology.
- Use `machmo-builder-session-v5` for v2 workspace writes; keep `machmo-builder-session` schema-4 bytes untouched.
- Write v5 only after the user accepts the migration preview; v5 takes read precedence only after it exists and validates.
- Keep schema-4 workspaces and v1 portable projects readable; refuse lossy exports with a recovery-oriented explanation.
- No new dependencies, cloud services, accounts, telemetry, remote builds, device operations or schema changes beyond the approved v5 envelope.
- Mark CAD-backed, parametric and unknown geometry honestly; assumed rail dimensions remain explicitly unverified.
- Do not represent an educational trace as firmware execution, electrical solve or physical measurement.
- Preserve current route destinations, lesson order, guest/local-first behavior and existing drafts.
- Use `npm.cmd` for Windows checks; do not edit `D:/StartupOS/app`, secrets or unrelated files.
- One writer owns source changes; specialist agents are not dispatched for this plan.

## Review Focus

- V5 malformed, stale, quota-full or conflicting with v4 data: preserve both byte strings and show recovery choice; cover storage reader/writer tests.
- Hole endpoint points to absent breadboard, occupied lead, split strip or unknown rail model: reject or warn with a typed diagnostic; cover G4/connectivity tests.
- A wire endpoint changes while a pointer gesture is in progress: commit only after a valid target; cover pointer, keyboard and cancellation tests.
- Schematic crosses two nets without a junction or joins branches with one: preserve the `createNetIndexV2` partition; cover crossing/junction layout tests.
- A 3D component lacks verified pins/legs or a board anchor: mark illustrative/unsupported and never fabricate a physical endpoint; cover placement provenance tests.

---

## Completed foundation carried forward

The prior Stage A plan tasks 1–3 are complete and should not be repeated:

- `src/data/lessonCircuitDocs.ts` supplies the canonical LED fixture.
- `src/lib/circuitDocAdapters.ts` converts between CircuitDocV2 and legacy projections without dropping hole endpoints silently.
- `src/lib/circuitDocEdits.ts` provides immutable part/wire/value operations.
- Prior focused evidence: lesson fixture 3/3, adapters and migration 8/8, edit helpers 5/5; typecheck exit 0 for those snapshots. Re-run affected checks after integration.

This plan supersedes the unfinished Tasks 4–6 in `2026-11-11-interactive-electronics-learning-stage-a.md`; retain that file and its ledger as history.

## File Map

- Create `src/lib/circuitStorageV5.ts`: storage envelope validation, v4 migration preview, v5 read/write with explicit acceptance, no UI.
- Modify `src/lib/workspaceStorage.ts`: include the v5 key in damaged-data backup/quarantine enumeration without removing the v4 key.
- Create `tests/circuit-storage-v5.test.mjs`: v4 byte preservation, preview/no-write, accept/write, v5 precedence, malformed v5, quota failure and recovery cases.
- Modify `src/lib/circuitDocEdits.ts`: endpoint edit and wire role edit as immutable validated operations.
- Modify `tests/circuit-doc-edits.test.mjs`: valid/invalid endpoint edits and role changes.
- Create `src/components/builder/BreadboardEditor.tsx` and `.css`: 2D 400-hole view and accessible endpoint selection/wire editing.
- Create `src/components/builder/CircuitSchematicV2.tsx` and `.css`: symbol-based schematic from CircuitDocV2 and net index.
- Create `src/lib/schematicLayoutV2.ts`: deterministic symbol/terminal/wire layout, branch junctions and non-junction crossings.
- Create `tests/schematic-layout-v2.test.mjs` and `tests/circuit-schematic-v2.test.mjs`: topology/layout and accessible identity checks.
- Modify `src/lib/assemblyLayout.ts`: accept canonical V2 pin/hole endpoints for placement and wire-end calculation while preserving the V1 API.
- Modify `src/components/builder/AssemblyScene.ts` and `src/components/builder/AssemblyStage.tsx`: render/select V2 wire IDs and stable endpoints.
- Create `tests/assembly-layout-v2.test.mjs`: hole-to-world coordinate and wire endpoint tests with geometry provenance.
- Modify `src/pages/CircuitBuilderPage.tsx`: compose storage state, edit helpers and view projections; preserve existing simulation-provider checks.
- Modify `src/pages/LessonPage.tsx` and create `src/components/lesson/LessonCircuitWorkspace.tsx` / `.css`: share the LED fixture, step validation, selection and provenance.
- Read existing board inventory in `src/data/esp32DevkitModel.ts` and hotspot contract in `src/components/board/BoardViewer.tsx` / `boardSceneTypes.ts`; reuse named features rather than deriving internals from mesh appearance. Modify only if current selection identity is not exposed.
- Create `tests/lesson-circuit-workspace.test.mjs`; modify `e2e/journeys.spec.mjs` for end-to-end behaviors.
- Create `docs/agents/runs/MM-SIM-STAGE-REV2/report.md`: exact changed-file hashes, commands, viewport evidence and unsupported cases.

## Task 1: Versioned workspace storage and explicit migration preview

**Files:**
- Create: `src/lib/circuitStorageV5.ts`
- Modify: `src/lib/workspaceStorage.ts`
- Test: `tests/circuit-storage-v5.test.mjs`

**Interfaces:**
- `CircuitWorkspaceV5 = { schemaVersion: 5; circuit: CircuitDocV2; layout: Record<string, {x:number;y:number}>; boardId: string; lessonId: string; workspaceFields: Record<string, unknown>; source: {key:'machmo-builder-session'; schemaVersion:4}; updatedAt: number }`. `workspaceFields` retains code, block/analog drafts, project identity and every schema-4 extension field except `placed`, `wires`, and `schemaVersion`, which are represented by the v2 circuit and envelope.
- `readWorkspace(storage): {status:'v5'; value:CircuitWorkspaceV5} | {status:'v4'; raw:string; preview:MigrationPreview} | {status:'invalid-v5'; raw:string; reason:string} | {status:'empty'}`. If both keys exist, use a valid v5 value and retain v4 unchanged; malformed v5 is surfaced and never silently replaced by v4.
- `acceptV4Migration(storage, preview): {status:'saved'; value:CircuitWorkspaceV5} | {status:'stale-source'|'quota-error'|'invalid'; reason:string}`. It checks the exact v4 raw string has not changed since preview, validates the produced CircuitDocV2, writes only `machmo-builder-session-v5`, reads it back and validates it, and never edits/removes `machmo-builder-session`.
- `saveWorkspaceV5(storage, value)` writes only after a valid V5 envelope is supplied and returns a typed error; failed writes leave the last valid v5 value and v4 source untouched.

- [x] **Step 1: Write failing storage tests** for empty state, v4 preview with no writes, stale preview refusal, accepted migration, v5-over-v4 precedence, malformed v5, write quota exception and round-trip equality.
- [x] **Step 2: Run `node --test tests/circuit-storage-v5.test.mjs`** and confirm the missing module causes the expected failures.
- [x] **Step 3: Implement the v5 types and validator** using existing `validateCircuitDoc`; reject unknown schema versions and invalid dates/IDs/layout coordinates.
- [x] **Step 4: Implement read/preview/accept/write** with exact raw-string comparison, write/read verification and unchanged v4 bytes.
- [x] **Step 5: Include the v5 key in `workspaceStorage.ts` quarantine backups** while retaining current v4/session keys.
- [x] **Step 6: Run `node --test tests/circuit-storage-v5.test.mjs tests/draft-storage-errors.test.mjs`**; expected: all focused tests pass and original storage-error tests remain green.

## Task 2: Complete wire editing operations

**Files:**
- Modify: `src/lib/circuitDocEdits.ts`
- Test: `tests/circuit-doc-edits.test.mjs`

**Interfaces:**
- Add `editWireEndpoint(doc, wireId, end:'from'|'to', endpoint:CircuitEndpointV2)`.
- Add `setWireRole(doc, wireId, role:'power'|'ground'|'signal')`.
- Both functions return the existing `{doc, issues}` result shape; invalid edits return the original document and diagnostics. Counts remain accurate; stable wire IDs are never replaced.

- [x] **Step 1: Add tests** for moving each end from pin↔hole, selecting an invalid/occupied hole, duplicate endpoint conflict, missing wire ID, setting each role and retaining the exact original doc after refusal.
- [x] **Step 2: Run `node --test tests/circuit-doc-edits.test.mjs`** and confirm new API tests fail before implementation.
- [x] **Step 3: Implement the two pure edit functions** by cloning the target wire, validating the candidate doc and returning the original on any new error.
- [x] **Step 4: Run `node --test tests/circuit-doc-edits.test.mjs tests/circuit-doc-v2.test.mjs tests/circuit-nets-v2.test.mjs`**; require all tests to pass.

## Task 3: Interactive 2D breadboard and jumper endpoints

**Files:**
- Create: `src/components/builder/BreadboardEditor.tsx`
- Create: `src/components/builder/BreadboardEditor.css`
- Create: `tests/breadboard-editor.test.mjs`

**Interfaces:**
- Props: `{doc:CircuitDocV2; selectedWireId:string|null; pendingEndpoint:CircuitEndpointV2|null; onSelectEndpoint(endpoint):void; onSelectWire(id):void; onCommitWire(from,to,role):void; onEditWireEndpoint(id,end,endpoint):void; onSetWireRole(id,role):void; onRemoveWire(id):void}`.
- Hole button IDs are generated only through `parseHole`/`formatHole` and coordinates only through `holeToMm`; wire list names use stable part/pin IDs and hole IDs.
- Pointer/touch path: pointer down selects a start endpoint; pointer move previews; pointer up commits only when `elementFromPoint` resolves a valid endpoint button. Click/tap and keyboard use the same two-step state machine. Escape cancels without mutation.

- [x] **Step 1: Add component tests** for 400 grid holes, distinct center halves/rails, occupied-hole metadata, accessible endpoint controls, selected-wire endpoint controls and typed invalid endpoint notice.
- [x] **Step 2: Run `node --test tests/breadboard-editor.test.mjs`** and confirm the module is absent.
- [x] **Step 3: Render breadboard strips and rails** from `breadboardGrid` with explicit assumption labeling for unverified rail geometry; mark occupied leads from `occupancy`.
- [x] **Step 4: Add add/select/edit/delete wire UI** that calls only the supplied immutable edit callbacks; pointer cancellation, invalid drops and Escape must leave `doc` unchanged.
- [x] **Step 5: Add keyboard endpoint picker and selected wire list** with accessible endpoint names and focus-visible styles.
- [x] **Step 6: Run the focused component test plus `npm.cmd run typecheck`**; require no overflow at 375 px in component layout snapshots.

## Task 4: Conventional schematic projection

**Files:**
- Create: `src/lib/schematicLayoutV2.ts`
- Create: `src/components/builder/CircuitSchematicV2.tsx`
- Create: `src/components/builder/CircuitSchematicV2.css`
- Test: `tests/schematic-layout-v2.test.mjs`, `tests/circuit-schematic-v2.test.mjs`

**Interfaces:**
- `layoutSchematicV2(doc, registry)` returns `{parts:[{partId,x,y,rotation,symbolKind,terminals}], nets:[{key,segments,junctions,crossings}], diagnostics}`.
- Terminal keys remain `${partId}:${pinId}`; hole endpoints are resolved through `createNetIndexV2` and shown as breadboard/net labels, never invented pins.
- Initial supported symbol map covers board connector, resistor, LED/diode, pushbutton, power and GND. Unknown types render a labeled unsupported-symbol block and diagnostic instead of a fake conventional symbol.

- [x] **Step 1: Write layout tests** for resistor/LED/button symbol identity, board pin labels, deterministic bounds, correct net partition, one junction for three-branch net and no junction for an unrelated crossing.
- [x] **Step 2: Run `node --test tests/schematic-layout-v2.test.mjs tests/circuit-schematic-v2.test.mjs`** and confirm the missing modules cause expected failures.
- [x] **Step 3: Implement a deterministic graph layout**: board connectors on the left, signal path left-to-right, ground return lower, power rail upper, fixed symbol terminal coordinates and orthogonal routes; compute crossings/junctions from net identity.
- [x] **Step 4: Render inline symbol SVGs and net wires** with part values/reference labels, accessible selection, active-net highlighting, pan/zoom and a connection list.
- [x] **Step 5: Render hole-only endpoints as explicit breadboard connector labels**; never convert them to a fabricated component pin.
- [x] **Step 6: Run the focused tests and `npm.cmd run typecheck`**; compare SchematicV2 net partitions to `createNetIndexV2` for the canonical LED fixture.

## Task 5: Make 3D assembly consume canonical hole endpoints

**Files:**
- Modify: `src/lib/assemblyLayout.ts`
- Modify: `src/components/builder/AssemblyScene.ts`
- Modify: `src/components/builder/AssemblyStage.tsx`
- Test: `tests/assembly-layout-v2.test.mjs`

**Interfaces:**
- Preserve current `getAssemblyPlan(parts, CircuitConnection[], options)` behavior for existing callers.
- Add `getAssemblyPlanV2(doc, options)`; it uses `doc.parts`, `doc.wires`, `createNetIndexV2`, existing mount geometry and `holePoint`/rail coordinates to return wire ends keyed by original `wire.id`.
- Each wire end resolution returns coordinates plus evidence classification `cad|parametric|unknown`; unsupported endpoint geometry produces a note and no fabricated line.

- [x] **Step 1: Add tests** for each canonical wire end mapping to the exact hole/board pad, a selected wire retaining its ID, the split center and rail positions, and unknown pin anchors returning diagnostics.
- [x] **Step 2: Run `node --test tests/assembly-layout-v2.test.mjs`** and confirm missing API failures.
- [x] **Step 3: Add the V2 adapter without changing the legacy function signature**; calculate hole endpoints directly and pin endpoints from existing anchor/leg maps.
- [x] **Step 4: Pass wire ID/selection/provenance to `AssemblyScene`** and render/select only supplied wire IDs.
- [x] **Step 5: Keep board and breadboard in the existing compact assembly group**; do not fabricate CAD geometry or alter source board models.
- [x] **Step 6: Run assembly tests and `npm.cmd run typecheck`**; assert the LED fixture wire ends match its canonical endpoints.

## Task 6: Integrate storage and views in CircuitBuilderPage

**Files:**
- Modify: `src/pages/CircuitBuilderPage.tsx`
- Modify: `tests/circuit-doc-adapters.test.mjs`
- Modify: `tests/circuit-doc-edits.test.mjs`

**Interfaces:**
- Page state owns `{doc, layout, selection, migrationPreview}`. `CircuitDocV2` owns electrical changes; layout state owns canvas positions only.
- The page passes the same `doc` and selection key to `BreadboardEditor`, `CircuitSchematicV2`, `getAssemblyPlanV2`, connection list, inspector and existing supported simulation adapters.
- On a v4 workspace, show preview and explicit “Tạo bản v5” action. Before acceptance, operate read-only/in-memory; after acceptance, autosave v5 only. Never write an unrepresentable v2 topology into the v4 key or v1 export.

- [x] **Step 1: Add integration tests** proving v4 load has no writes, v5 acceptance creates only the v5 key, endpoint edit updates all view props, display move leaves net membership unchanged, and v1 export refuses hole endpoints without altering the current draft.
- [x] **Step 2: Run focused adapter/edit/storage tests** and record the initial failure for page integration.
- [x] **Step 3: Replace `placed`/`wires` mutation as the topology owner** with doc edit helpers; derive compatible pin-only projections only for legacy surfaces that explicitly support them.
- [x] **Step 4: Mount the three canonical views** and route selection by stable `{kind,key}` identities; selection in one view highlights the same item in all others.
- [x] **Step 5: Gate autosave and export** through storage capability checks; show exact unsupported wire IDs when legacy format cannot represent the document.
- [x] **Step 6: Keep simulation/provider acceptance checks unchanged** and derive simulator input only through existing lossless/supported adapters.
- [x] **Step 7: Run `npm.cmd run typecheck` and `node --test tests/circuit-doc-adapters.test.mjs tests/circuit-doc-edits.test.mjs tests/circuit-storage-v5.test.mjs tests/circuit-nets-v2.test.mjs tests/migrate-v1-v2.test.mjs`**; require all tests pass.

## Task 7: Share the canonical circuit with the LED lesson

**Files:**
- Create: `src/components/lesson/LessonCircuitWorkspace.tsx`
- Create: `src/components/lesson/LessonCircuitWorkspace.css`
- Modify: `src/pages/LessonPage.tsx`
- Read: `src/data/esp32DevkitModel.ts` (existing `features`, pinout evidence and source labels); change only if a specific missing sourced feature is identified, otherwise keep data unchanged.
- Read/modify only if needed: `src/components/board/BoardViewer.tsx`, `src/components/board/boardSceneTypes.ts` (pass existing feature IDs through selection; no mesh-derived internals).
- Test: `tests/lesson-circuit-workspace.test.mjs`

**Interfaces:**
- Props: `{doc:CircuitDocV2; selection:CircuitSelection|null; onSelect(selection):void; activeAction:LessonCircuitAction|null; boardProfileId:string}`.
- `LessonCircuitAction` maps only supported parsed code actions to exact `partId`, `pinId` and `wireId`; delays map to no circuit item.
- A wiring step stores expected endpoint/net predicates in lesson metadata; completion is recomputed from `createNetIndexV2(doc)` after every edit.
- Board subcomponent inspection consumes documented board-profile `features` and stable feature IDs. Selecting one shows role, pin/rail relations, source label, revision and evidence limits. Unknown clone internals are explicitly unknown.
- Information panels expose overview, pinout, example, sourced specifications, code and provider output; switching panels preserves circuit selection and code cursor. Mobile uses reachable tabs/stacked panels.
- Signal flow maps provider-backed supported code actions to exact `{partId,pinId,wireId}` and highlights that path in the lesson circuit and schematic. LOW/HIGH and serial lines must come from provider events; unsupported actions cause no circuit animation.

- [x] **Step 1: Write tests** for canonical IDs, wire-step incomplete/complete/re-incomplete states, shared selection, unknown geometry disclosure, “educational trace” labeling, board-feature selection and persistent panel/code selection.
- [x] **Step 2: Run the focused test** and confirm missing component behavior.
- [x] **Step 3: Implement workspace composition** using the same breadboard/schematic/3D read-only projections as the editor and keyboard-operable connection list.
- [x] **Step 4: Add overview, pinout, example, sourced-specification, code and run-output panels.** Preserve active circuit selection and code cursor when switching; use tabs/stacking at mobile width.
- [x] **Step 5: Connect existing board feature hotspots by `feature.id`** to the shared inspector; show documented role/source/evidence and highlight only the related documented pin/net. Keep unknown clone internals unknown.
- [x] **Step 6: Map supported code/provider events to exact circuit identities** and highlight code action → board pin → net/wire → destination part. Verify each displayed digital state/serial line against provider output; unsupported code produces no synthetic signal path.
- [x] **Step 7: Replace the ESP32 LED lesson assembly region only**; keep routes, lesson order, code editor, checklist and existing navigation.
- [x] **Step 8: Map code actions to existing registry pin IDs**; unsupported lines display provider limitations and highlight no synthetic circuit object.
- [x] **Step 9: Run focused lesson tests and `npm.cmd run typecheck`**.

## Task 8: End-to-end acceptance and evidence

**Files:**
- Modify: `e2e/journeys.spec.mjs`
- Create: `docs/agents/runs/MM-SIM-STAGE-REV2/report.md`

- [x] **Step 1: Add an E2E journey** that opens an accepted v4 migration preview, creates a board-pin-to-hole jumper, selects it, changes one endpoint and role, deletes it, reloads, and verifies only the remaining persisted wires.
- [x] **Step 2: Verify synchronized selection** by selecting the same wire/part in breadboard, schematic and 3D and asserting stable IDs/highlight; verify lesson wiring step toggles with topology edits.
- [x] **Step 3: Verify lesson information and signal flow:** switch overview→pinout→specs without losing code cursor/circuit selection; select a board feature and assert sourced details; step a supported event and assert its pin/net/part/state; step unsupported code and assert no circuit animation.
- [x] **Step 4: Run at 375×812 and 1440×900**; assert route actions, connection controls, information panels and inspector are reachable and `scrollWidth <= clientWidth`.
- [x] **Step 5: Verify storage preservation** by comparing v4 raw bytes before/after acceptance, reload and export refusal; v4 bytes must be identical and v5 must validate.
- [x] **Step 6: Run `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local`, and `npm.cmd run test:e2e`**; record exact exit codes and test counts. Do not report PASS for a command not run.
- [x] **Step 7: Capture browser evidence** at both viewports; if browser testing is unavailable, record `NOT_RUN` and leave visual acceptance open.
- [x] **Step 8: Write the run report** with changed-file SHA-256, tests, browser screenshots, migration/recovery behavior, geometry assumptions and all unsupported simulation cases.

## Post-Stage Rev 2 Coverage

After this LED vertical slice passes, continue with separate reviewed plans per current lesson group. Inventory `src/data/builderLessons.ts`, `src/data/lessonCircuits.ts`, component registry, mesh manifest and providers. For each lesson, prepare a canonical document and acceptance tests; do not mark a lesson supported until parts, exact values, pin/hole topology, code-flow mapping, geometry provenance and simulation provider all agree. Do not claim end-state parity until the complete lesson/support matrix in Spec §8 passes.

## Completion Gate

Rev 2 is complete only when Tasks 1–8 pass, the LED lesson and builder share a canonical document, hole-addressed wires survive reload via v5 without changing v4 source bytes, wire selection/endpoint editing is usable by pointer/touch/keyboard, schematic and 3D show the same topology, lesson-step checks follow topology, required commands have fresh evidence, and both viewports have browser evidence or an explicit `NOT_RUN` record. This gate does not claim all lessons, all component geometries, general ESP32 firmware execution, electrical simulation or physical hardware have parity with the reference sites.

## Execution Notes

- The prior local checkout may not expose a usable Git root. Do not create a worktree by copying the project or alter parent workspace files; verify the actual project root before any Git operation.
- Keep one source writer. Do not dispatch parallel implementers for shared topology/storage.
- If the implementation needs a new dependency, deletes user data, changes the approved v5 envelope, or requires another source path not listed above, stop and revise this plan before changing it.
- Do not mark geometry or electrical behavior verified from a successful build or browser rendering alone.
