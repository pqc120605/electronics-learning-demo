# Source record — SinaKarvandi Blue Pill-style board

- Project: [SinaKarvandi/PCB-Designs, `bluepill_board`](https://github.com/SinaKarvandi/PCB-Designs/tree/main/bluepill_board)
- Captured: 2026-10-30 from the user-provided `PCB-Designs-main.zip` archive
- Archive SHA-256: `b2233f0d69fe57db2a85bc31f6817f9f44dfcb23d9be5bb19703c8ba68c8e4dc`
- PCB source SHA-256: `9ef5a5d7fa97c799bc0c3a6015c116fd8c06b868063f66ddc9827409886ec12d`
- Source revision pin: archive hash above (the ZIP does not record a Git commit ID)
- License: GNU GPL-3.0; full upstream license is retained in `LICENSE`
- Board bounds: 41.2 × 36.2 mm (from `Edge.Cuts`)
- Import: KiCad PCB source → generated 2D manifest and KiCad CLI GLB, using installed KiCad 9 standard 3D package library
- CAD inventory: 33 footprints, 51 nets and 254 copper features; 28 references have a 3D body, with `G***` and `H1`–`H4` retained as footprint-only items
- Schematic: the matching upstream `bluepill_board.kicad_sch` is preserved beside the PCB source

This is a named community design, not a canonical or universal STM32F103C8T6 Blue Pill layout. The geometry has not been checked against a physical sample or manufacturer's production BOM. Passive role descriptions are limited to CAD value, package and net evidence; no design intent is inferred from placement. The 2D and GLB files are reference views, not electrical or firmware simulation.

The GLB contains KiCad standard package-library geometry in addition to the board source. KiCad states that its libraries are licensed under CC BY-SA 4.0, with an exception for designs and generated files using library data. See [KiCad licenses](https://www.kicad.org/about/licenses/) and [kicad-packages3D](https://github.com/KiCad/kicad-packages3D). The library models were not copied as standalone files; retain the source, attribution and license links when redistributing this generated view.
