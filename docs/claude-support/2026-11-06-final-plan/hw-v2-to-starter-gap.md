# Khoảng cách MoBot V2 → Starter

Nguồn: báo cáo subagent phần cứng (đọc file, không chạy lệnh) + `mobot-starter-target.md`. Ký hiệu: GM=`docs/hardware/claude-support/2026-11-06-pcb-gate/gate-matrix.md`; BOM1/BOM2=`docs/hardware/mobot-v2-bom-review-2026-11-05-r1/r2-handoff.md`; TGT=`mobot-starter-target.md`; FIND=`docs/claude-support/2026-11-06-review-hardware/findings.md`.

| Hạng mục Starter | Đã có ở V2 | Thiếu | Phase |
|---|---|---|---|
| Lõi chung 2 cấu hình rover/mini (TGT:6,11) | hai carrier riêng robot + tay cầm, mỗi cái một DevKit 30 chân (BOM1:10-12) | không tài liệu nào nói "mini" hay ranh giới lõi/thân, connector lõi-thân [chưa kiểm chứng] | P0 quyết; P2–P3 |
| Khung cơ khí mở, điểm gắn (TGT:12) | PETG tự in, chưa chốt (BOM1:16); trần carrier 100×100 mm (GM:69,81) | outline, lỗ gá, chuẩn gắn module; đường kính bánh ba nơi ba số (Ø40/Ø42/43) | P3 (chốt outline trước layout P2) |
| Mặt hiển thị (TGT:13) | OLED SSD1306 128×64 I2C (BOM1:13,37) | SKU chưa đóng; chưa có bằng chứng đủ cho 4 trạng thái mặt; không firmware | P2 |
| Loa (TGT:14) | MAX98357A + loa 8 Ω (R6:10) | MPN/giá; nơi lưu lời chào; kiểm nhiễu motor | P2 |
| Nút vật lý (TGT:14) | tay cầm có joystick + nút (FIND:59,75) | nút trên robot (nhấn để nói, tắt mic) [chưa kiểm chứng] | P2 |
| Mic / giọng nói (TGT:15,22) | ngược lại: "không mic/STT/AI trên robot" (BOM1:13,61) | mic, đường I2S vào, nút tắt mic, đường truyền với điện thoại | P0 quyết; P4 |
| Tay cầm tự lắp (TGT:16) | tay cầm V2 là carrier PCB trong vỏ in, ESP-NOW MOBOT-CTRL/1; gate 4/32 | dạng kit tự lắp, hướng dẫn, đổi chức năng nút; nguồn còn 3 hướng | P2 mạch; P3 kit |
| Điều khiển qua web (TGT:17) | không có đường web; `MM-ESP32-001`, `MM-RUN-001` còn `scoped` | kênh radio/USB tới robot, firmware | P1 |
| Cảm biến vật cản (TGT:18) | HC-SR04 + TCRT5000 ×2 + dịch mức (BOM1:40,54) | ngưỡng chỉnh được (firmware); kiểm echo 5 V | P2 |
| 3 khay/hộp (TGT:34-37) | không có | BOM đóng gói, phân khay | P7 |
| QR bài học (TGT:19) | không có trong phần cứng | thẻ QR, URL ổn định (phần mềm: chưa có sinh QR) | P1 SW; P7 in |
| Nguồn/pin/an toàn | r7 chốt H3/R1/R5; UVLO robot 6,40–6,60 V (GM:58,75) | mọi số bench UNKNOWN; USB tay cầm lỗi đơn; pin B04/B15 chưa hồ sơ; không hợp đồng MCU | P0–P2, P5 |
| EVT/DVT/PVT | không có (bench r6 chạy sau PCB, GM:73) | tiêu chí vào/ra; lô thử; giá vốn (BOM vượt trần) | P5, P7 |
| Chứng nhận đồ dùng trẻ em (TGT:69) | một dòng liệt kê tiêu chuẩn "cần chuyên gia" (handset.md:272) | kế hoạch, phòng thử; độ tuổi chưa chốt (TGT:61) | P0 quyết; P7 |
| Chuẩn tương thích E1–E4 (TGT:42-56) | một cổng "expansion ×1" chưa gán chân (BOM1:54) | chuẩn lắp ghép/kết nối; connector lẫn PH/XH/GH; pitch JST XH ghi 2,54 so với 2,50 | P2 dự trữ chân; P8 công bố |

## Mâu thuẫn tài liệu cần giải trước khi khóa (từ báo cáo subagent)

1. Mẫu B01: Q1-A (mẫu Type-C CH340) so với WRL-20168/Beetrona 02030089/EP000723/HH004223 còn nằm trong tài liệu; Q1–Q5 mới là lời trong chat.
2. Nguồn tay cầm: Q2-A (USB-C duy nhất cấp nguồn) so với phương án USB có dây bỏ pack, phương án 3×AA, và bản nháp CP (pack→boost→Q_ISO→VIN).
3. USB robot: R6 dùng Micro-USB + interposer; mẫu đã chọn là Type-C.
4. Củ sạc A-C: R7:9 bỏ sạc robot khi nguồn Default, BOM1:15 đặt mục tiêu hỗ trợ củ điện thoại.
5. Số lớp PCB: Q5-B 4 lớp so với spec robot giả định 2 lớp (`kicad-input-spec-r7.md:259`).
6. Duyệt r7: biên bản ghi user duyệt, `tasks.json` vẫn `proposed`, `approved_by` null.
7. Dừng motor: phanh động ở tầng 1 (đề xuất của Claude) so với REJECT làm mặc định V1 của Codex; vẫn mở ở MOBOT-CTRL/1.
8. Đường kính bánh: Ø42 #1090 (fixture), Ø40 #1452 (shortlist), 43 mm (vm-isolation).
9. Pitch JST XH.
10. Starter có mic và 2 cấu hình; V2 không có mic và chỉ có một khung 2 motor.
11. Ngân sách: trần dưới 1.000.000 đ so với dự toán 1.194.128–1.714.128 đ (BOM2:35).
