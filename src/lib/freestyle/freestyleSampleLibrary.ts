import type { FreestyleLanguage } from './freestyleCircuit'

export const freestyleSamples = [
  { id:'blink', level:'GPIO cơ bản', title:'Nháy LED', summary:'LED + điện trở 220 Ω nối chân GPIO LED.', challenge:'Đổi delay từ 500 ms thành 250 ms.', mode:'run' },
  { id:'button-led', level:'GPIO cơ bản', title:'Nút nhấn bật LED', summary:'Nút nối GPIO IN xuống GND; giữ nút thì LED sáng.', challenge:'Đổi điều kiện để LED sáng lúc thả nút.', mode:'run' },
  { id:'dual-led', level:'GPIO cơ bản', title:'Hai LED luân phiên', summary:'Hai GPIO riêng điều khiển hai LED, mỗi LED có một điện trở.', challenge:'Đổi thời gian ở một nửa chu kỳ và so sánh dạng sóng.', mode:'run' },
  { id:'keypad-five', level:'GPIO cơ bản', title:'Phím 5 bật LED', summary:'Chọn phím 5 để đóng R2–C2 và kéo đầu vào xuống LOW.', challenge:'Đổi dây từ C2 sang C3 để chọn phím 6.', mode:'run' },
  { id:'pot-dimmer', level:'Cảm biến và PWM', title:'Biến trở chỉnh độ sáng', summary:'Đọc ADC ở cần gạt, đưa kết quả vào PWM của LED.', challenge:'Giới hạn giá trị PWM lớn nhất còn 128.', mode:'run' },
  { id:'night-light', level:'Cảm biến và PWM', title:'Đèn bật khi trời tối', summary:'Quang trở và điện trở tạo cầu chia áp cho đầu vào analog.', challenge:'Thay ngưỡng ADC và thử thanh ánh sáng.', mode:'run' },
  { id:'dht-demo', level:'Cảm biến và PWM', title:'Nhiệt độ và độ ẩm DHT22', summary:'Đọc nhiệt độ và độ ẩm từ DATA có điện trở kéo lên.', challenge:'Đổi nhiệt độ và độ ẩm, chờ lượt đọc tiếp theo trên Serial.', mode:'run' },
  { id:'ultrasonic', level:'Cảm biến và PWM', title:'Siêu âm đo khoảng cách', summary:'Phát TRIG và đo độ rộng ECHO theo khoảng cách đã đặt. Board 3,3 V dùng chia áp ECHO.', challenge:'Đổi khoảng cách và thời gian chờ ECHO.', mode:'run' },
  { id:'seg-display', level:'Hiển thị và tải', title:'Hiện số 7 trên LED 7 đoạn', summary:'Ba chân riêng sáng các đoạn A, B, C của display cathode chung.', challenge:'Tắt riêng A để quan sát sự thay đổi.', mode:'run' },
  { id:'servo-pulse', level:'Hiển thị và tải', title:'Xung điều khiển servo', summary:'Mạch dùng nguồn tải riêng và một GPIO phát xung 20 ms.', challenge:'Đổi độ rộng xung từ 1500 µs thành 1200 µs và bù thời gian LOW để giữ chu kỳ.', mode:'run' },
  { id:'motor', level:'Hiển thị và tải', title:'Động cơ DC qua transistor', summary:'GPIO qua điện trở điều khiển transistor, nguồn tải riêng và diode dập xung.', challenge:'Đổi thời gian đóng từ 2 giây còn 1 giây.', mode:'run' },
  { id:'relay-led', level:'Hiển thị và tải', title:'Relay đóng đèn tải thấp áp', summary:'GPIO điều khiển đầu vào relay, tiếp điểm NO đóng mạch LED có nguồn tải riêng.', challenge:'Dùng tiếp điểm NC và so sánh lúc GPIO ở LOW.', mode:'run' },
] as const

export type FreestyleSampleId = typeof freestyleSamples[number]['id']
export const findFreestyleSample = (id: string | undefined) => freestyleSamples.find(sample => sample.id === id)

/** The four original samples ship both Arduino C++ and Pico MicroPython. */
export function sampleLanguage(id: FreestyleSampleId, language: FreestyleLanguage): FreestyleLanguage {
  return ['blink', 'button-led', 'pot-dimmer', 'motor'].includes(id) ? language : 'cpp'
}
