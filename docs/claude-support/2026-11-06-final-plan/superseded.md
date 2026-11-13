# Phần kế hoạch cũ bị thay hoặc cần ghi chú

Nguồn: báo cáo subagent đọc `docs/product/`, `docs/mach-mo-final-*.md`, `docs/mach-mo-mvp-backlog.md`, `tasks.json`. Đây là đề xuất theo đích mới; Codex lead quyết định ghi vào `tasks.json`.

| Tài liệu cũ | Phần | Trạng thái | Thay bằng |
|---|---|---|---|
| `mach-mo-final-feature-blueprint.md` | :119-127 (web miễn phí → pilot kit PCB → mở rộng), tự ghi "không mô tả code hiện tại" (:6) | bị thay | roadmap P0–P8 |
| `mach-mo-mvp-backlog.md` | :132-141 (MM-01…MM-08, chặng A–D) | bị thay; trùng tiền tố `MM-` với task queue nhưng khác nghĩa | `slices.md` |
| `mach-mo-final-product-spec-web-app.md` | :285-299 (roadmap A–F), :262-283 (hiện trạng 02/11: 11 bài, 21 board) | lỗi thời một phần | `baseline.md` |
| `mach-mo-final-web-app-framework.md` | :119-127 (7 bước dựng khung) | lịch sử | — |
| `...-parallel-agent-delivery-plan.md` | :5 "không đặt deadline", mốc R0–R4, §P26–P32 (IoT, robot, cloud, EDA nâng cao) | thay một phần; P26–P32 hoãn (ngoài P01–P25) | phase P0–P8 theo số phiên |
| `mach-mo-final-2026-11-05.md` | số "12 task", "một writer", "8 TOML", MM-BASE-001 "ready" | lỗi thời (tasks.json có 20 task, 9 role, BASE-001 done, 2 writer) | `tasks.json` hiện tại |
| register/master (143 capability, D0–D4) | phạm vi toàn bộ | còn hiệu lực làm bản đồ; đích mới lấy P01–P25 tới L3=D3 | `README.md`, D6 |
| `hardware-config-v1` (DevKit V1, 4 motor, PCB ≤100×100), r6/r7 | cấu hình | lệch với "Starter 2 cấu hình" nếu 2 cấu hình không phải tay cầm + robot [chưa kiểm chứng] | cấu hình mới P0-S02, D1 |

Còn hiệu lực: `final-contracts` (K-ID/K-STORE/K-CTX/K-RUN/BOM), `hardware-software-architecture`, `product-architecture-and-roles`, `parallel-build-policy.md` v3 (2 writer, lease, hash cấu hình), local-first.

Mâu thuẫn `tasks.json` với tài liệu chưa giải: 20 task so với "12 task"; QA đã `changes_requested` cho MOBOT-IF trong khi tài liệu ghi "chưa có QA độc lập"; r6 `approved_by=user` nhưng `pending_technical_review`; `design_status: FINAL v1` trong khi 3 task `in_review` chưa QA pass.
