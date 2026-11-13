# MoBot V2 · Ghi chú nguồn cho hướng dẫn người dùng (07/11/2026)

Nội dung để đưa vào hướng dẫn học sinh và giáo viên. Mỗi dòng đều suy ra từ thiết kế trong [final-bom.md](final-bom.md).

## Tay cầm và robot

1. **Bật máy:** nhấn nút ON một lần rồi nhả. Giữ nút không có tác dụng. Gạt công tắc OFF để tắt hẳn.
2. **Máy tự tắt và không tự bật lại** khi: cắm cáp USB, pin yếu, rút pin, hoặc có lỗi quá dòng. Muốn chạy lại, rút cáp (nếu có) rồi nhấn ON.
3. **Cổng Micro-USB chỉ để nạp chương trình** vào ESP32. Khi cắm cổng này, tay cầm/robot dừng. Không dùng cổng Micro-USB làm nguồn để chơi.
4. **Cổng USB-C chỉ để sạc pin.** Khi đang sạc, máy không chạy.
5. **Robot chỉ sạc bằng củ sạc báo 1,5 A hoặc 3 A** (USB-C ra USB-C). Củ sạc cổng A với cáp A–C và cổng USB máy tính sẽ không sạc robot; đèn báo nguồn yếu.
6. **Nhiệt độ sạc:** robot chỉ sạc khi pin trong khoảng 0–45 °C. Phòng trên khoảng 32 °C thì pin chỉ nạp tới khoảng 90 %. Tay cầm chỉ sạc trong khoảng 5–40 °C (cận an toàn).
7. **Cất lâu:** rút pin khỏi máy nếu không dùng quá 1 tháng. Mạch giám sát vẫn tốn khoảng 0,1 mA khi tắt.
8. **Sạc khi có người lớn,** không sạc khi pin phồng, nóng hoặc có mùi lạ.

Các điều kiện ở mục 6 còn phụ thuộc dải nhiệt sạc của đúng pack B15/B04 (chờ NCC). Sửa lại nếu hồ sơ pack khác.
