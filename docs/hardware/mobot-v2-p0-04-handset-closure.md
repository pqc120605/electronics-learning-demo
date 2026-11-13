# P0-04 · Hồ sơ cấu hình tay cầm sau D15(a)

Ngày 08/11/2026. Phạm vi: PROPOSED / DOCUMENT ONLY, chưa duyệt hash, chưa cấp lease.

## Cấu hình hiện hành và phạm vi

Dùng lại [r8-HANDSET](../mission-control/hardware-config-mobot-v2-typec-r8-handset.json), đã tách khỏi robot; không sinh một bản cấu hình cạnh tranh. Bản kết hợp r8 là lịch sử đầu vào. Không sửa cấu hình robot. Hash trước/sau và lệnh kiểm nằm trong `D:/StartupOS/docs/agents/runs/MM-HW-P0-04/`.

Căn cứ: [D15(a)/D16(c)](mobot-v2-founder-decision-d15-d16.md), [D10 cùng bổ sung trực tiếp 08/11 và D17-HW](mobot-v2-founder-decision-q1-q8.md#d17-hw). Mô tả D15 cũ rằng STACKUP-DRC luôn là blocker đã được bổ sung D15(b) ngày 08/11 thay thế đúng phạm vi. Không mở rộng quyết định trong lượt này.

## Năm blocker ban đầu

| Mục | Disposition có căn cứ | Nghĩa vụ chưa đóng |
|---|---|---|
| HANDSET-POWER-DESIGN | D17-HW cho hoàn tất hồ sơ yêu cầu proposed, không chứng minh topology | D17-OFF-DESIGN và D17-ACTUATOR-PRODUCT OPEN trước lease schematic; D17-OFF-ASSEMBLY trước sử dụng chuyển mode |
| CARRIER-INTERFACES | D17-HW tách phần hồ sơ yêu cầu khỏi chứng minh thiết kế | Các gate OFF/actuator vẫn OPEN; cận giao diện và cơ khí thiếu dữ liệu vẫn TBD, không có pinout mới |
| B01-SUPPLY | D17-HW chuyển truy xuất hàng giao sang đúng mốc | D17-B01-TRACEABILITY OPEN trước khóa BOM; listing không xác minh PCBA/revision ảnh Q1/Q8 |
| HANDSET-PACK-H3 | D10 bổ sung chỉ hoãn đúng thông số Jauch đã liệt kê; D17-HW tách phần tương thích CV/bảo vệ | D17-H3-CV-PROTECTION OPEN trước schematic; không dùng PCM làm cận vận hành; chứng thư thật vẫn bắt buộc ở mốc đóng gói/chứng nhận |
| STACKUP-DRC | D15(b) bổ sung 08/11 cho chuyển sang cổng mốc, không là phép đo sau PCB | D15B-FAB-LAYOUT và FAB-STACKUP-DRC OPEN trước lease layout; Box08 duyệt từng mục |

`blocking_unknowns: []` trong proposal chỉ biểu thị không còn mục chặn **hồ sơ proposed** theo D17-HW. Queue giữ các blocker dispatch schematic. Không xóa blocker dispatch để làm xanh preflight.

## Hợp đồng MCU A3 / P0-03

[Hợp đồng MCU](mobot-v2-esp32-mcu-contract.md) r1 yêu cầu MCU-RESET-VETO-RESOURCES OPEN trước schematic cho tay cầm. Đã đưa gate này vào proposal, đồng bộ nghĩa vụ có sẵn trong registry. Chưa chọn topology, chưa phân GPIO; bảng pin cũ vẫn OLD_REFERENCE / NOT_APPROVED. Gate audio của robot không được đưa vào cấu hình tay cầm.

## Verification và quy tắc đánh giá

Proposal có 14 verification items. Mỗi mục có `pass_fail`, `responsible`, `timing`, `limits`, `measured`, `status`. USB, UVLO, THERMAL, ADC và CLONE theo D10 ban đầu; tám mục JAUCH-* theo bổ sung D10 ngày 08/11. FAB-STACKUP-DRC là cổng thiết kế D15(b) **trước layout**, không gọi là phép đo sau PCB.

Giữ toàn bộ phép đo NOT_RUN, giá trị thiếu TBD. Thiếu cận, điều kiện, người đo được chỉ định hoặc phép đo thì không được kết luận PASS. Box07 là vai trò dự kiến; tên người thực hiện và quyền thao tác phải được Founder chốt trước phép thử. Tiêu chí định tính hiện tại phải được cụ thể hóa và Box08 review trước layout theo quyết định hiện hành; tài liệu này không xác nhận chúng đã sẵn sàng đo.

## Số liệu và provenance

Không thay giá trị số, MPN, vật liệu hoặc phép tính có sẵn; mô tả provenance của số pack được đính chính theo PDF đã đối chiếu. Các thông số pack được kế thừa với nguồn ghi ngay trong proposal: **Jauch 250832 Rev 1.2, trang 2–3**, nguồn PDF `D:/250832.pdf` (3 trang), SHA256 `f591005fb42722eb8f55aba91425e920c23a288cc4d897114968968e0609609a`. Lượt disposition ngày 09/11/2026 đã đối chiếu văn bản bằng pypdf: số pack ở trang 2 khớp; trang 3 là xử lý/bảo quản và yêu cầu CC-CV. Đây là kiểm tài liệu, không là hồ sơ chứng nhận hay phép đo. NTC liệt kê ở trang 2; không có bảng R–T trong Rev 1.2. Những số về ngân sách, ngưỡng, thời gian và lựa chọn linh kiện trong `power_design`/`whole_path_budget` là **ứng viên hoặc yêu cầu thiết kế**, không phải bảo đảm datasheet hay kết quả đo. Nguồn handoff Box02 có trong proposal không được nâng thành chứng minh độc lập. Nếu dùng chúng để đóng gate, Box02 phải kèm đúng tài liệu hãng/revision/trang, cận sai số và điều kiện; thiếu thì giữ TBD/OPEN.

Lượt này kiểm cấu trúc hồ sơ và căn cứ disposition, không kiểm lại toàn bộ tính toán nguồn. Không đưa thêm số datasheet mới. NTC, timer, termination, xung, nội trở, connector/cực tính/cơ khí thiếu vẫn TBD; không gán dữ liệu pack khác.

## Review và giới hạn

REVIEW_RESULT R-20261108-C02 do Founder chuyển đã NHẬN snapshot gốc và yêu cầu disposition các finding không chặn hồ sơ. Các sửa tài liệu F2/F3 được QA nội bộ review đúng snapshot mới trước khi đóng task; không chuyển nhãn review ngoài của bytes gốc sang bytes sửa. Không gọi hoặc gửi trực tiếp cho Claude. Chỉ Founder duyệt hash cấu hình riêng sau review; không thêm `approved_by` hoặc `approved_sha256` vào proposal. Không tạo KiCad, pin assignment, firmware, CAD, mua hàng, flash, cấp điện hoặc đo bench.


## Disposition REVIEW_RESULT R-20261108-C02 · 09/11/2026

Review ngoài NHẬN hai hash gốc ở phạm vi DOCUMENT ONLY / PROPOSED. F2: bổ sung câu hỏi ngưỡng nhả PCM cho UVLO và JAUCH-IR, Box02 sở hữu trước đóng gate thiết kế liên quan; UL YES/NO có owner Box03/Box08 và mốc chứng nhận trong open_questions. F3: sửa trang NTC và nguồn PDF như trên. Không chọn ngưỡng hoặc vật liệu mới, không mở rộng D10. O1: người đo cụ thể còn chưa chỉ định; giữ UNKNOWN/NOT_RUN cho tới khi Founder chỉ định và cấp quyền.

F1 được ghi thành **MM-HW-GATE-PREFLIGHT-001**, task kiểm tự động gate theo mốc trước cấp lease. Task phải chặn OPEN/UNKNOWN/FAIL hoặc thiếu trạng thái/cận trên các gate áp dụng từ proposal lẫn registry; không bắt gate layout/BOM/vận hành hoàn thành sớm hơn quyết định Founder. Chưa sửa validator trong P0-04; các blocker dispatch schematic hiện có vẫn giữ. Hash đã duyệt cùng proposal_blockers rỗng không đủ quyền dispatch. Bất kỳ văn bản xin duyệt hash sau này phải nêu: **“duyệt hash này không đóng gate nào”**.

Hash sau disposition khác snapshot gốc; review ngoài không tự chuyển thành review các bytes sửa. Snapshot sửa được QA nội bộ review riêng, không có phê duyệt hash tự động. Chi tiết ở D:/StartupOS/docs/agents/runs/MM-HW-P0-04/attempt-2/DISPOSITION.md.
