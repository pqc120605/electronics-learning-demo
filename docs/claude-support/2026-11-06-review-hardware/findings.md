# Review phần cứng / nguồn-pin / an toàn điện / firmware · MoBot V2 (06/11/2026)

Vai: reviewer chỉ đọc. Không sửa code, `tasks.json`, `runs/`, `.codex/`; không commit, không cài, không mở `.env`. Không mở lại quyết định founder: UVLO robot falling 6,40–6,60 V (TLV6700 FAIL); R7 H3/R1/R5.

Đường dẫn gốc đã đọc (4): `D:/StartupOS/docs/agents/tasks.json`, `D:/StartupOS/docs/agents/runs/**`, `electronics-learning-demo/docs/hardware/**`, `electronics-learning-demo/public/firmware/**` (kèm `src/lib/firmwareWorkflow.ts:24-25` để biết cách dùng file firmware).

Quy ước: số điện lấy từ file trong repo kèm mục datasheet mà file đó trích. Tôi chỉ tự mở lại datasheet ESP32 (xem mục "Check"). Ảnh/model 3D không dùng làm bằng chứng điện.

## Kết luận ngắn

Thiết kế nguồn tay cầm/robot (r7 + delta 07/11) đã đi xa nhưng **chưa có gì được chứng minh**: mọi phép đo bench là UNKNOWN (`final/bench-additions.md:5`), hai lease KiCad chưa mở (`tasks.json:2434`, `:2539` đều `scoped`), và **repo không có dòng firmware ESP32 nào**. Gate matrix tự tính 4/32 mục CHỐT (12,5 %) cho mỗi board (`claude-support/2026-11-06-pcb-gate/gate-matrix.md:94-99`).

## Việc cần hoàn thiện, theo ưu tiên

### High

**H1 · Chưa có firmware ESP32 cho MoBot (không spec, không mã)**
- Evidence: Glob chỉ thấy `arduino-uno-d13-blink.ino` (bản `public/` và `dist/`, md5 trùng) cho Arduino Uno; không có `platformio.ini`, không có thư mục firmware ESP32. `MM-ESP32-001` (`tasks.json:1774`) và `MM-RUN-001` (`:1689`) đều `scoped`, `execution_requested:false`, `inputs_available:false`.
- Tác động: hành vi phía MCU chưa có chủ: MOTOR_EN / `MCU_MOT_EN` (AND3, `final-values.md` mục D-R5), đọc ADC joystick sau 5 ms mở mux (`bench-additions.md:42`), nạp firmware qua USB, chân strapping. Không có pin map được chấp nhận (`gate-matrix.md:66, 78`).
- Sửa tối thiểu: hoàn tất `MM-ESP32-001` ở mức hợp đồng: module chính xác, pin map đã đối chiếu net map, trạng thái an toàn khi reset/brown-out (motor tắt mặc định), thứ tự bật ngoại vi, danh sách chân cấm. Chưa cần viết mã.

**H2 · Chuyển nguồn USB / cách ly chưa chứng minh dưới lỗi đơn (tay cầm)**
- Evidence: `docs/hardware/mobot-pcb-readiness-2026-11-06.md:12-13`: U10 đo rail trước U6; U11 chỉ thấy áp sau pass; spec/BOM mâu thuẫn PG U6; SW4 chưa đảm bảo chỉ nhận nhấn sau khi thấy nhả. Delta 07/11 đã thêm veto/latch, nhưng readiness `:5` nói box 08 chưa review bản sau delta và r7 còn `proposed`.
- Tác động: lỗi dính U6/U9, đứt sense, rail dư có thể nối hai nguồn 5 V hoặc backfeed vào CP2102/ESP32.
- Sửa tối thiểu: box 08 review độc lập đúng bytes delta (hash tại `delta-handset-2026-11-07.md` §7). Trước lease, lập bảng lỗi đơn trên giấy cho BT-H4a/b/c (`bench-additions.md:7-42`), sau đó mới đo.

**H3 · Ngân sách dòng USB chưa được chứng minh**
- Evidence: readiness `:14` (ngưỡng U9 6,65 kΩ là bảo vệ, không phải giới hạn toàn cổng). Giá trị 6,65k → 0,425/0,500/0,575 A trích TPS25947 SLVSFC9C §6.5, §7.3 Eq 5 (`datasheet-checks.md:45`). `gate-matrix.md:57`: dòng attach/boot/flash/inrush CHƯA CHỐT.
- Tác động: tải vượt cấp phép cổng host có thể sụt áp/ngắt cổng, hỏng enumeration.
- Sửa tối thiểu: chọn kiến trúc giới hạn theo trạng thái USB (hoặc nguồn riêng có cách ly) và đo dòng attach/boot/flash (`measurement-checklist.md` mục 14, cần phép của founder).

**H4 · Pack tay cầm B15 và robot B04 chưa có hồ sơ nhà cung cấp**
- Evidence: readiness `:15, :22`; `tasks.json:1568` (MM-HW-001 `waiting`, thiếu "B15/B04 supplier dossier"); `gate-matrix.md:64, 77`. Ba hướng pack (Jauch 250832, LK37478, 3×AA) và ba họ connector cùng tồn tại (`gate-matrix.md:64, 67`).
- Tác động: UVLO động, dòng xung, nội trở, bảo vệ/PCM, dải nhiệt sạc chưa có dữ liệu thật; UVLO 1S 3,266–3,417 V mới PASS tĩnh (`gate-matrix.md:65`).
- Sửa tối thiểu: founder chọn một pack (Q3) và cung cấp datasheet đúng lô/đầu nối; sau đó khóa connector và NTC.

**H5 · Bo DevKit tham chiếu và mẫu thật chưa đồng nhất**
- Evidence: readiness `:11`: trên PCB BrijModi, VDD và VBUS của CP2102 cùng nối /5v, REGIN không nối; VDD tối đa tuyệt đối 4,2 V (trích Silicon Labs CP2102/9 bảng 2–3; tôi **chưa tự mở** PDF, và `datasheet-checks.md:159` ghi bản đầy đủ CHƯA XÁC MINH). Mẫu thật là Type-C họ CH340 do founder chọn, suffix chưa biết (`u2-identification.md:3`); ảnh cho thấy U2 dạng QFN, không khớp CH340C SOP-16 theo ứng viên của project (`u2-identification.md:27`, nhãn [chưa kiểm chứng]).
- Tác động: carrier có thể cấp VIN/3V3 sai kiến trúc cho mẫu thật; gate `Suffix CH340` và `Topology USB-C` đều CHƯA CHỐT (`gate-matrix.md:52, 56`).
- Sửa tối thiểu: founder chụp macro U2, đọc VID:PID, thông mạch VBUS→VIN/3V3 và CC→GND (`measurement-checklist.md` mục 11-13); EF lập net map.

**H6 · Quy trình duyệt cấu hình mâu thuẫn, chưa cho phép lease**
- Evidence: `final/r7-approval-record.md` ghi người dùng duyệt hash `9ef75eb9…` nhưng `tasks.json` vẫn `proposed`/`approved_by: null` (`gate-matrix.md:48`). Validator đòi cấu hình JSON `mission-control/hardware-config-*.json`, r7 là `.md` (`gate-matrix.md:49`). `blocking_unknowns` phải rỗng khi duyệt, r7 còn 5 nhóm (`gate-matrix.md:50`). Bytes r7 "không authorize" mẫu Type-C (`gate-matrix.md:47`).
- Tác động: mọi lease KiCad bị chặn; thiết kế đang chạy theo nhiều tài liệu chồng nhau (B01: 02030089 / EP000723 / HH004223 / WRL-20168, `gate-matrix.md:72`).
- Sửa tối thiểu: founder trả lời Q1-Q4 (`founder-questions.md`); Codex lập cấu hình mới cho mẫu Type-C, box 08 review đúng bytes, người dùng duyệt đúng hash.

### Medium

**M1 · PS/SYNC của TPS63070 (robot) chưa chốt**: R-4 trong `final-values.md` ở trạng thái "CẦN FOUNDER" (PWM 5,766–6,223 V, PFM tới 6,345 V; dòng âm 1,1/1,8 A theo SLVSC58B §6.5). Cần BT-R4a (`bench-additions.md:70-72`). Tác động: dòng âm vào pack khi BMS mở, đỉnh VM.

**M2 · Bảo vệ xISEN của DRV8833 chưa chốt**: R-6 `final-values.md`: ngắn mạch trước OCP cho 1,25–2,07 V, trong khi tuyệt đối tối đa −0,3…0,5 V (SLVSAR1E §6.1). D3/D4 chỉ lắp nếu BT-ISEN thấy lỗi (`bench-additions.md:54-59`). Tác động: hỏng IC khi kẹt bánh. Sửa: để sẵn chỗ D3/D4 trên PCB (không lắp nếu không cần).

**M3 · IC UVLO TLV6710 chưa được box 08 duyệt** (`gate-matrix.md:75`). Spot check, không mở lại cửa sổ: `final-values.md` mục D-R2 cho V_fall 6,418–6,582 V, nằm trong 6,40–6,60 V; `datasheet-checks.md:123` ghi VIT−(INA) 397/400/403 mV (SNVSAV4B §7.5); tính tay 400 mV × (180k‖2,84M + 11,1k)/11,1k ≈ 6,50 V khớp. Việc còn lại: box 08 duyệt linh kiện/footprint và dung sai 0,1 % trong BOM.

**M4 · Nhiệt và stackup không nhất quán**: r7 ước tính MCP73833 1,05 W, TJ 83 °C ở 40 °C theo "bo chuẩn 4 lớp" (`mobot-v2-config-2026-11-05-r7.md`, dòng H3), còn spec robot giả định 2 lớp 1 oz (`final/kicad-input-spec-r7.md:259`). Chưa doc nào chốt số lớp (`gate-matrix.md:70, 82`, Q5). Bề rộng đường IPC-2221 [CHƯA XÁC MINH] (`datasheet-checks.md:113`, R-10). Sửa: chốt số lớp trước khi tính đồng/nhiệt; đo nhiệt trên mẫu.

**M5 · Cửa sổ NTC / nhiệt sạc chưa chốt**: H-7 `final-values.md` (cắt lạnh 0,4–4,3 °C, cắt nóng 40,8–47,9 °C; R(0 °C) = 27,28 kΩ theo TI SLUSD88A §8.3.7.4). Bảng Semitec lấy từ PDF do chipdip lưu, không phải trang hãng (`datasheet-checks.md:149`). Robot: ngưỡng NTC chưa bảo đảm cửa sổ 0–45 °C (readiness `:23`); BQ25886 VT3 44,75 % vẫn sạc ở VREG 8,0 V (`datasheet-checks.md:79`). Cần dữ liệu NCC pack B04 và Q7.

**M6 · ADC joystick: thời gian ổn định chưa tính được**: H-6 `final-values.md`: τ = 2,505 kΩ × C; 226 ns @10 pF nhưng 2,26 µs @100 pF; ESP32 v5.3 Table 4-3 không công bố C lấy mẫu (`datasheet-checks.md:66`). Tiêu chí "≤4 LSB sau 5 ms" (`bench-additions.md:42`) chưa đo. Pin map: JOY_X/Y trên GPIO34/35 ADC1 chỉ vào, nút dùng pull-up ngoài (`kicad-input-spec-r7.md` mục 2.2) — đúng hướng vì hai chân này không có pull-up nội.

**M7 · Bằng chứng datasheet không tái lập từ repo**: `datasheet-checks.md:3` ghi PDF TI/Microchip/Diodes "lưu ở scratchpad của session"; repo chỉ có 2 PDF ESP32 (`2026-11-06-pcb-gate/datasheets/`). Ba nguồn [CHƯA XÁC MINH]: Littelfuse SMAJ, IPC-2221, CP2102 đầy đủ. Sửa: ghi hash + URL + ngày tải vào `datasheets/SOURCES.md` (hoặc lưu PDF).

**M8 · Chưa có DRC rules, outline, lỗ gá, kích thước bo mẫu**: `gate-matrix.md:53, 68-71, 81, 83`; `measurement-checklist.md` mục 1-10 chưa có số nào. Kích thước module WROOM-32 18,00 × 25,50 mm (datasheet tr.3, tr.36) không thay cho kích thước bo DevKit.

### Low

**L1 · JST XH ghi 2,54 mm** tại `final/kicad-input-spec-r7.md:167` (J2) và `:228` (J4/J5), trong khi `gate-matrix.md:79` ghi pitch JST XH là 2,50 mm (theo RD:22). Chưa mở datasheet JST; cần kiểm: nếu 2,50 mm thì footprint 2,54 mm sai pitch.

**L2 · Firmware mẫu Arduino Uno không tái lập được**: `public/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex` (2,6 KB) được commit cùng `.ino` nhưng không ghi toolchain/phiên bản core/lệnh build. `avr-gcc`, `arduino-cli`, `pio` đều không có trên PATH nên tôi không biên dịch lại để so khớp. Mã `.ino` đơn giản, đúng với `LED_BUILTIN`. Sửa: thêm `BUILD.md` (core, phiên bản, lệnh, sha256 hex). Đây không phải firmware MoBot.

**L3 · `tasks.json` chưa theo kịp tài liệu**: `gate-matrix.md:60`. Lead nên cập nhật hoặc ghi tài liệu nào thay tài liệu nào để tránh lease nhầm bản.

## Câu hỏi / cần kiểm tra thêm (chưa kiểm chứng, không gọi là lỗi)

1. `kicad-input-spec-r7.md` mục 2.2 đặt BTN2 trên GPIO25, là ADC2_CH8 theo bảng chân trong `esp32-wroom-32_datasheet_en.pdf`. Nút digital thì không sao; nếu dùng analog cùng Wi-Fi cần kiểm tài liệu ESP-IDF (tôi chưa mở). Nhãn D34/D35/D32/D33/D25 mới khớp ảnh, **chưa có net map** (`gate-matrix.md:66`).
2. Mẫu Type-C có Rd 5,1 kΩ trên cả hai CC không? Câu trả lời quyết định kiến trúc A ở Q2 (`founder-questions.md:23`).
3. Nếu công tắc data TS3USB221 dính ON khi rail CP2102 mất nguồn, có backfeed vào D+/D− không? (`datasheet-checks.md:157, 159`, nguồn CP2102 chưa đầy đủ.)
4. Robot trong R6 dùng Micro-USB + interposer còn mẫu mới là Type-C (`gate-matrix.md:74`): chưa có tài liệu kiến trúc nguồn robot cho Type-C.
5. MCP73833 ở chế độ test LDO khi không có pin (`datasheet-checks.md:73`) và hết timer trong CV (`:158`): phản ứng của carrier chưa được mô tả.

## Check đã chạy / chưa chạy

Đã chạy (chỉ đọc):
- Glob `*.ino`/`*.ini`; `ls` thư mục firmware; `md5sum` so `dist/` với `public/` (khớp).
- Đọc `tasks.json` bằng `node` (liệt kê 20 task; in chi tiết MM-HW-001, MM-RUN-001, MM-ESP32-001, MM-HW-MOBOT-IF/REMOTE/ROBOT); tra số dòng bằng `grep -n`.
- Đọc: `mobot-pcb-readiness-2026-11-06.md`, `mobot-v2-config-2026-11-05-r7.md`, `mobot-v2-r7-founder-decision.md`; trong `claude-support/2026-11-06-pcb-gate/` và `…-pcb-status/final/`: `gate-matrix.md`, `founder-questions.md`, `measurement-checklist.md`, `u2-identification.md`, `datasheet-checks.md`, `bench-additions.md`, một phần `final-values.md`, `kicad-input-spec-r7.md`, `delta-handset-2026-11-07.md` §7; `runs/MM-HW-MOBOT-IF-001/decision-handset-b01-architecture-v1.md`.
- `pdftotext` trên `esp32-wroom-32_datasheet_en.pdf` để đối chiếu GPIO34, GPIO25/ADC2 và danh sách chân strapping.
- Tính tay 3 điểm: (a) R1: 160/200/240 mV ÷ 0,62 Ω = 0,258/0,323/0,387 A, khớp 0,256–0,391 A trong r7; (b) MCP73833 IREG 1000/2,49k = 0,402 A, khớp gói 0,361–0,442 A; (c) V_fall UVLO robot ≈ 6,50 V danh nghĩa với TLV6710 (M3).

Chưa chạy:
- `calc_r7.py`, `validate.mjs`, ERC/DRC/`kicad-cli` (chưa có project KiCad, chưa lease).
- Biên dịch lại `.ino`, flash, bench, đo.
- Mở lại datasheet TI/Microchip/Diodes/Silicon Labs/WCH/JST (không có trong repo); số liệu IC ở trên là số `datasheet-checks.md` trích, kèm mục datasheet của họ.
- Đọc từng dòng `final-values.md`, `final-bom.md`, `kicad-input-spec-r7.md`; không đọc các gói cũ r1–r6, handset B01, WRL/AA. Bản mới hơn có thể đã thay thế.
- Một lệnh `bash` bị lỗi `fork: Resource temporarily unavailable` giữa phiên; số liệu liên quan được đọc lại bằng lệnh khác.
