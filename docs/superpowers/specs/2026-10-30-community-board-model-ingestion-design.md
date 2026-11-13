# Board model sourcing and publication pipeline

**Status:** Draft for founder review  
**Date:** 2026-10-30  
**Product:** Mach Mo electronics learning platform

## 1. Purpose

Create a repeatable way to add board models when an existing board has no usable web viewer. A learner should be able to inspect a board in 2D and 3D, rotate/zoom it, select identified components, and see what is known about their function and location. The viewer must distinguish measured/source-backed facts from educational approximations.

The platform is an educational reference viewer. A board model does not imply firmware execution, SPICE analysis, validated electrical behavior, or compatibility with every clone/revision.

## 2. User intent and constraints

- The founder wants more commonly used MCU boards represented on the website, including boards for which no ready-to-use 3D file exists.
- Images and community files may help create a model, but learners should not be led to believe inferred geometry or routing is verified.
- Existing viewers use CAD-derived GLB and 2D PCB manifests; new models should fit the same user-facing board discovery flow where feasible.
- Public web assets must have recorded source, attribution, and distribution terms. A source being downloadable is not sufficient permission to publish a derivative.
- The founder expects other people to test and review the models, so each asset must expose its target revision and confidence/status.

## 3. Proposed approach

Use one admission pipeline with three evidence levels:

1. **Source-verified CAD:** import the exact vendor/community board CAD or official STEP. Derive 2D geometry, 3D board geometry, component locations and selectable references from that source. Publish only after license review and geometry checks.
2. **Dimensioned educational reconstruction:** when no redistributable board CAD exists, create original geometry using documented board dimensions, pinout/placement documents, and photographs as measurement references. Do not copy third-party product photos into the app unless their license permits it. Mark coordinates, component bodies, and any 2D copper as approximate; do not invent a netlist or copper paths.
3. **Preview-only:** when source, dimensions, revision, or rights are insufficient, keep the board catalog entry and link to its documentation, but do not present an unverified 3D/2D model as complete.

Recommendation: prioritize source-verified CAD and use dimensioned reconstruction only as a separately labeled fallback. Every reconstructed model is an original educational drawing, not an exact CAD clone.

## 4. Asset pipeline

### 4.1 Source record

Each target board has a source record containing exact product name, revision/variant, source owner and URL, retrieval date, local archive checksum, source file formats, license/terms URL, required attribution, conversion notes, and unresolved rights or accuracy questions. Preserve original archives unchanged and keep generated/runtime outputs separate.

### 4.2 Conversion and model data

- Prefer direct source CAD/STEP conversion using the project’s existing KiCad export path and GLB viewer conventions.
- Keep a 2D manifest and 3D scene tied to the same source revision and stable component/designator IDs.
- A manifest records units, origin/transform, board outline, layers included, pad/net information when present, component reference/value/package, side, XY position, rotation, mesh availability, and omissions.
- Use a generic package mesh only when the package class and dimensions are supported by the source footprint. Label it as generic; do not imply exact manufacturer markings or internals.
- Image-based reconstruction may define board outline and visible part placement only when dimensions can be calibrated. Its 2D view may show outline, labels, and component anchors, but no copper/net layer unless independently sourced.

### 4.3 Review and publication

Before publishing: inspect top and bottom, compare outline/mounting holes/connectors, check component count and transforms against source placement/BOM, verify orbit/selection in the browser, and record known omissions. Update board capability metadata only after this review. Unclear license or failed conversion keeps the asset preview-only.

## 5. Web experience

- The board catalog identifies whether a model is source-verified CAD, an educational reconstruction, or preview-only.
- 2D and 3D views share board identity and component selection where evidence supports it.
- Selecting a component shows its name/reference, role, source-backed electrical connections where available, a short beginner explanation, location/side, and confidence label.
- A component without an individual 3D mesh remains selectable by its CAD footprint/pad. The viewer must not silently move it to a guessed location.
- Show a persistent note that the model is a reference, and explicitly state that firmware/electrical behavior is not simulated unless a separate lesson simulation actually provides it.
- Report unavailable assets and conversion status without a broken remote iframe or opaque import error.

## 6. Initial board candidates

The pipeline should be exercised with the following candidates, subject to the gates below:

| Candidate | Source currently known | Proposed treatment |
|---|---|---|
| ESP32-S3-DevKitC-1 V1.1, N8R8 | Official Espressif archive retained locally; PADS ASCII, BOM, schematic, placement material | Attempt source conversion and compare with BOM/placement. Keep preview-only until derived web asset rights and conversion fidelity are resolved. |
| NUCLEO-F401RE MB1136 C04 | Official ST Altium archive, BOM and schematic retained locally | Conversion may be explored, but no derived public model until ST terms are reviewed and redistribution rights are clear. |
| STM32F103C8T6 Blue Pill-style | Several community designs exist; the name does not identify a universal layout | Select only one specific community design after confirming its files, license and revision. Label by design/revision, never as the canonical Blue Pill. |
| Other popular MCU boards | Existing catalog includes additional boards without viewers | Add in batches only when a source record, dimensions/pinout evidence, and a feasible conversion/reconstruction path exist. |

The official Espressif source inventory and repository records remain the source of truth for current local files. Do not treat a component footprint library as a complete board design.

## 7. Scope and non-goals

### In scope

- Source audit and model intake records for board candidates.
- Reusable conversion/reconstruction conventions compatible with current 2D/3D viewers.
- Board status, source attribution, confidence and omission information in the UI.
- A staged path to add boards without source CAD, with approximate status made explicit.

### Out of scope

- A general-purpose KiCad replacement or browser PCB editor.
- Inferring or simulating electrical nets from product photos.
- Running MCU firmware or a full SPICE solver as part of this model pipeline.
- Publishing assets when redistribution terms are unclear.
- Claiming physical-board validation before a person compares the model to the exact board/revision.

## 8. Acceptance criteria

1. Each newly published model names its exact board/revision, source and status.
2. Source-verified 2D and 3D assets share the same identity and transform source.
3. Approximate reconstructions cannot display fabricated copper/net data and visibly carry an approximation label.
4. Every selectable part either maps to a source-backed footprint/placement or is explicitly labeled as approximate.
5. Unresolved rights block public model publication while allowing a catalog/documentation link.
6. Orbit, zoom, reset, top/bottom viewing and component selection work for each published viewer.
7. Documentation accurately reports model counts and does not equate a catalog entry with an interactive model.

## 9. Risks and decisions needed during implementation planning

- PADS and Altium conversion may lose or alter geometry, layer data, or placements; conversion output must be audited rather than trusted automatically.
- Official reference-design permissions may not explicitly cover distributing derived 3D assets; seek legal/owner clarification if the applicable terms remain ambiguous.
- Community designs differ substantially; selecting one source must not silently generalize to all boards sharing a family name.
- Photo-derived measurements can create convincing but inaccurate visuals. Use that route only for explicitly approximate educational models.
- A large board library can make asset sizes and load times problematic; model delivery should be measured and assets optimized without changing source geometry.

## 10. References checked

- Espressif technical documents and ESP32-S3-DevKitC-1 V1.1 reference-design listing: https://www.espressif.com/en/support/download/documents/development-board/1000
- Espressif ESP32-C3 related documentation and reference-design terms: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32c3/related-documentation-and-resources.html
- ST NUCLEO-F401RE product/download page: https://www.st.com/en/evaluation-tools/nucleo-f401re.html
- Example MIT-licensed community Blue Pill-style design (improved LQFP-48 board; not a universal clone): https://github.com/xjtuecho/BluePill
- Existing project source review: `assets/boards/vendor/MODEL-SOURCE-REVIEW.md`
- Existing model capability registry: `assets/boards/board-model-registry.md`
