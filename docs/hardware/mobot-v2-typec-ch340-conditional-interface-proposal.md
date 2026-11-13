# MoBot V2 · USB-C DevKit / CH340 interface proposal

**State:** conditional architecture draft; not an approved hardware configuration.  
**Target selected by user:** photographed ESP32 DevKit V1, 30 pins, USB-C, CH340-family USB-UART.  
**Decision boundary:** no pin assignment, footprint, schematic, KiCad file, bench claim, or build lease is authorized by this note.

## User decision and evidence

The user selected the photographed 30-pin USB-C sample and chose the CH340 family. The user has no seller/source link. The photos show the silkscreen `ESP32 DEVKIT V1 TYPEC`, USB-C, and two 15-position rows; the exact manufacturer, PCB revision, bridge, regulator, supply topology, and dimensions are not legible. See the [photo evidence manifest](evidence/esp32-devkit-v1-type-c-sample.md) and its recorded image hashes.

**CH340C is not confirmed on the sample.** EasyWare lists SKU EP000723 as a 30-pin Type-C/CH340C option and reports approximate board size 51.5 × 28 mm. The same page lists multiple USB-UART/connector variants and supplies no PCB revision or drawing tying EP000723 to the user's photos. Do not use those dimensions to place a socket or footprint. [EasyWare product listing](https://store.easyware.id/produk/esp32-devkit-v1-30-pin-micro-usb-type-c/)

The SnapMagic/DOIT and BrijModi Micro-USB materials are not evidence for this sample's wiring or mechanical outline. Do not transfer their USB, VIN, regulator, bridge, or protection topology.

## Advisory review so far

- Box02 completed a source-backed, advisory power/USB proposal and candidate-part shortlist.
- Box08 returned `pass to conditional draft`, with candidate parts remaining unselected and all sample-dependent limits unresolved.
- Box09 confirmed the EasyWare candidate listing but could not match it to the user's photos.
- No source schematic, continuity map, physical measurement, or bench result exists for this sample.

These are chat handoffs, not physical verification. Any later material change to this draft needs review against the new snapshot.

## Conditional architecture

The intended programming interface is the DevKit's own USB-C connector and onboard CH340-family bridge. First verify that the pictured sample actually has that bridge and the expected connection. Do not add a second USB-UART bridge to the carrier or route host D+/D− through the carrier. Espressif documents ESP32 boot-mode behavior and DTR/RTS auto-reset only when those signals are actually connected to GPIO0 and EN; the reference behavior does not prove this board's traces. [Espressif boot-mode guide](https://docs.espressif.com/projects/esptool/en/latest/esp32/advanced-topics/boot-mode-selection.html)

The paper proposal favors a hardware-enforced, fail-off source interlock:

```text
Pack 1S → TPS61023 boost → TPS259474L current-limit/eFuse candidate → Q_ISO candidate → DevKit VIN

Host USB-C VBUS → VBUS gate A → VBUS gate B → DevKit USB-C VBUS
Host CC1/CC2 and D+/D− → pass through only if the sample's Type-C wiring is confirmed
```

`Q_ISO` and both host VBUS gates default OFF. On host attach, disable the boost and pack path, isolate carrier I/O, confirm independently that the pack path is off and VIN is below a measured `VIN_SAFE`, then allow host VBUS to reach the DevKit. On host removal, stop VBUS first, wait for host VBUS and residual rails to fall below measured limits, then allow pack operation only after a fresh valid command. A delay alone and `LOAD_EN` alone do not prove a physical switch opened.

GND may remain a signal reference after the actual ground path is confirmed; switching GND is not proposed. A common GND does not prevent current through UART, reset, boot, joystick, or pull-up pins. Keep every carrier-to-DevKit signal isolated or power-off tolerant when either domain is off.

### Required power states

| Condition | Required state (proposal, not tested) |
|---|---|
| No pack, no host, no charger | Boost, Q_ISO, host VBUS gates, LOAD_EN, and carrier I/O OFF |
| Pack only | Pack path may power VIN after valid power-good; I/O opens only after rails stabilize |
| Host only | Pack path OFF; pass host VBUS only after VIN-safe and pack-off confirmations; carrier LOAD_EN/I/O OFF |
| Pack and host present | Prefer programming mode; pack path OFF; pass host VBUS only after independent safe checks |
| Handset charger VBUS present | Preserve the r7 charger veto: boost and carrier I/O OFF. Host-only DevKit programming is allowed only if the independent host/pack interlock proves the pack path is isolated |
| Ambiguous sense, loss of bias, POR, brownout, or unconfirmed rail discharge | All power gates OFF, boost OFF, LOAD_EN low, carrier I/O isolated |

The interlock must cover both insertion orders, near-simultaneous insertion, fast reinsert, sense open/short/disagreement, one gate stuck, Q_ISO stuck, loss of shared bias, and the charger-port veto. Two gates using one shared control, bias, or sense path do not provide independent protection.

## Part candidates — not selections

| Function | Candidate | Current status and limit |
|---|---|---|
| Pack-to-VIN isolation (`Q_ISO`) | TI LM73100RPWR | Candidate only. TI specifies back-to-back FET reverse-current blocking and a 2.7–23 V operating range. Verify enable default, operating point, current/inrush, off leakage at the actual voltage/temperature, and reverse stress at DevKit VIN before selection. [TI LM73100 datasheet](https://www.ti.com/lit/ds/symlink/lm7310.pdf) |
| Pack current limiting / fault disconnect | TI TPS259474L family | Candidate only. It does not alone prove the carrier is isolated from a powered USB-C host. TI warns that a powered cable connected at OUT can create OUT-to-IN stress beyond the absolute maximum rating and recommends a TVS for that transient case. A TVS is not a DC isolation switch; the clamp window and energy need calculation. [TI TPS25947 Rev. C, reverse-current protection and powered-cable warning](https://www.ti.com/lit/ds/symlink/tps25947.pdf#page=35) |
| Host VBUS pass | Two independently controlled, normally-off series gates | Second gate MPN not selected. Current limit, slew, reverse blocking, fault feedback, and common-cause behavior depend on actual board VBUS path and attach/boot/flash load. |
| `VIN_SAFE` monitor | TI TLV6710 | Candidate only. It has two open-drain outputs and a 1.8–36 V supply range. TI specifies OUTB high-impedance below UVLO and outputs undetermined below POR; the external bias/control must keep gates OFF in both cases. A comparator alone does not prove Q_ISO/boost opened. [TI TLV6710 Rev. B](https://www.ti.com/lit/ds/symlink/tlv6710.pdf) |
| USB-UART | CH340 family | User-selected family. Exact suffix, VCC/V3 configuration, and connection to UART0/GPIO0/EN remain unknown. Do not assume CH340C solely from EP000723. [WCH CH340 documentation](https://www.wch-ic.com/downloads/CH340DS1_PDF.html) |

USB Type-C current advertising is communicated over CC; the receptacle alone does not establish that this board detects the source's advertised level. Preserve the sample's CC behavior until its exact wiring is known. [USB-IF Type-C Specification R2.0, §2.3.4](https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019.pdf)

The USB 2.0 pre-configuration current clause has not yet been verified against the current USB-IF base specification. Do not use 100 mA/500 mA as a confirmed design gate here. DevKit attach, pre-configuration, boot, flash, configured, and peak current remain UNKNOWN until the applicable standard text and the exact board are checked.

## Inputs required before an exact configuration hash

### User-provided physical evidence

In Box03, provide either an overhead photo with a millimetre ruler aligned along the board edges or measurements with units and measurement uncertainty:

- PCB length and width.
- Centre-to-centre spacing between header rows; pin pitch; pin-1-to-pin-15 centre distance on each row; whether pin 1 is at the USB-C or antenna end.
- Centre coordinates and diameters for all four mounting holes.
- Later enclosure checks: board thickness, USB-C position/height/protrusion, tallest components, and antenna clearance.

These measurements gate the socket footprint and carrier outline. Do not infer dimensions from an unscaled photo or retailer dimensions.

In Box02, provide sharp macro photos of U2/USB-UART, regulator, USB-C area, and surrounding power components, or an exact-revision schematic/net map. The needed nets are USB-C VBUS, CC1/CC2, D+/D−, internal 5 V, VIN, 3V3, GND, bridge supply and UART/reset/boot connections.

### Engineering evidence still required

- Match the physical sample to a stable manufacturer/SKU/revision or record the sample as a specific unidentified unit; verify all electrical nets above.
- Select Q_ISO and both host VBUS gates with independent enable, bias, sensing, and fault response. Resolve the powered-cable transient window and all reverse paths through the DevKit.
- Calculate `VIN_SAFE`, hysteresis, gate timing, residual-rail discharge, current limit, slew/inrush, and worst-case response using exact datasheets and sample measurements. No guessed capacitance or delay.
- Verify applicable USB-IF current rules and measure the actual board's USB current during attach/pre-configuration, boot, firmware upload, and configured operation; record host CC advertisement.
- Complete fault review for both source insertion orders, sense and gate faults, POR/brownout, and handset charging while programming.

## Approval and implementation gate

This document is a conditional architecture note, not the exact MoBot configuration offered for user approval. Its file checksum, if recorded for queue traceability, is not an approved configuration hash. After the sample evidence and engineering blockers above are resolved, HQ must prepare one exact configuration revision, record its SHA-256 with `approved_by: null`, obtain Box08 review on those exact bytes, and ask the user to approve that exact hash. Only then may HQ consider a separate KiCad lease. No schematic, footprint, PCB, bench test, purchase, or device operation has been started or authorized by this draft.
