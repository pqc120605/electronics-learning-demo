# Hardware checkpoint — 10/11/2026

Hardware is USER_PAUSED. B1 is NOT_READY. Read electronics-learning-demo/docs/hardware/HARDWARE-HANDOFF-2026-11-10.md first.

This ZIP is a scoped documentary checkpoint, not a complete application checkout. It includes P0-10/P0-11/P0-12, relevant earlier hardware/preflight runs, configuration proposals, manufacturer evidence and a frozen queue snapshot. It excludes secrets, dependency caches, app source and sibling ReTrack/StartupOS app. It does not authorize running scripts, resuming work, writing hardware or sending content externally.

Current r12 remains proposed, SHA256 8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b. G-B and M-A directions are retained. P0-12 peer QA, preflight status reconciliation, full H3/OFF/MCU/mechanical proof and r13 remain unfinished. No CAD/FE/bench or new lease.

Two read-only Sol advisors returned results: c12_h3_bound researched TLV9031/LTC6702, and c12_gpio_constraints supplied role/reset/domain matrices. Their results are integrated into the four P0-12 documents; no new P0-12 QA was completed. The previous P0-11 QA must not be reused as P0-12 approval.

Paths inside ZIP are relative to D:/StartupOS. Prefer continuing in the existing workspace. Do not extract over a newer queue or source without comparing it. manifest.json hashes archive-entry bytes, not future live files. Old packet manifests remain historical and may include their then-live tasks.json hash.
