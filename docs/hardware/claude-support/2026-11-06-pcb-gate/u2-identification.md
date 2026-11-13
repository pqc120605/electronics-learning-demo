# Nhận diện U2 (chip USB-UART) · mẫu ESP32 DevKit V1 Type-C

**Kết luận: CHƯA CHỐT chip.** Không có marking trên U2 và không có ảnh macro. Theo prompt, chưa có marking thì không chốt. Không tải được datasheet WCH nên thông số ứng viên bên dưới là `[chưa kiểm chứng]` (từ hiểu biết chung, không có số trang). Ảnh không chứng minh được thông số điện.

## Quan sát từ ảnh evidence

Nguồn: `docs/hardware/evidence/esp32-devkit-v1-type-c-front.png`, `-back.png`; EV:5, EV:14.

- `U2` nằm gần USB-C, là IC vuông có chân ở nhiều phía, nhìn giống gói QFN. Ảnh 1080 px không có độ phân giải đủ để đếm chân hay đọc chữ khắc.
- Cạnh `U2` có regulator dạng SOT-223 (3 chân và tab), tụ tantalum, hai transistor nhỏ SOT-23 gần mô-đun (thường dùng cho mạch auto-reset DTR/RTS `[chưa kiểm chứng chức năng]`).
- Nhãn `ESP32 DEVKIT V1 TYPEC` (mặt sau), hai nút `EN` và `BOOT`.

## Tự phản bác (doubt)

Không spawn reviewer (CLAUDE.md của project cấm; đây là self-check suy giảm, không phải review fresh-context).

| Kết luận dễ rút ra | Phản bác | Cách đóng |
|---|---|---|
| "U2 là QFN nên không phải CH340C" | Chỉ dựa vào hình dạng ở ảnh phân giải thấp. Phản chứng: ảnh bị nghiêng, có thể là SOP-16 phóng to bị che chữ | Ảnh macro thẳng góc |
| "Là họ CH340 vì founder nói vậy" | Founder chọn họ CH340 mà không có marking (TJ:2423; EV:5) | Marking hoặc VID:PID |
| "Gói QFN thì là CP2102" | Nhiều chip WCH cũng ở QFN `[chưa kiểm chứng]` | Marking |

## Ứng viên theo hình dạng gói (tất cả `[chưa kiểm chứng]`, cần datasheet hãng)

| Ứng viên | Hãng | Gói thường gặp | Thạch anh ngoài | Ghi chú cho carrier |
|---|---|---|---|---|
| CH340C | WCH | SOP-16 | Không (có dao động nội) | Không khớp hình dạng QFN trong ảnh |
| CH340G | WCH | SOP-16 | Có (12 MHz) | Không khớp hình dạng QFN, ảnh không thấy thạch anh |
| CH340K | WCH | QFN | Không | Ứng viên khớp hình dạng, nằm trong họ CH340 |
| CH9102F / CH9102X | WCH | QFN | Không | Không thuộc "họ CH340", thường dùng trên DevKit Type-C mới |
| CP2102 / CP2102N | Silicon Labs | QFN-28 | Không | Ngoài danh sách domain tải; hỏi trước. RD:11 từng ghi lỗi nguồn CP2102 trên bo tham chiếu khác |

Với mỗi ứng viên cần trích từ datasheet khi có: số chân, VCC/V3, chân DTR/RTS, mức logic.

## Ảnh hưởng tới carrier (không phụ thuộc chip)

- Carrier không cần footprint chip này: DevKit là mô-đun cắm vào socket, nên U2 chỉ ảnh hưởng đường USB, nguồn 5 V/3V3 và auto-reset.
- Chân strapping của ESP32 cần giữ không bị carrier kéo khi nạp: GPIO0 và GPIO2 (chế độ boot), MTDI/GPIO12 (điện áp VDD_SDIO), và các chân khác nêu ở `esp32-wroom-32_datasheet_en.pdf` tr.11–12. Nguồn: datasheet Espressif tải ngày 06/11 (datasheets/SOURCES.md).
- Mô-đun trên mẫu có vỏ kim loại dạng ESP32-WROOM-32 `[suy từ ảnh, chưa kiểm chứng đúng phiên bản]`. Kích thước mô-đun theo datasheet: 18,00 × 25,50 × 3,10 mm (tr.3, tr.36). Đây là kích thước mô-đun, không phải bo DevKit.

## Việc founder cần làm để đóng (tối đa 3)

1. Chụp macro `U2` thẳng góc, đủ sáng, thấy chữ khắc, và ghi marking.
2. Cắm mẫu vào PC, đọc VID:PID trong Device Manager (CH340 thường `1A86:7523`, CP210x `10C4:EA60`; `[chưa kiểm chứng PDF]`).
3. Cung cấp URL PDF datasheet chính thức của WCH (trang `CH340DS1_PDF.html` là ứng dụng JavaScript, không tải được PDF trực tiếp).
