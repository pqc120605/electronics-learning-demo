# Các mục tự giải được · MoBot V2 (06/11/2026 chiều)

Chỉ đọc. Mã nguồn như `gate-matrix.md` và `agent-task-reconciliation.md`. Bản trước (UVLO, ICHGSET, JST XH, H3, DRC) nằm ở `prev-v1/resolutions.md`; phần còn đúng được nhắc lại ở §8. Ảnh và model 3D không chứng minh được thông số điện.

## 1. Lease: cấu trúc bắt buộc theo validator

- **Giá trị đề xuất** cho HQ (tên và trường lấy từ VM:20-44, 142-151):
  - Tệp cấu hình: `electronics-learning-demo/docs/mission-control/hardware-config-mobot-v2-typec-ch340.json`, trường `blocking_unknowns: []` lúc duyệt.
  - Bản ghi trong `hardware_configurations`: `status: approved`, `approved_by: user`, `configuration_sha256 == approved_sha256` (SHA-256 hex 64 ký tự của đúng bytes tệp JSON).
  - Task: `status: in_progress`, `execution_mode: builder`, `snapshot.kind: file-hashes` với `reference` trùng `write_lease.base_snapshot`, `write_lease {owner: hardware_kit_designer, lane: hardware, status: active, paths: [hardware/mobot-v2/handset-carrier/**], hardware_config_id}`.
- **Cơ sở:** validator chỉ đọc, kết quả thật ở agent-task-reconciliation.md. r7 trỏ tệp `.md` (TJ:2619) nên không qua được regex `mission-control/hardware-config-*.json` (VM:144).
- **Kiểm chứng:** sau khi HQ ghi, chạy `node D:/StartupOS/docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001`; mong đợi `dispatch_eligible: true`, exit 0.

## 2. Đọc ảnh mẫu (esp32-devkit-v1-type-c-front.png, -back.png)

Quan sát (không phải đo điện):

- Mô-đun ESP32 có vỏ kim loại, dấu CE; USB-C ở cạnh dưới; hai nút `EN` (trái) và `BOOT` (phải); bốn lỗ góc; hai hàng 15 vị trí.
- Nhãn silkscreen khớp EV:23-24: hàng trái từ USB-C lên `VIN, GND, D13, D12, D14, D27, D26, D25, D33, D32, D35, D34, VN, VP, EN`; hàng phải `3V3, GND, D15, D2, D4, RX2, TX2, D5, D18, D19, D21, RX0, TX0, D22, D23`. Mặt sau ghi `ESP32 DEVKIT V1 TYPEC` (đọc `DEUKIT` do chữ viết, ý là DEVKIT).
- Cạnh USB-C có regulator dạng SOT-223 (khối ba chân có tab), một tụ tantalum vàng, và `U2` là IC vuông có chân bốn phía (dạng QFN) kế bên.
- Mặt sau chỉ thấy chân header hàng trái (chân hàn nhô ra), nhãn nằm giữa; không có thông tin điện.

Điều ảnh gợi ý nhưng không chứng minh: `U2` dạng QFN vuông. CH340C thường ở gói SOP-16 chữ nhật `[chưa kiểm chứng gói, từ hiểu biết chung về họ CH340]`. Vì vậy **ảnh không ủng hộ giả định CH340C**, và chưa nói được là CP210x hay CH340 dạng QFN. EV:5 và TJ:2423 đã ghi đúng là suffix chưa xác minh.

## 3. Cách xác định chip USB-UART (tự kiểm chứng được)

Hai cách không phá hủy, user thực hiện (agent không thao tác thiết bị):

1. **Ảnh macro `U2`** bằng điện thoại, đủ sáng, thấy chữ khắc trên chip. Ghi mã in trên chip.
2. **VID:PID khi cắm vào PC** (hành động của user, không phải của agent): CH340 báo `1A86:7523`, CP210x báo `10C4:EA60` `[số thường gặp, chưa kiểm chứng trên PDF hãng]`. Trên Windows xem trong Device Manager, Details, Hardware Ids.
3. **Tiêu chí đóng:** mã chữ khắc hoặc VID:PID cùng với tên IC trong datasheet hãng WCH. Chỉ khi đó mới được ghi "CH340C" hay họ CH340 khác vào cấu hình.

## 4. Kích thước board (cần đo, kèm ước lượng sàng lọc từ ảnh)

- **Cần đo** (CP:72-79): chiều dài, rộng PCB; khoảng cách tâm hai hàng; pitch; khoảng cách pin 1 đến pin 15; tọa độ và đường kính 4 lỗ; vị trí, nhô và cao của USB-C; chiều cao linh kiện; vùng cấm anten. Dùng thước kẹp và ghi sai số.
- **Ước lượng từ ảnh front, chỉ để kiểm tính hợp lý:** lấy pitch 2,54 mm làm thước (14 khoảng giữa pin 1 và pin 15 ≈ 485 px trong ảnh), cho khoảng cách hai hàng ≈ 25 mm, dài ≈ 51 mm, rộng ≈ 29 mm. Gần mức niêm yết 51,5 × 28 mm của EasyWare (CP:11). **Không dùng** các số này để đặt footprint; ảnh có phối cảnh và không có thước. `[chưa kiểm chứng]`.

## 5. blocking_unknowns phải rỗng: đề xuất cách xử lý (cần founder, Q4)

- **Vấn đề:** r7 còn 5 nhóm blocking, gồm đo bench cần PCB (TJ:2624-2632). Validator bắt rỗng (VM:42). Bench chỉ làm được sau PCB, nên chờ bench trước lease là vòng lặp.
- **Đề xuất:** cấu hình mới liệt kê hai danh sách riêng: `blocking_unknowns` (rỗng khi duyệt) và `verification_items` (danh sách phép đo sau PCB, user chấp nhận rủi ro). Cần HQ xác nhận validator không đọc `verification_items` như blocking (VM:151 chỉ kiểm `blocking_unknowns`).
- **Kiểm chứng:** HQ chạy validator trên JSON thử; không cần sửa `validate.mjs`.

## 6. Hòa giải kiến trúc tay cầm (cần founder xác nhận, Q2)

- **Thứ tự thời gian (mtime 06/11):** CP 12:18, AV1 12:57 (user "duyệt", run decision:5), CS 14:43, GR 14:57, AA 15:19.
- **Đề xuất xử lý:** coi AV1 là kiến trúc đã duyệt cho tay cầm, và coi CP phần carrier→Q_ISO→VIN là bị thay (AV1:8 ghi VIN và 3V3 nằm ngoài đường cấp nguồn carrier). CP còn dùng cho điều kiện bằng chứng mẫu (CP:68-89).
- **Điểm EF cần kiểm với kiến trúc cáp RUN OUT:** TPS25810 ứng viên (AV1:9) là bộ điều khiển USB-C phía nguồn (DFP) có công tắc VBUS `[chưa kiểm chứng datasheet]`. Nó chỉ chạy đúng nếu mẫu có điện trở Rd 5,1 kΩ trên cả hai chân CC. Ảnh không thấy được; cần net map (EF).
- **Kiểm chứng:** HQ ghi decision "AV1 thay CP phần nguồn" hoặc nêu lý do giữ CP.

## 7. Dòng USB (giá trị chuẩn, cần xác minh điều khoản)

- USB 2.0 cấp một đơn vị tải 100 mA trước cấu hình, 500 mA sau cấu hình (thường gặp). Type-C mặc định báo 500 mA với nguồn USB 2.0 `[chưa kiểm chứng PDF USB-IF; CP:66 cũng chưa xác minh]`.
- **Dùng làm giới hạn tạm** cho thiết kế mẫu đầu: 500 mA tại cổng DevKit khi đã cấu hình, và đo thực tế attach, boot, flash, inrush. Chưa dùng 100 mA làm cận pass, theo CP:66.

## 8. Phần của lượt trước (prev-v1) còn đúng với board mới

- Số tính lại UVLO robot 6,435–6,565 V (TLV6710), UVLO 1S 3,268–3,417 V, H3 0,358–0,446 A, R1 0,256–0,391 A, ICHGSET 1,91 kΩ, JST XH 2,50 mm, bề rộng IPC-2221: **còn đúng** vì không phụ thuộc board DevKit.
- **Không còn dùng được:** pin map BrijModi, interposer Micro-USB, U9/U10/U11 pass VBUS, TS3USB221, latch SW4. Các phần này dựa trên board và kiến trúc đã bị thay (xem §6).

## 9. Việc HQ nên sửa trong doc/queue (Claude không sửa)

1. Cập nhật `tasks.json` theo AV1, CS, AA, hoặc ghi rõ doc nào bị thay.
2. Thay `review` cũ của IF-001 bằng trạng thái hiện hành.
3. Điền `required_gates` cho hai task KiCad nếu muốn hardware gate có hiệu lực khi `done`.
4. Chuyển MM-PARALLEL-SETUP-001 sang `done` hoặc ghi lý do giữ `in_review`, vì run review đã PASS (review.md:11).
5. Cập nhật `waiting.reason` của MM-BOM-001 và MM-HW-001 theo mẫu Type-C.

## 9b. Việc cần người (không phải agent)

- Founder: ảnh macro `U2`, VID:PID khi cắm PC, ảnh có thước hoặc số đo thước kẹp, bảng thông mạch nếu có.
- Bench operator: BT-R1a (L và R motor #992), chạy ngay được, không cần PCB (BT:5).
