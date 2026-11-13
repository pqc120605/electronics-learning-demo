# Workspace SPICE, Learning Kits, and Board Evidence Plan

> **For agentic workers:** Execute inline; Codex owns edits. Use TDD for behavior changes. Do not stage, commit, publish, or contact Claude.

**Goal:** Connect supported workspace circuits to the existing ngspice workbench, improve model/source accuracy checks, and add a privacy-safe local-first teacher/kit workflow while clearly documenting what requires physical hardware or backend policy decisions.

**Architecture:** Compile only explicit workspace wire topology and components with declared electrical equivalents into a bounded SPICE netlist; pass a validated, size-limited handoff to the existing worker. Keep PCB CAD and MCU firmware out of the analog solver unless a trustworthy electrical netlist/model exists. Add evidence-based model checks without calling CAD reference agreement physical verification. Build classroom/kit authoring on local project storage/export, without student profiles or public user content until privacy, identity, moderation, and backend policies are agreed.

**Tech Stack:** Existing React/TypeScript app, ngspice WASM worker, Node test runner, board GLB/CAD manifests, existing project bundle and local storage.

**Spec:** `../mach-mo-final-product-spec-web-app.md` sections 6.8, 6.11, 10, 12, and 15; `../mach-mo-final-feature-blueprint.md` sections D and F; current simulator boundaries in `docs/MACH-MO-MVP-STATUS.md`.

## Global Constraints

- Preserve user changes; do not stage, commit, push, or publish.
- Do not claim SPICE executes MCU firmware or that board CAD/PCB layers are automatically a simulator netlist.
- Unsupported, floating, ambiguous, or model-less circuits must fail with actionable explanations; never silently omit connected parts.
- Physical fit remains unverified without the exact board SKU/revision and a physical sample/measurements.
- Do not collect or persist student names, contact details, or performance profiles in the local-first teacher/kit slice.
- Keep the existing ngspice binary redistribution status `not-cleared`; no license conclusion may be inferred from the wrapper MIT license.

## Review Focus

- Merged wires and breadboard internal groups produce stable, deterministic nodes with one reference ground.
- Connected visual-only/MCU/GPIO parts cannot silently disappear from an exported SPICE netlist.
- Malformed handoff state and oversized routes are rejected before the worker starts.
- Model dimension comparisons distinguish model outline, whole-scene bounds, source CAD, manufacturer documentation, and physical measurements.
- Local class/kit exports cannot contain student PII or execute imported project code.

---

### Task 1: Compile supported workspace topology to an explicit SPICE netlist

**Files:**
- Create: `src/lib/workspaceSpice.ts` compiler types and mapping functions (preserve existing LDR eligibility API)
- Test: `tests/workspace-spice.test.mjs`
- Read: `src/data/componentRegistry.ts`, `src/types/circuitTopology.ts`, `src/lib/circuitNets.ts`, `src/simulation/spiceNetlist.ts`

- [x] Write failing tests for wire-net merging, breadboard buses, resistor/capacitor/diode/source mappings, exact board-supply assumptions, unsupported MCU/GPIO parts, floating inputs, invalid values, deterministic output, and bounded netlist validation.
- [x] Add dimensional checks so resistance, capacitance, and voltage values cannot be accepted with another quantity's unit.
- [x] Run the focused test and confirm failures.
- [x] Implement a pure compiler that returns either `{ok:true, netlist, assumptions, ignoredUnwiredParts}` or `{ok:false, issues}`; support only explicit passive/source equivalents.
- [x] Run focused tests and the SPICE engine smoke test.

### Task 2: Add a validated workspace handoff into the existing SPICE workbench

**Files:**
- Modify: `src/pages/CircuitBuilderPage.tsx`, `src/pages/SpiceWorkbenchPage.tsx`, `src/lib/workspaceSpice.ts`
- Test: workspace handoff parsing/storage tests and existing SPICE route tests

- [x] Add a builder action available in schematic/assembly context when the circuit compiles.
- [x] Persist a short-lived validated handoff in session storage behind an opaque id; keep URLs bounded and preserve return-to-builder navigation.
- [x] Reject serialized handoffs above the reader's 24,000-character limit before writing session storage.
- [x] Render source, supported circuit assumptions, and excluded firmware/PCB/CAD scope in the workbench.
- [x] Verify invalid/expired handoffs fall back safely and never start a worker.

### Task 3: Strengthen 3D model geometry/evidence checks

**Files:**
- Read/modify: `scripts/audit-board-models.mjs`, `scripts/board-model-audit-utils.mjs`, source manifests and `docs/board-model-accuracy-audit-2026-11-03.md`
- Test: `tests/board-model-audit.test.mjs`, `tests/data-integrity.test.mjs`

- [x] Add a source-hash-pinned independent body-dimension audit for the eight boards with exactly named STEP substrate meshes and separate GLB PCB nodes; 8/8 pass at 0.005 mm tolerance. This is a partial audit, not full coverage.
- [ ] Extract/compare PCB outline bounds for the remaining six board viewers and validate every component placement against source CAD/BOM; the assembly scene is educational and excluded from board SKU geometry.
- [ ] Compare every model to exact-revision manufacturer/EDA dimensions; only S3 DevKitC-1 and XIAO S3 have documented source-to-source measurements so far.
- [x] Review for source-backed geometry/anchor defects; none justified a change this turn. Keep explicit physical-sample limitations.
- [x] Retain structural regression checks and document exact hardware measurements still needed; physical validation remains blocked on samples.

### Task 4: Add local-first classroom and kit workflow

**Files:**
- Create: a focused teacher workspace page, typed local schema, kit/lesson pack validator, and export/import tests
- Modify: `src/App.tsx`, `src/data/productRoutes.ts`, `src/data/productFeatureRegistry.ts`, `src/components/AppWorkspaceNavigation.tsx` as required

- [x] Build a teacher planning flow for a lesson pack, kit inventory/counts, board revision, safety checklist, and printable/exportable setup sheet; add CSV and exact board revision to export.
- [x] Keep data on the current device and allow validated JSON export/import; do not create student identities or individual progress tracking.
- [x] Make “community share” produce a portable manual-share kit/lesson pack with board/source attribution, lesson capability labels, safety notes and no learner data; it does not upload or publish to an online community.
- [x] Document that live classes, accounts, public uploads/moderation, kit sales/fulfillment, and child data require backend configuration and policy decisions before release.

### Task 5: Verification and status update

- [x] Run focused tests, complete suite (332/332), typecheck, local build, board-model audit (15 scenes), STEP-to-GLB board-body geometry audit (8/8), SPICE audit/smoke test, and confirm the default production build remains blocked until exact-artifact redistribution evidence is cleared.
- [x] Update `docs/MACH-MO-MVP-STATUS.md` and the model accuracy report with implemented coverage and concrete hardware/backend blockers.
- [x] Run a scoped trailing-whitespace scan over the changed SPICE, classroom, audit, release-gate, and documentation files. `git diff --check` cannot inspect these project files because the whole project directory is untracked in its parent repository. No stage/commit was performed.

### Task 9: Import a guarded PCB net topology into a partial SPICE model

**Files:** `src/lib/kicadSpiceImport.ts`, `src/components/spice/KicadPcbSpiceImport.tsx`, `src/pages/SpiceWorkbenchPage.tsx`, `src/pages/SpiceWorkbenchPage.css`, `tests/kicad-spice-import.test.mjs`, `docs/kicad-to-spice-import.md`, README and status documentation

- [x] Parse bounded KiCad IPC-D-356 pad records and match R/C/L/V pad numbers and net-equivalence groups against a separate Eeschema XML export.
- [x] Reject missing/extra passive pins and mismatched net topology; require visible, explicit exclusion for non-supported board devices.
- [x] Reject invalid physical quantity units; normalize standard engineering prefixes (including uppercase `M` as mega) before compiling SPICE values.
- [x] Allow only an explicitly declared ideal test source (0.01–60 V) when no source V is present; never infer a board supply from a net label.
- [x] Add a local-only file UI with preview, assumptions, explicit exclusion controls and apply action.
- [x] Export a real ESP32 DevKit source PCB/schematic through KiCad CLI 10.0.7; verify import stops for 12 unsupported references, then succeeds only after explicit exclusions and a 5 V test-source declaration.
- [x] Verify focused KiCad tests (11/11), full suite (324/324), typecheck, board-model audit and SPICE engine audit at the importer milestone.
- [ ] Keep exact ngspice WASM redistribution provenance unresolved and public-release build fail-closed; this task does not clear licensing.
- [ ] Physical board geometry/pin/function confirmation still requires exact revision samples and measurements.

### Task 10: Audit complete schematic connectivity against PCB IPC-D-356

**Files:** `src/lib/kicadSpiceImport.ts`, `src/components/spice/KicadPcbSpiceImport.tsx`, `src/pages/SpiceWorkbenchPage.css`, `tests/kicad-spice-import.test.mjs`, `docs/kicad-to-spice-import.md`, README and status documentation

- [x] Compare all connected schematic pins with PCB pads by reference/pin and net equivalence, independent of net-label spelling.
- [x] Parse component pad records 317/327, ignore via records, account for schematic no-connect markers, and report missing/extra pins, split/merged net groups, PCB-only references, and NC pads sharing a PCB net.
- [x] Run the comparator on KiCad 10.0.7 exports from the ESP32 DevKit reference clone source project: 118/118 connected pins matched; 27 schematic NC pads matched without sharing a PCB net.
- [x] Keep the general connectivity audit separate from the limited SPICE compiler, which still requires explicit exclusion of 12 unsupported references for this design.
- [x] Verify focused KiCad tests (16/16), full suite (332/332), typecheck, internal build, board-model audit (15 scenes), isolated board geometry audit (8/8) and SPICE runtime smoke audit.
- [x] Update the release status to retain fail-closed public distribution until exact ngspice WASM provenance and obligations are cleared.

### Task 6: Expose workspace wire nets and keep PCB/SPICE domains explicit

**Files:** `src/lib/circuitNets.ts`, `src/components/builder/SchematicView.tsx`, `src/pages/CircuitBuilderPage.tsx`, `src/components/pcb/Pcb2DViewer.tsx`, `src/styles/app.css`

- [x] Add deterministic net groups from explicit workspace wires and an accessible schematic net explorer.
- [x] Selecting a net highlights its full wire group in the schematic and assembly views.
- [x] State that workspace topology does not become board copper; keep CAD net selection/mapping independent and validated.
- [x] Add regression tests for stable groups, endpoint membership, accessible display and simulation boundary.

### Task 7: Make board references and supported AVR targets inspectable

**Files:** `src/components/board/BoardProfile.tsx`, `src/data/boards.ts`, `src/lib/firmwareTarget.ts`, `src/pages/FirmwareHexToolPage.tsx`, `docs/board-model-sourcing.md`, status and README

- [x] Show each board’s existing source/document links in its profile and keep external evidence distinct from physical verification.
- [x] Support explicit ATmega328P target selection for Uno R3 and Nano classic with official board reference links; require user confirmation because HEX does not encode its MCU target.
- [x] Keep ESP32, RP2040 and STM32 targets rejected until real execution backends exist.
- [ ] Close upstream ngspice/WASM redistribution provenance; current build gate blocks public release.
- [ ] Validate board geometry against exact physical SKUs/revisions; this remains pending samples and measurements.
- [ ] Test live classroom/community/backend capabilities; the current kit pack remains local-first/manual share.

### Task 8: Add separately attributed community reference photos for selected boards

**Files:** `src/data/boards.ts`, `tests/board-catalog.test.mjs`, `docs/reference-image-attribution.md`, `docs/board-model-accuracy-audit-2026-11-03.md`, `docs/MACH-MO-MVP-STATUS.md`

- [x] Add separately attributed photos for Uno R3, Nano classic, Mega 2560 R3, Pico 2 (front and labeled underside), Pico W, UNO R4 WiFi, and UNO R4 Minima.
- [x] Put creator, source, license, changes, and explicit variant/fitment limitations beside each photo.
- [x] Keep image evidence separate from CAD geometry, BOM, pinout, and physical verification claims.
- [x] Open and inspect Commons pages; confirm creator/license/variant; verify downloaded image hashes for original files when provided by Commons.
- [x] Run board catalog regression, full project tests (318/318), typecheck, local build, board-model audit (15 scenes), SPICE audit, and HTTP asset/route spot-check (six new routes/assets returned HTTP 200).
