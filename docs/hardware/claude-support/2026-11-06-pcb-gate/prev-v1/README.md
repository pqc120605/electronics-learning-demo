# Gate review pre-KiCad · MoBot V2 r7 (06/11/2026)

**Sẵn sàng sang KiCad: CHƯA.**

Tỷ lệ gate đã chốt: **9/55 = 16 %** (CHƯA CHỐT 36 = 65 %, MÂU THUẪN 10 = 18 %). Tay cầm 3/23, robot 4/23, chung 2/9. Chi tiết ở [gate-matrix.md](gate-matrix.md).

## Tóm tắt 10 dòng

1. Chỉ đọc. Không có file KiCad của MoBot trong repo (chỉ board tham chiếu), nên không có schematic hay PCB để review.
2. Cả hai doc bắt buộc đã có: `mobot-pcb-readiness-2026-11-06.md` và `mobot-v2-config-2026-11-05-r7.md`.
3. Chưa có lease KiCad. Box08 vẫn `changes_requested` cho tay cầm (`mobot-v2-r7-handset-qa-disposition.md:5`).
4. Hash r7: biên bản ghi user đã duyệt, nhưng readiness và queue vẫn ghi `proposed`. Hai nguồn mâu thuẫn.
5. Board DevKit có bốn nhận dạng khác nhau trong các doc. Spec r7 (mtime 09:47) có trước hai lần bạn chọn board (11:40, 14:43).
6. Pin map, footprint, interposer USB và connector pack đều phụ thuộc board và pack, nên chưa dùng làm đầu vào vẽ được.
7. Kiến trúc VBUS, latch, cách ly I/O (7 thay đổi vật chất, 50 dòng BOM "Đề xuất") cần revision r8 và hash riêng, chưa có.
8. Tính lại độc lập khớp doc cho UVLO robot, UVLO tay cầm, H3, R1, R5 và độ rộng trace. Phát hiện hai lỗi tài liệu: JST XH 2,54 mm (đúng 2,50 mm) và ICHGSET 7,68 kΩ (đúng 1,91 kΩ).
9. Chưa có stackup, quy tắc DRC, cơ khí hay bench. Bench chưa chạy, mọi kết quả `UNKNOWN`.
10. UVLO robot 6,40–6,60 V giữ nguyên, TLV6700 vẫn FAIL. Không mở lại quyết định này.

## Điều kiện để chuyển sang CÓ ĐIỀU KIỆN

- Founder trả lời Q1 (board), Q2 (pack) và Q3 (phạm vi r8) trong [founder-questions.md](founder-questions.md).
- HQ ghi record r7 với đúng hash, cấp lease, box08 duyệt snapshot mới.
- HQ đính kèm bản vẽ interposer đúng revision.

## Tệp trong thư mục

- [gate-matrix.md](gate-matrix.md): 55 gate, trạng thái, bằng chứng file:line.
- [resolutions.md](resolutions.md): mục tự giải được, kèm giá trị, cơ sở, cách kiểm chứng.
- [founder-questions.md](founder-questions.md): 7 câu theo mức chặn.
- [token-estimate.md](token-estimate.md): ước tính token, công thức quy đổi % tuần (ngân sách trống nên không tính %).

## Giới hạn của lượt này

Tôi chưa mở PDF datasheet gốc; thông số datasheet lấy qua doc của repo và đánh dấu `[chưa kiểm chứng PDF]` khi cần. Không chạy `calc_r7.py` hay KiCad. Phép tính độc lập ở `resolutions.md` dùng Python riêng. Không sửa doc nào của Codex, không commit.
