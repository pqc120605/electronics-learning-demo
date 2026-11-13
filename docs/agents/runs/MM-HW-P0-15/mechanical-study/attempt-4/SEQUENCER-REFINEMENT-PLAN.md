# M5 — khép khóa hình học, không mở B1

11/11/2026. Thay cho thêm probe, cần mô hình reference mà chuyển động bị chính bề mặt khóa ngăn lại. Đây là kế hoạch nghiên cứu, chưa phải bằng chứng cơ cấu đã làm được.

## Căn cứ phạm vi đang đối chiếu

Proposal r1 đã được duyệt đúng hash `edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28`: hypothesis có endpoint locks; `unknowns_are_study_outputs` cho phép mô hình separation như biến; `allowed_if_separately_approved` cho reference CAD tham số. Các giá trị 12 mm/35×25 là reference inputs, không phải kích thước sản phẩm đã được adopt. Box01 đã đối chiếu đúng các điều khoản và xác nhận sensitivity12/16 cùng endpoint refinement nằm trong quyền nghiên cứu đã có (`BOX01-PARAMETRIC-SCOPE-AUDIT.md`). Lead tiếp nhận disposition này; không xin lại cùng quyền nghiên cứu. Không suy quyền PCB, FE hoặc adoption từ quyền đó.

## Một refinement tối thiểu cần kiểm

1. Hai carrier endpoint A/B có lugs/slot thực, mỗi endpoint khóa được cả hai thanh cấp quyền mở cửa.
2. Thanh gắn cứng với carriage, chỉ vượt được cả hai endpoint khi các slot thật thẳng hàng. Không dùng câu lệnh `if gap: unlock` thay cho collision.
3. Khi một carriage còn mở, thanh nằm trong slot giữ endpoint tương ứng ở park; chuyển động reconnect phải bị collision ngăn, không dùng `if PC: forbid reconnect` làm bằng chứng.
4. M5 cam/key đang có phải giữ ít nhất một carriage mở trong toàn miền reference USB còn có thể tiếp xúc. Dùng geometry/contact intervals, không đọc tên key để cấp quyền.
5. Giữ riêng phần chưa hiện thực: source cassette sequencing, V/probe/witness cycle completion, common-frame faults, broken key/collar, mọi cáp ngoài envelope. Không gọi một refinement hai chiều là toàn sequencer đã xong.

## Ca bắt buộc trong nghiên cứu này

- A chưa đủ gap, B đủ; rồi đổi A/B: cả hai carriage bị chặn trước khi corridor mở.
- Một carriage/barrier bỏ hoàn toàn: cái còn lại vẫn khóa bởi cả A/B trong cấu hình reference.
- Thanh đã mở qua hai slot: hạ một endpoint bị mặt slot/thanh chặn trước first-contact-make; rồi đổi endpoint.
- Endpoint slots thiếu/broken và một carriage bị giữ giả: giữ counterexample, không thêm luật logic che đi.
- Kiểm riêng PC/adapter presence: intact reference keys, một key mất, hai key mất; bằng chứng chỉ áp dụng đúng đoạn đường đã xét.
- Instance 12 mm là baseline; 16 mm chỉ là candidate sensitivity theo cận connector hiện có. Không sửa bytes các CAD/snapshot cũ.

## Ngân sách giao diện có điều kiện

`interface-capacity-proposal.json`: tối đa 21 đường header (16 vai trò, JOY_VCC, ≤4 return) và 25 đường USB-C/shell tách riêng =46 đường, còn4 trên connector50 contacts. Các pad/đường khác phải thật sự NC; chưa gán pin hoặc khẳng định clone đã có đúng wiring này.

## Exit và giới hạn

Xuất reference scene + collision-derived intervals + counterexamples và phần externally imposed. Không suy lực, độ bền, tuổi thọ hoặc cách ly thật từ rigid geometry. Phải qua review snapshot độc lập. r12/gates/approval/MPN/B1 giữ nguyên.

## Kết quả mô hình tham chiếu

Hai cửa có tay đòn gắn cứng. Mỗi đầu cầu mang hai lỗ cho hai thanh khóa. Cả hai đầu lên cao thì hai thanh mới đi qua lỗ. Khi một thanh còn xuyên qua hai đầu cầu, mặt lỗ chặn chuyển động hạ. Mỗi thân cửa và mỗi thân đầu cầu đã được kiểm là một khối liền trong CAD.

- Khoảng nâng dùng để đặt tâm lỗ là **16,2 mm**. Lỗ cao 1,2 mm và thanh dày 0,8 mm tạo khoảng thẳng hàng lý tưởng **16,0–16,4 mm**. Tính cận connector tại 16,0 mm cho khoảng cách **2,3418 mm**, theo envelope kim loại chung 40×25 mm, pivot giữa và độ nghiêng tương đối tối đa 5°. Đây là các giả thiết đầu vào của phép tính, còn cần kiểm với assembly thực.
- Kiểm 9 đường cắm thẳng reference ở bước 0,1 mm. Hai đầu park cho 65 mẫu có khả năng tiếp xúc. Bảy ca thiếu điều kiện park bị chặn, gồm bốn ca bỏ một cửa và một đầu cầu chưa park. Đối chứng bỏ hai thân đầu cầu cho lại 65 mẫu. Ca 12 mm dùng cùng thiết kế lỗ đặt cho 16,2 mm, nên chỉ cho thấy lỗ chưa thẳng trong mô hình này.
- Tám khoảng va chạm liên tục theo trục hạ cho A/B và từng cửa còn lại chặn tại khoảng **0,20 mm** dưới vị trí 16,2 mm, trong miền thanh đã xuyên qua cả hai đầu. Kiểm kernel CAD 16 tổ hợp xác nhận 16,01 mm không chồng khối, 15,99 mm có chồng khối khi cố hạ. Các mốc này là hình học danh nghĩa của bộ phận tham chiếu.
- Kiểm đóng cửa tại 65 độ sâu từ 0 đến 6,4 mm. Đầu cắm nguyên vẹn, mất từng key, hoặc mất hai key nhưng còn collar đều giữ ít nhất một thanh xuyên qua hai đầu trong các mẫu. Đối chứng đặt sẵn shell trần tại cổng chỉ giữ ở 45/65 mẫu. Đây là kiểm vật cản tại tư thế đã cho, không chứng minh đường đưa shell trần đến tư thế đó.
- Bản đầu vướng thân dẫn thanh vào mép lỗ. Di chuyển chân dẫn về đuôi thanh và đổi vị trí trụ đứng đã khắc phục ca park. Giữ kết quả vướng đầu tiên trong `endpoint-initial-failure.json`.

Hai ảnh `endpoint-closed.png` và `endpoint-parked.png` cho thấy cụm khóa riêng. Kích thước bao của cảnh park khoảng 40,8×42,5×40 mm, gồm đầu cắm tham chiếu. Cần dựng khung dẫn hướng, đường truyền thao tác tháo cassette và chu trình V/probe/witness trước khi kết luận về độ vừa của tay cầm hay khả năng chặn đường đi vòng. Ca cắm lệch, biến dạng, lỗi chung của khung và độ bền vẫn chưa được kiểm ở revision hình học này.
