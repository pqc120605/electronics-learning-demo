# MoBot robot · Điều kiện chốt bảo vệ VM trước KiCad

Tổng hợp Box 02 lượt `01a1b0d0-81d7-7283-b502-beed6bb2f939` và Box 08 lượt `01a1b0d0-9512-7281-ae88-8241e93d5f36`. Căn cứ [phân xử RELAY](mobot-robot-vm-relay-disposition-2026-11-06.md).

- V1 giữ yêu cầu disable/Hi-Z qua nSLEEP thấp. Ưu tiên đánh giá shunt tự cấp từ VM và tụ bulk; TVS bổ sung nếu có cận phù hợp. Ngắt đồng thời converter còn chờ chứng minh. Nếu không có cận đáng tin cậy của VOUT bị đẩy áp, xét chặn dòng ngược giữa converter và rail motor.
- Chưa chốt ngưỡng kẹp. Dùng giới hạn chặt nhất của toàn rail theo trạng thái nguồn. 10,8 V là trần vận hành của DRV8833, không phải ngưỡng thiết kế mặc định. Kiểm ngưỡng bật qua dung sai, trễ, ESR/ESL, SOA, năng lượng điện trở và nhiệt lặp. Điện dung hữu hiệu phải xét DC bias, nhiệt và dung sai.
- Đầu vào trước KiCad: R/L, dòng trước ngắt, tốc độ, sức điện động hồi, quán tính hoặc cận năng lượng hồi của hai motor đúng cấu hình; cận VOUT/VIN khi EN thấp hoặc VIN mất; Ceff tối thiểu và ngân sách kẹp. Nếu hồ sơ không đủ, lấy số đo trên đúng cụm trước khi chọn linh kiện.
- Bench tích hợp: gộp T1–T3 ghi đồng bộ nSLEEP, EN, VIN, VM tại driver, dòng motor có dấu và dòng nhánh hấp thụ. Tách pack đầy, đường hồi bị chặn và mất logic/VIN. Giữ T4 nhiệt lặp và T5 ngoại lực, định mức theo ca sử dụng. T6 chỉ xét lại nếu đổi trình tự, T7 phanh ngoài V1, giữ kiểm ISEN nếu phân tích yêu cầu. T8 là đầu vào trước KiCad.
- Không áp ngưỡng 9,5 V, hệ số 70% hay giới hạn năng lượng shunt bằng nửa sức chứa tụ. Bench chưa chạy. Chưa khóa BOM hoặc cấp lease.
