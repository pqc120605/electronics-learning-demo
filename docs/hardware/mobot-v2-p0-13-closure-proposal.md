# P0-13 — proposed engineering closure, revision1

2026-11-10. Proposal only; no exact configuration/hash/MPN approval, gate PASS or build lease. r12 is unchanged at SHA256 8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b. G-B16/E1–E4, W limits, M-A, pack4.200V ceiling and full I/O isolation remain current requirements.

## What changed technically

P0-12 was a screening/documentary checkpoint. P0-13 advances actual topology and geometry proposals and subjects them to native independent review; returned read-only results are preserved under docs/agents/runs/MM-HW-P0-13/. Neither helper calculations nor an accepted document is a gate verdict.

### OFF/MCU proposal E-P2

Separate safety branches A/B, each with its own qualified bias, supervisor/reset, watchdog, fault-dominant state, proof inputs and permission driver. Four ISO7041F candidates are proposed, two per branch. Both branches receive the four MCU request roles; diagnostics only return observations to B01. Do not route a diagnostic back into fault clear, MR or permission. A/B receiver chips, local supplies/OE/pulls/latches and MR drivers are separate. Shared MCU request lines and source star points still need fault-injection/isolation bounds, not just different net names.

The ISO7041F refresh-enable pins are not output-enables. Proposal keeps refresh enabled and uses local SN74LVC2G125 candidates plus pulls/defaults for mode gating. Output on an unpowered receiver is not assumed LOW. Source remains proposed until startup, partial bias, clamp/backfeed and output loading are bounded.

Each safety branch has independent continuous qualifiers for ARM-LOW, OFF proof, and RELEASE-LOW. Candidate TPS3808 CT=VDD provides release180–420ms (datasheet SBVS050N p7); this does not supply missing assertion/race bounds. Required predicates:

- ARM: H AND K AND WAIT_ARM AND NOT FRESH_ARM_REQUEST.
- OFF: H AND OFF_VERIFY AND O.
- RELEASE: H AND OFF_READY AND O AND N AND NOT RELEASE_REQUEST.

H means valid bias/reset/watchdog/crossing readiness; K means locked-position proof; O means physical source/isolation and RUN/JOY rail-low proofs; N means neutral/precommit. A FALSE predicate holds MR LOW continuously. Fault/proof loss directly clears the relevant token/grant. A valid edge consumes a completed qualification; HIGH resets the LOW timer while the grant is held separately by state and remains proof-dependent. Fault dominates a simultaneous request, and recovery cannot reuse a stored edge. Actual recovery/removal, short invalid pulses and propagation bounds still require implementation proof.

Screening subtotal36 identified ICs (4isolators,10buffers,8supervisors,2watchdogs,8latches,4TMUX) excludes remaining logic/regulators/current limiting/JOY power/H3/actuator. At the cited100kbps/no-load rows, core worksheet current is864.8µA; not a full mode MAX. All 16 GPIO roles stay UNASSIGNED. Aux20mA is not established for the whole system by this subtotal.

The OFF worksheet with assumed source-isolation≤20ms, unchanged RC rail model and qualifier≤420ms is3.143167s, leaving0.856833s within4s for remaining bounded stages. ISO7041F input-power-loss default may take750µs under its stated conditions; it does not bound the entire brownout. Conservatively adding it ahead of the12.65ms watchdog leaves6.60ms of a20ms deadline, with assertion/logic/source-isolation still unproven.

### H3 proposal and rejected alternatives

Keep BQ25170 family screening at CV4.05V and two complete independent protection paths. Proposed functional chain is charger OUT and all upstream stored-energy capacitors, then two limiting resistors, then two opposite-MOS cutoff stages to pack; every sense/bias/default/reverse/bypass path must be covered. This is not a selected or validated circuit.

TPS3760 adjustable monitor screening gives4.093101789–4.186925465V with the stated resistor/leakage allocations; it exceeds the existing4.110V trip allocation. Its delay MAX at20% overdrive cannot be applied to a small-overdrive crossing before4.200V. LTC4079 is not a proven charger replacement. Do not rename another IC and claim the gap is solved.

Existing55.922µs budget remains conditional on actual Ipeak, overdrive/ramp definition, Cmin/ESR after a capacitor failure, driver/MOS response, parasitics and topology. Reference lifecycle/solder/temperature allowances and proper comparator conditions remain missing. DATA-REQUEST-DRAFT.md identifies the exact questions and distinguishes guaranteed MAX from characterization; no inquiry was sent.

### Actuator and M-A geometry P2

Keep C11 retention sections/contact geometry. Proposed M-A has two-track selector, neutral structural interlock, guard/shoulder before the release throat, and no100N user-force path through the actuator plunger. P2 specifies follower8.00±0.02mm, guide span24–26mm, selector stroke3.00±0.05mm, neutral u0…0.30mm, inhibit stopu0.80±0.05mm and throatu1.50±0.05mm. Intermediate land must prevent a diagonal path into RELEASE; actual swept geometry is not yet proven.

Unload0.90mm at≤5° with loss≤0.30mm leaves separation0.596575mm, margin0.096575mm over0.50mm. Calculated key/frame/button section stresses are screening of ideal sections, not proof of assembly/contact/fragment/datum behavior. Proposed clearance0.30mm depends on an unproven assembly deflection allowance0.15mm under combined loads.

Independent QA corrected the capture corner: over mass3–5g, drive≤0.45N for1ms, initial speed≤0.02m/s, remaining extra energy≤45µJ, return≥0.25N and residual≤0.10N, worst listed corner is3g, not5g. Conditional total advance0.684mm leaves0.116mm of an allocated0.80mm capture distance. Energy partition must exclude work already counted in drive. These are design input requirements, not supplier guarantees or physical observations.

More importantly, guard-rút-trước P2 has a valid counterexample: follower0.01mm from throat at0.10m/s reaches commit in0.1ms after bias loss;100N hand work over that distance is1mJ. Selector stopping arithmetic does not bound follower/hand energy. This topology has not demonstrated the current loss-of-bias locking obligation. Box08 confirmed this is a local topology counterexample, not impossibility of every M-A design.

Founder decision requested in MECHANICAL-DECISION.md: permit analysis of a bounded0–1ms revocation exception only after proven physical-OFF and valid release permission, or retain current locking requirement and replace this guard topology. Neither choice is inferred or applied. No CAD/FE is requested as a way to hide an unresolved topology failure.

Actuator nominal current/force/catalogue data are insufficient to close the product budget. A clearly hypothetical±10% coil sensitivity gives pack3.210104A at the assumed corner, exceeding3A continuous, and therefore refutes a proof based only on20J nominal; it does not establish that the real actuator fails. Sequential permission/actuation may be analyzed only with a mechanically consistent retained state and fault proof; no product sequence change is selected.

## Independent review disposition and remaining gate evidence

| Gate | Progress | Still needed before proposing PASS |
|---|---|---|
| OFF | Separate branch topology, mixed-bias alternative, continuous qualifier predicates, finite conditional RC budget | Actual domains/current limiting, crossing/source/logic/sense/default bounds, isolation feedback and single/common-fault proof |
| MCU | G-B16 fit, no hidden GPIO, W-only limitation retained; independent low qualification and fault-dominant state proposed | Actual logic/race/reset/partial-bias bounds and implementation-level proof, not a block diagram |
| H3 | Concrete energy chain, new monitor screening rejected by interval/timing, exact data questions | A compatible complete protector with simultaneous static/dynamic/fault bounds; no unsupported replacement charger or lifetime MAX |
| ACTUATOR | Reproducible geometry ranges, analytic section/unload/capture calculations and identified loss-bias counterexample | Resolve product decision/topology, then approved bounded geometry analysis; force/duty/source/thermal and product cost/fit evidence |

Native independent receipts include BOX08-MECHANICAL-REVIEW.md, BOX08-MECHANICAL-P2-REVIEW.md and BOX08-ELECTRICAL-P2-REVIEW.md. No lead mirror of a PASS gate envelope is created.

## Subsequent exact-scope results — no change to r12

Founder answered “Cho phép khảo sát ngoại lệ có cận (đề xuất)” to MECHANICAL-DECISION.md. Receipt is founder-analysis-receipt.json. This authorizes only the0–1ms exception study, not its final product acceptance or CAD/FE.

The actual weak-guard study does not establish≤1ms: at1g/1.2mm/net0.06N the free-return model takes6.325ms, before detection/decay/seating. This is local to that assumed corner, not a universal lower bound. A separate stored-user-energy study gives a conditional0.8964ms free-motion budget, but independent QA identifies both an incomplete opening-work phase and missing engagement geometry when the follower occupies the throat. Its432N average arrest force in a proposed0.20mm stop is not covered by the200N retention proof. Both studies remain NOT_READY; stronger springs or free-motion arithmetic do not resolve actual capture. Do not silently widen the studied window or run CAD expecting it to repair a missing topology.

E-P2 qualifier prose had a true contradiction between resetting qualification and clearing a just-issued grant. TIMER-TOKEN-PHASE.md and state-model.py supersede that ambiguous rule. The corrected model includes finite release expiry/no automatic retry and17 targeted scenarios plus458752 one-step Boolean/phase transitions. Lead ran it exit0; Box08 independently accepted the timer/expiry corrections on exact hashes in BOX08-STATE-MODEL-FINAL.md. This closes those logical findings only; physical gate realization, assertion/race/power/fault timing remain unproven.

The bounded domain-containment study gives an11.2831mA DC fault limit through470Ω±1% only if its source is≤5.25V. It also reproduces a shared-request counterexample: one input fault to5.5V with82kΩ series and100kΩ pull-down can raise the shared node to3.0492V. Stronger bias improves that case but the full loaded/dynamic source, rail and transient proof remains unresolved. No independence claim follows merely from assigning separate A/B rail names.

Box09 screened exactly two further manufacturer candidates and stopped: LTC6752HSC6-1#TRPBF H-grade offset alone consumes29.48mV of pack window before reference/divider/bias, versus27.6mV available; its MAX delay uses50mV overdrive. ADCMP600BKSZ-R2 lacks the required full-domain hysteresis/rising-offset and applicable delay MAX in the reviewed public source. These rejections do not prove no comparator exists; they prevent falsely selecting either candidate as a complete solution. See BOX09-H3-SCREEN.md for exact manufacturer URLs, conditions and limits. They were read online, not locally pinned or accepted for BOM.

An alternative source/mode product simplification was requested from Box01, recorded in BOX01-SIMPLIFICATION-OPTION.md. It is unselected and would change Q2/Q3 and the H3/actuator obligations; it cannot be treated as historical AA approval or as a gate PASS. No such delta has been applied.

## Evidence and readiness chain

Lead pure scripts calculate.py, capture-sweep.py and electrical-screen.py reproduce their explicitly conditional arithmetic. Existing SSAB/Takaha/Adafruit manufacturer artifacts were re-hashed against the prior pinned metadata. New ISO674x and TPS3760 PDFs are pinned under docs/research/downloads/p0-13; LTC4079 local fetch timed out, so its local source remains NOT_RUN and online reading is distinguished. Sources are research copies, not app/public assets.

P0-13 is now waiting at a NOT_READY engineering checkpoint after the finite studies/reviews; final exact statuses live only in canonical tasks.json. Next scope requires an applicable viable topology/source-data path for the current direction, or an explicitly authorized material research-direction change. The separate P0-12 packet remains frozen/in_review. After actual acceptance of a consistent engineering revision: reconcile historical gate-task dependencies, prepare the new proposed configuration without editing r12, obtain independent exact-byte gate review and Founder exact-hash/material approval, review trust-baseline integration, then run eligible B1 dispatch for the current configuration. Do not dispatch the stale r11 association just because PREFLIGHT003 is done. Later14 verification items and layout/BOM/operation gates retain their real stages; none is claimed measured.
