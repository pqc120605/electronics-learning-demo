# REVIEW_RESULT · P0-04 hồ sơ cấu hình tay cầm · 08/11/2026 · Leader Claude

Đối tượng (đúng hai hash trong request, tôi tính lại bằng `sha256sum`, cả hai khớp):
- `docs/mission-control/hardware-config-mobot-v2-typec-r8-handset.json` SHA256 `7da44e908838020072a226ec260d330d0bba717a5f828bb8cbae1076576b7554`
- `docs/hardware/mobot-v2-p0-04-handset-closure.md` SHA256 `b10a6f66b3cd23708e06b46f8fbedb36afdec9ed09d487324f1d2fb123c296f6`

## Kết luận
**NHẬN ở phạm vi DOCUMENT ONLY / PROPOSED.** Không có finding High. Review này không phê duyệt hash cấu hình, không mở lease, không xác nhận phần cứng hay phép đo nào đạt. Có 1 finding Medium, 2 finding Low, 1 quan sát.

## Đã kiểm (kết quả)
- Hai hash khớp request. `mcu_contract.sha256` trong JSON (`8665a8cc…e4f3`) khớp hash hiện tại của file hợp đồng MCU.
- So `handset-before.json` (trước P0-04) với file hiện tại: chỉ thêm 3 khóa (`mcu_contract`, `external_design_gates`, `verification_evaluation_policy`) và sửa khóa `gates`. Các khóa `handset` (kể cả `candidate_configuration`), `board`, `baseline`, `carrier`, `decisions` giống hệt. Vậy "payload số/vật liệu không đổi" đúng cho các khối này. Hash cấu hình robot `2fb61b4f…` không đổi.
- 14 verification_items, tất cả `NOT_RUN`, `measured: "TBD"`, giới hạn `TBD`; 5 mục đầu (USB, UVLO, THERMAL, ADC, CLONE) theo D10 gốc, 8 mục JAUCH-* (TERMINATION, TIMER, NTC, PULSE, IR, CONNECTOR, POLARITY, MECHANICAL) khớp đúng danh sách trong xác nhận D10 bổ sung, và FAB-STACKUP-DRC theo D15(b). Mỗi mục có `pass_fail`, `responsible`, `timing`, `limits`.
- 6 `milestone_gates` đều `OPEN` đúng mốc: D17-OFF-DESIGN, D17-ACTUATOR-PRODUCT, D17-H3-CV-PROTECTION (trước lease schematic); D17-B01-TRACEABILITY (trước khóa BOM); D17-OFF-ASSEMBLY (trước cho phép chuyển mode); D15B-FAB-LAYOUT (trước lease layout). `external_design_gates` có MCU-RESET-VETO-RESOURCES, `OPEN`, "before applicable schematic lease", khớp §6 hợp đồng MCU và F1 của review R-20261108-C01.
- Dữ liệu pack Jauch trong JSON dòng 37 (cell INR18650JC-26 1s1p; 3,6 V; 2600/2500 mAh; sạc 4,2 V, chuẩn 1250, tối đa 2500 mA, 0..45 °C; xả cắt 2,80 V, chuẩn 1250, tối đa 3000 mA, −20..60 °C; PCM quá sạc 4,28 ± 0,05 / nhả 4,08 ± 0,05 V; quá xả phát hiện/nhả 2,80 ± 0,10 V; quá dòng 6..12 A; cầu chì 7 A): tôi đối chiếu từng số với `D:\250832.pdf` mà tôi đọc bằng `pdftotext`, tất cả khớp.
- Năm blocker gốc (HANDSET-POWER-DESIGN, CARRIER-INTERFACES, B01-SUPPLY, HANDSET-PACK-H3, STACKUP-DRC) trong bảng closure.md khớp căn cứ: D17-HW (founder "ok duyệt" 08/11), D10 bổ sung 08/11 chỉ cho danh sách Jauch, D15(b) cho STACKUP-DRC. Tôi không thấy tài liệu thêm miễn trừ nào ngoài các căn cứ đó.

## Không kiểm
`validate.mjs`, `validate.test.mjs`, `verify-snapshot.mjs` và `checks.json` (tôi không chạy và không đọc raw output); `review.md` nội bộ; các khối `power_design`, `whole_path_budget`, ngân sách điện và handoff Box 02/03 (số liệu và phép tính); `tasks.json` ngoài mục tôi đã thấy. Tôi chỉ kiểm cấu trúc và căn cứ, không kiểm tính đúng của thiết kế điện.

## Findings

**F1 · Medium · Hash được duyệt cùng `blocking_unknowns: []` có thể bị đọc nhầm là sẵn sàng lease.**
Evidence: JSON `blocking_unknowns: []` trong khi 6 gate `OPEN`; `blocking_unknowns_scope` ghi rõ "Empty does NOT mean schematic/layout/BOM/operation milestones have passed"; closure.md ghi không coi `blocking_unknowns` rỗng hoặc validator xanh là quyền bỏ milestone, và nói preflight có thể cần thay đổi riêng trước khi lease.
Impact: validator và preflight hiện tại có thể coi cấu hình hợp lệ khi `blocking_unknowns` rỗng, trong khi gate OPEN chỉ được giữ bằng văn bản. Một người sau này (hoặc agent) đọc "hash đã duyệt, không còn blocker" có thể bỏ qua gate.
Fix tối thiểu: trước khi cấp lease, thêm kiểm tra tự động từ chối dispatch lease schematic khi còn `milestone_gates` hoặc `external_design_gates` ở trạng thái OPEN (task riêng, closure.md đã nhắc). Văn bản duyệt hash của founder nên ghi câu "duyệt hash này không đóng gate nào".

**F2 · Low · Hai thông tin pack mơ hồ không có người sở hữu.**
Evidence: JSON dòng 37 ghi "OD detect/release đều 2,80±0,10 V (cần làm rõ)" và dòng 312 ghi "UL YES/NO còn mơ hồ", nhưng không item hay gate nào nhận. JAUCH-* không đề cập ngưỡng nhả quá xả.
Impact: ngưỡng nhả quá xả ảnh hưởng trễ khởi động lại và thiết kế UVLO; nếu không ai sở hữu, câu hỏi bị bỏ.
Fix tối thiểu: ghi vào `limits` của UVLO và JAUCH-IR một dòng "TBD: ngưỡng nhả quá xả của PCM chưa rõ (Jauch Rev 1.2 trang 2)" và gắn câu hỏi UL cho gate chứng nhận.

**F3 · Low · Trích dẫn trang và nguồn.**
Evidence: JAUCH-NTC ghi "không có R–T trong Rev1.2 trang3". NTC được liệt kê ở trang 2, trang 3 là phần xử lý và bảo quản; không trang nào có bảng R–T. `pack_reference` ghi "số liệu do Founder trích từ PDF giữ"; thực tế số được trích lần này bằng `pdftotext` từ `D:\250832.pdf` trong phiên Claude và tôi đã đối chiếu lại.
Fix tối thiểu: sửa thành "NTC có ở trang 2; không có bảng R–T trong Rev 1.2" và ghi đúng nguồn (PDF `250832.pdf`, 3 trang).

**O1 · Quan sát · Chưa có người đo.**
Evidence: các mục JAUCH-* ghi "người đo Box 07 hoặc người được Founder chỉ định trước phép thử (chưa chỉ định)", và `verification_evaluation_policy` đúng khi coi thiếu người đo là UNKNOWN. Founder đã nói không tự đo được mẫu.
Impact: 14 mục sẽ ở trạng thái UNKNOWN vô thời hạn nếu không ai nhận đo. Chấp nhận được cho hồ sơ proposed.
Gợi ý: founder chốt người hoặc bên đo trước phiên Box 08 review trước layout.

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-08 ===
relay_id: R-20261108-C02
reply_to: R-20261108-P0-04-HANDSET
type: REVIEW_RESULT
verdict: NHẬN ở phạm vi DOCUMENT ONLY / PROPOSED; hash 7da44e90…b7554 và b10a6f66…296f6; không có High; không phải duyệt hash hay mở lease
findings: F1 Medium (hash duyệt + blocking_unknowns rỗng có thể bị đọc nhầm là sẵn sàng lease; cần kiểm tự động gate OPEN trước lease); F2 Low (ngưỡng nhả quá xả PCM và UL YES/NO chưa có người sở hữu); F3 Low (trích dẫn trang NTC và nguồn số pack); O1 (chưa có người đo)
checks_run: sha256 hai file khớp; diff trước/sau chỉ thêm 3 khóa và sửa gates; handset/board/baseline/carrier/decisions và candidate_configuration giống hệt; robot hash không đổi; 14 items NOT_RUN/TBD; 6 milestone_gates + MCU-RESET-VETO OPEN đúng mốc; số pack Jauch khớp D:\250832.pdf
checks_not_run: validate.mjs, validate.test.mjs, verify-snapshot.mjs, checks.json, review.md nội bộ, power_design/whole_path_budget và ngân sách điện, handoff Box02/03
done_when: Codex xác minh từng finding, ghi DISPOSITION; F1 ghi thành task kiểm gate trước lease
=== END RELAY ===
```
