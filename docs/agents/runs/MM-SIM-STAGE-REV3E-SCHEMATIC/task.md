# Task card — MM-SIM-STAGE-REV3E-SCHEMATIC

**Owner:** software_engineer builder  
**Reviewer:** qa_safety_reviewer, independent and read-only  
**Tester:** tester, commands/browser evidence only  
**Capabilities:** WRK-02, WRK-03, WRK-05, WRK-06, WRK-07, EDA-01, EDA-04, EXP-04  
**Module:** M02  
**Dependency:** `MM-SIM-STAGE-REV3D-WIRING-UX` must be done before dispatch.

## Goal

Make the Button LED lesson schematic read like a clear teaching schematic: recognizable symbols, labeled board connections, explicit branches and non-junction crossings, and grounding/power marks derived only from the declared circuit document. Keep all projections tied to the same `CircuitDocV2` net IDs. Do not claim ERC, SPICE, measured voltage/current or KiCad validity.

## Read

- `docs/research/2026-11-12-learning-sites-interaction-audit.md` (P1 schematic)
- `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md` (§5 and §12.2–12.5)
- `docs/agents/runs/MM-SIM-STAGE-REV3D-WIRING-UX/{task.md,review.md,report.md,final-snapshot.json}`
- `src/lib/schematicLayoutV2.ts`
- `src/components/builder/CircuitSchematicV2.tsx` and `.css`
- `src/lib/circuitNetsV2.ts`, `src/lib/circuitDocV2.ts`, `src/data/lessonCircuitDocs.ts`
- `tests/schematic-layout-v2.test.mjs`, `tests/circuit-schematic-v2.test.mjs`
- `e2e/journeys.spec.mjs` cross-view selection cases

## Allowed paths

- `src/lib/schematicLayoutV2.ts`
- `src/components/builder/CircuitSchematicV2.tsx`
- `src/components/builder/CircuitSchematicV2.css`
- `tests/schematic-layout-v2.test.mjs`
- `tests/circuit-schematic-v2.test.mjs`
- `e2e/journeys.spec.mjs`

The lead owns the task queue and run artifacts. Do not edit lesson circuit data, the registry, `CircuitDocV2`, the net-index implementation, storage/schema, simulation providers or global styles.

## Requirements

1. Use the canonical net index and stable part/pin/wire/hole IDs. Schematic selection and active highlighting must continue to resolve the same identity used by the breadboard lesson.
2. Use clear conventional teaching symbols for the supported board connector, resistor, LED and pushbutton, with reference IDs and known values. Unknown/unsupported parts retain a visible diagnostic instead of receiving a misleading symbol.
3. Show board GPIO/pin labels at connector terminals. Do not infer a voltage from a GPIO alias or board-family name.
4. Draw net branches with junction dots only when they are electrically connected in the canonical graph. Visually distinguish a crossing between separate nets from a junction.
5. Draw GND/power markers only when declared wire roles support them. Do not derive current direction or numeric voltage from role or color. Conflicting roles must be diagnosed, not silently normalized.
6. Breadboard hole endpoints must remain discoverable as exact labels associated with their net; do not place arbitrary decorative hole labels that imply physical schematic coordinates.
7. Preserve keyboard selection, accessible names, readable mobile behavior and the existing “teaching schematic, not ERC/electrical solve” boundary.

## Acceptance

1. Focused layout tests verify deterministic positions, canonical net partitions, branch/junction semantics, distinct unconnected crossings, and exact hole/pin labels.
2. Render tests verify resistor value/reference, LED polarity, open pushbutton symbol, board pin aliases, GND/power role behavior, unsupported-symbol diagnostics, and accessible selection controls.
3. E2E verifies selection/highlight remains synchronized between the schematic and breadboard/code at 1440×900 and 375×812, with no horizontal page overflow.
4. The existing wire-editing/select/connect behavior from Rev3D remains unchanged.
5. `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local`, and full `npm.cmd run test:e2e` pass on the reviewed final snapshot. Record exact counts and screenshots.

## Approval boundaries

Stop and report if the task requires changing topology or stored data schemas, adding a dependency, inventing electrical values, modifying simulation semantics, or editing a path outside this lease. Do not copy competitor code/assets/text or claim feature parity beyond the tested slice.

## Handoff

Builder returns a diff and focused results; freeze and release the lease before independent review. Tester runs the full checks on the reviewed hash snapshot. Lead records the final report and queue status.
