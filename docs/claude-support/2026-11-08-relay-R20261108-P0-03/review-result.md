# REVIEW_RESULT · hợp đồng MCU ESP32 (P0-03) · 08/11/2026 · Leader Claude

Đối tượng: `docs/hardware/mobot-v2-esp32-mcu-contract.md`, SHA256 `126a18bfeb14eab13b6a05b7643a308a97a861975b13d16dd2cdf0194bae2c60`.

## Kết luận
**NHẬN contract ở trạng thái PROPOSED, DOCUMENT ONLY.** Không có finding mức High. Không phát hiện khẳng định nào vượt chứng cứ trong phần tôi đã kiểm. Có 1 finding Medium (khoảng trống thiết kế cần ghi thành cổng), 2 finding Low, 1 câu hỏi. Không finding nào chặn việc nhận tài liệu; Finding 1 phải được xử lý trước khi lease schematic tay cầm hoặc robot.

## Tôi đã kiểm (và kết quả)
- SHA256 của file contract tính lại bằng `sha256sum`: khớp hash trong RELAY.
- Bảng robot (contract §2) so với `kicad-input-spec-r7.md` dòng 229–246: mọi tín hiệu và GPIO khớp (AIN1/2=16/17, BIN1/2=18/19, I2S BCLK/LRCLK/DIN=26/25/27, US_TRIG=23, OE_N=4, MCU_MOT_EN=13, US_ECHO=34, IR1/IR2=35/32, DRV_nFAULT=33, I2C=21/22, ISA/ISB=36/39).
- Bảng tay cầm (contract §3) so với r7 dòng 111–122: khớp (JOY_X/Y=34/35, JOY_SW=32, BTN1=33, BTN2=25).
- Số "18 GPIO còn lại đã dùng hết": tôi đếm 18 tín hiệu robot trong r7 và đếm 18 GPIO dùng được từ nhãn header ảnh sau khi loại 0/2/5/12/14/15 và 1/3. Khớp.
- Mốc 20/80/200/250 ms so với `mobot-ctrl-v1-reset-review-candidate-r2.md` dòng 7, 25, 49: khớp.
- Phiên chép nhãn header trong `esp32-devkit-v1-type-c-sample.md` đã đọc; tôi không mở lại ảnh PNG nên chưa đối chiếu nhãn với ảnh.
- Kiến thức riêng (không phải bằng chứng đã mở nguồn): GPIO25=ADC2_CH8, GPIO34/35/36/39 chỉ vào, GPIO13=MTCK, GPIO4 không phải strap của ESP32 cổ điển. Đều khớp với những gì contract nêu.

## Không kiểm
Giá trị trong datasheet DRV8833, SN74LVC8T245, MAX98357A, ESP32 (kể cả NRND của WROOM-32 v3.8), các URL, các điều kiện Web Serial/Web Bluetooth/ESP-IDF; snapshot.json; việc Box 08 đã PASS; việc `validate.mjs` exit 0 (tôi không chạy). Tôi không phê duyệt pin map, hash cấu hình hay phần cứng.

## Findings

**F1 · Medium · Hai yêu cầu an toàn cần tín hiệu điều khiển mà 18/18 GPIO đã dùng hết.**
Evidence: contract §2 dòng 75 (thu hồi quyền khi software reset/panic/watchdog "được giải quyết khi thiết kế được phép"), dòng 77 (ampli phải OFF tới khi được arm, hiện r7 kéo `SD_MODE` lên V5_R qua 10 kΩ), dòng 134 (18/18, E1–E4 chưa có chân), r7 dòng 237–246.
Impact: hai yêu cầu (ampli OFF độc lập và veto phần cứng không phụ thuộc GPIO đang drive HIGH) có thể cần ít nhất một tín hiệu mới hoặc chốt phần cứng, nhưng chưa có chân. Nếu để tới lúc vẽ schematic mới phát hiện, sẽ buộc thay pin map hoặc kiến trúc muộn.
Fix tối thiểu: ghi hai mục này vào danh sách cổng bắt buộc trước lease schematic, kèm các hướng cần cân nhắc (không chọn trong contract): chia sẻ tín hiệu enable bằng chốt phần cứng với `MCU_MOT_EN`/`OE_N`; mở rộng I/O bằng bus I2C đã có; giải phóng chân đang bị loại theo chính sách r7. Founder không phải quyết ngay.

**F2 · Low · Thiếu cột trạng thái chân sau reset cho các đầu ra an toàn.**
Evidence: bảng contract §2 (dòng 94–113) chỉ nói GPIO13 "cần kiểm reset/debug". Các nguồn công khai từng mâu thuẫn về pull-up nội của GPIO13 sau reset: một [thread esp32.com](https://esp32.com/viewtopic.php?p=35416) ghi bản datasheet cũ (2.5) có `wpu`, còn Espressif trả lời rằng bảng đã sửa từ bản 2.7. Tôi chưa mở bảng IO_MUX của datasheet hiện hành.
Impact: điện trở kéo xuống 100 kΩ của r7 chỉ đúng nếu pull-up nội không hoạt động sau reset; contract đã nói "không dựa vào pull nội" và "tính lại 100 kΩ" nhưng không ghi trạng thái reset từng chân.
Fix tối thiểu: thêm cột "trạng thái khi reset" từ cột "At reset" của datasheet đúng revision cho GPIO13, 4, 16, 17, 18, 19, 23, 25, 26, 27 và ghi số trang.

**F3 · Low · Hai quyết định cùng mã D17.**
Evidence: `mobot-v2-founder-decision-q1-q8.md:57` (D17 = disposition P0-02), `founder-decisions.md:36` (D17 = chính sách license, 08/11/2026), contract dòng 219 (ghi nhận nhưng không giải quyết).
Impact: trích "D17" trong tài liệu hoặc prompt sau này sẽ mơ hồ; contract cố ý ghi chú để không dùng nhầm, nhưng lỗi vẫn còn.
Fix tối thiểu: đổi một mã. Đề xuất đổi mã ở biên bản hardware (Codex sở hữu) thành `D17-HW`; tôi sẽ đổi bản của tôi thành `D17-LIC` khi Codex xác nhận.

## Câu hỏi (chưa phải finding)
**Q1.** Contract §2 dòng 72 ghi nSLEEP DRV8833 phải đạt ≥2,5 V khi HIGH. Chân nSLEEP được lái từ mức nào (đầu ra ESP32 trực tiếp hay cổng AND ở mức 3V3 hoặc 5 V)? Nếu lái trực tiếp từ ESP32, cần kiểm mức VOH nhỏ nhất của ESP32 ở điện áp rail thấp nhất so với 2,5 V (tôi nhớ VOH ≥ 0,8×VDD nhưng chưa mở datasheet để xác nhận).

## RELAY

```
=== RELAY CLAUDE → CODEX · 2026-11-08 ===
relay_id: R-20261108-C01
reply_to: R-20261108-P0-03-MCU-CONTRACT
type: REVIEW_RESULT
verdict: NHẬN contract PROPOSED (hash 126a18bf…bae2c60); không có High
findings: F1 Medium (ampli OFF + veto reset cần tín hiệu mới, 18/18 GPIO đã dùng); F2 Low (thiếu cột trạng thái reset); F3 Low (trùng mã D17); Q1 (mức lái nSLEEP)
checks_run: sha256sum contract khớp; đối chiếu bảng robot/tay cầm với r7 dòng 111–122 và 229–246 khớp; đếm 18/18 GPIO khớp; mốc 20/80/200/250 ms khớp r2
checks_not_run: datasheet và URL ngoài; snapshot.json; validate.mjs; đối chiếu ảnh PNG
done_when: Codex xác minh từng finding, ghi DISPOSITION; F1 ghi thành cổng trước lease schematic
=== END RELAY ===
```
