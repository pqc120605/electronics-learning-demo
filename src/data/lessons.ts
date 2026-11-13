export type CircuitPart = {
  id: string
  name: string
  plainDescription: string
  technicalRole: string
  connection: string
  safetyNote: string
}

export type LessonStep = {
  title: string
  description: string
  focusParts: string[]
}

export type PinConnection = {
  from: string
  to: string
}

export type CodeExplanation = {
  code: string
  explanation: string
}

export type TroubleshootingItem = {
  symptom: string
  check: string
}

export type Lesson = {
  id: string
  title: string
  audience: string
  estimatedMinutes: number
  boardId: string
  boardAssumption: string
  objectives: string[]
  parts: CircuitPart[]
  steps: LessonStep[]
  pinMap: PinConnection[]
  code: string
  codeExplanations: CodeExplanation[]
  verificationChecklist: string[]
  troubleshooting: TroubleshootingItem[]
}

export const esp32LedLesson: Lesson = {
  id: 'esp32-led',
  title: 'Làm đèn LED nhấp nháy với ESP32',
  audience: 'Người mới bắt đầu',
  estimatedMinutes: 25,
  boardId: 'esp32-devkit',
  boardAssumption: 'ESP32 DevKit V1 dùng chip ESP32-WROOM-32; ví dụ này điều khiển LED ngoài bằng GPIO 23.',
  objectives: [
    'Nhận biết bo mạch, chân GPIO, LED và điện trở.',
    'Nối LED với ESP32 theo đúng chiều và giới hạn dòng điện.',
    'Đọc chương trình bật/tắt GPIO theo chu kỳ.',
  ],
  parts: [
    {
      id: 'esp32',
      name: 'ESP32 DevKit V1',
      plainDescription: 'Có thể xem bo mạch như bộ điều khiển nhỏ: chương trình ra lệnh, còn các chân GPIO kết nối với linh kiện bên ngoài.',
      technicalRole: 'Vi điều khiển ESP32 chạy chương trình và tạo mức logic 3,3 V tại GPIO 23.',
      connection: 'GPIO 23 nối tới điện trở rồi tới chân dài của LED. Chân GND nối với chân còn lại của LED.',
      safetyNote: 'GPIO của ESP32 là 3,3 V. Không nối chân GPIO trực tiếp với nguồn 5 V hoặc điện lưới.',
    },
    {
      id: 'breadboard',
      name: 'Breadboard',
      plainDescription: 'Bảng cắm thử giúp nối các linh kiện mà không cần hàn. Các lỗ trong cùng một hàng thường được nối với nhau theo cấu trúc bên trong bảng.',
      technicalRole: 'Bảng mạch thử không hàn; các nhóm lỗ được nối điện theo hàng và rãnh nguồn.',
      connection: 'Cắm hai chân LED vào hai hàng khác nhau. Dùng dây jumper để đưa GPIO 23 và GND tới các hàng đó.',
      safetyNote: 'Rút cáp USB trước khi đổi dây để tránh chạm chập ngoài ý muốn.',
    },
    {
      id: 'led',
      name: 'LED đỏ 5 mm',
      plainDescription: 'LED là đèn chỉ sáng khi dòng điện đi qua theo một chiều. Chân dài thường là cực dương.',
      technicalRole: 'Diode phát quang, có cực anode (+) và cathode (−).',
      connection: 'Chân dài (anode) nhận dòng qua điện trở; chân ngắn (cathode) nối về GND.',
      safetyNote: 'Không mắc LED trực tiếp vào GPIO; luôn đặt điện trở nối tiếp để giới hạn dòng.',
    },
    {
      id: 'resistor',
      name: 'Điện trở 220 Ω',
      plainDescription: 'Điện trở làm dòng điện qua LED nhỏ lại, giúp bảo vệ LED và chân GPIO.',
      technicalRole: 'Điện trở hạn dòng mắc nối tiếp; chiều lắp không phân cực.',
      connection: 'Một đầu nối với GPIO 23, đầu còn lại nối với anode của LED.',
      safetyNote: 'Dùng điện trở 220 Ω đến 330 Ω cho bài mẫu này; không bỏ qua điện trở.',
    },
    {
      id: 'jumper',
      name: 'Dây jumper',
      plainDescription: 'Dây jumper tạo các kết nối giữa board, breadboard và linh kiện.',
      technicalRole: 'Dây dẫn tín hiệu GPIO và đường hồi GND.',
      connection: 'Một dây từ GPIO 23 tới điện trở; một dây từ GND tới cathode của LED.',
      safetyNote: 'Kiểm tra đúng hàng cắm trên breadboard và rút USB trước khi thay đổi dây.',
    },
  ],
  steps: [
    { title: 'Rút nguồn trước khi lắp', description: 'Để cáp USB chưa cắm vào ESP32 trong suốt lúc nối linh kiện.', focusParts: ['esp32', 'breadboard'] },
    { title: 'Cắm LED', description: 'Cắm hai chân LED vào hai hàng khác nhau. Ghi nhớ chân dài là anode (+), chân ngắn là cathode (−).', focusParts: ['led', 'breadboard'] },
    { title: 'Nối điện trở', description: 'Nối GPIO 23 của ESP32 qua điện trở 220 Ω đến hàng có chân dài của LED.', focusParts: ['esp32', 'resistor', 'jumper'] },
    { title: 'Nối GND', description: 'Nối chân GND của ESP32 đến hàng có chân ngắn của LED để hoàn thành đường về.', focusParts: ['esp32', 'led', 'jumper'] },
    { title: 'Nạp chương trình', description: 'Chọn đúng board ESP32 Dev Module và cổng kết nối trong Arduino IDE, sau đó nạp code mẫu.', focusParts: ['esp32'] },
    { title: 'Quan sát kết quả', description: 'Khi chương trình chạy, LED sáng rồi tắt theo thời gian đặt trong hai lệnh delay().', focusParts: ['esp32', 'led'] },
  ],
  pinMap: [
    { from: 'ESP32 GPIO 23', to: 'Điện trở 220 Ω → chân dài LED (anode)' },
    { from: 'ESP32 GND', to: 'Chân ngắn LED (cathode)' },
  ],
  code: `const int ledPin = 23;\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(ledPin, HIGH);\n  delay(500);\n\n  digitalWrite(ledPin, LOW);\n  delay(500);\n}`,
  codeExplanations: [
    { code: 'const int ledPin = 23;', explanation: 'Đặt tên ledPin cho chân GPIO 23 để dễ đọc và dễ đổi chân sau này.' },
    { code: 'pinMode(ledPin, OUTPUT);', explanation: 'Báo cho ESP32 biết chân này sẽ gửi tín hiệu ra ngoài.' },
    { code: 'digitalWrite(ledPin, HIGH);', explanation: 'Đưa GPIO lên mức cao để dòng điện chạy qua điện trở và LED.' },
    { code: 'delay(500);', explanation: 'Tạm dừng 500 mili giây, tức nửa giây.' },
    { code: 'digitalWrite(ledPin, LOW);', explanation: 'Đưa GPIO về mức thấp để tắt LED; sau đó vòng lặp chạy lại.' },
  ],
  verificationChecklist: [
    'Board được nhận diện và code nạp thành công.',
    'LED sáng rồi tắt lặp lại theo thời gian đặt trong code.',
    'Điện trở được mắc nối tiếp với LED.',
    'Không có linh kiện nóng bất thường hoặc mùi khét.',
  ],
  troubleshooting: [
    { symptom: 'LED không sáng', check: 'Rút USB, kiểm tra LED có cắm đúng hai hàng và đúng chiều không; kiểm tra điện trở có nối từ GPIO 23 đến anode không.' },
    { symptom: 'Code không nạp được', check: 'Kiểm tra board ESP32 Dev Module, cổng USB và cáp có hỗ trợ truyền dữ liệu.' },
    { symptom: 'LED sáng liên tục', check: 'Xác nhận chân cathode về GND, code đúng GPIO 23 và chương trình đã nạp thành công.' },
    { symptom: 'Board nóng hoặc có mùi lạ', check: 'Ngắt USB ngay. Kiểm tra chạm chập và nhờ người lớn/giáo viên xem lại trước khi cấp nguồn.' },
  ],
}
