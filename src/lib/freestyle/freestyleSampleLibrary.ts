import type { FreestyleLanguage } from './freestyleCircuit'

export const freestyleSamples = [
  {
    id: 'blink', level: 'GPIO cơ bản', title: 'Nháy LED', mode: 'run',
    parts: ['led', 'resistor'],
    summary: 'LED và điện trở 220 Ω nối với chân GPIO LED.',
    instrument: 'wave',
    observe: 'Bấm Chạy. Trong Dạng sóng, kênh chân LED luân phiên HIGH và LOW, mỗi mức khoảng 500 ms với code mẫu.',
    challenge: 'Giảm hai khoảng chờ từ 500 ms xuống 250 ms và so sánh chu kỳ.',
  },
  {
    id: 'button-led', level: 'GPIO cơ bản', title: 'Nút nhấn bật LED', mode: 'run',
    parts: ['button', 'led', 'resistor'],
    summary: 'Nút nối đầu vào GPIO xuống GND. Giữ nút để LED sáng.',
    instrument: 'wave',
    observe: 'Bấm Chạy rồi giữ và thả nút. So sánh hai kênh: đầu vào xuống LOW khi nhấn, còn chân LED lên HIGH.',
    challenge: 'Đảo điều kiện trong code để LED sáng khi thả nút.',
  },
  {
    id: 'dual-led', level: 'GPIO cơ bản', title: 'Hai LED luân phiên', mode: 'run',
    parts: ['led', 'resistor'],
    summary: 'Hai GPIO điều khiển hai LED, mỗi LED có một điện trở.',
    instrument: 'wave',
    observe: 'Bấm Chạy và xem hai kênh LED. Trong mỗi pha, kênh của LED đang sáng ở HIGH, kênh còn lại ở LOW.',
    challenge: 'Đổi thời gian của một pha và so sánh hai dạng sóng.',
  },
  {
    id: 'keypad-five', level: 'GPIO cơ bản', title: 'Phím 5 bật LED', mode: 'run',
    parts: ['led', 'resistor'],
    summary: 'Phím 5 trên keypad đóng R2–C2 và kéo đầu vào xuống LOW.',
    instrument: 'observe',
    observe: 'Bấm Chạy rồi chọn phím 5 và phím 6. LED sáng ở phím 5 và tắt ở phím 6 với dây nối mẫu.',
    challenge: 'Chuyển dây từ C2 sang C3 và thử lại phím 6.',
  },
  {
    id: 'pot-dimmer', level: 'Cảm biến và PWM', title: 'Biến trở chỉnh độ sáng', mode: 'run',
    parts: ['potentiometer', 'led', 'resistor'],
    summary: 'Đọc ADC ở cần gạt, đưa kết quả vào PWM của LED.',
    instrument: 'observe',
    observe: 'Bấm Chạy và tăng giá trị biến trở. Số ADC trên Serial và độ sáng LED tăng theo cần gạt.',
    challenge: 'Giới hạn PWM tối đa trong code rồi so sánh ở hai đầu cần gạt.',
  },
  {
    id: 'night-light', level: 'Cảm biến và PWM', title: 'Đèn bật khi trời tối', mode: 'run',
    parts: ['ldr', 'resistor', 'led'],
    summary: 'Quang trở và điện trở tạo cầu chia áp cho đầu vào analog.',
    instrument: 'observe',
    observe: 'Bấm Chạy và thay đổi thanh ánh sáng. Đọc giá trị Serial rồi tìm ngưỡng LED đổi trạng thái.',
    challenge: 'Đổi ngưỡng ADC trong code và tìm lại điểm đổi trạng thái.',
  },
  {
    id: 'dht-demo', level: 'Cảm biến và PWM', title: 'Nhiệt độ và độ ẩm DHT22', mode: 'run',
    parts: ['dht22', 'resistor'],
    summary: 'Đọc nhiệt độ và độ ẩm từ DATA có điện trở kéo lên.',
    instrument: 'observe',
    observe: 'Đặt 31 °C và 64% RH, bấm Chạy rồi xem Serial trong Quan sát. Bản ghi lần đọc tiếp theo phải gần 31 °C và 64% RH.',
    challenge: 'Đổi từng đại lượng một để nhận ra giá trị tương ứng trong dòng Serial.',
  },
  {
    id: 'ultrasonic', level: 'Cảm biến và PWM', title: 'Siêu âm đo khoảng cách', mode: 'run',
    parts: ['hc-sr04'],
    summary: 'Phát TRIG và đo độ rộng ECHO theo khoảng cách đã đặt. Board 3,3 V dùng chia áp ECHO.',
    instrument: 'observe',
    observe: 'Đặt vật cản 42 cm và bấm Chạy. Kết quả Serial hiển thị khoảng 42 cm.',
    challenge: 'Tăng khoảng cách vật cản và so sánh số đọc mới.',
  },
  {
    id: 'seg-display', level: 'Hiển thị và tải', title: 'Hiện số 7 trên LED 7 đoạn', mode: 'run',
    parts: ['seven-segment', 'resistor'],
    summary: 'Ba chân GPIO bật các đoạn A, B và C của LED 7 đoạn cathode chung.',
    instrument: 'breadboard',
    observe: 'Bấm Chạy và nhìn LED 7 đoạn trong mạch 2D. Ba nét A, B và C tạo thành số 7.',
    challenge: 'Tắt riêng đoạn A trong code và quan sát hình thay đổi.',
  },
  {
    id: 'servo-pulse', level: 'Hiển thị và tải', title: 'Xung điều khiển servo', mode: 'run',
    parts: ['servo'],
    summary: 'Mạch dùng nguồn tải riêng và một GPIO phát xung theo chu kỳ 20 ms.',
    instrument: 'observe',
    observe: 'Bấm Chạy và mở Quan sát. Mẫu phát xung HIGH 1,5 ms mỗi 20 ms. Góc servo mô phỏng ổn định quanh 90°.',
    challenge: 'Đổi độ rộng xung từ 1500 µs thành 1200 µs và tăng thời gian LOW để giữ chu kỳ.',
  },
  {
    id: 'motor', level: 'Hiển thị và tải', title: 'Động cơ DC qua transistor', mode: 'run',
    parts: ['dc-motor', 'transistor-bjt', 'diode', 'resistor'],
    summary: 'GPIO điều khiển transistor, motor dùng nguồn tải riêng và diode dập xung.',
    instrument: 'observe',
    observe: 'Bấm Chạy và đọc Serial. Trạng thái CHẠY và DỪNG lặp lại theo hai khoảng chờ trong code.',
    challenge: 'Rút ngắn thời gian chạy từ 2 giây xuống 1 giây.',
  },
  {
    id: 'relay-led', level: 'Hiển thị và tải', title: 'Relay đóng đèn tải thấp áp', mode: 'run',
    parts: ['relay', 'led', 'resistor'],
    summary: 'GPIO điều khiển relay, tiếp điểm NO đóng mạch LED từ nguồn tải riêng.',
    instrument: 'observe',
    observe: 'Bấm Chạy và so sánh trạng thái relay với LED. Ở mẫu tiếp điểm NO, LED sáng khi relay đóng đường cấp nguồn.',
    challenge: 'Chuyển sang tiếp điểm NC và so sánh khi chân điều khiển ở LOW.',
  },
] as const

export type FreestyleSampleId = typeof freestyleSamples[number]['id']
export const findFreestyleSample = (id: string | undefined) => freestyleSamples.find(sample => sample.id === id)

/** The four original samples ship both Arduino C++ and Pico MicroPython. */
export function sampleLanguage(id: FreestyleSampleId, language: FreestyleLanguage): FreestyleLanguage {
  return ['blink', 'button-led', 'pot-dimmer', 'motor'].includes(id) ? language : 'cpp'
}
