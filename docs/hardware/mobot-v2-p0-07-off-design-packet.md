# MM-HW-P0-07-OFF-001 · D17-OFF-DESIGN

DESIGN PROPOSAL / OPEN · 09/11/2026. Bốn hướng Founder đã chọn; không gate PASS, không MPN/hash approval, không lease hoặc thiết bị. Box08 review đúng snapshot.

Tiêu chí nguyên văn: PASS khi kiến trúc có cận và độ phủ lỗi được Box08 chấp nhận, không dựa firmware hoặc trạng thái lệnh làm bằng chứng cách ly; FAIL khi chưa chứng minh hoặc có lỗi nhả/cấp quyền sai.

## Kiến trúc đề xuất và quyền ưu tiên

Hướng Founder O-A+O-C: permission latch phần cứng reset-dominant; hai hàng rào nguồn nối tiếp; hai tầng cách ly mọi I/O/JOY/sense có nguồn; cảm biến rail và vị trí cơ độc lập; qualification phần cứng cấp quyền nhả. Đây là sơ đồ chức năng, chưa net/pin/MPN được duyệt.

`RUN_ALLOWED = FRESH_PERMISSION AND LOCK_CONFIRMED AND BIAS_VALID AND NOT FAULT`.
`RELEASE_ALLOWED = SOURCE_OFF_PROVEN AND IO_ISOLATED_PROVEN AND RAIL_LOW_QUALIFIED AND BIAS_VALID`.
FAULT ưu tiên trên mọi request. Không lấy EN/SEL hoặc command thay bằng chứng trạng thái thực. Phục hồi cần thao tác mới, timeout giữ khóa.

## Bảng cận và nguồn

| Đại lượng | Allocation kế thừa r9 | Chứng cứ để đóng |
|---|---|---|
| Source stop | ≤20ms, yêu cầu hệ thống | MAX từng IC/rail/bias và tổngdelay TBD |
| OFF rail | ≤0,80V liên tục≥100ms | Low/high trip, offset/hysteresis/filter/GND, calibration TBD |
| Dòng Source OFF / backfeed khác | ≤10µA / ≤20µA | MAX từng đường ESD/pull-up/switch/bias qua nhiệt/áp TBD |
| Điện dung toàn cụm | ≤100µF, yêu cầu | B01/cáp/tụ/sai số/ESR/ESL thực TBD |
| Sense trên/ngân sách | 0,77412V upper candidate từ r9, chưa guaranteed | Lower trip cần để chứng minh thời gian nhả chậm nhất, cả hai còn cận ứng dụng TBD |
| Timeout | 4s yêu cầu | Decode fault→isolate→decay→qualify→release worstcase TBD |

Đại số có điều kiện từ P0-05: một bleed hở, Rremaining,max10,1kΩ,C100µF,I30µA cho plateau0,303V/tau1,010s; tới0,80V≈2,320926s. Đây chưa là bound ứng dụng. TPS25947 lịch sử O-B đã không được chọn; source excerpts A10 tr9–11 chỉ có OUT-unpowered4,86µA TYP và timingTYP. Không dùng chúng chứng minh O-A.

## Fault coverage và phản ví dụ

| Ca bắt buộc | Điều kiện không được vi phạm | Status |
|---|---|---|
| Một barrier/IO layer stuck-conducting | Barrier/tầng còn lại có MAX cắt hoặc giữ phích; không suy từ EN | TBD / NOT_RUN |
| Sense open/short/stuck-low, bias/reference/GND chung | Không tạo OFF giả hoặc quyền nhả; mô tả independence thực | TBD / NOT_RUN |
| Bleed open/short | Nhánh còn lại đủ timing; short có giới hạn nhiệt/dòng | TBD / NOT_RUN |
| PC/CHARGE/B01/JOY có nguồn, mọi thứ tự cắm | Không backfeed hoặc che nguồn đang dẫn bằng testload | TBD / NOT_RUN |
| MCU HIGH/treo/reset, bias ramp/drop | Veto độc lập, không tự hồi RUN | TBD / NOT_RUN |
| Lock mất vị trí trong RUN, driver release stuckON | Ngăn RUN hoặc ngắt trước mất tiếp xúc với margin dương | TBD / NOT_RUN |

Box08 cần map đầy đủ mọi đường năng lượng, test point/current-test không che lỗi, cận MAX leakage/timing và hai cận sense cùng feedback thật. Gate không đủ PASS khi còn một đường chưa có cận. Mẫu/nhà cung cấp/thiết bị và phép đo chưa được cấp quyền.
