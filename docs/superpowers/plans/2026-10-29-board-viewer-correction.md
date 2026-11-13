# Board viewer correction implementation plan

> **For agentic workers:** Implement inline using `superpowers:executing-plans`; user authorized this work in the current thread.

**Goal:** Correct Arduino board part geometry, enable per-component hover explanations, and expand ESP/STM board catalog without presenting unsupported CAD as exact.

**Architecture:** Preserve the KiCad-to-GLB pipeline as source of truth. Correct package transforms at the CAD export source, add per-node hover/picking and educational content to the existing viewer, and register new boards with a strict CAD-backed vs preview distinction.

**Tech Stack:** React, TypeScript, WebGL2 custom GLB parser, KiCad PCB and STEP models.

**Spec:** `docs/superpowers/specs/2026-10-29-board-viewer-correction.md`

## Global Constraints

- Keep physical references tied to a named board revision/source.
- Never claim an inferred placement reason is confirmed design intent.
- Preserve mouse, touch, keyboard and list-based selection.
- Do not fabricate CAD fidelity; use preview where source CAD is incomplete.
- Do not add or run tests in this pass; run production build and inspect generated model metadata where applicable.

## Review Focus

- Rotated/through-hole headers: transform and pad-1 origin must agree after export.
- Nano MCU package: source part code must agree with selected package model.
- Hover occlusion: frontmost visible component should win, not an overlapping board-wide bound.
- Touch/keyboard: hover affordance must not replace click/list selection.
- Board catalog: unsupported CAD sources must remain preview-only and say why.

---

### Task 1: Fix Arduino CAD package transforms and mapping

**Files:** `assets/boards/arduino-reference/attach_reference_models.py`, generated `*-viewer.kicad_pcb`, `*-with-packages.glb`, `public/models/arduino-*.glb`, `src/data/arduinoBoardModels.ts`, `assets/boards/arduino-reference/README.md`.

- [x] Confirm source footprint, pad coordinates, part number and model origin for each current visible package.
- [x] Replace universal zero-offset injection with per-reference/package placement metadata; compute header model placement from footprint pad layout and rotation.
- [x] Correct Nano MCU body mapping to match the exact schematic/BOM part, or leave its model absent if the CAD source cannot prove the package.
- [x] Re-export and replace public GLBs after checking exported node coverage and asset metadata.
- [x] Document model coverage and remaining omitted parts.

### Task 2: Add accurate per-node hover and placement explanations

**Files:** `src/components/board/BoardScene.ts`, `src/components/board/BoardViewer.tsx`, `src/components/board/boardSceneTypes.ts`, `src/components/ComponentDetails.tsx`, `src/data/arduinoBoardModels.ts`, applicable CSS.

- [x] Extend feature/detail data with source designator, placement rationale and provenance status.
- [x] Add a frontmost-component pick operation usable on pointer move; avoid selecting board/silkscreen bounds as a component when a component node is occluding them.
- [x] Add transient hover state distinct from persistent selection and apply hover emphasis in renderer.
- [x] Keep drag rotation, click selection and touch/list controls working; display focused/hovered component content accessibly.
- [x] Map individual package nodes where GLB supports them; leave unmapped board zones as non-selectable instead of assigning inaccurate group targets.

### Task 3: Expand ESP/STM catalog with source-backed status

**Files:** `src/data/boards.ts`, new board manifests/assets as available, catalog/selector components, board-source README/docs.

- [x] Add ESP32-C3 DevKitM-1, ESP32-S3 DevKitC-1, STM32 NUCLEO-F401RE and STM32F103C8T6 Blue Pill.
- [x] Record board revision, MCU, source CAD/rights, model URL and level of fidelity per entry.
- [x] Only expose interactive GLB for assets validated from the source; otherwise show a preview state with clear scope and no false component hotspots.
- [x] Keep existing ESP32/Arduino routes stable.

### Task 4: Production build and artifact review

**Files:** none beyond above.

- [x] Run `npm run build` and read the complete result.
- [x] Inspect generated GLB node names and asset sizes; package bounds were not exhaustively measured against board dimensions.
- [x] Review catalog entries and detail copy against the approved spec; report missing source CAD/model work explicitly.
