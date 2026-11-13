# M5 — tiếp tục nghiên cứu tiếp xúc cam và đường cắm

Ngày 10/11/2026 · MM-HW-P0-15 · Lead là người ghi duy nhất. Đây là kết quả **nghiên cứu hình học tham chiếu**, chưa adopt M5 hoặc chứng minh B1.

## Quyền và phạm vi

Giữ proposal `MOBOT-AA-M5-CAD-STUDY-r1` đã duyệt, SHA-256 `edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28`. Profile/cam/rib/collar/probe/relief mới là đầu ra nghiên cứu trong phạm vi đó; không thay bytes proposal/r12, không duyệt vật liệu/MPN/schematic/PCB. Bản nghiên cứu cũ giữ nguyên; tệp mới chỉ trong `attempt-2/`.

## Đã hiện thực hóa gì

- Hai cam thực bằng khối lăng trụ có mặt dốc, mỗi cam nối với cửa bằng gân chữ L thành **một solid CAD**; frame khoét relief theo swept envelope tham chiếu. Mỗi carriage chỉ được trượt lý tưởng 0…12 mm. Chưa có bearing/return spring/pawl thực.
- Dịch chuyển tìm từ các miền va chạm SAT của chính hình khóa theo tọa độ host. Không dùng identity `key_a → doorA`, không dùng luật vô hướng `d+lead` để điều khiển cửa. Roll180° tự đổi cam chịu tác động.
- Solver giữ thành phần miền tự do kề vị trí trước, dùng return bias lý tưởng. Sáu regression kiểm interval rời/chồng/lồng/tiếp xúc và nhánh khi rút; interval chỉ tiếp xúc không bị nhập thành vùng cấm để xóa biên khả thi.
- Đường cắm bắt đầu từ d=−20 mm, dừng tại va chạm frame/cửa/gân, không coi một pose tĩnh phía sau cửa đóng là đi tới được. Input chuyển theo Y, các góc giữ cố định ở từng đường thử.
- Collar tham chiếu kéo đến17,5 mm sau tip; hai đầu dò thử tại Y=−7,5/−8,6 mm nằm trong collar kiểm soát. Hai vị trí cũ−1/−2 mm vẫn được kiểm làm đối chứng, không suy vật liệu từ USB outer box.

## Lỗi tìm được và sửa

Bước0,1 mm ban đầu bỏ lọt gân thẳng đi xuyên đường khóa. Bước0,05/0,01 mm chặn tại d≈−7,9 mm và phép kiểm nội suy cũng thấy giao thoa. Giữ kết quả lỗi tại `*-initial-rib.json`; **không sử dụng kết luận đi hết hành trình của bản đó**. Thay gân bằng nhánh đứng X=8…8,35 và nhánh ngang thấp Z=0…0,5 mm, cộng relief tương ứng rồi chạy lại cả bộ. Khoảng0,1 mm tới khóa chỉ là nominal reference, chưa ngân sách dung sai hay bền. `inserted.png` là ảnh trước sửa; ảnh kết quả sau sửa là `inserted-final.png`.

Một assertion đối chứng đầu tiên kiểm riêng pose cuối đã sai vì tip nằm sau cửa, nên pose cuối không giao cửa đóng. Sửa phép kiểm thành cả đường cắm; không xóa tình huống bypass. Báo cáo cuối dựa trên lần chạy đã sửa, không báo lần assertion đỏ là PASS.

## Kết quả thực thi cuối

| Phép kiểm | Kết quả và giới hạn |
|---|---|
|102 đường:17 pose không gian ×2 roll ×3 lead|6/6 nominal đi hết tới d6,4 mm;96 đường góc/offset bị frame chặn trước tiếp xúc. Không hỗ trợ kết luận cắm lệch được. |
|6 đường rút nominal|Quay về carriage0/0, không stop trong mô hình lý tưởng. |
|390 mẫu potential-contact trên đường đi tới được|Không mẫu nào mất giao collar với từng probe mới. Potential-contact là vùng bảo thủ, không phải chân USB thật. |
|Thiếu từng khóa ×roll0/180|4 đường bị cửa còn đóng chặn,0 mẫu potential-contact; mapping tác động đổi đúng theo host. |
|Bước0,1/0,05/0,01 mm, roll0/180 +1 góc lệch|9 đường sensitivity,306.920 phép kiểm cặp trên đoạn nội suy;0 đoạn interpenetration input–cam/door/rib/bridge. Góc lệch chặn tại cùng biên frame≈−13,761466 mm. |
|Carriage/frame|Không có miền interpenetration trong stroke0…12 ở reference relief; không chứng minh guide/bearing thật. |
|Frame native so với partition|81 cell rời; thể tích7.216,6765 mm³;81 containment check khớp, frame native một solid. |
|SAT so với OCCT|216 so sánh cặp ở5pose chọn, khớp positive-volume classification;7 cặp touching có native distance trong2×10⁻⁶ mm. Chỉ là các ca chọn. |
|Một carriage kẹt đóng|Cả2ca chặn trước tiếp xúc. |
|Một carriage kẹt mở|Đầu có đủ hai khóa vẫn đi được; đây không phải bằng chứng chịu một lỗi với mọi vật thể. |
|Hai cửa cùng kẹt mở|Vỏ trần synthetic có đường bypass trong reference tunnel; **lỗi chung vẫn mở**. |
|Tách contributor đầu dò tại d0/4/6,4|Probe mới giao chính collar, crossbar không giao; bỏ collar sẽ mất coverage dù giữ crossbar. Probe cũ có lúc chỉ giao shell outer, không bảo đảm vật liệu thật. |

Các đoạn nội suy chỉ xét fixed orientation và các chuyển động tuyến tính đã nêu, không chứng minh động lực học/pose liên tục bất kỳ. Tangency là touching, không gộp vào “clearance dương”. Không có strength/force/friction validation.

## Bảo vệ nguồn song song

Box02 trả advisory tại `BOX02-ADVISORY.md`: RC edge không phân biệt giữ START qua mất pin/rebound. BQ77915 không có variant/orderable/cold-start được chứng minh cho3AA NiMH; loại khỏi hướng nghiên cứu này, không thay bằng một generic Li-ion BMS. Khối nhớ luôn có nguồn từ toàn pack là proposal còn cần POR/observe-release, front-end từng cell, sense isolation, timer/MAX current. Dòng IC riêng không phải tổng OFF. Chưa có topology được nhận để chuyển schematic. Bản tính/nguồn tiếp theo được lưu riêng khi nhận; không tự đóng cổng bằng advisory.

## Còn thiếu để B1

1. Chốt/endpoint/bridge interlock thực và chịu lỗi chung; lực100/200N, ma sát/lò xo/mòn/dung sai chưa chứng minh.
2. Điện: từng cell/đảo cell/open sense, startup/reset không tự tái cho phép, ngắt sense/bias qua cutoff, MAX timing/current chưa khép.
3. Exact B01/connector contact overlap/anten/cassette/whole-kit fit/BOM/cost và review độc lập cấu hình mới còn thiếu.
4. Bốn cổng r12 vẫn OPEN,14 verification_items giữ nguyên; chưa duyệt hash hoặc mở lease B1.

## Lệnh và file

- `python -X utf8 .../run_paths.py`: exit0,102 đường, kết quả trong `path-results.json`.
- `python -X utf8 .../check_paths.py`: exit0 sau sửa assertion đối chứng và gân; kết quả trong `adversarial-results.json`.
- `cad.cmd run .../kernel_check.py`: exit0, native model +216 so sánh, `kernel-results.json`.
- `cad.cmd export cf8a108a-2507-5b43-8078-95a01c196e1b .../m5-contact-reference.xbf`: exit0. Mở/ảnh native được kiểm, không tạo file chế tạo.
- `node D:/StartupOS/docs/agents/validate.mjs`: exit0,61task/143capability,errors=[],warnings=[] trước review. Không sửa validator; kết quả cuối lưu riêng.
- npm/browser/firmware/FE/bench: NOT_RUN, không sửa ứng dụng hoặc thao tác thiết bị.

Hash nguồn và artifact được ghim trong `review-packet.json`. Phản biện Box03 tại `BOX03-ADVISORY.md` được dùng làm ca thử; họ chưa review code attempt-2 khi đưa advisory. Kết luận Box08 độc lập sẽ nằm ở tệp riêng, không suy PASS từ report của lead.
