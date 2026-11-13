# P0-02 — kết luận lượt Sol ngày 08/11/2026

## Kết quả

9 profile agent đã chuyển sang `gpt-6.1-sol`, parse TOML thành công, kiểm so với backup xác nhận chỉ trường model thay đổi. Box02, Box03 và Box08 đã hoàn tất lượt mới có override Sol/high. Hai proposal r8 vẫn giữ nguyên bytes và `proposed`; không có duyệt hash hoặc lease KiCad.

[Box02](mobot-v2-p0-02-box02-2026-11-08.md), [Box03](mobot-v2-p0-02-box03-2026-11-08.md) và [review độc lập Box08](mobot-v2-p0-02-box08-2026-11-08.md) đã được ghi lại. QA kiểm 10/10 hash đầu/cuối review và trả `changes_requested` cho việc đóng P0-02: tay cầm còn 5 blocker, robot còn 9. Các phép đo vẫn TBD/NOT_RUN.

## Đính chính đã qua review

- MCP73833-FCI/MF có PG và timer 6 giờ (5,4–6,6 giờ); không dùng mô tả TE của MCP73834 cho IC này.
- UVLO tay cầm dùng hai cầu chia riêng; mô hình hồi tiếp RH của đầu vào tư vấn không áp dụng. Giữ ngân sách tổng rò ±100 nA. Chưa chọn ngưỡng hồi.
- RICHGSET 7,68 kΩ trong hồ sơ robot cũ không tương ứng mục tiêu 0,50 A; 1,91 kΩ chỉ là ứng viên để rà dung sai, chưa tự thay BOM hay cấu hình.
- TPS63070 PS/SYNC LOW ép PWM; lựa chọn PWM chưa chứng minh toàn tuyến hấp thụ hồi VM.
- Cửa sổ cắt robot 6,4–6,6 V không được bảo đảm bằng một cầu chia cố định với toàn dải sai số TLV6700 đang xét. Phải khóa yêu cầu theo pack rồi chọn phương án đáp ứng.
- Không dùng mạ lỗ 18 µm trung bình làm cận tối thiểu hoặc quy tắc 1 A/via làm định mức.

Nguồn hãng, phép tính và điều kiện áp dụng ở hai handoff và review; đây là kết luận trên giấy, không phải kết quả đo thiết kế.

## Việc còn bắt buộc

1. **Tay cầm / OFF:** khóa ngưỡng OFF, sai số, cửa sổ xác nhận, cận rò và đường xả, fail-off qua các miền bias, lỗi chung và thời điểm giữ/nhả trên đúng cụm. D10 không bao gồm việc hoãn bằng chứng này.
2. **Jauch/H3:** hồ sơ đúng revision cho NTC R–T/dung sai, cực tính theo mặt ghép XHP-3, CV cho phép, termination/recharge/timer. Dữ liệu công khai đã tìm chưa đủ để điền những trường này.
3. **B01/giao diện/fab:** truy xuất mẫu ảnh sang PCBA dự kiến giao; chiều dài/điện trở toàn vòng/lệch mass bó dây; option fab và cận đồng/mạ/via/package áp dụng. Đo nội bộ clone và kích thước vẫn được hoãn đúng D10.
4. **Robot:** quyết định Q7 sau dossier pack, rồi đóng R1–R6 về motor/kẹt/UVLO/VM/CE/veto/cách ly USB. Nhánh này không chặn riêng proposal tay cầm theo D15(a).

## Phương án tiếp tục giữ nguyên D10

Chuẩn bị **proposal fixture OFF riêng** trước khi tạo fixture. Mục tiêu là lấy bằng chứng tương đương cho cụm B01/cáp/giữ phích/OFF mà không phụ thuộc PCB sản phẩm cuối. Proposal phải xác định chính xác phần tử và revision, cấu hình nguồn, giới hạn, điểm quan sát, ma trận lỗi, tiêu chí tương đương và phạm vi quyền thử xin Founder duyệt. Chưa được tạo pin map, schematic/CAD/KiCad hay vận hành fixture khi chưa duyệt cấu hình đó.

Fixture cần quan sát riêng: I/O thực sự cách ly, Source thực sự ngừng cấp, áp RUN OUT, dòng có dấu, thân phích và chốt. Phải xét mất bias, sense hở/chập, lỗi GND chung, switch kẹt dẫn, nguồn PC/sink khác và bỏ bước bảo trì. PASS yêu cầu biên nhả sau OFF thực dương sau sai số, cùng cận điện áp/dòng đã review. Những cận chưa có cơ sở vẫn để OPEN; không dùng ví dụ 0,8 V/1 kΩ/0,97 s làm thông số đã duyệt.

Đây là hướng chuẩn bị proposal để phá vòng phụ thuộc, chưa phải cho phép xây dựng hoặc thử. Mọi thay đổi Q2/D10 hay pack/charger cần quyết định Founder riêng. Quyền mua, chế tạo, thử pin/motor và flash giữ tách riêng.

## Điều kiện trình hash và layout

Trước trình hash: phải đóng các blocker thiết kế của carrier và có trách nhiệm/tiêu chí/mốc kiểm chứng D10. Trước layout: Box08 review từng verification item với cận số, điều kiện, phương pháp, sai số và người vận hành được chỉ định. Kết quả đo D10 được giữ TBD/NOT_RUN đến sau PCB theo quyết định đã ký.

P0-02 chưa đạt điều kiện `blocking_unknowns=[]`; chưa đủ điều kiện mở lease schematic/layout. Queue phải giữ trạng thái waiting thay vì ghi done từ kết quả research.
