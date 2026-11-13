# P0-15 — báo cáo tiến độ và điểm dừng có căn cứ

Ngày 10/11/2026. **Đã hoàn tất đợt nghiên cứu và review; P0-15 chưa hoàn tất thiết kế, B1 chưa sẵn sàng.** Giữ nguyên task P0-15 để tiếp tục, không tạo task ID mới hoặc ghi các lỗi thiết kế thành đã đóng.

Hồ sơ chính: `docs/hardware/mobot-v2-p0-15-aa-design-closure.md`, SHA256 `695887156db5a053a769455cc35c600e13b813b61d675d662f89254deaf26934`.

## Những việc thực sự đã làm

- Box 02 khảo sát hai hướng bảo vệ và một refinement cục bộ. Có detector ABLIC ngưỡng 1,1 V với số liệu hãng; đã loại topology Nch/pull-up hiện tại vì hở OUT có thể giữ ON và hồi áp có thể tự đóng lại. Không lấy dòng0,9µA ở một điều kiện đo làm dòng OFF của cả mạch.
- Box 03 phát triển M4, sau đó đọc nguồn USB-IF mà lead tải được. Đã có bất đẳng thức chỉ ra vì sao hai paddle hiện tại chưa có căn cứ cho cáp generic: biên kim loại ngoài miệng chỉ0,11mm **nếu** Dmax≤6,40mm; allowance võng0,15mm đã lớn hơn biên đó. Không gọi điều kiện Dmax là số đo clone.
- Có nguồn Samtec về thử2.500cycle và bản vẽ mating; đã phân biệt đúng family/variant, nominal wipe và MAX conductive overlap còn thiếu. Không nhận connector làm MPN sản phẩm.
- Chốt ma trận19+Nextra conductor nếu nối toàn bộ role qua mỗi breakpoint; không nhầm16GPIO với16contact hoặc4nodepin với4dây.
- Box 01 rà các yêu cầu: cửa sổ cell1,05–1,15V, zero-current, thời gian lưu pin và lifetime500cycle chưa phải các hard gate Founder đã chốt. Không hỏi lại hướng B hoặc dùng câu hỏi vận hành để né lỗi điện.
- Lead ghim9nguồn mới, kiểm hash/kích thước, đọc bảng/ảnh nguồn trọng yếu và tái lập phép tính. Một bản vẽ Amphenol bị403 được ghi NOT_RUN, không giả đã tải.
- Sàng lọc hai charger ngoài và bóc rõ giá combo800.000đ hết hàng, giácharger rời chưa có, cell/chargerpair chưa nhận; không dùng BOM cũ CP2102/Li-ion làm giá sản phẩm hiện tại.

## Review độc lập và disposition

Box 08 turn `01a1c531-a368-7a13-9369-9a832f96cf22`, raw `BOX08-REVIEW.md`: pass ở phạm vi nghiên cứu/disposition; **insufficient_evidence** cho adoption/config/B1. Không có claim mới phải sửa để nhận hồ sơ nghiên cứu. Reviewer kiểm13/13hash packet,37/37tệp P0-14, r12 và9nguồn pin; chưa kiểm trực quan độc lập đầy đủ mọi hình nguồn, chưa có CAD/FE hoặc phần cứng.

| Finding còn mở | Disposition của lead | Chủ xử lý / mốc |
|---|---|---|
| Fail-ON, autoretry, latch mất trạng thái | ACCEPT; topology hiện tại REJECT cho adoption. Tháo pin sau trip không sửa được lỗi | Box 02; trước nhận topology/schematic |
| Dòng sau trip, reverse từng cell, sense/fuse bypass | ACCEPT; cần cận toàn chuỗi theo phương án thật, không tự áp zero-current vô hạn hoặc đẩy sang D10 | Box 02; trước nhận nguồn |
| Partial-plug, hard-stop B01, cáp generic vượt liên động | ACCEPT; không nhận M3/M4 hiện tại. Chuẩn bị nghiên cứu keyed shutters/collar riêng | Box 03 và lead; study sau quyền riêng, adoption sau review khác |
| MAX overlap và dữ liệu connector theo đúng variant | ACCEPT; giữ biến chưa biết trong study, không lấy nominal/MIN làm MAX | Box 03; trước nhận gap/connector |
| CAD-study cần hệ tọa độ, miền lệch/góc, contact và coverage | ACCEPT; phải ghi trước sweep, phân biệt lấy mẫu với bao phủ liên tục, ngoài miền ghi unmodelled | Người thực hiện study và lead; sau approval, trước chạy sweep |
| Fit và ngân sách bộ | ACCEPT; total vẫn TBD, tính cả charger/phụ kiện PROGRAM/replacement/robot | Lead và kit; trước khóa config/BOM |

Không finding nào được ghi đã giải quyết chỉ vì được đưa vào bảng.

## Bước cụ thể cần quyền riêng

Đã chuẩn bị `mechanical-study-proposal.json`, ID **MOBOT-AA-M5-CAD-STUDY-r1**, SHA256:

`edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28`

Box 08 xác nhận đủ cụ thể để trình Founder xin quyền **nghiên cứu CAD tham chiếu và quét chuyển động**, tìm va chạm/đường đi vòng hoặc no-go. Giả thuyết: hai cửa đóng mặc định, hai khóa dẫn hướng và collar captive; cáp thường không được tới contact khi không có khóa. Profiles/keying là đầu ra khám phá, chưa là cơ cấu đạt.

Đây không phải duyệt phụ kiện thành sản phẩm, không FE/strength100/200N, không in/chế tạo, không B1/PCB/MPN/hash cấu hình tay cầm. Không có CAD được tạo trong đợt này. Theo AGENTS.md, trước CAD phải có duyệt đúng cấu hình/phạm vi/hash; quyền study và queue/preflight phải được ghi riêng trước thực thi. Các lỗi điện vẫn cần giải độc lập, không phải Founder có thể bỏ qua bằng việc duyệt study.

P0-15 chờ quyết định cho bước CAD nghiên cứu này; không tự bật builder hoặc gọi Claude. Mọi nhánh tư vấn của đợt hiện tại đã trả kết quả, không còn agent chạy ngầm. Không yêu cầu Founder chọn zero-current/thời gian lưu pin hoặc chọn B lần nữa.

## Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| `python -X utf8 docs/agents/runs/MM-HW-P0-15/checks.py` | exit0:37tệp P0-14 vàr12 không đổi;9nguồn mới đúng hash/bytes; số học điều kiện tái lập |
| Kiểm độc lập manifest packet |13/13hash khớp trước và trong review |
| `node D:/StartupOS/docs/agents/validate.mjs` | exit0;61task,143capability,errors=[],warnings=[]; kết quả cuối xem `final-checks.json` |
| Product source/typecheck/e2e | NOT_RUN: không sửa ứng dụng |
| CAD/FE/sweep/thiết bị/nhiệt/RF/force/endurance | NOT_RUN: chưa thực hiện hoặc chưa được phép |

Các phép tính chỉ xác nhận đại số và giả định đã nêu, không chứng minh thiết kế hoặc hardware đạt. r12 giữ nguyên `proposed`, approved_by=null, approved_sha256=null; bốn cổng schematic OPEN,14verificationitems không đổi. Không r13 hoặc leaseB1. Queue cuối xem `queue-final-result.json`.
