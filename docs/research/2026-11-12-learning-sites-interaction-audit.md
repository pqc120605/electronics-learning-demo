# Electronics learning websites: interaction audit and Mạch Mở adoption plan

**Observed:** 12 November 2026  
**Purpose:** Compare the usable interaction patterns in Electronics 101, Learn Arduino and Learn ESP32, then turn them into an evidence-based implementation order for Mạch Mở.  
**Method:** Interactive browser review in isolated contexts. Findings below are labeled as observed behavior, displayed site claims, or product recommendations.

## Executive summary

The references make their lessons feel connected by keeping the board/assembly, a circuit explanation, component information and code in one workspace. Their strongest pattern is contextual cross-probing: selecting a visible part can open its explanation, while lesson-specific controls and code stay nearby.

Mạch Mở should adopt that interaction model in its own visual language. It should not copy the sites’ code, lesson text, images, 3D assets or exact layout. Mạch Mở already has a more explicit technical foundation in its interactive-electronics spec: stable `partId/pinId`, a canonical circuit document, separate simulation providers, source provenance, and synchronized schematic/breadboard/3D views. The priority is to make those contracts real in the visible product before broadening the lesson catalog.

The first priority is correctness and consistency: a switch, wire edit, lesson change or run must update every affected view and clear traces that belong to an old run. Next, complete one end-to-end lesson with exact editable wire endpoints and a proper schematic. Then add sensor stimuli and sourced part inspectors, before migrating lessons in small verified groups.

## Scope and evidence limits

I inspected each site’s main navigation, lesson selector, lesson information panels, 3D scene controls, component information and circuit/schematic presentation. I interacted with representative lessons and controls:

- Electronics 101: `Closed loop` followed by `Conductors & insulators`; Overview, Components, Circuit and Maths panels; switch/material controls; chart controls; lesson navigation.
- Learn Arduino: the LED and button lessons; Overview, Pinout, Example and Specifications; component drawer/inspector; schematic and current-flow controls; 3D controls; lesson navigation.
- Learn ESP32: the two-LED and distance-meter lessons; Overview, Pinout, Example and Specifications; component drawer/inspector; sensor interval slider; schematic and 3D controls; reference/settings/language navigation.

The visible lesson catalogs contained 9, 16 and 20 lessons respectively. I did **not** exhaustively complete every lesson or every boundary case in all 45 lessons. Responsive behavior on narrow screens, keyboard-only completion of every activity, network failures and all lesson-specific model calculations remain **NOT_RUN**. This is a feature-family audit, not a full compatibility or technical-validation certification.

Run/upload controls can touch physical devices. I did not grant a serial-port permission or verify any board operation. On Learn ESP32 I accidentally clicked Run once; when the page displayed “Connecting to ESP32 on USB…” I immediately stopped it. No serial permission was granted and no physical result was observed. Both references’ run/upload behavior is therefore **NOT_RUN for real hardware**; their on-screen messages are not evidence of a flash or measurement.

## Feature comparison

| Feature family | Electronics 101 | Learn Arduino | Learn ESP32 | Mạch Mở adoption |
|---|---|---|---|---|
| Learning path | 9 foundational topics from open/closed circuits through breadboard, multimeter and Kirchhoff | 16 Arduino lessons from board discovery and LED/button through sensors, motors and a final project | 20 ESP32 lessons spanning GPIO, sensors, Wi-Fi/Bluetooth, motors and projects | Build connected electronics and embedded tracks with outcomes and prerequisites; keep lesson steps tied to the same circuit document. |
| Main visual | Interactive 3D circuit workbench | 3D board plus breadboard assembly, part callouts and a floating schematic | 3D ESP32 assembly plus breadboard, schematic and sensor/obstacle scene | Keep 3D as an assembly projection. Every modeled wire endpoint must match the canonical pin/pad/hole; label illustrative geometry as such. |
| Circuit explanation | Circuit and Maths panels explain a loop and its displayed current | Schematic shows board pins, LED/resistor/power; toggleable current-flow view | Lesson schematic shows sensor/board pins, power, ground and bus connections | Use a real schematic projection with symbols, labels, junctions and selectable nets, driven by the same topology as the assembly. |
| Part discovery | Clickable experiment objects such as material, contacts and bulb | Component drawer and part inspector, plus 3D hotspots | Component drawer, 3D hotspots and inspector controls | One inspector keyed by stable part identity: role, pins, variant, source/revision, model support and limits. Unknowns remain unknown. |
| Code and output | Readouts/chart support the experiment | Lesson code panel, controls, serial monitor and copy action | Code panel, serial monitor, editable timing parameters and sensor stimulus | Keep educational subset traces distinct from firmware execution, SPICE and physical measurements. Map only supported typed events to code, pins, nets and parts. |
| Controls | Rotate/zoom/reset/top view, chart fold/resize, material/switch controls | Rotate/zoom/reset, mini-map, current-flow and schematic toggles | Rotate/zoom/reset, schematic resize/hide, component navigation, sensor interval | Preserve useful camera/panel controls, but make the canvas operable through keyboard and a non-canvas endpoint/part list. |
| Progress | Lesson count shown | Lesson progress shown | Lesson progress shown | Record completion from verified learning criteria, not merely opening a lesson or pressing Run. State actual local-storage durability. |

## Observed behavior and defects

### Electronics 101

- The lesson workspace exposes a 3D scene, selectable experiment objects, a chart, lesson navigation and four information views. Moving from Closed loop to Conductors & insulators changed the lesson title and experiment objects.
- In the Closed loop lesson, the Circuit panel described the switch as closed and the Maths panel showed current flowing. After I activated the switch control, the displayed current remained `300 mA` and the Maths explanation still described a closed switch/current flow. This is a **state synchronization issue observed in the tested interaction**; I did not inspect the site’s implementation to determine its cause.
- On the Conductors page, the Chart offers fold and resize actions. Playwright could not activate “Fold the chart away”: the 3D `#board-canvas` intercepted pointer events while the automation scrolled the target into view. This is a **test-tool/UI layering blocker**, not proof that a human cannot use the control; manual verification is still needed.
- The displayed values and circuit assumptions are site content, not independently verified electronics data.

### Learn Arduino

- The Button lesson exposes a 3D assembly, hotspots for the button/input/LED/pull-down, a schematic, code, a serial-monitor area and lesson information tabs. The schematic and current-flow overlays can be toggled; the scene exposes rotate, zoom and reset controls.
- The Components drawer showed 12 component/board entries. Selecting the LED opened a part inspector with an explanation and “zoom to”/“run to see” actions. The Pinout and Example tabs showed lesson-specific content. The Specifications panel showed values such as LED forward-voltage range, a 220 Ω resistor, estimated current and a pin-current limit, but the panel did not expose source/revision citations in the inspected view. Treat these as **displayed claims requiring independent source review**, not validated design guidance.
- Clicking Run on a reference lesson produced compilation/upload status text and an output line. Because no board connection was authorized or verified, this records only the page’s displayed behavior; it does not establish that a device was flashed or that the trace came from a physical board.
- The lesson catalog showed 16 entries. Selecting the Blink lesson changed the lesson-specific code/parts while retaining the workspace panels.

### Learn ESP32

- The Distance Meter lesson showed an ESP32, breadboard, HC-SR04P, OLED, obstacle, schematic, code, component inspector and lesson controls in one workspace. The schematic toggle and resize/hide controls were available. The component inspector exposed a “Measure every” slider; changing it updated the visible interval to `600 ms` and the lesson helper text.
- The reference/help panel described scene controls, keyboard shortcuts and schematic movement. Settings and language panels were available. I inspected these panels without using Reset or Reset progress.
- The Specifications view displayed distance range/resolution, OLED dimensions/address and supply information. No source/revision evidence was visible there. Those values are **claims shown by the reference**, not independently checked specifications.
- After switching from the two-LED lesson to Distance Meter, the serial monitor still contained repeated `GPIO 2`/`GPIO 4` values from the prior lesson while the current code/scene described the ultrasonic sensor and OLED. This is a **stale-run-context defect observed across lesson switching**. Old output must not be presented as the result of the currently selected lesson.
- The accidental Run/Stop interaction is recorded above. USB operation remains **NOT_RUN**.

## Recommended Mạch Mở priorities

Priorities map to the canonical capability register at `../docs/product/2026-11-05-mach-mo-feature-depth-register.md`. They are sequenced behind the already active button-LED pilot; they do not authorize changing an active lease or expanding its file scope.

### P0 — Finish the truthful, synchronized lesson vertical slice

**Capabilities:** `WRK-02`, `WRK-03`, `WRK-06`, `WRK-07`, `LRN-02`, `SIM-01`.

Complete the current button-LED sequence already described in `docs/superpowers/plans/2026-11-12-interactive-button-led-lesson.md`:

1. Freeze and verify the canonical button/LED topology and four-leg switch mapping.
2. Emit typed code-subset events for reads, branches and writes; do not parse translated display strings.
3. Drive the schematic, breadboard/2D and 3D highlights from the same stable net/part/wire IDs.
4. Clear or invalidate a run trace whenever the lesson, source document, provider or topology changes. A stopped/stale trace must be labeled with its original run and lesson.
5. Ensure a virtual button press changes input state only; it must not change static wiring or imply measured voltage/current.

**Exit evidence:** unit tests for the stable net partition and typed events; e2e press/release path across all views; unsupported code or invalid topology yields no signal highlight; lesson change never shows the previous run as current.

### P1 — Make wiring genuinely editable and understandable

**Capabilities:** `WRK-01`, `WRK-02`, `WRK-03`, `WRK-05`, `WRK-06`, `WRK-07`, `EDA-01`, `EDA-04`.

- Add endpoint-based wire creation/edit/delete: board pin ↔ breadboard hole, hole ↔ hole and hole ↔ supported component pin. Show the exact endpoint IDs and net membership.
- Render the schematic as an electrical diagram—not cards with lines—with standard symbols, pin labels, supply/ground, branches, junctions and non-junction crossings. It remains a projection of the same canonical graph as the physical assembly.
- Provide a searchable part/net/diagnostic list and keyboard/touch paths so canvas interaction is not the only way to build or inspect the circuit.
- Keep undo/redo atomic and preserve the existing user’s circuit data through the versioned migration/recovery plan.

**Exit evidence:** e2e creates, selects, edits and deletes wires by exact endpoint; invalid edits preserve the old wire; schematic and assembly agree on topology; keyboard path works at 375 px and 1440 px; old workspace bytes remain recoverable.

### P2 — Give part and board panels reliable technical context

**Capabilities:** `EXP-04`, `EXP-05`, `CAT-01`, `CAT-03`, `CAT-04`, `CAT-05`, `WRK-08`.

- Selecting a board subcomponent, pin or circuit part opens a contextual inspector and highlights its connected net in other views.
- Show part value/unit, polarity, pin roles, exact board/module revision, provenance and confidence. Separate visual model support from electrical behavior support.
- For clone boards, distinguish sourced reference facts from inferred geometry and explicitly unknown internal components.
- Only show a “Specification” field when it has a usable source/revision; a sourced page link and conditions belong beside the claim.

**Exit evidence:** data fixtures for known, inferred and unknown attributes; source links and revisions survive lesson/project export; tests reject unsupported pin/geometry claims.

### P3 — Expand electronics lessons and instruments in validated increments

**Capabilities:** `LRN-01`, `LRN-02`, `LRN-04`, `LRN-07`, `SIM-05`, `SIM-06`, `OBS-04`, `OBS-05`, `OBS-06`, `OBS-10`.

- Use Electronics 101’s **topic progression** as a curriculum reference: open/closed circuits → conductors/insulators → voltage/current/resistance → series/parallel → batteries → AC/DC → breadboard → multimeter → Kirchhoff. Write original Mạch Mở explanations and activities.
- Add predict → change one input → observe → explain/debug steps. Progress depends on the expected circuit/evidence, not just a click or a Run button.
- Add sensor stimulus controls only when each value has units, a named model/provider, explicit assumptions and deterministic tests.
- Add multimeter, oscilloscope or chart views only for quantities a named provider actually computes. Do not reuse a stale trace, a placeholder current number or an educational trace as a measured result.
- Migrate the supported lesson catalog one lesson at a time. Mark unsupported board/profile, part or code paths instead of displaying a plausible but synthetic result.

### P4 — Improve scene ergonomics after semantic correctness

**Capabilities:** `EXP-02`, `EXP-06`.

Adopt camera orbit/rotate, reset, zoom-to-part, optional schematic dock, resizable panels and a minimap as progressive enhancements. Maintain responsive defaults, accessible labels, visible focus and a 2D/list fallback. Visual polish must not precede exact endpoints and synchronized selection.

## Product acceptance checklist

Use this as the review checklist for subsequent scoped tasks:

- [ ] One canonical circuit document owns parts, pins, wires, board profile and lesson context.
- [ ] Breadboard holes, internal strips and rails are represented with an explicit exact-board assumption/source; no wire endpoint is guessed.
- [ ] Selecting a wire/part/pin in any supported view selects the same stable identity everywhere.
- [ ] Schematic symbols and junctions express actual net topology.
- [ ] Code-to-signal animation is driven by typed events from the named provider; unsupported syntax gives no fabricated activity.
- [ ] Lesson switch, document edit or run stop invalidates stale results and states their provider/run context.
- [ ] Part/board claims show provenance and confidence; unverified values stay visibly unknown.
- [ ] Lesson steps validate observable criteria and distinguish opened, attempted, completed and evidenced.
- [ ] Local drafts remain recoverable; storage durability is stated accurately.
- [ ] E2E covers 375 px and 1440 px, keyboard/touch endpoint editing, lesson changes, no stale trace, and synchronized breadboard/schematic/3D.
- [ ] Run/upload and physical measurements are separate opt-in workflows; no browser message is represented as proof of a device action.

## Existing Mạch Mở work this audit should feed

- The approved interactive-electronics spec at `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md` already describes a canonical graph and staged delivery. Continue using it as the product contract.
- The button-LED implementation plan at `docs/superpowers/plans/2026-11-12-interactive-button-led-lesson.md` is the correct first vertical slice. This audit does not expand its active write lease or authorize starting later slices early.
- The product capability register remains the capability/depth authority; this report is research input, not a second task-state queue.

## Browser evidence artifacts

- [Learn Arduino 3D scene after rotate control](artifacts/learn-arduino-rotated.png)
- [Learn ESP32 Distance Meter Specifications view](artifacts/learn-esp32-specifications.png)

## Sources

- [Electronics 101 — Closed loop](https://electronics-101-six.vercel.app/closed-loop)
- [Learn Arduino Red](https://learn-arduino-red.vercel.app/fr/#button)
- [Learn ESP32](https://learn-esp32.vercel.app/)
- Mạch Mở interactive electronics spec: `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md`.
- Mạch Mở button/LED plan: `docs/superpowers/plans/2026-11-12-interactive-button-led-lesson.md`.
- Capability authority: `../docs/product/2026-11-05-mach-mo-feature-depth-register.md`.
