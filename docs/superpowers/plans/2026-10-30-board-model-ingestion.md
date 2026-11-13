# Board Model Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a traceable intake path for board references and publish the first additional source-backed 2D/3D MCU board model without presenting uncertain geometry as verified.

**Architecture:** Add an explicit evidence/status record per board, extend the current board viewer/catalog to show that status, and generate both 2D PCB data and a 3D GLB from one exact KiCad source. Use the community STM32 Blue Pill design by SinaKarvandi as the first candidate, pinned to a source revision and accompanied by its GPL-3.0 license; keep ESP32-S3 and NUCLEO-F401RE preview-only while their conversion and distribution gates remain unresolved.

**Tech Stack:** React 19, TypeScript, Vite, KiCad 9 `pcbnew` Python API, `kicad-cli` GLB export, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-30-community-board-model-ingestion-design.md`

## Global Constraints

- The platform is an educational reference viewer; a board model does not imply firmware execution, SPICE analysis, validated electrical behavior, or compatibility with every clone/revision.
- Public web assets must have recorded source, attribution, and distribution terms.
- Use source-verified CAD first; a dimensioned reconstruction must be visibly labeled as approximate.
- Image-based reconstruction may show outline, labels, and approximate component anchors, but no copper/net layer unless independently sourced.
- Unclear license or failed conversion keeps the asset preview-only.
- Do not imply exact manufacturer markings or internals when using a generic package mesh.

## Review Focus

- An unlicensed or license-unclear source must never become a published viewer; pin source/license metadata and test the status gate.
- A community design must not be called the universal Blue Pill; show its source design and revision in the catalog and viewer.
- GLB and 2D manifest transforms must agree; test source bounds and component reference/placement counts against the same KiCad board.
- A footprint without a mesh must remain selectable as a pad/footprint and must not gain a guessed 3D body.
- An unavailable or invalid model must retain the preview-only state and produce a readable UI message rather than a broken viewer.

---

### Task 1: Add an explicit evidence record for board models

**Files:**
- Create: `src/data/boardModelSources.ts`
- Modify: `src/components/board/boardSceneTypes.ts`
- Modify: `src/data/boardCapabilityRegistry.ts`
- Modify: `tests/smoke.test.mjs`

**Interfaces:**
- `BoardModelEvidence.status` is `'source-verified-cad' | 'educational-reconstruction' | 'preview-only'`.
- `BoardModelEvidence` contains `revision: string`, `sourceUrl: string`, `licenseName: string`, `attribution: string`, `confidenceNote: string`, `unresolvedIssues: string[]`, and `published: boolean`.
- `boardModelSources` is a `Record<string, BoardModelEvidence>` keyed by the exact `boardId`.
- `getBoardModelEvidence(boardId: string): BoardModelEvidence | undefined` returns no evidence for unknown IDs; consumers must show the existing preview-only fallback.

- [x] **Step 1: Add status and source record types**

Add the `BoardModelEvidence` type in `src/components/board/boardSceneTypes.ts`. Create `src/data/boardModelSources.ts` with records for the seven current interactive board references, preview-only ESP32-S3, ESP32-C3, NUCLEO-F401RE and Blue Pill catalog entries, plus the new community Blue Pill exact design record only after its source package and license have been checked into the repository.

- [x] **Step 2: Make catalog capability derive its model status from the evidence record**

In `src/data/boardCapabilityRegistry.ts`, replace the hard-coded `verifiedModels` membership as the authority for display status with `getBoardModelEvidence(board.id)`. Keep the existing `modelStatus` property for current consumers, deriving `3d-verified` only when an evidence record has `published: true` and a non-preview status; otherwise return `preview-only`.

- [x] **Step 3: Add source/status invariants to the existing smoke suite**

Load `/src/data/boardModelSources.ts` in `tests/smoke.test.mjs`. Add assertions that each published model has a non-empty revision, source URL, license name, attribution, and confidence note; every preview-only model stays unpublished; unknown IDs return `undefined`; and `getBoardCapability('stm32-nucleo').modelStatus` remains `preview-only`.

- [x] **Step 4: Run the focused existing smoke suite**

Run: `npm.cmd test`

Expected: all smoke tests pass, including the new source-evidence invariants.

### Task 2: Import one licensed community board into 2D and 3D assets

**Files:**
- Create: `assets/boards/community/stm32-bluepill-sinakarvandi/` with source KiCad board, schematic when present, `LICENSE`, and `SOURCE.md`
- Modify: `scripts/export_pcb_board_assets.py`
- Create: `public/boards/stm32-bluepill-sinakarvandi/manifest.json`
- Create: `public/models/stm32-bluepill-sinakarvandi.glb`
- Create: `tests/board-model-assets.test.mjs`

**Interfaces:**
- Extend `scripts/export_pcb_board_assets.py` with `--board-id stm32-bluepill-sinakarvandi` and a fixed source/output entry; preserve existing default board behavior and existing output formats.
- The generated manifest uses the same schema as current `public/boards/*/manifest.json`; the GLB and manifest use the same board origin, units, and source revision.
- The source record pins the upstream repository URL, source revision or commit, retrieval date, archive SHA-256, GPL-3.0 notice, attribution, and all components not represented by a 3D mesh.

- [x] **Step 1: Pin and preserve the community source files and license**

Download `bluepill_board/bluepill_board.kicad_pcb` from [SinaKarvandi/PCB-Designs](https://github.com/SinaKarvandi/PCB-Designs), copy the repository GPL-3.0 license and attribution into `assets/boards/community/stm32-bluepill-sinakarvandi/`, and record the exact upstream commit and archive SHA-256 in `SOURCE.md`. Do not alter the preserved source board.

- [x] **Step 2: Extend the existing KiCad manifest exporter for this board ID**

Add a source path, output directory, revision string and license attribution in `scripts/export_pcb_board_assets.py`. Export footprint references, values, packages, normalized coordinates, rotations, board outline, pads, tracks, vias, copper zones and net names using the existing `pcbnew` extraction functions. Keep missing 3D mesh references in the manifest rather than inventing package geometry.

- [x] **Step 3: Export the GLB from the same KiCad board source**

Run KiCad 9 `& 'C:\Program Files\KiCad\9.0\bin\kicad-cli.exe' pcb export glb --force --include-tracks --include-pads --include-zones --output public/models/stm32-bluepill-sinakarvandi.glb assets/boards/community/stm32-bluepill-sinakarvandi/bluepill_board.kicad_pcb`. Preserve source footprint placements; use only the installed KiCad 3D package library for bodies and record mesh omissions in `SOURCE.md`.

- [x] **Step 4: Add deterministic asset validation**

Create `tests/board-model-assets.test.mjs`. Parse the manifest and assert the exact board ID/revision, positive board bounds, non-empty component and copper data, unique component references, normalized coordinates within board bounds with a small pad-edge tolerance, and all footprint references referenced by at most one selectable component feature. Assert the GLB begins with the GLB v2 magic/version header and its reported board ID/source revision matches the manifest metadata.

- [x] **Step 5: Regenerate and validate the new assets**

Run: `& 'C:\Program Files\KiCad\9.0\bin\python.exe' .\scripts\export_pcb_board_assets.py --board-id stm32-bluepill-sinakarvandi`

Run: `& 'C:\Program Files\KiCad\9.0\bin\kicad-cli.exe' pcb export glb --force --include-tracks --include-pads --include-zones --output public/models/stm32-bluepill-sinakarvandi.glb assets/boards/community/stm32-bluepill-sinakarvandi/bluepill_board.kicad_pcb`

Run: `node --test tests/board-model-assets.test.mjs`

Expected: the exporter reports the exact source revision and feature counts; the asset test passes without omitting the required 2D/3D file.

### Task 3: Integrate the board into the shared viewer and catalog

**Files:**
- Create: `src/data/communityBoardModels.ts`
- Modify: `src/pages/LessonPage.tsx`
- Modify: `src/pages/BoardCatalogPage.tsx`
- Modify: `src/components/board/BoardViewer.tsx`
- Modify: `src/components/pcb/Pcb2DViewer.tsx` only if the existing manifest loader requires a board allowlist
- Modify: `tests/smoke.test.mjs`

**Interfaces:**
- Export `communityBoardModels: BoardModelManifest[]` and `getCommunityBoardModel(boardId: string): BoardModelManifest | undefined` from `src/data/communityBoardModels.ts`.
- The new model uses board ID `stm32-bluepill-sinakarvandi` consistently in the catalog, URL query, viewer manifest, 2D manifest path and GLB asset path.
- The 2D/3D views expose the same selectable designator IDs and a source-backed component description only where the schematic/BOM supports it.

- [x] **Step 1: Map board CAD records into learner-facing features**

Create `communityBoardModels.ts` to map the generated component manifest to stable feature IDs. Use source designators and BOM/schematic for component role. Give unnamed, unpopulated, or uncertain footprints a neutral label such as `Footprint Jx · chưa xác minh`; do not infer a role from location alone. Set the model evidence to `source-verified-cad` only after the exported CAD, BOM and schematic record agree.

- [x] **Step 2: Register the board as a selectable reference model**

Update `LessonPage.tsx` to include the community board model in its selector and `BoardViewer` list. On selection, update the `board` query parameter and reset scene/component/pin selection using the same behavior as the Arduino and Raspberry Pi models. Do not change the lesson's active code target unless that board is already supported by the lesson simulation target registry.

- [x] **Step 3: Add the community board to the board catalog model viewer**

Update `BoardCatalogPage.tsx` to include this board in the existing model picker and open its interactive viewer. Keep the catalog comparison list and model viewer selection independent; changing the board model must not silently change the comparison selection.

- [x] **Step 4: Verify 2D and 3D selection identifiers match**

Extend `tests/smoke.test.mjs` to compare the community model's feature/designator IDs with the 2D manifest's selectable footprint references, confirm all listed source-backed roles have evidence, and confirm that selecting the board does not claim a lesson firmware target.

- [x] **Step 5: Run project checks**

Run: `npm.cmd test`

Run: `npm.cmd run build`

Expected: all existing smoke tests and the new community-board integration assertions pass; production build completes with no TypeScript errors.

### Task 4: Show provenance, uncertainty and license in the UI

**Files:**
- Modify: `src/pages/BoardCatalogPage.tsx`
- Modify: `src/pages/LessonPage.tsx`
- Modify: `src/components/board/boardSceneTypes.ts`
- Modify: `src/data/boardModelSources.ts`
- Modify: `src/styles.css` or the existing board/catalog stylesheet that owns the affected selectors
- Modify: `tests/smoke.test.mjs`

**Interfaces:**
- Add a shared status label: `CAD tham chiếu đã đối chiếu`, `Mô hình giáo dục tham khảo`, or `Chưa có model tương tác` based on `BoardModelEvidence.status` and `published`.
- Details panel shows exact revision, source attribution/license, known omissions, and whether the selected component has a mesh or is represented by pads only.
- No board page claims the selected board is physically validated unless its evidence record explicitly says so; no current candidate will claim physical validation.

- [x] **Step 1: Add a reusable model evidence summary component**

Create `src/components/board/BoardModelEvidencePanel.tsx` with required `evidence: BoardModelEvidence` input. Render the status label, revision, source link, license/attribution, confidence note, and unresolved issues. Render `preview-only` with a non-interactive preview explanation and no links to nonexistent GLB assets.

- [x] **Step 2: Show the summary in board catalog and learning viewer**

Render `BoardModelEvidencePanel` next to each active model's component details in `BoardCatalogPage.tsx` and `LessonPage.tsx`. Retain current component explanation and safety information; the new panel supplements the selected board's provenance.

- [x] **Step 3: Add accessible status styling**

Add styles using the current dark theme with text labels and icons rather than color alone. At widths below 760 px, stack the panel under the model viewer and keep source/license links keyboard accessible.

- [x] **Step 4: Test status presentation rules**

Add smoke assertions for the three exact status labels and for the NUCLEO-F401RE and ESP32-S3 remaining preview-only. Confirm a missing evidence record cannot render a published status.

- [x] **Step 5: Run tests and build**

Run: `npm.cmd test`

Run: `npm.cmd run build`

Expected: status and provenance checks pass and the responsive UI compiles.

### Task 5: Reconcile model documentation and review the board in browser

**Files:**
- Modify: `assets/boards/board-model-registry.md`
- Modify: `assets/boards/vendor/MODEL-SOURCE-REVIEW.md`
- Modify: `docs/board-model-sourcing.md`
- Modify: `README.md`
- Create: `assets/boards/community/stm32-bluepill-sinakarvandi/ATTRIBUTION.md`

- [x] **Step 1: Record the new board model and explicit limits**

Update the registry and source review table with the exact community project name/revision, GPL-3.0 license, original source URL, source checksum, component/mesh counts, and validation status. State that it is one community design and not a universal retail Blue Pill layout.

- [x] **Step 2: Update model counts from the actual asset registry**

Update `docs/board-model-sourcing.md` and `README.md` to distinguish catalog board count, interactive 3D board count, 2D copper manifest count, and lesson simulation count. Do not hard-code a count that conflicts with `boardModelSources.ts` or the generated asset directories.

- [x] **Step 3: Check the GPL attribution package**

Confirm the public asset folder includes the upstream GPL-3.0 license text and the attribution file links the exact source project and pinned revision. Ensure all generated 3D package models retain their own applicable KiCad/library license notices.

- [ ] **Step 4: Review each browser view manually**

The manual browser review was not completed in this session: computer-use stopped after it could not determine the current browser URL with enough confidence. The local production build and smoke suite passed; this does not count as a visual browser review.

Start Vite with `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`. Open `/boards` and `/learn/esp32-led?board=stm32-bluepill-sinakarvandi`; verify the catalog label, viewer load, orbit/zoom/reset, top/bottom view, component selection, footprint-only behavior, 2D copper display, source/license links and mobile-width layout. Record any mismatch in `SOURCE.md` and keep the board unpublished if required geometry or license checks fail.

- [x] **Step 5: Run final verification**

Final local verification on 2026-10-30: `npm.cmd test` passed (15/15); `npm.cmd run build` passed. Task 2–4 and documentation are complete. Task 5 manual browser review remains open because this execution did not inspect the app visually; the build and tests are not a substitute for that review.

Run: `npm.cmd test`

Run: `npm.cmd run build`

Expected: all current and new checks pass. The final counts in the docs match the committed registries and asset files. ESP32-S3 and NUCLEO-F401RE stay labeled preview-only until their respective source-distribution gates are resolved.

## Scope boundary

This plan delivers one new source-backed community board through the complete source-to-viewer path and establishes the status/provenance pattern. It does not claim that every catalog board now has a model. Adding ESP32-S3 DevKitC-1 and NUCLEO-F401RE as public CAD-derived viewers is a follow-up only after their specific conversion and distribution-rights gates are resolved; their official source files remain preserved and preview-only meanwhile.
