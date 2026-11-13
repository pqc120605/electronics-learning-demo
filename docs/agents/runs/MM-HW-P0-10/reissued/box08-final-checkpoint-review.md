# Bản hiệu đính lead — box08-final-checkpoint-review.md

Founder đã chốt cách ly toàn bộ I/O trong CHARGE/PROGRAM. BQ25170 không I2C là candidate đã chấp nhận; câu hỏi bus và budget11 cũ superseded. Đây là hiệu đính của lead, chưa phải Box08 review snapshot mới.

Original SHA256 ASCII: `9ef94c63a35021679780be20d25207d3b6170ebd651e8caa27723d5fed839f15`. Bản gốc được giữ nguyên. Các hash bên dưới là input thực tế hiện tại, không suy độc lập review mới.

- box02-crossings-and-ti-request.md: `4ff0e5c4dcf683a126913cb69117f5ce84c4103714f0773050d9052515082df2`
- box03-fit-and-rfq-spec.md: `c358808c6de93eb928ba39dd27cbb4ed79cedb2f63dc21fe176a21263f12da28`
- box03-direct-return-geometry.md: `47d7b22b2fae085b0a970e2b7fb9a9f895ff3860163512eb6a4da97d0d604867`

## Nội dung lịch sử (mọi nhãn chấp nhận trong trích dẫn đều hết hiệu lực cho r12)

**HISTORICAL_ACCEPTANCE_WITHDRAWN để chốt hợp đồng logic và draft yêu cầu dữ liệu/RFQ; B1 vẫn NOT_READY.** Hai file không đổi qua kiểm hash đầu/cuối; r11 vẫn `b4a7…e887`.

- **Budget 11 role đúng:** 5 output/bidirectional + 4 E-channel dự trữ + 2 input. Bảy crossing A đã bao RUN/ARM, RELEASE, WDI, SCL/SDA và hai status. Đây là fit số học, chưa chứng minh interface điện. Allocation **12+7+1=20 µA** chưa phải KCL đã đóng.
- **Draft TI request đủ có mục tiêu.** Trước gửi, cần điền các điều kiện còn trống như rail/nhiệt, pull-up/tải và fault envelope; linh kiện driver/tụ/R/reverse blocker chưa chọn phải giữ riêng, không giả định danh sách TI đã bao hết.
- **Draft RFQ đủ cho hỏi khả năng chế tạo và giá sơ bộ có điều kiện.** Chưa đủ báo giá chắc chắn hoặc xác nhận fit. Hành trình key khoảng **24 mm cộng clearance**, bao quét trên **64 mm**, không được nhầm với cửa cấp quyền 1,2 mm.

**Điểm cần quyết định Founder duy nhất là phạm vi truy cập H3**, tại [crossings:52](D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/box02-crossings-and-ti-request.md:52):

> Giữ toàn bộ I/O cách ly trong CHARGE/PROGRAM và hoàn thiện cơ chế cấu hình charger không phụ thuộc B01/default phù hợp; hay cho phép ngoại lệ **chỉ bus H3**, với cách ly và điều kiện truy cập riêng? Ngoại lệ này không cho phép cấp nguồn B01, mở RUN/JOY/RELEASE hoặc nới các crossing khác. Nếu B01 không có nguồn hợp lệ thì ngoại lệ bus cũng chưa giải quyết được cấu hình charger.

Dù chọn phương án nào, dossier phải chứng minh startup/POR/reset về default **4,20 V** không đưa pack vượt trần: pack chưa được nối sạc chỉ vì bus hoạt động hoặc một lần ghi register thành công. Đổi candidate/default hoặc thêm cơ chế cấu hình vẫn là proposal cần review; chưa chọn MPN.

**Dữ liệu ngoài cần lấy đúng phạm vi:**

| Nhóm | Đầu ra cần |
|---|---|
| TI | MAX leakage/timing theo mixed-bias/tải thực; BQ25186 với R/cutoff ngoài BAT và disconnect/reconnect; cận detector/driver áp dụng. |
| Actuator | Lực kéo–hồi MIN khi nóng/rail thấp, Rmin lạnh, duty/pulse và ảnh hưởng clamp. |
| Cơ khí/RFQ | Dung sai/nhám có thể cam kết, bao lắp–chuyển động, khả năng gia công contact và giá landed theo số lượng. |

Không cần mở rộng research chung. Có thể hoàn thiện nội bộ điều kiện truy cập bus, bảng KCL và candidate packet hẹp trong khi chờ disposition H3. Qualification cơ cấu giữ riêng; không nhập vào D10.

```text
box02-crossings-and-ti-request.md
4ff0e5c4dcf683a126913cb69117f5ce84c4103714f0773050d9052515082df2
box03-fit-and-rfq-spec.md
c358808c6de93eb928ba39dd27cbb4ed79cedb2f63dc21fe176a21263f12da28
```

Không có gate PASS, approved_hash, lease hoặc liên hệ hãng từ review này.
