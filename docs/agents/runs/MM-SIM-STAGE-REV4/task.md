# MM-SIM-STAGE-REV4 — synchronized circuit workspace repair

## Goal

Make the supported lesson circuit readable and consistent across top-down breadboard, KiCad-inspired schematic, 3D assembly, and the 2D copper reference viewer. Keep the electrical graph and component/pin IDs authoritative; do not turn a visual or educational trace into an electrical solver result.

## Capability and exit depth

- M04 Workspace / M05 EDA / M07 Simulation presentation boundary.
- Exit depth: scoped interactive lesson views with shared topology and regression evidence; not full KiCad, Wokwi, SPICE, or physical validation.

## Root causes found

- A fresh workspace starts on the legacy assembly view even though `lessonCircuitDocs.ts` supplies canonical V2 docs for `blink` and `button-led`.
- The V2 breadboard editor exposes a 400-hole endpoint grid but does not draw mounted components or jumper-wire runs on that grid.
- The current PCB SVG is forced into a fixed 1.36:1 aspect ratio and minimum height, leaving unused canvas for boards with a different aspect ratio.
- The 3D bench uses a near-black teal material that dominates the assembly view.

## Plan

1. Add deterministic diagram geometry derived from `holeToMm`, `footprintHoles`, and the exact V2 wire endpoints; display the shared doc in breadboard, schematic, and 3D views where a supported lesson fixture exists.
2. Add a physical-style top view with holes, rails, mounted parts, insulated wire paths, selectable endpoints, and an explicit rail-geometry assumption note. Preserve the existing accessible hole editor.
3. Give the schematic a bordered drawing sheet, readable component references/values, grid and title metadata while preserving graph-derived nets and limitations.
4. Fit the copper viewer's SVG canvas to the actual board aspect ratio and light the 3D bench with a warm neutral material.
5. Add focused regression tests, then run relevant unit tests, typecheck, build, and browser checks where available.

## Safety/data boundary

No hardware design/configuration or physical claims are changed. Existing saved V4/V5 circuits remain authoritative; the built-in V2 lesson fixture is used only when the workspace is empty and the selected lesson has an explicit fixture. Unknown rail geometry remains labeled as an assumption. No user draft is silently migrated or overwritten.

## Implementation and verification — 2026-11-13

### Delivered

- Added a top-down, physical-style breadboard diagram derived from the canonical CircuitDocV2 hole/pin/wire topology. It shows the actual 400-point grid, split terminal strips, rails, mounted component footprints, jumper routing, and selectable endpoints; retained the accessible endpoint editor. The 400-tie rail model remains explicitly marked as an unverified assumption.
- Loaded supported built-in lesson fixtures consistently into breadboard, schematic, and 3D views only for an empty workspace. Existing V4/V5 saved workspace data and drafts remain the source of truth; a read-only lesson preview is not treated as an unsupported editable V2 document. Project bundle export strips local-only library linkage metadata while retaining the portable project identity.
- Updated the schematic sheet treatment with a drawing border, grid/title metadata and component references while retaining graph-derived connectivity and the explicit “ERC not run” limitation.
- Improved the 3D bench material and corrected the copper viewer's viewBox sizing so the board fills the display without the empty black region below it.
- Added regression coverage for breadboard geometry and PCB viewBox sizing. E2E coverage exercises wiring, schematic/3D keyboard interaction, cross-view state, lesson trace, accessibility, persistence, import/export and offline startup.

### Verification

| Command | Result |
| --- | --- |
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd test` | exit 0; 516 passed, 0 failed |
| `npm.cmd run build:local` | exit 0 |
| `npm.cmd run test:e2e` | exit 0; 56 passed, 0 failed (2.8m) |

### Files and SHA-256

| File | SHA-256 |
| --- | --- |
| `src/lib/breadboardDiagram.ts` | `A08B8F906F9B5821FF20192B0001021463F1A3030BEF980D7A37C6CD53EBA134` |
| `src/lib/pcbViewBox.ts` | `CD1E567BDE6B11F45611FF0B988100578F7BD45F2EBB2A21F755474635896467` |
| `src/components/builder/BreadboardDiagram.tsx` | `5DA1A0F34574F84E23BAF9F218005EF5A12F5C6A1CDB02CDEF3BBCDCE39DB1E6` |
| `src/components/builder/BreadboardEditor.tsx` | `8214DB97C0A7452ECDA9444BF54C896673B588D5286E6E36F0DC0F699D217116` |
| `src/components/builder/BreadboardEditor.css` | `31E4EF04367876BADE44EF68C287C4F1487568B01189D0EF6F20FA906B484861` |
| `src/components/builder/CircuitSchematicV2.tsx` | `A6CA09BAE47A966E1E57AF69A66DDE1C66BC728A0A913BE1048D8C7CCA146E97` |
| `src/components/builder/CircuitSchematicV2.css` | `E79ED48F73902E974AA1C36F975BB1DF70EBBEB2A319137BC0707F7867045873` |
| `src/components/builder/AssemblyScene.ts` | `82BEA82B39550B7479E6F775BD3341039D578265AB34B041D098E14815E248F2` |
| `src/lib/schematicLayoutV2.ts` | `2F009809372756A96A8E15D47BF75B9ABC96BDFBAF0D560F0E371BF58DD53CC3` |
| `src/components/pcb/Pcb2DViewer.tsx` | `E976B3C1DDE7DB14A28CDBEDA86E6FF88692552E2727C259F83B59C88E4DCB00` |
| `src/components/pcb/pcb-viewer.css` | `5C47AD47FC9B4189AD24715496FD316836690FD88E8AFDCCDBDEB3A232CBE8` |
| `src/pages/CircuitBuilderPage.tsx` | `1F95DB31E565F821BAEF075B8A9FD60A077697F9D4A40669C03793C4C095C511` |
| `tests/breadboard-diagram.test.mjs` | `2F6190D4E4E1C8680EE1B5D26B746D2D3E20A9872B75C9FEE7F7C7A25B904A74` |
| `tests/pcb-viewbox.test.mjs` | `E81A16B378A741608CBAF89085A03D9414B60B733661F8E795AE87EEAE1EC04D` |

### Limits

These are Wokwi-inspired and KiCad-inspired educational views, not clones of those products. The breadboard rail grouping is still unverified against a physical sample. Schematic connectivity is derived from the topology model and is not a KiCad ERC result. Copper display shows source CAD artwork and does not imply copper pours or electrical/thermal validation. The 3D scene is a presentation model, not a measured assembly or physical simulation.
