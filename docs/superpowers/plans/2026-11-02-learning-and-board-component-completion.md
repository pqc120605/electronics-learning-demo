# Hoàn thiện Học tập và Board/Linh kiện — Implementation Plan

> **For agentic workers:** Complete each task in this session, test-first for behavior changes, and keep this checklist current.

**Goal:** Make learning content, board evidence, and representative component references consistent and useful without claiming physical or electrical verification that the project does not have.

**Architecture:** Keep curriculum and part identity in typed data registries; route lesson signal behavior through existing parser/simulator/trace contracts. Keep exact-product sources separate from generic teaching models and board CAD provenance. Only ship image assets with explicit reusable licenses, local copies, and visible attribution/change notes; do not hotlink them or alter CAD evidence based on photographs.

**Tech Stack:** React, TypeScript, Vite, node:test.

**Spec:** `docs/board-photo-and-module-reference-shortlist.md`, `docs/MACH-MO-MVP-STATUS.md`, and the current curriculum/component registries.

## Global Constraints

- Keep each board/module identity scoped to its exact brand/model/revision.
- Educational behavior must not be presented as firmware execution or SPICE simulation.
- Do not infer physical verification from CAD, product photos, or datasheets.
- No new dependency, paid service, license change, staging, commit, push, or publication.

## Review Focus

- Grove IR detection is active-low while the existing lesson treated detection as HIGH; test code generation, parsing, UI status, and trace together.
- Imported/custom workspace parts can differ from presets; lessons must continue resolving by type/topology, not fixed IDs.
- Board profiles with no exact 3D scene or pin evidence must remain labeled lookup-only/illustrative.
- Product reference links must not upgrade a generic component model or simulator to exact-product fidelity.
- Unknown/revision-specific source data must remain visible as unverified rather than falling back to another board.

---

### Task 1: Make the selected IR lesson match the reviewed Grove reference

**Files:**
- Modify: `src/data/builderLessons.ts`
- Modify: `src/data/curriculumSchema.ts`
- Modify: `src/lib/educationalProgram.ts`
- Modify: `src/lib/logicTrace.ts`
- Modify: `src/pages/CircuitBuilderPage.tsx`
- Test: `tests/educational-program.test.mjs`, `tests/logic-trace.test.mjs`, `tests/lesson-preflight.test.mjs`

- [x] Add failing checks that the IR sample detects an object at LOW, `parseEducationalProgram` accepts the new sample, no-object is HIGH, and active net labels match those states.
- [x] Run the focused tests and observe the expected failure.
- [x] Change the sample and lesson content to the selected Seeed Grove Infrared Reflective Sensor v1.2, SKU 101020029, with a clear notice that the product is discontinued and is a reference example.
- [x] Keep `detected` as a semantic boolean (“object detected”) and convert it to electrical HIGH/LOW at the simulator/trace boundary.
- [x] Run the focused tests, then the full suite.

### Task 2: Present component and board references with accurate scope

**Files:**
- Modify: `src/data/componentReferences.ts`
- Modify: `src/data/components.ts` only if visible display names/caveats fail to distinguish generic entries from reference SKUs
- Modify: `src/pages/ComponentsPage.tsx` only if the existing source display omits meaningful variant notes
- Modify: `src/data/boardCapabilityRegistry.ts` or board source data only for evidence-backed corrections
- Test: `tests/component-catalog.test.mjs`, `tests/data-integrity.test.mjs`

- [x] Test visible source notes for selected Grove IR, relay, MOSFET, LCD V5, OLED, TB6612, buck, boost, and servo examples.
- [x] Mark exact SKU/revision references as references, not identity of every generic catalog part.
- [x] Keep discontinued Grove IR as educational reference only; do not imply purchase availability.
- [x] Preserve board clone/official distinctions; only bundle third-party photography with a clear reusable license and attribution.
- [x] Add two locally stored, compressed Commons photos with author, source, license, and modification notes; label them as visual references only. Do not embed Mega images after Commons throttled downloads.
- [x] Run focused tests and the full suite.

### Task 3: Audit the learning and board/component flows for locally fixable gaps

**Files:** follow the existing test and registry architecture; update only relevant files in `src/data`, `src/lib`, `src/components`, `src/pages`, and `tests`.

- [x] Trace `/` → learning dashboard → curriculum → preflight → builder → component detail → board detail for route/identity mismatch using route/data integrity tests. Direct browser interaction is still blocked by localhost access in this session.
- [x] Check every published board entry for revision, source, capability evidence, and accurate viewer links via catalog/data-integrity/model-audit tests.
- [x] Check every component entry for a distinct illustration/model or explicit fallback, source scope, safety caveat, and lesson links via catalog/model tests.
- [x] Add a regression test before correcting any reproducible code/data defect.
- [x] Record external evidence or hardware-dependent questions that cannot be resolved from available sources.

### Task 4: Verify and update status

**Files:** `docs/MACH-MO-MVP-STATUS.md`, `docs/board-photo-and-module-reference-shortlist.md`, tests as needed.

- [x] Run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, and `node scripts/audit-board-models.mjs`.
- [x] Attempt to inspect the final routes in browser; report the localhost access limitation.
- [x] Update test counts and distinguish code/data verification from physical board verification.
- [x] Leave changes unstaged and uncommitted.
