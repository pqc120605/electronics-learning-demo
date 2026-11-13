# Board Library and Code Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add validated ESP32-S3 and STM32 NUCLEO-F401RE models, board discovery and sourced pin learning, plus synchronized beginner blocks, editable C++ practice, and a code-to-circuit visual walkthrough.

**Architecture:** Keep source board data and licensed CAD in revision-specific asset folders, with board manifests feeding the existing generic BoardViewer. Add catalogue filtering/comparison and sourced board data without embedding hardware facts in renderer conditionals. Model the LED lesson as a constrained intermediate representation shared by Blockly generation, supported-subset C++ parsing, explanations, and the conceptual visual-flow player.

**Tech Stack:** React 19, TypeScript, Vite, existing custom GLB viewer and KiCad CLI; Blockly with Mạch Mở custom blocks and Arduino C++ generator; browser-local editable code state.

**Spec:** `docs/superpowers/specs/2026-10-29-board-library-and-learning-features-design.md`

## Global Constraints

- Target board models are ESP32-S3-DevKitC-1 PCB V1.1 and MB1136 / NUCLEO-F401RE C04.
- ESP32-C3-DevKitM-1 and STM32F103C8T6 Blue Pill remain preview-only.
- Never distribute source-derived GLBs until the exact source package terms permit it and attribution is recorded.
- Keep board-specific pin/component data in manifests, not viewer renderer conditionals.
- The first block language supports only the introductory ESP32 LED program; it is not general-purpose coding or a firmware simulator.
- Code-to-flow supports only the documented subset; unsupported C++ remains intact and flow is disabled with an explanation.
- Do not add or run automated tests in this pass. Use production build and manual browser/asset checks only.

## Review Focus

- CAD revision mismatch: compare exact S3 V1.1 and NUCLEO C04 sources before making a model interactive.
- License ambiguity: source downloads can be inspected locally, but generated assets stay out of the distributed public model directory until redistribution rights are recorded.
- Board pin aliases: expose only mappings verified by the exact board guide/schematic; never reuse ESP32 code as Arduino/STM32 code.
- Text parser ambiguity: recognize a narrow grammar, preserve learner edits, and refuse to animate unsupported statements rather than skipping them.
- Flow mismatch: generate C++ and visualization actions from a shared IR; show the active statement, output pin and LED/circuit state together.

---

### Task 1: Acquire official board source packages and record provenance

**Files:**
- Create: `assets/boards/vendor/esp32-s3-devkitc-1/source/`
- Create: `assets/boards/vendor/esp32-s3-devkitc-1/SOURCE.md`
- Create: `assets/boards/vendor/nucleo-f401re/source/`
- Create: `assets/boards/vendor/nucleo-f401re/SOURCE.md`
- Modify: `docs/superpowers/specs/2026-10-29-board-library-and-learning-features-design.md` only if the source review changes the approved target/revision assumptions.

- [ ] Download the ESP32-S3-DevKitC-1 V1.1 reference-design ZIP from Espressif's official development-board downloads page and save the unchanged archive under the S3 `source/` directory.
- [ ] Download ST's MB1136 Board design project files v1.1, the C04 schematic pack and MB1136 BOM from the official NUCLEO-F401RE product page; save unchanged archives under the NUCLEO `source/` directory.
- [ ] Compute SHA-256 for each source archive with `Get-FileHash -Algorithm SHA256 <archive-path>` and record the official download page, retrieved date, archive filename/hash, board revision, contained source formats and license/attribution findings in each `SOURCE.md`.
- [ ] Read the linked Espressif reference-design terms and ST Open Reference Material License Agreement/Evaluation Board Terms of Use. Record whether derived GLB redistribution is allowed; if unclear or prohibited, keep generated outputs outside `public/models/` and keep the board preview-only.
- [ ] Extract copies, not the retained originals, to an adjacent `work/` directory and list all PCB/schematic/BOM/placement/3D model files. Confirm S3 V1.1 and NUCLEO C04 against the file title/revision and source board markings.

**Completion evidence:** Two provenance records with hashes and license decisions; otherwise the affected board remains preview-only and the limitation is carried forward explicitly.

### Task 2: Convert and validate the S3 and NUCLEO reference CAD

**Files:**
- Create: `assets/boards/vendor/esp32-s3-devkitc-1/build/`
- Create: `assets/boards/vendor/nucleo-f401re/build/`
- Create: `assets/boards/vendor/esp32-s3-devkitc-1/README.md`
- Create: `assets/boards/vendor/nucleo-f401re/README.md`
- Create: `public/models/esp32-s3-devkitc-1.glb` only after rights clearance and validation.
- Create: `public/models/nucleo-f401re-c04.glb` only after rights clearance and validation.

- [ ] For each source package, identify the native PCB data and confirm whether KiCad CLI can open/export it. Preserve originals; use the established local KiCad toolchain and inspect exact import warnings before accepting converted geometry.
- [ ] Normalize board origin, units and orientation using source placement/outline data; preserve manufacturer designators and known package assignments. Use STEP/VRML models from the source package when present; do not replace missing packages with visually similar parts.
- [ ] Export one candidate GLB per target board and capture a node-name/part-count inventory. Compare outline dimensions and component locations/counts with the official fabrication/placement/BOM data and record any omitted package.
- [ ] Inspect each candidate model in the local application viewer at top/front/rotated angles. Check header rows, USB connector, MCU/module, power, buttons and status LEDs against official board images and schematic references.
- [ ] If any source format cannot be converted accurately, document the exact blocker and keep the board preview-only; do not fabricate geometry or mark the target complete.
- [ ] Move the GLB into `public/models/` only when both the technical validation and the Task 1 redistribution decision permit publication; set a version/hash in the matching manifest.

### Task 3: Add board manifests and sourced pin/component explanations

**Files:**
- Create: `src/data/esp32S3DevkitcModel.ts`
- Create: `src/data/nucleoF401reModel.ts`
- Modify: `src/components/board/boardSceneTypes.ts`
- Modify: `src/data/boards.ts`
- Modify: `src/pages/LessonPage.tsx`
- Modify: `src/components/board/PinFlowExplorer.tsx`
- Modify: `src/components/ComponentDetails.tsx`
- Modify: `src/styles/app.css`

- [ ] Create each manifest with exact board ID, revision/variant, model status, asset URL/version, source links, feature designators, physical header ordering and verified pin functions.
- [ ] Populate S3 and NUCLEO component details from BOM/schematic/user guide. Include designator, part/package where proven, purpose, electrical connections and evidence links. Mark placement rationales as engineering inference unless a source explicitly states the design intent.
- [ ] Add manifest fields for source package hash and license/attribution status. Do not make manifests point to nonexistent GLBs; when a board fails Task 2's gate, expose it as a preview record with no interactive model.
- [ ] Extend the existing board picker to open the validated S3/NUCLEO manifests while keeping the ESP32 LED wiring/code lesson scoped to ESP32. Show a warning when the user inspects a different target board.
- [ ] Populate board-specific pin maps from the exact official guide/schematic and enable physical pin highlighting only when CAD anchors are validated. If anchors are unavailable, use the current list/reference mode with an explicit caveat.
- [ ] Add source/revision links and accessible keyboard/touch selection to all pin and component detail states.

### Task 4: Improve board discovery and comparison

**Files:**
- Create: `src/components/BoardCatalog.tsx`
- Create: `src/components/BoardComparison.tsx`
- Modify: `src/pages/ExplorePage.tsx`
- Modify: `src/data/boards.ts`
- Modify: `src/styles/app.css`

- [ ] Replace the fixed list rendering with a searchable catalogue filtered by ESP, STM32 or Arduino family; search board model and MCU text case-insensitively.
- [ ] Show model status, exact revision/variant, MCU, source link and missing-data explanation on each card. Link only validated interactive models to their explorer; previews remain informational.
- [ ] Add a comparison panel for available boards with sourced MCU family, logic level, connectivity and verified ADC/PWM/UART/I²C/SPI capability. Do not compare pin numbers as interchangeable.
- [ ] Check empty search results, reset-filter control, narrow mobile layout and status labeling visually in the browser.

### Task 5: Define the block language, shared IR and generated C++

**Files:**
- Create: `src/components/lesson/BlockCodeWorkspace.tsx`
- Create: `src/components/lesson/ProgramHelp.tsx`
- Create: `src/data/esp32LedProgram.ts`
- Create: `src/lib/lessonProgramIr.ts`
- Create: `src/lib/blocklyArduinoGenerator.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/styles/app.css`

- [ ] Add Blockly as the visual block workspace dependency; use the documented package entry point compatible with this Vite/React setup and keep the editor lazy-loaded so the board landing page does not pay its bundle cost before the lesson is opened.
- [ ] Define a typed IR for the LED lesson with GPIO declaration, setup/output-mode, forever loop, HIGH/LOW write and delay operations. Put safe board/pin constraints and Vietnamese explanations in typed block metadata.
- [ ] Define the custom Blockly blocks and toolbox categories in Vietnamese: Bắt đầu, Chân GPIO, Điều khiển LED, Chờ. Provide accessible labels and a starter workspace that reproduces the current lesson sketch.
- [ ] Implement a custom deterministic C++ generator for the supported IR and show generated code in a read-only preview while the learner is in block mode. Keep current copy functionality.
- [ ] Add concise help and expandable “Vì sao dùng khối này?” content linked to the pin, LED/resistor and lesson objectives. Add a dismissible/reopenable first-use guide and a reset-to-example control.
- [ ] Confirm block changes alter only valid IR/code structures; unsupported board pins or block combinations show a plain-language correction and cannot start the flow.

### Task 6: Add editable C++ practice and safe code-to-flow parsing

**Files:**
- Create: `src/components/lesson/CppPracticeEditor.tsx`
- Create: `src/lib/parseSupportedArduinoSubset.ts`
- Modify: `src/components/lesson/BlockCodeWorkspace.tsx`
- Modify: `src/data/esp32LedProgram.ts`
- Modify: `src/lib/lessonProgramIr.ts`
- Modify: `src/styles/app.css`

- [ ] Add a separate editable C++ practice mode with line numbers, copy and reset-to-template controls. Preserve the user's draft in component/session state when changing modes; never overwrite it without an explicit restore action.
- [ ] Parse only the grammar specified in the design: `const int`/`int` GPIO declaration, `setup()`, `loop()`, `pinMode(..., OUTPUT)`, `digitalWrite(..., HIGH/LOW)`, and `delay(integer)` statements with comments/whitespace. Return source-line ranges and useful Vietnamese diagnostics.
- [ ] Convert recognized statements to the shared IR and allow importing supported code into blocks. If a statement is unsupported or ambiguous, preserve code exactly, identify the line/construct and disable flow playback until the learner fixes it or explicitly resets to the supported example.
- [ ] When switching from editable code to blocks, import only if the full program parses; otherwise show a choice to stay in code mode or explicitly restore the example blocks. Never silently discard either draft.
- [ ] Make text mode useful for practice with inline explanations and a “đối chiếu với ví dụ” action; do not compile or execute typed C++ in the browser.

### Task 7: Synchronize lesson flow, code line and circuit highlights

**Files:**
- Create: `src/components/lesson/ProgramFlowPlayer.tsx`
- Modify: `src/pages/LessonPage.tsx`
- Modify: `src/components/board/BoardViewer.tsx`
- Modify: `src/components/board/BoardScene.ts`
- Modify: `src/components/lesson/BlockCodeWorkspace.tsx`
- Modify: `src/components/lesson/CppPracticeEditor.tsx`
- Modify: `src/styles/app.css`

- [ ] Build an ordered flow timeline from the shared IR; each action contains its source block/code line, GPIO, feature IDs and expected conceptual LED state.
- [ ] Add run, pause, previous step, next step and restart controls. At each step highlight the matching block or source line, board output pin, wiring path and LED/breadboard feature.
- [ ] Keep state changes conceptual: show a persistent label that the preview does not execute firmware, calculate circuit physics or reproduce actual electrical timing.
- [ ] Disable playback if parsing reports unsupported code; show the exact reason and retain all text. Do not animate a partial or guessed interpretation.
- [ ] Ensure keyboard focus and screen-reader status announce the active flow step and resulting LED state.

### Task 8: Learner-facing documentation and final verification

**Files:**
- Modify: `README.md`
- Modify: `assets/boards/vendor/esp32-s3-devkitc-1/README.md`
- Modify: `assets/boards/vendor/nucleo-f401re/README.md`
- Modify: `docs/superpowers/plans/2026-10-29-board-library-code-learning.md`

- [ ] Document how to open each board, select/follow a pin, use block mode, edit C++ mode, import supported code into blocks, and understand unsupported-code warnings.
- [ ] Record source archive hashes, board revision, asset version, omitted packages and license/attribution decision for each model. If rights are unresolved, confirm the GLB remains outside public assets and the UI says preview-only.
- [ ] Run `npm.cmd run build` from `D:\StartupOS\electronics-learning-demo`; require TypeScript and Vite build success.
- [ ] Run the local dev server and manually check the catalogue filters, two board routes/models where licensed/validated, board pin selection, block-generated sketch, editable C++ preservation, flow stepping and unsupported-syntax messaging.
- [ ] Inspect browser console and network requests for missing GLB, chunk or Blockly assets. Record the exact build result and any remaining source/license limitation here.

## Plan self-review

- The board-source pipeline, board explorer, catalog, beginner block authoring, editable C++ practice, synchronized visual flow, and documentation each have a dedicated task.
- No task depends on a fake CAD asset or an unbounded code executor. Source/licensing gates precede public model assets.
- Automated tests are intentionally absent for this pass per the task instruction; verification is production build plus focused manual UI/asset inspection.
- If CAD conversion or licensing fails, the specific board remains a preview and the rest of the product work can proceed without claiming an interactive model.
