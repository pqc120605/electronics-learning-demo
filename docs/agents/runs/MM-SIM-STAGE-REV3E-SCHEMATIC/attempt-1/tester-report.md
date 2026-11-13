# Tester report — MM-SIM-STAGE-REV3E-SCHEMATIC, attempt 1

**Verdict:** PASS  
**Date:** 2026-11-12  
**Snapshot:** attempt-1/final-snapshot.json  
**Scope:** frozen six-file snapshot; no source or assertion edits by Tester.

## Results

| Command | Exit | Result |
|---|---:|---|
| node --test tests/schematic-layout-v2.test.mjs tests/circuit-schematic-v2.test.mjs tests/circuit-doc-edits.test.mjs | 0 | 17 passed, 0 failed |
| npm.cmd run typecheck | 0 | Passed |
| npm.cmd test | 0 | 508 passed, 0 failed, 0 skipped |
| npm.cmd run build:local | 0 | Passed; Vite transformed 281 modules |
| npm.cmd run test:e2e | 0 | 50 passed, 0 failed in 2.3 minutes; Chromium preview on local loopback |

The first sandboxed E2E invocation did not start tests because local preview/loopback was unavailable and was interrupted. The successful run used the approved local-loopback execution and no external network. Playwright result metadata says status=passed and failedTests=[].

## Focused browser outcomes

- Both desktop 1440 px and mobile 375 px accessibility journeys passed.
- Rev3D wire create/edit/reject flows passed at 1440×900 and 375×812.
- Rev3E schematic selection, hole/wire overlay synchronization, and code highlights passed at 1440 px and 375 px.
- Legacy code-to-net highlight test passed with exactly three canonical active nets.
- All other journeys, including offline service-worker behavior, passed.

Full Playwright report and result files are preserved in tester-artifacts/full-e2e-report/ and tester-artifacts/full-e2e-results/.

## Snapshot verification

All six source/test hashes match attempt-1/final-snapshot.json before and after the checks:

| File | SHA-256 |
|---|---|
| src/lib/schematicLayoutV2.ts | f92572f628716403807ff320e1ecffeca45e4a27848ff76a2eb083ade213521e |
| src/components/builder/CircuitSchematicV2.tsx | 38a95b1910ae03b9cb5881d413346f36e789f7ce4e5de1a326cede289639aad4 |
| src/components/builder/CircuitSchematicV2.css | 4adea72ca1deba70d00a409b15e052019d270d9e3565e6a10add5cf87371430f |
| tests/schematic-layout-v2.test.mjs | e3ed24e6b1d82088f62ecd41bbb32817dfb6a225f28a8128a7f6d12059640d7a |
| tests/circuit-schematic-v2.test.mjs | ba2aad9e4080ad549c5abeadcb4fb95cef022d0485e12198871b2ffe82257a72 |
| e2e/journeys.spec.mjs | 5035fa0c8aa25825917b91ece84c0f449cdecae41e704cf0abae6595c505b2f7 |

## Limits

This verifies the local web implementation and its supported educational topology only. It does not validate physical electronics, board geometry, electrical values, or real hardware behavior.
