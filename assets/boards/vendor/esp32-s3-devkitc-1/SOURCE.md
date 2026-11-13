# ESP32-S3-DevKitC-1 · PCB V1.1 · educational reconstruction

## Sources

- Official V1.1 guide and pinout: <https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html>
- Official reference-design archive: <https://documentation.espressif.com/ESP32-S3-DevKitC-1_Reference_Design.zip>
- Official PADS board layout, included in the retained archive: `work/ESP32-S3-DevKitC-1/02_PCB/PCB_ESP32-S3-DevKitC-1_V1.1_20220429.asc`
- Official BOM: `work/ESP32-S3-DevKitC-1/05_BOM/BOM(V0.3)_ESP32-S3-DevKitC-1_XX_TTNNVV.xlsx`
- Official schematic, placement drawing, Gerbers, and PCB layout PDF are retained under `work/ESP32-S3-DevKitC-1/`.
- KiCad package models: local KiCad 10 3D model library. See `public/models/esp32-s3-devkitc-1-v1.1.NOTICE.txt` for attribution and terms.

## Reproducible conversion

1. The vendor archive is retained at `source/ESP32-S3-DevKitC-1_Reference_Design.zip` (SHA-256 `25b16b894c4e104ad62640ceaf60ba7ead356105567f9471da4ce3c66ddb871a`).
2. The PADS ASCII board was imported into KiCad 10.0.7. The unmodified imported board remains under `work/kicad-import/`.
3. Run `python scripts/build-esp32-s3-devkitc-1-model.py` with KiCad 10's `pcbnew` Python module available. The script writes a derived board, the component/BOM inventory, and the 44 header pad anchors. It does not modify vendor sources.
4. Export the derived board with KiCad CLI:

   ```powershell
   & 'D:\StartupOS\.tools\kicad-10.0.7\bin\kicad-cli.exe' pcb export glb --force --subst-models --include-pads --include-tracks --include-zones --include-silkscreen --include-soldermask --define-var 'KICAD10_3DMODEL_DIR=D:/StartupOS/.tools/kicad-10.0.7/share/kicad/3dmodels' --output 'public/models/esp32-s3-devkitc-1-v1.1.glb' 'assets/boards/vendor/esp32-s3-devkitc-1/derived/ESP32-S3-DevKitC-1_V1.1-educational.kicad_pcb'
   node scripts/name-esp32-s3-devkitc-1-glb.mjs
   ```

5. The second script names each component mesh after its CAD designator and updates the recorded GLB hash. It changes only GLB node labels, not geometry.

The derived PCB/GLB source hashes and package information are recorded in `src/data/esp32-s3-devkitc-1.inventory.json` and `src/data/esp32-s3-devkitc-1.pin-anchors.json`.

## Model and accuracy status

- The web viewer provides 48 clickable CAD footprints/package meshes and 44 clickable header pad anchors.
- The board outline is reconstructed from the official PADS ASCII outline at the scale used by the KiCad import: 25.400 × 62.865 mm, 0.667 mm corner radius. The dimension PDF specifies 62.74 mm height, a 0.125 mm difference. The source outline is retained so its geometry remains aligned with imported copper and footprints; the difference is visible in the inventory and UI notes.
- PCB V1.1 uses GPIO38 for the onboard addressable RGB LED. Other revisions may differ. The guide also warns that GPIO35–37 can be occupied by memory on applicable module variants.
- The BOM identifies the ESP32-S3-WROOM-1 module family but does not lock a single flash/PSRAM variant. The viewer does not claim every V1.1 board is N8R8.
- Only the module mesh is a model for its exact package family. Most other bodies are generic KiCad package meshes selected by footprint; their marking, exact manufacturer variant, and physical placement have not been checked against a retail board.
- KiCad PADS import reported 1331 DRC findings and 3 unconnected items. The result is an educational reference only, not a fabrication-ready design, validated netlist, electrical simulation, firmware simulator, or physical inspection.

See the adjacent `NOTICE.txt` for terms, attribution, and redistribution cautions.
