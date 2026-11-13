# User sample — ESP32 DevKit V1 Type-C, 30-pin

- Received: 2026-11-06 in Box03.
- User selection: use the 30-pin version; the two supplied photos show USB-C and the silkscreen `ESP32 DEVKIT V1 TYPEC`.
- User's later choice: use the CH340-family USB-UART variant. No seller/source link is available; exact suffix and installed chip marking remain unverified in the photos.
- Image 1 (component side, USB-C at lower edge, antenna at upper edge): `esp32-devkit-v1-type-c-front.png` — SHA-256 `D8A012C56C984E3AD38A3ECFC9CE183D6848FD0212181416AEDBB63EEC9AECA9`.
- Image 2 (back side): `esp32-devkit-v1-type-c-back.png` — SHA-256 `D810A3D166E1A94ACA2165853C357CE7D9D52B22B6F022C0041F07E03BAC1CC3`.

## Visual observations only

- Two rows; user identifies the board as 30-pin and the photos appear to show 15 positions per row.
- Four corner mounting holes; USB-C connector at one short end; antenna at the opposite end.
- Back silkscreen reads `ESP32 DEVKIT V1 TYPEC`.
- The photos have no scale. Board outline, hole dimensions/centers, pin pitch/row spacing, pin 1 orientation, keepout, component height, USB bridge/regulator markings and PCB revision remain UNKNOWN.
- The images do not prove the board is the same PCBA as the SnapMagic DOIT listing or its 30-pin CAD.

This is user-provided identification evidence, not a dimensional drawing, continuity test or electrical measurement.

## Preliminary silkscreen transcription

Box03 checked the row orientation against the component-side photo. Hold the board with USB-C at the bottom and antenna at the top, component side facing up:

- Image-left row, USB-C to antenna: `VIN`, `GND`, `D13`, `D12`, `D14`, `D27`, `D26`, `D25`, `D33`, `D32`, `D35`, `D34`, `VN`, `VP`, `EN`.
- Image-right row, USB-C to antenna: `3V3`, `GND`, `D15`, `D2`, `D4`, `RX2`, `TX2`, `D5`, `D18`, `D19`, `D21`, `RX0`, `TX0`, `D22`, `D23`.

This corrects an earlier left/right reversal in Box03's first transcription. It is only a transcription of visible silkscreen; it does not verify GPIO function, pad numbering, pin-1 convention or electrical connectivity.

The visible label sequence matches the common DOIT 30-pin reference diagram published by [CIRCUITSTATE, revision 0.1 (2022-12-17)](https://www.circuitstate.com/wp-content/uploads/2022/12/ESP32-DevKit-V1-Pinout-r0.1-CIRCUITSTATE-Electronics.pdf). This comparison does not identify the photographed board as DOIT and does not verify its electrical nets.

Box09 found a retailer listing with multiple nominally 30-pin variants: Type-C CH340C (EP000723) and Type-C CP2102 (EP003962), as well as Micro-USB variants. [EasyWare listing](https://store.easyware.id/produk/esp32-devkit-v1-30-pin-micro-usb-type-c/). The page does not connect any SKU to this sample. Its approximate dimensions must not be applied to the photographed board without a match.
