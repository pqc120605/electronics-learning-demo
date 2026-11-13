# REVIEW_RESULT · A10 `MM-HW-P0-05` hồ sơ bốn cổng tay cầm · 09/11/2026 · Leader Claude

Đối tượng (request R-20261109-A10-01; tôi tính lại bằng `sha256sum`, tất cả khớp `snapshot.json`):
- Dossier `docs/hardware/mobot-v2-p0-05-handset-gates-closure.md` (133 dòng) SHA256 `28ddd8823efcf8382282c5651db1bb20e8387ba2c2e448bca888a8152fd7d152`
- `BOX08-REVIEW-PACKET.md` `28ecf064…c97d0`, `input-snapshot.json` `f3c94973…6526b`, `source-excerpts.txt` `d81f8693…0a14f8`, `checks.json` `cee37eb2…e9075`, `REPORT.md` `4cb34874…a1a995` (hash đầy đủ nằm trong `snapshot.json`).
- Cấu hình handset vẫn `c5d342db0db6c3cb419078bd9342c1766b7f537df87f590077aef73f083dc626`, `proposed`, chưa duyệt.

## Kết luận
**Hồ sơ đạt yêu cầu A10 (document only) và giữ trung thực: không tự đánh PASS cổng nào.** Verdict riêng từng cổng của tôi: cả bốn là `insufficient_evidence`, cổng giữ OPEN. Không có finding High. Có 2 finding Medium (thiếu căn cứ gốc cho dữ liệu quyết định H3; cổng MCU không có phân tích cho tay cầm), 2 Low, 3 quan sát. Review này không đóng cổng, không duyệt hash, không mở lease, không chọn thay founder.

## Đã kiểm (kết quả)
- 6 hash trong `snapshot.json` + dossier khớp. 9 hash đầu vào trong `input-snapshot.json` tính lại đều khớp (kể cả PDF TI `8f96de38…65b4`, 4 cấu hình, hợp đồng MCU `8665a8cc…e4f3`). Nghĩa là các file này không đổi kể từ lúc snapshot. Lưu ý `mobot-v2-p0-04-handset-closure.md` nay là `79319c18…ef0e`, khác `b10a6f66…296f6` tôi đã review ở C02: file đó đã đổi sau DISPOSITION (dự kiến); tôi không đọc lại phần đổi.
- `node D:/StartupOS/docs/agents/validate.mjs` chạy lại: exit 0, 39 tasks, 143 capabilities, `warnings: []`, `errors: []`. Không chạy `node --test` (không liên quan scope).
- Tiêu chí PASS/FAIL của bốn cổng trích trong dossier §§2-5 khớp **nguyên văn** `pass_fail` trong JSON (tôi in từng cổng từ JSON và so). Mốc: ba cổng "Trước lease schematic", `MCU-RESET-VETO-RESOURCES` "Before applicable schematic lease".
- Số liệu TPS25947 (SLVSFC9C, tháng 5/2026) đối chiếu `docs/research/downloads/ti-tps25947.pdf` bằng `pdftotext`: VIN 2,7-23 V và TJ −40…125 °C (tr.8); ILIM 0,425/0,500/0,575 A tại RILM 6,65 kΩ, OUT leakage OVLO max 443 µA, ISD max 28,7 µA, UVLO rising 1,183-1,223 / falling 1,076-1,116 V (tr.9); IREVLKG(OFF) 4,86 µA tại VOUT 12 V, VIN 0 V (tr.10); tCB 2 µs, tRCB 1 µs, tRST 110 ms cho biến thể `xA` (tr.11, chỉ một cột, không có MAX); câu "latched off (TPS259474L variant)" ở tr.31 dưới §7.3.5.2; TVS khi cáp có nguồn gắn vào OUT ở tr.61 (§8.3.1). `TPS259474LRPWR` có trong bảng đặt hàng của PDF. Số trang in và trang PDF khớp ở các trang tôi mở. VSD(F): PDF cho 0,45 và 0,74 V; theo vị trí cột là MIN/TYP nhưng extraction văn bản mơ hồ về nhãn cột. Dossier ghi min 0,45 / typ 0,74 và tôi không có phản chứng.
- `source-excerpts.txt`: trích đúng các trang 8-11, 31, 61 của TI và trang 2 của Jauch (tôi lấy mẫu 8 số, khớp bản extraction PDF của tôi).
- Jauch 250832 Rev 1.2 trang 2 (`/d/250832.pdf`, SHA `f591005f…09609a`): sạc 4,2 V; PCM quá sạc 4,28 ± 0,05 V, nhả 4,08 ± 0,05 V; quá xả phát hiện/nhả 2,80 ± 0,10 V; xả max 3000 mA; NTC có nhưng không có bảng R–T. Khớp dossier §1.
- Tính lại: `(5,25×0,50)/(3,20×0,80)+0,020 = 1,045390625 A` ✓. Đại số xả: V∞ = 30 µA × 10.100 Ω = 0,303 V ✓; τ = 10.100 Ω × 100 µF = 1,010 s ✓; thời gian tới 0,80 V = 2,320926 s ✓ và tới 0,77412 V = 2,374938 s ✓ (tính độc lập bằng `node`, trùng 6 chữ số); +20 ms +100 ms = 2,494938 s, còn 1,505062 s so timeout 4 s ✓. Hằng số 0,77412 V xuất phát từ `off_sensor_candidate` trong JSON (0,72412 V + 50 mV). Hai chiếc Adafruit 2776: 2 × 5 V / 4,5 Ω = 2,22 A, 11,1 W ✓ (dossier ghi "2,2 A/11 W"). `3,3/99k+13µA = 46,33 µA` ✓. Ví dụ VOH/VIH: 0,8×3,3−2,0 = 0,64 V ✓ và (3,3−0,1)−2,5 = 0,70 V ✓. `4,232 − 4,200 = 32 mV` ✓.
- Phạm vi A10: không thấy file nào ngoài hồ sơ và thư mục run bị tạo; bốn cấu hình và các file đầu vào khớp hash snapshot (snapshot do Codex ghi, nên đây là "không đổi từ lúc snapshot", không phải "không đổi so với trước A10").
- Hợp đồng MCU: "18/18 GPIO" thuộc robot r7 tham chiếu, GPIO14 "Loại theo chính sách r7, không gọi là strapping pin" (hợp đồng dòng 133, 229) khớp dossier §5.

## Không kiểm
- Các nguồn không có bản cục bộ và không nằm trong `source-excerpts.txt`: **MCP73833/4 DS20002005C** (VREG 4,168-4,232 V tr.3, FCI 4,20 V tr.27, tr.13-14), **DRV8833 SLVSAR1E** (nSLEEP ≤0,5 V / ≥2,5 V), **SN74LVC1G11** (VIH/VOH), **ESP32 Series v5.3** (VOH, §5.3, Appendix A.4), **Adafruit 2776** (5 V, 1,1 A, 4,5 Ω). Tôi không dùng mạng, nên các số này chưa kiểm.
- "75 trang" của PDF TI: trang 75 là trang thông báo cuối; tôi không có `pdfinfo` để đếm chắc.
- Hai specialist `gpt-6.1-sol` và agent QA: chỉ biết qua REPORT.md, không xác nhận.
- Không đánh giá tính đúng của thiết kế điện (dossier là tập phương án, không có thiết kế để chấm).
- Q2-OFF, B01 v1 và closure P0-04: không đọc lại ngoài các điểm đã nêu (đã review ở C02 trừ phần closure đổi sau đó).

## Verdict từng cổng (đều giữ OPEN)

| Cổng | Verdict | Vì sao chưa đủ | Quyết định cần founder |
|---|---|---|---|
| D17-OFF-DESIGN | `insufficient_evidence` | Chưa chọn kiến trúc (O-A/O-B/O-C); thiếu MAX leakage/trễ từng miền bias, cận sense thấp, full Ceff/ESR, FMEA nguồn/bias/GND chung. TPS25947 chỉ có TYP cho rò khi không nguồn (4,86 µA), tCB và tRST, nên không chứng minh ≤10 µA và ≤20 ms (dossier §2 nói đúng điều này) | Chọn hướng giữ/cấp quyền cơ khí hay điện (O-A/B/C) khi lựa chọn đổi cấu hình |
| D17-ACTUATOR-PRODUCT | `insufficient_evidence` | Không có actuator sản phẩm, MPN, force–stroke, duty, nhiệt, ngân sách tải đầy đủ. Ứng viên lab Adafruit 2776 (2,22 A cho hai chiếc) vượt 0,50 A RUN và không phải BOM sản phẩm | Chọn nhóm actuator (solenoid spring-return, chốt bistable, motor/servo, khóa cơ thụ động) |
| D17-H3-CV-PROTECTION | `insufficient_evidence` | Chưa có cửa sổ CV cho phép của đúng pack Jauch (chỉ "4,2 V", không có dung sai dương); thiếu envelope charger đầy đủ, cận trip, độc lập sense/reference/ngắt. Dữ liệu then chốt (MCP73833 VREG) chưa có trích đoạn gốc để kiểm (F1) | Chọn H-A/B/C/D, và quyết có hỏi Jauch về dung sai sạc |
| MCU-RESET-VETO-RESOURCES | `insufficient_evidence` | Chưa chọn đường veto độc lập, không có đếm tài nguyên riêng tay cầm (F2), thời gian detect→isolate→power-off TBD | Chọn hướng C01 (chốt dùng chung, expander I2C, xét lại chân loại bởi r7) |

## Findings

**F1 · Medium · Dữ liệu then chốt cho H3 không có trích đoạn gốc để kiểm.**
Dossier §4 dựa vào MCP73833 VREG 4,168-4,232 V (tr.3), FCI 4,20 V (tr.27) và các trang 13-14, qua một đường link; `source-excerpts.txt` chỉ có TI TPS25947 và Jauch. Tương tự DRV8833, SN74LVC1G11, ESP32 ở §5. Kết luận "cận trên đã hơn 32 mV" và lập luận H-A/H-B đứng trên con số 4,232 V mà reviewer không kiểm được từ snapshot.
Impact: Box 08 phải lấy số từ mạng, ngoài snapshot, nên review không tái lập được trên đúng bytes.
Fix tối thiểu: thêm trích đoạn (tên file, revision, trang, hash PDF) cho MCP73833 tr.3/13/14/27, DRV8833 §6.5, SN74LVC1G11 §5.3/5.5, ESP32 §5.3 vào `source-excerpts.txt` và hash PDF vào `input-snapshot.json`.

**F2 · Medium · Cổng `MCU-RESET-VETO-RESOURCES` nằm trong cấu hình tay cầm nhưng hồ sơ không có phân tích tài nguyên cho tay cầm.**
Dossier §5 nêu "18/18 GPIO" là của robot r7, đường nSLEEP (DRV8833/TPS63070/U9) cũng là robot lịch sử, và nói đếm tài nguyên tay cầm phải riêng. Nhưng không có đếm nào cho tay cầm: không biết MCU nào dùng, bao nhiêu chân, E1-E4 của tay cầm là gì. Phạm vi cổng trong JSON (`GPIO4 internal pulldown vs external OE pullup`) lại là chi tiết của đường robot.
Impact: dù Box 08 chọn hướng C01 nào, cổng này không thể PASS cho tay cầm vì không có số liệu tay cầm để chấm khả thi; hoặc cổng đặt sai cấu hình (robot) và việc chuyển nó đổi hash.
Fix tối thiểu: Codex (hoặc Sol) làm rõ bằng văn bản cổng này áp dụng cho cấu hình nào; nếu cho tay cầm, thêm bảng chân tay cầm (đã dùng/còn/UNASSIGNED) cùng nguồn; nếu thuộc robot, đề xuất chuyển (founder duyệt, đổi hash trước khi duyệt hash).

**F3 · Low · Dossier ghi không thấy bảng A6, nhưng bảng nằm ở thư mục gốc dự án.**
Dossier §2: "Không tìm thấy bảng A6 trong … `docs/claude-support/2026-11-08-ai-team-plan/datasheet-table.md` hoặc `.tmp/ai-intake`". `datasheet-table.md` (18,4 K) và `browser-report.md` hiện nằm ở `electronics-learning-demo/` (chưa dọn, đã ghi ở §0 dispatch). Việc dossier dùng PDF trực tiếp là đúng và tốt hơn (bảng A6 có một hàng NTC sai tôi đã loại, không liên quan TPS25947), nên không ảnh hưởng nội dung. Fix: sửa câu thành "bảng A6 ở thư mục gốc, không dùng" hoặc chuyển file vào `.tmp/ai-intake/` theo quy tắc.

**F4 · Low · Chồng lấn 2 mV giữa VREG tối đa và ngưỡng PCM quá sạc tối thiểu chưa được nêu thẳng.**
Từ số trong dossier: MCP73833 VREG max 4,232 V; Jauch PCM phát hiện quá sạc tối thiểu 4,28 − 0,05 = 4,23 V. VREG max vượt ngưỡng PCM min 2 mV tại điểm kiểm datasheet, chưa tính gợn hay sai số đo. Dossier §4 nói "PCM detect thấp nhất 4,23 V không cho phép sạc trên giới hạn vận hành" nhưng không nêu rủi ro PCM ngắt trong CV bình thường (nuisance trip) ở góc cao. Số 4,232 V là chưa kiểm (F1), nên đây là điều Box 08 cần xét, không phải kết luận.
Fix: thêm một dòng vào §4 phản ví dụ H-A: "VREG max > PCM overcharge min → có thể ngắt PCM ở góc cao".

**O1 · Quan sát · Task `MM-HW-P0-05` chưa có trong `tasks.json`.**
Tìm `MM-HW-P0-05` trong `docs/agents/tasks.json`: không có (39 task). REPORT.md đã nói không sửa queue vì ngoài scope; nhất quán. Nhưng bảng điều phối và `MM-HW-MOBOT-REMOTE-KICAD-001` (waiting) không có task A10 để phụ thuộc hay theo dõi. Codex lead cần đăng ký task trước khi dùng nó làm điều kiện lease.

**O2 · Quan sát · C03 F1/F2 vẫn là điều kiện trước B1.**
Dossier §6 nêu đúng và không tự đóng. Khi sửa JSON để thêm `stage` có kiểu (C03 F1) và `required_gate_ids` (C03 F2), hash cấu hình sẽ đổi: nên làm một lần cùng các thay đổi cấu hình phát sinh từ quyết định founder ở bảng trên, rồi mới duyệt hash.

## Câu hỏi
1. Cổng `MCU-RESET-VETO-RESOURCES` áp dụng cho tay cầm hay robot (F2)?
2. Ai đăng ký `MM-HW-P0-05` vào `tasks.json` và với trạng thái nào (O1)?
3. Founder có muốn hỏi Jauch về dung sai điện áp sạc dương của pack 250832 không (ảnh hưởng H-A)?

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 ===
relay_id: R-20261109-C06
reply_to: R-20261109-A10-01
type: REVIEW_RESULT
verdict: A10 đạt yêu cầu document-only, trung thực (không tự PASS). Hash dossier 28ddd882…d152 và 9 đầu vào khớp. Verdict từng cổng: D17-OFF-DESIGN, D17-ACTUATOR-PRODUCT, D17-H3-CV-PROTECTION, MCU-RESET-VETO-RESOURCES đều insufficient_evidence, giữ OPEN. Không duyệt hash, không lease, không chọn thay founder
findings: F1 Medium (MCP73833/DRV8833/SN74LVC1G11/ESP32 không có trích đoạn gốc, H3 dựa vào 4,232 V chưa kiểm); F2 Medium (cổng MCU không có phân tích tài nguyên riêng cho tay cầm; 18/18 và nSLEEP là của robot); F3 Low (bảng A6 nằm ở thư mục gốc); F4 Low (VREG max 4,232 V > PCM overcharge min 4,23 V chưa nêu); O1 (MM-HW-P0-05 chưa trong tasks.json); O2 (C03 F1/F2 vẫn trước B1; gộp thay đổi cấu hình rồi mới duyệt hash)
checks_run: sha256 dossier + 5 file run + 9 đầu vào; validate.mjs exit 0; so 4 tiêu chí với JSON; đối chiếu TPS25947 (tr.8-11, 31, 61) và Jauch tr.2 với PDF; tính lại 1,045390625 A, 2,320926/2,374938 s, 0,64/0,70 V, 46,33 µA, 32 mV, 2,22 A
checks_not_run: MCP73833, DRV8833, SN74LVC1G11, ESP32, Adafruit 2776 (không mạng, không bản cục bộ); số trang PDF (không pdfinfo); phần đổi của closure P0-04 sau C02; tính đúng của thiết kế điện
done_when: Codex ghi DISPOSITION cho F1-F4/O1-O2; founder chọn các quyết định ở bảng verdict; không đổi cấu hình hay trạng thái cổng nào bằng review này
=== END RELAY ===
```
