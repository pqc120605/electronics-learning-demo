# MoBot V2 tay cầm · Packet review trước KiCad

Task MM-HW-MOBOT-IF-001. Tổng hợp handoff Box 02 và Box 03 để Box 08 review. Kiến trúc B01 đã duyệt theo SHA-256 `81A3DDDDAEAD94214564E548B9FAF944C4011E3979D9C1C86FDD3A93DA59D430`. [Bản kiến trúc](mobot-v2-handset-b01-architecture-v1.md). Các lựa chọn linh kiện dưới đây là ứng viên.

| Khối | Phương án và đầu vào còn mở |
|---|---|
| RUN | TPS61023 + TPS25810. RUN bắt đầu bằng lệnh mới khi I/O cách ly. Dùng UFP, VBUS sau switch, FAULT, trạng thái hai rail và xác nhận đầu cáp RUN thực sự nằm ở B01. UFP chỉ nhận diện một sink bất kỳ. |
| Nhận dạng cáp | Box 02 đề xuất đầu cáp có khóa nhận dạng, tác động tiếp điểm mặc định hở tại gá. Cần Box 03 rà khả năng định vị, thao tác đổi cáp, đứt sense, rút một phần và trường hợp cắm sink khác vào RUN OUT trong khi PC cấp B01. |
| I/O và veto | TMUX1511 cho analog, SN74LVC8T245 cho đường số cùng chiều nếu phù hợp. Bảo vệ TMUX1511 tại VDD = 0 V không đủ để chứng minh hành vi khi ramp. TLV6700 giám sát VBUS CHARGE trước charger, tắt RUN, cách ly I/O và xóa quyền RUN. Chốt từng đường tín hiệu, trạng thái mất bias và ngưỡng với sai số. |
| Bó dây và cơ khí | JST GH cắm ngang. SM08B-GHS-TB và GHR-08V-S chỉ dùng nếu đủ 8 cực sau khi đếm tín hiệu, GND và sense. Gá PETG rời. Chừa vùng nhả khóa, rút housing, uốn và giữ dây phía carrier. VIN và 3V3 B01 nằm ngoài đường cấp nguồn carrier. |
| Pack và ngân sách dòng | Giữ H3 MCP73833-FCI/MF, 2,49 kΩ ±1%, 0,40 A danh nghĩa. Cần hồ sơ B15 đúng revision hoặc đề xuất pack thay thế để duyệt. Chốt mức quảng bá USB-C từ ngân sách ở pin yếu, giới hạn nhiệt và inrush. Không dùng dòng giới hạn switch để suy ra quyền lấy dòng USB. |

## Ranh giới kiểm chứng

- **Trước KiCad:** B01 đúng revision và pinout/CC, cận tải để chọn Source, nhận dạng cáp đúng ở B01, danh sách I/O theo miền nguồn và trạng thái lỗi, số cực và mã đầu nối, vùng chừa carrier, hồ sơ pack và các ngưỡng thiết kế. Nếu thông số quyết định thiết kế chỉ lấy được từ mẫu DevKit rời thì phải có trước KiCad.
- **Trên mẫu:** attach hai chiều, enumerate và nạp firmware, PROGRAM + CHARGE theo thứ tự cắm/rút, sink khác tại RUN OUT, rò khi mất nguồn từng phía, inrush, pin yếu, nhiệt và chu kỳ sạc. Gá và vỏ chi tiết cần kiểm độ vừa, giữ cáp và khoảng hở anten. Bench hiện UNKNOWN.

Box 08 xác định điều kiện nào thực sự chặn thiết kế, đối chiếu ứng viên với nguồn hãng và rà đặc biệt trường hợp RUN OUT cấp nhầm sink. Packet này phục vụ review kỹ thuật. Cấu hình triển khai cần được duyệt đúng hash và qua preflight trước khi cấp lease.

Nguồn: [TPS61023](https://www.ti.com/lit/ds/symlink/tps61023.pdf), [TPS25810](https://www.ti.com/lit/ds/symlink/tps25810.pdf), [TMUX1511](https://www.ti.com/product/TMUX1511), [SN74LVC8T245](https://www.ti.com/lit/ds/symlink/sn74lvc8t245.pdf), [TLV6700](https://www.ti.com/lit/ds/symlink/tlv6700.pdf), [JST GH](https://www.jst-mfg.com/product/pdf/eng/eGH.pdf).
