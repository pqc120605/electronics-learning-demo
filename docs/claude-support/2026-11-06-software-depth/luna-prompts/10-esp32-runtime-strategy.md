# 10 — WA-10 Chiến lược runtime ESP32 (NHÁP, chưa gửi Codex) · **ĐỀ XUẤT SOL** · G-B · nghiên cứu, không code

Lý do đánh dấu SOL: đây là quyết định kiến trúc/scope (engine, giấy phép, handoff), phụ thuộc câu hỏi founder Q2; không phải slice triển khai cho Luna. Sol viết tài liệu quyết định; chỉ sau đó mới tách slice code.

Goal: Chốt hướng cho ESP32 (board học chính) trong ba phương án: scenario/subset hiện có, handoff `.ino`/Arduino IDE, hoặc runtime cục bộ qua QEMU/Renode.

Context:
- Đọc trước: `docs/research/2026-11-05-mach-mo-reference-coverage.md` §2 (P05, P22, P23, P24, P25) và §4.3 (pin phiên bản/target/peripheral/license trước spike), `docs/product/2026-11-05-mach-mo-hardware-software-architecture.md`, feature-depth-register FW-08..11, `src/lib/avr8jsRunner.ts:39-40` (chỉ ATmega328P), `src/lib/arduinoSketchExport.ts`, `src/data/boardCapabilityRegistry.ts:100-107`.
- Bằng chứng: không có runtime ESP32; `FirmwareHexToolPage` từ chối ESP32/RP2040/STM32 (status 03/11). Reference-coverage nhắc: QEMU/Renode hỗ trợ kiến trúc ≠ hỗ trợ exact board/peripheral; không suy "ESP32 chạy được trong trình duyệt" từ tên QEMU.

Scope:
- allowed_paths: `docs/claude-support/**` hoặc thư mục tài liệu do Leader chỉ định cho Sol (không code).
- forbidden_paths: `src/**`, `tests/**`, `docs/agents/tasks.json`, `package.json`, `vendor/**`, mọi `.env*`.

Constraints: local-first (phương án phải chạy không mạng); không thêm dependency; mỗi mục năng lực nêu nhãn D/I/U/A; không khẳng định hỗ trợ khi nguồn chỉ là bản tin.

Approval boundaries: dừng hỏi trước khi cài/chạy bất kỳ công cụ bên thứ ba, thêm dependency, hoặc đổi scope sản phẩm.

Done when:
- Tài liệu quyết định có bảng ba phương án × (target/peripheral, license, OS/browser, artifact, expected/actual, effort, rủi ro) và khuyến nghị, cập nhật theo câu trả lời Q2.
- Không lệnh npm cần chạy; Leader duyệt trước khi tách slice code.

Report: đường dẫn tài liệu; nguồn D/I/U/A đã dùng; câu hỏi còn mở cho founder.
