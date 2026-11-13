# REVIEW_RESULT · RELAY R-20261106-06 · phân hoạch bo con công suất robot và dữ liệu T8 trước KiCad

Ngày 09/11/2026 00:21 · Leader Claude · chỉ đọc, mức thiết kế. Tổng hợp từ `partition-review.md` (chat con `relay06-partition`) và `t8-data-review.md` (chat con `relay06-t8-data`). **Tôi đọc toàn văn hai file, không mở lại datasheet hay trang hãng nào.** Mọi số điện của DRV8833, TPS63070, LM73100 là [CHƯA XÁC MINH] (hai chat con cũng chưa đọc nội dung các datasheet đó). Số trang Pololu #2130, #4981, #992, #1452 là [HÃNG-WEB] do chat con đọc ngày 06/11, tôi chưa đối chiếu lại. Hai tài liệu viết **trước** D10, D15, D16 (07–08/11); chưa kiểm xem những quyết định đó đã đóng mục nào.

## Tôi tự kiểm lại được

Tính lại các phép [TÍNH] trong `t8-data-review.md` §1 và `partition-review.md` §3–4 (máy tính tay, không phải đo): R_w = 6/0,36 ≈ 16,7 Ω; ω_m = 130 × 100,37 vòng/phút ≈ 1366 rad/s; k_e ≈ 3,9 mV·s/rad; 0,27 m/s ở Ø40 mm; emf ≈ 19,6 V cho mỗi m/s (r = 20 mm); vượt 6,35 / 9 / 12 V ở khoảng 0,40 / 0,53 / 0,68 m/s (V_d = 0,7 V giả định); đầu đo 10 MΩ ở 6 V hút 0,6 µA, bằng 12,5 % của 4,8 µA; 0,387 A trên 0,62 Ω ≈ 93 mW; R_pd < 30 kΩ với VIN 8,4 V giả định. **Tất cả khớp.** Đây chỉ xác nhận số học, không xác nhận số đầu vào (các số "typ ±20 %", "±50 %", "kẹt ngoại suy" là của hãng ghi lý thuyết).

## Kết luận

**Chưa đủ dữ liệu để mở KiCad cho bo con công suất robot.** Phản biện của hai chat con nhất quán với nhau và với R-20261106-05; không thấy mâu thuẫn nội bộ nào ngoài các chỗ ghi ở mục "Lệch hồ sơ". Quy tắc chia việc: bench T1–T8 vẫn `NOT_RUN`; mọi giá trị chưa đo ghi `TBD`.

## Phát hiện đã tổng hợp (đều là kết luận của hai chat con, tôi chưa tự đo; mức độ là mức rủi ro thiết kế)

| # | Mức | Nội dung | Nguồn |
|---|---|---|---|
| 1 | **Cao** | Phân hoạch: ranh giới carrier ↔ bo con phải ở **VBAT**, không ở VM; vòng dòng hồi VM nằm trọn một PCB, không có đầu nối trong vòng; kéo xuống nSLEEP/EN/IN phải đặt phía **bo con**. | `partition-review.md` §1 |
| 2 | **Cao** | Đẩy tay/đẩy tình cờ (cơ chế C) có cận **hữu hạn theo v_push,max**, rail do motor tự đẩy ≈ 19,6·v − 2V_d, vượt 9 V ở ~0,53 m/s: R-04 §1 ("V_emf chặn rail ≤ mức lái ≈ 6 V") chỉ đúng khi bánh quay theo tốc độ được lái. Cần yêu cầu sản phẩm cho v_push,max. | `t8-data-review.md` §1 mục 1 |
| 3 | **Cao** | Fixture T8 chưa đóng được hai cận: năng lượng hồi hai motor (thiếu tụ chuẩn C_ref không có shunt/TVS ứng viên) và đẩy tình cờ (thiếu yêu cầu); hai cận khác chỉ đóng có điều kiện (dòng trước ngắt có dấu; điện tích lọt phía converter). | `t8-data-review.md` §2 |
| 4 | **Cao** | Hai module không đạt làm đơn vị tháo lắp V1 theo tiêu chí hiện có: #4981 vì EN hở = bật (pull-up 475 kΩ) và không có cận VOUT bị đẩy áp; #2130 vì nSLEEP kéo lên, cần cắt cầu ISEN hai kênh và chưa đọc được sơ đồ (hướng MOSFET chống đảo, tụ VM). Giữ làm bench/phương án B có điều kiện. | `partition-review.md` §3–4 |
| 5 | Trung bình | Bảng lỗi đầu nối F1–F11: thứ tự chân GND → VBAT → tín hiệu → PRESENT; ≥2 chân VBAT và GND; phân cực cơ khí; PRESENT ngắn nhất; bảo vệ đảo cực trước converter (chưa chọn MPN). | `partition-review.md` §2 |
| 6 | Trung bình | Ba lớp bảo vệ độc lập: (1) kéo xuống trên bo con, (2) LM73100 chặn ngược + mạng hấp thụ độc lập, (3) UVLO đã chốt (founder 6,40–6,60 V, xem bộ nhớ dự án). Quyền RUN ở carrier là lớp phần mềm, không phải lớp an toàn. | `partition-review.md` §4 |
| 7 | Trung bình | Danh sách mua hiện tại (#992 ×2, #1452 ×2 cặp, #1086) **không đo được** cận nào của R-04 §2; thiếu LCR, scope, đầu đo vi sai, shunt/kẹp dòng, tụ chuẩn, nguồn giới hạn dòng, đo tốc độ, lực kế. Đề nghị mua theo năng lực. | `t8-data-review.md` §3 |
| 8 | Trung bình | Bước 0 **không cấp năng lượng** (đo R, L, C, khối lượng, đường kính lăn, lực quay ngược) là thứ tự ít rủi ro nhất, đủ để tính cận A sơ bộ. | `t8-data-review.md` §2 |
| 9 | Trung bình | Đo rò bằng đầu đo 10 MΩ cho kết quả thấp hơn thực khoảng 12 %; rò LM73100 phải dùng **tối đa**, không dùng 4,8 µA điển hình. | cả hai |
| 10 | Thấp | n = 2 motor không bao được phân tán lô (dung sai ±20 %/±50 %); kẹt có thể phá mẫu: cân nhắc cặp dự phòng. | `t8-data-review.md` §3, §4 |

## Lệch hồ sơ (đã thấy ở hai file, cần Codex sửa)

- Đường kính bánh ba nơi ba số: fixture ghi #1090 Ø42, shortlist #1452 Ø40, `vm-isolation-t8-review` mục tiêu 43 mm (ảnh hưởng khoảng 5–7 % lên emf/(m/s)). Liên quan D9.
- Giả định VIN 8,4 V (2S đầy) chưa được hồ sơ pack xác nhận; D16 còn hai hướng pack.

## Hạn chế của review này

Không đo, không mở datasheet, không đọc `bench-*.md`, `final-values.md`, `kicad-input-spec-r7.md`, `mobot-robot-t8-*`. Tôi chưa kiểm xem D10/D15 đã chuyển mục nào sang `verification_items`. Hai chat con chưa mở nội dung TI cho LM73100/TPS63070/DRV8833, nên mọi cận dẫn xuất từ các số đó có thể sai nếu file Codex trích sai.

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 00:21 ===
relay_id: R-20261109-01
reply_to: R-20261106-06
type: REVIEW_RESULT
task_ids: MM-HW-MOBOT-IF-001, MM-HW-MOBOT-ROBOT-KICAD-001
priority: P1
scope: docs/claude-support/2026-11-06-relay-R20261106-06/review-result.md (tổng hợp partition-review.md, t8-data-review.md)
ask: Chưa đủ dữ liệu mở KiCad bo con công suất robot. (1) Chốt ranh giới carrier ↔ bo con tại VBAT, VM không qua đầu nối, kéo xuống nSLEEP/EN/IN phía bo con; (2) ghi yêu cầu v_push,max và ba ca mở (nhấc quay bánh tay, đẩy khi đang bật, vận chuyển) thành văn bản yêu cầu sản phẩm; (3) bổ sung C_ref không shunt/TVS vào fixture, cập nhật hồ sơ sang bánh #1452 Ø40; (4) mua theo năng lực (LCR, scope, đầu đo vi sai, shunt hoặc kẹp dòng, nguồn giới hạn dòng, đo tốc độ, lực kế) thay vì danh sách hiện tại; (5) giữ #2130 và #4981 làm bench/phương án B có điều kiện, không làm V1 tháo lắp; (6) lấy từ datasheet TI rò tối đa, thời gian chặn tối đa của LM73100 và cận VOUT của TPS63070 trước Box 08.
evidence: đọc toàn văn partition-review.md và t8-data-review.md; tính lại mọi phép [TÍNH] bằng tay, khớp; không mở datasheet, không đo; bench T1–T8 NOT_RUN. Lưu ý hai file viết trước D10/D15/D16 nên chưa đối chiếu với `verification_items` hiện hành.
done_when: Codex ghi disposition cho 10 phát hiện; chốt D9 (đường kính bánh) và hồ sơ pack (D16); Box 08 đặt hệ số biên và ngưỡng PASS/FAIL; người có datasheet TI xác nhận ba số ở mục (6).
=== END RELAY ===
```
