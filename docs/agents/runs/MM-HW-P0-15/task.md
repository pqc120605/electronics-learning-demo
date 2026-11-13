# MM-HW-P0-15 — tiếp tục thiết kế nghiên cứu AA/manual

Ngày 10/11/2026. Founder yêu cầu “chạy tiếp đi” sau P0-14. Đây là tiếp tục nghiên cứu và đề xuất có cận cho hướng B, không phê duyệt cấu hình hoặc build. P0-14 và r12 giữ nguyên bytes, mọi cổng hiện hành vẫn OPEN.

Chủ nhiệm và người ghi duy nhất: Codex lead. Box 02 phụ trách bảo vệ nguồn; Box 03 phụ trách liên động, conductor matrix và connector/fit. Hai nhánh đọc và trả advisory, không ghi file, không gọi thêm agent. Sau tích hợp, Box 08 review độc lập đúng hash.

## Phạm vi ghi của lead

- `docs/agents/runs/MM-HW-P0-15/**`
- `docs/hardware/mobot-v2-p0-15-aa-design-closure.md`
- `docs/research/downloads/p0-15/**`
- Quản trị đúng task trong queue chuẩn qua thao tác lead riêng.

Không source/app, `.env`, cấu hình phần cứng, approval/gate status, GPIO assignment, schematic, CAD/FE, KiCad, firmware, mua hàng, liên hệ vendor, flash hoặc cấp điện. Không Claude.

## Mục tiêu đợt này

1. Thay cách tiếp cận của hai candidate P0-14 còn lỗi, không lặp lại rồi gọi là đã đóng. Box 02 xét tối đa hai hướng thực sự khác: giám sát riêng từng cell tiêu thụ thấp, hoặc nguồn giám sát cắt hoàn toàn với startup phần cứng hữu hạn. Giữ ba AA NiMH/sạc ngoài, không thêm GPIO, không đảo lại Li-ion. Cửa sổ 1,05–1,15 V/cell là allocation nghiên cứu chưa được Founder chốt, có thể phản biện kèm đánh đổi chứ không tự thành cổng mới. Cần nguồn hãng, sai số, dòng sau trip, startup/default và fault table. Giá trị chưa bảo đảm ghi TBD, không dùng TYP như MAX.
2. Box 03 khép trình tự M3 ở mức text/parameter analysis được phép: port contact envelope, follower/dock/coupling/frame, partial plug, lỗi đơn/lỗi chung, hai gap và mọi conductor. Không tạo CAD/FE. Lấy connector có tài liệu/cycle phù hợp làm candidate nghiên cứu, chưa duyệt MPN; DF11 30 cycle không được promote. Nếu cần thay trải nghiệm hoặc envelope sản phẩm, chuẩn bị delta cụ thể cho Founder.
3. Tách nghĩa vụ bắt buộc trước schematic khỏi qualification sau mẫu. Không chuyển lỗi thiết kế sang D10; cũng không yêu cầu đo lại mọi điều D10 đã cho hoãn chỉ để nghiên cứu.
4. Tính lại budget/fit với các phần thay đổi thật; đủ dữ liệu mới kết luận toàn bộ robot+tay cầm+charger dưới1triệu. Giá thiếu giữ TBD, không tạo range giả.

## Bằng chứng và tiêu chí kết thúc

Hồ sơ một bộ số liệu/role không mâu thuẫn, source metadata/hash, phép tính tái lập, raw kết quả chuyên môn, bảng disposition và review độc lập. Nếu hai hướng mới đều có phản ví dụ chưa giải quyết, dừng lặp tìm kiếm và ghi tradeoff/đầu vào thật cần thay đổi; không tự PASS cổng hoặc xin duyệt hash của thiết kế thiếu. Nghiên cứu chưa phải giấy phép B1.

Các thiếu sót trong readiness cũ là **đầu ra nghiên cứu cần tạo**, không phải yêu cầu Founder cung cấp mẫu trước khi đọc nguồn. Đầu vào hiện có gồm lựa chọn B, P0-14 proposal, hai advisory, review Box 08 và nguồn đã ghim. Không cần Founder chọn B lần nữa.
