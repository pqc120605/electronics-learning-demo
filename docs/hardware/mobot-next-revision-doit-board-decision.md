# Hardware target selection — ESP32 DevKit V1 Type-C, 30-pin

- Related tasks: MM-HW-MOBOT-IF-001, MM-HW-MOBOT-REMOTE-KICAD-001, MM-HW-MOBOT-ROBOT-KICAD-001.
- Decision owner: User.
- State: the user selected the photographed 30-pin USB-C sample; exact manufacturer and PCB revision are not identified.
- Source: user response and two board photos supplied in Box03 on 2026-11-06.

## Outcome

Use the user's photographed sample, visibly marked `ESP32 DEVKIT V1 TYPEC`, as the target board for the next MoBot configuration. The user confirmed the 30-pin version. Photos show USB-C, two 15-pin rows, four corner mounting holes and the antenna at the opposite end from USB-C. Treat these as visual identification only; there is no scale in the photos, and the maker/revision markings are not legible.

The user has now selected the **CH340-family USB-UART variant** and says no seller/source link is available. Use CH340 as the design direction. `CH340C` (the Type-C option EP000723 in one retailer listing) may be used as a working candidate for research, but the exact suffix and installed bridge on this sample remain unverified because the chip marking is unreadable. Do not claim that retailer SKU identifies the user's board.

The earlier SnapMagic `ESP32-DEVKIT-V1 / Do it` listing and downloaded CAD are **reference candidates only**. Box09 found no unique PCBA SKU or PCB revision in that listing. The visible silkscreen sequence matches the common DOIT 30-pin reference pinout, but this does not identify the photographed PCB as DOIT or verify its electrical nets. A retailer lists at least two 30-pin Type-C variants, CP2102 (EP003962) and CH340C (EP000723), but no source links either SKU to this sample. Do not assume the listing's footprint or the DOIT `ESP12E` V0 schematic matches this USB-C sample. Box02's V0 analysis is not evidence for the photographed board's actual power path. Box03 must reconcile dimensions, pin order/orientation, USB-C clearance, holes, antenna keepout and mating parts against this sample. Box02 must identify the bridge/regulator markings and verify the USB-C board's supply/data topology or leave those facts UNKNOWN.

The photos and hashes are recorded in [the user-sample evidence manifest](evidence/esp32-devkit-v1-type-c-sample.md). The SnapMagic CAD source/hash manifest remains at `docs/research/downloads/snapeda-doit-esp32-cad-sources.md`; its files are not validated against the sample.

## Review and build gates

Box08's `changes_requested` verdict applies to the earlier DOIT-listing/CAD readiness snapshot, not this newly selected sample. Box08 must review an integrated snapshot after Boxes02/03 reconcile this sample and the outstanding carrier safety findings. Prepare a new exact configuration revision/hash only after the sample's electrical and mechanical identity is sufficiently established. The user must approve that exact hash before any schematic, PCB, CAD or firmware build lease.

R7 bytes and approval fields remain unchanged. No KiCad lease, bench test, purchase or physical-device operation is authorized by the sample selection.

## Exit evidence

- Exact board identity or a stable sample identifier; clear component/PCB markings and supplier/SKU if available.
- Measured outline, thickness, row spacing, pitch, pin 1 and pin order, hole centers/diameters, USB-C position/clearance, antenna keepout and component heights.
- Exact USB bridge, regulator and protection-device markings; schematic/net continuity for USB-C VBUS, data, 5 V, 3.3 V, VIN and ground.
- New configuration proposal/hash, independent review, and user approval tied to those exact bytes.
- Remaining carrier-side break-before-make, backfeed, latch, USB current, battery/charger, motor and thermal issues closed for the applicable carrier.
- Physical and bench claims remain UNKNOWN until separately authorized checks are actually performed.
