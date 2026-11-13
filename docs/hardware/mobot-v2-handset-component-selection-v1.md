# MoBot V2 tay cầm · Chốt hướng thay linh kiện v1

Phạm vi quyết định: dùng hai mã dưới đây làm cơ sở duy nhất cho cấu hình kỹ thuật tay cầm. Đây là thay đổi vật chất so với B01/B15 cũ, cần người dùng duyệt. Robot giữ hồ sơ riêng.

- B01: SparkFun Thing Plus ESP32 WROOM USB-C `WRL-20168`, ESP32-WROOM và CH340C. Dùng chế độ USB-only, để cổng pin onboard trống. Giữ đổi cáp RUN/PROGRAM, gá bo riêng và bó 11 dây trên JST GH 12 cực. Cập nhật giao diện B01 theo sơ đồ và bản vẽ SparkFun. Giá hãng ghi 29,95 USD cho riêng bo, chưa xác định giá giao tới Việt Nam hay tổng chi phí bộ. [SparkFun](https://www.sparkfun.com/sparkfun-thing-plus-esp32-wroom-usb-c.html) · [Hồ sơ kỹ thuật](https://docs.sparkfun.com/SparkFun_Thing_Plus_ESP32_WROOM_C/hardware_overview/).
- B15: Jauch `250832` Rev. 1.2, 1S1P, 2.600 mAh điển hình, 4,2 V, NTC, PCM, cầu chì, JST XHP-3. Mục tiêu giữ H3 0,40 A. Dòng này dưới mức tối đa 2,5 A của pack, còn profile kết thúc, timer, ngưỡng NTC và cực tính phải đối chiếu trước khi khóa charger. Nếu H3 không đạt, trình delta mạch sạc riêng. [Jauch](https://www.jauch.com/downloadfile/6656e149c4d6d000bf9f0721ac1f1df59/250832.pdf).

Điều kiện mở KiCad: review đúng snapshot cấu hình triển khai, đóng yêu cầu USB/ADC và pack, chứng minh cơ cấu RUN và cách ly I/O, phê duyệt hash triển khai và đạt preflight. Phiếu đo cơ cấu vẫn áp dụng sau khi cập nhật theo B01 mới. Không suy ra biên nhả từ kích thước bo. [Bản chốt trước KiCad](mobot-v2-handset-b01-pre-kicad-closeout.md).
