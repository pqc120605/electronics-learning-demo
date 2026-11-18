Third-party software used by Mạch Mở

- `eecircuit-engine` 1.9.0-machmo.1 is the source-pinned local wrapper fork. The wrapper is MIT; its license is included in `ngspice-selfbuild/eecircuit-engine-MIT.txt`. Upstream: https://github.com/eelab-dev/EEcircuit-engine
- The package also contains a compiled ngspice WebAssembly runtime, served at `/vendor/eecircuit-engine/spice.wasm`. The observed runtime is ngspice 45.2; its exact artifact hash, size, build header, and source provenance are recorded in `spice-engine-provenance.json` and can be checked with `npm run audit:spice-engine`.
- Distribution status is recorded in `spice-engine-provenance.json` and checked by `npm run check:public-release`. This self-built engine includes ngspice core/model Modified BSD notices, LGPL Numparam sources/relink materials, exact Sparse attribution, wrapper MIT and Emscripten runtime source/header notices. See `NGSPICE-NOTICE.txt` and `ngspice-selfbuild/README.txt`. Disabled model families and build features are explicitly listed; do not infer engine licensing from the wrapper's MIT license.

The self-build records exact source revisions, patches, toolchain versions, source archives, compiled objects and a link map. Review and runtime verification apply only to the artifact hashes listed in the provenance record. Simulation does not validate physical hardware.
