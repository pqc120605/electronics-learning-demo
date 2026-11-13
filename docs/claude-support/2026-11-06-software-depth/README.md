# Độ sâu phần mềm Mạch Mở — tổng kết (2026-11-06)

**Verdict (≤10 dòng)**
1. Nền kỹ thuật tốt: typecheck exit 0, 367/367 test, `build:local` exit 0, 16 route tải với 0 host ngoài và 0 lỗi console (local-first đạt ở mức tải route).
2. Không nhóm nào đạt D3: 0/9 nhóm. Đa số D2; Instruments, BOM, chia sẻ/lớp, Schematic/PCB ở D1; AI ở D0 (ESP32 runtime D0–D1).
3. Kiểm chứng **E2E 25/28**: 3 ca đỏ do hai nút "Tiếp tục lắp mạch" cùng tên (`BuilderGuidancePanel` + `CircuitBuilderPage.tsx:1018`) → WA-01.
4. `check:public-release` exit 1: ngspice WASM chưa cleared (5 điều kiện) → không có bản public; `build:local` dùng được.
5. Nợ thấp nhưng thật: lỗi lưu nháp bị nuốt (`CircuitBuilderPage.tsx:677-678`), pin không thao tác bàn phím, `strict` tắt.
6. Roadmap 12 hạng mục / 3 giai đoạn; 12 prompt nháp (4 slice ĐỀ XUẤT SOL: 08, 09, 10, 12). Chưa gửi Codex.

## % năng lực đạt D3 theo nhóm
SPICE 0% · Firmware 0% · Board 3D/pinout 0% · Học/quiz 0% · Instruments 0% · Project/kit/BOM 0% · Chia sẻ/lớp 0% · AI 0% · Schematic/PCB 0% (chi tiết ở `depth-matrix.md` §2; nền tính từ register 04/11 + bằng chứng phiên này).

## Top 5 gap
1. Không có runtime ESP32 dù là board học chính (WA-10).
2. Instruments chỉ D13 và chỉ vẽ; không cursor/đo/multimeter/serial hai chiều (WA-05, WA-08).
3. Không có đánh giá theo rubric/live criteria; progress chỉ `runStarted` (WA-09).
4. SPICE: workspace chỉ `.op`; không tham số live; WASM chưa cleared để public (WA-04, WA-12).
5. BOM thiếu variant identity; e2e library identity đỏ; codec project chưa theo contract (WA-06, WA-07, WA-01).

## Skills
Đã nạp: `caveman:investigate-first`, `my-skills:verification-before-completion`, `anthropic-skills:built-in-browser`, `agent-skills:code-review-and-quality`, `ecc:competitive-platform-analysis`, `agent-skills:source-driven-development`, `agent-skills:doubt-driven-development`, `agent-skills:planning-and-task-breakdown`. Skill thiếu: không. Bỏ qua phần skill trái `<constraints>` (spawn subagent, ghi `tasks/plan.md`, cross-model CLI).

## Chỉ dẫn file
- `baseline-checks.md` — lệnh, e2e, route.
- `depth-matrix.md` — ma trận 9 nhóm, % D3, phản biện.
- `roadmap.md` — chấm gap, G-A/G-B/G-C, giải pháp.
- `luna-prompts/01..12-*.md` — slice nháp; `founder-questions.md`; `report-to-leader.md`; `screenshots/` (16 ảnh + `routes.json`).

## Hạn chế
Phản biện mức D là tự phản biện (không spawn subagent theo ràng buộc). Chưa chạy: offline hoàn toàn, screen reader, 768/1024 px, `build`/`build:public`. Một số hàng register là "unassessed" nên % D3 = 0 là mức thận trọng, không phải đo từng hàng. `.tmp/playwright-*` và `dist/` được sinh bởi e2e/build (gitignored).
