Source: 01a1a858-a54b-7eb1-a7c8-bf039a639757
Turn: 01a1c40e-c378-77d2-b2f9-b146dba35de0
Verbatim independent proposal review.

**Verdict: `changes_requested` cho topology proposal; W/OFF/H3 vẫn `insufficient_evidence` để đóng gate.** Có tiến triển cụ thể, nhưng chưa đủ coi các allocation là khả năng phần cứng đã đạt.

Hash đầu/cuối:
`bea3dfb28e5a603d9bb7982a3e07f6faf05507639876e7bc4344ba7556797f4a`.

**Finding thiết kế cần sửa:**

- **[P1] Độc lập A/B chưa được giải quyết tại crossing chung.** [Dòng 40](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/BOX02-RESULT.md:40) đề xuất một ISO6740F mang bốn control tới safety. Receiver/latch riêng phía sau không loại fault chung khiến nhiều output của cùng IC tạo chuỗi yêu cầu sai. Cần chọn rõ: crossing tách theo kênh, hoặc chứng minh các output chung chỉ là request và không thể tạo cả hai permission qua một lỗi. Phải bao cả nguồn/EN chung; không chỉ “nhân receiver”.
- **[P2] Qualifier 180–420 ms chưa xác định cách reset liên tục.** Cận delay đúng theo datasheet, nhưng [dòng 65–74](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/BOX02-RESULT.md:65) chưa chỉ rõ tín hiệu nào giữ/reset qualifier khi request HIGH, OFF proof mất hoặc bias không hợp lệ. Bổ sung truth table/reset path để 180 ms thực sự là thời gian điều kiện **liên tục**, không phải chỉ chờ từ POR.

**Các kết quả được xác nhận:**

- ISO674xF default LOW và các cận 18 ns/34,4 ns/0,3 µs đúng điều kiện nêu. Mốc 0,3 µs bắt đầu **dưới 1,2 V**, không bao toàn brownout. Phải đếm từng IC/phía nguồn; **aux 20 mA chưa được chứng minh**. [TI ISO674x Rev G](https://www.ti.com/lit/ds/symlink/iso6741.pdf)
- TPS3808 **180–420 ms** có nguồn. Đổi MAX allocation 250→420 ms có thể đưa vào proposal; worksheet OFF **3,143167 s**, còn **0,856833 s** khớp. Chưa chứng minh assertion/isolation toàn tuyến. [TPS3808 Rev N](https://www.ti.com/lit/ds/symlink/tps3808.pdf)
- TPS3760 không phù hợp cửa sổ đang xét; delay tại 20% overdrive không giải được trần 4,200 V. LTC4079 giảm dòng và chưa có profile/error proof, chưa phải phương án thay đã khả thi.
- Sensitivity actuator đúng: **1,1515–1,5556 A**, **24,5 J**, pack **3,2101 A**. Đây là phản ví dụ có điều kiện, chưa chứng minh sản phẩm fail; cũng chưa thể gọi budget đạt.

**Đường khép hữu hạn trước schematic:**

1. Khóa fault table và topology crossing/qualifier cụ thể; tính toàn bộ nguồn A/B và các mode.
2. Với OFF/W, chứng minh các khâu ảnh hưởng trực tiếp deadline/default bằng cận áp dụng hoặc phương án fail-safe không cần khâu đó phản ứng trong deadline. Qualification sau này xác nhận thiết kế; không thay phần proof còn thiếu.
3. Với H3, giữ một nhánh năng lượng cụ thể: R sau tụ nguồn, hai cutoff hoàn chỉnh, reverse-block tải; tính cả một R short, một cutoff short và **Cmin sau lỗi tụ**. Chốt nguồn/current/cutoff bounds trước khi dùng 55,922 µs.
4. Yêu cầu dữ liệu một vòng cho đúng các khâu thiếu; nếu chỉ có characterization, ghi đúng mức chứng cứ và trình disposition hữu hạn thay vì đổi tên IC tiếp.

Gate hiện hành **có thể nhận allocation bảo thủ làm yêu cầu thiết kế**, nhưng chưa cho phép ký PASS chỉ bằng allocation rồi chuyển khả năng đáp ứng sang 14 verification items. Các MAX thực sự cần trước schematic là cận quyết định **không nhả/cấp quyền sai, isolation deadline và peak pack ≤4,200 V**. Không đòi bảo đảm vô hạn: phải nêu miền nhiệt/nguồn, tuổi thọ thiết kế và fault envelope hữu hạn.

**Chưa có lựa chọn charger đủ chứng cứ để trình Founder duyệt.** Nếu sensitivity nguồn được xác nhận, tradeoff nhỏ nhất nên tính trước là **cấp actuator tuần tự**, chứng minh không thể cấp chồng khi lỗi và cơ cấu vẫn thực hiện M-A; chỉ trình Founder nếu nó thay cửa sổ/thao tác đã chọn. Không tự giảm bảo vệ, cắt E-channel hoặc nới trần pack.
