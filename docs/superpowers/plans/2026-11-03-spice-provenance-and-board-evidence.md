# SPICE Provenance and Board Evidence Implementation Plan

> **For agentic workers:** Follow this plan inline. Use TDD for each behavior; do not stage or commit.

**Goal:** Record and reproducibly verify the exact SPICE runtime artifact, clarify its license boundary, and remove untranslated user-facing board evidence.

**Architecture:** Keep the runtime audit separate from the production UI. The audit will execute a tiny DC circuit against the installed engine, inspect the ngspice header and WASM bytes, and compare those values to a checked-in provenance manifest. Localize the one identified English evidence string while preserving product names and license identifiers.

**Tech Stack:** Node.js ESM, `eecircuit-engine` 1.8.0, Node test runner, TypeScript/React.

**Spec:** Current scope approved by the user in the ongoing Mạch Mở implementation thread; latest state is `docs/MACH-MO-MVP-STATUS.md`.

## Global Constraints

- Do not claim the wrapper MIT license covers the embedded ngspice WASM.
- Preserve existing user/workspace changes; do not stage, commit, or publish.
- Keep exact hardware accuracy and distribution rights explicitly unresolved where source evidence is insufficient.
- Keep the browser-facing evidence in Vietnamese except proper names and license identifiers.

## Review Focus

- Engine version changes while the manifest stays pinned.
- WASM bytes change while package version stays pinned.
- ngspice runtime header or DC divider output no longer matches expected values.
- License notes could be misread as a legal conclusion or blanket redistribution permission.
- XIAO ESP32-S3 evidence accidentally retains English instructions or changes attribution.

---

### Task 1: Pin and audit the SPICE runtime artifact

**Files:**
- Create: `public/licenses/spice-engine-provenance.json`
- Create: `scripts/audit-spice-engine.mjs`
- Create: `tests/spice-engine-provenance.test.mjs`
- Modify: `package.json`

**Steps:**
- [x] Add tests for the manifest fields, the runtime audit's expected header/version/hash checks, and a solved 2.5 V DC divider.
- [x] Run the focused test and confirm it fails because the manifest/audit is absent.
- [x] Add the manifest with observed `eecircuit-engine` version, ngspice runtime version, WASM SHA-256/size, build header, and source/license references; mark upstream source commit as unknown.
- [x] Add a standalone `audit:spice-engine` command that runs the real package locally and exits non-zero on package, runtime, hash, or divider mismatch.
- [x] Pin the dependency and lockfile to exact version `1.8.0` so future installs cannot select a different audited artifact.
- [x] Run the focused test and the audit command; verify both use current installed files.

### Task 2: Clarify third-party notices

**Files:**
- Modify: `public/licenses/README.txt`
- Create: `public/licenses/NGSPICE-NOTICE.txt`
- Modify: `docs/MACH-MO-MVP-STATUS.md`

**Steps:**
- [x] State separately that `eecircuit-engine` declares MIT and the embedded ngspice runtime is a distinct artifact.
- [x] Record the observed runtime/version/hash and link upstream `COPYING`/FAQ; state that exact upstream source commit and compiled-component inventory are not present in the npm package.
- [x] Keep the public-redistribution review as an explicit release gate rather than claiming the audit settles legal compatibility.
- [x] Add a regression assertion that the notice mentions both licenses and the unresolved build provenance.

### Task 3: Localize board evidence copy

**Files:**
- Modify: `src/data/boardModelSources.ts`
- Create or modify: `tests/board-model-evidence-copy.test.mjs`
- Modify: `docs/MACH-MO-MVP-STATUS.md`

**Steps:**
- [x] Add a regression test for the XIAO ESP32-S3 evidence copy and preserve the exact `Seeed Studio`, `@SeeedStudio`, and `CC BY-SA 4.0` attribution tokens.
- [x] Confirm the test fails on the current English instruction.
- [x] Replace only the untranslated instruction/revision labels with accurate Vietnamese text; do not alter license or source meaning.
- [x] Run focused tests, full test suite, typecheck, production build, and board model audit.
- [x] Update the status document with the final evidence, remaining limits, and verification outputs.
