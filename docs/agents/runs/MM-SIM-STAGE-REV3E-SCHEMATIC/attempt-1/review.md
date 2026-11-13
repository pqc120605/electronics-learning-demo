# Independent QA re-review — MM-SIM-STAGE-REV3E-SCHEMATIC, attempt 1

**Verdict:** PASS — source review only  
**Reviewed:** 2026-11-12  
**Snapshot:** `final-snapshot.json`  
**Scope:** bridge highlight class semantics, mobile cross-view overlay test, changed-file hashes, and prior schematic/Rev3D acceptance.

## Verified

- `CircuitSchematicV2.tsx:33–35,40,48` keeps `.net-active` and `.net-selected` on canonical line groups and uses separate `.bridge-active` and `.bridge-selected` on bridge overlays. Both use the same selected-wire and active-endpoint predicates.
- `CircuitSchematicV2.css:10–14` keeps bridge highlight colors and stroke widths, including lesson selection styling.
- `e2e/journeys.spec.mjs:279–280` guards against active classes on noncanonical groups. Existing `.net-active` count remains exactly three at line 615; the expectation was not relaxed.
- `e2e/journeys.spec.mjs:291–295` scrolls hole `bb1:20g` and pin `board-1:input` into their separate picker viewports before asserting the selected `w-input-to-button` overlay. This matches `ButtonLedLessonLab.tsx:388–408`, which omits path geometry while endpoints are outside those viewport bounds and redraws after captured scroll events.
- The journey still checks net selection, selected hole, selected overlay wire, `button-1:contactA`, selection through Code and back, active net highlight, exact hole labels and page-width overflow.
- Keyboard handlers, selection callbacks, accessible names, symbols and electrical-boundary language remain intact. Layout and both focused schematic test files are hash-identical to attempt 0. The four Rev3D implementation files still match the Rev3D final manifest, with the prior create/edit/reject/role/delete/reset journeys represented.

## Limits

- No product tests or browser checks were run by QA. Attempt-0 results do not establish attempt-1 success.
- Actual bridge rendering, mobile picker scrolling and complete E2E success remain for Tester.

## Reviewed SHA-256

All six values match `final-snapshot.json`.

| File | SHA-256 |
|---|---|
| `src/lib/schematicLayoutV2.ts` | `f92572f628716403807ff320e1ecffeca45e4a27848ff76a2eb083ade213521e` |
| `src/components/builder/CircuitSchematicV2.tsx` | `38a95b1910ae03b9cb5881d413346f36e789f7ce4e5de1a326cede289639aad4` |
| `src/components/builder/CircuitSchematicV2.css` | `4adea72ca1deba70d00a409b15e052019d270d9e3565e6a10add5cf87371430f` |
| `tests/schematic-layout-v2.test.mjs` | `e3ed24e6b1d82088f62ecd41bbb32817dfb6a225f28a8128a7f6d12059640d7a` |
| `tests/circuit-schematic-v2.test.mjs` | `ba2aad9e4080ad549c5abeadcb4fb95cef022d0485e12198871b2ffe82257a72` |
| `e2e/journeys.spec.mjs` | `5035fa0c8aa25825917b91ece84c0f449cdecae41e704cf0abae6595c505b2f7` |

QA changed no files and ran no tests/browser.
