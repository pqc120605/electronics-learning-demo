import type { CommunityAuthor, CommunitySeed } from '../lib/community'

/** Dữ liệu mẫu cho bản xem trước cộng đồng. Tác giả là nhân vật minh hoạ, không phải người dùng thật. */
const sampleAuthor = (id: string, name: string): CommunityAuthor => ({ id: `sample-${id}`, name, avatarUrl: null })

const an = sampleAuthor('an', 'An (mẫu)')
const binh = sampleAuthor('binh', 'Bình (mẫu)')
const chi = sampleAuthor('chi', 'Chi (mẫu)')
const duc = sampleAuthor('duc', 'Đức (mẫu)')
const mentor = sampleAuthor('mentor', 'Mentor Mạch Mở (mẫu)')

export const communitySeed: CommunitySeed = {
  posts: [
    {
      id: 'led-dien-tro-bao-nhieu',
      title: 'LED đỏ với nguồn 5V thì chọn điện trở bao nhiêu?',
      body: 'Mình mới học, có LED đỏ 5mm và nguồn 5V từ Arduino Uno. Đọc trên mạng thấy người dùng 220Ω, người dùng 330Ω, 1kΩ.\n\nCách tính đúng là gì và chọn sao cho an toàn?',
      category: 'co-ban', tags: ['led', 'điện-trở', 'ohm'], author: an, createdAt: '2026-11-10T08:15:00.000Z', commentCount: 0, origin: 'sample',
    },
    {
      id: 'esp32-gpio-34-khong-output',
      title: 'ESP32: vì sao GPIO 34 không bật được LED?',
      body: 'Mình nối LED vào GPIO 34 và chạy code:\n\n```cpp\nvoid setup() {\n  pinMode(34, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(34, HIGH);\n}\n```\n\nLED không sáng, đo chân bằng đồng hồ vẫn 0V. Board là ESP32 DevKit V1.',
      category: 'hoi-dap-loi', tags: ['esp32', 'gpio'], author: binh, createdAt: '2026-11-11T13:40:00.000Z', commentCount: 0, origin: 'sample',
    },
    {
      id: 'mqtt-esp32-mat-ket-noi',
      title: 'ESP32 gửi MQTT bị mất kết nối sau vài giờ',
      body: 'Node cảm biến nhiệt độ của mình gửi lên broker mỗi 30 giây. Sau 3–5 giờ thì `client.connected()` trả về false và không tự nối lại.\n\n- Thư viện: PubSubClient\n- Broker: Mosquitto trên Raspberry Pi\n- Wi-Fi nhà, sóng khá yếu\n\nCó mẫu reconnect nào ổn định không?',
      category: 'iot', tags: ['esp32', 'mqtt', 'wifi'], author: chi, createdAt: '2026-11-12T02:05:00.000Z', commentCount: 0, origin: 'sample',
    },
    {
      id: 'ngat-nut-nhan-bi-doi',
      title: 'Nút nhấn dùng ngắt (interrupt) bị đếm nhảy 2–3 lần',
      body: 'Mình dùng `attachInterrupt` trên Arduino Nano để đếm số lần bấm nút. Mỗi lần bấm biến đếm tăng 2–3 đơn vị.\n\nĐây là **dội phím** (bounce) phải không? Nên chống dội bằng phần cứng (RC) hay phần mềm?',
      category: 'nhung', tags: ['arduino', 'interrupt', 'nút-nhấn'], author: duc, createdAt: '2026-11-09T10:20:00.000Z', commentCount: 0, origin: 'sample',
    },
    {
      id: 'tram-thoi-tiet-mini',
      title: 'Khoe dự án: trạm thời tiết mini chạy pin 18650',
      body: 'Dự án cuối kỳ của mình:\n\n1. ESP32-C3 + cảm biến BME280 qua I²C\n2. Deep sleep 10 phút, thức dậy đo rồi gửi lên dashboard\n3. Pin 18650 + mạch sạc TP4056 có bảo vệ\n\nMong mọi người góp ý phần nguồn, đặc biệt là dòng tiêu thụ khi ngủ.',
      category: 'du-an', tags: ['esp32', 'i2c', 'deep-sleep', 'pin'], author: chi, createdAt: '2026-11-13T15:00:00.000Z', commentCount: 0, origin: 'sample',
    },
    {
      id: 'pull-up-i2c-bao-nhieu',
      title: 'Điện trở pull-up cho I²C chọn 4.7kΩ hay 10kΩ?',
      body: 'Bus I²C của mình có 3 cảm biến, dây khoảng 30cm. Khi nào nên giảm giá trị pull-up? Có công thức nào dựa trên điện dung bus không?',
      category: 'co-ban', tags: ['i2c', 'điện-trở', 'pull-up'], author: an, createdAt: '2026-11-08T07:30:00.000Z', commentCount: 0, origin: 'sample',
    },
    {
      id: 'pico-khong-hien-o-dia',
      title: 'Raspberry Pi Pico không hiện ổ đĩa RPI-RP2 khi cắm USB',
      body: 'Mình giữ nút BOOTSEL rồi cắm cáp nhưng máy tính không thấy ổ RPI-RP2. Đã thử 2 cổng USB.\n\n> Đèn trên board không sáng gì cả.\n\nCó cách kiểm tra cáp có dây dữ liệu không?',
      category: 'hoi-dap-loi', tags: ['pico', 'usb'], author: duc, createdAt: '2026-11-12T09:45:00.000Z', commentCount: 0, origin: 'sample',
    },
    {
      id: 'ble-hay-wifi-cam-bien-pin',
      title: 'Cảm biến chạy pin: nên dùng BLE hay Wi-Fi?',
      body: 'Mình cần đọc độ ẩm đất mỗi giờ, đặt ngoài vườn cách router khoảng 15m. Muốn pin dùng được vài tháng. Nên chọn BLE + gateway hay Wi-Fi trực tiếp?',
      category: 'iot', tags: ['ble', 'wifi', 'pin'], author: binh, createdAt: '2026-11-07T11:10:00.000Z', commentCount: 0, origin: 'sample',
    },
  ],
  comments: [
    { id: 'c-led-1', postId: 'led-dien-tro-bao-nhieu', author: mentor, createdAt: '2026-11-10T09:00:00.000Z', origin: 'sample', body: 'Dùng định luật Ohm: `R = (Vnguồn − Vf) / I`. LED đỏ có Vf khoảng 2V, chọn I = 10mA:\n\n```text\nR = (5 − 2) / 0.010 = 300Ω → chọn 330Ω\n```\n\n220Ω cho ~13.6mA vẫn an toàn với LED 20mA. Có thể thử ở **Bộ tính điện tử** của Mạch Mở.' },
    { id: 'c-led-2', postId: 'led-dien-tro-bao-nhieu', author: an, createdAt: '2026-11-10T09:30:00.000Z', origin: 'sample', body: 'Cảm ơn, mình hiểu rồi. 1kΩ thì LED vẫn sáng nhưng mờ hơn đúng không?' },
    { id: 'c-gpio-1', postId: 'esp32-gpio-34-khong-output', author: mentor, createdAt: '2026-11-11T14:00:00.000Z', origin: 'sample', body: 'Trên ESP32-WROOM-32 của mẫu ESP32 DevKit V1 trong bài, GPIO 34 chỉ nhận tín hiệu. Gọi pinMode(34, OUTPUT) không tạo được ngõ ra để điều khiển LED. Đối chiếu [bảng GPIO của Espressif](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/gpio.html#gpio-summary) và [hồ sơ DevKit V1](/boards?board=esp32-devkit). Nếu board bạn đang cầm có chân GPIO 23 khả dụng, hãy đối chiếu bài LED ngoài, nối điện trở hạn dòng và kiểm cực LED cùng đường GND. Xác nhận đúng biến thể trước khi nối.' },
    { id: 'c-mqtt-1', postId: 'mqtt-esp32-mat-ket-noi', author: duc, createdAt: '2026-11-12T03:00:00.000Z', origin: 'sample', body: 'Gọi `client.loop()` thường xuyên và kiểm tra `WiFi.status()` trước, nối lại Wi-Fi rồi mới nối lại MQTT. Đặt keepalive khoảng 60s.' },
    { id: 'c-ngat-1', postId: 'ngat-nut-nhan-bi-doi', author: mentor, createdAt: '2026-11-09T11:00:00.000Z', origin: 'sample', body: 'Đúng là dội phím. Cách phần mềm đơn giản: bỏ qua các ngắt cách nhau dưới 50ms bằng `millis()`. Cách phần cứng: RC 10kΩ + 100nF và Schmitt trigger.' },
    { id: 'c-tram-1', postId: 'tram-thoi-tiet-mini', author: binh, createdAt: '2026-11-13T16:00:00.000Z', origin: 'sample', body: 'Nhớ đo dòng ngủ cả mạch, không chỉ ESP32. LED nguồn và LDO trên board dev thường ăn vài mA.' },
    { id: 'c-pico-1', postId: 'pico-khong-hien-o-dia', author: an, createdAt: '2026-11-12T10:10:00.000Z', origin: 'sample', body: 'Nhiều cáp micro-USB chỉ có dây sạc. Thử cáp đang dùng truyền file với điện thoại.' },
  ],
}
