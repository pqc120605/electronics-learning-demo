# Draft only — finite H3/OFF/actuator evidence requests

Not sent. No vendor/manufacturer contact, purchase or product specification commitment is authorized by this file. Founder may transfer a request after choosing the exact candidate and confirming the application envelope. A reply is evidence at its stated guarantee/characterization level, not automatically a gate PASS.

## H3 — TI TLV9031 family application limits

Current screening retains charger BQ25170 family at4.05V; independent protector must distinguish CV MAX4.0824V from its allowed trip/energy window below pack4.200V. This is an application requirement, not a claim that a TLV9031 meets it. Candidate orderable/package remains to be chosen.

Please state guaranteed versus characterized limits (including process/temperature/supply and measurement definitions), or explicitly state that the following are not guaranteed:

1. Input bias/leakage magnitude, including input/common-mode dependencies, over the worksheet supply4.75–5.25V, common-mode approximately2.5V and junction-temperature−40…125°C. Datasheet5pA is TYP and cannot fill a MAX allocation.
2. Applicability of offset/CMRR/PSRR bounds to that supply/common-mode range. Current PSRR published conditions stop at5V and cannot silently cover5.25V.
3. Maximum detector response for a positive-going input differential reaching20mV, with specified ramp profiles, capacitive load and pull/output loading; startup/undersupply/brownout behavior before a valid reference. Step/ramp profile and output loading must be agreed; a100mV overdrive typical delay is insufficient.
4. Whether there is an application-supported way to hold the complete downstream protection path OFF until valid sensing/reference exists. Include failure applicability and limitations, not merely an EN command state.

Do not request another guarantee from TPS3760 for the existing divider/window: its screening interval already exceeds that window and its20% overdrive timing is outside the cell ceiling. LTC4079 is not a selected replacement charger.

## Reference and ratio network

For a subsequently selected reference/network, specify initial, temperature, line/load, solder/thermal-history and aging contributions separately. Current ADR45 solder shift/aging data are typical. A finite design life, temperature history and qualified process must be specified before requesting an applicable aging allowance; these inputs are currently not approved. Do not frame this as a guarantee for infinite life. Do not invent a manufacturer MAX by adding an arbitrary safety factor to TYP.

## Actuator — exact shortlist only after geometry needs stabilize

For Takaha SSBH-0830-01 or Adafruit2776, request the exact winding/variant drawing and: resistance tolerance at a defined reference temperature plus cold/hot range; net force versus stroke after internal return/friction; minimum available force across supply and hot winding; unpowered drag/remanence and return force; transient thermal limits for3s energization and the approved repeat interval; moving mass and spring/guide life data. Current0.30N gate contract is not enough for the additional P2 selector drive0.40–0.45N allocation.

Request a bound or record a missing bound. Do not infer hot MIN force from a20°C curve or label an unsourced±10% coil tolerance as an actual part specification. A quoted landed cost and assembly process capability remain separate evidence, not derivable from CAD/FE.

## If only characterization is available

Retain the missing design bound; propose an alternative topology, a bounded qualification/disposition requiring Founder approval where outside D10, or a concrete product tradeoff. One measured prototype does not establish a guaranteed full-lot bound. No repeated broad request or another IC rename constitutes closure.
