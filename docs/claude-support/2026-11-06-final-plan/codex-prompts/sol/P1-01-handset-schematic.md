Model: GPT-6.1 Sol
Goal: Vẽ schematic KiCad tay cầm (kiến trúc nguồn v1) theo net map và pin map đã chấp nhận, đạt ERC không lỗi chặn.
Context: đọc trước `docs/claude-support/2026-11-06-final-plan/phases/P1-local-core.md`, `docs/hardware/mobot-v2-esp32-mcu-contract.md`, cấu hình đã duyệt (từ P0-02), `docs/hardware/claude-support/2026-11-06-pcb-gate/gate-matrix.md`, `docs/hardware/claude-support/2026-11-06-pcb-status/final/delta-handset-2026-11-07.md`. Task: MM-HW-MOBOT-REMOTE-KICAD-001.
Scope: allowed_paths `hardware/mobot-v2/handset-carrier/**` (chỉ khi lease active). forbidden_paths: `docs/claude-support/**`, `docs/hardware/claude-support/**`, `.codex/**`, `src/**`, `hardware/mobot-v2/robot-carrier/**`.
Constraints: local-first; không thêm dependency; không cấp lease cho mình; không đặt `approved_by`. ĐIỀU KIỆN BẮT BUỘC: chạy `node D:/StartupOS/docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001`; nếu exit ≠ 0 thì DỪNG, báo lead, không viết file nào. Dùng header cái 2,54 mm với dung sai cơ khí lớn (board clone chưa đo). Mọi giá trị điện phải có datasheet/số đo; còn thiếu ghi TBD.
Approval boundaries: dừng và hỏi founder trước khi xoá file, thêm dependency, đổi schema dữ liệu, gửi PCB đi sản xuất, mua linh kiện, chọn linh kiện chưa qua Box 08.
Done when: `.kicad_pro`/`.kicad_sch` tồn tại trong path lease; `kicad-cli` ERC exit 0 hoặc danh sách lỗi kèm chủ sở hữu; netlist khớp net map; danh sách giá trị TBD.
Report: file đã đổi, lệnh + exit code, ghi vào `docs/agents/runs/MM-HW-MOBOT-REMOTE-KICAD-001/`.
Claude review: CÓ
Khi xong, ghi docs/agents/runs/<task_id>/review-request.md gồm: mục tiêu, file đã đổi, lệnh kiểm chứng + kết quả, câu hỏi cụ thể cho Claude, scope ≤10 đường dẫn. Cuối nhật ký phiên thêm khối RELAY CODEX → CLAUDE (type REVIEW_REQUEST) theo docs/claude-support/2026-11-06-leaders/leader-prompts.md. DỪNG task tới khi founder dán REVIEW_RESULT và bạn đã ghi DISPOSITION.
