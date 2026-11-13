# Mạch Mở — agent entry point

## Read first

1. `../docs/agents/README.md` — task routing, ownership, states, handoffs and completion.
2. `../docs/agents/roles.md` — use the assigned role card, not every role.
3. `../docs/agents/tasks.json` — current execution queue; update only through Codex lead.
4. `../docs/mach-mo-product-master-2026-11-05.md` and the linked feature register/architecture — product destination, capability IDs and module boundaries.
5. For the actual feature: nearby source/tests, `README.md`, relevant recent sections of `docs/MACH-MO-MVP-STATUS.md`, and `../.github/instructions/mach-mo.instructions.md`.

## Working rules

- No Claude calls or exchanges. The user has authorized bounded parallel software/hardware builders: each writes only an active lead-issued nonoverlapping task lease. Codex lead alone updates queue/shared decisions/config. No lease means read-only; Tester only runs assigned checks/artifacts, never source/assertion edits. Read `docs/mission-control/parallel-build-policy.md` before builder dispatch.
- Cursor (IDE agent; user-authorized 2026-11-10) is an external software builder under the same lease rules: it writes only paths in an active lead-issued lease, counts toward the two-active-writer cap, never edits `tasks.json`/shared decisions/config, and Codex lead does not edit its leased paths while the lease is active. Cursor's rules: `.cursor/rules/mach-mo.mdc`; pending lease proposal: `docs/mission-control/cursor-ui-phase1-lease-request.md`.
- Use the operating workflow for substantive Mạch Mở tasks. Small low-impact edits get a proportionate path; do not force every task through eight agents or ask for duplicate approval.
- Tie work to capability IDs and an exit depth, not just a page or button. The 38-task baseline plan is a subordinate track, not the full product scope.
- The existing foundation, framework, modules and screens may be replaced when the scoped redesign justifies it; do not preserve patchwork by default. Preserve/recover user data and document route/schema migrations and user impact. Keep guest/local-first unless a product decision changes it; no required accounts, remote compilation/services or device actions without relevant authorization.
- Before any hardware pin assignment, schematic, PCB, CAD, firmware or build artifact, obtain explicit user approval of the exact configuration revision/hash and resolve blocking inputs. Requirements/configuration proposals may be prepared for review; they are not approval to build. Material configuration changes require reconfirmation.
- Keep connections stable by `partId/pinId`; preserve user drafts, identity/revision, migrations and recovery. State actual storage durability.
- Distinguish reference geometry, educational scenarios/subset traces, firmware execution, circuit solver results and physical observations. Unknown/incompatible contexts must not be reported as supported.
- Board/module/part/model revisions, provenance and limits remain explicit. A simulated result does not validate a real kit.
- Keep ngspice artifact release gates intact. `build:local` is an internal technical check, not a public distribution pass. Use `npm.cmd` on Windows; run only checks justified by the changed scope.
- Never read secrets, modify the sibling `../app`, undo another worker's changes, install dependencies or contact external services just to satisfy a checklist.
- Only Codex lead changes queue state, shared decisions and final status. Review/test evidence is tied to the reviewed snapshot; later material changes need the affected checks again.

## Mission Control

- For `dashboard`, `status`, `agent status`, `sprint`, `blockers`, `action center`, `release status`, `task <id>` or `refresh dashboard`, read `docs/mission-control/README.md` and refresh the canonical `../docs/agents/tasks.json`; mark missing/stale data explicitly.
- Keep the existing queue as the single task-state source. The Markdown dashboard is a dated projection, not runtime telemetry or a second registry.
- Specialized chats call their mapped native Custom Agent when a scoped task needs it; chat titles do not bind a role. Default at most two concurrent subagents/builders, disjoint write leases and one lead registry writer; no recursive dispatch. Use local checkout ownership until a safe tracked baseline makes task worktrees useful; never copy an entire parent workspace or secrets to simulate isolation.
- Setup prompts, worktree constraints, skill inventory and validation evidence are linked from `docs/mission-control/README.md`. Setup does not authorize starting the product backlog, merge/release or physical-device actions.
