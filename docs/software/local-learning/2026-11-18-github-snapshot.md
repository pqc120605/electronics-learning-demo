# GitHub source snapshot — 18/11/2026

Founder requested uploading the latest Mạch Mở project to the existing repository `pqc120605/electronics-learning-demo`, branch `main`. This is a source/documentation checkpoint, not a declaration that the paused roadmap is complete or a deployment to the Mini PC.

## Included

Current learning activities and local recovery, contextual Mở Bot, circuit diagnostic navigation, board capability finder, sampled waveform A/B controls and transition-input validation; existing analytics/server preparation, reviewed ngspice self-build/runtime/source materials, hardware review/source documents and screenshots present in this project. The existing Git history is retained.

The waveform tasks remain in review with released leases. Their [pause handoff](../../agents/runs/MM-SW-SAMPLED-CURSORS-001/PAUSED.md) records remaining display-time formatting/mobile-axis work and the interrupted full unit suite. Uploading does not change queue state or hardware approvals.

## Fresh checks before commit

- `npm.cmd run typecheck`: exit 0.
- `npm.cmd run check:public-release`: exit 0 for reviewed ngspice WASM SHA-256 `3096ce2c499c3062472b9d7953f5141d75a019296e22b0142f4979e5894008ec`.
- `npm.cmd run build:public`: exit 0, including the redistribution gate and local production build. Existing rp2040js dependency eval warning remains.
- Focused Node tests across course/storage/UI/guide/diagnostics/board capabilities/waveform/provenance/self-build/analytics: 62 unique cases. Initial sandbox command: 58 passed, 4 analytics cases failed with loopback `EACCES`. `node --test tests/local-analytics.test.mjs` was then run in the machine execution context: exit 0, all 4 passed. No source/assertion changes between those runs. This is not a fresh full-unit or all-web E2E pass.
- `git diff --check -- src tests e2e scripts package.json package-lock.json README.md`: exit 0 before staging.

Execution logs are local `.tmp/github-upload-*.log`, excluded from Git. Previous production E2E evidence (28 affected cases) remains linked from the pause handoff.

## Packaging

`.gitattributes` preserves exact bytes for the engine, vendored package and SHA-256-reviewed build/license materials. This prevents Windows `core.autocrlf=true` from corrupting a fresh checkout's pinned artifacts. A staged-index byte comparison is performed before commit.

The pending-file inventory found no files over 100 MiB, secret-looking filenames or high-confidence credential patterns. This bounded scan is not a comprehensive security audit. `.gitignore` continues excluding `.env`, dependencies, dist and temporary runtime data. No dependencies were installed and no device actions were performed for this upload.
