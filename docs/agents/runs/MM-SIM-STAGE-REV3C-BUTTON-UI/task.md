# Task card — MM-SIM-STAGE-REV3C-BUTTON-UI

**Owner:** software_engineer builder  
**Reviewer:** qa_safety_reviewer, independent and read-only  
**Tester:** tester, commands/browser evidence only  
**Capability IDs:** WRK-01, WRK-02, WRK-03, WRK-05, WRK-06, WRK-07, LRN-02, SIM-01  
**Module:** M02  
**Authorization:** Founder directly asked to consolidate the learning flow and circuit features into one easy-to-use screen; latest steering approves using a compact, contextual workspace to reduce page scrolling. This task implements only the button-LED pilot; it does not claim parity across the full catalog.

## Goal

Turn the existing `button-led` lesson entry into a compact learning workspace where a beginner can inspect and wire the same circuit, switch among breadboard/schematic/3D views, edit the supported lesson code, press a virtual button, and follow the resulting educational read → branch → write events across the same stable part/pin/net/wire identities.

The route and preflight information for other lessons remain unchanged. The button lesson keeps its route and exposes its board, source, safety and lesson context through progressive disclosure inside this workspace.

## Read before work

- `AGENTS.md`, `docs/mission-control/parallel-build-policy.md`
- `docs/research/2026-11-12-learning-sites-interaction-audit.md`
- `docs/superpowers/specs/2026-11-11-interactive-electronics-learning-design.md`
- `docs/superpowers/plans/2026-11-12-interactive-button-led-lesson.md`
- Slice A/B run reports and final snapshots
- `src/pages/LessonPreflightPage.tsx`, `src/components/lesson/LessonCircuitWorkspace.tsx`, `src/components/builder/AssemblyStage.tsx`, `src/components/builder/BreadboardEditor.tsx`, `src/components/builder/CircuitSchematicV2.tsx`

Apply the frontend-design, test-driven-development and verification-before-completion skills. Design choices must use Mạch Mở's existing identity and semantic circuit colors; do not copy competitor assets, text, branding or exact layout. Work only within the active lease and preserve all existing changes.

## Allowed paths

- `src/pages/LessonPreflightPage.tsx`
- `src/pages/LessonPreflightPage.css`
- `src/components/lesson/ButtonLedLessonLab.tsx` (new)
- `src/components/lesson/ButtonLedLessonLab.css` (new)
- `src/components/lesson/LessonCircuitWorkspace.tsx`
- `src/components/lesson/LessonCircuitWorkspace.css`
- `src/lib/buttonLedLessonTrace.ts` (new)
- `tests/button-led-lesson-trace.test.mjs` (new)
- `e2e/journeys.spec.mjs`

No package/dependency, route table, schema, lesson registry, component registry, hardware, or global-token changes. If a necessary change falls outside these exact paths, stop and return the reason; do not silently enlarge scope.

## Interaction and truth contract

- Reuse the approved canonical button CircuitDocV2 and typed events from Slice B.
- On desktop, show lesson/progress navigation, a dominant circuit stage with Breadboard / Schematic / 3D controls, contextual part/code/trace panel, virtual button control and concise result within a 1440×900 application viewport. Keep long code/details scrollable inside their own panels; the core workspace must not require page-level vertical scrolling.
- On 375×812, show a compact Circuit / Schematic / Code / Details switcher, preserve selected identity and button/code/result state across switches, keep the primary control reachable, and prevent horizontal overflow.
- Selecting a part, pin or wire updates the same stable identity across views and the details panel. Breadboard wire controls remain usable; schematic selection follows the canonical nets; 3D remains an assembly projection with model provenance/limits intact.
- Pressing/releasing changes only the virtual input. Display typed `read → branch → write` events and highlight mapped paths from stable net/wire IDs. Stale highlights/results clear on code/topology/lesson/profile change.
- Unsupported code/profile or invalid topology must not emit events or show active paths. Preserve the original code draft when switching views within the mounted lesson; do not persist new user data or change storage schemas.
- Label results as the bounded educational code interpreter. Do not imply firmware execution, current/voltage measurement, SPICE, debounce, or physical switch behavior.
- Use native keyboard-operable controls, visible focus, meaningful labels, touch targets of at least 44×44 px for primary mobile controls, and reduced-motion behavior.

## Acceptance

1. `button-led` route renders the single-workspace experience; other lesson preflight routes retain their prior flow.
2. On 1440×900, lesson identity/progress, circuit view controls, circuit stage, current primary action/result and previous/next actions are visible without page-level vertical scrolling. Code/details may scroll only inside their panel.
3. On 375×812, all four view choices fit; no horizontal page overflow; the virtual button and current result/action remain reachable without losing state.
4. Default released input yields `HIGH → else → LED tắt`; pressing via mouse and keyboard yields `LOW → if → LED sáng`; releasing returns the prior result. The UI identifies the educational provider.
5. Switching Breadboard/Schematic/3D and Code/Details preserves the selected stable ID and virtual input. Press/release highlights only the associated input and output paths; wire list, schematic, and 3D use the same topology IDs.
6. Editing supported code, selecting an incompatible board/profile, or invalidating the circuit clears old events/highlights and gives a concrete status; malformed/unsupported code creates no successful sequence.
7. A pure helper test covers mapping and invalidation behavior; E2E covers both target viewports, keyboard operation, view-state retention, no horizontal overflow, and the desktop no-page-scroll check.
8. `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local`, and `npm.cmd run test:e2e` exit 0. Record exact counts/exit codes and a browser screenshot or equivalent evidence in lead-owned run artifacts.

## Frozen baseline

See `base-snapshot.json`. Builder returns a handoff only; the lead records reports/snapshots, freezes the lease, updates the queue, then requests independent review and verification.
