# Mạch Mở — đợt triển khai đầu, 05/11/2026

Đã hoàn thành MM-BASE-001, MM-CONTRACT-001 và MM-FIX-001 theo yêu cầu cho agents bắt đầu triển khai. Native software_engineer đã điều tra/chốt contract; tester chạy checks; qa_safety_reviewer review độc lập. Codex lead là người ghi source/queue. Không khởi chạy đủ8roles khi slice chỉ cần3 chuyên môn.

## Thay đổi có thể kiểm

- src/lib/projectBundle.ts: normalizeProjectBundle pure/deterministic/idempotent, clone input, điền đúng current draft còn thiếu kể cả empty string; giữ nguyên code/draft xung đột, identity/timestamp/layout; trả diagnostic issues ngoài serialized data. create/parse dùng cùng quy tắc.
- src/pages/CircuitBuilderPage.tsx: không ghi đè draft khác code khi mở; báo conflict bằng status nhìn thấy ở mọi bước; direct file import giữ nested workspace.projectId. Branch drafts chỉ serialize khi đã được cung cấp hoặc user sửa/khôi phục, không suy authorship từ trùng template; cập nhật recovery/reset/board change.
- tests/regressions.test.mjs:5regressions thực thi bảo toàn dữ liệu/empty/conflicts/multi-context/template-equal/purity/idempotence.
- e2e/journeys.spec.mjs: so toàn bộ document trừ outer exportedAt, thêm direct identity/conflict/reload và branch supplied/edit/reset/reload. Selector restore được giới hạn đúng editor region, không bỏ assertion.
- tests/board-catalog.test.mjs: sửa2expectations cũ, vẫn kiểm model/source và cả hai giới hạn không có lesson profile/firmware support.

Không cài dependency, đổi schema, stage/commit/merge/publish, sửa sibling ReTrack hoặc thực hiện thiết bị. Dùng checkout local vì product chưa tracked trong repo cha; không tạo worktree thiếu source.

## Bằng chứng cuối

| Check | Actual |
|---|---|
| npm.cmd test |359/359pass,exit0 |
| npm.cmd run typecheck |exit0 |
| npm.cmd run build:local |exit0,internal only |
| All9journeys command |8pass/1fixture selector fail,exit1 |
| Affected branch recheck after selector-only correction |1/1pass,exit0; reset+reload assertions đều reached |
| Current snapshot |5/5hashes khớp trước/sau Tester; independent QA + supplemental review PASS |

Chín journeys được xác minh qua lượt đầy đủ cộng kiểm lại test bị ảnh hưởng; không nói command9test ban đầu đã exit0. Chỉ E2E selector thay đổi giữa hai lượt;359Node/typecheck/build và8journeys còn lại giữ applicability. Five failing Node fixtures và browser failure được quan sát trước sửa source. Không dùng test plan hoặc lời tự báo thay evidence.

[Baseline](../../../docs/agents/runs/MM-BASE-001/test-report.md) · [Contract](../../../docs/agents/runs/MM-CONTRACT-001/contract.md) · [Fix handoff](../../../docs/agents/runs/MM-FIX-001/handoff.md) · [QA](../../../docs/agents/runs/MM-FIX-001/review.md) · [Final test report](../../../docs/agents/runs/MM-FIX-001/test-report.md) · [Current source hashes](../../../docs/agents/runs/MM-FIX-001/source-after.json). Raw artifacts tại product .tmp/MM-BASE-001 và .tmp/MM-FIX-001.

## Giới hạn và việc tiếp

Direct-file identity đã sửa; local-library wrapper hiện còn dùng chung projectId trong một số đường open/save, đã ghi follow-up MM-DATA-001 cùng unsupported/future schema/raw/quota/recovery. Không claim toàn bộ PRJ-04 D3 hoặc migration pipeline hoàn tất.

Public release vẫn BLOCKED do ngspice provenance gate, giữ nguyên WASM source/dist hash ed7995425b6f7af02db874539d13ea10d07759d5f2be6b79969343459ae886e4; baseline gate evidence còn áp dụng. Không có physical/bench/a11y toàn diện/manual/screen-reader/backend-live pass từ lượt này.

Queue hiện4done/1ready/3scoped/4backlog; next ready MM-BOM-001 thiết kế BOM/support contract (HK + EF review, sau đó QA), chưa thực thi, không procurement. Không có agent chạy nền sau khi các handoff đợt này hoàn tất. Trạng thái chính thức ở shared tasks.json; dashboard chỉ projection. Rollback chọn đúng5files theo source-before/source-after và source patches trong chat; giữ nguyên dữ liệu/evidence/user changes, không reset/clean toàn workspace.
