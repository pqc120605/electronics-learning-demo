# Một quyết định về phạm vi phân tích mất bias — P0-13

Ngày 10/11/2026. Đây là đề nghị nghiên cứu có giới hạn, không phải cấu hình phần cứng hay phê duyệt CAD/FE. Các yêu cầu G-B, M-A,100/200N và100N mỗi nút giữ nguyên.

## Vấn đề cụ thể đã được Box08 kiểm độc lập

Trong topology guard-rút-trước của M-A-P2, sau physical-OFF và permission hợp lệ, guard rút để người dùng nhấn vào đường nhả. Nếu mất bias lúc follower cách throat0,01mm và nó đang đi0,10m/s, chỉ còn0,1ms tới throat. Phần cơ có hành trình và thời gian hồi hữu hạn; không được giả định guard xuất hiện tức thời để ngăn follower. Lực tay100N trên0,01mm có thể làm công1mJ; năng lượng này không nằm trong mô hình selector75,25µJ.

Box08 chấp nhận phản ví dụ riêng cho topology này, không kết luận mọi cơ cấu M-A đều bất khả thi. “Không vượt commit ở mọi thời điểm precommit” là cụ thể hóa trong phase contract; tuy nhiên nghĩa vụ Founder đã chốt “mất bias vẫn khóa” và Q2-OFF không cho phép tự chấp nhận nhả sau mất bias. Do đó ngoại lệ dưới đây cần Founder cho phép nghiên cứu rõ ràng.

## Hai lựa chọn

**A — Cho phép khảo sát ngoại lệ có cận (đề xuất để đánh giá, chưa chấp nhận sản phẩm).** Chỉ sau physical-OFF đã được chứng minh và permission nhả đã hợp lệ, cho phép phân tích cửa sổ thu hồi quyền mục tiêu0–1ms. Trong cửa sổ đó người dùng đang thao tác có thể vượt throat. Source và toàn I/O phải luôn OFF; không tạo permission mới; RUN latch-veto tới khi tái khóa thật và fresh-arm. Phải định lượng cả thời gian và hành trình follower; nếu không chứng minh được cận hoặc mất OFF proof, loại phương án. 1ms chỉ là yêu cầu khảo sát, chưa là mức an toàn đã đạt. Kết quả cần review và Founder chấp nhận ngoại lệ cuối riêng nếu muốn áp dụng.

**B — Giữ yêu cầu khóa sau mất bias như hiện hành.** Loại topology guard-rút-trước P2; tiếp tục tìm topology capture khác trong yêu cầu cũ. Không đánh dấu P2 đạt, không yêu cầu CAD/FE sửa một phản ví dụ topology bằng solver. Chưa có topology thay thế đã chứng minh hoặc thời hạn bảo đảm khép gate.

## Chưa bao gồm trong quyết định

Không duyệt MPN, hash r12/r13, nguồn/charger, giải pháp điện, mua hàng, prototype, GPIO, schematic, CAD/FE hay B1. H3/OFF/MCU tiếp tục được xử lý độc lập trong P0-13; không yêu cầu chọn lại các hướng Founder đã duyệt.

## Bằng chứng

- BOX03-P2-RESULT.md: bộ kích thước, mô hình năng lượng và phản ví dụ.
- BOX08-MECHANICAL-P2-REVIEW.md: phản ví dụ được xác nhận; góc3g phải được thêm, tổng quãng dừng0,684mm, không dùng0,566667mm làm MAX toàn khoảng3–5g. Phân biệt coupling-energy sau trễ với phần đã tính trong drive để tránh cộng trùng.
- mobot-v2-founder-decision-q1-q8.md: quyết định hướng P0-06 và direct-return; mobot-v2-founder-decision-q2-off.md: nghĩa vụ mất bias.

Lead xin A chỉ để phân tích phương án có cận, không biến 14 verification items thành nơi hoãn thiếu sót kiến trúc.
