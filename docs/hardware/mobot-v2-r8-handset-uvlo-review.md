# MoBot V2 · Tay cầm r8 · UVLO, veto và cách ly

Bàn giao Box 02 để Box 08 review thiết kế. Baseline là [proposal tay cầm](../mission-control/hardware-config-mobot-v2-typec-r8-handset.json), SHA-256 `4939a54012d26d1124fc6cb843973ca9a482f914eef881fbda8d45e4140a228d`. D10 giữ nguyên. Kết quả trên mẫu vẫn TBD / NOT_RUN.

## UVLO hai ngưỡng

Ứng viên TLV6710 dùng hai cầu chia độc lập và latch khóa RUN. Với ngưỡng comparator 397–403 mV, điện trở ±0,1% và ngân sách dòng nút sense ±100 nA, HQ tính lại các cận dưới đây và làm tròn ra ngoài đến mV. [TI TLV6710 Rev. B](https://www.ti.com/lit/ds/symlink/tlv6710.pdf).

| Điều kiện | Cầu chia | Cận tĩnh | Danh nghĩa |
|---|---|---|---|
| Cắt khi pack giảm | 72,0 kΩ / 10,0 kΩ | 3,242–3,318 V | 3,280 V |
| Cho phép nhận lệnh RUN mới khi pack tăng | 80,0 kΩ / 10,0 kΩ | 3,558–3,642 V | 3,600 V |

Tính theo Vpack = Vtrip × (1 + Rtrên/Rdưới) ± Isense × Rtrên. Biên khoảng 42 mV ở góc thấp so với mốc 3,20 V phải bao trùm sai số cảm nhận và sụt áp trong tổng trễ tắt nếu cần ngắt hoàn toàn trước mốc. Cần review POR, brownout, lỗi sense, ngân sách rò và reset latch. Vượt ngưỡng hồi chỉ mở quyền nhận lệnh RUN mới. [Cấu hình r6](mobot-v2-config-2026-11-05-r6.md).

## Veto, xả rail và I/O

- **Veto CHARGE:** lấy VBUS trước charger, cưỡng bức cách ly I/O, xóa RUN rồi tắt Source/boost. Mất bias giữ OFF. Trong PROGRAM + CHARGE, rail B01 do PC cấp được tách khỏi điều kiện xả RUN OUT.
- **Xả RUN OUT:** ưu tiên bleed thụ động sau switch. TPS25810 công bố 400–600 Ω khi mất dấu hiệu UFP trong cửa sổ xả; cần xác minh riêng ca EN thấp hoặc mất bias. Ví dụ sàng lọc với 10 kΩ ±1%, V0 5,5 V, giả định bơm lại 10 µA và mốc 0,8 V cho khoảng 20,65 ms/µF ở góc R cao. Giá trị cuối cần Ceff tối đa, dòng cấp ngược và thời gian cho phép. [TI TPS25810 Rev. C](https://www.ti.com/lit/ds/symlink/tps25810.pdf).
- **Cách ly:** TMUX1511 có 4 kênh mỗi IC. Cận IPOFF ±2 µA/kênh ở điều kiện bảng chỉ dùng sàng lọc; tổng trị tuyệt đối 10 µA cho 5 kênh không xác lập cận dòng nâng rail của hệ thống. Cần xét chiều tín hiệu, topology nhiều IC, sense/pull-up/clamp, điều kiện rail nổi và trễ toàn tuyến, gồm detector, logic, tải và ramp. So với biên nhả từng tiếp điểm RUN trong ca kênh còn lại kẹt. [TI TMUX1511 Rev. B](https://www.ti.com/lit/ds/symlink/tmux1511.pdf).

Box 08 phân xử phần có thể khóa ở cấp thiết kế và điều kiện còn mở trước phê duyệt. Các giá trị ứng viên và giả định chưa được đưa vào proposal để duyệt hash.
