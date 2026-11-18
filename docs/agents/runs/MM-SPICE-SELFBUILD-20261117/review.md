# Independent review — 2026-11-17

Reviewer: independent Codex QA `ngspice_review`; read-only, no recursive dispatch, no source edits. Lead records returned findings and verdict here.

Final materials verdict: **pass**. Earlier findings (LGPL source/relink material, device-license exceptions, per-file runtime notices and archive-based wrapper reconstruction) were resolved and reviewed again.

Reviewed WASM: `3096ce2c499c3062472b9d7953f5141d75a019296e22b0142f4979e5894008ec`, 4,519,343 bytes. Wrapper: `2295aea8e872b2b4bc661204ae1e367e1639195ce8591937a2f3d36598188574`. Material manifest SHA-256: `55e64bf30de9b72fd947683b8187952de011abea19f871859612843db2b11be5`.

Reviewer independently verified 23 material entries, all four public and all four vendored runtime artifacts, source-archive hashes, relink archive with 1,165 objects and 68 archives including Numparam, and link-map model exclusions. Runtime source archive SHA-256: `0413416b038106f3b695e7f9b396752270ffe9ae35110366789e353b8ac775f7`.

Review conditions: final browser-worker and assigned runtime/packaging checks must pass; lead then records review for these exact hashes. Lead executed checks are documented separately in report.md. Reviewer did not execute replacement-Numparam relinking and did not claim legal certification, physical validation or completed deployment.

This is an artifact-specific technical materials review. Future source, glue, WASM or material changes require affected verification and review again. Website-wide or board-model release readiness is outside this engine review.
