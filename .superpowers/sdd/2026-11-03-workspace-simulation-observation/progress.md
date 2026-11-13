# SDD ledger — plan: docs/superpowers/plans/2026-11-03-workspace-simulation-observation.md

Baseline: working tree already has unrelated edits and many untracked assets; no stage/commit/push. User explicitly approved direct Codex implementation on the current workspace. No Claude calls or subagents.

Ruling: Do not add or run automated tests — higher-priority developer instruction forbids doing so unless user asks; the approved plan also set that verification boundary. Use typecheck, local build, and browser/manual inspection only.

Pre-flight: Task 1 produces capability IDs, event metadata, fingerprint/run identity. Task 3 consumes them in the builder panel; Task 4 consumes the workspace fingerprint/result envelope. Shared shapes will be exported from contracts and workspaceSimulationSession.ts. Task 2 produces a shared AVR worker protocol consumed by FirmwareHexToolPage and builder runtime. Task 4 extends workspaceSpice handoff consumed by SpiceWorkbenchPage and CircuitBuilderPage.

Task 1: implemented — typed capabilities, deterministic workspace fingerprint, and run identity helper.
Task 2: implemented — shared AVR worker protocol, bounded UART/D13 snapshot, timeout/stop lifecycle, and Firmware HEX tool migration.
Task 3: implemented — provider-driven observation panel and builder runtime integration; stale lesson/firmware/SPICE observations are cleared on workspace/runtime changes.
Task 4: implemented — bounded expiring SPICE result envelope and fingerprint-checked return path.
Task 5: partial — typecheck, local build, and local route HTTP 200 passed. Browser manually confirmed educational step trace, Uno R3 sample HEX → D13 transitions/UART0 snapshot, stale AVR output clears when switching to ESP32, and LDR calculator SPICE `.op` run plus return link to the matching lesson URL. Workspace-originated SPICE fingerprint return, invalid/expired/oversized envelopes, keyboard/screen-reader flow, and mobile layout remain unverified. No automated tests added/run per task boundary.

Implementation note: runtime changes clear SPICE observations; AVR timeout text now correctly describes a 30-second wall-clock watchdog, not simulated time. Public ngspice distribution remains NOT CLEARED; no hardware verification, commit, or publish was performed.

Follow-up — Phase 6 project restore safety: found `backupCurrentWorkspace` suppressed storage/parse errors, allowing restore to continue without a usable recovery bundle. `replaceWorkspaceWithBundle` now guards both saved-project opening and JSON import, validates and persists recovery before writing active keys, and attempts rollback of all prior key values on partial failure. Import snapshots the current in-memory editor bundle so edits not yet autosaved are included. Browser restore/import and storage quota/interruption fault injection remain unverified; no automated test was added/run.
