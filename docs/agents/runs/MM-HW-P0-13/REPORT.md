# P0-13 — engineering feasibility checkpoint

Date:2026-11-10. Scope: actual design proposal and bounded feasibility work toward four schematic gates, following Founder request to finish engineering rather than only P0-12 paperwork. Lead sole writer; existing Box01/02/03/08/09 provided actual returned read-only results, at most two active concurrently, GPT-6.1 Sol Medium. No direct Claude/vendor call or physical activity.

## Results

| Scope | Implemented analysis/change | Independent conclusion |
|---|---|---|
| OFF/MCU topology | Separate A/B four-isolator candidate, local buffers and continuous qualification; finite domain/feed/fan-out calculations | Channel separation is progress, but shared-input/domain fault containment and physical MAX/default/timing remain unproven |
| FSM contradiction | Explicit phase table, qualified edge consumption distinct from timer reset, finite release expiry and no automatic retry | Box08 accepted the logical corrections on exact hashes; no hardware gate accepted |
| H3 | Specific two-cutoff energy-chain obligations, two monitor/charger screenings, plus two targeted fast-comparator manufacturer screenings | No complete static/dynamic/fault-bound candidate selected; window/overdrive/aging/startup and actual R/C/MOS path proof remain missing |
| M-A | Reproducible geometry ranges, phase/force/allocation model and128-corner selector sweep | Corrected mass corner0.684mm; valid near-throat bias-loss counterexample remains |
| Authorized≤1ms study | Recorded direct Founder receipt; weak-return and distinct user-precharged spring/sear studies with independent arithmetic | Weak model6.325ms at stated corner; strong free-motion budget0.8964ms does not prove actual capture and misses an opening-work phase; no full-gate CAD/FE scope justified |
| Product alternative | Box01 prepared one3AA NiMH/no onboard charging/manual source-interface-disconnection direction | Box08 accepted presenting it for a new research-direction choice only; source/cost/UX and new interlock design still need proof |

## Fresh computations and source evidence

- calculate.py → calculations.json, exit0: ideal section/clearance/unload/gate/nominal energy arithmetic.
- electrical-screen.py → electrical-calculations.json, exit0: rejected monitor interval4.093101789…4.186925465V; conditional OFF3.143167s; conditional actuator pack3.210104A counterexample. Not actual device failure predictions.
- capture-sweep.py → capture-sweep.json, exit0:128 corners, worst3g/0.684mm under the proposed assumptions; remaining extra coupling work must be disjoint from work already integrated in force.
- guard-energy-check.py → guard-energy-results.json, exit0: local weak-guard timing, inverted force/mass/stroke requirements and distinct strong-spring work/impact arithmetic.
- state-model.py → state-model-results.json, exit0:17 named logical regressions,458752 one-step transitions, including all Boolean timer/commit/expiry/RUN-request combinations. This is not firmware, a hardware implementation, a continuous-time history proof, physical fault containment or measured timing.
- Source pins: four new TI PDFs (ISO674x/ISO7041/TPS3760/SN74LVC2G125), each header/revision cover checked;11 evidence pages rendered, two ISO7041 table pages visually inspected by HQ. Hashes/URLs/revisions in docs/research/downloads/p0-13/. LTC4079 local fetch NOT_RUN after DNS/timeout; online reading distinguished. Existing SSAB/Takaha/Adafruit source hashes matched prior pins.
- Fresh canonical queue validator runs after task administration, results in queue-validation.json. Validator code/tests unchanged from C10;61/61 from the immediately prior P0-12 reconciliation remain software evidence, not a new hardware result. No broad product tests were relevant or run.

## Review and stop conditions

Raw source chat/turn receipts are saved per returned result. BOX08-STATE-MODEL-FINAL.md accepts only the logical fix. BOX08-FEASIBILITY-FINAL.md calls for a NOT_READY checkpoint for failed guard topology, rather than more repeats or assuming CAD repairs the absent mechanism. BOX08-SIMPLIFICATION-REVIEW.md accepts only presenting a new study direction, not adopting it.

The Founder1ms answer permits analysis, not final product-exception acceptance. No automatic widening of that window, stronger-actuator purchase/selection, heavier reset action or new mechanics qualification waiver is applied. The two failing mechanism approaches are not dispatched again.

## Current design gates and B1

Four gates remain OPEN;14 verification items retain their existing states/stages. r12 remains proposed and unchanged at8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b. No r13, GPIO assignment, gate envelope, approved_by/approved_sha256, CAD/FE/schematic/KiCad or builder lease. B1 remains NOT_READY. Actual B1 still requires consistent design evidence, exact-byte independent gate acceptance, Founder configuration/hash/material approval, reviewed trust-baseline integration and eligible actual dispatch.

Next direction for Founder is concrete in NEXT-DIRECTION.md. A keeps the current engineering obligations with unresolved source/topology evidence. B authorizes research of a material Q2/Q3 and charger/actuator scope change; it does not mark four old gates PASS. The live queue is the sole task-state source; this checkpoint does not claim a continuing background agent run after all returned results have completed.
