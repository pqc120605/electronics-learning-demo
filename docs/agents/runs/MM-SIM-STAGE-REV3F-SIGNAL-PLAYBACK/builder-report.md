# Signal playback — builder handoff, attempt 0

Date: 2026-11-12. Product writes frozen for independent review. Queue/lease status remains lead-owned.

## Changed paths

- `src/lib/buttonLedLessonTrace.ts`: adds the pure `getButtonLedLessonFrame(current, requested, step)` projection. Read/branch project only input; write projects output and series. It returns the interpreter event, active keys, wire flows and active part IDs; invalid/stale/unsupported/out-of-range frames are empty. No interpreter, topology or identity changes.
- `src/components/lesson/ButtonLedLessonLab.tsx`: manual previous/next/replay plus play/pause, 1200 ms event dwell, current action/source line/snippet in polite atomic status, shared event state across all three views, and frame-specific parts/wires/pins. Input/code/topology/board changes stop and invalidate playback until rerun. Reduced motion blocks automatic advancing and stops an existing timer.
- `src/components/lesson/ButtonLedLessonLab.css`: compact wrapping controls, current trace-list emphasis and constrained source snippet. Existing reduced-motion CSS remains active.
- `tests/button-led-lesson-trace.test.mjs`: three added behavioral tests covering both button states, exact relevant wire and part IDs, occupied holes, excluded return/input/output paths, invalid contexts and step boundaries.
- `e2e/journeys.spec.mjs`: two desktop/mobile event journeys plus reduced-motion/timer checks. Existing input journeys now explicitly rerun after input invalidation. These assertions are authored but have NOT_RUN on the final source.

Exact final hashes: `final-snapshot.json` (five files). All changes are in the assigned lease, plus these task-local artifacts. No dependencies, schema/storage/provider/data/hardware/firmware/queue/shared configuration edits were made. Existing selection and canonical part/pin/net/wire IDs are preserved.

## Verification actually run

| Command | Result | Scope |
| --- | --- | --- |
| `node --test tests/button-led-lesson-trace.test.mjs` before frame implementation | Exit 1, 4 passed / 3 failed | RED: new frame export missing, expected failure |
| Same focused command after implementation | Exit 0, 7/7 | Pure projection GREEN |
| `npm.cmd run typecheck` after UI implementation | Exit 0 | Current TypeScript source |
| `node --test --test-concurrency=1 tests/button-led-lesson-trace.test.mjs tests/educational-program-events.test.mjs tests/circuit-schematic-v2.test.mjs tests/schematic-layout-v2.test.mjs` | Exit 0, 24/24 | Final source |
| `node --check e2e/journeys.spec.mjs` | Exit 0 | Final E2E syntax only |
| `npm.cmd run build:local` before UI implementation | Exit 0, 281 modules | Earlier source only; NOT final build evidence |
| `npm.cmd run test:e2e -- --grep "signal playback follows one event" --max-failures=1` before UI implementation | Interrupted, exit 1; no assertions ran | Runner built then stalled after preview startup. A read-only localhost probe reported socket access forbidden. Lead directed stopping server retries; this did not establish an E2E RED assertion. |

Full unit suite, final local build, final focused/full E2E, visual desktop/mobile checks and screen-reader observation: NOT_RUN by builder. Lead requested independent QA then Tester using the verified local-loopback test path. There are no live builder test processes waiting.

## Review boundaries and next action

- Review snapshot is `final-snapshot.json`; builder writes are frozen. Only lead may release/update the canonical lease.
- Check the 1440×900 and 375×812 layouts, real keyboard interactions, event source lines, exact 2D active net/wire IDs, 3D projection and selection preservation in a browser. Browser outcomes are unverified here.
- Run the full unit suite, local build and full E2E after independent QA; no final acceptance or completion verdict is claimed by this handoff.
- This remains presentation of the existing educational interpreter. `direction: none` is preserved. No voltage/current/electron flow, firmware execution or real hardware validation is claimed.
