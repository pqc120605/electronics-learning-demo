# Independent deep journeys — 2026-11-19

Verdict: **PASS for the exercised journeys** at 375×812 and 1440×900. No functional blocker reproduced. This is interaction evidence, not participant learning evidence or physical circuit validation.

Target: existing `http://127.0.0.1:5320`; Chromium headless, fresh isolated context per viewport, reduced motion. Executed 2026-11-18 21:43–21:45 UTC / 2026-11-19 Asia/Bangkok. No source/test edits, rebuild, deployment, external services or physical devices. Runtime used the available local `arduino-cli + avr8js` provider; provider responses were not mocked.

Both browser passes started/ended on `/assets/index-3GmwjfZV.js`, SHA-256 `19df136a7cba4f65face558872dc850f948cee684db1a4d91491e019084f49d6`.

## Passing routes and control sequences

Each final viewport run passed 13 grouped checks:

| Route | Actual sequence and result |
| --- | --- |
| `/learn/basics` | Fresh page: observe disabled until prediction. Select all five activity tabs in order; select every prepared case; choose prediction; focus observe and press Enter; select correct explanation. All five activities reach the earned criterion. |
| `/learn/basics` → reload → `/app` → `/app/learn/basics` | Reload preserves observation records and final activity. Home shows 5/5 criteria; `Tiếp tục: Thử sát ngưỡng cảm biến` returns to the correct activity. |
| `/build/freestyle` | Select Arduino Nano classic, then Arduino Uno R3; rendered board changes correctly. On mobile, hide control panel to see circuit, then reopen it for the next selection. |
| `/build/freestyle` | Add breadboard, 220 Ω resistor, LED; use keyboard-accessible pin list to wire board D13 → resistor1 terminal1, resistor1 terminal2 → LED anode, LED cathode → board GND. Three connections recorded. |
| `/build/freestyle` | Open code tab; enter Blink with `AUDIT_ON`/`AUDIT_OFF` Serial output; open observe tab; Run. Both Serial messages appear, rendered LED changes lit/unlit, captured D13 waveform appears. Stop. |
| `/build/freestyle` | Switch 2D → Schematic → 2D; schematic displays and circuit retains topology. |
| `/build/freestyle` → reload | Browser retains exact draft bytes. Fresh reload offers explicit `Mở bản nháp đã lưu`; opening it restores custom code and all three wires. |
| `/build/freestyle` | `Bản nháp` → download current circuit → close → `Bàn trống` → import downloaded JSON. Custom code and all three wires restored. |

Final URI for both sizes: `http://127.0.0.1:5320/build/freestyle`.

Zero uncaught page exceptions and zero browser console errors in both completed runs. Browser contexts closed after capture; no live browser state is being handed off.

## Evidence

- `deep-journey-results.json`: original desktop pass and original mobile attempt.
- `deep-mobile-recheck-results.json`: corrected complete mobile pass.
- `375-basics-fresh.png`, `375-basics-complete.png`, `1440-basics-fresh.png`, `1440-basics-complete.png`.
- `375-handwired-circuit.png`, `1440-handwired-circuit.png`.
- `375-runtime-waveform.png`, `1440-runtime-waveform.png`.
- `375-schematic.png`, `1440-schematic.png`.
- `375-import-reopened.png`, `1440-import-reopened.png`.

Visually inspected mobile runtime waveform and desktop imported circuit screenshots. The desktop imported circuit shows two honest orthogonal-routing diagnostics for w2/w3 intersecting another footprint; this did not lose endpoints or prevent the actual runtime toggling. This is an observed presentation limitation, not a reproduced functional regression.

## Initial harness failure and correction

The first mobile attempt asserted Nano art was visible while the control panel was open. The SVG existed but was intentionally hidden by mobile layout. `375-failure.png` and the original JSON retain that assertion failure. Repeated the complete mobile journey in a fresh context, using the actual `Ẩn bảng thao tác` / `Mở bảng thao tác` controls; all 13 grouped checks passed. No product or test assertions were changed. Scratch harnesses: `.tmp/full-audit-deep-journeys.mjs` and `.tmp/full-audit-deep-mobile.mjs`.

Limits: did not run all routes, 3D model checks, offline/denied storage, competing tabs, unsupported board runtime, screen-reader testing, exhaustive keyboard-only navigation, or Mini PC/real hardware tests. The passed observations reflect local simulation and browser storage, not persistent cloud backup or a real kit.
