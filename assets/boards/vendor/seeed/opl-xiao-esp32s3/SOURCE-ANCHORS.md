# Seeed XIAO ESP32-S3 OPL header-anchor source

- **Creator:** Seeed Studio / Seeed Studio Fusion and OPL contributors.
- **Source PCB:** [ESP32S3.kicad_pcb](https://github.com/Seeed-Studio/OPL_Kicad_Library/blob/master/Seeed%20Studio%20XIAO%20ESP32S3/ESP32S3.kicad_pcb)
- **Source repository:** [Seeed-Studio/OPL_Kicad_Library](https://github.com/Seeed-Studio/OPL_Kicad_Library)
- **License:** CC BY-SA 4.0. The original `LICENSE` and upstream `README.md` are retained beside the source PCB. Derived anchor coordinates remain under CC BY-SA 4.0.
- **PCB SHA-256:** `9db3fe4b213f048cfe973cc2a2f3c95231b2997586f9081c5b75a1dad73aa604`
- **Variant/revision:** the PCB file is named for XIAO ESP32S3 but has no explicit board revision in its title block. Do not use it to establish the exact retail revision.

## Use in Mạch Mở

The source is used only to locate the 14 outer breakout pins in J1/J2. The generator averages the two same-net inner/outer half-hole pad centers, then maps KiCad X/Y to the axes of Seeed's official regular-board STEP v2. It uses outline-center alignment, source Y-up, and the STEP top copper surface; it applies no scale or reflection. Anchor coordinates are emitted in the same PCB-centered local frame as the GLB (the STEP-body center is subtracted exactly once). The measured outline residual is 0.095 mm along the long axis and 0.005 mm along the short axis.

The browser marks the selected pin at its projected 3D anchor and uses that same projection for pin picking, so the marker and hit target cannot drift apart when the camera moves. This confirms the CAD-to-STEP transform only; it does not validate the retail board revision or electrical routing.

GPIO numbers and functions come from the current [Seeed regular-board pin map](https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/), not from the OPL net aliases. The raw OPL net names are preserved for reference and are not used to claim that a specific retail revision has the same MCU route. This source does not create a netlist, copper trace, firmware simulation, or physical-board validation.

Recreate `src/data/seeed-xiao-esp32-s3.pin-anchors.json` with KiCad's bundled Python:

```powershell
& 'C:\Program Files\KiCad\9.0\bin\python.exe' .\scripts\export-seeed-xiao-esp32-s3-pin-anchors.py
```

The wrong-variant Seeed ZIP previously downloaded during research contained XIAO ESP32-S3 Sense v1.5 files. It was removed and is not used by the regular-board model.
