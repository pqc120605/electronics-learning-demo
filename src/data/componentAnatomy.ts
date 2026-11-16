/**
 * Cấu tạo linh kiện/module (2026-11-14, Đợt 2): các linh kiện thật có trên mạch, vị trí tương đối,
 * vai trò điện và nhãn chân header. Vẽ lại bằng SVG của Mạch Mở, không sao chép ảnh/CAD hãng.
 * Bố cục là sơ đồ giáo dục theo bản phổ biến; bản clone/revision khác có thể đổi vị trí hoặc linh kiện.
 */

export type AnatomyShape = 'chip' | 'module' | 'crystal' | 'cap' | 'elcap' | 'resistor' | 'led' | 'button' | 'pot' | 'transducer' | 'terminal' | 'relay' | 'heatsink' | 'usb' | 'lens' | 'display' | 'jumper' | 'diode' | 'sensor'

export type AnatomyPart = {
  id: string
  /** Nhãn in trên sơ đồ (designator hoặc mã IC). */
  label: string
  name: string
  role: string
  shape: AnatomyShape
  x: number
  y: number
  w: number
  h: number
}

export type AnatomyPin = { label: string; role: string; kind: 'power' | 'ground' | 'signal' | 'analog' | 'bus' }

export type ComponentAnatomy = {
  id: string
  title: string
  board: { w: number; h: number; color: string }
  pins: AnatomyPin[]
  /** Header ở cạnh nào của board. */
  pinEdge: 'bottom' | 'left' | 'top'
  parts: AnatomyPart[]
  note: string
  sources: string[]
}

const BLUE = '#1f4e8c'
const GREEN = '#1d5a3c'
const BLACK = '#24272e'
const RED = '#8a2a24'

export const componentAnatomies: Readonly<Record<string, ComponentAnatomy>> = {
  'hc-sr04': {
    id: 'hc-sr04', title: 'Cảm biến siêu âm HC-SR04', board: { w: 450, h: 200, color: BLUE }, pinEdge: 'bottom',
    pins: [
      { label: 'VCC', role: 'Nguồn 5 V', kind: 'power' },
      { label: 'Trig', role: 'Vào: xung ≥10 µs để phát 8 chu kỳ 40 kHz', kind: 'signal' },
      { label: 'Echo', role: 'Ra: mức HIGH kéo dài bằng thời gian sóng đi–về (mức 5 V)', kind: 'signal' },
      { label: 'GND', role: 'Đất chung', kind: 'ground' },
    ],
    parts: [
      { id: 't', label: 'T', name: 'Đầu phát siêu âm', role: 'Biến đổi xung điện thành sóng âm 40 kHz.', shape: 'transducer', x: 30, y: 30, w: 120, h: 120 },
      { id: 'r', label: 'R', name: 'Đầu thu siêu âm', role: 'Nhận sóng phản xạ, tạo tín hiệu điện rất nhỏ.', shape: 'transducer', x: 300, y: 30, w: 120, h: 120 },
      { id: 'mcu', label: 'MCU', name: 'Vi điều khiển trên module', role: 'Tạo 8 chu kỳ 40 kHz khi có Trig và đo thời gian để xuất Echo (mã IC thay đổi theo bản clone).', shape: 'chip', x: 178, y: 40, w: 94, h: 40 },
      { id: 'drv', label: 'DRV', name: 'IC lái đầu phát', role: 'Nâng biên độ xung lái đầu phát (thường là IC kiểu MAX232 tạo điện áp cao hơn 5 V).', shape: 'chip', x: 178, y: 92, w: 94, h: 30 },
      { id: 'amp', label: 'AMP', name: 'Khuếch đại thu', role: 'Op-amp khuếch đại và so sánh tín hiệu từ đầu thu.', shape: 'chip', x: 178, y: 132, w: 94, h: 24 },
      { id: 'y1', label: 'Y1', name: 'Thạch anh', role: 'Dao động chuẩn cho MCU trên module.', shape: 'crystal', x: 200, y: 12, w: 50, h: 18 },
    ],
    note: 'HC-SR04 bản 5 V: chân Echo ra 5 V — cần chia áp trước khi vào GPIO 3,3 V của ESP32. Bản HC-SR04P chạy được 3–5,5 V.',
    sources: ['Datasheet HC-SR04 (ElecFreaks / Cytron)'],
  },
  'h-bridge-l298n': {
    id: 'h-bridge-l298n', title: 'Module cầu H L298N', board: { w: 430, h: 300, color: RED }, pinEdge: 'bottom',
    pins: [
      { label: 'ENA', role: 'Cho phép kênh A (PWM tốc độ); có jumper nối 5 V', kind: 'signal' },
      { label: 'IN1', role: 'Chiều kênh A', kind: 'signal' },
      { label: 'IN2', role: 'Chiều kênh A', kind: 'signal' },
      { label: 'IN3', role: 'Chiều kênh B', kind: 'signal' },
      { label: 'IN4', role: 'Chiều kênh B', kind: 'signal' },
      { label: 'ENB', role: 'Cho phép kênh B (PWM tốc độ)', kind: 'signal' },
    ],
    parts: [
      { id: 'ic', label: 'L298N', name: 'IC cầu H kép L298N', role: 'Hai cầu H BJT, tối đa khoảng 2 A mỗi kênh; sụt áp trên cầu khoảng 2 V hoặc hơn.', shape: 'chip', x: 150, y: 110, w: 130, h: 50 },
      { id: 'hs', label: 'HS', name: 'Tản nhiệt', role: 'Tản nhiệt cho L298N (công suất tiêu hao lớn do sụt áp BJT).', shape: 'heatsink', x: 140, y: 20, w: 150, h: 80 },
      { id: 'u2', label: '78M05', name: 'Ổn áp 5 V', role: 'Cấp 5 V logic từ nguồn motor khi jumper 5V-EN gắn (nguồn vào ≤12 V).', shape: 'chip', x: 300, y: 180, w: 60, h: 34 },
      { id: 'jp', label: '5V-EN', name: 'Jumper bật ổn áp', role: 'Gỡ jumper khi nguồn motor >12 V và cấp 5 V riêng.', shape: 'jumper', x: 300, y: 225, w: 40, h: 16 },
      { id: 'd', label: 'D1–D8', name: 'Diode chống dòng ngược', role: 'Dập sức điện động ngược từ cuộn dây motor.', shape: 'diode', x: 40, y: 180, w: 100, h: 30 },
      { id: 'c', label: 'C1, C2', name: 'Tụ lọc nguồn', role: 'Lọc nguồn motor và 5 V.', shape: 'elcap', x: 190, y: 180, w: 70, h: 40 },
      { id: 'outa', label: 'OUT1/2', name: 'Cọc vít motor A', role: 'Nối hai dây motor A.', shape: 'terminal', x: 15, y: 60, w: 50, h: 90 },
      { id: 'outb', label: 'OUT3/4', name: 'Cọc vít motor B', role: 'Nối hai dây motor B.', shape: 'terminal', x: 365, y: 60, w: 50, h: 90 },
      { id: 'pwr', label: '12V GND 5V', name: 'Cọc vít nguồn', role: 'Nguồn motor, đất chung (nối GND vi điều khiển) và 5 V ra/vào.', shape: 'terminal', x: 150, y: 240, w: 130, h: 40 },
      { id: 'led', label: 'PWR', name: 'LED nguồn', role: 'Báo có 5 V.', shape: 'led', x: 60, y: 240, w: 22, h: 22 },
    ],
    note: 'GND của module phải nối chung GND vi điều khiển. L298N kém hiệu suất; TB6612 sụt áp thấp hơn nhiều cho motor nhỏ.',
    sources: ['STMicroelectronics L298 datasheet'],
  },
  relay: {
    id: 'relay', title: 'Module relay 1 kênh 5 V', board: { w: 380, h: 200, color: BLUE }, pinEdge: 'left',
    pins: [
      { label: 'VCC', role: 'Nguồn cuộn relay 5 V', kind: 'power' },
      { label: 'GND', role: 'Đất', kind: 'ground' },
      { label: 'IN', role: 'Tín hiệu điều khiển (nhiều module kích mức LOW)', kind: 'signal' },
    ],
    parts: [
      { id: 'k1', label: 'K1', name: 'Relay 5 V (kiểu SRD-05VDC)', role: 'Cuộn dây hút tiếp điểm; tiếp điểm cách ly với mạch điều khiển.', shape: 'relay', x: 150, y: 40, w: 120, h: 90 },
      { id: 'q1', label: 'Q1', name: 'Transistor lái', role: 'Khuếch đại dòng từ GPIO để cấp cho cuộn relay (~70 mA).', shape: 'chip', x: 70, y: 60, w: 34, h: 26 },
      { id: 'd1', label: 'D1', name: 'Diode flyback', role: 'Dập điện áp cảm ứng khi cuộn relay ngắt.', shape: 'diode', x: 70, y: 100, w: 40, h: 16 },
      { id: 'u1', label: 'U1', name: 'Opto (chỉ có trên một số module)', role: 'Cách ly quang tín hiệu IN với phần cuộn relay.', shape: 'chip', x: 70, y: 20, w: 40, h: 28 },
      { id: 'led', label: 'LED', name: 'LED báo kích', role: 'Sáng khi cuộn relay được cấp điện.', shape: 'led', x: 120, y: 150, w: 20, h: 20 },
      { id: 'term', label: 'NO COM NC', name: 'Cọc vít tiếp điểm', role: 'COM nối chung; NO hở khi chưa kích; NC đóng khi chưa kích.', shape: 'terminal', x: 290, y: 40, w: 70, h: 120 },
    ],
    note: 'Phía tiếp điểm có thể nối điện lưới: chỉ thao tác khi đã ngắt nguồn và có người hướng dẫn.',
    sources: ['Songle SRD datasheet'],
  },
  oled: {
    id: 'oled', title: 'Màn OLED 0,96" SSD1306 I²C', board: { w: 300, h: 280, color: BLUE }, pinEdge: 'top',
    pins: [
      { label: 'GND', role: 'Đất', kind: 'ground' },
      { label: 'VCC', role: '3,3–5 V (có LDO trên module)', kind: 'power' },
      { label: 'SCL', role: 'Xung nhịp I²C', kind: 'bus' },
      { label: 'SDA', role: 'Dữ liệu I²C (địa chỉ thường 0x3C)', kind: 'bus' },
    ],
    parts: [
      { id: 'panel', label: '128×64', name: 'Tấm kính OLED', role: 'Ma trận 128×64 điểm tự phát sáng; driver SSD1306 nằm trên cáp dẻo sau kính.', shape: 'display', x: 20, y: 60, w: 260, h: 150 },
      { id: 'ldo', label: 'U2', name: 'LDO 3,3 V', role: 'Hạ nguồn VCC xuống 3,3 V cho SSD1306.', shape: 'chip', x: 40, y: 225, w: 40, h: 24 },
      { id: 'cp', label: 'C', name: 'Tụ bơm điện tích', role: 'Cho bộ tạo điện áp cao điều khiển OLED.', shape: 'cap', x: 100, y: 228, w: 60, h: 18 },
      { id: 'pu', label: 'R', name: 'Điện trở kéo lên I²C', role: 'Kéo SDA/SCL lên VCC (≈4,7–10 kΩ).', shape: 'resistor', x: 180, y: 228, w: 60, h: 18 },
    ],
    note: 'Một số module đổi thứ tự VCC/GND; kiểm tra chữ in trên board trước khi cấp nguồn.',
    sources: ['Solomon Systech SSD1306 datasheet'],
  },
  mpu6050: {
    id: 'mpu6050', title: 'Module GY-521 (MPU-6050)', board: { w: 300, h: 220, color: BLUE }, pinEdge: 'bottom',
    pins: [
      { label: 'VCC', role: '3,3–5 V (có LDO)', kind: 'power' },
      { label: 'GND', role: 'Đất', kind: 'ground' },
      { label: 'SCL', role: 'I²C clock', kind: 'bus' },
      { label: 'SDA', role: 'I²C data', kind: 'bus' },
      { label: 'XDA', role: 'I²C phụ (cảm biến ngoài)', kind: 'bus' },
      { label: 'XCL', role: 'I²C phụ clock', kind: 'bus' },
      { label: 'AD0', role: 'Chọn địa chỉ 0x68 (LOW) / 0x69 (HIGH)', kind: 'signal' },
      { label: 'INT', role: 'Ngắt khi có dữ liệu mới', kind: 'signal' },
    ],
    parts: [
      { id: 'imu', label: 'MPU-6050', name: 'Cảm biến 6 trục', role: 'Gia tốc kế 3 trục + con quay 3 trục, ADC 16 bit, giao tiếp I²C.', shape: 'chip', x: 115, y: 70, w: 70, h: 70 },
      { id: 'ldo', label: 'U2', name: 'LDO 3,3 V', role: 'Cấp 3,3 V cho MPU-6050.', shape: 'chip', x: 30, y: 40, w: 50, h: 26 },
      { id: 'pu', label: 'R', name: 'Điện trở kéo lên I²C', role: 'Kéo SDA/SCL lên 3,3 V trên module.', shape: 'resistor', x: 210, y: 40, w: 60, h: 18 },
      { id: 'led', label: 'LED', name: 'LED nguồn', role: 'Báo có nguồn.', shape: 'led', x: 230, y: 120, w: 20, h: 20 },
    ],
    note: 'Trục X/Y in trên board giúp xác định hướng đặt cảm biến.',
    sources: ['InvenSense MPU-6000/6050 Product Specification'],
  },
  pir: {
    id: 'pir', title: 'Cảm biến chuyển động PIR HC-SR501', board: { w: 320, h: 260, color: GREEN }, pinEdge: 'bottom',
    pins: [
      { label: 'VCC', role: '5–20 V', kind: 'power' },
      { label: 'OUT', role: 'Ra 3,3 V khi phát hiện chuyển động', kind: 'signal' },
      { label: 'GND', role: 'Đất', kind: 'ground' },
    ],
    parts: [
      { id: 'lens', label: 'Fresnel', name: 'Thấu kính Fresnel', role: 'Hội tụ bức xạ hồng ngoại từ nhiều vùng lên cảm biến.', shape: 'lens', x: 80, y: 20, w: 160, h: 140 },
      { id: 'biss', label: 'BISS0001', name: 'IC xử lý PIR', role: 'Khuếch đại, so sánh và tạo thời gian giữ đầu ra.', shape: 'chip', x: 120, y: 175, w: 80, h: 30 },
      { id: 'sx', label: 'Sx', name: 'Biến trở độ nhạy', role: 'Chỉnh khoảng cách phát hiện (~3–7 m).', shape: 'pot', x: 30, y: 170, w: 40, h: 40 },
      { id: 'tx', label: 'Tx', name: 'Biến trở thời gian giữ', role: 'Chỉnh thời gian OUT giữ HIGH (~3 s đến vài phút).', shape: 'pot', x: 250, y: 170, w: 40, h: 40 },
      { id: 'jp', label: 'H/L', name: 'Jumper chế độ', role: 'H: kích lặp lại; L: kích một lần.', shape: 'jumper', x: 215, y: 215, w: 30, h: 16 },
    ],
    note: 'Sau khi cấp nguồn cần khoảng 30–60 s để cảm biến ổn định.',
    sources: ['HC-SR501 datasheet'],
  },
  'ir-obstacle': {
    id: 'ir-obstacle', title: 'Module tránh vật cản hồng ngoại', board: { w: 340, h: 170, color: BLUE }, pinEdge: 'left',
    pins: [
      { label: 'VCC', role: '3,3–5 V', kind: 'power' },
      { label: 'GND', role: 'Đất', kind: 'ground' },
      { label: 'OUT', role: 'LOW khi có vật cản (active LOW)', kind: 'signal' },
    ],
    parts: [
      { id: 'tx', label: 'IR LED', name: 'LED phát hồng ngoại', role: 'Phát ánh sáng hồng ngoại liên tục.', shape: 'led', x: 270, y: 30, w: 40, h: 40 },
      { id: 'rx', label: 'PD', name: 'Photodiode thu', role: 'Nhận ánh sáng phản xạ từ vật cản.', shape: 'sensor', x: 270, y: 100, w: 40, h: 40 },
      { id: 'cmp', label: 'LM393', name: 'IC so sánh', role: 'So tín hiệu thu với ngưỡng để ra mức số.', shape: 'chip', x: 140, y: 60, w: 70, h: 44 },
      { id: 'pot', label: 'VR', name: 'Biến trở ngưỡng', role: 'Chỉnh khoảng cách phát hiện.', shape: 'pot', x: 80, y: 60, w: 40, h: 40 },
      { id: 'lp', label: 'PWR', name: 'LED nguồn', role: 'Báo có nguồn.', shape: 'led', x: 150, y: 120, w: 18, h: 18 },
      { id: 'lo', label: 'OBS', name: 'LED báo vật cản', role: 'Sáng khi OUT = LOW.', shape: 'led', x: 185, y: 120, w: 18, h: 18 },
    ],
    note: 'Ánh nắng trực tiếp và bề mặt đen làm giảm khoảng cách phát hiện.',
    sources: ['TI LM393 datasheet'],
  },
  'esp32-devkit': {
    id: 'esp32-devkit', title: 'ESP32 DevKit V1 (bản 30 chân phổ biến)', board: { w: 520, h: 230, color: BLACK }, pinEdge: 'bottom',
    pins: [
      { label: '3V3', role: 'Ra 3,3 V từ LDO', kind: 'power' },
      { label: 'GND', role: 'Đất', kind: 'ground' },
      { label: 'GPIO', role: 'Chân I/O 3,3 V, không chịu 5 V', kind: 'signal' },
      { label: 'ADC', role: 'ADC1 dùng được khi bật WiFi (GPIO 32–39)', kind: 'analog' },
      { label: 'VIN', role: 'Vào 5 V (từ USB hoặc nguồn ngoài)', kind: 'power' },
    ],
    parts: [
      { id: 'wroom', label: 'ESP32-WROOM-32', name: 'Module ESP32-WROOM-32', role: 'Chip ESP32 (2 nhân Xtensa LX6 240 MHz) + flash 4 MB + anten PCB, có vỏ chống nhiễu.', shape: 'module', x: 300, y: 30, w: 200, h: 150 },
      { id: 'usb', label: 'USB', name: 'Cổng micro-USB', role: 'Cấp 5 V và nạp code qua chip USB–UART.', shape: 'usb', x: 10, y: 85, w: 44, h: 50 },
      { id: 'uart', label: 'CP2102', name: 'Chip USB–UART', role: 'Chuyển USB sang UART0 để nạp và Serial (có bản dùng CH340).', shape: 'chip', x: 80, y: 80, w: 56, h: 56 },
      { id: 'ldo', label: 'AMS1117', name: 'LDO 3,3 V', role: 'Hạ 5 V xuống 3,3 V cho ESP32 (≈1 A tối đa, tỏa nhiệt).', shape: 'chip', x: 160, y: 30, w: 60, h: 34 },
      { id: 'en', label: 'EN', name: 'Nút reset', role: 'Kéo chân EN xuống để khởi động lại.', shape: 'button', x: 80, y: 165, w: 40, h: 40 },
      { id: 'boot', label: 'BOOT', name: 'Nút BOOT (GPIO0)', role: 'Giữ khi reset để vào chế độ nạp nếu tự nạp thất bại.', shape: 'button', x: 220, y: 165, w: 40, h: 40 },
      { id: 'led2', label: 'LED GPIO2', name: 'LED người dùng', role: 'Nối GPIO 2 (LED_BUILTIN).', shape: 'led', x: 160, y: 120, w: 22, h: 22 },
      { id: 'pled', label: 'PWR', name: 'LED nguồn', role: 'Báo có 3,3 V.', shape: 'led', x: 200, y: 120, w: 22, h: 22 },
      { id: 'q', label: 'Q1, Q2', name: 'Transistor tự nạp', role: 'Dùng DTR/RTS của chip USB–UART để tự kéo EN và GPIO0 khi nạp.', shape: 'chip', x: 160, y: 80, w: 60, h: 26 },
    ],
    note: 'Bản clone khác nhau về chip USB–UART, LED và số chân; đối chiếu chữ in trên board.',
    sources: ['Espressif ESP32-WROOM-32 datasheet', 'Espressif ESP32 DevKitC schematic (tham khảo bố cục)'],
  },
  'arduino-uno': {
    id: 'arduino-uno', title: 'Arduino Uno R3', board: { w: 520, h: 380, color: '#0f6e85' }, pinEdge: 'top',
    pins: [
      { label: 'D0–D13', role: 'I/O 5 V; D0/D1 là UART; ~3,5,6,9,10,11 có PWM', kind: 'signal' },
      { label: 'A0–A5', role: 'ADC 10 bit; A4/A5 là I²C', kind: 'analog' },
      { label: '5V', role: 'Ra 5 V', kind: 'power' },
      { label: '3.3V', role: 'Ra 3,3 V (≤50 mA)', kind: 'power' },
      { label: 'GND', role: 'Đất', kind: 'ground' },
      { label: 'VIN', role: 'Vào 7–12 V qua jack DC', kind: 'power' },
    ],
    parts: [
      { id: 'mcu', label: 'ATmega328P', name: 'Vi điều khiển chính', role: 'AVR 8 bit 16 MHz, flash 32 KB, SRAM 2 KB; chạy sketch.', shape: 'chip', x: 250, y: 230, w: 220, h: 50 },
      { id: 'u3', label: 'ATmega16U2', name: 'Chip USB–serial', role: 'Chuyển USB sang UART của ATmega328P để nạp và Serial.', shape: 'chip', x: 120, y: 70, w: 50, h: 50 },
      { id: 'y1', label: '16 MHz', name: 'Thạch anh/cộng hưởng', role: 'Xung nhịp cho vi điều khiển.', shape: 'crystal', x: 200, y: 245, w: 40, h: 18 },
      { id: 'usb', label: 'USB-B', name: 'Cổng USB-B', role: 'Nạp code và cấp 5 V (có cầu chì polyfuse 500 mA).', shape: 'usb', x: 0, y: 40, w: 70, h: 70 },
      { id: 'dc', label: 'DC', name: 'Jack nguồn DC', role: 'Vào 7–12 V, qua diode bảo vệ và ổn áp 5 V.', shape: 'terminal', x: 0, y: 270, w: 70, h: 70 },
      { id: 'reg', label: 'NCP1117 5V', name: 'Ổn áp 5 V', role: 'Hạ áp từ jack DC xuống 5 V.', shape: 'chip', x: 90, y: 290, w: 54, h: 34 },
      { id: 'reg3', label: 'LP2985 3V3', name: 'Ổn áp 3,3 V', role: 'Cấp chân 3.3V.', shape: 'chip', x: 160, y: 300, w: 44, h: 26 },
      { id: 'rst', label: 'RESET', name: 'Nút reset', role: 'Khởi động lại sketch.', shape: 'button', x: 90, y: 30, w: 40, h: 40 },
      { id: 'l', label: 'L (D13)', name: 'LED người dùng', role: 'Nối D13 qua op-amp đệm.', shape: 'led', x: 260, y: 120, w: 20, h: 20 },
      { id: 'txrx', label: 'TX RX', name: 'LED UART', role: 'Nhấp nháy khi có dữ liệu USB–serial.', shape: 'led', x: 300, y: 120, w: 20, h: 20 },
      { id: 'icsp', label: 'ICSP', name: 'Header ICSP', role: 'Nạp trực tiếp bootloader/firmware qua SPI.', shape: 'jumper', x: 470, y: 150, w: 40, h: 60 },
    ],
    note: 'Thông số theo Arduino Uno R3 chính hãng; bản clone thường dùng CH340 thay ATmega16U2.',
    sources: ['Arduino UNO R3 datasheet & schematic (arduino.cc, CC BY-SA)'],
  },
  // Positions scale the layout in scripts/build-stm32-education-boards.py (53.34 × 22.86 mm × 9.75).
  'stm32-blue-pill': {
    id: 'stm32-blue-pill', title: 'STM32F103C8T6 "Blue Pill" (bản phổ biến)', board: { w: 520, h: 223, color: BLUE }, pinEdge: 'bottom',
    pins: [
      { label: 'PA0–PA15, PB0–PB15, PC13–PC15', role: 'GPIO 3,3 V; nhiều chân chịu 5 V (FT) nhưng không phải tất cả, xem datasheet', kind: 'signal' },
      { label: 'PA0–PA7, PB0–PB1', role: 'ADC 12 bit', kind: 'analog' },
      { label: '3.3', role: 'Ra 3,3 V từ LDO', kind: 'power' },
      { label: '5V', role: 'Vào/ra 5 V của cổng USB', kind: 'power' },
      { label: 'G', role: 'Đất', kind: 'ground' },
      { label: 'R / VB', role: 'Reset (NRST) / pin dự phòng VBAT', kind: 'power' },
    ],
    parts: [
      { id: 'mcu', label: 'STM32F103C8T6', name: 'Vi điều khiển chính', role: 'Arm Cortex-M3 72 MHz, flash 64 KB (thường đọc được 128 KB), SRAM 20 KB; vỏ LQFP-48 xoay 45°.', shape: 'chip', x: 212, y: 60, w: 100, h: 100 },
      { id: 'usb', label: 'micro-USB', name: 'Cổng micro-USB', role: 'Cấp 5 V và USB device của STM32 (không có chip USB–UART; bootloader gốc không nạp qua USB).', shape: 'usb', x: 0, y: 80, w: 40, h: 64 },
      { id: 'y1', label: '8 MHz', name: 'Thạch anh HSE', role: 'Xung cho PLL lên 72 MHz.', shape: 'crystal', x: 86, y: 92, w: 120, h: 40 },
      { id: 'y2', label: '32.768 kHz', name: 'Thạch anh RTC (LSE)', role: 'Đồng hồ thời gian thực.', shape: 'crystal', x: 300, y: 148, w: 34, h: 16 },
      { id: 'ldo', label: 'LDO 3V3', name: 'Ổn áp 3,3 V', role: 'Hạ 5 V từ USB xuống 3,3 V (thường RT9193/662K, dòng nhỏ).', shape: 'chip', x: 64, y: 54, w: 30, h: 30 },
      { id: 'boot', label: 'BOOT0/BOOT1', name: 'Jumper chọn chế độ khởi động', role: 'BOOT0=1 khi reset để nạp qua UART1 (PA9/PA10).', shape: 'jumper', x: 400, y: 74, w: 50, h: 34 },
      { id: 'rst', label: 'RESET', name: 'Nút reset', role: 'Kéo NRST xuống.', shape: 'button', x: 335, y: 80, w: 62, h: 50 },
      { id: 'swd', label: 'SWD', name: 'Header SWD 4 chân', role: '3.3 · SWDIO · SWCLK · GND để nạp/debug bằng ST-LINK.', shape: 'jumper', x: 495, y: 74, w: 25, h: 76 },
      { id: 'pled', label: 'PWR', name: 'LED nguồn', role: 'Báo có 3,3 V.', shape: 'led', x: 118, y: 50, w: 18, h: 14 },
      { id: 'led', label: 'PC13', name: 'LED người dùng', role: 'Nối PC13, sáng khi PC13 ở mức LOW.', shape: 'led', x: 192, y: 154, w: 18, h: 14 },
    ],
    note: 'Blue Pill là họ board clone không thương hiệu; vị trí linh kiện phụ là ước lượng giáo dục. Một số bản có chip giả/khác (CKS32, GD32) hoặc điện trở D+ sai giá trị.',
    sources: ['STMicroelectronics STM32F103x8 datasheet', 'stm32-base.org · STM32F103C8T6 Blue Pill (pinout, kích thước)'],
  },
  // Positions scale the layout in scripts/build-stm32-education-boards.py (70 × 82.5 mm × 5.71).
  'stm32-f401': {
    id: 'stm32-f401', title: 'STM32 NUCLEO-F401RE (Nucleo-64)', board: { w: 400, h: 471, color: '#f2f2ee' }, pinEdge: 'left',
    pins: [
      { label: 'CN5/CN9 · D0–D15', role: 'Header Arduino: I/O 3,3 V của STM32F401RE (vd. D13 = PA5)', kind: 'signal' },
      { label: 'CN8 · A0–A5', role: 'ADC 12 bit; A4/A5 có thể là I²C tùy solder bridge', kind: 'analog' },
      { label: 'CN6 · 3V3, 5V, VIN', role: 'Nguồn kiểu Arduino', kind: 'power' },
      { label: 'GND', role: 'Đất', kind: 'ground' },
      { label: 'CN7/CN10 · morpho', role: '2×19 chân mỗi bên: gần như mọi chân MCU (xem UM1724)', kind: 'bus' },
    ],
    parts: [
      { id: 'mcu', label: 'STM32F401RET6', name: 'Vi điều khiển chính', role: 'Arm Cortex-M4F 84 MHz, flash 512 KB, SRAM 96 KB; vỏ LQFP-64 xoay 45°.', shape: 'chip', x: 160, y: 268, w: 80, h: 80 },
      { id: 'stlink', label: 'ST-LINK/V2-1', name: 'Mạch nạp/debug tích hợp (STM32F103)', role: 'Nạp, debug SWD và cổng COM ảo (UART2: PA2/PA3) qua USB.', shape: 'chip', x: 170, y: 50, w: 60, h: 60 },
      { id: 'usb', label: 'mini-USB', name: 'Cổng mini-USB (CN1)', role: 'Cấp 5 V và kết nối ST-LINK.', shape: 'usb', x: 172, y: 0, w: 56, h: 32 },
      { id: 'b1', label: 'B1 USER', name: 'Nút người dùng (xanh)', role: 'Nối PC13, mức LOW khi nhấn.', shape: 'button', x: 124, y: 168, w: 36, h: 30 },
      { id: 'b2', label: 'B2 RESET', name: 'Nút reset (đen)', role: 'Kéo NRST của STM32F401RE.', shape: 'button', x: 238, y: 168, w: 36, h: 30 },
      { id: 'ld2', label: 'LD2', name: 'LED người dùng (xanh lá)', role: 'Nối D13/PA5.', shape: 'led', x: 192, y: 202, w: 16, h: 12 },
      { id: 'ld1', label: 'LD1 COM', name: 'LED trạng thái ST-LINK', role: 'Đỏ/xanh theo trạng thái kết nối và giao tiếp.', shape: 'led', x: 266, y: 28, w: 16, h: 12 },
      { id: 'reg', label: 'LD39050 3V3', name: 'Ổn áp 3,3 V (U5)', role: 'Cấp 3,3 V cho MCU từ 5 V.', shape: 'chip', x: 278, y: 130, w: 40, h: 36 },
      { id: 'x2', label: '32.768 kHz', name: 'Thạch anh LSE (X2)', role: 'RTC; xung chính mặc định lấy MCO 8 MHz từ ST-LINK (X3 không lắp).', shape: 'crystal', x: 248, y: 360, w: 20, h: 10 },
      { id: 'morpho', label: 'CN7 · CN10', name: 'Header ST morpho', role: 'Hai hàng 2×19 ở hai mép, đưa ra gần như mọi chân của MCU.', shape: 'jumper', x: 14, y: 194, w: 30, h: 264 },
    ],
    note: 'Bố cục là tái dựng giáo dục từ footprint/model thư viện KiCad theo kích thước công bố; không dựng từ file CAD của ST. Vị trí chính xác xem UM1724.',
    sources: ['ST UM1724 · STM32 Nucleo-64 boards (MB1136)', 'ST STM32F401xD/xE datasheet'],
  },
}

export function getComponentAnatomy(id: string): ComponentAnatomy | undefined {
  return componentAnatomies[id] ?? (id === 'ultrasonic' ? componentAnatomies['hc-sr04'] : id === 'h-bridge' ? componentAnatomies['h-bridge-l298n'] : id === 'ir-sensor' ? componentAnatomies['ir-obstacle'] : undefined)
}
