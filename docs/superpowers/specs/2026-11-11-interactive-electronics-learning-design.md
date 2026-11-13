# Mạch Mở interactive electronics experience

**Status:** Draft for founder review  
**Date:** 2026-11-11  
**Scope:** Product and technical design; no implementation approval is implied by this document.

## 1. Goal

Bring Mạch Mở's electronics lessons and workbench to a coherent interactive depth comparable in workflow quality to Learn Arduino and Learn ESP, while keeping Mạch Mở's Vietnamese curriculum, local-first behavior, engineering evidence and existing route flow.

“Comparable” means learners can move through a lesson, inspect a board and its pins, see the exact associated components and wiring, relate code steps to circuit objects, edit a circuit, and observe an accurately labeled simulation result. It does not mean copying competitor assets, code, copy, curriculum or visual files, or claiming electrical behavior that the selected model/provider does not calculate.

## 2. User and design principles

- Primary learner: a beginner learning electronics and firmware in Vietnamese.
- Keep current navigation, route destinations, lesson sequence and guest/local-first behavior unless a later approved task explicitly changes them.
- Use a warm paper/cream workspace, fine circuit-grid texture, dark navy type, restrained red/cyan accents, readable component callouts and clear selected/active states. PCB and component materials retain their material colors.
- Put the circuit, its inspection details and the current learning/code step in one responsive workspace. Desktop may show scene and inspector side by side; narrow screens use stacked panels without hiding the circuit's next action.
- Keep keyboard/list controls equivalent to canvas interactions. Reduced-motion and visible focus states are required.
- Separate educational logic traces, supported firmware execution, analog solver output and physical measurement. Never label one as another.
- Show whether pin positions and part geometry are CAD-backed, parametric or unknown. Unknown physical geometry must not look verified.

## 3. Research basis

Direct page inspection on 2026-11-11:

- Learn Arduino presents a 16-lesson interactive 3D course; the page exposes Overview, Pinout, Example and Specifications views, a code/run area and serial monitor. Reference: <https://learn-arduino-red.vercel.app/fr/>.
- Learn ESP presents a 20-lesson interactive 3D course with the same board-information tabs and code/serial workflow. Inspection of its two-LED lesson showed a board, breadboard, LEDs, resistors and jumper leads in one scene, with the lesson and code workspace around it. Reference: <https://learn-esp32.vercel.app/>.
- Adapt the interaction patterns only. Do not copy their assets, source, text, styles or lesson content.

## 4. Current-state findings

- `src/pages/LessonPage.tsx` renders the lesson's board/assembly through `BoardViewer`; the ESP32 LED assembly is a static GLB with named hotspots. Program steps highlight feature groups, but the assembly is not generated from the user's editable circuit graph.
- `src/pages/CircuitBuilderPage.tsx` owns a separate legacy `placed` + `wires` state, with schema-4 workspace persistence. Its schematic, 2D builder, 3D assembly and SPICE handoff consume this legacy state.
- `src/lib/circuitDocV2.ts`, `src/lib/circuitNetsV2.ts`, `src/lib/breadboardGrid.ts`, `src/lib/mountResolve.ts` and `src/lib/layout2D.ts` provide a newer circuit document/topology foundation. `src/lib/compileSpiceConnections.ts` and `src/lib/migrateV1toV2.ts` already consume it, but the lesson page and main workbench do not yet use one shared v2 document as their live circuit state.
- `src/components/builder/AssemblyStage.tsx` and `src/lib/assemblyLayout.ts` create a dynamic 3D assembly for the workbench. Placement and wire ends use available geometry and pin anchors; some geometry remains illustrative and some parts may not have verified lead/pin data.
- Simulation methods are separate by capability: educational logic/subset traces, AVR firmware on supported targets, and analog SPICE for supported models. These must stay distinct in UI and output provenance.

This split between static lesson scene and editable workbench is the primary reason the lesson can appear complete while changes to wires, parts or code are not reflected everywhere.

## 5. Product behavior

### 5.1 Lesson workspace

For a supported lesson, show:

1. The current activity step and a short explanation of the circuit change or code action.
2. An interactive 3D scene containing the selected board, breadboard where applicable, the lesson's actual part set and its jumper connections.
3. Selectable board/component/pin/wire targets. Selecting a target updates a single inspector with role, pin names, connected endpoints, value, model/provenance and support limitations.
4. A circuit/schematic view and a readable connection list that use the same stable `partId`/`pinId` topology as the 3D scene.
5. Code steps that highlight the relevant pin, component and wire/net in every visible circuit view. When the code changes, the displayed trace must either update from the supported parser/provider or show the exact unsupported line/reason.
6. Run, step, pause/stop and reset controls only for the supported simulation provider. A pre-scripted visual blink remains labeled an educational illustration and cannot be described as an electrical solve or ESP32 firmware execution.
7. The correct associated components and values for that lesson, with unknown values left unknown rather than inferred from a component family.
8. An information-rich learning workspace with overview, pinout, example and sourced-specification panels alongside the active lesson, circuit and code. Panel changes preserve the current circuit selection and code position; on narrow screens these panels remain reachable through stacked sections or tabs.
9. Signal-flow feedback while a supported provider runs or steps: identify the code action, source pin, affected net/wire and destination component in sequence. Show LOW/HIGH only when supplied by the active provider; never animate an invented path for unsupported code.
10. Selectable documented board subcomponents (such as the MCU module, USB connector, regulator, USB-serial bridge, buttons or LEDs) with an inspector for role, pin/rail relations, source/revision and evidence status. Unknown clone internals remain marked unknown rather than inferred from a board-family label.

Changing the board, circuit selection or view must preserve stable part/pin identities. If a board profile cannot support the lesson, retain the existing lesson and clearly show that the selected board is reference-only or unsupported.

### 5.2 Workbench

- The electrical graph is the single source of truth for part identities, pin identities, wire endpoints, breadboard holes/rails and net membership.
- 2D schematic, breadboard/assembly view, 3D assembly, connection list, diagnostics, code trace and SPICE export are projections/adapters of that graph. Each view may have its own layout; moving a part in one view does not change connectivity unless the user edits an endpoint or breadboard mount.
- Wires visibly terminate at the correct board pad or component pin. Breadboard-mounted leads and jumper endpoints use explicit holes/strips from the canonical grid model. Routing may be simplified for an educational view, but the endpoints/topology cannot be fabricated from percentages or arbitrary screen offsets.
- Keep signal, positive supply and ground colors distinct, with labels and a legend so color is not the only cue. Selected/active flow should be visually stronger than inactive wires; preset wiring and live code trace must be distinguishable.
- Component library entries expose exact identity, pin list, value/unit where known, electrical/geometry support, sources/revision and explicit missing data. Geometry without a verified model is visibly marked as illustrative.
- Unsupported mounts, pin endpoints, electrical checks or SPICE models produce typed diagnostics linked to the affected object; they do not silently fall back to a misleading simulation.
- Board subcomponents are a sourced inventory attached to a board profile, not inferred from the appearance of a 3D mesh or treated as user-added circuit parts.

### 5.3 Simulation truth and provenance

- Educational scenario output is labeled `Luồng logic minh họa` or the specific supported behavior; it does not report voltage/current.
- Firmware execution is labeled with exact target/provider and only runs for supported boards/firmware. ESP32 subset parsing is not represented as a complete ESP32 runtime.
- Analog results are shown only when netlist compilation and model binding succeed. Keep solver/provider, model/source, analysis type, units, run status, warnings and failures attached to the result. Existing SPICE public-release gates remain unchanged.
- Physical measurements remain a separate evidence type and are never generated by a simulation animation.
- Signal-flow playback is derived from provider events mapped to stable circuit IDs. Logic-only output may show a logic trace, not analog current/voltage; firmware output may show only events actually reported by its supported runtime.

## 6. Data and migration design

- Use `CircuitDocV2` for canonical live electrical topology in the first integrated slice. Continue using stable part and pin IDs.
- Keep visual layout state separate from topology. Preserve schema-4 workspace fields and version-1 project bundles until a separately reviewed migration proves round-trip compatibility. Do not silently rewrite, delete, reset or canonicalize existing drafts.
- For a legacy workspace, provide a non-destructive adapter or explicit migration preview with loss/warning report and recovery path. V1 source bytes remain recoverable; do not auto-write a V2 storage key over existing data.
- The initial ESP32 LED sample must encode the board, resistor, LED, breadboard/mounts and wiring once. Derived views and code-flow highlighting consume that same sample document. Its board/clone pin profile and component values retain their current provenance and limitations.
- Do not add dependencies, cloud services, accounts, telemetry, remote builds or hardware/device operations as part of this design.

## 7. Delivery stages

### Stage A — one coherent ESP32 LED vertical slice

Integrate the existing v2 topology foundation into the lesson and workbench path for the LED lesson. Make the same document drive the connection list, schematic, dynamic assembly, selected-object inspector and code-step highlights. Keep the current route and stored-draft format; do not expand solver claims.

### Stage B — component, geometry and wiring coverage

Audit every component used by the current builder lessons. For each component, record symbol/pins, pin coordinates, legs/footprint geometry, 3D model source and simulation support. Improve breadboard mounting and jumper routing only where the data supports it; clearly mark remaining illustrative geometry. Migrate the applicable existing lessons without changing their curriculum order.

### Stage C — simulation and observation coverage

Publish a support matrix by target × lesson × provider × component. Connect analog circuits to SPICE where model coverage is valid; connect firmware to supported runtime targets; improve serial/waveform/instrument displays only where generated by that provider. Add lessons/features in dependency order and keep unsupported cases explicit.

### Stage D — parity review across supported lessons

Run the acceptance matrix below over the lesson/catalog inventory at desktop and narrow widths. A lesson counts as supported only when its board, part set, wiring, code flow and simulation label agree. Incomplete lessons stay visible with precise capability limits rather than being marked complete.

Each stage is its own executable task/plan and evidence snapshot. Stage A must be accepted before Stage B is planned in detail; the later stages may be reprioritized from what Stage A uncovers.

## 8. Acceptance criteria

### Stage A acceptance

- The ESP32 LED lesson has one canonical circuit document used by its lesson scene and workbench adapters; tests prove matching part IDs, pin IDs, wire endpoints and net groups across the connection list, schematic and assembly plan.
- The 3D assembly shows the board, breadboard, resistor, LED and each jumper wire at the endpoints specified by the document. A selected wire/pin/component highlights the same identity in the schematic/inspector; playing a code step highlights only objects associated with that action.
- Component and pin information states source/clone scope and whether geometry is CAD-backed, parametric or unknown.
- Changing selection/view does not alter circuit topology. Editing the graph updates all derived views. Existing schema-4 saved drafts and version-1 project bundles remain readable and recoverable; no migration writes occur without preview/acceptance.
- A logic trace is clearly not labeled as a voltage/current solution or ESP32 firmware execution. SPICE handoff is enabled only when the existing support checks accept the same graph.
- Preserve navigation and lesson order. At 375 px and 1440 px, the scene, next action, component inspector and simulation state remain usable, with no horizontal page overflow. Keyboard/list interaction can perform the same selection and view-switch actions as the canvas.
- `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local` and relevant e2e checks pass for the snapshot. Browser visual evidence is recorded for the stage in both viewports; unavailable browser testing is `NOT_RUN`, never PASS.

### End-state parity acceptance

- Every current lesson is inventoried as supported, partially supported or unsupported across circuit assembly, pinout/component inspection, code-to-circuit flow and simulation provider. Each unsupported cell has a user-visible reason.
- For all lessons called supported, pin/wire/component identity is consistent across the 3D scene, schematic and list; circuit edits do not desynchronize views; code-flow highlights correspond to the action; provider output labels and units match actual evidence.
- Every modeled component used in those lessons has a documented geometry/pin-source classification and simulation-model status. No unsupported physical/electrical behavior is silently displayed as verified.
- Desktop/mobile visual review confirms the shared warm visual language and same interaction model without copying competitor assets or content.
- User drafts and project bundles survive upgrade/import/export round-trips with no unreported loss.

## 9. Out of scope

- Exact lesson-count parity with the reference sites, copied course text/assets/source/CSS, or claims of competitor feature equivalence beyond the acceptance matrix.
- Full MCU emulation for targets not already supported, general-purpose SPICE models for every library part, real device flashing, Web Serial, cloud simulation, multiplayer/classroom services, or remote project storage.
- Manufacturing/PCB release, hardware configuration approval, purchases, measurements or physical safety validation.
- Schema changes or destructive migrations without a separate reviewed proposal.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| V2 document cannot represent every legacy layout/detail | Keep topology and layout separate; test adapters and report loss before migrating any stored data. |
| Missing component pin/lead geometry makes the scene look physically exact | Mark the geometry source; use a non-deceptive fallback and do not claim correct insertion/physical fit. |
| Lesson logic trace appears to be electrical simulation | Keep provider badge, units and limits visible at the point of result; reject voltage/current claims without solver output. |
| Board clone differs from the lesson profile | Bind lesson to the exact board profile/revision and show reference-only warning on other targets. |
| Large scope stalls after visual polish | Gate completion on Stage A and the end-state parity matrix, not CSS/build alone. |
| Local data is lost during the shared-model transition | No automatic schema rewrite; preserve original storage, previews, backups and round-trip tests. |

## 11. Decision requested

This original request was for the first Stage A plan. Revision 2 below supersedes it for the wiring/schematic architecture and adds a founder review gate for persistent hole-addressed editing. The existing Stage A plan remains the active implementation record until a reviewed revision is approved.

---

## 12. Revision 2 — breadboard wiring and conventional schematic

**Status:** Founder-approved design, 2026-11-12. This revision records the approved product direction and versioned-storage boundary; approval does not mean any existing data has been migrated.

### 12.1 User problem confirmed by the current implementation

- The current workbench wire gesture starts and ends only on `[data-wire-endpoint]` component pins. A learner cannot choose an individual breadboard hole as the endpoint of a jumper.
- The 3D renderer derives wire endpoints from part pins and auto-placement. The rendered wire is therefore not an editable, hole-addressed physical jumper.
- The schematic has some individual teaching symbols, but places part cards by canvas percentages and draws a midpoint-routed pin graph. The whole view does not express a conventional schematic net with explicit labels, supply/ground symbols and junction behavior.
- `CircuitDocV2` and `createNetIndexV2` already express pin and hole endpoints, breadboard strips and stable nets. They are not yet the live source used by the workbench and lessons.
- Workspace schema 4 is pin-only. `docToLegacyWorkspace` deliberately refuses hole-addressed wires rather than silently discarding them. A persistent hole-level editor therefore needs an explicitly versioned storage design before it can promise reload-safe editing.

### 12.2 Approved experience direction

The approved direction is one editable circuit presented through coordinated views, with beginner-appropriate interactions and truthful limits. “Like Learn Arduino and Learn ESP” is the quality/workflow reference; it does not authorize copying their assets, source, text, styles, branding or curriculum.

1. **Breadboard assembly view:** Show a readable board, actual modeled hole positions, the center trench and distinct power rails. Parts with supported lead geometry occupy holes. Jumpers terminate at the selected pin or hole, not at screen offsets. Unknown physical geometry is visibly marked illustrative.
2. **Wire interaction:** A learner can start on a component pin or breadboard hole, preview a connection, and finish on a valid pin/hole. The learner can select a wire, inspect both endpoints, move either endpoint, change its category/color, or remove it. Keyboard and touch provide equivalent endpoint selection/edit/remove actions. Failed placement shows a typed reason and does not mutate the circuit.
3. **Conventional teaching schematic:** Use recognizable circuit symbols and reference/value labels, explicit board-pin labels, power/GND symbols, orthogonal connections and junction dots where nets branch. Crossings without a junction remain visually distinct. Selection and net highlighting map to the same stable IDs as the breadboard view. It is a teaching schematic, not a claim of KiCad/ERC or production readiness.
4. **3D assembly:** Board, breadboard and mounted parts form one compact assembly; every displayed jumper is derived from the same endpoint IDs and net model as the 2D view. If a board/part anchor is illustrative or unavailable, disclose that and do not imply physical fit.
5. **Lessons:** The lesson and workbench use the same canonical circuit document. A guided connection step names the start and target pin/hole; completion checks the resulting topology rather than accepting an animation or a merely present wire. Code-flow highlighting, inspector, connection list, schematic and assembly resolve the same selected identity.
6. **Electrical truth:** A completed physical topology is not itself proof of current, voltage, firmware execution or hardware behavior. Each result retains its existing provider/support label.
7. **Information-rich learning screen:** Keep overview, pinout, example, sourced specifications, code and supported run output available without losing circuit state or current code position.
8. **Signal-flow visualization:** Show the exact supported code action → board pin → net/wire → destination part and provider-reported digital state; unsupported actions show no synthetic flow.
9. **Board subcomponent inspection:** Allow selection of documented onboard components and inspect their role, relations and evidence provenance; do not infer unlisted clone internals.

### 12.3 Architecture and data boundaries

- `CircuitDocV2` is the proposed canonical topology for the integrated editor: parts, stable pin IDs, hole endpoints, explicit wire IDs/roles and breadboard connectivity.
- Presentation layout is separate from electrical topology. Schematic symbol positions, 2D canvas positions and 3D transforms may differ, but endpoint identity and net membership may not.
- The existing registry/geometry provenance remains authoritative for what can be mounted. A component without supported `legsMm` cannot be silently placed into a breadboard hole.
- The current assumed rail-hole model remains labeled unverified until matched to a sourced board specification or an explicitly accepted reference model.
- No existing schema-4 workspace or project bundle may be overwritten or silently migrated. Existing source bytes remain recoverable.
- **Storage decision:** Founder approved a versioned persistence envelope and non-destructive schema-4 migration/recovery path on 2026-11-11. The implementation plan uses a separate `machmo-builder-session-v5` key, writes only after a migration preview is accepted, reads v5 first when present, and leaves the original schema-4 bytes untouched. The legacy v1 portable-project format remains unchanged; export of a hole-addressed document that v1 cannot represent must fail with a recoverable explanation.

### 12.4 Delivery slices

- **A — shared LED circuit:** Finish the in-progress Stage A contract and integrate one canonical LED lesson document across workbench projections. Include exact existing legacy-data preservation.
- **B — hole-addressed editing:** Add endpoint picking for pins and individual breadboard holes; selection, endpoint editing, color/category, removal, keyboard/touch path, typed connectivity diagnostics and topology tests. Persistent edits use the approved v5 storage path and migration preview.
- **C — schematic projection:** Replace card-like topology presentation with a teaching-grade schematic layout from the same net graph, including symbols, labels, power/GND, branches, crossings and junctions; verify selection/highlight correspondence.
- **D — physical assembly projection:** Map canonical mounts and wire endpoints to the 3D board/breadboard scene; verify that displayed wires end at the modeled holes/pads and surface unknown geometry.
- **E — lesson coverage:** Migrate the supported lessons one by one, with each marked supported only after circuit, pinout, code-flow and simulation/provider checks pass. Keep incomplete cases visibly partial/unsupported.

Each slice receives a bounded file map and acceptance report after this design is accepted. Stages B–E do not inherit permission to bump storage schemas, add dependencies, change simulation providers or make physical/hardware claims.

### 12.5 Acceptance criteria for B–D

- A user can make a jumper from a board pin to a specific breadboard hole, from hole to hole, and from hole to a supported part pin; the canonical topology/net index agrees with the rendered endpoints and survives reload through v5 storage.
- A user can select an existing wire from either view, see its exact endpoints, move an endpoint to a valid target, change its role/color, and delete it. Invalid endpoint edits leave the previous wire intact.
- The lesson view exposes overview, pinout, example and sourced specifications without losing circuit selection/code position; responsive layout keeps the next action and circuit reachable on narrow screens.
- Selecting a documented board subcomponent opens sourced role/connection/evidence details and highlights its related board pin/net. Unknown clone internals remain explicitly unknown.
- A supported run/step highlights code action → source pin → net/wire → destination part. Digital state and serial output match provider events; unsupported lines do not animate synthetic behavior.
- Pointer, touch and keyboard flows can perform the same wire actions; visible focus, accessible names and a non-canvas endpoint list are present.
- Breadboard-hole rendering and strip membership follow `breadboardGrid`/`createNetIndexV2`; tests cover the center split, rails, occupied holes and invalid/unsupported geometry. Unverified rail details remain identified as assumptions.
- Schematic symbols and electrical connections are projections of the same graph. Tests cover R/LED/button symbols, supply and ground labels, branch junctions, non-junction crossings, and identity-preserving selection/highlighting.
- The 3D plan and scene derive wire ends from exact circuit endpoints. It does not create a wire where no wire exists or claim geometry is physical when its source is illustrative/unknown.
- The lesson marks a wiring step complete only when its expected endpoint/net condition is true; deleting or moving the wire makes the step incomplete again.
- At 375 px and 1440 px, the circuit view, connection editing controls, inspector and next lesson action remain reachable without horizontal page overflow.
- Existing schema-4 workspaces and v1 bundles round-trip without mutation or loss. The v5 storage path has migration-preview, backup/recovery, round-trip and reload tests; schema-4 source bytes remain unchanged after migration.
- E2E proves wire creation, selection, endpoint edit, deletion, lesson-step validation and synchronized highlighting across breadboard, schematic and 3D for the supported fixture. Checks distinguish NOT_RUN from PASS.

### 12.6 Explicit non-goals

- Pixel-for-pixel or content copying from reference sites.
- Claiming an electrical schematic is ERC-clean, manufacturing-ready or physically measured.
- Unverified physical dimensions, automatic guesses for missing component pin/lead data, or treating illustrative geometry as CAD-backed.
- Silent schema changes, lossy autosave, deletion of existing drafts, cloud storage or required account creation.
- General MCU emulation, analog solver support for every part, real-device flashing or physical safety validation.

### 12.7 Founder review status

Founder approved the Rev 2 experience and versioned-storage direction on 2026-11-12. Approval does not imply that existing data has been migrated, that a circuit is electrically validated, or that unverified geometry is physical evidence.
