# Mạch Mở — bounded parallel builders, policy v3

Effective 05/11/2026 from the user's latest instruction: software and hardware agents implement in parallel; the old foundation may change; hardware configuration must be confirmed before build. This supersedes earlier lead-only/advisory-only defaults for an explicitly leased builder task. It does not authorize purchases, deployments, device/flash/motor operations or secrets access.

## Native roles, scope and writing

Reuse the existing eight custom IDs/TOMLs in D:/StartupOS/.codex/agents; do not duplicate/rename agents or modify user/global config. All eight existing profiles are dedicated to Mạch Mở and now have an explicit product-root guard. Other StartupOS products are outside their builder scope.

- Master/lead owns canonical shared tasks.json, configuration, decisions, leases, integration and final status. Lead need not implement every feature.
- software_engineer can write only an active software lease: src/tests/e2e/public/scripts, explicitly scoped package files, docs/software or .tmp/agent-checks. `playwright.config.mjs` may be leased only for a scoped browser-test harness change. Package changes do not authorize dependency installation or external services.
- hardware_kit_designer can write only an approved active hardware lease under hardware/** or docs/hardware/**.
- electronics_firmware_engineer defaults advisory. Firmware/electronics writer mode, if explicitly assigned, uses approved hardware leases under hardware/firmware or hardware/electronics; the kit builder must release overlapping ownership first.
- PSA/LXD/UX remain read-only advisors; Tester runs scoped checks/artifacts without changing assertions/source; QA reviews independently. No recursive dispatch or Claude calls. The user's one-off permission to READ the supplied MởBot artifact is not permission to ask Claude for project analysis.
- Default max two concurrent subagents/builders and max two active product writers, with disjoint paths. Root registry/config administration is separate; lead must not edit leased source while its builder owns it. Review/test freezes the affected write scope.

## Actual dispatch preflight

Every builder task has execution_mode=builder and write_lease with owner, lane, active/released status, exact product-relative paths, base_snapshot and hardware_config_id when hardware-related. Lead validates before each native spawn/follow-up:

```powershell
node D:/StartupOS/docs/agents/validate.mjs --dispatch-task <task-id>
```

Only an authorized in_progress task with an active valid lease is eligible. Validator rejects writer-count overflow, Windows-case-insensitive overlaps, path traversal/sibling/control scopes, mismatched owner/lane and unapproved/stale/incomplete hardware configurations. Freeze/release lease before in_review/in_test/done. The queue remains a single source; no separate task-state ledger.

This is a lead-enforced preflight plus instruction/ownership policy, **not an OS sandbox per custom agent**. Agents inherit parent tools/MCP/permissions. Do not claim filesystem isolation just because leases differ. Capture before/after manifests, inspect changed files and stop on scope violations. Use native task worktrees when there is a safe tracked baseline and real benefit; parent-root/untracked files/secrets must not be copied wholesale to fake isolation. Shared queue stays lead-owned in the canonical checkout.

## Hardware confirmation gate

Before pin assignment, schematic, PCB, CAD, physical firmware or hardware build artifacts:

1. Prepare a concrete configuration proposal with exact version, confirmed requirements, candidate interfaces, unknowns and the intended build scope. Configuration research/review is allowed before approval; it is not a hardware build.
2. User explicitly approves that version and material choices. Record approved_by=user and approved_sha256 against the exact proposal bytes in queue.hardware_configurations. User requirements or approval to read a reference are not approval of the proposed build configuration.
3. Resolve blocking_unknowns. Lead preflight also checks the approved proposal file/hash; material changes invalidate approval and need reconfirmation. Domain review/physical evidence remain separate gates.
4. Assign one hardware builder its exact scope; no default purchase/flash/bench/release permissions. Incomplete/unapproved configuration leaves the hardware build task waiting while independent software work proceeds.

Approval records are lead-only. Builders must not approve their own configuration, rewrite approval metadata or enlarge their lease. Prototype, solver, CAD and bench results retain distinct meanings.

## Foundation changes and migration

Existing code/framework/pages/curriculum/kit concepts are inputs, not immutable constraints. A scoped task may refactor or replace them with a reasoned architecture and verification plan. Do not preserve patchwork merely to minimize diff. Protect original user data and provide explicit migration/recovery/backups and route/API compatibility decisions; do not silently overwrite drafts or undo unrelated work. No required accounts/sync/remote services are added without the relevant product decision.

## Model/effort and Skills routing (Setup V2)

No permanent model/effort override was added to the eight TOMLs: file overrides would prevent per-task native routing. The user's parent model stays unchanged. Lead uses fork_turns=none with a compact packet and the requested native role when selecting task settings:

| Task class | Native request default | Escalation |
|---|---|---|
| S: clear inventory/copy/short smoke; light LXD/UX/TST | gpt-6-luna / medium | gpt-6.1-sol / medium when ambiguity appears |
| M: bounded software/hardware design or build | gpt-6.1-sol / medium | high for difficult implementation/debugging |
| L: architecture/cross-contract change | gpt-6.1-sol / high | split tasks before adding agents/context |
| Electrical/firmware/QA safety question | gpt-6.1-sol / high | evidence and independent review, not model confidence |

These IDs/efforts are exposed by this host and match official documentation; account availability/runtime telemetry is separate. A successful explicit-model spawn proves the request was accepted, not private backend telemetry. Do not claim token savings without usage evidence. Two repeated failures → summarize and change approach, not an infinite retry loop. Max concurrency respects actual host slots.

Use installed Skills on demand: architecture/system-design/spec for PSA; TDD/debug/verification for SE; CAD/DFM/BOM for HK; official datasheets/Context7 when EF needs current sources; learning/spec/research for LXD; frontend/UX for UX; testing tools for TST; review/security/release for QA. Discover new Skills only when needed; third-party scripts/hooks/MCP/global installation require scoped review/approval. No installation in this setup.

## Packet and existing chats

### Domain chat ownership (user instruction, 05/11/2026)

The existing domain chats own their technical conversations, proposals, implementation discussion and questions to the user. HQ (00) owns intake, prioritization, canonical queue/leases, dependencies, integration and consolidated status. Send a domain task to its existing chat rather than carrying out the detailed conversation in HQ or creating a duplicate chat. Domain chat ownership does not enlarge filesystem permissions or grant a write lease.

| Chat | Conversation owner |
|---|---|
| 01 Product & System Architecture | Product scope, architecture and contracts |
| 02 Electronics & Firmware | Electronics and firmware |
| 03 Hardware & Kit Design | Kit, BOM, mechanics and hardware configuration approval |
| 04 Learning Experience | Lessons and assessment |
| 05 Software Development | Software implementation and technical choices |
| 06 UI/UX Design | User flows and interface design |
| 07 Testing & Validation | Scoped execution and test evidence |
| 08 QA & Safety Review | Independent quality and safety findings |

Hardware configuration questions and user approval take place in chat03. HQ records an approval only after reading the actual user approval against the exact proposal revision/hash; a domain agent's recommendation is not user approval. HQ reads domain results through thread snapshots and reports dependencies without duplicating their detailed questions. Outbound messages between chats require the user's authorization; a handoff message is not itself a new blanket authorization to contact other chats.

Every dispatch states current user authorization, task/role, scope/exit depth, exact lease/base hashes, acceptance, commands/artifacts/port lock, hardware approval reference or explicit advisory-only mode, handoff and no-recursive/no-Claude rules. Tell the agent it is not alone and must preserve others' changes.

Existing chats/agents can retain older advisory-only initialization. Fresh spawns should load updated role files; current task packet must explicitly carry this newer policy and lease. Names do not bind Custom Agents to main chats; do not claim hot reload without a smoke result. No need to create eight more chats or broadcast work to all roles. Native delegates are the execution mechanism.

Read dashboard/task state directly from queue; IN_PROGRESS/active lease does not prove a runtime agent is running. Report configuration parsed, role spawn accepted, artifact written, checks passed, hardware approval pending and actual runtime status separately.

Official schema/permission source: [OpenAI Subagents](https://developers.openai.com/codex/subagents). Rollback profiles from parallel-profile-backup.json via selected native edits; never reset/clean the workspace. Preserve user changes after the backup.
