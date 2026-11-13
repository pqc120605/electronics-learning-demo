# Independent verification — MM-SIM-STAGE-REV3C-BUTTON-UI

Ran on 2026-11-12 (UTC+07) from `D:/StartupOS/electronics-learning-demo` using Windows NT 10.0.26300.0, Node 24.21.0, npm 11.19.0, and Playwright 1.64.1 with the installed Chromium Headless Shell 156.0.8078.4 (revision 1248). Playwright used one worker and a dedicated Vite preview on `127.0.0.1:5196`. The elevated invocation was approved and the preview process had exited after the run.

All nine paths in [final-snapshot.json](final-snapshot.json) matched their SHA-256 values before the first check, between command groups, and after E2E. The manifest itself had SHA-256 `518f1269b16fc87b9085a74ac7822768096390de95c5725ccaf060f71decd896` throughout. The last comparison was at 14:31:03 local time. No source, assertions, configuration or queue files were edited during verification.

## Commands and results

| Command | Expected | Observed | Exit |
| --- | --- | --- | --- |
| `node --test tests/button-led-lesson-trace.test.mjs` | Pass all four trace mapping and invalidation cases | 4 passed, 0 failed or skipped | 0 |
| `npm.cmd run typecheck` | Complete without TypeScript diagnostics | Completed without diagnostics | 0 |
| `npm.cmd test` | Pass the full Node suite | 503 passed, 0 failed, skipped, cancelled or todo (335.4 s) | 0 |
| `npm.cmd run build:local` | Produce the internal bundle | Vite 8.3.5 transformed 281 modules and produced `dist/` | 0 |
| `npm.cmd run test:e2e` | Pass the full Chromium suite | 46 passed (2.2 min), including all three Rev3C journeys and both lesson axe checks. Zero failures, skips or retries | 0 |

## Observed acceptance

| Criteria | Reproduction | Observed |
| --- | --- | --- |
| 1, 2, 4 | Open `/app/learn/button-led` at 1440×900. Press the virtual button with the pointer, release with Space, then press with ArrowRight. | Lesson title, circuit view controls, previous and next lesson links, and virtual button were in the viewport. Document width and height fit the viewport. Released read `HIGH → else → LED tắt`; pressed read `LOW → if → LED sáng`. The result named the bounded interpreter. The desktop screenshot also shows progress and the current result. [Desktop journey](../../../../e2e/journeys.spec.mjs#L4) |
| 1, 3, 5, 6 | Open the same route at 375×812. Press the virtual button, select the input contact in Details, open Schematic and Code, then change the supported comparison and rerun. Test unsupported code, restore the sample, select Uno R3, and follow the next lesson link. | All four switches fit in the captured mobile viewport. The selected `button-1:contactA`, pressed input and edited code survived view switches. Editing cleared the old highlight. Rerunning the inverted comparison produced `LOW → else → LED tắt`. The unsupported operator and Uno R3 produced unsupported states. The virtual button remained in the viewport without horizontal page overflow. The next lesson opened outside the button workspace. [Mobile journey](../../../../e2e/journeys.spec.mjs#L71) |
| 5, 6 | Select `w-input-to-button` in the desktop inspector. Open Schematic and 3D, return to Breadboard, delete the wire, restore the circuit and rerun. | The same wire ID survived switching with the button still pressed. Schematic selection mapped to the selected net, and keyboard selection reached `bb1:14a` and `button-1`. Removing the wire cleared selection and active paths, and marked the trace invalid. Restore produced stale state and rerun recovered the pressed result. The 3D assertion accepts either the canvas or the documented WebGL fallback. [Desktop journey](../../../../e2e/journeys.spec.mjs#L4) |
| 6 | Open `/app/learn/button-led?board=unregistered-board`. | The view identified the ESP32 reference circuit, marked the trace unsupported, disabled 3D, omitted the lab handoff link and showed zero active wires. [Unknown-board journey](../../../../e2e/journeys.spec.mjs#L118) |
| 7, 8 | Run the trace helper, Chromium journeys and assigned command gate. | The helper passed canonical input/output wire mapping for both states, exclusion of unrelated wires and the resistor output net from voltage inference, stale-result clearing, and rejection of malformed code, mismatched profiles and broken or shorted topology. The browser journeys checked both requested viewports, keyboard operation, selection retention and page overflow. All assigned commands exited 0. [Helper assertions](../../../../tests/button-led-lesson-trace.test.mjs#L41) |
| Accessibility | Run the configured axe scan on `/learn/button-led` at 375×900 and 1440×900. | Both scans passed the assertion for zero serious or critical violations in the configured WCAG tag set and no horizontal page overflow. [Accessibility assertions](../../../../e2e/accessibility.spec.mjs#L4) |

## Browser artifacts

- [Playwright HTML report](../../../../.tmp/playwright-report/index.html)
- [Desktop at 1440×900](../../../../.tmp/playwright-report/data/747d94d32d73b0273df6021a58bd4c3db96be7c0.png) shows the restored breadboard with the pressed result, lesson progress and navigation.
- [Mobile at 375×812](../../../../.tmp/playwright-report/data/2e354827b1daed803e3c778b67bd1495d6d34054.png) shows all four switches and the virtual controls while viewing the unsupported Uno R3 result.

## Coverage limits

- The desktop 3D test verified selection and result retention when opening that view, with a canvas-or-fallback assertion. The screenshots capture the final states of the journeys and do not establish a specific rendering branch or per-wire 3D visuals.
- The mobile screenshot, captured after the view-switch and board-change sequence, shows the internal details panel partway down its content, with the first subheading partly clipped under the tabs. The virtual controls, switcher and unsupported status are visible. The desktop screenshot also shows an internally scrolled breadboard panel after the restore sequence.
- NOT_RUN: manual screen-reader and touch interaction, cross-browser checks, reduced-motion and exact target-size measurements, exhaustive per-lesson regression and physical board tests. The accessibility result covers the configured automated rules.

The assigned software verification passed on the frozen snapshot. Public distribution and hardware validation were outside this verification.
