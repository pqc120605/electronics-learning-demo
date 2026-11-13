# B1 dependency audit — 2026-11-10

This is a checklist from the live queue/config, not an approval or a second task registry.

## Four design gates due before schematic

| Gate | Required evidence | Current missing evidence |
|---|---|---|
| D17-OFF-DESIGN | Independently accepted bounded OFF/veto/fail-off and single/common-fault architecture | Mixed-bias interfaces, real isolation feedback, loss-of-bias/default/fresh-arm bounds; integration with M-A phase/commit |
| D17-ACTUATOR-PRODUCT | Product source/load/duty/thermal/state/interface budget within accepted limits | Consistent M-A geometry/tolerance/force proof and actual actuator load/source/cost envelope |
| D17-H3-CV-PROTECTION | Bounded charger/protection compatibility with Jauch and independent protection | Simultaneously valid static threshold and dynamic energy/timing bounds, startup/reference/bias/reverse/fault coverage |
| MCU-RESET-VETO-RESOURCES | Resource fit and independently bounded default/reset/panic/watchdog/retained-output/bias-loss veto | G-B16 fit is documented; exact interface and whole-path proof remain missing, assignments UNASSIGNED |

## Process dependencies that still matter after design review

- Current B1 task MM-HW-MOBOT-REMOTE-KICAD-001 still references r11, with a waiting reason containing older architecture choices. Do not silently dispatch using that stale association when a new proposal is reviewed.
- Actual depends_on: MM-HW-MOBOT-IF-001, MM-HW-GATE-PREFLIGHT-003, MM-HW-P0-08 and its OFF/ACTUATOR/H3/MCU packages. PREFLIGHT003 has been closed for software scope. Remaining historical design dependencies need an explicit supersession/closure mapping to the accepted final engineering snapshot; they cannot be marked done just because code tests pass.
- The trusted validator allowlist remains handset r8/r10/r11. A new configuration requires a separately scoped reviewed baseline update that preserves all fail-closed protections.
- Final gate acceptance must be linked to exact consistent configuration bytes and actual independent review provenance. Founder then approves the exact hash/material scope. No build scope is inherited from this design request.
- Only after those checks can lead establish a bounded B1 builder lease and run actual dispatch preflight. Eligible=true must be observed on the real task, not a synthetic fixture.

## Gates that retain later milestones

B01 traceability is before BOM lock; FAB/layout is before layout lease; assembled OFF behavior is before operation/mode switching. The 14 verification items remain NOT_RUN at their existing milestones. Their existence is not a reason to relabel a schematic proposal as unsafe/validated or to claim they have been performed. Conversely, they do not automatically block an earlier milestone that their stage does not cover.

Current engineering is proposed, not implemented. Source documents and reports are evidence at their stated levels, not electrical/physical validation. No r13/config update, pin assignment, CAD/FE or KiCad is created by this audit.
