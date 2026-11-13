# Mạch Mở — checkpoint Hardware 11/11/2026

**P0-15 đang tiếp tục; B1 chưa sẵn sàng.** Đã hoàn tất một lượt nghiên cứu CAD có review độc lập và bổ sung phân tích nguồn có số liệu tái lập. Không thay r12 hoặc trạng thái bốn cổng.

| Nhánh | Kết quả cụ thể | Phần còn thiếu |
|---|---|---|
| CAD cam và cửa | Thay chuyển động áp đặt bằng tiếp xúc hình học; sửa gân đi xuyên khóa. Sáu đường cắm thẳng đi hết, 96 đường góc lệch bị khung chặn. Box 08 nhận kết quả trong phạm vi nghiên cứu. | Chưa chứng minh cắm lệch, cơ cấu chịu lực, dung sai, lò xo, mòn hoặc vận hành thực. |
| START/reset | Kiểm 192 tổ hợp trạng thái–đầu vào và năm chuỗi lỗi. Giữ START qua mất nguồn không được cấp quyền khởi động lại trong mô hình yêu cầu. | Chưa ánh xạ đủ linh kiện, POR, timeout độc lập và thời gian ngắt có cận MAX. |
| Giám sát từng pin | Tính phép thử phát hiện dây sense hở; ghim ba PDF hãng và sửa các số liệu dùng sai điều kiện. | Kiến trúc một switch mỗi sense vẫn có đường xả khi switch kẹt dẫn. Output clipping, cell đảo và settling MAX chưa khép. |
| Liên động cầu nối | Đề xuất hai thanh kiểm chứng, mỗi thanh phải kiểm đủ hai cửa và hai đầu dò trước khi nối cầu. | Cửa gãy nhưng tab báo vị trí còn nguyên là phản ví dụ. Hai điểm ngắt và contact kéo theo chưa có cận đầy đủ. |

## Bằng chứng

- [Báo cáo CAD](REPORT.md), [review độc lập CAD](BOX08-REFERENCE-REVIEW.md), [mô hình tham chiếu](m5-contact-reference.xbf).
- [Đối chiếu nguồn](POWER-SOURCE-DISPOSITION.md), [phân tích sense của Box 02](BOX02-ACTIVE-SENSE-ANALYSIS.md), [đề xuất liên động của Box 03](BOX03-ENDPOINT-PROPOSAL.md).
- [Kết quả kiểm logic](power-contract-results.json), [phép tính điện tái lập](power-bounds-results.json), [hồ sơ bổ sung và đính chính](SUPPLEMENT-REPORT.md).

Report và packet CAD đã review được giữ nguyên. Các kết quả bổ sung không được coi là đã nằm trong review CAD trước đó. Hai cận điện tối thiểu làm tròn xuống là 1,852 V và 1,150 V trong mô hình tuyến tính có điều kiện; không phải threshold đã chọn hoặc chứng minh điện thực.

## Việc tiếp theo của kỹ sư

1. Tính containment cho hai phần tử ngắt nối tiếp mỗi sense, đối chiếu với phương án monitor island không còn đường return sau trip. Phải kiểm cả clamp, reference, output và control; không chỉ ngắt nguồn monitor.
2. Khảo sát profile của thanh kiểm chứng, tab, endpoint và trình tự ngắt–nối. Giữ tình huống mất panel nhưng tab còn nguyên trong bộ tìm bypass.
3. Sau khi loại các phản ví dụ kiến trúc cơ bản, ghép conductor inventory, connector, fit và BOM đầy đủ. Giá hoặc cận chưa có chứng cứ tiếp tục là TBD.

Các việc trên chưa cần Founder cung cấp phép đo để thay cho phân tích kỹ thuật. Phương án cấu hình sản phẩm, vật liệu/MPN và hash vẫn phải trình duyệt riêng khi đủ bằng chứng; quyền nghiên cứu CAD hiện có không mở B1.

## Kiểm chứng và review cuối lượt

Box 08 đã đóng hai finding hồ sơ và nhận phần bổ sung revision 2 trong phạm vi document-only: [review cuối](BOX08-SUPPLEMENT-REVIEW.md). Review không nhận topology hoặc đóng cổng B1. Kết quả kiểm mới và hash cuối nằm trong `checkpoint-final-checks.json`; toàn bộ P0-15 tiếp tục ở `in_progress`, chưa hoàn tất thiết kế.
