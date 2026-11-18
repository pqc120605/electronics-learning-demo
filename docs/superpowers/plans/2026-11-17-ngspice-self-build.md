# ngspice WASM self-build and Linux deployment

**Authorization:** User requested on 2026-11-17: “tự build ngspice trước rồi mới triển khai sang mini pc”. Lead executes this existing-engine replacement directly. No physical hardware configuration or firmware is involved.

**Goal:** Replace the untraceable ngspice WASM with a source-pinned build, retain distribution checks, then prepare Arch Linux hosting.

**Scope:** OPS-09 artifact/release evidence; SIM-02 analog engine compatibility. No capability-depth increase is claimed. Preserve existing simulation interface, routes, guest drafts and user data. Never edit unrelated ongoing audit fixes.

**Design:** ngspice 45.2 at `724dc77b9153dc75eaec474b1f7a44f1fcf5f362`, EEcircuit engine wrapper/build hooks at `be15b07abaf2c8a77623e4fc700d260004fbfa5a`, Emscripten 4.0.10 container resolved to an immutable digest. Build outside the product source tree, record patches, configure/link flags, notices, source bundle and SHA-256 outputs. Disable XSPICE, OSDI, readline, OpenMP and unused packaged PDK cards. Inspect actual enabled components, including numparam, before any distribution decision.

**Files:** New `scripts/ngspice-build/**`, focused build tests and evidence in `docs/agents/runs/MM-SPICE-SELFBUILD-20261117/**`; engine preparation/audit scripts, provenance/notices and generated engine assets only after the candidate passes. Shared package metadata may change only if required for reproducible offline preparation. Existing gate checks must remain fail-closed.

- [x] Register a nonoverlapping lead scope in the canonical queue (host approval obtained).
- [x] Inspect existing loader, provenance, gate and upstream recipe.
- [x] Confirm Podman build host exists; acquire pinned upstream source in `.tmp/ngspice-rebuild`.
- [x] Resolve SDK image digest and create source/patch/toolchain records.
- [x] Build candidate WASM and matching JS glue; do not mix old generated glue with new WASM.
- [x] Exercise candidate against DC divider, RC transient, AC response and error behavior in Node and browser worker.
- [x] Integrate reproducible preparation so reinstall cannot overwrite the self-built engine with the old npm binary.
- [x] Inventory compiled components and provide required notices/source materials; obtain independent review tied to final hashes.
- [x] Run affected packaging/provenance tests, runtime audit and public release gate. Build the website only after the gate clears.
- [ ] Prepare Arch Caddy/systemd hosting, transfer to the mini PC only after terminal/SSH access exists, verify from an external network.

**Rollback:** Keep current public artifacts/provenance untouched until a complete candidate passes; retain old exact hashes as historical evidence. Do not publish `build:local` output.

**Result:** Source-pinned build, compatible matching glue, local dependency preparation, corresponding source/relink/notices and independent artifact review completed. Node numeric, packaging/provenance and Chromium worker checks passed. Public release gate and public website build passed. Detailed evidence: `docs/agents/runs/MM-SPICE-SELFBUILD-20261117/`.

**Current constraints:** Mini PC access is not connected to this session; user can operate its terminal. Domain is not yet acquired. No deployment has occurred. Continue using `docs/deployment/arch-mini-pc.md` after receiving actual connection details; do not infer access or successful deployment from the prepared archive.
