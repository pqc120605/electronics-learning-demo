# MM-SIM-STAGE-REV2 — implementation report

Date: 2026-11-12

## Result

Implemented and verified the Rev 2 LED vertical slice: versioned local CircuitDocV2 drafts, immutable jumper edits, an interactive 2D breadboard editor, a conventional schematic, a V2 assembly projection, shared lesson/builder topology, board-feature inspection, and provider-backed code-flow highlighting. The canonical LED circuit remains the common source for the builder and lesson.

The browser run exposed and fixed a migration defect: a schema-v4 workspace could be rewritten by legacy autosave before the user accepted its v5 preview. The builder now holds the legacy view in a read-only migration decision state; v4 source bytes remain unchanged until explicit acceptance. Legacy project export is also refused with a visible explanation when it cannot represent the v5 document without data loss.

This is not feature parity with Learn Arduino or Learn ESP. It is one supported LED lesson slice. The plan completion gate is satisfied for Rev 2; the broader lesson catalog and physical/electrical simulation remain separate work.

## Verification

| Command/check | Result |
| --- | --- |
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd test` | exit 0; 486 passed, 0 failed, 0 skipped |
| `npm.cmd run build:local` | exit 0; Vite production build completed |
| `npm.cmd run test:e2e` | exit 0; 43 passed, 0 failed (including accessibility and offline journeys) |
| Browser screenshots at 375×812 and 1440×900 | Captured from the lesson journey; both viewport checks passed with no horizontal overflow. |

The new builder journey seeds a realistic v4 workspace, checks no v5 write before consent, accepts migration, compares exact v4 bytes, adds and edits a board-pin-to-hole wire and its role, refuses a lossy legacy export, reloads, verifies stable wire selection across breadboard/schematic/3D and deletes the jumper. The lesson journey runs at both viewport sizes; it checks that topology changes toggle lesson completion, information tabs preserve selection and code cursor, supported provider events highlight the matching signal path, unsupported `analogWrite` produces no active-net animation, and the board-feature panel identifies `U2 · AMS1117-3.3` while retaining clone uncertainty.

Screenshots: `.tmp/playwright-results/journeys-lesson-code-steps-ff3eb-feature-selection-is-shared/lesson-circuit-375.png` and `.../lesson-circuit-1440.png`.

## Behavior and limits

- V4 workspace bytes are preserved. V2 is written under the separate V5 key only after the migration preview is accepted. Invalid V5 data is surfaced instead of silently falling back.
- Jumper endpoints use stable part/pin/hole identities. Editing, role changes and deletion are immutable document operations. Pointer/touch, click and keyboard paths are provided by the editor.
- Schematic and assembly are projections of CircuitDocV2. Unsupported geometry is diagnosed instead of receiving fabricated physical endpoints. Breadboard rail-hole geometry remains an explicit unverified assumption.
- The lesson shares the canonical LED circuit and reports completion from net membership. Supported code actions highlight the matching pin/net/wire/part path; unsupported code actions do not synthesize a path.
- Lesson edits are session-local and do not overwrite a saved builder draft. The builder is the path for persisting a V5 circuit.
- The trace is an educational code trace, not an electrical solve, firmware execution on a device, or physical measurement. The V2 editor is not yet consumed by SPICE, and the V2 run action remains gated. No general ESP32 firmware or all-lesson simulation support is claimed.
- Board subcomponent details come from named board-profile evidence. Unknown clone internals remain unknown.
- Schema-v4 remains the legacy pin-only workspace key; schema-v5 is created only after the migration preview is explicitly accepted. V4 source bytes are checked before/after acceptance and reload.
- The new migration gate prevents legacy autosave from touching the v4 source while a migration decision is pending. Unsupported legacy export is refused and explains that the v5 draft remains on-device.

## Changed files and SHA-256

```text
b3a2c7a2b81f9ae35897fd6d008c4c000ce89e563709f1a19b87e9b698e639ad  src/lib/circuitStorageV5.ts
3dcbbbfc37f5b80324fd26d6870ba7e9ecffeb94e1dc8ca63e86c6b07feefb3a  tests/circuit-storage-v5.test.mjs
9aa2e2b37d78e2187bfc9fafd1480ad19f62d6a6858b4ee72b0d50d9e60c3d28  src/lib/workspaceStorage.ts
3fc28a9efd7ce9a28d05a72950688ba61d5e75de88f8aa9c6baf9d8c5db8bf93  src/lib/circuitDocEdits.ts
66ba3cdf33671006709dafb51e8b6d99c63bc6e6b861d310146e63887c8a171c  tests/circuit-doc-edits.test.mjs
78cccf22b1e96c21a097b2f48929e5fd62d3dd93b37ba2746d807dff1c976e5c  src/components/builder/BreadboardEditor.tsx
e36c96f8372d1f4ec2b8799e20fe94dd9523e6c57241dbf02df1fb494dfbe4fb  src/components/builder/BreadboardEditor.css
7f629fddd27a068723d7bbaa66c255ecde5896abab73526c271c782c61f195db  tests/breadboard-editor.test.mjs
b2e5da60b8e37f8240b512d4c7a8c19d55146bf37a27239bf7cafcb3a1c00901  src/lib/schematicLayoutV2.ts
d7d8ed0749fb006d6565a0d34231f4e0f6b4acd2f264a1b6e06f90ea089a2b4c  src/components/builder/CircuitSchematicV2.tsx
8bf5320ac50940d65e5c5c13eb5f5aba77ad27123699fb25ec5612c852c0b514  src/components/builder/CircuitSchematicV2.css
a2cb8b9944cde5c3a812e9a290f54aa0f5fa867d140788a26e6505a3d47c3ee9  tests/schematic-layout-v2.test.mjs
a2967ffb614534fea94b15ba7428c27e0e60dce587a4e0c2aa197f7459b945a3  tests/circuit-schematic-v2.test.mjs
b906c6835ccf9041beb6327f85d9d93b1be466b11ca8b454c2e4314b533b9dd0  src/lib/assemblyLayout.ts
74142302f94a8a8081f3009092ccca04f1f84fb52e778819c5096264acf5679e  src/components/builder/AssemblyScene.ts
6b2ee3fe7dec6f8cf5c9c9dcdf4b5273d6611c939068a6e68b1fb91f7981c562  src/components/builder/AssemblyStage.tsx
8657e4a63dea2b07b707dd02484899a46d120d56a31fe89945f49e61477ce316  tests/assembly-layout-v2.test.mjs
a2794be2d82598e1cf1e598fed685807697bb65240525e3190bc5c09b672c026  src/pages/CircuitBuilderPage.tsx
6aee2b5106118f1e6520b1a04df7aaa1b03948d5f3a5ad537398c4d2f19f085e  src/components/builder/BuilderToolbar.tsx
5e8b5af196c6ab42e02d91e2a38874efef32b5ab1346bf798ad74bc4553e19f6  src/pages/LessonPage.tsx
e59e12cb642847753876a7bf889396834854c6f31ada506cc1db83a8d42c3ffd  src/components/lesson/LessonCircuitWorkspace.tsx
67cc22b1bcfab950924314785294e0e046d629e644622f6319a2d6d7ec1e4d9d  src/components/lesson/LessonCircuitWorkspace.css
bb6e2cf8f10e5a6c4a365ded5642a07aeac029844c27422ce364cd7197abb72f  tests/lesson-circuit-workspace.test.mjs
f097fa17ecbfdb14fbfff06f9bdc5580e466f958d4dc3aaf1eefc19f05d361c7  e2e/journeys.spec.mjs
d4ff75c952c3fa6d42065b088ca152afad07196778649d5832454ad8d8734f84  src/styles/app.css
d9c0b00e4d49b454546062efec44d7c6239adea3dcee3288c1d0a9a56e5b6530  src/styles/tokens.css
```

## Next

Rev 2 is complete. The next lesson inventory is in `docs/agents/runs/MM-SIM-STAGE-REV2/lesson-matrix.md`; it recommends `button-led` as the next separately tested slice. Its implementation plan is `docs/superpowers/plans/2026-11-12-interactive-button-led-lesson.md`.
