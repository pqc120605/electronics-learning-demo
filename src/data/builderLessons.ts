import type { SimulationTarget } from './simulationTargets'

export type BuilderLessonId = 'blink' | 'button-led' | 'ir-alert' | 'ultrasonic-distance' | 'seven-segment-counter' | 'source-led' | 'buck-boost-concept' | 'dc-motor-driver' | 'mosfet-switch' | 'analog-potentiometer' | 'analog-ldr'

export type BuilderLesson = {
  id: BuilderLessonId
  title: string
  summary: string
  code: (target: SimulationTarget, inputPin: number) => string
  flow: (pressed: boolean, detected: boolean, distanceCm: number) => string[]
  outcome: (pressed: boolean, detected: boolean, distanceCm: number) => boolean
  inputLabel: string
  outputLabel?: string
}

const defaultSegmentPins = [2, 3, 4, 5, 6, 7, 8]

/** map() uses long arithmetic, so the scaling cannot overflow a 16-bit int. */
export function analogPercentExpression(target: SimulationTarget, pinName: string): string {
  return `map(analogRead(${pinName}), 0, ${target.adcFullScale ?? 1023}, 0, 100)`
}

const outputCode = (pin: number, statement: string) => `const int ledPin = ${pin};\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n${statement}\n}`

export const builderLessons: BuilderLesson[] = [
  {
    id: 'analog-potentiometer', title: 'Biến trở bật/tắt LED theo ngưỡng', summary: 'Xoay biến trở ảo, đọc đầu vào analog và so sánh với ngưỡng để bật/tắt LED.', inputLabel: 'Giá trị biến trở ảo', outputLabel: 'LED theo ngưỡng',
    code: (target, inputPin) => `const int ledPin = ${target.codePin};\nconst int potPin = ${inputPin};\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n  pinMode(potPin, INPUT);\n}\n\nvoid loop() {\n  int potPercent = ${analogPercentExpression(target, 'potPin')};\n  if (potPercent > 50) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(50);\n}`,
    flow: (_pressed, _detected, _distanceCm) => ['Biến trở tạo mức điện áp thay đổi ở chân giữa (wiper).', 'Mô phỏng chuẩn hóa analogRead thành 0–100; đây không phải số đếm ADC thật của board.', 'Code dùng map() để đổi số đọc ADC của board thành phần trăm rồi so với ngưỡng 50.', 'Nếu lớn hơn 50%, GPIO LED lên HIGH; nếu không, xuống LOW.'],
    outcome: () => false,
  },
  {
    id: 'analog-ldr', title: 'Quang trở LDR bật/tắt LED', summary: 'Thay đổi mức sáng ảo qua bộ chia áp LDR, đọc analog chuẩn hóa và so ngưỡng để điều khiển LED.', inputLabel: 'Mức sáng ảo', outputLabel: 'LED theo ngưỡng',
    code: (target, inputPin) => `const int ledPin = ${target.codePin};\nconst int ldrPin = ${inputPin};\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n  pinMode(ldrPin, INPUT);\n}\n\nvoid loop() {\n  int lightPercent = ${analogPercentExpression(target, 'ldrPin')};\n  if (lightPercent > 50) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(50);\n}`,
    flow: () => ['Ánh sáng ảo làm thay đổi điện trở LDR theo đường cong giả định; sơ đồ đặt LDR phía VCC và điện trở cố định 10 kΩ phía GND.', 'Tính Vout = VCC × R cố định / (R_LDR + R cố định), sau đó chuẩn hóa theo VCC để minh họa đầu vào analog.', 'So sánh giá trị analog với ngưỡng trong code.', 'Nếu vượt ngưỡng, GPIO LED lên HIGH; nếu không, xuống LOW. Điện trở/điện áp chỉ là kết quả mô hình giáo dục, không phải đặc tính cảm biến thật.'],
    outcome: () => false,
  },
  {
    id: 'blink', title: 'LED nhấp nháy', summary: 'GPIO điều khiển LED qua điện trở hạn dòng.', inputLabel: 'Không cần đầu vào',
    code: (target) => outputCode(target.codePin, '  digitalWrite(ledPin, HIGH);\n  delay(500);\n  digitalWrite(ledPin, LOW);\n  delay(500);'),
    flow: () => ['setup() cấu hình chân LED là OUTPUT.', 'digitalWrite(..., HIGH) đặt đầu ra ở mức bật.', 'Điện trở hạn dòng bảo vệ LED trong mạch thật.', 'delay(500) giữ trạng thái rồi chương trình lặp lại.'],
    outcome: () => false,
  },
  {
    id: 'button-led', title: 'Nút nhấn điều khiển LED', summary: 'Đọc nút nhấn bằng INPUT_PULLUP rồi bật/tắt LED.', inputLabel: 'Nhấn nút ảo',
    code: (target, inputPin) => `const int ledPin = ${target.codePin};\nconst int buttonPin = ${inputPin};\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n  pinMode(buttonPin, INPUT_PULLUP);\n}\n\nvoid loop() {\n  if (digitalRead(buttonPin) == LOW) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(20);\n}`,
    flow: (pressed) => ['Nút dùng INPUT_PULLUP nên trạng thái bình thường là HIGH.', `digitalRead(buttonPin) đọc ${pressed ? 'LOW vì đang nhấn' : 'HIGH vì chưa nhấn'}.`, 'Điều kiện LOW đúng khi nhấn nút.', `GPIO LED ${pressed ? 'xuất HIGH, LED sáng' : 'xuất LOW, LED tắt'}.`],
    outcome: (pressed) => pressed,
  },
  {
    id: 'ir-alert', title: 'Cảm biến hồng ngoại', summary: 'Cảm biến phát hiện vật cản và điều khiển LED báo.', inputLabel: 'Có vật cản',
    code: (target, inputPin) => `const int ledPin = ${target.codePin};\nconst int sensorPin = ${inputPin};\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n  pinMode(sensorPin, INPUT);\n}\n\nvoid loop() {\n  int detected = digitalRead(sensorPin);\n  if (detected == LOW) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(50);\n}`,
    flow: (_pressed, detected) => ['Module tham chiếu Grove v1.2 báo active LOW khi phản xạ được vật; module khác có thể khác.', `Ngõ OUT ảo báo ${detected ? 'LOW · phát hiện vật' : 'HIGH · chưa phát hiện vật'}.`, 'MCU đọc OUT bằng digitalRead(sensorPin).', `Điều kiện LOW ${detected ? 'đúng' : 'sai'} nên LED báo ${detected ? 'sáng' : 'tắt'}.`],
    outcome: (_pressed, detected) => detected,
  },
  {
    id: 'ultrasonic-distance', title: 'Cảm biến siêu âm HC-SR04', summary: 'Phát xung TRIG, đo ECHO và báo khi vật ở gần.', inputLabel: 'Khoảng cách mô phỏng',
    code: (target, inputPin) => `const int ledPin = ${target.codePin};\nconst int trigPin = ${inputPin};\nconst int echoPin = ${inputPin + 1};\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n}\n\nvoid loop() {\n  digitalWrite(trigPin, LOW);\n  delayMicroseconds(2);\n  digitalWrite(trigPin, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n  long duration = pulseIn(echoPin, HIGH);\n  float distanceCm = duration * 0.034 / 2;\n  if (distanceCm < 20) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(100);\n}`,
    flow: (_pressed, _detected, distanceCm) => ['MCU phát xung khoảng 10 µs tại TRIG.', 'HC-SR04 phát sóng âm và chờ tín hiệu phản hồi ở ECHO.', `Mô hình đầu vào đang đặt vật ở ${distanceCm} cm.`, `distanceCm ${distanceCm < 20 ? '< 20 cm' : '≥ 20 cm'} nên LED báo ${distanceCm < 20 ? 'sáng' : 'tắt'}.`],
    outcome: (_pressed, _detected, distanceCm) => distanceCm < 20,
  },
  {
    id: 'seven-segment-counter', title: 'Đếm số với LED 7 đoạn', summary: 'Dùng 7 chân GPIO và 7 điện trở để hiển thị số 0 đến 9.', inputLabel: 'Tự đếm', outputLabel: 'LED 7 đoạn',
    code: (target) => `${target.sevenSegmentPins ? '' : '// Board này chưa có bảng chân 7 đoạn đã xác minh; bài đang bị khóa.\n'}const int segPins[7] = {${(target.sevenSegmentPins ?? defaultSegmentPins).join(', ')}};\nconst byte digits[10][7] = {\n  {1,1,1,1,1,1,0}, // 0\n  {0,1,1,0,0,0,0}, // 1\n  {1,1,0,1,1,0,1}, // 2\n  {1,1,1,1,0,0,1}, // 3\n  {0,1,1,0,0,1,1}, // 4\n  {1,0,1,1,0,1,1}, // 5\n  {1,0,1,1,1,1,1}, // 6\n  {1,1,1,0,0,0,0}, // 7\n  {1,1,1,1,1,1,1}, // 8\n  {1,1,1,1,0,1,1}  // 9\n};\n\nvoid setup() {\n  for (int i = 0; i < 7; i++) pinMode(segPins[i], OUTPUT);\n}\n\nvoid loop() {\n  for (int number = 0; number < 10; number++) {\n    for (int segment = 0; segment < 7; segment++) {\n      digitalWrite(segPins[segment], digits[number][segment]);\n    }\n    delay(1000);\n  }\n}`,
    flow: (_pressed, _detected, digit) => [`Code chọn mẫu số ${digit} trong bảng mã 7 đoạn.`, 'Mỗi bit trong mẫu số tương ứng trạng thái HIGH/LOW của một đoạn A–G.', 'Mỗi đoạn đi qua điện trở hạn dòng riêng trước khi tới chân GPIO.', `LED 7 đoạn common-cathode đang hiển thị ${digit}.`, 'delay(1000) giữ số trong một giây rồi chuyển sang mẫu tiếp theo.'],
    outcome: () => false,
  },
  {
    id: 'source-led', title: 'Nguồn thấp áp, điện trở và LED', summary: 'Lần theo đường nguồn → điện trở → LED → GND; học cực tính và vai trò hạn dòng.', inputLabel: 'Chọn nguồn mô phỏng', outputLabel: 'LED',
    code: (target) => outputCode(target.codePin, '  digitalWrite(ledPin, HIGH);\n  delay(500);\n  digitalWrite(ledPin, LOW);\n  delay(500);'),
    flow: () => ['Nguồn thấp áp tạo chênh lệch điện thế cho mạch.', 'Dòng đi qua điện trở nối tiếp để giới hạn dòng LED.', 'Dòng thuận đi vào anode và ra cathode về GND.', 'GPIO chỉ điều khiển trạng thái logic trong mô hình; nguồn và dòng điện thực không được tính.'],
    outcome: () => false,
  },
  {
    id: 'buck-boost-concept', title: 'So sánh mạch hạ áp và tăng áp', summary: 'Khám phá luồng khối IN → bộ chuyển đổi → OUT; đặt mục tiêu điện áp để nhận cảnh báo khái niệm.', inputLabel: 'Điện áp mục tiêu (mô phỏng)', outputLabel: 'Khối nguồn',
    code: () => '// Mô hình khái niệm, không phải firmware thực thi.\n// Buck: VOUT mục tiêu thấp hơn VIN.\n// Boost: VOUT mục tiêu cao hơn VIN.\n// Đo đầu ra module thật trước khi nối board.' ,
    flow: () => ['Nguồn thấp áp đi vào chân IN+ / IN−.', 'Buck hạ điện áp; boost nâng điện áp ở mức khối chức năng.', 'Đầu ra OUT+ / OUT− cấp cho tải sau khi kiểm tra đúng module.', 'Không suy ra dòng, ripple, tổn hao hoặc độ ổn định từ mô hình này.'],
    outcome: () => false,
  },
  {
    id: 'dc-motor-driver', title: 'Điều khiển motor DC bằng TB6612FNG', summary: 'GPIO phát lệnh logic tới driver; nguồn motor riêng, GND chung và STBY cần được chú ý.', inputLabel: 'Lệnh motor ảo', outputLabel: 'Chiều motor',
    code: () => '// Mô hình lệnh logic cho TB6612FNG (không nạp trực tiếp).\n// AIN1=HIGH, AIN2=LOW: chiều thuận.\n// PWMA đặt độ rộng xung; STBY=HIGH để cho phép hoạt động.\n// Nguồn motor VM tách khỏi nguồn logic VCC khi phù hợp.' ,
    flow: () => ['MCU đặt AIN1/AIN2 để chọn chiều quay.', 'PWMA biểu diễn mức PWM và tốc độ tương đối, không tính RPM.', 'STBY cho phép driver hoạt động; VCC là logic, VM là nguồn motor.', 'Driver cấp dòng cho motor; GND cần chung theo cấu hình module.'],
    outcome: () => false,
  },
  {
    id: 'mosfet-switch', title: 'MOSFET đóng cắt tải thấp áp', summary: 'Tìm hiểu công tắc low-side và diode bảo vệ cho tải cảm bằng luồng minh họa.', inputLabel: 'Cổng MOSFET ảo', outputLabel: 'Tải',
    code: () => '// Mô hình khái niệm MOSFET low-side.\n// GPIO -> điện trở cổng -> Gate; Source -> GND.\n// Tải nối từ nguồn thấp áp tới Drain.\n// Tải cảm cần diode hồi tiếp đúng chiều; không mô phỏng dòng điện.' ,
    flow: () => ['GPIO chỉ cấp tín hiệu điều khiển Gate, không cấp dòng tải.', 'MOSFET logic-level đóng cắt đường Drain–Source khi phù hợp VGS.', 'Nguồn tải đi qua tải rồi qua Drain–Source về GND.', 'Tải cảm cần đường hồi tiếp bảo vệ; chọn linh kiện theo datasheet.'],
    outcome: () => false,
  },
]

export function getBuilderLesson(id: BuilderLessonId) {
  return builderLessons.find((lesson) => lesson.id === id) ?? builderLessons[0]
}

/** These are teaching aliases, not a verified physical pin map for every clone/revision. */
export function getInputAlias(target: SimulationTarget, lesson?: BuilderLessonId): { pin: number; label: string } {
  if (lesson === 'analog-potentiometer' || lesson === 'analog-ldr') {
    if (target.boardId === 'arduino-mega-2560-r3') return { pin: 54, label: 'A0 · alias 54' }
    if (target.architecture.startsWith('AVR')) return { pin: 14, label: 'A0 · alias 14' }
    if (target.boardId === 'esp32-devkit') return { pin: 34, label: 'GPIO 34 · ADC input alias' }
    if (target.boardId.includes('esp32-s3') || target.boardId.includes('esp32-s2')) return { pin: 4, label: 'GPIO 4 · ADC alias' }
    if (target.boardId.startsWith('esp32-')) return { pin: 0, label: 'GPIO 0 · ADC alias' }
    if (target.boardId.startsWith('raspberry-pi-pico')) return { pin: 26, label: 'GP26 · ADC0 alias' }
    if (target.architecture.startsWith('Arm')) return { pin: 0, label: 'PA0 · ADC alias' }
  }
  if (target.boardId.startsWith('raspberry-pi-')) return { pin: 14, label: 'GP14' }
  if (target.architecture.startsWith('AVR') || target.boardId.startsWith('arduino-uno-r4')) return { pin: 2, label: 'D2' }
  if (target.architecture.startsWith('Arm')) return { pin: 0, label: 'alias 0 · chưa xác minh' }
  if (target.architecture.startsWith('Raspberry Pi')) return { pin: 14, label: 'GP14' }
  if (target.architecture.startsWith('RISC-V')) return { pin: 5, label: 'GPIO 5' }
  return { pin: 18, label: 'GPIO 18' }
}

const pinsUsedByLesson = (target: SimulationTarget, lesson: BuilderLessonId): number[] => {
  const input = getInputAlias(target, lesson).pin
  if (lesson === 'ultrasonic-distance') return [target.codePin, input, input + 1]
  if (lesson === 'button-led' || lesson === 'ir-alert' || lesson === 'analog-potentiometer' || lesson === 'analog-ldr') return [target.codePin, input]
  return [target.codePin]
}

/** Lessons stay locked on boards whose pins or ADC range have not been checked. */
export function getLessonBoardSupport(target: SimulationTarget, lesson: BuilderLessonId): { supported: boolean; reason?: string } {
  if ((lesson === 'analog-potentiometer' || lesson === 'analog-ldr') && target.adcFullScale === undefined) {
    return { supported: false, reason: `Bài analog đang khóa trên ${target.name} vì chưa xác minh dải ADC của board này.` }
  }
  if (lesson === 'seven-segment-counter') {
    return target.sevenSegmentPins ? { supported: true } : { supported: false, reason: `Bài LED 7 đoạn đang khóa trên ${target.name} vì chưa có bảng chân đã xác minh.` }
  }
  const pins = pinsUsedByLesson(target, lesson)
  if (new Set(pins).size !== pins.length) {
    return { supported: false, reason: `Bài này đang khóa trên ${target.name} vì chân đầu vào trùng chân LED trong profile hiện tại.` }
  }
  return { supported: true }
}
