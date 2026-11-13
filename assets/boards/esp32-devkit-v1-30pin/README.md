# ESP32 Dev Kit Clone 30-pin reference model

The web model now comes from the supplied KiCad design, rather than the earlier generated approximation. The chosen source is the open ESP32 Dev Kit Clone project by Brij Modi. Its board is 2-layer and measures about 47.06 × 29.23 mm. It is a specific educational reference design; “ESP32 DevKit V1” clones sold by different vendors may not match its layout, components, or pin order.

## Source files

- `upstream/ESP32 Dev Kit.kicad_pcb` and `.kicad_sch` are the supplied upstream board and schematic.
- `upstream/Connectors.kicad_sch` is the schematic sheet for connectors.
- `esp32-devkit-v1-30pin.kicad_pcb` is the normalized working copy used for exports. The PCB layout, nets, routing, component values, and board outline are preserved from upstream.
- `prepare_reference_board.py` replaces the author's machine-specific CP2102 STEP path with KiCad's standard 5 × 5 mm QFN-28 package model. This generic shell shows the correct package form and size but not the CP2102 top marking.
- The stock KiCad QFN model uses the board coordinate convention. The source CP2102 footprint carried a legacy X=-90° transform for its vendor model; `prepare_reference_board.py` now clears that rotation, offset, and scale when substituting the KiCad package. `correct_cp2102_glb_orientation.py` applies the same correction to an already-exported GLB without changing its geometry buffers.
- `../../../../public/models/esp32-devkit-v1-30pin.glb` is exported from the working PCB with KiCad 9.
- `../../../../public/models/esp32-led-assembly.glb` adds the lesson breadboard, external LED, resistor, and illustrative wires. Those external objects are educational geometry; they are not part of the board schematic or an electrical simulation.

The upstream README declares the board project MIT-licensed. The archive did not contain a separate `LICENSE` file, so preserve author attribution and the upstream repository link if redistributing the design. KiCad stock footprint 3D models use KiCad's published license and exception; see the [KiCad footprint license](https://github.com/KiCad/kicad-footprints/blob/master/LICENSE.md) and [KiCad 3D model license](https://github.com/KiCad/kicad-packages3D/blob/master/LICENSE.md).

## Rebuild the reference GLB

Run in PowerShell from this directory on a machine with KiCad 9 and its standard 3D model library installed:

```powershell
& 'C:\Program Files\KiCad\9.0\bin\python.exe' .\prepare_reference_board.py
& 'C:\Program Files\KiCad\9.0\bin\kicad-cli.exe' pcb export glb --force --subst-models --include-silkscreen --output '..\..\..\public\models\esp32-devkit-v1-30pin.glb' '.\esp32-devkit-v1-30pin.kicad_pcb'
python ..\..\..\assets\boards\esp32-devkit-v1-30pin\compose_led_assembly.py
```

The viewer manifest is in `src/data/esp32DevkitModel.ts`. Its hotspot node names are KiCad footprint references (U1, J1, U2, U3, SW1, SW2, J2, J3, D1, D2, R1–R6, C1–C6, Q1, Q2). Pin anchors use the actual pad centers from J2/J3. Recheck them whenever the source layout or exported GLB changes.

## Electrical-path notes

The board schematic connects USB VBUS through D1 to the AMS1117 regulator input, then distributes 3.3 V to the ESP32 module. USB D+/D− go to the CP2102; its UART connects to ESP32 RX0/TX0. DTR/RTS drive Q1/Q2 for automatic BOOT/EN control. SW1 pulls Boot low, SW2 pulls EN low, and J2 pad 15 is GPIO23. These explanations describe the supplied schematic/netlist. The browser viewer displays geometry and explanatory paths; it does not simulate current, firmware, or electrical behavior.
