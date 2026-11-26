type DigitalLesson = {
  id: string; name: string; model: string; parts: readonly string[]
  goal: string; steps: readonly string[]; scope: string; sources?: readonly { name: string; href: string }[]
}

export const digitalLabLessons = [
  {
    id: 'nand', name: 'Cổng NAND', model: '74HC00', parts: ['logic-74hc00'],
    goal: 'Tự điền bảng chân trị và tìm tổ hợp duy nhất làm Y xuống LOW.',
    steps: ['Đặt A, B và chọn dự đoán cho Y.', 'Bấm Kiểm đầu ra. Lặp cho đủ bốn tổ hợp rồi giải thích vì sao nối chung A và B cho chức năng đảo.'],
    scope: 'Model một cổng logic nhị phân của 74HC00. Mức điện áp, độ trễ và tải nằm ngoài phạm vi bài này.',
    sources: [{ name: 'Texas Instruments · 74HC00', href: 'https://www.ti.com/lit/ds/symlink/sn74hc00.pdf' }],
  },
  {
    id: 'bcd', name: 'Giải mã LED 7 đoạn', model: '74HC4511', parts: ['logic-74hc4511', 'seven-segment'],
    goal: 'Phân biệt mã BCD đang nhập, mã đã giữ và các tín hiệu ưu tiên của màn hình.',
    steps: ['Áp dụng mã 5. Bật Giữ mã, đổi đầu vào sang 2 rồi áp dụng lại. Kiểm tra các đoạn có giữ nguyên.', 'Tắt Giữ mã, thử mã 12. Bật cả Tắt hiển thị và Thử đèn để kiểm tín hiệu nào được ưu tiên.'],
    scope: 'Đầu ra tích cực mức cao cho hiển thị cathode chung. Model không có trễ chuyển mức. Mã chốt ban đầu chưa xác định.',
    sources: [{ name: 'Texas Instruments · 74HC4511', href: 'https://www.ti.com/lit/ds/symlink/cd74hc4511.pdf' }],
  },
  {
    id: 'timer', name: 'Timer 555 tự dao động', model: 'NE555', parts: ['timer-ne555', 'resistor', 'capacitor'],
    goal: 'Liên hệ điện trở và tụ với chu kỳ, tần số và thời gian đầu ra ở HIGH.',
    steps: ['Ghi chu kỳ khi Rₐ = Rᵦ = 10 kΩ và C = 10 µF.', 'Giảm C xuống 1 µF. So sánh chu kỳ và duty HIGH. Kéo RESET xuống LOW để xem đầu ra khi ngừng dao động.'],
    scope: 'Model thời gian ở chế độ astable theo công thức datasheet. Phép thử bỏ qua quá trình khởi động, dung sai và tải đầu ra.',
    sources: [{ name: 'Texas Instruments · NE555', href: 'https://www.ti.com/lit/ds/symlink/ne555.pdf' }],
  },
  {
    id: 'lcd', name: 'Gửi chữ tới LCD qua I²C', model: 'LCD 1602 · PCF8574 + HD44780', parts: ['lcd1602'],
    goal: 'Tìm địa chỉ, gửi hai dòng ký tự, rồi phân biệt lỗi địa chỉ với mất nguồn.',
    steps: ['Quét bus ảo rồi chọn địa chỉ có ACK để gửi. Đổi nội dung một dòng và xem byte cổng tạo ảnh hưởng thế nào.', 'Gửi sang địa chỉ kia để thấy NACK. Tắt nguồn, quét lại, rồi bật nguồn và khôi phục điều kiện đúng.'],
    scope: 'Mô hình backpack ảo dùng ghi 4 bit và bộ nhớ ký tự 16 × 2. Nội dung dùng ASCII. Địa chỉ mẫu 0x27 và 0x3F đại diện hai dải của PCF8574 và PCF8574A. Mỗi lần gửi dựng trạng thái mới.',
    sources: [{ name: 'Texas Instruments · PCF8574', href: 'https://www.ti.com/product/PCF8574' }, { name: 'Espressif Component Registry · ví dụ HD44780', href: 'https://components.espressif.com/components/esp-idf-lib/hd44780/versions/1.2.6/examples/i2c?language=en' }],
  },
  {
    id: 'oled', name: 'Ghi điểm ảnh OLED qua I²C', model: 'SSD1306 · 128 × 64', parts: ['oled'],
    goal: 'Dùng một byte cho tám điểm theo chiều dọc và định vị dải đó theo page.',
    steps: ['Ghi 0xAA vào page 0 và đếm số điểm sáng. Đổi sang 0xFF và so sánh.', 'Ghi cùng dữ liệu ở page 7 để chuyển dải ảnh. Thử địa chỉ sai hoặc ngắt nguồn và quan sát ACK/NACK.'],
    scope: 'Mô hình bộ nhớ màn hình với page addressing, bật/tắt hiển thị và giao dịch I²C mức byte. Mỗi lần ghi dựng trạng thái mới. Timing bus và các lệnh mở rộng nằm ngoài phạm vi.',
    sources: [{ name: 'Solomon Systech · SSD1306', href: 'https://www.solomon-systech.com/en/product/SSD1306' }, { name: 'NXP · đặc tả I²C', href: 'https://www.nxp.com/docs/en/user-guide/UM10204.pdf' }],
  },
  {
    id: 'matrix', name: 'Điều khiển LED matrix', model: 'MAX7219 · 8 × 8', parts: ['display-max7219'],
    goal: 'Tạo hình qua các thanh ghi theo hàng và quan sát dữ liệu còn trong shutdown.',
    steps: ['Ghi 0x81 vào hàng 1 rồi 0xFF vào hàng 2. Dự đoán tổng số điểm sáng trước lần ghi thứ hai.', 'Bật Shutdown rồi ghi tiếp. Tắt Shutdown và xem dữ liệu đã ghi. Bật Thử tất cả LED ở cả hai chế độ.'],
    scope: 'Từ lệnh nối tiếp 16 bit được áp dụng lên thanh ghi của một chip ở chế độ raw. Góc nhìn, độ sáng và tốc độ quét module thực có thể khác.',
    sources: [{ name: 'Analog Devices · MAX7219', href: 'https://www.analog.com/media/en/technical-documentation/data-sheets/MAX7219-MAX7221.pdf' }],
  },
  {
    id: 'firmware', name: 'Chạy firmware Blink', model: 'ATmega328P · AVR8js', parts: ['arduino-uno'],
    goal: 'Dùng mẫu Intel HEX có sẵn để quan sát chính firmware chuyển mức LED D13 trong emulator.',
    steps: ['Mở trình chạy HEX và chọn Nạp HEX biên dịch từ Arduino IDE.', 'Chọn Arduino Uno R3, xác nhận đúng target và bấm chạy. Ghi số chuyển mức D13 và thời gian mô phỏng trước khi thử lại.'],
    scope: 'Bài dùng firmware Blink đã có của Arduino Uno R3. AVR8js thực thi firmware trong trình duyệt với một cửa sổ thời gian giới hạn. Bài này không ghi thiết bị USB.',
  },
  {
    id: 'wireless', name: 'Gửi nhiệt độ qua Wi-Fi và MQTT', model: 'Kịch bản mạng ảo · MQTT QoS 0', parts: [],
    goal: 'Xác định bản tin dừng ở Wi-Fi, broker hay bước khớp topic của thuê bao.',
    steps: ['Chọn kết nối Wi-Fi thành công, broker đang chạy và hai topic giống nhau. Gửi bản tin rồi đọc giá trị ở thuê bao.', 'Đổi từng yếu tố: sai mật khẩu, ngoài vùng phủ, broker ngoại tuyến hoặc thuê bao nghe topic khác. Ghi nguyên nhân và khôi phục cấu hình đúng.'],
    scope: 'Kịch bản logic mô phỏng một lần gửi QoS 0 với topic khớp chính xác. Trình duyệt xử lý nội bộ, không gửi radio hay mở kết nối tới broker thật.',
    sources: [{ name: 'OASIS · MQTT 3.1.1', href: 'https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html' }],
  },
] as const satisfies readonly DigitalLesson[]

export type DigitalLabId = typeof digitalLabLessons[number]['id']
