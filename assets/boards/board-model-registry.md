# Board model and capability registry

Status reviewed: 2026-11-03. A catalog listing, pin profile, logic teaching target, source CAD file, and interactive 3D viewer are separate capabilities.

| Board family / exact target | Catalog | Learning logic | Interactive 3D | Evidence and remaining gate |
|---|---|---|---|---|
| ESP32 DevKit V1 30-pin clone | Yes | Yes, teaching aliases | Yes | Source is Brij Modi 30-pin clone CAD; not every DevKit V1. Verify clone/revision before physical wiring. |
| Arduino Uno R3 | Yes | Yes, educational pin profile | Yes | Arduino Rev3 CAD import; package bodies align to source footprints. Headers intentionally unpopulated where fitted status is unknown. |
| Arduino Nano classic | Yes | Yes, educational pin profile | Yes | Nano V3.3 CAD import; source MCU is QFN/VQFN variant, not every Nano/clone. |
| Arduino Mega 2560 R3 | Yes | Yes, educational pin profile | Yes | Mega Rev3 CAD import; generic package bodies do not prove exact vendor markings. |
| ESP32-S3 DevKitC-1 V1.1 | Yes | Reference only | No | Official PADS ASCII, BOM and placement reference retained; importer rejects source format. Convert and audit redistribution terms before deriving GLB. |
| ESP32-C3 DevKitM-1 | Yes | Reference only | No | Official guide/library footprint only; no verified full board/revision CAD in runtime. |
| STM32 NUCLEO-F401RE MB1136 C04 | Yes | Reference only | No | Altium archive, BOM and schematic retained; conversion and derived-geometry redistribution rights unresolved. |
| STM32F103C8T6 Blue Pill family | Yes | Pin/reference profile only | No | Unbranded clone family; no canonical vendor/revision CAD selected. SinaKarvandi's separate custom design is archived and excluded from the standard model catalog. |
| Raspberry Pi Pico R3 | Yes | Reference only | Yes · GLB viewer | Official Pico R3 STEP converted locally to GLB; selectable CAD groups in internal viewer. CAD reference only; no BOM/netlist behavior. |
| Raspberry Pi Pico W | Yes | Reference only | Yes · GLB viewer | Official Pico W STEP converted locally to GLB; selectable CAD groups in internal viewer. CAD reference only; no BOM/netlist behavior. |
| Raspberry Pi Pico 2 | Yes | Reference only | Yes · GLB viewer | Official Pico 2 STEP converted locally to GLB; selectable CAD groups in internal viewer. CAD reference only; no BOM/netlist behavior. |
| Raspberry Pi Pico 2 H / SC1632 | Yes | Reference only | Yes · GLB viewer | Manufacturer STEP reference; J0 anchors use the non-wireless Pico layout transformed into this STEP frame. Header fit and positions have not been checked on physical hardware. |
| Adafruit QT Py ESP32-C3 Rev B #5405 | Yes | Reference only | Yes · GLB viewer | Official STEP and Eagle board placement; 14 JP1/JP3 breakout pads selectable from CAD anchors and manufacturer pinout. No MCU package pins, STEMMA contact anchors, copper highlighting or netlist. |
| Adafruit Feather ESP32-S3 #5323 | Yes | Reference only | Yes · GLB viewer | Official STEP/Eagle reference; 33/47 designators are mapped; 28 JP1/JP3 pads selectable for static CAD-net and PID-specific pinout lookup. No netlist, copper highlighting, or firmware/electrical simulation. |
| Adafruit Feather ESP32-S3 TFT #5483 | Yes | Reference only | Yes · GLB viewer | Official STEP/Eagle reference; 37/54 designators are mapped; 28 JP1/JP3 pads selectable with its distinct TFT-variant GPIO mapping. No netlist, copper highlighting, or firmware/electrical simulation. |
| Seeed Studio XIAO ESP32-S3 · standard | Yes | Reference only | Yes · GLB viewer with 14 selectable J1/J2 pads | Manufacturer STEP v2 for the standard board aligned to PCB-centered anchors from Seeed OPL. The OPL file has no explicit revision; selected-pad lookup is static and does not provide net highlighting, a netlist, or electrical simulation. Do not merge with Sense/Plus variants. |
| Seeed Studio XIAO ESP32-C3 v1.3 | Yes | Reference only | Yes · GLB viewer | KiCad PCB-derived educational reconstruction with 68 selectable footprints and 14 J1/J2 header pins. Generic package meshes; archive license caveat remains. No copper highlighting or netlist. |

Pico GLBs were regenerated on 2026-11-01 to remove a mirror defect; see `docs/board-model-sourcing.md`. The exact standard ESP32-S3 DevKitC-1 and NUCLEO-F401RE still do not have released internal 3D viewers.

## Publication gate for new viewers

1. Record the exact product/revision and source owner.
2. Retain source URL, archive hash, required attribution, and redistribution license for the derived output.
3. Import board outline and all placed packages from the board design; do not infer placements from a product photo or pinout.
4. Compare package references, location, side, rotation, and body dimensions against source CAD, BOM, and placement data.
5. Confirm top and bottom geometry, scale, orbit controls, selectable references, and known omissions in the web viewer.
6. Only then change `3dStatus` to verified and expose the viewer link. Unknown or unlicensed models stay catalog-only/preview.

## Current runtime count

Thirteen board-reference models are available in the web viewer: four ESP32/Arduino models also have PCB copper manifests, four Raspberry Pi Pico-family STEP viewers, three Adafruit CAD viewers, and two Seeed XIAO viewers. Only the QT Py and XIAO ESP32-C3 have selectable header anchors among the reference-only CAD viewers; Pico pins are separately selectable. A custom SinaKarvandi STM32F103 design remains in the source archive for provenance, but is not exposed as a standard Blue Pill model. These assets are reference geometry and lookup data, not electrical simulation or BOM-verified retail assemblies. The broader catalog contains additional MCU boards and families for comparison, but those entries must not be described as board simulations or complete 3D models. The catalog and lesson viewer show provenance, license, revision, confidence and unresolved limitations; a missing evidence record fails closed to “Chưa có model tương tác.”
