# Raspberry Pi Pico 2 H Board Viewer Implementation Plan

> **For agentic workers:** Native execution in the current Codex session, using test-driven development.

**Goal:** Add a selectable, locally hosted 3D CAD reference for the official Raspberry Pi Pico 2 with headers, keeping it distinct from the unheadered Pico 2.

**Architecture:** Keep the official STEP archive, extracted STEP, and its MIT license notice in `public/cad`. Reuse the existing OpenCascade-to-GLB converter and Raspberry Pi manifest pipeline, add a board-specific inventory and asset lock entry, and add a catalog profile that clearly states this model is mechanical guidance only. No pin picking, netlist, firmware simulation, or inferred new electrical support is added.

**Tech Stack:** TypeScript, Vite, Node test runner, `occt-import-js`, existing GLB parser and board catalog.

**Spec:** Current user request to continue completing Learning and Board/Components; manufacturer file page: Raspberry Pi Pico 2 H, official STEP archive and bundled MIT license.

## Global Constraints

- Use the exact official Pico 2 H STEP source; do not reconstruct the board from photos or merge it with the Pico 2 non-header model.
- Keep the original source archive, extracted STEP, attribution, MIT license, source hash, and conversion record.
- Treat mesh names as CAD geometry evidence only; do not infer netlist or electrical role beyond manufacturer documentation.
- Keep pin picking disabled and do not add a Pico 2 H firmware simulator target in this slice.
- Do not add dependencies or change existing board model bytes unnecessarily.

## Review Focus

- Model/profile ID collision with Pico 2 non-header — assert separate IDs, revision labels, and separate GLB paths.
- Wrong top orientation or mirrored assembly — validate the RP2350 is above the PCB and BOOTSEL orientation matches the existing non-header Pico 2 reference.
- License/source dropped during conversion — test the NOTICE, archive, source STEP, source digest, and model evidence link.
- Model appears to be an electrical simulator — assert no pins, no signal flows, and no pin picking in the manifest.
- Asset cache remains stale — assert the generated GLB hash matches the board asset lock version.

---

### Task 1: Pin the catalog and model contract with tests

**Files:**
- Modify: `tests/board-catalog.test.mjs`
- Modify: `tests/component-models.test.mjs`
- Test: existing `npm.cmd test`

**Interfaces:**
- Consumes: `boards`, `raspberryPiBoardModels`, `boardModelSources`, `parseBoardGlb`, `board-asset-lock.json`.
- Produces: regression coverage for board identity, source/license, asset identity, orientation, and unsupported electrical claims.

- [ ] Add a test that `raspberry-pi-pico-2-h` is a preview board with revision `Pico 2 H / SC1632`, has a manufacturer source and local STEP link, and differs from `raspberry-pi-pico-2`.
- [ ] Add a test that the model has a bundled notice and inventory sourced from `rpi_pico2h.step`, has no pins/signal flows, and has `pinPicking === false`.
- [ ] Add a geometry test for a non-zero GLB and separate board/model dimensions; assert RP2350 above the board and BOOTSEL on the documented upper-left side when viewed from above with USB at top.
- [ ] Add a lock test that the GLB SHA-256 and cache version match the checked-in model.
- [ ] Run only the targeted board/model test files and confirm the new assertions fail because the model/profile is absent.

### Task 2: Convert and lock the official STEP asset

**Files:**
- Modify: `scripts/convert-raspberry-pi-step-to-glb.mjs`
- Create: `public/cad/raspberry-pi-pico-2-h-step.zip`
- Create: `public/cad/raspberry-pi-pico-2-h-step-source/rpi_pico2h.step`
- Create: `public/cad/raspberry-pi-pico-2-h-step-source/LICENSE.txt`
- Create: `public/models/raspberry-pi-pico-2-h.glb`
- Create: `src/data/raspberry-pi-pico-2-h.mesh-inventory.json`
- Modify: `src/data/board-asset-lock.json`

**Interfaces:**
- Consumes: official archive at Raspberry Pi PIP product SC1632, Pico 2 H STEP, MIT license, existing converter.
- Produces: model path `/models/raspberry-pi-pico-2-h.glb`, inventory keyed by `raspberry-pi-pico-2-h`, board-asset lock entry.

- [ ] Extend the converter with a `--board <id>` filter so one model can be regenerated without rewriting existing Pico GLBs.
- [ ] Add the Pico 2 H input path and `rpi_rp2350a` top-side marker to the converter.
- [ ] Run `node scripts/convert-raspberry-pi-step-to-glb.mjs --board raspberry-pi-pico-2-h` and inspect the inventory nodes, model bounds, and digest.
- [ ] Run `node scripts/export-board-asset-lock.mjs` and verify only the new Pico 2 H lock entry was added.
- [ ] Run `node scripts/audit-board-models.mjs` and assert there are no missing/orphan hotspots.

### Task 3: Publish the exact board profile and CAD evidence

**Files:**
- Modify: `src/data/boards.ts`
- Modify: `src/data/boardModelSources.ts`
- Modify: `src/data/raspberryPiBoardModels.ts`
- Modify: `src/data/components.ts`
- Modify: `public/cad/README.md`
- Create: `public/models/raspberry-pi-pico-2-h.NOTICE.txt`

**Interfaces:**
- Consumes: new STEP inventory and locked GLB.
- Produces: board card, profile/detail view, and interactive CAD viewer under the ID `raspberry-pi-pico-2-h`.

- [ ] Add a separate catalog board profile with correct RP2350, 4 MB flash, 3.3 V I/O, presoldered headers, JST-style keyed debug connector, official PIP source, and explicit CAD-only limits.
- [ ] Add model evidence describing the 2025 manufacturer STEP and MIT terms, including the manufacturer’s accuracy disclaimer.
- [ ] Add the Pico 2 H inventory to `raspberryPiBoardModels` and label only documented RP2350, PCB, USB, header, and connector names; mark all other components according to source evidence.
- [ ] Add a matching board-library record with a route to `/boards?board=raspberry-pi-pico-2-h`; do not add it to simulator targets.
- [ ] Add an attribution/NOTICE and source README row with source hash and conversion command.

### Task 4: Verify the board-library experience and project gates

**Files:**
- Modify: `docs/MACH-MO-MVP-STATUS.md`
- Test: `tests/board-catalog.test.mjs`, `tests/component-models.test.mjs`, `tests/data-integrity.test.mjs`

**Interfaces:**
- Consumes: board profile, manifest, license notice, GLB, documentation.
- Produces: verified browser-readable profile and updated current inventory counts.

- [ ] Run the targeted tests and then `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, and `node scripts/audit-board-models.mjs`.
- [ ] Open `/boards?board=raspberry-pi-pico-2-h` in the local preview and check model load, component selection, and the CAD-only label.
- [ ] Update current status counts from source: board profiles, official 3D scenes, board/component reference photos, and test total. Preserve older dated log entries as historical records.
- [ ] State remaining limits: no physical board comparison, no electronic netlist/pin picking, no firmware simulation, and no hardware test.

