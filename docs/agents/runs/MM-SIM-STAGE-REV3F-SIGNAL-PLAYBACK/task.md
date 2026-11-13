# MM-SIM-STAGE-REV3F-SIGNAL-PLAYBACK — task card

## Outcome and authorization

- Request: continue the founder-approved one-screen learning design and make code-to-circuit signal flow visible while a supported lesson trace runs.
- Capability IDs / module: WRK-02, WRK-03, WRK-05, WRK-06, WRK-07, SIM-01, EDA-01, EDA-04 / M02.
- Entry → exit depth: remain at the existing bounded educational interpreter depth; no solver, firmware or physical-validation depth is added.
- Deliverable: stepwise read → branch → write playback for the Button LED pilot, with one current event mapped to exact canonical pins, net/wires and destination parts across breadboard, schematic and 3D projections.
- In scope: the existing ButtonLedLessonLab and its existing educational trace. Keep the event/provider badge and explicit limits visible.
- Out of scope: new interpreter/provider behavior, additional lessons, board inventories, topology/schema/storage changes, electrical values, voltage/current animation, firmware/device execution, remote services or hardware actions.
- Execution authorization: founder has authorized continuous implementation of the approved integrated learning-screen and code-to-circuit flow. This bounded slice implements §12.5 of the approved interactive-electronics design; no additional product decision is required.

## Ownership and write scope

- Accountable role: software_engineer.
- Filesystem writer: one leased software builder; Codex lead owns the queue and shared task status.
- Independent reviewer: qa_safety_reviewer, on the frozen attempt-0 snapshot.
- Tester: tester, after QA passes.
- Allowed files:
  - src/lib/buttonLedLessonTrace.ts
  - src/components/lesson/ButtonLedLessonLab.tsx
  - src/components/lesson/ButtonLedLessonLab.css
  - tests/button-led-lesson-trace.test.mjs
  - e2e/journeys.spec.mjs
  - docs/agents/runs/MM-SIM-STAGE-REV3F-SIGNAL-PLAYBACK/**
- Forbidden: app/**, src/data/**, src/lib/educationalProgram.ts, src/lib/logicTrace.ts, all other product files, package files/dependencies, Supabase, hardware/firmware/device files, docs/claude-support/**, docs/hardware/**, .codex/**, D:/StartupOS/docs/agents/tasks.json (lead-owned).
- Test artifact and lock: task-local attempt-0 artifacts; Playwright localhost port 5196 and dist/.tmp outputs are exclusive while browser checks run.

## Inputs and contract

- Read packet:
  - docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md §12.5, §12.6
  - docs/agents/runs/MM-SIM-STAGE-REV3E-SCHEMATIC/report.md
  - src/lib/buttonLedLessonTrace.ts
  - src/components/lesson/ButtonLedLessonLab.tsx
  - src/components/builder/AssemblyStage.tsx
  - tests/button-led-lesson-trace.test.mjs
- Baseline snapshot: base-snapshot.json; SHA-256 captured 2026-11-12 before this task's source edits.
- Facts checked: the interpreter returns three typed events (read, branch, write); the current lesson trace maps every supported net into one simultaneous highlight; AssemblyStage already accepts per-wire WireFlow and has reduced-motion handling.
- Assumptions / unknowns: no new electrical behavior is inferred; logical event emphasis is presentation of existing interpreter output only.
- Dependencies: MM-SIM-STAGE-REV3C-BUTTON-UI, MM-SIM-STAGE-REV3D-WIRING-UX and MM-SIM-STAGE-REV3E-SCHEMATIC are done.
- Consumes: ButtonLedLessonTraceContext, EducationalProgramEvent, createNetIndexV2, stable CircuitDocV2 part/pin/hole/wire IDs, existing WireFlow type.
- Produces: a pure frame projection for a selected trace-event index, plus UI playback state (play/pause/previous/next/restart) and an accessible current-step label/snippet. A frame returns its event, activeKeys, wireFlows, and activePartIds; it returns empty highlights for stale/unsupported/invalid traces or an out-of-range step.
- Frame mapping: read and branch use only the canonical input net; write uses only the canonical output and series nets. The frame may highlight associated mounted holes and board/component pins from those nets. It must not activate unrelated nets. Direction is none unless an exact logical direction is established by the event; do not imply electron/current flow.
- Invariants: unsupported or stale code/topology has no active frame; changing code, topology, board or input stops playback and invalidates prior highlights until a fresh run; selected object identity is unchanged across views.
- Recovery: no persistence or schema writes; resetting the lesson restores the existing canonical five-wire sample.

## Acceptance and verification

| Criterion ID | Expected observable behavior | Method / fixture | Required gate |
|---|---|---|---|
| C1 | Read/branch frames highlight only the canonical input net/wires and board-input/button endpoints; write highlights only output/series nets plus their mounted holes and board/resistor/LED endpoints. | Pure frame tests using getLessonCircuitDoc('button-led') for pressed and released states. | software |
| C2 | Invalid, stale, unsupported, disconnected and out-of-range frames contain no active wire, key or part highlights. | Regression cases in button-led-lesson-trace.test.mjs. | software |
| C3 | Play, pause, previous, next and replay controls are keyboard accessible; current step announces event, line number/snippet and provider limitation. | UI assertions and accessibility E2E. | software |
| C4 | The same current event stays synchronized after switching among breadboard, schematic and 3D; no page-width overflow at 1440×900 and 375×812. | Full journey E2E at both viewports; verify wire IDs in the active 2D projection and frame after view switch. | software |
| C5 | Editing code/circuit, changing board/input, or receiving an unsupported trace stops playback and clears all projected highlights until rerun. | Unit and E2E stale-state cases. | software |
| C6 | Reduced-motion preference does not auto-advance/pulse the view; manual step controls remain available. | E2E with reducedMotion emulation and CSS/unit checks as applicable. | software |
| C7 | Focused tests, typecheck, full unit suite, local build and full E2E pass on the reviewed frozen snapshot. | Commands recorded with exit codes and exact counts. | software |

- Material changes that invalidate evidence: changes to any of the five allowed source/test files after snapshot review.
- Known baseline failures: none carried forward; attempt 1 of Rev3E passed 50/50 E2E, 508/508 unit tests and typecheck/build.
- Required user decision: none.
- Ready check: dependencies complete, exact scope and base hashes recorded, acceptance and test lock defined.

## Plan and handoff

1. Add failing pure tests for per-event frames and invalid/stale no-highlight behavior.
2. Implement the smallest pure projection and verify focused tests turn green.
3. Add accessible playback controls and per-frame highlights to the existing single-screen lesson.
4. Add desktop/mobile E2E for input → branch → output, switching views, stale invalidation and reduced motion.
5. Freeze the five-file source snapshot, request independent QA, then run focused tests, typecheck, full unit, build and E2E sequentially.
6. Save reports/hashes under this task directory and update the canonical queue through Codex lead only.

No Claude, no recursive agents, no package/dependency, data-schema, provider, hardware, firmware or device changes.
