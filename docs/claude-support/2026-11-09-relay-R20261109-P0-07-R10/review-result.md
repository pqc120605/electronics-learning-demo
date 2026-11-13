# REVIEW_RESULT · P0-07 r10 và bốn gói thiết kế · 09/11/2026 · Leader Claude

Đối tượng (request R-20261109-P0-07-R10; tôi tính lại bằng `sha256sum`, khớp request và REPORT):
- r10 `docs/mission-control/hardware-config-mobot-v2-typec-r10-handset.json` SHA256 `95abdd2762e6f739557a83a5f62f1240510aa4ca326f317738b5eb59196770a4`
- OFF `mobot-v2-p0-07-off-design-packet.md` `6f2df5a0df8c04b4d37485e0e65eaf63ebbd375dc94c938a64590d88b31e96ae` (39 dòng)
- ACTUATOR `…-actuator-design-packet.md` `516199eed9a277a0796bb714c680d0a7ae54f54484a17fe5995716851072bb61` (36 dòng)
- H3 `…-h3-design-packet.md` `2240930df011b4cb3d884b7e520290bd103bdd538014cd77994ee62f61484fdd` (32 dòng)
- MCU `…-mcu-design-packet.md` `8458ee4d3aa3a88ef5178ed815ad3cab8ce35ce731d5c11d999e100d50a7c350` (45 dòng)
- Gói review `mobot-v2-p0-07-review-packet.md` `fed0ccf5…d78e3`; r9 vẫn `e8a1d0d319f11d71d0b5040731664f72076396eb5f39d968d8df45e6039510a3`.

## Kết luận
**Xử lý đúng C07 F1-F3 và O1; bốn gói là đề xuất chức năng trung thực, chưa đủ để đóng cổng nào.** Verdict riêng: cả bốn cổng `insufficient_evidence`, vẫn OPEN. Không có finding High. 2 Medium, 2 Low, 3 quan sát. Review này không duyệt hash r10, không duyệt BQ25186 hay bất kỳ MPN, không mở lease, không đóng cổng.

## Đã kiểm (kết quả)
- Hash 11 file (r10, r9, 4 gói, gói review, validate, test, tasks, biên bản, registry) khớp REPORT (so tiền tố 16-20 ký tự). r9 giữ nguyên byte.
- `node D:/StartupOS/docs/agents/validate.mjs`: exit 0, 47 tasks, `errors: []`. `node --test`: 51/51.
- **r10 so r9**: diff đệ quy toàn bộ JSON (script `node` ở scratchpad, không sửa file): 25 thay đổi, gồm `id/revision`, `supersedes` (trỏ r9, hash `e8a1d0d3…510a3`), `founder_direction_record` → `#p0-07`, thêm `design_packages`, `actuator_direction.{fmea_reference,additional_fault_cases,stop_rule}`, `charger_proposal.{primary_candidate,excluded_candidates,cv_screening,profile_evidence}` (danh sách ứng viên chỉ còn BQ25186), `mcu_resource_plan.{role_assignments,role_allocation_reference,conditional_pool_rule}`, `selected_direction` của H3, `gate_schema_contract.enforcement_status`. Cổng: `id/status/stage/milestone/pass_fail` của cả 7 cổng **giống hệt r9**; `verification_items` (14) giống hệt; `status: proposed`; không có `approved_by`/`approved_sha256`; số cổng `PASS` = 0.
- Queue: r10 đăng ký trong `hardware_configurations` ở `proposed`; `MM-HW-MOBOT-REMOTE-KICAD-001` vẫn `waiting` và phụ thuộc PREFLIGHT-002, P0-07 và 4 gói; dispatch thật bị từ chối (xem C08).
- **C07 F1 (9 mV có phải cận xấu nhất) xử lý đúng:** tôi xem ảnh trang `MM-HW-P0-07/sources/bq25186-page-6.png`: hàng `VREG_ACC` "All VBATREG settings, typical measurement at VBATREG = 4.2V" có `MIN −0.5`, `MAX 0.5`, cột TYP trống; tiêu đề bảng "−40°C < TJ < 125°C unless otherwise noted". Tức là giới hạn MIN/MAX công bố theo điều kiện bảng, đúng như gói H3 (dòng 11). Ảnh `bq25186-page-10.png`: Figure 5-1 có VIN 5 V, CIN 2,2 µF, COUT 10 µF, CBAT 1 µF, đường −40/25/85/105 °C (không 125 °C), sai số điển hình trong khoảng −0,2…0 %, không quét line, không transient: khớp mô tả. Gói H3 đã bỏ chữ "VREG max/margin xấu nhất": bảng 4,20 V → +9 mV tới PCM min 4,230 V và −21 mV tới 4,200 V; 4,17 V → +39,15 mV và +9,15 mV (tính lại: 4,17×0,995 = 4,14915; ×1,005 = 4,19085; 4,230−4,19085 = 39,15 mV; 4,200−4,19085 = 9,15 mV ✓).
- **C07 F2 (Rev B BQ25185) xử lý đúng:** `excluded_candidates` ghi "SLUSF65B RevB tr24 changed timer720min to360min; tr8 tMAXCHG360min TYP". Tôi kiểm PDF ghim: dòng lịch sử bản sửa "Changed tMAXCHG from 720 min to 360 min" nằm ở trang 24 của PDF; tMAXCHG 360 ở trang 8 ✓.
- **C07 F3 (FMEA) xử lý đúng:** gói ACTUATOR có đủ bốn hàng mới (rơi/va đập/rung; kéo cưỡng bức/phá khóa; lão hóa lò xo/vật liệu theo nhiệt; kẹt ở khóa kèm service release) mỗi hàng có phản ví dụ và ô TBD/NOT_RUN, cộng tiêu chí dừng (dòng 36) khớp `stop_rule` của r10 và ý founder "không chứng minh được thì dừng; không tự chuyển fallback".
- **C07 O1 (9/2/2) xử lý đúng:** gói MCU dòng 9: 9 output-capable (4,13,18,19,21,22,23,26,27), 2 input-only (36,39), 2 conditional (16,17); bảng vai trò (dòng 11-20) và r10 `role_assignments` khớp; mọi GPIO cụ thể UNASSIGNED; không dùng 36/39 làm output, không tính 16/17 là chắc chắn.
- BQ25186 đối chiếu PDF ghim: `SAFETY_TIMER_1:0` mặc định `2b01` = 6 h, `2b00` = 3 h, `2b10` = 12 h, `2b11` = tắt timer (đúng "3/6/12 h hoặc disable, mặc định 6 h"). Văn bản trang 24: bit `TS_EN` chỉ tắt "TS charge action" (khớp ý gói H3 rằng TS_EN=0 không phải bảo vệ nhiệt độc lập). Thanh ghi ở trang 36.
- Registry `registry.md` hash `3a215acc…`: dòng 3 là câu "Tôi không phải luật sư…" ở đầu file; dòng 13 `wokwi-elements` ghi phiên bản `1.9.2`, nêu tám gói transitive kèm license, "D19 does not admit it to the app" (xử lý C04 F1/F4 và C05 F1).
- BQ25185 loại, BQ25186 ứng viên chính, chưa suffix/setpoint: khớp lệnh founder (r10 `charger_proposal` và H3 dòng 9).

## Không kiểm
- DISPOSITION-C03-C04-C05-C07 (8,2 K), `source-excerpts.txt` P0-07 (65 K), `design-package-index.json`, `final-audit.json`, QA nội bộ: không đọc.
- Phần thêm vào biên bản founder (`#p0-07`; chỉ kiểm hash `cf4574a4…`) và các dòng registry khác ngoài dòng 3 và 13.
- BQ25186: NTC/JEITA ngoài câu về `TS_EN`, các cận watchdog/HW_RESET.
- Tính đúng của kiến trúc điện (đây là đề xuất chức năng, chưa có net, MPN hay cận thật). Không có phép đo nào chạy (đúng thiết kế).

## Verdict từng cổng (đều giữ OPEN)

| Cổng | Verdict | Đã làm tốt | Vẫn thiếu để PASS |
|---|---|---|---|
| D17-OFF-DESIGN | `insufficient_evidence` | Hai phương trình quyền `RUN_ALLOWED`/`RELEASE_ALLOWED`; bảng cận kế thừa; đại số 2,320926 s; 6 ca lỗi bắt buộc | Mọi cận đều TBD: MAX leakage/trễ từng IC và bias, hai cận sense, offset/hysteresis, Ceff thực, FMEA nguồn/GND chung. Không có phần tử cụ thể để tra MAX |
| D17-ACTUATOR-PRODUCT | `insufficient_evidence` | FMEA mở rộng, tiêu chí dừng, không đếm đôi RUN 0,5 A và aux 20 mA | Không có phần tử cấp quyền, ngân sách điện, force/stroke/duty/nhiệt, hình học/CAD; mọi ô TBD |
| D17-H3-CV-PROTECTION | `insufficient_evidence` | Phân loại MIN/MAX đúng, không gọi 9 mV là margin xấu nhất, cửa sổ bảo vệ `Vtrip,max+ΔV ≤ Vpack_allowed,max` | Không có `Vpack_allowed,max` (F2), chưa có profile/NTC Jauch, cận ΔV ứng dụng, linh kiện đường OV độc lập MCU |
| MCU-RESET-VETO-RESOURCES | `insufficient_evidence` | Phân vai 9/2/2; veto reset-dominant, challenge cửa sổ, công thức t_fault_to_isolation | Không gán chân, không part cho supervisor/latch, mọi thời gian TBD, đếm nhu cầu chưa có cận trên (F1) |

## Findings

**F1 · Medium · Nhu cầu GPIO của tay cầm chưa có cận trên nên chưa chứng minh được khả thi.**
Gói MCU dòng 11-22 và r10 `role_assignments`. Sáu vai output/bidirectional đã nêu (RUN_REQUEST, FRESH_ARM_REQUEST, LIVENESS_CHALLENGE_RESPONSE, RELEASE_REQUEST, SCL, SDA) cùng 2 input (LOCK_POSITION, SAFETY_STATUS) là 8 vị trí trong 11 vị trí chắc chắn (9 output + 2 input-only). Còn "H3 status / feedback thứ hai / E1–E4" ghi "số kênh TBD; không reserve GPIO"; nếu E1–E4 là 4 kênh thì nhu cầu có thể tới 14, vượt cả 13 lẫn 11 chắc chắn. Gói tự ghi chỉ là "kiểm số học", nhưng cổng yêu cầu "resource feasibility".
Impact: cổng không thể PASS về tài nguyên nếu không biết nhu cầu tối đa; quyết định "không dùng expander I2C" của founder làm bài toán này căng, không có đường lùi.
Fix tối thiểu: lập bảng nhu cầu có cận trên và dưới cho từng vai (kể cả E1–E4), nêu vai nào có thể dùng chung tín hiệu; nếu cận trên > 11 thì báo founder trước, không đợi Box 08.

**F2 · Medium · Cổng H3 cần "giới hạn sạc cho phép của pack" nhưng nguồn duy nhất là "4,2 V" và founder chưa hỏi Jauch.**
Gói H3 dòng 20, 24; tiêu chí gốc: "PASS khi … phù hợp giới hạn pack". Jauch Rev 1.2 trang 2 chỉ có "Charge Voltage 4,2 V", không có dung sai dương. Gói đúng khi nói "không có cửa sổ phải dừng, không nới theo PCM" và đưa phương án 4,17 V (giữ ≤ 4,200 V nếu ΔV ứng dụng cộng transient ≤ 9,15 mV). Nhưng ngoài việc hỏi Jauch, chưa có nguồn nào cho `Vpack_allowed,max`, nên cổng không thể PASS bằng bằng chứng.
Impact: một quyết định của founder đang chặn cổng: hoặc hỏi nhà sản xuất về dung sai CV, hoặc chấp nhận cứng "tuyệt đối ≤ 4,200 V ở mọi điều kiện" làm giới hạn thiết kế (kéo theo setpoint thấp như 4,17 V và đánh đổi dung lượng).
Fix tối thiểu: ghi thành câu hỏi quyết định rõ cho founder trong r10 hoặc gói H3: "Q-H3: hỏi Jauch, hay dùng 4,200 V làm trần tuyệt đối". Không tự chọn.

**F3 · Low · Công thức `RELEASE_ALLOWED` không có `NOT FAULT`.**
Gói OFF dòng 11-13: `RUN_ALLOWED` có `NOT FAULT`; `RELEASE_ALLOWED` không có, trong khi dòng 13 nói FAULT ưu tiên trên mọi request. Chưa rõ FAULT chặn hay buộc nhả. Fix: viết rõ hiệu ứng FAULT lên cả hai và bảng chân trị đầy đủ, kể cả khi sense lỗi.

**F4 · Low · `blocking_unknowns` trong mục registry r10 chứa chuỗi cổng OPEN.**
Xem C08 O2. Nên ghi cách chuyển các chuỗi này về `[]` (chỉ sau khi cổng PASS qua envelope) trước khi duyệt hash, để tránh hai nguồn mâu thuẫn.

**O1 · Quan sát · Bốn gói là đề xuất chức năng, chưa là phân tích đóng cổng.**
Không gói nào chọn linh kiện cụ thể để tra cận MAX (OFF dùng họ ứng viên trong JSON nhưng không rút số từ datasheet); gói tự nói "chưa net/pin/MPN được duyệt". Đúng như Codex mô tả, nhưng cũng có nghĩa là đường từ đây tới bốn cổng PASS còn dài: cần vòng thiết kế thật có số liệu.

**O2 · Quan sát · PASS tương lai phải đi qua envelope của PREFLIGHT-002.**
Gói review (dòng 28) nói đúng. Xem C08 F1 về nơi lưu envelope và việc ghim byte.

**O3 · Quan sát · Nguồn BQ25186 ghim cục bộ.**
Ảnh trang trong run cho phép kiểm không cần mạng; nên giữ cùng hash trong `source-manifest.json` khi sang vòng thiết kế tiếp theo.

## Câu hỏi
1. Founder chọn: hỏi Jauch về dung sai điện áp sạc, hay đặt 4,200 V làm trần tuyệt đối (F2)?
2. Nhu cầu E1–E4 của tay cầm là bao nhiêu kênh (F1)?
3. Vòng thiết kế tiếp theo có chọn linh kiện cụ thể cho OFF để rút cận MAX từ datasheet không (O1)?

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 ===
relay_id: R-20261109-C09
reply_to: R-20261109-P0-07-R10
type: REVIEW_RESULT
verdict: C07 F1-F3 và O1 xử lý đúng (kiểm bằng ảnh trang BQ25186 tr.6 và tr.10, PDF BQ25185 tr.8 và tr.24, diff r10/r9, FMEA ACTUATOR, bảng 9/2/2). r10 95abdd27…770a4 chỉ thêm khóa đã nêu, 7 cổng và 14 items giữ nguyên, 0 PASS, không approved. Bốn cổng insufficient_evidence, OPEN. Không duyệt hash r10, MPN, lease
findings: F1 Medium (nhu cầu GPIO tay cầm chưa có cận trên, E1–E4 có thể đẩy vượt 13/11); F2 Medium (H3 cần Vpack_allowed,max nhưng nguồn chỉ là 4,2 V, founder chưa hỏi Jauch: cần quyết định); F3 Low (RELEASE_ALLOWED thiếu NOT FAULT); F4 Low (blocking_unknowns r10 chứa cổng OPEN); O1 (gói là đề xuất chức năng, chưa có cận MAX từ part cụ thể); O2; O3
checks_run: sha256 11 file; validate.mjs exit 0 (47 tasks); node --test 51/51; diff đệ quy r10 vs r9; xem ảnh trang BQ25186 tr.6 và tr.10; PDF BQ25185 lịch sử bản sửa tr.24 và tMAXCHG tr.8; đăng ký SAFETY_TIMER và TS_EN của BQ25186; tính lại margin 4,20/4,17 V; so tasks.json trước/sau
checks_not_run: DISPOSITION, source-excerpts P0-07, phần thêm vào biên bản founder, registry ngoài dòng 3 và 13, NTC/JEITA ngoài TS_EN, tính đúng thiết kế điện
done_when: Codex ghi DISPOSITION F1-F4; founder trả lời Q-H3 và số kênh E1–E4; vòng thiết kế kế tiếp chọn linh kiện cụ thể và rút cận MAX từ datasheet; chưa duyệt hash cho tới khi bốn cổng PASS qua envelope PREFLIGHT-002
=== END RELAY ===
```
