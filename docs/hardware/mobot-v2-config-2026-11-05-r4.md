# MoBot V2 · Cấu hình đề xuất r4

05/11/2026 · `MOBOT-V2-CONFIG-r4` · Cấu hình để review trước schematic và layout KiCad cho robot và tay cầm.

Áp dụng [BOM r2](mobot-v2-bom-review-2026-11-05-r2.xlsx), SHA‑256 `89E87D6D5B1E7D80A20E20C0055E1EF7D87983F1FDDDE54B9DD4681646E1DC46`, cùng [hồ sơ kỹ thuật r2](mobot-v2-bom-review-2026-11-05-r2-handoff.md). B02 là thay đổi linh kiện duy nhất theo lựa chọn mới của người dùng. Tài liệu này thay thế phương án đổi cả bo và motor ở [r3](mobot-v2-config-2026-11-05-r3.md).

| Dòng | Cấu hình r4 | Bằng chứng và điểm cần xác nhận |
|---|---|---|
| B01 | 2 × **HH004223**, ESP32 DevKit V1 30 chân, CP2102, USB‑C. Một bo cho robot, một bo cho tay cầm | Giữ SKU r2. Listing xác nhận cấu hình thương mại. Còn thiếu revision bo thực tế, kích thước, tâm hai hàng chân và sơ đồ đường cấp nguồn USB của đúng bo. [Listing](https://linhkienvietnam.vn/module-node-mcu-32s-esp32-devkitc-dung-module-esp-wroom-32) |
| B02 | 2 × **Pololu #992**, micro metal gearmotor LP 6 V, 100,37:1, không encoder | 130 rpm và 40 mA không tải điển hình. Dòng kẹt ngoại suy 0,36 A, mô-men kẹt ngoại suy 0,74 kgf·cm mỗi motor. Ở điểm hiệu suất cao nhất: 100 rpm, 0,10 A và 0,17 kgf·cm. [Thông số hãng](https://www.pololu.com/product/992/specs) |
| B21 | Giữ 2 socket 1×15 cho mỗi carrier theo r2 | Bước chân dọc hàng 2,54 mm. Tâm hai hàng và chiều cao vẫn cần đối chiếu mẫu B01 trước footprint. |

Giữ B20 làm cổng sạc pin USB‑C riêng. Đường nguồn giữa USB lập trình của B01 và carrier cần được xác minh để chặn cấp ngược. Tính nhánh motor từ **0,72 A tổng dòng kẹt ngoại suy ở 6 V** làm mốc sàng lọc, sau đó kiểm giới hạn dòng, khởi động đồng thời, pin thấp, nhiệt và tải cơ khí. Mốc này chưa chứng minh nguồn/driver hoặc mô-men kéo bốn bánh đạt yêu cầu.

## Chi phí và điều kiện bắt đầu KiCad

Hai Pololu #992 có giá niêm yết tham chiếu **47,90 USD/cặp** trước phí, thay khoản **130.000đ** của cặp motor r2. Phần còn lại theo dự toán r2 là **1.064.128–1.584.128đ**. Tổng r4 cần cộng giá cặp motor giao tới tay. [Giá Pololu](https://www.pololu.com/product/992)

Đầu vào chặn footprint và nguồn vẫn là **mẫu HH004223 đúng revision**, hoặc bản vẽ và sơ đồ nguồn USB do nhà cung cấp xác nhận cho đúng revision. Cần xác nhận chi phí r4 và hoàn tất review tải/nguồn trước khi khóa cấu hình build. Việc người dùng chọn giữ bo và đổi motor được ghi nhận ở r4. Quyền triển khai KiCad vẫn theo [điều kiện phê duyệt của dự án](../mission-control/parallel-build-policy.md).
