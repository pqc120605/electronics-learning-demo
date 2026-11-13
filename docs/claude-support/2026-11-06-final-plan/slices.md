# Slice, model, thứ tự

Quy tắc áp dụng: track phần cứng/firmware → Sol (không tự cấp lease, không đặt `approved_by`); track phần mềm web → Luna (≤5 file, 1 kết quả kiểm chứng). Song song chỉ khi `allowed_paths` không chồng và tối đa 2 writer. `owner_role` chỉ dùng role trong `.codex/agents/`. Task id có hậu tố [đề xuất] chưa có trong `tasks.json`; Codex lead đăng ký.

| Slice | Phase | Track | Model | owner_role | depends_on | Claude review |
|---|---|---|---|---|---|---|
| P0-S01 supersession + đồng bộ tasks.json + biên bản Q1–Q5/Q8 | P0 | HW | Sol | hardware_kit_designer (tasks.json: lead) | — | KHÔNG |
| P0-S02 hardware-config JSON mới (Type-C, verification_items) | P0 | HW | Sol | hardware_kit_designer | P0-S01, D1–D4, D10 | CÓ (trước chốt hardware-config) |
| P0-S03 hợp đồng MCU `MM-ESP32-001` | P0 | FW | Sol | electronics_firmware_engineer | P0-S01, D4 | CÓ (firmware + slice cuối P0) |
| P1-L01 sửa nút trùng "Tiếp tục lắp mạch" (WA-01) | P1 | SW | Luna | software_engineer | — | KHÔNG |
| P1-L02 báo lỗi lưu nháp (WA-02) | P1 | SW | Luna | software_engineer | P1-L01 | KHÔNG |
| P1-L03 nối chân bằng bàn phím (WA-03) | P1 | SW | Luna | software_engineer | P1-L01 | KHÔNG |
| P1-L04 service worker có phiên bản (WA-11) | P1 | SW | Luna | software_engineer | — | KHÔNG |
| P1-L05 script test tuần tự + `strict` | P1 | SW | Luna | software_engineer | — | KHÔNG |
| P1-S01 schematic tay cầm (KiCad) | P1 | HW | Sol | hardware_kit_designer | P0 Exit 1–5, lease do lead | CÓ |
| P1-S02 kiến trúc nguồn robot Type-C + bảng T8 (giấy) | P1 | HW | Sol | hardware_kit_designer | P0-S02 | CÓ (nguồn/pin/an toàn) |
| P1-S03 khung firmware ESP32 + trạng thái an toàn | P1 | FW | Sol | electronics_firmware_engineer | P0-S02 (đã duyệt), P0-S03, D13 | CÓ (mọi task P1 firmware) |
| P1-X01 codec project (WA-07) | P1 | SW | **CẦN SOL** (đổi schema lưu, >5 file) | software_engineer | P1-L01..L03 | CÓ (schema) |
| P1-X02 K-RUN kênh quan sát hợp nhất (WA-08) | P1 | SW | **CẦN SOL** (≥2 module) | software_engineer | P1-X01, D4 | CÓ (kiến trúc ≥2 module) |
| P1-X03 spike runtime ESP32 (WA-10) | P1 | SW | **CẦN SOL** | software_engineer | D13 | KHÔNG |
| P1-X04 cổng phát hành/giấy phép ngspice WASM (WA-12) | P1 | SW | **CẦN SOL** | software_engineer | D5 | CÓ (trước `build:public`) |
| P1-R01 review cuối phase | P1 | — | Claude | — | mọi slice P1 | CÓ (slice cuối phase) |
| P2-S01 schematic khối màn hình/loa/nút/cảm biến | P2 | HW | Sol | hardware_kit_designer | P1-S01, P3-S01 | KHÔNG |
| P2-S02 chân mở rộng + dự trữ mic (DNP) | P2 | HW | Sol | electronics_firmware_engineer | D3, D7 | CÓ (kiến trúc ≥2 module) |
| P2-S03 layout tay cầm | P2 | HW | Sol | hardware_kit_designer | P2-S01 | CÓ (trước gửi sản xuất) |
| P2-S04 layout robot | P2 | HW | Sol | hardware_kit_designer | P1-S02, T8 bước 0 | CÓ (trước gửi sản xuất) |
| P2-S05 BOM variant và giá | P2 | HW | Sol | hardware_kit_designer | D11 | CÓ (BOM) |
| P3-S01 outline và chuẩn gắn module | P3 | HW | Sol | hardware_kit_designer | D1, D9 | CÓ (slice cuối nhóm cơ khí) |
| P3-S02 rover; P3-S03 mini; P3-S04 hướng dẫn lắp tay cầm | P3 | HW | Sol | hardware_kit_designer | P3-S01 | KHÔNG |
| P4-L01 trang QR theo bài | P4 | SW | Luna | software_engineer | D12 | KHÔNG |
| P4-L02..L05 bài học hành trình Starter (4–6 bài) | P4 | SW | Luna | software_engineer | P1-X01 | KHÔNG |
| P4-S01 điều khiển robot qua web (UI + firmware) | P4 | SW+FW | Sol | software_engineer + electronics_firmware_engineer | P1-X02, P2 | CÓ (kênh điều khiển) |
| P4-S02 giọng nói hoặc lời chào phát sẵn | P4 | FW | Sol | electronics_firmware_engineer | D3 | CÓ (micro/giọng nói) |
| P5-S01 bench T1–T8 + BT-H4 | P5 | HW | Sol + tester | electronics_firmware_engineer / tester | PCB, phép founder | CÓ (an toàn nguồn/pin) |
| P6-L01 e2e hành trình Starter; P6-L02 gói dự án số | P6 | SW | Luna | software_engineer | P4 | KHÔNG |
| P6-S01 `build:public` + gate | P6 | SW | Sol | software_engineer | P1-X04 | CÓ (trước `build:public`) |
| P7-S01 BOM đóng gói + kế hoạch chứng nhận | P7 | HW | Sol | hardware_kit_designer | D2 | CÓ (slice cuối phase) |
| P8-S01 chuẩn tương thích; P8-S02 E1 | P8 | HW | Sol | hardware_kit_designer | P7 | CÓ (kiến trúc ≥2 module) |

## Phản biện thứ tự phase (thay bước doubt-driven)

1. **V2 là lõi Starter?** Giả định chưa kiểm chứng; nếu sai, P2–P3 phải vẽ lại. Đã đưa vào P0/D1.
2. **Tay cầm trước robot** theo phụ thuộc `tasks.json`; nhưng rủi ro điện lớn nhất ở robot (VM, pin). Dự phòng: robot làm giấy song song (P1-S02) và T8 bước 0 không cần PCB.
3. **Cơ khí sau điện** thì có thể phải vẽ lại bo; nên outline sơ bộ (P3-S01) đi trước layout P2.
4. **Giọng nói** chưa xác thực: không đặt vào đường găng; mặc định lời hứa tối thiểu.
5. **Ước lượng công sức** là số phiên agent, không đo được; chỉ để so sánh tương đối.
6. **"L3=D3"** chưa được founder xác nhận (D6). 7. **Founder không đo được mẫu**: mọi chuỗi PCB dựa vào ước lượng từ ảnh/web đến khi có số đo; bench (P5) là lần đầu có số thật.
