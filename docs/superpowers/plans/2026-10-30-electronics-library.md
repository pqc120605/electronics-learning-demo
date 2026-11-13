# Electronics Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a searchable, sourced catalogue of MCU boards and electronic components with explicit model and verification status.

**Architecture:** Keep board and component records in normalized data modules and let pages render those records. CAD assets remain separate, revision-specific files with provenance manifests; the catalogue must work even when an item has no 3D asset. Existing lesson and viewer routes remain compatible.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite, existing CSS tokens and 3D viewer.

**Spec:** `docs/superpowers/specs/2026-10-30-electronics-library-design.md`

## Global Constraints

- Do not invent pinouts, electrical limits, package identities, component placement, or licensing permissions.
- Mark every asset as verified, reference, metadata-only, or unavailable; do not promote unverified CAD to a verified board model.
- Use exact board/module revisions and include a source URL for each electrical claim.
- Preserve current lesson routing and prevent a catalogue board selection from silently changing the ESP32 lesson target.
- Do not add or run automated tests unless the user asks; use the agreed acceptance and manual review checks during implementation.

## Review Focus

- Different clones share a product name but not PCB placement: bind geometry to an explicit variant and keep clone caveats visible.
- A CAD download exists but has no usable 3D component packages: retain metadata-only/preview status rather than fabricate a complete board.
- Similar component module names have different pin order or voltage: store exact variant and source.
- Search terms include Vietnamese names, aliases, part numbers, and protocol terms: normalize all searchable fields consistently.
- A preview board is selected from catalogue: never route to an unrelated board GLB or lesson code.

## File Structure

- `src/data/boards.ts` — normalized board metadata and model state.
- `src/data/components.ts` — reusable component records, aliases, sourced electrical details and model state.
- `src/data/electronicsSources.ts` — source/license provenance types and records if the source information is shared by multiple items.
- `src/pages/BoardCatalogPage.tsx` — board family filters, search, status and comparison entry point.
- `src/pages/ComponentCatalogPage.tsx` — searchable component catalogue.
- `src/pages/ComponentDetailPage.tsx` — component detail, pinout, compatibility and source view.
- `src/App.tsx` — catalogue routes.
- `src/styles/app.css` — responsive catalogue and detail styles, following existing tokens.
- `assets/models/README.md` and `assets/models/manifest.json` — asset intake and provenance contract; actual assets are added only after source and redistribution review.

## Task 1: Normalize board status and sources

**Files:**
- Modify: `src/data/boards.ts`
- Create: `src/data/electronicsSources.ts`
- Modify: `src/pages/BoardCatalogPage.tsx`
- Modify: `src/components/BoardComparison.tsx`

**Interfaces:**
- `BoardSummary.modelStatus`: `'verified' | 'reference' | 'metadata-only' | 'unavailable'`.
- Keep `availability` for lesson routing during this plan; do not conflate it with `modelStatus`.
- `ElectronicsSource`: `{ id, url, publisher, accessedAt, licenseStatus, attribution?, notes? }`, with `licenseStatus` limited to `'verified' | 'review-needed' | 'link-only'`.

- [ ] Add `modelStatus`, `sourceIds`, and optional exact variant/asset fields to `BoardSummary`.
- [ ] Map every existing board to an honest status using current local evidence; never infer verified from `availability === 'lesson'` alone.
- [ ] Add metadata-only candidates from the spec: Arduino Uno R4 Minima/WiFi, Nano Every, Nano ESP32; ESP32-S2/H2; STM32 NUCLEO-L476RG; Raspberry Pi Pico 2 W. Research each exact variant from the board maker's primary documentation before adding facts.
- [ ] Keep existing boards and IDs stable, including the current Arduino/ESP32/RP2040/STM32 entries.
- [ ] Replace UI text derived only from lesson availability with status text derived from `modelStatus`; comparison still shows lesson support independently.
- [ ] Inspect the board list at `/boards`: confirm every preview explains whether CAD, an external source, or metadata alone is available and no preview opens an unrelated 3D scene.

## Task 2: Add reusable component schema and sourced starter catalogue

**Files:**
- Create: `src/data/components.ts`
- Create: `src/data/electronicsSources.ts` if not created in Task 1
- Modify: `src/data/lessons.ts` only to reference canonical component IDs where the existing shape allows it

**Interfaces:**
- `ComponentDefinition`: `{ id, name, aliases, category, variant?, package?, summary, pins, electrical, interfaces, compatibility, modelStatus, modelAsset?, sourceIds, simulationSupport? }`.
- Each pin has a stable `id`, display label, direction/type if known, and an optional warning; electrical fields are optional and must have source IDs.
- `modelStatus` uses the same four-state vocabulary as board records. `simulationSupport` is separate and optional.

- [ ] Create category unions for passive, input, sensor, display, actuator, power, and interconnect parts.
- [ ] Add the first sourced catalogue batch from the spec: resistor values and package classes, potentiometer, capacitors, diode/LED, NPN/transistor/MOSFET, button/switch/buzzer/relay, LDR/NTC/DHT22/DS18B20/HC-SR04/PIR/MPU6050/BMP280 or BME280/BH1750/soil sensor/MQ-2/RC522, SSD1306/LCD1602, rotary encoder/keypad/HX711, SG90/DC motor/TB6612 or DRV8833/28BYJ-48+ULN2003, breadboard/jumpers.
- [ ] Use manufacturer or official module documentation for pin order, voltage, current and interface. For generic modules whose schematic varies by supplier, label the record as a reference variant and state the uncertainty.
- [ ] Reuse one package model across values when geometry is identical; keep value, tolerance and rating in separate metadata.
- [ ] Connect existing lesson parts to canonical records without changing lesson behavior.
- [ ] Review catalogue records for missing aliases, source IDs, duplicate IDs, unsupported electrical claims, and variant ambiguity.

## Task 3: Build component catalogue and detail route

**Files:**
- Create: `src/pages/ComponentCatalogPage.tsx`
- Create: `src/pages/ComponentDetailPage.tsx`
- Create: `src/components/ComponentCatalogCard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Route `/components` renders the full catalogue.
- Route `/components/:componentId` renders sourced detail or a not-found state.
- Search uses name, aliases, variant, protocol, package and category; filters use the schema categories.

- [ ] Add category filters and accessible search controls to `/components`.
- [ ] Show model status and simulation support as separate badges; never show a 3D action for metadata-only items.
- [ ] Add detail sections for purpose, pinout, electrical facts, compatible boards/modules, safety notes and evidence links.
- [ ] Render missing technical fields as “chưa có dữ liệu xác minh”, not guessed defaults.
- [ ] Add responsive styling that matches the dark Mạch Mở design system and reuses existing focus/contrast patterns.
- [ ] Manually navigate from the lesson's parts and from board detail into the canonical component detail; check direct URL and unknown ID behavior.

## Task 4: Document model intake and asset manifest

**Files:**
- Create: `assets/models/README.md`
- Create: `assets/models/manifest.json`
- Modify: `src/data/boards.ts` or `src/data/components.ts` only where an approved asset is actually imported.

- [ ] Document accepted source formats, required provenance, archive checksum, revision, license/attribution, unit/orientation normalization, and validation evidence.
- [ ] Define the manifest fields for board ID/variant, source URL, access date, checksum, source license, derived asset path, conversion tool/version, component count, omitted components and reviewer status.
- [ ] Do not bulk-download or package third-party CAD merely because it is publicly reachable. Add an asset only after attribution/redistribution terms are recorded.
- [ ] Inspect manifest syntax and confirm all referenced local asset paths exist; items with no local asset stay metadata-only.

## Task 5: Build and manual acceptance review

**Files:**
- No new files expected.

- [ ] Run `npm run build` from `electronics-learning-demo` and resolve TypeScript/build errors.
- [ ] Manually check `/boards`, `/components`, and `/components/:componentId` at desktop and narrow widths.
- [ ] Confirm each electrical fact has a source, every model status is independent of lesson availability, and every asset status is honest.
- [ ] Confirm existing `/learn/esp32-led` and current board query behavior still work.

## Review Focus Mapping

- Clone/revision drift → Task 1 board variant fields and Task 4 manifest.
- Incomplete CAD package → Task 1 status mapping and Task 4 asset omissions.
- Variant pinout conflicts → Task 2 source review and per-variant records.
- Search aliases → Task 2 schema and Task 3 search fields.
- Preview routing → Task 1 UI; Task 5 direct route checks.
