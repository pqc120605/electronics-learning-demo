# Bảng so sánh năng lực — Mạch Mở và sản phẩm tham chiếu

Ngày truy cập nguồn: 04/11/2026. Dữ liệu máy đọc: [comparison.csv](comparison.csv), cùng dữ liệu với bảng này. Mã nguồn `S-…` và `M-…` được giải thích ở [SOURCES.md](SOURCES.md).

## Cách đọc

| Ký hiệu | Trạng thái (theo prompt) | Nghĩa |
|---|---|---|
| Thử | đã dùng thử | Đã thao tác trực tiếp trong phiên này: Mạch Mở trên localhost, hoặc trang đối thủ trên trình duyệt |
| Docs | được docs xác nhận | Tài liệu hoặc trang chính thức nói có; chưa dùng trực tiếp |
| Một phần | một phần | Có nhưng hẹp hơn tên năng lực |
| Planned | planned | Có trong roadmap/spec, chưa có code |
| ? | chưa đủ bằng chứng | Không tìm thấy hoặc không đọc được nguồn. **Không có nghĩa là sản phẩm không có.** |
| N/A | không áp dụng | Không liên quan tới sản phẩm đó |
| Chưa có | chưa có (chỉ dùng cho Mạch Mở) | Đã tìm trong source và không thấy. Đây là trạng thái bổ sung, vì danh sách của prompt không có giá trị "không có" cho sản phẩm mình kiểm được code. |

Lưu ý:
- KiCad và EasyEDA chỉ là tham chiếu phụ, không phải mục tiêu sao chép, nên không có cột riêng.
- Cột **Khác** gồm Arduino Education, MakeCode, Blockly và Pindexio; ô nào thuộc sản phẩm nào được ghi rõ trong mã nguồn của ô.
- Tinkercad Circuits là SPA, nên chỉ lấy được tiêu đề trang. Mọi ô Tinkercad vì vậy là "?".
- OhStem xBot và Little Bird Crack the Code không đọc được (trang render bằng JS / HTTP 403) nên không có cột.
- LEGO SPIKE Prime đã ngừng bán; app được hỗ trợ tới 30/06/2031. Không có cột vì không còn là đối thủ đang bán.

## Ma trận

### Học tập

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lộ trình bài học có bài tiên quyết | Thử <sub>M-learn</sub> | ? | Docs <sub>S-crumb</sub> | ? | ? | Docs <sub>S-aixenix</sub> | Docs <sub>S-camp</sub> | Thử <sub>S-laFR</sub> | ? | Docs <sub>S-arduedu</sub> | Mạch Mở: 11 bài, tiên quyết là dữ liệu có kiểu, chỉ khuyên không khóa. |
| Quiz / tự kiểm chấm tự động | Chưa có <sub>M-code</sub> | ? | ? | ? | ? | ? | Docs <sub>S-camp</sub> | ? | ? | ? | Circuit Camp: 12 bài có quiz. |
| Nội dung tiếng Việt | Thử <sub>M-browser</sub> | ? | ? | ? | ? | ? | ? | ? | ? | ? <sub>OhStem xBot chưa đọc được</sub> | Chưa xác minh đối thủ nào có tiếng Việt. |
| Lập trình khối (blocks) | Chưa có <sub>M-code</sub> | ? | ? | Docs <sub>S-proteus Visual Designer</sub> | ? | ? | ? | ? | ? | Docs <sub>S-makecode; S-blockly</sub> | Blockly Apache-2.0 v13.4.0. |
| Hướng dẫn an toàn và khắc phục sự cố khi lắp thật | Thử <sub>M-browser checklist kit</sub> | ? | ? | ? | ? | ? | Docs <sub>S-camp</sub> | ? | ? | ? |  |

### Library

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Board CAD 3D có nguồn và license từng board | Thử <sub>M-test asset lock</sub> | ? | ? | ? | ? | Docs <sub>S-aixenix</sub> | ? | Thử <sub>S-laFR 3D Uno có hotspot</sub> | ? | ? | Mạch Mở: 14 viewer, SHA-256 lock, audit missing=0. |
| Họ MCU chạy firmware thật | Một phần <sub>M-browser chỉ ATmega328P</sub> | Docs <sub>S-wokwi-hw AVR, ESP32, STM32, RP2040/RP2350</sub> | Docs <sub>S-crumb AVR, ESP32, Pico</sub> | Docs <sub>S-proteus</sub> | ? | Docs <sub>S-aixenix ATmega328P/2560</sub> | ? | ? | ? | ? |  |
| Bảng pin kèm cảnh báo (strapping, 5 V) | Một phần <sub>M-code pinMap sourceBacked</sub> | ? | ? | ? | ? | ? | ? | ? | ? | Docs <sub>S-pindexio</sub> |  |
| Nhận diện pinout từ ảnh | Chưa có <sub>M-code</sub> | ? | ? | ? | ? | Docs <sub>S-aixenix</sub> | ? | ? | ? | ? | Tính năng AI; rủi ro sai cao. |

### Builder 2D/3D

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Kéo thả lắp mạch | Thử <sub>M-browser</sub> | Docs <sub>S-wokwi-docs</sub> | Docs <sub>S-crumb</sub> | ? | ? | Docs <sub>S-aixenix</sub> | Docs <sub>S-camp</sub> | ? | ? | ? | Kéo dây bằng chuột thật chưa xác minh trong pane. |
| Lắp mạch trong không gian 3D | Thử <sub>M-browser</sub> | ? | Docs <sub>S-crumb</sub> | ? | ? | Docs <sub>S-aixenix</sub> | Docs <sub>S-camp 18 linh kiện</sub> | ? | ? | ? |  |
| Undo/redo | Thử <sub>M-browser</sub> | ? | Docs <sub>S-crumb 50 bước/tab</sub> | ? | ? | ? | ? | ? | ? | ? |  |
| Định dạng mạch mở, đọc được bằng máy | Một phần <sub>M-code .machmo.json</sub> | Docs <sub>S-wokwi-docs diagram.json</sub> | ? | ? | ? | ? | ? | ? | ? | ? |  |

### Schematic/net/PCB

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Netlist suy từ dây đã nối | Thử <sub>M-browser</sub> | ? | ? | ? | ? | ? | ? | ? | ? | ? | Không suy luận từ khoảng cách 3D hay đồng PCB. |
| Schematic động: màu điện áp, chấm dòng | Chưa có <sub>M-code</sub> | ? | ? | ? | ? | ? | ? | ? | Docs <sub>S-falstad</sub> | ? | CircuitJS1 GPL-2.0: học ý tưởng, không tích hợp mã. |
| PCB / đường đồng | Một phần <sub>M-code 4 copper viewer, không nối net</sub> | ? | ? | ? | ? | ? | ? | ? | ? | Docs <sub>S-pindexio PCB Maker beta</sub> | KiCad/EasyEDA chỉ là tham chiếu phụ. |
| Nhập netlist KiCad | Thử <sub>M-browser KiCad XML sang SPICE</sub> | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chỉ R, C, L, nguồn V DC. |

### Firmware/debug/IoT

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Chạy HEX/firmware biên dịch | Thử <sub>M-browser AVR8js</sub> | Docs <sub>S-wokwi-docs</sub> | Docs <sub>S-crumb</sub> | Docs <sub>S-proteus</sub> | ? | Docs <sub>S-aixenix</sub> | ? | ? | ? | ? |  |
| Code subset cho bài học | Thử <sub>M-browser</sub> | ? | ? | ? | ? | ? | ? | Docs <sub>S-lavercel</sub> | ? | ? |  |
| Serial monitor / UART | Thử <sub>M-browser</sub> | Docs <sub>S-wokwi-docs</sub> | ? | ? | ? | Docs <sub>S-aixenix</sub> | ? | Thử <sub>S-laFR Moniteur série</sub> | ? | ? |  |
| Debugger: breakpoint, step | Chưa có <sub>M-code</sub> | Docs <sub>S-wokwi-docs GDB</sub> | ? | Docs <sub>S-proteus</sub> | ? | ? | ? | ? | ? | ? |  |
| Logic analyzer | Thử <sub>M-browser</sub> | Docs <sub>S-wokwi-docs</sub> | ? | ? | ? | ? | ? | ? | ? | ? |  |
| Xuất VCD sang PulseView | Chưa có <sub>M-code chỉ CSV</sub> | Docs <sub>S-wokwi-docs</sub> | ? | ? | ? | ? | ? | ? | ? | ? |  |
| WiFi / MQTT / HTTP ảo | Chưa có <sub>M-code</sub> | Docs <sub>S-wokwi-docs</sub> | ? | Docs <sub>S-proteus IoT Builder</sub> | ? | ? | ? | ? | ? | ? |  |
| Upload ra board thật từ trình duyệt | Chưa có <sub>M-code</sub> | ? | ? | ? | ? | Docs <sub>S-aixenix Chrome/Edge</sub> | ? | ? | ? | ? |  |
| CI / kiểm thử tự động firmware | Chưa có <sub>M-code</sub> | Docs <sub>S-wokwi-ci</sub> | ? | ? | ? | ? | ? | ? | ? | ? |  |
| API linh kiện tùy chỉnh | Chưa có <sub>M-code</sub> | Docs <sub>S-wokwi-docs Custom Chips beta</sub> | Docs <sub>S-crumb Component API</sub> | ? | ? | ? | ? | ? | ? | ? |  |

### Solver/instruments

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Giải mạch analog SPICE | Thử <sub>M-browser ngspice 45.2 WASM; gate phân phối chưa đạt</sub> | ? | ? | Docs <sub>S-proteus</sub> | ? | ? | ? | ? | Một phần <sub>S-falstad solver riêng, không phải SPICE</sub> | ? |  |
| Đồng mô phỏng MCU + analog | Chưa có <sub>M-code tách rời có chủ ý</sub> | ? | ? | Docs <sub>S-proteus</sub> | ? | ? | ? | ? | ? | ? |  |
| Dụng cụ ảo: scope, đồng hồ đo | Một phần <sub>M-browser logic analyzer, kết quả .op</sub> | ? | Docs <sub>S-crumb scope, multimeter, FFT</sub> | Docs <sub>S-proteus System Meter</sub> | ? | ? | ? | ? | ? | ? |  |

### Project/PWA

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lưu cục bộ, xuất/nhập tệp | Thử <sub>M-browser</sub> | Docs <sub>S-wokwi-price project trên cloud</sub> | ? | ? | ? | ? | ? | ? | ? | ? |  |
| Chia sẻ bằng link | Chưa có <sub>M-code</sub> | Docs <sub>S-wokwi-price</sub> | ? | ? | ? | Docs <sub>S-aixenix</sub> | ? | ? | ? | ? |  |
| Chạy offline | Một phần <sub>M-code PWA, chưa kiểm thiết bị</sub> | ? | Docs <sub>S-crumb app desktop</sub> | ? | ? | ? | ? | ? | ? | ? |  |

### Classroom/community/kit

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lập kế hoạch kit và BOM | Một phần <sub>M-browser thiếu jumper và USB</sub> | ? | ? | ? | ? | ? | ? | ? | ? | Docs <sub>S-arduedu</sub> |  |
| Lớp học có giáo viên, nộp bài | Chưa có <sub>M-code</sub> | ? | ? | ? | ? | ? | ? | ? | ? | ? | Tinkercad, Arduino Education: chưa đọc được tài liệu chi tiết. |
| Cộng đồng chia sẻ dự án | Chưa có <sub>M-code</sub> | Docs <sub>S-wokwi-price public projects</sub> | Docs <sub>S-crumb Steam Workshop</sub> | ? | ? | ? | ? | ? | ? | ? |  |
| Bán kit / affiliate | Chưa có <sub>M-code</sub> | ? | ? | ? | ? | ? | ? | ? | ? | Docs <sub>S-pindexio Shopee affiliate; S-arduedu</sub> |  |

### UX/engineering

| Năng lực | Mạch Mở | Wokwi | CRUMB | Proteus | Tinkercad | AIXenix | Circuit Camp | Learn Arduino (FR / vercel) | Falstad | Khác | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Giá gói cá nhân | N/A <sub>chưa định giá</sub> | Docs <sub>S-wokwi-price €0 / €5.6/tháng</sub> | Docs <sub>S-crumb bán trên Steam</sub> | Docs <sub>S-proteus trả phí</sub> | ? | ? | ? | ? | ? | ? |  |
| Ranh giới bằng chứng hiển thị cho người học | Thử <sub>M-browser</sub> | ? | ? | ? | ? | ? | ? | ? | ? | ? | Lợi thế riêng; chưa thấy ở đối thủ nào đã đọc. |
| E2E và a11y tự động | Chưa có <sub>M-code không có Playwright</sub> | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chỉ áp dụng cho Mạch Mở. |

## Mạch Mở đứng ở đâu

- **Mạnh hơn:**
  - Ranh giới bằng chứng hiển thị cho người học.
  - Board CAD có nguồn, license và hash.
  - Tiếng Việt.
  - Planner kit lớp học không thu dữ liệu học sinh.
  - SPICE thật chạy cục bộ, kèm handoff từ workspace.
- **Ngang mức:** lộ trình bài học, lắp mạch 2D/3D, undo/redo, serial monitor, logic analyzer cho AVR.
- **Yếu hơn:** số MCU chạy firmware, debug, IoT ảo, chia sẻ bằng link, cộng đồng, đường ra board thật, lớp học có tài khoản.

## Kịch bản trước/sau

### G1. Debug firmware
- **Trước:** học sinh chạy HEX Uno, LED không sáng. Logic analyzer cho thấy D13 luôn LOW. Học sinh không biết dòng code nào sai và chỉ còn cách sửa rồi chạy lại.
- **Sau:**
  - Đặt breakpoint ở `digitalWrite`, chạy từng bước, xem `PORTB` đổi giá trị.
  - Xuất VCD mở bằng PulseView để so sánh với board thật.
  - Tham chiếu: Wokwi GDB và VCD (docs).

### G2. MCU thứ hai
- **Trước:** catalog có Pico/Pico W với CAD đầy đủ, nhưng nhãn ghi "không chạy firmware". Người học Pico phải sang công cụ khác.
- **Sau:**
  - Pico chạy UF2 blink trong trình duyệt bằng rp2040js, có cùng logic analyzer.
  - Nhãn board được đổi đúng thành "chạy firmware RP2040 (mô phỏng)".

### G3. IoT ảo
- **Trước:** sản phẩm nói về IoT nhưng không có bài nào gửi được dữ liệu cảm biến lên mạng.
- **Sau:**
  - Bài "gửi nhiệt độ qua MQTT" chạy với broker giả lập trong trình duyệt.
  - Bước đầu có thể là broker mô phỏng chỉ trong tab, không ra Internet, để tránh rủi ro mạng.

### G4. Ra board thật
- **Trước:** sau khi học trên web, người học phải tự cài Arduino IDE. Đoạn chuyển này dễ làm người học bỏ cuộc.
- **Sau:**
  - Nút "Nạp vào board" dùng Web Serial (Chrome/Edge) cho Uno.
  - Kèm checklist an toàn: rút nguồn ngoài, đúng cổng.
  - Tham chiếu: AIXenix upload USB (docs).

### G5. Lớp học
- **Trước:** giáo viên in phiếu chuẩn bị kit và chia sẻ gói JSON bằng tay; không biết học sinh đã tới bước nào.
- **Sau:**
  - Mã lớp; học sinh nộp `.machmo.json`; giáo viên thấy tiến độ theo bước (đã đọc, đã lắp, đã chạy).
  - Không thu điểm số hay danh tính quá mức cần thiết.

### G6. Schematic động
- **Trước:** học sinh thấy dây và kết quả `.op` dạng số. Khó hình dung dòng điện chạy ra sao.
- **Sau:**
  - Tô màu node theo điện áp từ kết quả ngspice, và đặt chấm dòng trên dây theo `i(v1)`.
  - Ý tưởng lấy từ Falstad; tự viết, không dùng mã GPL.
