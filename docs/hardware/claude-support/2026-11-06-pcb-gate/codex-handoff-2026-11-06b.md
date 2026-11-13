# Handoff cho Codex lead · 06/11b

Claude không thực hiện các việc dưới đây. Mọi thứ cần `codex_lead` ghi. Founder chưa trả lời Q1–Q7 và chưa cung cấp ảnh macro `U2`, marking hay số đo, nên các bước phụ thuộc chúng chưa làm (xem decision-log.md). `claude_communication_allowed: false` (tasks.json:7-20): nội dung này chỉ có hiệu lực khi user chuyển cho HQ.

## 1. Việc Codex phải sửa

| Đối tượng | Sửa | Điều kiện |
|---|---|---|
| `tasks.json` MM-HW-MOBOT-IF-001 | Bỏ `review` `changes_requested` cũ (TJ:2276-2282) khỏi trường review hoặc đặt trạng thái hiện hành; ghi nhắc kiến trúc v1 (AV1) và WRL-20168/3×AA (CS, AA) để rõ doc nào thay doc nào | Sau Q1, Q2, Q3 |
| `tasks.json` MM-HW-MOBOT-REMOTE/ROBOT-KICAD-001 | Điền `required_gates` (ít nhất gate `hardware`) nếu muốn hardware gate bắt buộc khi `done`; cập nhật `authorization` nhắc cấu hình mới | Sau Q4 |
| `tasks.json` MM-BOM-001, MM-HW-001 | Sửa `waiting.reason` theo mẫu Type-C | Sau Q1 |
| `tasks.json` MM-PARALLEL-SETUP-001 | Chuyển `done` hoặc ghi lý do giữ `in_review` (run review.md đã PASS) | Độc lập |
| `hardware_configurations` | Thêm bản ghi cho cấu hình mới trỏ tới `electronics-learning-demo/docs/mission-control/hardware-config-*.json`, `status: proposed`, `approved_by: null`. Chỉ đổi sang `approved` khi user duyệt đúng hash | Sau Q4 |
| `mission-control/hardware-config-*.json` (mới) | Soạn cấu hình cho mẫu Type-C. `blocking_unknowns` rỗng khi duyệt (VM:42, 151); mục đo-sau-PCB đưa sang `verification_items` nếu Q4-B | Sau Q4 |

## 2. Thứ tự đề xuất

1. Founder trả lời Q1, Q2, Q4 (và Q3, Q5–Q7). Cung cấp: macro `U2`, marking, số đo theo `measurement-checklist.md`.
2. Codex cập nhật `tasks.json` cho khớp doc mới (mục 1).
3. EF xác nhận chip U2 và net map; HK ghi kích thước.
4. Codex soạn JSON cấu hình mới, tính SHA-256, gửi Box08 review đúng bytes.
5. User duyệt đúng hash; Codex ghi `approved_by: user`, `approved_sha256`.
6. Codex chuyển REMOTE sang `in_progress`, tạo `write_lease`, tính snapshot `file-hashes`.
7. Chạy kiểm chứng (mục 3). ROBOT theo Q6.

## 3. Lệnh kiểm chứng và kết quả mong đợi

Chạy từ `D:\StartupOS`:

```bash
node docs/agents/validate.mjs
```

Mong đợi: exit 0, `errors: []`, số task bằng số task trong queue (hiện 20).

```bash
node docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001
```

Mong đợi sau bước 6: `dispatch_eligible: true`, exit 0. Hiện tại: exit 1, `dispatch needs active task authorization` và `dispatch builder mode missing`.

```bash
node docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-ROBOT-KICAD-001
```

Chỉ chạy sau khi REMOTE đã đạt yêu cầu và Q6 cho phép.

## 4. Chưa làm trong lượt này

- `proposed/hardware-config-*-DRAFT.json`: bước 5 phụ thuộc Q4 (và Q1, Q2) còn trống. Cấu hình không thể có `blocking_unknowns` đúng khi chưa biết danh sách đóng.
- Datasheet WCH CH340, Silicon Labs, Jauch, SparkFun, JST chưa tải (xem `datasheets/SOURCES.md`).
- Không chốt chip U2 (xem `u2-identification.md`).
