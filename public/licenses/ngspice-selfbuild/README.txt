SOURCE AND RELINK MATERIALS — 2026-11-17

1. Unpack ngspice-source.tar.gz into /work/ngspice and wrapper-source.tar.gz separately.
2. Apply source.patch from /work/ngspice using patch -p3. This contains the final source modifications, including virtual terminal detection and excluded model families.
3. Build from source with Containerfile, build.sh, sources.json, prepare-inputs.mjs and assemble-wrapper.mjs supplied here. Source inputs are Git archive output with core.autocrlf=false at the pinned commits, validated by input-record.json. Requires Emscripten 4.0.10 and autotools recorded in build-packages.tsv.
4. For relinking, unpack relink-build.tar.gz under /work/ngspice, keep the supplied pre.js at /output/pre.js, and use the recorded toolchain. After modifying a library source, run emmake make -j2 in /work/ngspice/release. The generated makefiles retain the complete link command and all ngspice object/archive files.
5. Reassemble the MIT JS wrapper using the supplied archive (no Git metadata required): from the application root with TypeScript 6.0.2 installed, run:
   node scripts/ngspice-build/assemble-wrapper.mjs public/licenses/ngspice-selfbuild/wrapper-source.tar.gz OUTPUT_DIRECTORY public/licenses/ngspice-selfbuild/input-record.json
   The assembler validates the decompressed archive hash against the pinned input record, removes unused PDK cards, adds virtual stdin/browser WASM URL, and forces interactive invocation. This archive path was executed and reproduced the delivered wrapper SHA-256.
6. Copy the matching eecircuit-engine.mjs, readOutput.mjs, spice.mjs and spice.wasm together; never mix generated glue and WASM from different builds.

The initially built candidate was amended incrementally by changing src/main.c virtual terminal detection and running emmake make -j2 again; the supplied source.patch/objects describe the final state. Build dates are embedded by upstream; byte-for-byte reproducibility across different build times is not claimed. Input-record recipe hashes identify the recipe at source-export time; release-files.json records final recipe/material hashes.

toolchain-runtime-source.tar.gz contains the original Emscripten 4.0.10 system/lib and src trees, including notices embedded in musl math/qsort, dlmalloc, compiler-rt and JavaScript runtime source files. These complement toolchain-notices.tar.gz; do not remove per-file source headers.

For a clean build using Git rather than source archives, clone https://github.com/danchitnis/ngspice-sf-mirror and checkout 724dc77b9153dc75eaec474b1f7a44f1fcf5f362; clone https://github.com/eelab-dev/EEcircuit-engine and checkout be15b07abaf2c8a77623e4fc700d260004fbfa5a. Run prepare-inputs.mjs on those checkouts to create and hash LF archives, build the Containerfile, and run the container with the input directory read-only at /inputs and an empty output directory at /output. The container has no network requirement during compilation.
