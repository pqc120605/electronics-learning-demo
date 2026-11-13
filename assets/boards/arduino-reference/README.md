# Arduino reference board models

## Current web assets

The public Uno, Nano classic and Mega 2560 R3 GLBs are exported from imported board CAD files. They include PCB artwork and package bodies linked to footprints. The generator aligns package bodies by fitting KiCad footprint pad geometry to numbered pads in the imported footprint; it supports mirrored local Y frames and maps verified common package aliases.

Through-hole header footprints are intentionally left unpopulated in the 3D model. The reference CAD identifies solder pads, not whether male/female headers are fitted. This removes unsupported floating connector bodies while preserving the actual pads. Missing 3D bodies remain visible as pads/footprints instead of guessed geometry. USB shells are not pad-fitted because mechanical mounting tabs vary across connector models. Model nodes retain footprint reference names for component hover/selection.

KiCad package bodies depict standard package geometry, not manufacturer-specific scans, markings, or proof that an individual clone uses the exact part. Passive bodies can differ from the physical component while remaining aligned to the CAD footprint. The Nano source schematic names IC3 as ATmega328P-32MUR, matching the QFN/VQFN body used here; this is not the TQFP Nano package variant. Pin coordinate picking is disabled until anchors are mapped to actual pads.

| Board | KiCad import | Web GLB | Source reference |
|---|---|---|---|
| Arduino Uno R3 | `arduino-uno-r3-official-import.kicad_pcb` | `public/models/arduino-uno-r3.glb` | `upstream-cad/UNO-TH_Rev3e.brd` |
| Arduino Nano classic | `arduino-nano-classic-official-import.kicad_pcb` | `public/models/arduino-nano-classic.glb` | `upstream-cad/nano-classic/A00005-cad-files/NanoV3.3.brd` |
| Arduino Mega 2560 R3 | `arduino-mega-2560-r3-official-import.kicad_pcb` | `public/models/arduino-mega-2560-r3.glb` | `upstream-cad/mega-2560-r3/A000067-cad-files/MEGA2560_Rev3e.brd` |

## Re-export

Run `attach_reference_models.py` to regenerate separate model-bearing KiCad boards from the preserved imports. Export each `*-viewer.kicad_pcb` with KiCad CLI to its matching `public/models/*.glb` file. Increment the corresponding version in `src/data/arduinoBoardModels.ts` to bust browser cache. The current public models are version 3.4.0.

## Source and attribution

- Uno source: Arduino Uno Rev3 CAD files supplied in this project; see `upstream-cad/License.txt`.
- Nano source: [Arduino Nano documentation](https://docs.arduino.cc/hardware/nano/) and included archive license.
- Mega source: [Arduino Mega 2560 Rev3 documentation](https://docs.arduino.cc/hardware/mega-2560/) and included archive license.
- The Arduino hardware design archives include CC BY-SA 4.0 licensing. Retain attribution and share-alike terms when distributing derivatives; review each included license.
- KiCad package 3D models: [KiCad 3D model license](https://github.com/KiCad/kicad-packages3D/blob/master/LICENSE.md).

## Remaining CAD work

The interactive lesson currently has eight board reference models: ESP32 DevKit V1, Uno R3, Nano classic, Mega 2560 R3, three Raspberry Pi Pico-family boards and one community Blue Pill-style design. Arduino GLBs were regenerated to align supported package bodies and remove unsupported fitted headers. Other catalog entries (ESP32-C3, ESP32-S3 and NUCLEO-F401RE) remain previews, not interactive 3D boards. ESP32-S3 source CAD exists locally as PADS ASCII, but KiCad's Non-KiCad Board importer rejects this `.asc` file as unsupported. It has not been converted, fitted with package bodies, checked against source placement/BOM, or cleared for redistribution as a derived educational asset. The NUCLEO-F401RE Altium project is present locally but has not been converted and validated. Do not add a preview to the lesson selector until its GLB and component references are validated. The earlier `generate_boards.py` creates rough placeholders and is no longer the source of public Arduino GLBs.
