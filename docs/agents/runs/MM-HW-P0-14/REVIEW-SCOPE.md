# P0-14 — phạm vi yêu cầu Box08 review

Chủ hồ sơ Codex lead; reviewer độc lập read-only ở Box08. Không tự đổi queue/cấu hình/cổng, không gọi Claude hoặc agent con. Snapshot chính thức sẽ ghi ở review-request.json sau tích hợp advisory cuối; tài liệu này xác định acceptance, không tự nói review đã chạy.

## Câu hỏi cần trả lời

1. Biên nhận Founder có chỉ cho nghiên cứu B, giữ r12/hash/cổng/B1 chưa duyệt đúng không? Có thay đổi sản phẩm nào bị nhận ngầm không?
2. EXT5V cùng cầu tách mọi conductor có nhất quán với full I/O isolation và D10 không? Có bypass, boot deadlock, nhầm grant với bootpower hoặc giả định RF bị cách ly không?
3. Topology bảo vệ từng NiMH cell có nguồn/cận đủ ở mức thiết kế hay chỉ là candidate? Tap-open/reversed-cell/fuse-open/short/default nào còn phản ví dụ? Không đòi guaranteed cellOCVmax khi có protected input domain hợp lệ, nhưng không bỏ rating/fault bound thật.
4. M3 có trình tự hai chiều đầy đủ và lực100N có đường frame riêng không? Những gap/connector/coupling/partialplug/common-fault nào cần đóng trước schematic và những phép qualification nào hợp lý sau mẫu? Không nhận lời mô tả là geometry/strength proof.
5. Source pin đúng loại/điều kiện không; cụ thể FDK disclaimer, holder không sẵn celltap, DF11 chỉ30cycles, module output/efficiency chưa phải MAX toàn miền.
6. BOM toàn bộ robot+tay cầm có bị báo đạt giả hoặc bỏ charger không? Fit/usability/cycle mục tiêu còn gì cần quyết định thật?
7. Cho verdict riêng: chất lượng hồ sơ nghiên cứu; khả năng xin nhận scope/config mới; thiết kế gate/B1. Mục nào chưa có chứng cứ ghi insufficient_evidence; không tự PASS live gate hoặc duyệtMPN/hash.

## Kết quả mong muốn

Ghi hash proposal thực đọc; bảng finding gồm severity, vị trí, phản ví dụ, khắc phục tối thiểu, stage cần hoàn tất, owner và phần còn chưa kiểm. Ưu tiên giải pháp hữu hạn trên hướng B đã được giao; không yêu cầu Founder chọn B lần nữa hoặc phục hồi toàn kiến trúc Li-ion cũ. Không tự mở rộng D10. Phân biệt review tài liệu, đại số điều kiện, thiết kế có cận và đo thật.
