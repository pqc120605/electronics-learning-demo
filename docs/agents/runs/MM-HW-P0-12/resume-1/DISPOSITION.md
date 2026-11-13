# P0-12 — independent review and preflight disposition

Date: 2026-11-10. Lead sole writer; no direct Claude contact.

## Box08 document review

Native chat 01a1a858-a54b-7eb1-a7c8-bf039a639757, turn 01a1c3d0-286e-7002-b9a5-139340df3392 returned an independent final result. Verbatim receipt: BOX08-RESULT.md. Verdict PASS applies only to the six P0-12 documentary artifacts and their conditional calculations. No new finding requires changing those bytes. The copied hash for mode-power-budget contained a spacing typo; the reviewer explicitly corrected it, and HQ verifies the actual file hash in the manifest.

Remaining engineering work is retained: H3 full error/timing/bias/startup/fault proof; GPIO/OFF/reset interface; whole-mode budget; M-A geometry. None is marked PASS or moved into measurement-only scope.

## Box01 reconciliation

Native chat 01a1a853-d232-7460-8d00-3312362df34a, turn 01a1c3d0-385a-73f0-bf00-c1b25506dce4 returned recommendations (BOX01-RESULT.md). Lead independently checked current code/test hashes against C10 and inspected canonical validator completion/transition rules.

| Recommendation | Disposition |
|---|---|
| 001/002 obsolete work | ACCEPT: cancel as superseded by003, retaining original acceptance, snapshots, reviews and history. No invented superseded status or PASS for obsolete snapshots. |
| 003 deliverable erroneously r10 | ACCEPT: replace metadata with validator/test and actual evidence paths. Do not modify code or r10/r12. |
| 003 close after exact-byte review and fresh checks | ACCEPT: C10 matches current bytes; native Box01/08 reconfirmed. Fresh queue/tests and refused real KiCad dispatch recorded. Use legal state transitions and retain scope limits. |
| P0-12 generic acceptance | ACCEPT: specify six-artifact QA, role/mode limits, preflight reconciliation and final review packet. P0-12 remains in_review, not done. |

## C10 residuals — retained

- F1 Low: hash/byte validation cannot authenticate the human or independently prove who authored a review. reviewer/relay_id strings alone are insufficient. Keep an actual returned independent review or Founder-supplied result plus provenance before any real gate envelope. No gate envelope was created in this run.
- O1: gate_reviews is outside configuration hash; include its contents/hash in the eventual Founder approval packet. No such approval now.
- O2: review final exact proposal bytes before Founder hash approval; do not reuse stale-byte reviews.
- O3: ~digit path blocking can reject genuine filenames; keep fail-closed behavior.

C10 is a previously stored Founder-supplied review, not a newly contacted reviewer: docs/claude-support/2026-11-09-relay-R20261109-PREFLIGHT-003/review-result.md, SHA256 80c9453f529cc39928c16d1c4ae2c6de02093312e50c30d846efb97db26c4964. Its source identity retains the procedural limitation above.

## Design and execution limits

Software preflight closure does not close D17-OFF-DESIGN, D17-ACTUATOR-PRODUCT, D17-H3-CV-PROTECTION or MCU-RESET-VETO-RESOURCES. r12 remains proposed, hash 8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b. Current validator trust baseline stops at r11; a later target needs separately reviewed integration. No pin assignment, r13, CAD/FE, KiCad, lease, purchase, device action, MPN or hash approval.
