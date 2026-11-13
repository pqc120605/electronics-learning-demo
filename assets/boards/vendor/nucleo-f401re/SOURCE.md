# NUCLEO-F401RE C04 source record

Retrieved: 2026-10-29

## Target and official sources

- Target: ST NUCLEO-F401RE, MB1136 main board, revision C04.
- Product and downloads page: https://www.st.com/en/evaluation-tools/nucleo-f401re.html
- User manual: UM1724, STM32 Nucleo-64 boards (MB1136): https://www.st.com/resource/en/user_manual/dm00105823-nucleo-f401re-user-manual-stmicroelectronics.pdf
- Pinout cross-check: UM1724 Rev 17, tables for NUCLEO-F401RE/F411RE Arduino connectors (D0–D15 and A0–A5). Official mapping is surfaced in the board catalog; A4/A5 have alternate ADC/I²C functions controlled by solder-bridge configuration.
- Schematic pack: MB1136-DEFAULT-C04 Board schematic, version 1.0 (18 Aug 2022), listed on the product page.
- Design project: MB1136 Board design project files, version 1.1 (22 Nov 2024), listed on the product page.
- BOM: MB1136 Bill of materials, version 3.1 (22 Nov 2024), listed on the product page.

## Locally retained source archives

| File | SHA-256 | Contents inspected |
| --- | --- | --- |
| `source/mb1136_bdp.zip` | `66E2AA6A1CA58E787EA1717C0736A1853777F93A20A95E4D2E0273DC234EB52D` | Altium Designer `.PcbDoc`, `.SchDoc`, project and readme files |
| `source/mb1136_bom.zip` | `E6EEF6D643A4ADBA3D751F0501EF9691FEB109B82A5D8AAC354F7DF2049627DA` | BOM workbooks for multiple MB1136 MCU/board revisions, including F401RE C04 |
| `source/mb1136-default-c04_schematic.pdf` | `401F40CA598B008050E7749B5847E93CA8AA83E9A0BAE4CBCBE7A016159E57C1` | Official C04 schematic PDF |

Hashes use SHA-256 over the unchanged downloaded files. Work copies are under `work/`; source archives are retained unchanged.

## License and redistribution decision

ST's Open Platform License Agreement (OPLA): https://www.st.com/resource/en/license_agreement/open_platform_license_agreement.pdf. The agreement grants limited use of Reference Material to evaluate, test and develop application boards based on ST products, while restricting sale, lease or other distribution except where expressly allowed. This does not establish that a source-derived 3D model may be publicly distributed from this learning website.

**Decision: do not publish a derived GLB or other source-derived geometry pending explicit confirmation of redistribution rights.** Keep this board informational/preview-only. Linking to ST's product documentation is allowed in the demo; it is not a claim that the source files or derived model are freely redistributable.

## Conversion and accuracy status

The official board project is Altium-native. The available local KiCad toolchain does not provide a verified conversion path for this project, and the source package does not currently supply a confirmed complete set of per-component 3D models for the viewer. No candidate GLB has been generated or accepted. The UI must continue to label this board as preview-only; do not invent component geometry or physical pin anchors.
