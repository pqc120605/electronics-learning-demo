# Board Library and Learning Features Design

**Status:** Approved for implementation planning  
**Date:** 2026-10-29  
**Product:** Mạch Mở — interactive embedded-electronics learning demo

## 1. Purpose

Expand the existing board viewer from an ESP32/Arduino reference explorer into a trustworthy board library for learning. The user should be able to choose a board, inspect an accurate 3D model, identify its components and pins, and follow how a simple signal moves from a pin through the relevant hardware.

## 2. Agreed scope

The founder approved this first implementation scope:

- Import and validate reference CAD for **ESP32-S3-DevKitC-1** and **STM32 NUCLEO-F401RE**.
- Leave **ESP32-C3-DevKitM-1** and **STM32F103C8T6 Blue Pill** as preview entries until suitable source files and revision evidence are available.
- Add board-family filtering/search, an interactive board-specific pin map, and a guided learning path from board → pin → component → example use.
- Display board revision and source links in the board experience.
- Add beginner-friendly drag-and-drop blocks and a separate editable Arduino C++ mode for the first ESP32 LED lesson. Generate C++ from blocks and visualize supported code step by step on the circuit/board.
- Add detailed, plain-language help that explains each block, code line, pin, component, expected result and common troubleshooting step.
- Do not add firmware compilation/execution or schematic/PCB editing in this release.

## 3. Research findings

### Comparable tools

- **[Wokwi](https://docs.wokwi.com/)** supports interactive circuit diagrams, code-driven simulation across Arduino/ESP32/STM32 families, and virtual instruments such as a logic analyzer. This is a useful interaction reference, but its full simulation engine is outside this release.
- **[Tinkercad Circuits](https://www.tinkercad.com/circuits)** emphasizes starter circuits, visible wiring, code blocks/text, and guided tutorials for beginners. Mạch Mở should adopt the beginner-friendly sequence and contextual explanations, while retaining board-level component accuracy as its focus.
- **[EasyEDA](https://docs.easyeda.com/en/PCB/PCB-View/)** demonstrates the value of a linked schematic/PCB/3D workflow. Full EDA authoring is explicitly deferred; for this release, the useful lesson is to preserve links between component identity, board placement, pin function, and source design data.
- **[Blockly](https://developers.google.com/blockly)** is a suitable editor foundation for drag-connected blocks, but it does not define Mạch Mở's language or runtime. The product must define a small Vietnamese block vocabulary and its own Arduino C++ generator and visual-flow mapping.

### Candidate source data

- Espressif's [official development-board downloads](https://www.espressif.com/en/support/download/documents/development-board) include an **ESP32-S3-DevKitC-1 PCB V1.1 reference design ZIP** with schematics, PCB layout files, Gerbers, fabrication data, BOM and placement files. The official [V1.1 guide](https://documentation.espressif.com/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html) also documents variants and board hardware behavior. V1.1 is the target revision for this model.
- ST's [NUCLEO-F401RE resource page](https://www.st.com/en/evaluation-tools/nucleo-f401re.html) publishes **MB1136 Board design project files v1.1**, BOM and revision-specific schematics. The model target is **MB1136 / NUCLEO-F401RE C04**; source project and schematic revision must be reconciled before rendering.
- The current ESP32-C3 reference material located during research provides schematic, PCB layout PDF and dimensions/DXF but not a clearly identified complete editable board project suitable for reliable component-by-component placement. It remains preview-only for now.
- Blue Pill boards vary among clones; a community CAD project does not establish one canonical hardware revision. It remains preview-only.

### Rights and attribution

Public download availability is not by itself permission to redistribute derived CAD/3D files. Espressif’s reference-design terms allow use of module reference designs subject to conditions and do not grant trademark rights; the precise terms applicable to the DevKitC board package must be recorded from the package/source page. ST exposes an Open Reference Material License Agreement and separate Evaluation Board Terms of Use. Before adding either derived GLB to the web distribution, record the applicable license, attribution requirements, and whether redistribution of a derived viewer model is permitted. If unclear, retain the source locally and expose only a source link and educational metadata until resolved.

## 4. User experience

### Board catalogue

- Filter by family: ESP, STM32, Arduino; provide a text search by model or MCU.
- Each board card shows exact model, MCU, revision/variant, model status (interactive or preview), and a source/documentation link.
- A preview entry must not open a fake interactive model. State what data is missing and why.

### Interactive board explorer

- Keep the existing 3D rotate/zoom and click/hover selection.
- Add a board-specific pin map. Selecting or focusing a pin shows its primary function, alternate functions relevant to the learning objective, voltage/boot constraints when verified, and associated board components. Highlight the physical header/pin region in the 3D view where the model provides a reliable mapping.
- Provide a guided signal path with explicit steps: **Board → Pin → Component/block → Example**. Selecting a step highlights only CAD-backed objects and shows a short explanation. Signal paths must be based on schematic/net data or official documentation, not inferred from visual proximity.
- Component information includes designator, part/package where known, purpose, connections, why the placement is useful (labelled as an engineering explanation/inference unless source documentation establishes intent), and evidence/source.
- Keep touch, keyboard and list selection equivalent to pointer hover. Hover is transient; click/focus selection persists.

### Cross-board learning

- Add a compact board comparison view for the currently available boards: MCU family, logic voltage, connectivity, available ADC/PWM/UART/I²C/SPI features, and model/revision status. Every electrical fact needs a cited board/chip source. Do not imply pin-number equivalence across boards.

### Beginner coding and code-to-circuit flow

- Use Blockly as the drag-and-drop workspace foundation, with Mạch Mở's constrained block definitions and a custom generator for this lesson's Arduino C++ subset.
- On the introductory ESP32 LED lesson, provide two views: **Khối lệnh** (default for beginners) and **Tự viết code C++** (for learners who want to practice text programming). The block workspace generates Arduino C++ and updates its preview when blocks change. The C++ editor is editable, copyable and resettable to the lesson template; typed code is not silently overwritten when switching modes.
- Treat blocks and text code as separate editing modes with explicit conversion. If text code uses only the supported subset, allow importing it into blocks. If it contains unsupported syntax, explain the limitation and let the learner stay in code mode or explicitly restore the block-generated version.
- Use a small Vietnamese block vocabulary for this lesson: setup, set a GPIO as output, repeat forever, set GPIO HIGH/LOW, wait milliseconds. Show only blocks valid for the currently selected lesson/board context. Avoid advanced jargon until expanded help is requested.
- Each block has a short inline explanation and an expandable “Vì sao dùng khối này?” explanation connected to the relevant board pin, LED/resistor and lesson objective. Include a safe GPIO choice and clear 3.3 V warning for ESP32.
- A **Chạy luồng** control interprets the supported program as a bounded visual lesson sequence. It highlights the active block or code line, the ESP32 output pin and relevant circuit component; it then updates the conceptual LED state and proceeds through the loop. Provide pause, step forward/back and restart controls.
- Blocks and supported typed code map to one constrained intermediate representation (IR). Generate flow steps from that same IR so the highlighted behavior corresponds to the block-generated or recognized text code.
- In editable code mode, recognize only the documented lesson subset (pin variable declaration, `pinMode(..., OUTPUT)`, `digitalWrite(..., HIGH/LOW)`, `delay(...)`, and the expected `setup()`/`loop()` structure). If code falls outside the subset or cannot be mapped unambiguously, preserve the user's code, identify the unsupported construct and disable only the flow preview until corrected. Never execute arbitrary C++ or claim to emulate electrical behavior, MCU timing, firmware, Wi-Fi or physical hardware. Label the animation as a conceptual visualization.
- Give first-time learners a short “how to use this workspace” walkthrough: add/arrange a block, read its explanation, inspect generated code, step through the flow, then copy and upload to hardware. Make it dismissible and reopenable.
- Other board models can use the board explorer/pin reference even when no coding lesson exists. Never show ESP32 code as if it automatically targets an Arduino or STM32 board.

## 5. CAD import and model pipeline

1. Download source packages only from the official Espressif and ST pages, retain the original archive and record download URL, date, archive checksum, board revision and license note.
2. Inspect the archive contents and identify the source PCB, schematic, BOM, placement/centroid data and relevant 3D packages. Do not silently substitute a visually similar board or clone.
3. Build one revision-specific import/export path per source format. Normalize origin, orientation, units and component references against source placement data and board dimensions.
4. Export GLB and a manifest containing the source revision, model version, selectable nodes, designators, component metadata, pin references and evidence links.
5. Validate board outline/dimensions, component count and placement against the source CAD/placement/BOM and inspect the exported GLB in the app. Missing or uncertain packages remain visibly omitted and documented.
6. Publish the viewer asset only after both technical validation and rights review. Keep manufacturer trademarks and markings subject to the applicable source terms.

The block workspace must have a constrained, documented grammar for the supported LED lesson. The block representation must produce both generated C++ and visualization steps from the same source model so displayed behavior cannot diverge from the code template.

## 6. Data and interface requirements

Board records need stable IDs, family, board revision/variant, MCU, voltage level, source document URLs, source package checksum, license/attribution status and model availability status. Pin records need pin label, GPIO/MCU mapping, verified functions, restrictions, board designator/physical location, source and related component IDs. Component records need designator, package/part number, viewer node ID, short explanation, connections, placement explanation with evidence status, and source references. The beginner program model needs typed block values/operations, board pin references, generated-code mappings, and ordered visualization actions that identify the affected code line, pin and circuit feature.

The viewer should consume board manifests through the existing board abstraction; board-specific pin and component data must not be embedded as conditionals in the renderer. Unverified fields are omitted or labelled; never substitute guessed technical values. The beginner program model needs typed block values/operations, a constrained IR, board pin references, generated-code mappings, editable code state, parser diagnostics, and ordered visualization actions that identify the affected code line, pin and circuit feature.

## 7. Success criteria

- The S3 and NUCLEO models are shown as interactive only when the correct revision and component geometry are validated.
- Pointer, keyboard and touch users can select a physical component or pin and receive matching, sourced information.
- A learner can follow at least one verified signal path per imported board from pin to component/block and example.
- A beginner can assemble the supported LED program from blocks, inspect generated C++, switch to editable text code and continue practicing without losing their draft.
- For supported text code, the learner can step the conceptual flow while the active block/code line and corresponding circuit objects are highlighted; unsupported statements produce an explanation and are never silently skipped.
- Each supported block and step has an understandable Vietnamese explanation; an incorrect or unsupported pin/block combination is blocked or explained before running the visual flow.
- Search and family filters reliably find each board; preview models are clearly distinguished from validated interactive models.
- Board facts cite a source and revision; uncertain placement explanations are explicitly marked as inference.
- Production build succeeds and the two imported models load in the browser without asset or console errors.

## 8. Non-goals

- Compiling or running Arduino/ESP-IDF/STM32 firmware in the browser.
- Electrical/SPICE simulation or claims of electrical correctness based only on 3D geometry.
- Reverse conversion of arbitrary C++ into blocks; only the documented supported subset can be imported.
- General-purpose block coding beyond the supported ESP32 LED lesson.
- Web-based schematic capture, PCB routing, or KiCad replacement.
- Publishing user-uploaded CAD or supporting arbitrary PCB formats.
- Promoting the current C3 or Blue Pill preview entries to interactive models without qualified source data.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Source archive format is not directly importable or lacks precise 3D packages | Inspect first; use a board-specific conversion pipeline; omit uncertain component bodies and retain preview status if geometry cannot be verified. |
| Reference material terms do not clearly allow derived GLB redistribution | Record the license decision; link to the source instead of shipping derived assets until permission is clear. |
| Board revisions or variants have different wiring/pins | Bind each manifest to exact revision/variant and show it in the UI. |
| Visually nearby components are mistaken for electrically connected components | Derive signal-path edges from schematic/net data and document evidence. |
| Feature expansion makes the existing lesson confusing | Keep the current LED lesson intact; add the explorer as a board-focused area and label its educational scope. |

## 10. Decisions already made

- Models to import first: ESP32-S3-DevKitC-1 V1.1 and NUCLEO-F401RE C04.
- Previews: ESP32-C3-DevKitM-1 and STM32F103C8T6 Blue Pill.
- Add board filtering, pin exploration, guided signal path, and board comparison.
- Add a Vietnamese block-first ESP32 LED coding experience and an editable C++ practice mode, both connected to a supported-subset conceptual step-through visualization.
- No firmware compiler/simulator or schematic/PCB editor in this implementation.
- Do not distribute a CAD-derived GLB unless source terms permit it.
