# Nghiệm thu local kho linh kiện R2A

Ngày 26/11/2026. Người dùng duyệt [hồ sơ R2A](2026-11-26-catalog-fidelity-r2a-proposal.md) theo SHA-256 `D049BCB6254DEA581EEEC7CB480BF68F05083F0A9765E22939C5547DC8FB8713`. Script tạo asset đối chiếu lại đúng byte hồ sơ và nguồn KiCad trước khi xuất.

Phạm vi là lát cắt local CAT-04, CAT-05, EDA-03 và SIM-01/SIM-03. Độ sâu nghiệm thu của lát cắt là xem được biểu diễn theo biến thể, lắp và lưu lại dây, chạy bài thử logic và quan sát tín hiệu theo net trên Uno.

## Đối chiếu hình học và định danh

- 14 mã đặt hàng có tổng cộng 214 ánh xạ chân. Tên, cực tính và pad trong ký hiệu 2D lấy từ pinout tài liệu TI, có revision và trang nguồn ngay trong giao diện. Bàn lắp mạch, schematic, footprint và marker 3D dùng cùng ID chân.
- Hai package DIP-14 và DIP-16 dùng lại GLB KiCad 10.0.7 sau khi đối chiếu SHA-256 với nguồn R2A. DIP-20 sinh từ STEP đã khóa, kích thước bao 7,874 × 6,980 × 26,162 mm, GLB 174.520 byte. Phép cắt lưới tại 0,2 mm dưới mặt lắp cho sai lệch tâm chân–pad lớn nhất 0 mm ở độ phân giải hiện tại.
- Ba tệp `.kicad_mod` tải trực tiếp từ ứng dụng và có SHA-256 khớp nguồn. Đã kiểm cả bốn góc đặt cho từng IC. Hai hướng hợp lệ đặt các chân qua khe e–f với mỗi chân trên một dải riêng. [Giấy phép thư viện KiCad](https://www.kicad.org/libraries/license/)
- Chrome đã chọn pad 1 trong 2D, chuyển sang đúng pad ở footprint rồi xoay marker tương ứng trong 3D đối với cả 14 mã. Ca SN74HC245N dùng viewport 390 px, tải footprint, tìm bằng MPN và giữ dây A1–B1 khi mở lại bản nháp.

## Logic và chạy cùng firmware

- Cổng NOR, NOT, OR, XOR đã kiểm trên mọi cổng. Hai bộ đệm SN74HC125N và SN74HC126N kiểm hai cực tính OE, giá trị đầu ra và trạng thái Z.
- Bộ giải mã SN74HC138N và SN74HC139N đã quét mọi địa chỉ và chân cho phép. SN74HC151N, SN74HC153N và SN74HC157N đã kiểm chọn dữ liệu, đầu ra đảo khi có và mức ra khi vô hiệu.
- SN74HC164N kiểm dịch theo cạnh lên, hai ngõ vào nối tiếp và xóa bất đồng bộ. Hai IC cùng clock lấy mẫu giá trị QA trước cạnh. SN74HC165N kiểm nạp song song, đọc H đến A, QH đối nghịch /QH và cạnh của cổng clock.
- SN74HC245N truyền đúng tám bit theo hai chiều. Ca mạch kiểm Z khi nhả ngõ, X khi có hai nguồn kéo ngược và không giữ giá trị ngõ ra cũ khi đảo DIR.
- HEX Blink Uno R3 đã duyệt chạy qua các mạch dùng SN74HC32N, SN74HC125N, SN74HC151N và SN74HC164N trong ca AVR8js. Chrome chạy lại luồng SN74HC32N qua LED đã nối dây. Chọn **Viết code & Chạy → Firmware HEX và mạch số Uno** để chạy trên bàn.

## Kết quả lệnh

| Kiểm tra | Kết quả |
| --- | --- |
| `node scripts/generate-catalog-r1-models.mjs --r2a` | Kiểm hồ sơ, SHA nguồn STEP và footprint cho 3 package, 20 tâm chân DIP-20. |
| `npm.cmd run build:public` | Thành công trên bản local, gồm TypeScript và cổng kiểm ngspice. |
| Node | 62 ca về R2A, R1, AVR, bản nháp và ngspice đạt. 33 ca bổ sung về kho, sơ đồ và lắp 3D đạt. |
| Playwright Chrome | 28 ca đạt, gồm 14 IC, bản nháp, HEX R2A và hồi quy R1. |
| Preview localhost:5222 | Trang SN74HC245N, GLB, ảnh đại diện và footprint trả 200. Ba asset khớp byte với bản build. |

Mô hình điện của R2A là logic lý tưởng ở 5 V theo sự kiện. Số đo dung sai, trễ lan truyền, đặc tính tải và nhiệt thuộc kiểm chứng phần cứng riêng. Bản nháp lưu trong trình duyệt trên máy đang thao tác.
