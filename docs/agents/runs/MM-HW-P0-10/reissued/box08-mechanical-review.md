# Bản hiệu đính lead — box08-mechanical-review.md

C11 sửa5/5: danh sách gốc chỉ có4 advisory hashes. Hash ASCII hiện tại của4 đầu vào ở bảng dưới. Review cũ không bao hình học canonical lớn; không tái ký verdict cho r12.

Original SHA256 ASCII: `eb7a17b5831bac43bd86197c92ced8905f2c3464016f43f267ba4498535ad006`. Bản gốc được giữ nguyên. Các hash bên dưới là input thực tế hiện tại, không suy độc lập review mới.

- box03-cassette-advisory.md: `1c0d96f92510a96d0b812b5764c13fea15159545feb7af9ebed3b75b24e31097`
- box03-cassette-supplement.md: `850e9548a7c4994a8fadfd764f7fe4f264d43af571e7d773c35943de2573adf7`
- box01-cassette-review.md: `0f35ced19693b2dfa7ff50a56dba9ae84e7aa53d161fdd842c926aaeebc9e8a9`
- box09-actuator-shortlist.md: `b6d352dcf5d38794c808eeb0ea9415fcead684320b80fb1a1ebfee8e1129aebd`
- box03-direct-return-geometry.md: `47d7b22b2fae085b0a970e2b7fb9a9f895ff3860163512eb6a4da97d0d604867`

## Nội dung lịch sử (mọi nhãn chấp nhận trong trích dẫn đều hết hiệu lực cho r12)

**Verdict: `insufficient_evidence` để đóng phần cơ/actuator trước B1; nhận bốn tài liệu làm advisory.** Supplement đã sửa đúng hai điểm quan trọng: motor hộp số chưa có fail-return độc lập; qualification cơ cấu không tự thuộc D10.

Baseline **5/5 hash khớp đầu/cuối**; bốn advisory không đổi trong review.

| Nội dung | Disposition |
|---|---|
| **K/prying/neo** | Số học khớp: pawl **57,40/40,18 MPa**, von Mises **90,21 MPa**; võng rail lý tưởng **0,00480 mm**; bulông **90,14 MPa**. Nhưng `K=3`, prying=2 và tải screening từng neo chưa được chứng minh bao hình học thực. Cần khép mô hình lực tới **điểm bắt frame cuối**, không dừng proof tại rail. |
| **Contact/overlap** | `overlap_min=2 mm`, `g_min=0,30 mm` đúng theo allocation. Áp suất trung bình 25 MPa không bao tiếp xúc mép. Cần mô hình tiếp xúc với bán kính/độ nghiêng và dung sai thực. |
| **Dogleg** | Có cơ sở buộc đảo chuyển động và rời mặt tỳ; không cần tự thêm cảm biến lực. Nhưng phải chứng minh không thoát chéo, không phá tab/thành rãnh bằng nút nhả. `x_contact_change,min > x_locked,max` là hợp đồng đúng; lost-motion/shutter đáp ứng nó vẫn chưa xác định. |
| **Feedback/lỗi chung** | Hai xác nhận vị trí thật tham gia veto là phù hợp. Bit tổng hợp chỉ dùng quan sát. Hai motor hoặc hai sensor không chứng minh độc lập nếu còn chung nguồn cấp quyền, datum yếu hoặc đường dị vật. |
| **Pulse/fail-return** | **16 ms** là nghiệm lý tưởng từ các allocation lực/khối lượng, không phải bound hồi toàn cụm. **30 ms, 150 mA, 450 ms và 150 ms mở cửa đều là witness/allocation**, không phải nghĩa vụ sản phẩm đã duyệt. Không loại ứng viên chỉ vì vượt các số này. |

Căn cứ chính: [supplement:19](D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/box03-cassette-supplement.md:19), [contact:52](D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/box03-cassette-supplement.md:52), [fail-return:84](D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/box03-cassette-supplement.md:84).

**Con đường hội tụ ít vòng nhất:** giữ hai đường giữ kim loại độc lập và thao tác tháo tải thủ công; ưu tiên phân tích lại **cửa cấp quyền nhỏ, tự hồi, tách khỏi đường chịu 200 N**, thay vì tiếp tục motor hộp số cộng clutch.

Đây là proposal để phân tích, chưa đổi thiết kế. Đầu ra tiếp theo cần là một hợp đồng chung:

1. Khép đường lực, contact và dogleg; giảm lực/hành trình cửa bằng hình học nếu có căn cứ.
2. So sánh **cấp quyền trực tiếp có lò xo hồi** với **motor–clutch** theo cùng lực/hành trình, lỗi kẹt và năng lượng toàn nhánh.
3. Box02 dùng hợp đồng đó để tính nguồn, pulse/default, flyback và lỗi hai nhánh cùng hoạt động; không giữ ngân sách motor cũ khi thêm clutch.

Takaha đáng giữ làm ứng viên khảo sát trực tiếp 5 V, nhưng catalogue chưa bảo đảm lực ở 3,2 mm qua mọi điều kiện và có chênh lệch dòng/điện trở. Ogura công bố thời gian MAX trong điều kiện thử cụ thể, nhưng chưa chứng minh đạt ngưỡng drag cần cho hồi cửa. Vì vậy **chưa ứng viên nào đủ chọn vào BOM**. [Takaha](https://www.takaha.co.jp/product/ss/pdf/SSBH-0830.pdf), [Ogura](https://ogura-clutch.com/files/pdf/MICT.pdf)

**Chưa cần Founder quyết định để tiếp tục phân tích trên giấy.** Khi có phương án đủ cụ thể, gom một lần các lựa chọn: vật liệu/MPN, delta nguồn thực và UX “giữ hai nút rồi đẩy vào”. Nếu chọn solenoid fallback, phải trình Founder theo [quyết định hiện hành:126](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-founder-decision-q1-q8.md:126); không tự chuyển.

Fit clone giữ theo D10. Proof 200 N, mòn, lực thao tác và mất bias là qualification cơ cấu riêng trước sử dụng chuyển mode; **không yêu cầu đo chúng trước B1 thay cho phân tích thiết kế**.

Hash advisory đã review:

```text
box03-cassette-advisory.md
1c0d96f92510a96d0b812b5764c13fea15159545feb7af9ebed3b75b24e31097
box03-cassette-supplement.md
850e9548a7c4994a8fadfd764f7fe4f264d43af571e7d773c35943de2573adf7
box01-cassette-review.md
0f35ced19693b2dfa7ff50a56dba9ae84e7aa53d161fdd842c926aaeebc9e8a9
box09-actuator-shortlist.md
b6d352dcf5d38794c808eeb0ea9415fcead684320b80fb1a1ebfee8e1129aebd
```

Không ký PASS bốn gate hoặc approved_hash trong review này.
