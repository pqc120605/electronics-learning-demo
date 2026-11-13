# Task card — MM-SIM-STAGE-REV3D-WIRING-UX

**Owner:** software_engineer builder  
**Reviewer:** qa_safety_reviewer, independent and read-only  
**Tester:** tester, commands/browser evidence only  
**Capabilities:** WRK-01, WRK-02, WRK-03, WRK-05, WRK-06, WRK-07, EDA-01, EDA-04  
**Module:** M02  
**Dependency:** `MM-SIM-STAGE-REV3C-BUTTON-UI` (done)

## Goal

Make wire creation, selection, endpoint editing and deletion discoverable to a beginner inside the approved one-screen button-LED workspace. Keep the existing canonical `CircuitDocV2` and edit validators; do not change the data model or save a new draft format.

## Read

- `AGENTS.md`, `docs/mission-control/parallel-build-policy.md`
- `docs/research/2026-11-12-learning-sites-interaction-audit.md` (P1 wiring)
- `docs/agents/runs/MM-SIM-STAGE-REV3C-BUTTON-UI/{task.md,review.md,report.md,final-snapshot.json}`
- `src/components/builder/BreadboardEditor.tsx`, `.css`
- `src/components/lesson/ButtonLedLessonLab.tsx`, `.css`
- `src/lib/circuitDocEdits.ts`, `tests/circuit-doc-edits.test.mjs`

## Allowed paths

- `src/components/builder/BreadboardEditor.tsx`
- `src/components/builder/BreadboardEditor.css`
- `src/components/lesson/ButtonLedLessonLab.tsx`
- `src/components/lesson/ButtonLedLessonLab.css`
- `e2e/journeys.spec.mjs`

No changes to schema/data, storage, lesson registry, component registry, global styles/tokens, route table, dependencies, hardware, firmware, or files outside these five paths. The lead owns run artifacts and queue updates.

## Interaction contract

- Separate **Chọn** from **Nối dây** so inspecting a pin/hole does not silently begin a wire. In connect mode show an explicit first-endpoint/second-endpoint prompt, pending endpoint identity, wire role (signal/power/GND), and a clear cancel action. Keep drag-to-connect as a pointer shortcut.
- Selecting an existing wire exposes its exact endpoint IDs, role and net membership. Provide clear actions to change the start endpoint, change the end endpoint, change role, or delete. Returning to select mode must not edit a wire accidentally.
- Invalid/duplicate endpoints must leave the prior document byte-equivalent and show the validation reason. Valid edits invalidate old educational trace/highlights. Deleting a selected wire clears selection; reset restores the canonical sample.
- Keyboard and pointer users can select pins and breadboard holes by stable IDs. The selected source and destination are announced with accessible status text; Enter/Space activate native controls. Keep hit targets and the one-screen/mobile shell constraints from Rev3C.
- Never infer a net from wire color or screen proximity. Show exact endpoint and net identifiers; preserve the 400-tie-point rail assumption notice.

## Acceptance

1. In `button-led`, default mode is selection; selecting one endpoint updates details but does not add a wire.
2. In connect mode, add a valid wire by two keyboard-operable endpoint selections and by pointer drag/click. Exact IDs, role and net update in the list and projections.
3. Select a wire and change each endpoint. A valid edit updates all views and clears the previous trace; an invalid occupied/duplicate endpoint reports the reason and preserves the original endpoints and wire count.
4. Change wire role and delete the selected wire; selection and stale highlights clear. Restore returns the canonical five-wire sample.
5. At 1440×900 and 375×812, all primary wire actions are reachable without page-level vertical scrolling or horizontal page overflow. Other lesson routes and stored data remain unchanged.
6. E2E covers mouse and keyboard creation/edit/rejection/delete/reset; focused existing edit tests remain intact.
7. `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local`, and `npm.cmd run test:e2e` exit 0 on the final snapshot. Record counts, exact output and screenshots.

## Approval boundaries

Stop and report if completing the task requires changing `CircuitDocV2`, stored user data/schema, global builder semantics beyond the listed paths, a dependency, or any file outside this lease. Do not change physical/electrical claims or treat colored wires as current-flow simulation.

## Handoff

Builder returns source changes and exact commands/results only. Freeze the lease and snapshot before independent review; Tester then runs checks separately. Lead records reports, updates queue and final status.
