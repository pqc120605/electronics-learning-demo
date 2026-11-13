# MoBot V2 · Đầu vào thiết kế tay cầm PS3-style AA v1

Phạm vi tay cầm không dây theo hướng người dùng đã yêu cầu. Tài liệu gom quyết định bố trí và đầu vào cần chốt cho cấu hình triển khai. [Đề xuất ban đầu](mobot-v2-handset-ps3-style-aa-proposal.md).

## Cơ sở để phát triển cấu hình

- Dùng SparkFun WRL-20168 làm cơ sở. Tay cầm chơi không dây, giữ giao thức robot hiện hành. Hai tay nắm và hai cần analog đối xứng là bố trí ưu tiên. Cần chốt chức năng cần và nút, số đường ADC/I/O và cơ chế dừng robot khi mất lệnh.
- Ưu tiên khay 3 AA một lớp ở giữa lưng, ba viên nằm ngang, nắp tháo phía sau. Box 03 tính bao riêng các viên 50,5 × 43,5 × 14,5 mm, chưa tính khay, lò xo và nắp. Khay 4 AA dự phòng có bao pin 50,5 × 58,0 × 14,5 mm. WRL-20168 phía trên, chừa anten và USB-C hướng cạnh trên.
- 3 AA NiMH là nguồn cơ sở để tính tải. LR6 và Con Thỏ R6P là các loại cần xác minh riêng, ưu tiên thử R6P theo yêu cầu trải nghiệm thay pin. Nguồn 5 V điều áp theo dải pin dưới tải, ưu tiên khảo sát buck-boost nếu hỗ trợ nhiều hóa học. Không sạc trong khay. USB để nạp firmware, cơ chế tách nguồn phải chặn dòng hồi từ USB tới khay và qua tín hiệu khi một phía mất nguồn.
- Phiên bản AA thay thế nhánh pack Jauch/H3 trong đề xuất tay cầm. Chưa quyết định giữ hay bỏ từng khối RUN cũ. Box 02 đề xuất cách tách nguồn đơn giản với điều kiện mặc định tắt và chứng cứ cho ca cắm USB, mất nguồn hoặc thao tác sai.

## Điều kiện trình cấu hình triển khai

1. Chốt khay và hóa học hỗ trợ, linh kiện nguồn, dải đầu vào, tải xung, ngưỡng báo/cắt, thời lượng tối thiểu và tiêu chí R6P. Nếu thiếu đặc tuyến đúng mã, cần thử đầu vào trước khi cam kết hỗ trợ.
2. Chốt cơ chế PROGRAM, nguồn/đường hồi, các trạng thái lỗi, hợp đồng điều khiển và số I/O. Chốt bao khay/joystick và vùng chừa dựa trên mã thật.
3. Box 08 review đúng cấu hình tổng hợp. HQ trình hash cấu hình để duyệt và chạy preflight trước khi cấp lease.
