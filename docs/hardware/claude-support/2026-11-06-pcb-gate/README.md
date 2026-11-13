# Gate review lease KiCad · MoBot V2 (06/11/2026 chiều)

| Task | Đủ điều kiện cấp lease |
|---|---|
| MM-HW-MOBOT-REMOTE-KICAD-001 (tay cầm) | **CHƯA** |
| MM-HW-MOBOT-ROBOT-KICAD-001 (robot) | **CHƯA** |

% gate đã chốt (dòng 'Cả hai' tính cho cả hai board, chi tiết ở [gate-matrix.md](gate-matrix.md)): **tay cầm 4/32 = 12,5 %, robot 4/32 = 12,5 %**. Toàn bộ 48 dòng riêng biệt: 6 CHỐT, 34 CHƯA CHỐT, 8 MÂU THUẪN.

## Tóm tắt 10 dòng

1. Chỉ đọc. Không có file `.kicad_sch/.kicad_pro` của MoBot trong `D:\StartupOS` (các `.kicad_pcb` trong `.tmp` là tệp thử viewer). Không chạy `kicad-cli`.
2. `node docs/agents/validate.mjs`: exit 0, 20 task, 143 capability, `errors: []`. Hai lệnh `--dispatch-task` cho REMOTE và ROBOT: exit 1, `dispatch_eligible: false` (thiếu authorization active và builder mode).
3. Cả hai task KiCad còn `scoped`, snapshot `pending`, `required_gates` rỗng (TJ:2436, 2541). Lease cần task `in_progress`, write_lease active và cấu hình `approved` với `blocking_unknowns` rỗng (VM:37-42).
4. r7 không đủ cho board mới: IF-001 ghi bytes r7 "do not authorize this board" (TJ:2330-2331), r7 `proposed`, `approved_by: null`, trỏ tệp `.md` thay vì JSON `mission-control/hardware-config-*.json` (TJ:2619-2623; VM:144).
5. Mẫu Type-C: nhãn silkscreen 30 chân khớp ảnh, nhưng suffix CH340 chưa xác minh và ảnh cho thấy `U2` dạng QFN vuông, không ủng hộ CH340C. Kích thước chưa đo.
6. Queue (12:24) cũ hơn ba doc user đã duyệt: kiến trúc v1 (12:57), WRL-20168 + Jauch (14:43), và hướng 3×AA (15:19). Bốn hướng tay cầm khác nhau đang cùng tồn tại.
7. Robot phụ thuộc IF-001 và schematic tay cầm; nền r6 (Micro-USB, interposer) chưa khớp mẫu Type-C.
8. So với review r6: H3, R1, R5 (quyết định), tạo 3 task, lập hash r7 là ĐÃ ĐÓNG; H1, H2, R2, R3, R4, R6, ISEN, ICHGSET còn mở; H4 thay bằng kiến trúc mới có lý do.
9. Chưa có doc Codex cho stackup, DRC, cơ khí, pin map, connector chốt; bench chưa chạy.
10. UVLO robot 6,40–6,60 V và H3/R1/R5 giữ nguyên, không mở lại. Số tính lại: UVLO robot 6,435–6,565 V với TLV6710 (cần Box08 duyệt IC).

## 3 blocker lớn nhất

1. **Chưa có cấu hình MỚI cho mẫu Type-C được user duyệt đúng hash**, ở dạng JSON hợp lệ với `blocking_unknowns` rỗng (cần quyết Q4).
2. **Danh tính và hình học mẫu chưa chốt:** suffix CH340, kích thước, topology USB-C/CC/VBUS/VIN, mà ảnh chưa chứng minh được.
3. **Kiến trúc tay cầm mâu thuẫn và queue lỗi thời:** AV1 (cáp RUN OUT) với CP (Q_ISO) với WRL-20168/Jauch với 3×AA; chưa doc nào thay doc nào.

## Tệp trong thư mục

- [agent-task-reconciliation.md](agent-task-reconciliation.md): 8 task, kết quả validate, điều kiện lease theo validator.
- [gate-matrix.md](gate-matrix.md): 48 gate kèm Owner role.
- [prior-review-delta.md](prior-review-delta.md): finding r6 đã đóng, còn mở, hoặc thay hướng.
- [resolutions.md](resolutions.md): mục tự giải được.
- [founder-questions.md](founder-questions.md): 7 câu theo mức chặn lease.
- [token-estimate.md](token-estimate.md): ước tính token và công thức % tuần (ngân sách trống, không tính %).
- `prev-v1/`: bản lượt trước (gate review 55 mục), giữ để đối chiếu.

## Giới hạn

Chưa mở PDF datasheet gốc; chưa xem ảnh macro; phép tính độc lập nằm ở `prev-v1/resolutions.md`. Không sửa `tasks.json`, `runs/`, `.codex/` hay doc của Codex; không commit; không cấp lease.
