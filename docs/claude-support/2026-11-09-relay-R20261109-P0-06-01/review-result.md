# REVIEW_RESULT · P0-06 cấu hình r9 tay cầm, hướng founder, ứng viên sạc H-C · 09/11/2026 · Leader Claude

Đối tượng (request R-20261109-P0-06-01; tôi tính lại bằng `sha256sum`, cả 5 hash khớp request):
- `docs/mission-control/hardware-config-mobot-v2-typec-r9-handset.json` (550 dòng) SHA256 `e8a1d0d319f11d71d0b5040731664f72076396eb5f39d968d8df45e6039510a3`
- `docs/hardware/mobot-v2-p0-05-handset-gates-closure.md` SHA256 `a29c1d19661b96ae6d0a2bc3a1a2e2579cf07a0c3db6b3bc8bfa0f86c1113968`
- `docs/hardware/mobot-v2-p0-06-handset-charger-candidates.md` (32 dòng) SHA256 `b153411de89effc204a11957406a919f9deb677adb0062fdc3bfe31f493e1f5f`
- `docs/hardware/mobot-v2-founder-decision-q1-q8.md` SHA256 `55ee091bea39a155d24068b76a0b524b60a67aaf84e488be2c14ad0045d0299b`
- `docs/agents/tasks.json` SHA256 `d32d1e65fbdb06432b8bc437b0178d84051750d8fc541eddc444416f387877c4`

## Kết luận
**NHẬN ở mức DOCUMENT ONLY / PROPOSED.** Ghi nhận bốn hướng của founder đúng nguyên văn, r9 chỉ thêm những gì đã nêu và giữ nguyên tiêu chí, mốc, 14 verification items; đăng ký queue đúng (chỉ thêm 2 mục). Không có finding High. 1 Medium (con số 9 mV chưa chứng minh là cận xấu nhất), 2 Low, 4 quan sát. **Cả bốn cổng vẫn `insufficient_evidence`, OPEN.** Review này không duyệt hash r9, không duyệt MPN BQ25185/BQ25186, không mở lease, không đóng cổng.

## Đã kiểm (kết quả)
- 5 hash khớp. `hardware-config-…-r8-handset.json` `c5d342db…dc626` và `…r8-robot.json` `2fb61b4f…674fc` giữ nguyên byte (tính lại, khớp bản `before-*` trong run). `configuration-sha256.txt` ghi hash r9 ban đầu `e8a1d0d3…510a3`, bằng hash hiện tại.
- `node D:/StartupOS/docs/agents/validate.mjs`: exit 0, 41 tasks, 143 capabilities, `warnings: []`, `errors: []`. `validate.mjs` (`69540e83…`) và `validate.test.mjs` (`a4fcc857…`) không đổi; `node --test` chạy lại 32/32.
- **Ghi nguyên văn bốn quyết định:** so khối "XÁC NHẬN CỦA FOUNDER" trong `founder-decision-q1-q8.md` (dòng 68-87 mới) với `founder-confirmation.txt` bằng `diff`: giống từng dòng (chỉ khác ký tự xuống dòng cuối). Bản trước (`before-…q1-q8.md`) so bản nay: chỉ **thêm** dòng 69-87, không sửa dòng cũ, nên Q1-Q8 không đổi.
- **r9 so r8**: tôi diff đệ quy toàn bộ JSON (script `node` ở scratchpad, không sửa file). Chỉ có các thay đổi sau: `id`/`revision`; `candidate_configuration.status/id`; một dòng `electrical_candidates` (charger H3: `MCP73833-FCI/MF…` → `H-C; MPN TBD…`) cùng `historical_charger_screening` giữ lại dòng MCP73833 cũ; thêm `actuator_direction`, `charger_proposal`, `mcu_resource_plan`, `supersedes`, `founder_direction_record`, `selected_design_directions`, `required_gate_ids`, `gate_schema_contract`; thêm `stage` (và `selected_direction` cho 4 cổng); đổi `scope` của `MCU-RESET-VETO-RESOURCES`. **Không đổi**: `pass_fail`, `milestone`, `status` của mọi cổng, `verification_items` (14), `blocking_unknowns_scope`, khối `power_design`, `whole_path_budget`, `decisions`, các quyết định Q. Không có `approved_by` hay `approved_sha256` trong r9.
- **Typed stage và required IDs**: `stage` của 7 cổng = `schematic` ×4 (`D17-OFF-DESIGN`, `D17-ACTUATOR-PRODUCT`, `D17-H3-CV-PROTECTION`, `MCU-RESET-VETO-RESOURCES`), `bom` (`D17-B01-TRACEABILITY`), `operation` (`D17-OFF-ASSEMBLY`), `layout` (`D15B-FAB-LAYOUT`): khớp mốc gốc. `required_gate_ids`: schematic = 4 ID; layout = 4 ID + `D15B-FAB-LAYOUT`; bom, operation giữ mốc riêng; `gate_schema_contract.stage_enum` đúng 4 giá trị. `enforcement_status` ghi rõ "validator NOT MODIFIED… C03 F1/F2 remain OPEN".
- **Applicability MCU**: `scope` mới nêu "Handset-only… Robot OE_N/GPIO4/nSLEEP names are not evidence of handset nets"; `pass_fail` gốc nguyên văn ("retained driven GPIO and loss of bias… Missing design evidence remains OPEN") không đổi.
- **Inventory GPIO tay cầm** (xử lý C06 F2): đếm lại từ `evidence/esp32-devkit-v1-type-c-sample.md:23-26`: 12 nhãn GPIO hàng trái + 13 hàng phải = 25; trừ 7 bị policy loại (1,2,3,5,12,14,15) = 18; trừ 5 đã dùng (34,35,32,33,25) = 13. 13 = input-only 36/39 (2) + output-capable 4,13,18,19,21,22,23,26,27 (9) + có điều kiện module 16/17 (2). Số học khớp cả `mcu_resource_plan` và §5 dossier. Đây là nhãn tham chiếu, chưa xác minh clone (r9 tự ghi như vậy).
- **Ứng viên sạc**: `source-manifest.json` ghim 2 PDF; hash tính lại `bq25185.pdf` `c73ed7d6…3684`, `bq25186.pdf` `96834a45…791c9` khớp manifest. Đối chiếu `pdftotext` (không sửa PDF): BQ25185 SLUSF65B October 2023 revised August 2026; VREG_ACC "All VBATREG settings, typical" −0,5…0,5 % (tr.7); KISET 285/300/315 AΩ (tr.7); ITERM 10 % TYP (tr.7); tMAXCHG 360 (một cột, tr.8); danh sách VSET 3,6/3,65/4,02/4,1/4,2/4,35/4,4 V đúng. BQ25186 SLUSF69A May 2024 revised January 2025; VREG_ACC trong bảng tr.6, 3,5-4,65 V bước 10 mV, tMAXCHG programmable 180-720 phút (tr.8), thanh ghi `SAFETY_TIMER_1:0` (tr.36).
- **Phép tính** (tính lại): 4,20×0,995 = 4,179 V; 4,20×1,005 = 4,221 V; PCM min 4,28−0,05 = 4,230 V; margin 4,230−4,221 = 9 mV ✓. 300/0,4 = 750 Ω ✓. 2,5 Ah/0,4 A = 6,25 h; 2,6 Ah/0,4 A = 6,5 h; 360 phút = 6 h ✓. Ví dụ 4,17 V: ×0,995 = 4,14915 V; ×1,005 = 4,19085 V; 4,2−4,19085 = 9,15 mV ✓ (tài liệu nói margin này tính tới 4,2 V, không tới PCM).
- **MCP73833 (C06 F1 sửa)**: PDF ghim `MM-HW-P0-05/attempt-2/sources/mcp73833-ds20002005c.pdf` có VREG 4,168 / 4,20 / 4,232 V (dòng VREG, VDD = VREG+1 V). Con số này trước đó tôi chưa kiểm được, nay có nguồn. DRV8833, SN74LVC1G11, ESP32 ghim cùng thư mục: tôi chưa đọc nội dung.
- **Queue**: so `before-tasks.json` (39) với `tasks.json` (41): chỉ 2 mục mới `MM-HW-P0-05` (done) và `MM-HW-P0-06` (waiting, phụ thuộc P0-05, `resume_state: in_review`); mọi task cũ và các khóa cấp trên (kể cả `hardware_configurations`) giống hệt. P0-05 giữ `gates.hardware: unknown`, `review.scope` ghi "document-only acceptance… not hardware PASS" và trỏ đúng review-result C06; snapshot ghim bản dossier gốc `28ddd882…` (đã lưu `dossier-before.md`). Hash file C06 của tôi `6614521f…` khớp `p0-05-completion-snapshot.json`.
- `DISPOSITION-C06.md` có đủ F1-F4 và O1-O2 (accept/corrected; O1 defer rồi đăng ký ở P0-06).
- Run P0-06 tự ghi không đụng robot, `.codex`, `docs/claude-support`, validator; các hash tôi tính lại không mâu thuẫn.

## Không kiểm
- Lời của founder trong HQ: tôi chỉ thấy bản do Codex lưu (`founder-confirmation.txt` và biên bản). Không xác minh được đó là nguyên văn lời founder, và câu "Founder xác nhận trực tiếp … trong HQ" (dòng 71 biên bản).
- BQ25186: ITERM 5/10/20 % (tr.34), dải 400 mA ở bước 10 mA, các trang NTC; BQ25185 trang NTC (tr.18). Tôi chỉ kiểm các trang liệt kê ở mục trên.
- `source-excerpts.txt` của P0-06 (69 KB), `review.md` nội bộ, `BOX08-REVIEW-PACKET.md` và `review-request.md` của run: không đọc.
- Phần dossier ngoài đoạn diff đã in (§§1-6 cũ đã review ở C06).
- Tính đúng của thiết kế điện (đây là tập hướng và sàng lọc, không có thiết kế để chấm).
- DRV8833, SN74LVC1G11, ESP32, Adafruit 2776 (nay có bản ghim, tôi chưa đọc).

## Verdict từng cổng (đều giữ OPEN)

| Cổng | Verdict | Thay đổi so với C06 | Vẫn thiếu |
|---|---|---|---|
| D17-OFF-DESIGN | `insufficient_evidence` | Hướng O-A + O-C đã chọn, không O-B; có bảng FMEA khóa thụ động (§7) | Mọi bound: MAX leakage/trễ, hai cận sense, đường feedback vị trí, cơ cấu giữ và độc lập GPIO retained HIGH; không có thiết kế |
| D17-ACTUATOR-PRODUCT | `insufficient_evidence` | Nhóm "khóa cơ thụ động" đã chọn, không MPN, có phương án lùi | Phần tử cấp quyền điện nào, ngân sách điện, lực/hành trình/dung sai; tiêu chí "không chứng minh được thì dừng" chưa định nghĩa |
| D17-H3-CV-PROTECTION | `insufficient_evidence` | H-C, hai ứng viên BQ25185/BQ25186 có PDF ghim; MCP73833 chuyển sang lịch sử | Cận VREG xấu nhất thật (F1), timer BQ25185 (6 h < 6,25 h ở CC), profile/NTC/termination Jauch, MPN và setpoint chờ founder duyệt, độc lập bảo vệ |
| MCU-RESET-VETO-RESOURCES | `insufficient_evidence` | Hướng chốt/logic phần cứng; inventory tay cầm riêng (5 dùng / 13 chưa dùng) | Không gán chân, không thiết kế veto, không cận thời gian detect→isolate→off |

## Findings

**F1 · Medium · Con số 9 mV chưa chứng minh là cận xấu nhất của VREG.**
`mobot-v2-p0-06-handset-charger-candidates.md:8,10,20`; `r9.json` `milestone_gates.2.selected_direction`. Hàng accuracy của cả hai IC ghi điều kiện "All VBATREG settings, typical" (BQ25185 tr.7, BQ25186 tr.6); tài liệu ghi "typical measurement tại 4,2 V" và dặn không extrapolate, nhưng vẫn dùng 4,221 V làm "VREG max" cho margin 9 mV và cho tiêu chí "VREG tối đa thấp hơn 4,23 V có margin" của founder. Từ văn bản PDF tôi không phân biệt được ±0,5 % là cận được bảo đảm trên toàn dải TJ −40…125 °C, line, load, hay là đo điển hình.
Impact: nếu đó là điển hình thì margin có thể âm hoặc rất mỏng trong thực tế; tài liệu hiện đọc như một cận. Đây là con số quyết định H-C có thỏa tiêu chí founder hay không.
Fix tối thiểu: Box 08 hoặc Codex đọc Figure 5-1 (cả hai datasheet) và chú thích bảng, ghi rõ "bảo đảm" hay "điển hình"; đến khi đó gọi 4,221 V là "tính từ ±0,5 % điển hình", không gọi là "VREG tối đa".

**F2 · Low · Rev B của BQ25185 đổi timer từ 720 xuống 360 phút nhưng tài liệu không nêu.**
Lịch sử bản sửa của PDF ghi "Changed tMAXCHG from 720 min to 360 min" (Rev B). Nguồn thứ cấp hoặc bản cũ vẫn có thể ghi 720 phút. Phép tính 6 h của dossier đúng cho Rev B. Fix: thêm một dòng về lịch sử revision và ghi rõ chỉ dùng SLUSF65B.

**F3 · Low · FMEA khóa cơ thụ động thiếu vài kịch bản.**
`mobot-v2-p0-05-handset-gates-closure.md` §7. Chưa có: rơi/va đập/rung làm chốt nhả, kéo cưỡng bức (phá khóa), lão hóa lò xo/vật liệu theo nhiệt, và khóa kẹt ở trạng thái khóa làm không bảo trì được (an toàn so với khả dụng). Hàng "mòn/biến dạng/kẹt/gãy" chỉ gộp chung. Fix: thêm các hàng này, mỗi hàng có phản ví dụ FAIL và ô TBD.

**O1 · Quan sát · "13 vị trí chưa dùng" gồm 2 chân chỉ-vào và 2 chân có điều kiện.**
Biên bản founder ghi "13 vị trí"; số chân chắc chắn xuất được là 9 (4,13,18,19,21,22,23,26,27), 11 nếu 16/17 qua được điều kiện module/memory. GPIO13 là JTAG MTCK, GPIO4 có pull-down nội. 36/39 chỉ dùng được cho feedback vào. r9 và dossier phân loại đúng; khi gán chân, lập bảng theo vai trò (veto, permission, driver, feedback) với 9/2/2.

**O2 · Quan sát · Đăng ký queue.**
`MM-HW-P0-05` đăng ký `done` bằng một sự kiện lịch sử `null>done` và `review.verdict: pass`; `review.scope` ghi đúng "document-only… not hardware PASS" và `gates.hardware: unknown`. Chấp nhận được; chỉ lưu ý chữ "pass" ở cấp task không được đọc thành gate PASS.

**O3 · Quan sát · `required_gate_ids` do chính proposal khai.**
Danh sách nằm trong r9 cùng các cổng; một lần sửa JSON xóa cổng thì xóa luôn cả danh sách. Codex đã ghi đúng là cần trusted baseline trong task validator riêng (C03 F2). Metadata này chưa chặn được gì: `validate.mjs` không đổi và vẫn phân loại mốc bằng regex (C03 F1). C03 F1/F2 vẫn là điều kiện trước B1; r9 chưa đăng ký trong `hardware_configurations` nên preflight chưa đọc nó.

**O4 · Quan sát · Con số MCP73833 đã được kiểm.**
Xem mục Đã kiểm: đóng phần "chưa kiểm" của C06 F1 cho MCP73833 (VREG 4,168/4,20/4,232 V).

## Câu hỏi
1. Ai chốt cách đọc ±0,5 % của hai IC (F1): Box 08 hay hỏi TI?
2. "Không chứng minh được hình học thì dừng" (founder, hướng 1) cần tiêu chí dừng cụ thể (bằng chứng gì, hạn nào) trước khi Box 08 xét; ai định nghĩa?

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-09 ===
relay_id: R-20261109-C07
reply_to: R-20261109-P0-06-01
type: REVIEW_RESULT
verdict: NHẬN document-only/proposed. Bốn hướng founder ghi đúng nguyên văn (diff khớp); r9 e8a1d0d3…510a3 chỉ thêm các khóa đã nêu, giữ pass_fail/milestone/14 items; 5 hash khớp; queue chỉ thêm 2 mục. Cả 4 cổng insufficient_evidence, OPEN. Không duyệt hash r9, MPN, lease
findings: F1 Medium (9 mV dựa trên hàng accuracy "typical", chưa chứng minh là cận xấu nhất, charger-candidates.md:8,10,20); F2 Low (BQ25185 Rev B đổi timer 720→360 phút, chưa ghi); F3 Low (FMEA khóa cơ thiếu rơi/va đập, kéo cưỡng bức, lão hóa, kẹt khóa); O1 (13 chân gồm 2 input-only + 2 điều kiện, chắc chắn xuất 9); O2 (task P0-05 done "pass" không phải gate PASS); O3 (required_gate_ids tự khai trong proposal, validator không đổi, C03 F1/F2 vẫn trước B1); O4 (MCP73833 VREG 4,168/4,20/4,232 V đã kiểm)
checks_run: sha256 5 file + r8/robot + 2 PDF ghim + validator; validate.mjs exit 0 (41 tasks); node --test 32/32; diff đệ quy r9 vs r8; diff khối xác nhận founder; so tasks.json trước/sau; đối chiếu BQ25185/BQ25186 với PDF (tr.6-8, 36, lịch sử revision); tính lại 4,179/4,221/9 mV, 750 Ω, 6,25/6,5 h, 4,14915/4,19085 V; số chân 25→18→13; MCP73833 VREG
checks_not_run: lời gốc của founder; BQ25186 ITERM/NTC/dải 400 mA; source-excerpts.txt, review.md, packet; DRV8833/SN74LVC1G11/ESP32/Adafruit; tính đúng thiết kế điện
done_when: Codex ghi DISPOSITION cho F1-F3 và O1-O3; không sửa bytes r9 để xử lý F1-F3 mà không tạo revision mới (r10); C03 F1/F2 xong trong task validator riêng trước B1; không duyệt hash hay MPN từ review này
=== END RELAY ===
```
