# MoBot robot · Phân xử RELAY R-20261106-03

Áp dụng cho review cấp thiết kế. Nguồn [RELAY](../claude-support/logs/2026-11-06-1917.md), [review chi tiết](../claude-support/2026-11-06-relay-R20261106-01/review-result.md). Bench chưa chạy. Không đổi BOM hoặc cấu hình đã duyệt.

| Mục | Phân xử |
|---|---|
| Tắt đồng thời và hấp thụ độc lập | ACCEPT làm hướng đánh giá. Hồ sơ nối cùng MOTOR_EN đến nSLEEP và EN. Phải chứng minh mạng hấp thụ làm việc khi converter, nguồn logic hoặc đường về pack không khả dụng. Chưa chọn TVS/shunt hay xác nhận an toàn. |
| Phanh động trước nSLEEP | REJECT làm mặc định V1 tại thời điểm này. Box 08 đã pass yêu cầu disable/Hi-Z. Phanh là delta riêng, cần chứng minh dòng, ISEN, nhiệt, năng lượng hồi và timing trước khi xét. |
| F1 · Cận U8 | ACCEPT rà toàn rail. SLVSC58B §7.1 ghi abs max VOUT/FB 12 V, cao hơn DRV8833 VM 11,8 V; §7.3 ghi dải output khuyến nghị 2,5–9 V. Không lấy 12 V làm mục tiêu, cũng chưa chốt 9,5 V. Xác định riêng điều kiện VOUT bị đẩy áp khi converter tắt, VIN mất và các phần tử cùng rail. |
| F2 · PS/SYNC | REJECT cáo buộc mâu thuẫn giữa hai dòng được dẫn. Cả hai lắp R66 lên VIN, R67 xuống GND để DNP. Theo TI §6, mức cao là PWM/PFM tiết kiệm điện, mức thấp là forced PWM. Câu BOM mô tả phương án đổi sang R67. Chưa có bằng chứng converter hấp thụ đủ dòng hồi ở bất kỳ chế độ nào. |
| F3 · Tụ | ACCEPT phép cộng 297 µF theo giá trị liệt kê nếu cộng 286 µF và 11 µF C8 trên cùng VM. Đây chưa phải điện dung hữu hiệu tối thiểu. SLVSC58B §7.3 nêu tối đa 470 µF cho tổng tụ VOUT, kèm điều kiện L và điện dung hữu hiệu. |
| F4 · Mạng hấp thụ | ACCEPT gap BOM. D2 hiện là lớp thứ hai, chưa có mạng độc lập được định mức. |

T1–T8 là đề xuất. Không áp 9,5 V, hệ số 70%, 20 lần/phút hoặc giới hạn năng lượng shunt bằng nửa sức chứa tụ làm tiêu chí đạt khi chưa có căn cứ. Ngân sách năng lượng phải tách phần tụ, phần tiêu tán và cận điện áp đỉnh tại chân VM. Chờ Box 08 rà các ngưỡng và ca đo trước khi dùng.

Nguồn hãng: [TI TPS63070 SLVSC58B §§5–7](https://www.ti.com/lit/ds/symlink/tps63070.pdf) · [TI DRV8833](https://www.ti.com/lit/ds/symlink/drv8833.pdf).
