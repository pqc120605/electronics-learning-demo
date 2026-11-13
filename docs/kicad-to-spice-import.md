# Import a KiCad PCB and schematic into the SPICE workbench

The KiCad import section first compares schematic/PCB connectivity for all connected component pins, then can create an explicitly partial analog equivalent. It does not simulate a complete PCB, MCU, firmware, copper, or every component.

## Before you export

Export the board and schematic from the same KiCad project state and design revision. The importer checks the pad numbers and net connectivity for supported two-pin R/C/L/V parts, but cannot prove that two separately selected files come from the same project or revision.

KiCad CLI 10.0.7 was used to verify this flow. The KiCad 10 CLI supports IPC-D-356 board export and KiCad XML schematic netlist export in its [official command-line documentation](https://docs.kicad.org/10.0/en/cli/cli.html). The [PCB Editor manual](https://docs.kicad.org/10.0/en/pcbnew/pcbnew.html) describes IPC-D-356 as a bare-board manufacturing-check netlist.

## Export the two files

From KiCad 10 CLI:

```powershell
kicad-cli pcb export ipcd356 --output board.d356 board.kicad_pcb
kicad-cli sch export netlist --format kicadxml --output schematic.xml project.kicad_sch
```

Or use the GUI export paths listed under the SPICE Workbench importer. Keep the original project files unchanged; the workbench only reads the two exported files.

## Import and review

1. Open **SPICE Workbench → Nối net PCB vào mạch tương đương SPICE**.
2. Select the `.d356` board export and the KiCad XML schematic export.
3. Review the full connectivity audit. It compares connected schematic pins with board pad records 317 (including plated through-hole pins) and 327, ignores IPC via records, checks topology by ref/pin rather than net label spelling, and keeps schematic no-connect pins separate. A mismatch does not alter any source file.
4. The partial SPICE importer separately checks pad numbers and connectivity for supported R/C/L/V. A mismatch blocks import.
5. Explicitly exclude each unsupported board component. Excluded pins are treated as open at the boundary of the partial analog circuit; they are not replaced by an electrical model.
6. If the schematic has no explicit DC voltage-source symbol, optionally declare an ideal test source between two named board nets. The input is limited to 0.01–60 V and is an assumption for this calculation, not a supply identified from the board.
7. Read the assumptions, then choose **Dùng netlist PCB tương đương trong editor**. Run the netlist from the workbench and inspect its results.

The full audit was exercised with KiCad CLI 10.0.7 exports from the ESP32 DevKit clone source project in this repository: 118/118 connected schematic pins were present on the PCB with matching net groups; 27 PCB pads correspond to schematic no-connect pins, and none shares a board net with another pad. This verifies the selected CAD exports only; it does not establish a physical board/revision match.

The file contents are read in the current browser and are not uploaded. Each file is limited to 1 MB.

## What the imported netlist covers

- PCB pad/net relationships from IPC-D-356.
- Static values from the matching schematic XML.
- Supported two-pin resistors, capacitors, inductors, and DC voltage sources.
- An explicit operating-point (`.op`) equivalent after validation.

It does not include copper resistance, via parasitics, thermal/current limits, device models for excluded components, ICs, regulators, MCU GPIO, firmware, or digital behavior. IPC-D-356 does not carry the electrical geometry needed to calculate copper parasitics. This is not ERC, DRC, hardware sign-off, or proof that a manufactured board matches the selected CAD revision.

The current ngspice WASM artifact is also not cleared for public redistribution. The release gate remains closed until the exact artifact's source commit, reproducible build/toolchain, component-license inventory, and hash-bound distribution review are documented.
