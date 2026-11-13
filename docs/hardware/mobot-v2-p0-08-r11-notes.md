# r11 · đề xuất, chưa duyệt

Kế thừa r10 nguyên byte. Không đổi id/status/stage/milestone/pass_fail của bảy cổng hoặc 14 verification_items; không phê duyệt MPN/GPIO/setpoint. Nguồn hãng và hash ở source-manifest.json của docs/research/downloads/p0-08-2026-11-09/.

Trần pack4,200V là quyết định Founder, không là dung sai hãng. 68 điểm 3,50…4,17V, bước10mV, nằm trong cv_screening.arithmetic_candidates_only; tất cả chỉ còn khả dĩ theo số học +/-0,5%, chưa đủ full application envelope. 4,18V đã thành4,2009V; 4,20V thành4,221V, nên bị loại. Chưa chọn setpoint.

Nhu cầu baseline8…14 chân mới; chắc chắn11, có điều kiện13. E1–E4=4 là giả định. Dừng gán chân. Phương án thay đổi được lập riêng, chưa được chọn.

blocking_unknowns của proposal và registry cùng liệt kê bốn cổng schematic OPEN; phép đo D10 vẫn ở verification_items. Chỉ sau review độc lập từng cổng, snapshot trạng thái/blocker cuối được review gắn lại đúng hash rồi mới xin Founder duyệt hash một lần. Gate PASS không được tự gắn; đổi bytes đòi hash mới. review_sha256 ghim ở registry, không ở proposal.

## Bảng chân trị RELEASE_ALLOWED

S=source OFF thực, I=I/O cách ly thực, R=rail qualified, B=bias hợp lệ, F=FAULT. Unknown/sense lỗi không được là proof TRUE; nó tạo FAULT hoặc proof FALSE. Chỉ một hàng có quyền nhả. Actual release còn cần RELEASE_REQUEST. Đây là yêu cầu logic, chưa là mạch đã chứng minh.

|S|I|R|B|F|RELEASE_ALLOWED|
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 0 |
| 0 | 0 | 0 | 0 | 1 | 0 |
| 0 | 0 | 0 | 1 | 0 | 0 |
| 0 | 0 | 0 | 1 | 1 | 0 |
| 0 | 0 | 1 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 | 1 | 0 |
| 0 | 0 | 1 | 1 | 0 | 0 |
| 0 | 0 | 1 | 1 | 1 | 0 |
| 0 | 1 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 1 | 0 | 0 |
| 0 | 1 | 0 | 1 | 1 | 0 |
| 0 | 1 | 1 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 | 1 | 0 |
| 0 | 1 | 1 | 1 | 0 | 0 |
| 0 | 1 | 1 | 1 | 1 | 0 |
| 1 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 1 | 0 |
| 1 | 0 | 0 | 1 | 0 | 0 |
| 1 | 0 | 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 0 | 1 | 0 |
| 1 | 0 | 1 | 1 | 0 | 0 |
| 1 | 0 | 1 | 1 | 1 | 0 |
| 1 | 1 | 0 | 0 | 0 | 0 |
| 1 | 1 | 0 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 | 0 | 0 |
| 1 | 1 | 0 | 1 | 1 | 0 |
| 1 | 1 | 1 | 0 | 0 | 0 |
| 1 | 1 | 1 | 0 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 1 | 1 | 0 |
