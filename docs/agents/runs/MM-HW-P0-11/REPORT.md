# P0-11 — kết quả phân tích tiếp sau C11/r12

Ngày 10/11/2026. Lead là writer duy nhất; hai advisory Sol điện/cơ và reviewer QA đã trả kết quả. Đây là tài liệu và phân tích có điều kiện. r12 giữ nguyên SHA256 `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b`; mọi cổng vẫn OPEN.

## Đã tiến thêm

1. **H3:** loại hướng REF33 dưới yêu cầu toàn nhiệt hiện tại; lập worksheet cho reference chính xác hơn và divider. Khoảng trip partial còn khoảng 2,17 mV mỗi phía khi cộng provisional shift, chưa phải full bound. K mới đưa yêu cầu cắt về 55,922051 µs, hoặc 51,733589 µs với guard 1 mV; không dùng lại 59,06 µs cũ.
2. **OFF:** tính RC riêng RUN_OUT và JOY; chứng minh phản ví dụ cho bleed 100 kΩ. Proposal JOY dùng hai bleed 22 kΩ có thời gian xả điều kiện 0,614074 s khi một bleed hở. Chưa đổi BOM. Qualifier 100 ms MIN được phân biệt với MAX; proposal 100–250 ms cho tổng RC/cut/qualification điều kiện 2,973167 s, chưa là deadline hệ thống đã chứng minh.
3. **GPIO:** Founder chọn G-B, tổng 16 chân; giữ SECOND_POSITION_OBSERVATION, bỏ riêng export H3_DEDICATED_STATUS. Giữ đủ E1–E4 và mọi bảo vệ phần cứng. Chưa gán GPIO hoặc sửa ứng dụng.
4. **Cơ khí:** Founder chấp nhận hướng M-A để tính tiếp: thả nút rồi nhấn lại nếu đang giữ nút. Đã lập hợp đồng pha/commit và các điều kiện tách lực 100 N khỏi gate 0,30 N. Phát hiện hành trình 0,80 mm không có biên góc; phương án phân tích 0,90 mm với góc 5° chưa thay geometry r12. Clearance 0,25 mm là worksheet, chưa có CAD/FE chứng minh.
5. **Nguồn:** ghim PDF/ảnh/hash TPS22919 và TPS22990; xem trực tiếp ảnh TPS22919 p5 xác nhận tOFF chỉ là TYP. ADR45 Rev G đọc được trên web nhưng tải PDF hai lần timeout; đã dừng retry, không coi nguồn này là đã ghim hoặc đủ để đóng cổng.

## Hồ sơ

- `docs/hardware/mobot-v2-p0-11-h3-off-analysis.md`: số liệu điện, điều kiện và khoảng trống.
- `docs/hardware/mobot-v2-p0-11-gpio-mechanical-options.md`: phương án và hướng đã chọn.
- `docs/hardware/mobot-v2-p0-11-selected-interface-contract.md`: hợp đồng đề xuất sau lựa chọn.
- `docs/hardware/mobot-v2-p0-11-founder-directions.json`: biên nhận nguyên văn G-B/M-A.
- Trong thư mục run này: calculate.py, calculations.json, QA-REVIEW.md và packet-snapshot.json.

## Kiểm chứng

`python docs/agents/runs/MM-HW-P0-11/calculate.py` exit 0; các self-check toán học đạt và QA chạy lại JSON khớp. Đây không phải test phần cứng.

Kết quả hai lệnh validator nằm trong verification.json, validate.json và validate-tests.txt. Không chạy test ứng dụng web vì không đổi mã sản phẩm. CAD, FE, bench và thiết bị đều NOT_RUN.

## Chưa khép

- **H3:** còn thiếu full-temperature hysteresis/CMRR/PSRR, sai số toàn đời, comparator/reference được chọn, startup veto, current/energy/cell-side capacitance proof và MAX từ phát hiện tới cách ly. ADR PDF chưa ghim; tải được PDF cũng không tự khép các thiếu này.
- **OFF/W:** còn actual isolation proof, ma trận mixed-bias, interface/bypass/current bounds, qualifier/reset và whole-path MAX. Không yêu cầu Founder nâng ngưỡng để né bài toán.
- **M-A:** còn finite geometry, stop/neutral interlock/commit/swept clearance, tổ hợp lực nút 100 N và kéo 200 N, lỗi chung, actuator net MIN/return/duty và chi phí. Các bất đẳng thức chưa chứng minh cơ cấu đạt.
- CAD/FE cần exact configuration/hash và phạm vi được phép; chưa suy quyền đó từ duyệt hướng M-A. Chưa có quyền thực hiện thử vật lý.

**B1 vẫn NOT_READY.** Hai quyết định sản phẩm đã có, không hỏi lại. P0-11 là lát cắt tiến triển hồ sơ, chưa đóng cả bốn cổng. RELAY là bản để Founder tự chuyển nếu muốn; không gọi Claude hoặc liên hệ vendor.
