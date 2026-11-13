# Correction to E-P2 — qualification reset versus permission clear

The independent review correctly found ambiguity in the statement “every FALSE predicate clears token/grant”. That statement is superseded by this phase table. E-P2 raw receipt is preserved unchanged.

| Phase/event | Timer/qualification effect | Grant/state effect |
|---|---|---|
| Any precommit H invalid, or unexpected lock proof loss | Reset qualifications | Clear all grants; enter FAULT. Fault dominates every edge. |
| WAIT_ARM, H/K valid, FRESH_ARM LOW | ARM timer may qualify continuously | No RUN until new rising edge with prior completed qualification |
| Qualified FRESH_ARM rising edge with RUN_REQUEST | Reset/consume ARM qualification because request is now HIGH | Set RUN only from prior qualified state. Do not clear it solely because ARM timer predicate is FALSE. |
| RUN, FRESH_ARM still HIGH | ARM timer stays reset | RUN remains proof-dependent; request HIGH alone is not a fault |
| RUN_REQUEST withdrawn | Reset old arm/release qualifications | Remove RUN; enter OFF_VERIFY |
| OFF_VERIFY, O absent | Reset OFF timer | Keep RUN/release absent, continue verifying |
| OFF_VERIFY, O continuously qualified | Consume OFF timer result, enter OFF_READY | Maintain O requirement directly. Leaving OFF_VERIFY does not itself clear a valid OFF_READY state. |
| OFF_READY, RELEASE LOW and N/H/O/K valid | RELEASE timer may qualify continuously | No release until new edge; loss of O faults independently |
| Qualified RELEASE rising edge | Reset/consume RELEASE timer | Set release grant from prior completed qualification; HIGH does not immediately erase it |
| RELEASE_GRANTED, expected follower movement leaves neutral | Neutral/LOW qualification stays reset | Do not revoke solely because N became FALSE. H/O/K still required until commit. Actual geometry/state proof must distinguish intended movement from fault. |
| RELEASE_GRANTED, actual commit | Clear logical new-permission grant and qualifications | COMMITTED keeps RUN inhibited; no promise of recapturing cassette |
| RELEASE_GRANTED, finite release pulse expires before commit | Clear release grant and all release qualification | Return OFF_VERIFY; require continuous OFF proof then fresh RELEASE LOW qualification/new edge. Held HIGH cannot retry. Fault dominates expiry; simultaneous observed commit enters COMMITTED with no new release grant. |
| COMMITTED and verified relock/neutral with requests LOW | Restart from WAIT_ARM | No RUN until a complete new low-qualification/fresh-edge cycle |
| FAULT recovery | Fresh qualifications only after current fault disappears | No automatic restoration of previous grant |

state-model.py tests the specified logical transition relation, including valid-edge consumption, intentional phase exit, held requests, simultaneous fault/edge, loss of OFF proof, commit and finite release expiration. It enumerates all Boolean combinations of timer completion, requests/proofs, old qualifications and prior levels, commit, expiry and RUN_REQUEST across seven phases. This is still one-step logical analysis, not proof of all real continuous-time histories. It is an analysis model in docs, not firmware, a pin assignment or gate implementation. Abstract timer outputs are not evidence of real continuous qualification, assertion timing, pulse filtering, recovery/removal or a physical race bound. This analysis does not close any hardware gate.

Actual realization still requires selected gates/latches, reset dominance under power ramp, explicit fault containment and the source/driver/isolation budgets. Native Box08 is asked to review the exact correction rather than silently treating E-P2 prose as fixed. The model contains seven logical phases.
