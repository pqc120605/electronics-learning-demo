# MoBot hardware handoff · 11/11/2026

## Purpose

Hardware work is paused while the project moves to software. This handoff supersedes the hardware status section in `HARDWARE-HANDOFF-2026-11-10.md`; older decision and evidence files remain historical inputs. Do not resume design work from the older r12 state.

## Current state

- **B1 is not ready and no KiCad lease is open.** The task `MM-HW-MOBOT-REMOTE-KICAD-001` remains `waiting`, `execution_requested=false`, and still references the legacy r11 configuration. It has no active builder authorization.
- Current EVT0 proposal file `docs/mission-control/hardware-config-mobot-v2-typec-r14-handset.json` is `proposed`, not approved. Its SHA-256 is `2093df3a02a78caf26500a02ab118da21c401383f8e752fb1a67c00fe1d5f4bf`.
- There is no r15 configuration. No `approved_by` or `approved_sha256` was assigned to r14. No schematic, PCB, firmware, device test, purchase, or manufacturing work was authorized by this handoff.
- The EVT0 founder direction F1–F5 is recorded in `docs/hardware/mobot-v2-founder-decision-q1-q8.md`. It keeps the wireless handset, a 30-pin CH340-family ESP32 DevKit, three removable AA cells, external charging, and a single USB-C connection to B01. Robot remains a separate design. The sub-1,000,000 VND whole-set ceiling and child-product certification gate remain.
- Hardware measurements are unavailable because the Founder has no physical samples. Existing physical checks remain `NOT_RUN`; this does not prevent further source-backed paper analysis, but it cannot be converted to a pass.

## Accepted direction versus open engineering evidence

The Founder accepted the EVT0 design direction and the 3-AA RUN analysis dossier to continue the paper design. This acceptance is not approval of r14 bytes, an MPN, BOM, any gate, or a KiCad lease.

The four schematic gates are still **OPEN**:

| Gate | Evidence still needed |
|---|---|
| `D17-OFF-DESIGN` | Exact OFF topology, leakage and delay bounds, independent veto behavior, external-VBUS handling, and single/common-fault coverage. |
| `D17-ACTUATOR-PRODUCT` | Reconcile EVT0's manual isolation and cable-change programming flow with C4–C5; show attach/detach and mistaken external-source behavior. Do not carry forward the superseded cassette/actuator as an active requirement. |
| `D17-H3-CV-PROTECTION` | EVT0 removes onboard charging. Close the 3-AA path, reverse-current/isolation, protection, PTC, loss and recovery under load, weak-cell and brownout cases. |
| `MCU-RESET-VETO-RESOURCES` | Verify the C10–C11 interface and resource pool, passive header load ≤20 mA, and that the header cannot feed B01. No pin assignment is approved. |

The r14 verification items also remain unmeasured. Keep them `NOT_RUN`/`TBD` as applicable. D10 remains unchanged.

## Latest review and dispatch evidence

- Box 08's review of the RUN envelope retained C7, C8 and C9 as OPEN with `changes_requested`. `EVT0-3AA-RUN-DISPOSITION.md` records the review and the subsequent HQ calculations. Those follow-up calculations have **not** been reviewed by Box 08.
- Box 01's latest advisory check found B1 still waiting on r11 while r14 is only a proposal. The current validator trust baseline includes r8/r10/r11, not r14. The B1 dispatch check returned `dispatch_eligible=false` and exit 1 because active task authorization and builder mode are absent. The task dependency graph still reflects the earlier four-gate architecture and needs a lead-owned EVT0 reconciliation before any dispatch.
- Box 02's latest requested analysis did not complete. Its chat reported an account usage-limit error, so there is no new Box 02 result to rely on.
- `node ../docs/agents/validate.mjs` was reported by Box 01 as exit 0 with a clean queue. The dispatch command is expected to remain false until the configuration baseline, gate evidence, Founder hash approval, and lease are all correctly established.

## Evidence created for EVT0

Primary sources and reports:

- `docs/hardware/mobot-v2-evt0-b1-intake-2026-11-11.md` — intake and C1–C12 paper review; SHA-256 `8523ee2864af8699de416ddcb8798a10dc0777c49bf04593cd14421372c82815`.
- `docs/mission-control/hardware-config-mobot-v2-typec-r14-handset.json` — current unapproved proposal; SHA-256 `2093df3a02a78caf26500a02ab118da21c401383f8e752fb1a67c00fe1d5f4bf`.
- `docs/agents/runs/MM-HW-P0-15/EVT0-R14-REVIEW-PACKET.md` — r14 review packet; SHA-256 `f405dc502eb50cebca852b550ab8da1388398150424c77b8597746d8e3dad82a`.
- `docs/agents/runs/MM-HW-P0-15/EVT0-3AA-RUN-DISPOSITION.md` — accepted analysis scope plus Box 08 C7–C9 disposition; SHA-256 `905d035ef9b097a407a685ce97fb23c11272520aba4459bc3b56ae8b3e3524f5`.
- `docs/agents/runs/MM-HW-P0-15/EVT0-3AA-RUN-ENVELOPE.md` — RUN proposal; SHA-256 `555ae8ecd4a63a51f958fe338a39f9f56c01b238b99514d73a42bec7ec04bbb1`.
- `docs/agents/runs/MM-HW-P0-15/EVT0-3AA-SOURCE-QUALIFICATION-CONTRACT.md` — proposed OFF → precheck → internal load test → attach → RUN sequence; SHA-256 `08e480c78574b70969858382bf0f4c296bb789df4cd1b69b1c92bcc8f3255a2e`.
- `docs/agents/runs/MM-HW-P0-15/EVT0-3AA-C7-REVERSE-SCREEN.md` — conditional reverse-current screen; SHA-256 `6e25cc325c533dfc1da21e4c3b7950facd4965f34b8fc76d62ac0c7536aed184`.
- `docs/agents/runs/MM-HW-P0-15/EVT0-3AA-C7-C9-FOLLOWUP.md` — paper responses to C7–C9; SHA-256 `a47d2b9bb231119a622c9b7f010b015ffb90b62fd323842f327b66490332348f`.
- `docs/agents/runs/MM-HW-P0-15/EVT0-3AA-PRE-B1-WITHOUT-SAMPLES.md` — work that can continue without physical samples; SHA-256 `790065e046acd447ea9bee777254714189d64de93fabf9aa5a77e5428e27530d`.

The reverse-current and source-qualification work is screening evidence only. It does not establish a complete design or close C7–C9.

## Resume checklist

When the Founder resumes hardware, continue from the EVT0 F1–F5 receipt and the files above:

1. Complete source-backed paper closure for all four gates. Preserve unresolved items as OPEN/TBD; do not fabricate measurements.
2. Reconcile the B1 task inputs, dependencies, readiness and configuration reference with the EVT0 branch. Keep the historic r11 records intact.
3. Register a new proposed revision only after its contents and gate evidence are internally consistent. Add it to the validator trust baseline through the reviewed process.
4. Send Box 08 one exact-snapshot review packet for the new evidence and configuration. Incorporate findings and re-review material changes.
5. Present the exact configuration SHA-256 for Founder approval. Approval of a direction or dossier is not hash approval.
6. Only after the approved hash and all schematic-stage gates pass, issue a separate bounded B1 builder lease and check that dispatch reports `dispatch_eligible=true`.

Until then, leave B1 waiting. This handoff itself changes neither `tasks.json` nor any configuration, approval, gate, or lease state.
