# Bàn giao tiếp tục B1 — trạng thái khi tạm dừng Plus

Ngày chụp: **09/11/2026**  
Mục đích: lưu trạng thái phần cứng để tiếp tục trong cùng project và các box chuyên môn. Đây là checkpoint điều phối, không phải duyệt thiết kế, phê duyệt hash, kết luận an toàn hay cấp lease.

## Trạng thái hiện tại

- Mục tiêu còn mở: hoàn tất bằng chứng trước schematic cho B1. Không được bắt đầu KiCad khi chưa đủ điều kiện và chưa được Founder duyệt đúng hash cấu hình.
- Cấu hình hiện hành: [MOBOT-V2-CONFIG-r11-HANDSET](../mission-control/hardware-config-mobot-v2-typec-r11-handset.json), SHA-256 `b4a7a5aedcd9012ca75df93a973f0517d86f28a13249632c1ea2a576f945e887`; trạng thái `proposed`, `approved_by`/`approved_sha256` chưa được gán, `gate_reviews` rỗng.
- Canonical queue tại `D:/StartupOS/docs/agents/tasks.json`: 54 task; `MM-HW-P0-09` đang `in_progress` lúc chụp. Validator `node ..\docs\agents\validate.mjs` vừa chạy exit 0, `errors: []`, `warnings: []`. Queue ở ngoài writable root hiện tại nên checkpoint này không tự sửa queue.
- Hai nhánh điện và cơ khí đã dừng giữa chừng do giới hạn lượt sử dụng; chưa có handoff mới từ lượt hiện tại. Chưa có thiết kế nào trong hai nhánh được tích hợp thành phương án cuối.
- Snapshot mà queue trỏ tới `D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/snapshot.json` không tồn tại tại thời điểm kiểm tra. Cần tạo snapshot đúng khi tiếp tục, sau khi xác định chính xác file sẽ review.
- Bốn cổng vẫn **OPEN**; B1 **NOT_READY**. Không có lease KiCad.

## Quyết định Founder đã chốt cho phân tích

Các câu trả lời này chỉ chốt fault model/envelope để phân tích và review; không duyệt hash, MPN, setpoint, chân MCU, CAD, sơ đồ hoặc chế tạo:

1. MCU chọn **W**: window watchdog với software-only feed. Ghi rõ giới hạn: không bảo đảm phát hiện CPU/task treo nếu peripheral vẫn tự phát heartbeat hợp lệ. Không dùng PWM/DMA/peripheral để feed.
2. Cơ khí: giữ **100 N**, proof tĩnh **200 N trên mỗi đường giữ độc lập**; chỉ nhả khi hệ thống đã physical-OFF và người dùng đã thả lực kéo; jam phải giữ khóa, không yêu cầu motor nhả khi đang chịu lực kéo.
3. Các phép đo được D10 cho phép sau PCB vẫn là verification items; không kéo chúng thành blocker trước schematic. D10 không miễn các cổng thiết kế D17.
4. BQ25186 chỉ là ứng viên chính để tiếp tục phân tích; không chọn suffix/MPN hoặc điện áp đặt. BQ25185 bị loại. Trần điện áp đầu pack vẫn **4,200 V tuyệt đối**.

Nguồn biên bản: [founder decisions Q1–Q8](mobot-v2-founder-decision-q1-q8.md), mục `b1-w-envelope`; receipt trong `D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/founder-input.json`.

## Bốn cổng cần đóng bằng chứng trước B1

| Cổng | Đã có | Còn thiếu để Box 08 có thể review PASS/FAIL |
|---|---|---|
| `MCU-RESET-VETO-RESOURCES` | W được Founder chọn; Box 08 đề xuất khảo sát TPS3430 preset `CWD=NC, SET0=SET1=0`, cửa sổ MIN/MAX nêu trong datasheet; feed 32–40 ms là counter-proposal, chưa chọn. | Topology fresh-arm/veto/default cụ thể; fault latch không tự cấp quyền lại sau watchdog recovery; retained HIGH/LOW, POR, mất bias; cận `fault → detect → isolate → OFF` bằng MAX/MIN đúng điều kiện; xác nhận software-only feed và giới hạn fault model. Không khôi phục nghĩa vụ challenge đã được Founder bỏ. |
| `D17-OFF-DESIGN` | Có các ứng viên/khối TPS25810, TPS22916, TMUX1511, TLV6710, TPS3808, SN74LVC1G74; có phép tính screening. | Sơ đồ chức năng/counter-proposal đủ cụ thể để tính tổng rò thuận/ngược và mixed-bias cho các rail/tải thực; cận sense/window; thời gian phát hiện và cách ly; bypass/fault đơn và lỗi chung; trạng thái giữ/nhả. Không dùng `tOFF` typ hay điều kiện thử tải 1 µF/100 Ω làm cận của toàn tuyến B01. |
| `D17-ACTUATOR-PRODUCT` | Envelope 100 N/200 N đã chốt. Tính tiết diện pawl có điều kiện: ứng suất von Mises 176,093 MPa, tỷ lệ so với 355 MPa là 2,016 với các giả định đã ghi. Box 01 xác nhận có thể chứng minh giải tích trước CAD. | Box 03 phải đề xuất hình học/dung sai và đường lực đến frame cho từng đường giữ độc lập; bearing/tear-out/anchorage; proof mỗi path 200 N; trình tự contact/OFF/unload; lỗi kẹt chung không nhả cả hai; torque, hành trình, dòng/energy pulse và default/fault. Stress check đơn lẻ không chứng minh cả cụm. |
| `D17-H3-CV-PROTECTION` | Trần 4,200 V; có screening BQ25186 và comparator/reference bổ sung; bất đẳng thức tổng quát cho peak đã ghi. | Cận threshold đầy đủ; normal charge max; fault peak trước current regulation; cutoff delay MAX, driver/2 barriers độc lập; Cmin/ESR/parasitic có nguồn; overshoot trong charge-source/rail recovery. 565 mA là giới hạn DC, không phải fault peak. Witness 4,148/4,167 V chỉ đúng dưới giả định chưa chứng minh. Chưa chọn setpoint hay MPN. |

Các cận số học và điều kiện nằm trong [readiness resolution](mobot-v2-b1-readiness-resolution.md); trạng thái hiện hành tóm tắt ở [closure matrix](mobot-v2-b1-closure-matrix.md). Hai mục trong [required decisions](mobot-v2-b1-required-decisions.md) đã được Founder trả lời trong chat và được ghi vào biên bản; đừng hỏi lại hai quyết định đó.

## Snapshot agent chats tại thời điểm dừng

| Box | Chat ID (host local) | Trạng thái mới nhất | Ghi chú tiếp tục |
|---|---|---|---|
| 01 Architecture | `01a1a853-d232-7460-8d00-3312362df34a` | Hoàn tất review advisory. | Đề nghị tiếp tục bằng chứng giải tích cassette trước CAD; chưa thấy bất khả thi. Nhắc lại hai đường giữ không dùng chung cam/shaft có thể nhả cùng lúc. |
| 02 Electronics & Firmware | `01a1a854-2163-70f2-a167-db281ef2ad08` | Lượt mới nhất `failed`: hit usage limit. Chỉ có commentary khởi đầu, chưa có handoff điện của lượt này. | Tiếp tục counter-proposal H3/OFF/W, chỉ đọc/advisory. Chat không được tự sửa cấu hình hoặc kết luận PASS. |
| 03 Hardware & Kit Design | `01a1a855-14f9-7d32-9d27-118e8a50627e` | Lượt mới nhất `failed`: hit usage limit. Chỉ có commentary khởi đầu phân tích lực/hành trình, chưa có handoff cơ khí của lượt này. | Tiếp tục captive cassette giải tích theo envelope đã chốt. Một kết quả cũ trong chat từng đề xuất solenoid/cable fixture; đó là proposal cũ, **không được coi là lựa chọn hiện hành hoặc áp dụng tự động**. |
| 08 QA & Safety Review | `01a1a858-a54b-7eb1-a7c8-bf039a639757` | Review độc lập hoàn tất, chat idle. | Chấp nhận cách ghi witness có điều kiện nhưng xác nhận cả bốn gate OPEN và B1 NOT_READY; khuyến nghị cụ thể nằm dưới đây. |

Kết luận Box 08 gần nhất: W có thể dùng preset watchdog làm counter-proposal nhưng phải chứng minh fault latch/fresh permission; actuator cần hai đường chịu tải độc lập và chứng minh anchorage/contact sequence; H3 cần cận peak và hai barrier ngắt hoàn chỉnh độc lập; OFF cần bảng theo trạng thái nguồn, rò, bypass, sense và cách ly. Box 01 không yêu cầu CAD trước khi có proof giải tích, nhưng hiện proof cơ khí chưa đủ.

## Tài liệu và hash khóa ngữ cảnh

| Tài liệu | SHA-256 |
|---|---|
| `docs/mission-control/hardware-config-mobot-v2-typec-r11-handset.json` | `B4A7A5AEDCD9012CA75DF93A973F0517D86F28A13249632C1EA2A576F945E887` |
| `docs/hardware/mobot-v2-b1-readiness-resolution.md` | `4A42E528310C51EBF8CDAC98C6C51F2559FC95A7BA14D3E3758DD1FD10EFD550` |
| `docs/hardware/mobot-v2-b1-closure-matrix.md` | `E21E8006A0F2FEA60934268C869777FF1CABF05ADA82B68461F305AB521A986D` |
| `docs/hardware/mobot-v2-b1-required-decisions.md` | `7D51447F8E9B03879CE73C825A10250B3C6EE38F5410C303D48BE9A83F690291` |
| `docs/hardware/mobot-v2-founder-decision-q1-q8.md` | `CF953434F2310C19C5805EB9B967A0E6CC622C4F355E63AD0813247199682965` |
| `docs/research/downloads/b1-readiness-2026-11-09/source-manifest.json` | `8643012DE3ED568B453CB319BBF1E514D9EC41BE4DCA37FF19ACFC5212B14649` |

Nguồn đã tải gồm TLV3201, TPS3890, REF33, TPS2553, SSAB Domex355MC và Pololu #2367. LTC6993 tải hai lần đều timeout; đã dừng theo ghi chú nguồn, không khẳng định có PDF/hash cục bộ. Xem manifest để biết URL, revision/hash và tình trạng từng nguồn.

## Việc làm tiếp khi quay lại tối nay

1. Mở lại Box 02 và Box 03 bằng ID ở trên; đọc handoff này trước. Yêu cầu mỗi box trả một kết quả gọn có: topology/candidate, cận min/max kèm datasheet revision/trang, fault table, phép tính tái lập được, phần còn TBD, và điều kiện nào thực sự không thể đóng trước B1. Không tự dispatch agent con.
2. Ghép hai kết quả vào một snapshot mới. Giữ các giả định đánh dấu là giả định; không biến current-limit DC thành peak, typical thành max, hoặc pawl section check thành proof cơ cấu.
3. Đối chiếu snapshot với Box 08; nếu đổi vật chất phương án/config thì tạo revision/hash mới, không sửa r11. Gửi review một lần trên đúng bytes và giữ 4 gate OPEN cho đến khi reviewer đủ chứng cứ.
4. Chỉ khi các gate thiết kế được review PASS mới chuẩn bị hồ sơ xin Founder duyệt đúng hash cấu hình. Preflight phải kiểm tra review provenance và các cổng. Chỉ sau Founder approve exact hash và preflight đạt mới có thể bàn giao xin lease schematic B1. Gói này **không cấp lease**.

### Prompt tiếp tục Box 02

> Tiếp tục phần advisory điện của `MM-HW-P0-09` theo checkpoint `docs/hardware/mobot-v2-b1-handoff-2026-11-09.md`. Dùng GPT-6.1 Sol, read-only; chỉ xử lý H3, OFF và MCU-W. Trả counter-proposal có topology chức năng, ứng viên cụ thể, min/max có nguồn và điều kiện datasheet, phép tính tái lập, lỗi đơn/lỗi chung, cùng phần TBD tối thiểu. Bảo toàn trần pack 4,200 V, W software-only feed, D10 và mọi gate. Không sửa config/queue, không gán PASS, không chọn setpoint/MPN/hash, không vẽ schematic hoặc cấp lease. Nếu chưa đủ evidence thì nêu điều kiện thiếu cụ thể; không lặp lại các witness đã có như thể chúng đóng gate.

### Prompt tiếp tục Box 03

> Tiếp tục phần advisory cơ khí của `MM-HW-P0-09` theo checkpoint `docs/hardware/mobot-v2-b1-handoff-2026-11-09.md`. Dùng GPT-6.1 Sol, read-only; đề xuất captive cassette giải tích theo envelope Founder đã chốt: giữ 100 N, proof tĩnh 200 N mỗi đường giữ độc lập, chỉ nhả sau physical-OFF khi tải kéo đã được người dùng gỡ, jam giữ khóa. Cần hình học/dung sai, force path tới frame, bearing/tear-out/anchorage, trình tự contact/OFF/unload, lỗi một điểm/common-cause, và torque/dòng/energy của actuator với nguồn. Nêu nguồn/revision/trang cho mọi dữ liệu hãng; đánh dấu allocations và TBD. Không tự chọn lại solenoid/fixture, không CAD, không mua hàng, không cấp lease và không tuyên bố PASS.

## Giới hạn hành động

Không Claude, không mua hàng/liên hệ vendor, không cấp nguồn/chạy motor/flash, không tạo KiCad/CAD hoặc PCB, không cấp lease, không sửa cấu hình/phê duyệt hash/MPN/setpoint. Mọi thông tin còn thiếu được ghi rõ; không đoán giá trị để làm xanh gate.
