# Seeed Studio XIAO ESP32-C3 v1.3 source record

- Manufacturer guide and pinout: <https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/>
- Source KiCad archive: <https://files.seeedstudio.com/wiki/XIAO_WiFi/Resources/XIAO_ESP32C3_v1.3_KiCad_260116.zip>
- Archive retained at `XIAO_ESP32C3_v1.3_KiCad_260116.zip`.
- PCB source: `202003511_XIAO ESP32C3_v1.3_SCH&PCB_260116/XIAO ESP32C3_v1.3.kicad_pcb`.
- Schematic source: `202003511_XIAO ESP32C3_v1.3_SCH&PCB_260116/XIAO ESP32C3_v1.3.kicad_sch`.
- The schematic contains a `CC BY-SA 4.0` annotation. Seeed's public license page states that product documents, tutorials and associated images are CC BY-SA 4.0, but the downloaded KiCad archive has no standalone license file. The derived web viewer keeps attribution/share-alike notices and flags this archive-specific ambiguity for review before broader external redistribution.
- KiCad package bodies: the installed official KiCad 3D Packages library, CC BY-SA 4.0 with the electronic-design/generated-file exception: <https://www.kicad.org/libraries/license/>.

## Generated artifacts

Run from `electronics-learning-demo` with KiCad 9 CLI installed:

```powershell
node scripts/generate-seeed-xiao-esp32c3-model.mjs
```

The script creates `public/models/seeed-xiao-esp32-c3.glb` and refreshes `src/data/seeed-xiao-esp32c3.inventory.json`. It reads the source PCB and schematic without changing them, maps BOM records to footprints, and adds standard KiCad 3D package references only for explicitly matched footprint families. There are 68 footprint records (67 BOM entries plus the back-side logo graphic) and 47 generated package meshes. Unmatched packages remain selectable as footprint records without invented component bodies.

The JSON inventory stores source archive, PCB, schematic and generated-model SHA-256 hashes. The matching distribution notice is `public/models/seeed-xiao-esp32-c3.NOTICE.txt`.

## What this source does not establish

- No inspection of a physical retail board or clone/revision.
- No electrical netlist, firmware/simulator integration, or pin-anchor picking in the viewer.
- Generic package shapes do not prove exact manufacturer part geometry or markings.
- Public rights for the source archive are documented with the ambiguity above; do not remove that notice.
