# Integration contract for the AA/manual proposal

These are design requirements and cross-branch questions, not demonstrated hardware limits. Neither branch may silently fill TBD with a typical value.

## Electrical-to-mechanical interface

- RUN power target for B01 remains nominal5V; the proposed converter must provide its actual guaranteed output envelope and current/thermal conditions. Do not infer a module's output rating from its controller switch-current number.
- Identify every battery-to-carrier and carrier-to-B01 conductor, including ground, sense, shields, pull supplies, diagnostic and expansion paths. Use role-level boundaries; do not assign physical GPIO or connector pins before exact configuration approval.
- In PROGRAM, PC may power B01. A verified physical gap must separate every carrier/B01 power/I/O path before a PC cable can mate. Battery and its source terminals must not have a route through a shield, screw, switch body, helper cable or bypass to PC power.
- Distinguish disconnected source from discharged capacitors. Declare maximum stored C/voltage/energy and possible accessible node/contact shorts during transfer. Avoid an unnecessary new sub-millisecond powered latch if physical separation removes the relevant conducting path; also avoid claiming energy is zero after unplugging.
- The holder is for three removable NiMH cells and external charging only. Source protection must address polarity, short current and unequal/mixed-cell implications. An intentionally broad protected converter input domain may be preferable to treating nominal1.2V as a cell-voltage guarantee; normal operation, protected fault range and unsupported chemistries must remain distinct.

## Mechanical-to-electrical interface

- Mandatory sequence must be enforced by a concrete keyed/captive mechanism, not solely a label or a user's instruction to unplug several wires.
- State the source and interface connector separation distances, when electrical continuity ends, when the PROGRAM port becomes reachable, and what physical object prevents re-insertion of power while a USB cable is present.
- A new source cannot be connected to B01 through an alternate RUN receptacle while PROGRAM is active. Include partial engagement and retained/welded contact examples rather than assuming commanded position proves a gap.
- PROGRAM is a service/learning operation. Internal connector work was disclosed in the chosen study direction, but reduced loose-wire handling and clear keyed positions remain design goals. No claim of beginner usability is made until examined on the proposed flow.
- Retain the previously accepted force envelopes unless a proposed change is explicitly presented as a delta. Do not require a50N spring-preload operation or revive an electric cassette-capture mechanism by implication.

## G-B/W and wireless boundaries

G-B16 and E1–E4 resource capacity remain reserved, all GPIO UNASSIGNED. A former release-control role does not justify adding a powered actuator; its retained/reserved semantics need an explicit mapping in the proposal. Avoid consuming extra MCU pins for new cell/mode sensing without a resource review.

Electrical disconnection of carrier I/O does not turn off the ESP32 radio when PC powers B01. The proposal must identify this boundary: robot command loss/fresh-arm behavior and invalid/manual PROGRAM state must not be confused with a physical RF prohibition. A firmware/protocol requirement can be documented without claiming implementation or running/flash-testing a device. Robot configuration remains separate; no robot gate is closed by this handset study.

Cold-start bootstrap must be explicit. A grant that needs B01 firmware/WDI/fresh-arm cannot be the only mechanism that first powers B01 from the AA module. Define separately (a) manual-mode power availability to B01, (b) permission for protected external outputs/robot commands, and (c) watchdog reset/inhibit behavior during startup and after a fault. Outputs default inhibited until the real qualification chain is valid. Do not bypass independent W/fault latching during startup or claim RF has a physical barrier when only MCU reset/software is present. Reuse the accepted timer/token relation only after mapping its actual grant meaning to the new architecture.

## Gate migration is proposed, not applied

If a final AA scope is independently reviewed and adopted, the handset Li-ion H3 gate may be superseded as out of scope with explicit provenance; it is never PASS merely because a charger was removed. The electric-actuator obligation would be replaced with the accepted manual-interlock/source-separation criteria. OFF, MCU/W, residual energy, BOM/source traceability, layout and operational/child-product certification obligations remain at applicable stages. Existing live r12 gate statuses and14 verification items remain unchanged during this study.

## Cost boundary

The target is the entire robot plus handset below1000000VND. Account for required NiMH cells, holder, external charger if the user has none, power conversion/protection, connectors/mechanism, B01, PCB/assembly, enclosure and robot subtotal. State what is included, dated public prices versus estimates, shipping/taxes and unknowns. Do not call removal of a complex subsystem proof that the total budget is met.
