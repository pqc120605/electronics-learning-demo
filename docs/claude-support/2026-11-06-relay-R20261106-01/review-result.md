# REVIEW_RESULT · RELAY R-20261106-01 (Codex → Claude) · dừng motor robot, năng lượng hồi trên VM_6V

Ngày 06/11/2026 19:17 · Leader Claude · chỉ đọc, mức thiết kế. Không datasheet nào được mở lại trong lượt này: mọi điểm datasheet bên dưới là **trích từ RELAY (Box 02/08)** hoặc file repo, ghi nhãn **[RELAY]**. Số của tôi ghi **[TÍNH]**. Số đo: **chưa có** ([KHÔNG CÓ SỐ ĐO]).

Lưu ý id: RELAY gửi từ Claude trước đó trong `logs/2026-11-06-1801.md` mang id `R-20261106-01` trùng id RELAY này của Codex. Tôi đã đổi bản của Claude thành `R-20261106-02`; reply này dùng `R-20261106-03`.

## 1. Verdict

**Ưu tiên phương án X: hạ `nSLEEP` và tắt TPS63070 đồng thời, kèm mạng hấp thụ độc lập trên `VM_6V` (bắt buộc), cộng thêm trình tự dừng nhiều tầng ở firmware.** Không chọn phương án Y (hạ `nSLEEP` trước, tắt converter sau) làm cơ chế an toàn. Lý do:

1. **X chính là netlist hiện tại.** `MOTOR_EN` nối cả `U10 nSLEEP` lẫn `U8 EN` (`kicad-input-spec-r7.md:197, :205`). Y cần thêm linh kiện trễ trên EN của U8 (RC/diode hoặc tín hiệu thứ hai) = một thay đổi thiết kế mới.
2. **Ca xấu nhất tự nhiên dẫn tới X.** Khi logic mất nguồn (`V3V3_DEV` mất), `U9` (nguồn từ `V3V3_DEV`, `:195`) không còn lái; `R48` 100 kΩ kéo `MOTOR_EN` xuống (`:196`), nên `nSLEEP` và `U8 EN` thấp cùng lúc. Một thiết kế an toàn phải chịu được ca này, nên mạng hấp thụ phải chịu được "cắt đồng thời" dù chọn gì cho ca dừng thường.
3. **Y không chứng minh được một đường hấp thụ.** Converter còn bật chỉ có ích nếu nó nhận được dòng ngược và pack nhận sạc. Trong ca RELAY nêu (pin đầy, PCM mở) pack không nhận; còn khả năng của TPS63070 (dòng ngược ở PWM so với PFM) **chưa xác minh** [RELAY: "chưa có bằng chứng converter hoặc pack hấp thụ đủ dòng hồi"].
4. **Năng lượng dừng thường giảm rẻ hơn ở firmware** (xem §4): phanh động trước khi `nSLEEP`, để năng lượng tiêu tán trong cuộn dây motor thay vì dồn về rail.

Điều kiện đổi ý (khi nào Y đáng xem): có số liệu cho thấy converter nhận dòng ngược ở chế độ cấu hình thật **và** pack luôn nhận sạc ở trạng thái xấu nhất. Hiện không có cả hai.

## 2. Phân tích ca xấu nhất (hai motor cùng trả năng lượng, pin đầy, PCM mở, logic mất nguồn)

Cơ chế (mức thiết kế, chưa đo):

- **Hi-Z.** Khi `nSLEEP` thấp, driver ngừng lái; dòng cuộn dây còn lại và động năng chạy qua diode thân về `VM` [chưa xác minh từ datasheet DRV8833 trong lượt này].
- **Rail nổi.** `U8` tắt, không có output discharge [RELAY]; không có nguồn thấp trở giữ rail. Nơi chứa năng lượng chỉ là tụ trên `VM_6V`: `C22a–c` 3×22 µF, `C23` ≥220 µF hiệu dụng, `C8` 10 + 1 µF (`:201–203`) và `D2`.
- **Hai thành phần năng lượng:** (a) năng lượng từ trong cuộn dây ½·L·I² (L motor chưa có số); (b) động năng quay của bánh/motor. (b) chỉ trả về rail khi điện áp phát ra (back-EMF) vượt `VM` cộng sụt diode; ở tốc độ ổn định điện áp phát ra gần mức đã lái ở ≈6 V, nên quá áp lớn chủ yếu đến từ (a), từ ngoại lực kéo ngược (xuống dốc) và tạp xung. **Đây là suy luận, chưa đo; bench phải quyết định.**

Ngân sách năng lượng của tụ, tính từ ΔE = ½·C·(V₂² − V₁²) [TÍNH, đã chạy lại bằng Node, khớp 8,87/11,53 mJ trong RELAY]:

| C hiệu dụng | V₁ → V₂ | ΔE cho phép |
|---|---|---|
| 220 µF | 6,0 → 10,8 V | 8,87 mJ |
| 220 µF | 6,35 → 10,8 V | 8,39 mJ |
| 220 µF | 6,35 → 9,5 V | 5,49 mJ |
| 286 µF | 6,0 → 10,8 V | 11,53 mJ |
| 286 µF | 6,35 → 10,8 V | 10,91 mJ |
| 286 µF | 6,35 → 9,5 V | 7,14 mJ |

V₁ = 6,35 V là cận trên của dải VM trong spec (`R43/R44`: 5,77–6,35 V). V₂ = 9,5 V là **mục tiêu thiết kế đề xuất** để chừa ≈1,3 V dưới 10,8 V (vận hành tối đa DRV8833 [RELAY]); phải thấp hơn nữa nếu phần tử khác trên rail yêu cầu (xem F1). Điện dung hiệu dụng thấp hơn ghi trên nhãn khi MLCC bị suy giảm theo áp một chiều; hệ số này **chưa xác minh**.

## 3. Mạng hấp thụ: hướng đề xuất và cận phải kiểm

Giữ `D2 SMAJ8.0A` chỉ là lớp thứ hai (`final-bom.md:209`). **Điểm datasheet SMAJ8.0A (13,6 V tại 29,4 A) [RELAY] không chứng minh mức kẹp ở xung thực**: ở dòng thấp hơn mức kẹp có thể thấp hơn, nhưng đường cong V_C theo I_PP chưa được xem.

Hướng đề xuất (Codex quyết, Box 02/03 chọn linh kiện):

- **Phương án A, TVS có V_C thấp hơn:** chọn TVS sao cho V_C ở dòng đỉnh dự kiến (§5) ≤ V₂ mục tiêu, và dòng rò/standoff không làm lệch dải VM 5,77–6,35 V. Cửa sổ hẹp (rail tối đa 6,35 V so với 10,8 V), nên phải chọn từ đường cong V_C–I_PP của hãng, không từ tên mã.
- **Phương án B, shunt tự cấp từ `VM`:** mạch so sánh ngưỡng (≈8–9 V) đóng điện trở xả/MOSFET; cấp nguồn từ chính `VM_6V` để vẫn chạy khi `VIN=0` và logic mất nguồn (đúng tinh thần đề xuất Box 02). Cần tính công suất điện trở, nhiệt dừng lặp, điện áp cổng, và độ trễ phản ứng so với tốc độ tăng điện áp.
- **Không** dựa vào tụ lớn hơn một mình: `ERC #5` giới hạn tổng tụ VM_6V ≤ 470 µF (`:269`, nguồn của giới hạn này **chưa xác minh**), và tụ lớn tăng dòng khởi động cho converter.

## 4. Trình tự dừng đề xuất (3 tầng)

| Tầng | Điều kiện | Hành động | Mục đích |
|---|---|---|---|
| 1. Dừng thường | lệnh Dừng, nhả Giữ, timeout | firmware giảm PWM về 0 rồi **phanh động** trong khoảng ngắn (≤ phần ngân sách 250 ms còn lại), sau đó `MCU_MOT_EN` thấp | năng lượng tiêu tán trong cuộn dây motor |
| 2. Veto cứng | `EN_NODE`/`V5R_OK` mất | `U9` kéo `MOTOR_EN` thấp: `nSLEEP` và `U8 EN` thấp cùng lúc | không phụ thuộc MCU |
| 3. Mất logic | `V3V3_DEV` mất | `R48` kéo `MOTOR_EN` thấp; cùng kết quả như tầng 2 | ca xấu nhất; mạng hấp thụ phải chịu |

Ràng buộc của tầng 1: khi phanh, dòng chảy qua `R5/R6` (0,62 Ω) tại chân `xISEN`. Tôi đã ghi từ review trước (`2026-11-06-review-hardware/findings.md` M2, dẫn SLVSAR1E §6.1, **tôi chưa tự mở lại**) rằng tuyệt đối tối đa xISEN là −0,3…0,5 V. Với 0,62 Ω, 0,5 V tương ứng ≈0,8 A [TÍNH]. Dòng phanh có thể đạt cỡ này ở tốc độ cao; **BT-ISEN phải đo ngay cả trong ca phanh, không chỉ ngắn mạch**, trước khi chọn tầng 1 là phanh thay vì thả trôi.

## 5. Dữ liệu tối thiểu cần lấy trên đúng cụm, tiêu chí pass/fail

Mọi ngưỡng bên dưới là **đề xuất**, chờ Box 08 duyệt. Phép đo dùng probe ≥200 MHz, lò xo nối đất ngắn, đo ngay tại chân `VM` của `U10` (không đo trên đầu dây dài). Bench cần phép của founder; tôi không cho phép nào.

| # | Việc đo | Điều kiện | Đại lượng | Pass (đề xuất) |
|---|---|---|---|---|
| T1 | Dừng xấu nhất | hai motor tốc độ tối đa, `VPACK2` ở mức pin đầy (8,4 V nếu 2S), nguồn **không nhận dòng ngược** (nguồn lab + diode nối tiếp để mô phỏng PCM mở), cắt `V3V3_DEV` | V_peak tại `U10 VM`; dạng sóng 1 µs/div; AOUT/BOUT overshoot | V_peak ≤ 9,5 V và < cận thấp nhất của mọi linh kiện trên rail |
| T2 | Năng lượng mỗi lần dừng | như T1 | E = ∫V·I dt vào mạng hấp thụ (dòng qua điện trở xả/TVS) | E_stop ≤ ½ ΔE cho phép ở §2 (chừa biên 2×) |
| T3 | Dòng đỉnh | như T1 | I_peak qua TVS/xả | ≤ 70 % định mức xung hãng ở cùng độ rộng |
| T4 | Nhiệt dừng lặp | dừng lặp (ví dụ 20 lần/phút, 10 phút) | nhiệt độ TVS, điện trở xả, U10, U8 | ΔT trên mọi phần tử ≤ giới hạn hãng ở môi trường 40 °C; ghi tần số dừng tối đa cho phép |
| T5 | Ca ngoại lực | kéo ngược bánh bằng tay/dốc | V_peak tại `U10 VM` | như T1 |
| T6 | So sánh X và Y | chỉ khi dữ liệu §7 mục 1 cho thấy converter nhận dòng ngược | V_peak và E_stop với trễ tắt U8 (0, 1, 5 ms) | Y chỉ được chọn nếu giảm V_peak ≥ 20 % **và** không thêm lỗi đơn mới |
| T7 | Phanh ở xISEN | tầng 1, tốc độ tối đa | điện áp đỉnh tại `xISEN` | ≤ 0,5 V trừ biên (cận thật chờ datasheet) |
| T8 | Hồ sơ motor | không cần PCB | L (đo LCR), R, dòng không tải, quán tính ước lượng (đã gắn bánh) | có số để tính ½LI² và động năng thay cho ước lượng |

Tách bằng chứng:
- **Datasheet** (chưa mở lại, theo RELAY): DRV8833 VM vận hành 10,8 V, tuyệt đối 11,8 V; SMAJ8.0A 13,6 V @ 29,4 A; TPS63070 không có output discharge.
- **Tính toán:** bảng §2, 0,8 A ở xISEN.
- **Số đo:** không có. Mọi giá trị còn thiếu là chưa xác minh.

## 6. Phát hiện trong file nguồn (đã đọc, cần Codex tự kiểm chứng)

| # | Mức | File:dòng | Nội dung | Sửa tối thiểu |
|---|---|---|---|---|
| F1 | High (cần kiểm tra) | `kicad-input-spec-r7.md:197, :205` | Cận quá áp thấp nhất trên `VM_6V` có thể là `VOUT/FB` của `U8`, không phải DRV8833. Tôi chưa mở datasheet TPS63070; RELAY chỉ nêu giới hạn DRV8833 | Lấy abs max của VOUT/FB/mọi chân nối VM_6V trong SLVSC58B; dùng giá trị nhỏ nhất làm V₂ |
| F2 | Medium | `kicad-input-spec-r7.md:197` so với `final-bom.md:203` | Spec ghi `PS/SYNC → R66 → VPACK2 (lắp)`; BOM ghi lắp R66 và "đổi sang forced PWM" qua `R67 → GND` (DNP). Hai câu không thể cùng đúng nếu mức cao = PWM cưỡng bức | Xác nhận cực tính PS/SYNC trong SLVSC58B; sửa spec hoặc BOM. Ảnh hưởng trực tiếp tới dòng ngược của U8 |
| F3 | Medium | `kicad-input-spec-r7.md:269` | "Tổng tụ VM_6V ≤ 470 µF (hiện 286 µF)": 3×22 + 220 = 286 µF nhưng `C8` (10 + 1 µF, `:203`) cũng ở `VM_6V`, nên là 297 µF danh định | Đếm lại; nguồn của giới hạn 470 µF cần dẫn datasheet |
| F4 | Medium | `final-bom.md:208-209`, `:222` | Hiện chỉ có `D2` làm bảo vệ quá áp; chưa có mạng hấp thụ độc lập trong BOM; `D3/D4` DNP | Thêm lớp hấp thụ theo §3 vào spec/BOM trước lease |

## 7. Việc cho Codex

1. Lấy từ SLVSC58B (TI, trang hãng): abs max VOUT/FB; cực tính PS/SYNC; có hay không dòng ngược ở PWM và PFM; ghi trang. Làm trước khi chọn V₂.
2. Lấy từ datasheet DRV8833: thời gian đáp nSLEEP, hành vi diode thân khi nSLEEP thấp, abs max xISEN, hành vi phanh. Ghi trang.
3. Lấy đường cong V_C–I_PP của hãng cho TVS ứng viên; chọn phương án A hoặc B ở §3 (Box 02/03).
4. Bổ sung mạng hấp thụ và trình tự §4 vào spec/BOM; cập nhật `ERC #5`.
5. Box 08 duyệt bảng T1–T8 và ngưỡng; founder cấp phép bench.
6. Đưa quyết định phanh/thả trôi/tắt vào `MOBOT-CTRL/1` (`mobot-ctrl-v1-reset-review-candidate-r2.md:51`, hiện đang mở).

## 8. Chưa xong / không kiểm chứng

- Không mở datasheet nào; chưa chạy phép đo, firmware, bench; `Node` chỉ dùng cho bảng §2.
- Chưa đọc toàn bộ `final-values.md`, `bench-additions.md` cho BT-R4/BT-ISEN; có thể đã có dữ liệu liên quan.
- Chưa rà vector CMD 32 byte (Box 07 đã làm, ngoài scope RELAY này).
- Suy luận cơ chế hồi (§2) chưa được số đo xác nhận.
