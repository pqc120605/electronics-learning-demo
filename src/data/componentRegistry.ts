export type ElectricalType = 'input' | 'output' | 'power' | 'ground' | 'passive'
export type ComponentPin = { id: string; label: string; electricalType: ElectricalType; polarity?: 'positive' | 'negative' }
export type ResistanceNominal = { value: number; unit: 'ohm' }
type ResistorVariant = {
  id: string
  revision: number
  nominal: ResistanceNominal
  spiceLiteral: string
  source: { file: string; lessonId: string; partId: string; role: string }
  physical: typeof unknownResistorSpecifications
}

const unknownResistorSpecifications = {
  status: 'unknown', tolerancePercent: null, mpn: null, sku: null, package: null,
  material: null, powerWatts: null, voltageVolts: null, footprintId: null, pinPadMap: null,
} as const

/** Nominal catalog variants backed by teaching examples, with no physical SKU selection. */
export const resistorVariants = [
  {
    id: 'resistor-220ohm',
    revision: 1,
    nominal: { value: 220, unit: 'ohm' },
    spiceLiteral: '220',
    source: { file: 'src/data/lessons.ts', lessonId: 'esp32-led', partId: 'resistor', role: 'LED series resistor' },
    physical: unknownResistorSpecifications,
  },
  {
    id: 'resistor-10000ohm',
    revision: 1,
    nominal: { value: 10000, unit: 'ohm' },
    spiceLiteral: '10k',
    source: { file: 'src/data/lessonCircuits.ts', lessonId: 'analog-ldr', partId: 'resistor-ldr-1', role: 'Fixed divider resistor' },
    physical: unknownResistorSpecifications,
  },
] as const satisfies readonly ResistorVariant[]

export type ComponentDefinition = {
  id: string
  catalogId?: string
  label: string
  category: string
  emoji: string
  pins: ComponentPin[]
  explanation: string
  safetyNotes: string
  simulation: 'supported' | 'visual-only'
  sourceRefs: string[]
  visual: { shape3d: string; dimensionsMm: [number, number, number]; modelStatus: 'parametric-illustration' }
  voltageDomain?: 'logic-3v3' | 'logic-5v' | 'low-voltage' | 'unspecified'
}

const pin = (id: string, label: string, electricalType: ElectricalType, polarity?: ComponentPin['polarity']): ComponentPin => ({ id, label, electricalType, ...(polarity ? { polarity } : {}) })

const baseComponentRegistry: Omit<ComponentDefinition, 'visual'>[] = [
  { id: 'board', catalogId: 'esp32-devkit', label: 'Board vi điều khiển', category: 'MCU', emoji: '▰', pins: [pin('ledOut','GPIO LED','output'),pin('gnd','GND','ground','negative'),pin('vcc','3V3','power','positive'),pin('input','GPIO IN','input'),pin('trig','TRIG','output'),pin('echo','ECHO','input'),...Array.from({length:7},(_,index)=>pin(`seg${index}`,(index+2).toString(),'output'))], explanation: 'Đọc tín hiệu vào và xuất lệnh điều khiển. Các số chân trong bài có thể là alias học tập, không phải pin map vật lý của mọi board.', safetyNotes: 'Đối chiếu chân và mức logic theo đúng board/revision; không đưa 5 V vào GPIO 3,3 V.', simulation: 'supported', sourceRefs: [] },
  { id: 'breadboard', catalogId: 'breadboard', label: 'Breadboard', category: 'Kết nối', emoji: '▦', pins: [pin('railPlus','rail +','power','positive'),pin('railMinus','rail −','ground','negative'),pin('rowA','hàng A','passive'),pin('rowB','hàng B','passive')], explanation: 'Bảng cắm thử không hàn. Cấu trúc rail/hàng thay đổi theo mẫu; các lỗ cùng nhóm thường được nối nội bộ.', safetyNotes: 'Kiểm tra continuity rail và không cấp điện khi đang đổi dây.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'led', catalogId: 'led', label: 'LED', category: 'Đầu ra', emoji: '●', pins: [pin('anode','Anode (+)','passive','positive'),pin('cathode','Cathode (−)','passive','negative')], explanation: 'Diode phát sáng khi dòng đi theo chiều thuận.', safetyNotes: 'Cần điện trở hạn dòng; xác định cực tính trước khi cấp nguồn.', simulation: 'supported', sourceRefs: [] },
  { id: 'resistor', catalogId: 'resistor', label: 'Điện trở 220 Ω', category: 'Linh kiện cơ bản', emoji: '▱', pins: [pin('a','Đầu 1','passive'),pin('b','Đầu 2','passive')], explanation: 'Hạn dòng cho LED trong bài mẫu. Điện trở không phân cực.', safetyNotes: 'Trị số bài mẫu là giá trị minh họa; kiểm tra dòng và công suất trong mạch thật.', simulation: 'supported', sourceRefs: [] },
  { id: 'capacitor', catalogId: 'electrolytic', label: 'Tụ điện 100 µF', category: 'Linh kiện cơ bản', emoji: '▰', pins: [pin('plus','Cực +','passive','positive'),pin('minus','Cực −','passive','negative')], explanation: 'Tụ phân cực có thể làm phẳng dao động nguồn hoặc tạo mạch RC.', safetyNotes: 'Lắp đúng cực, đúng điện áp định mức; bản demo chưa tính nạp/xả.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'button', catalogId: 'button', label: 'Nút nhấn', category: 'Đầu vào', emoji: '◉', pins: [pin('contactA','Tiếp điểm A','passive'),pin('contactB','Tiếp điểm B','passive')], explanation: 'Nút nhấn tạm thời nối hai phía khi ấn. Bài mẫu dùng INPUT_PULLUP.', safetyNotes: 'Tránh để input trôi và cân nhắc dội phím.', simulation: 'supported', sourceRefs: [] },
  { id: 'limit-switch', catalogId: 'limit-switch', label: 'Công tắc hành trình', category: 'Đầu vào', emoji: '⇆', pins: [pin('com','COM · chung','passive'),pin('no','NO · thường mở','passive'),pin('nc','NC · thường đóng','passive')], explanation: 'Công tắc cơ đổi trạng thái tiếp điểm khi cần gạt bị nhấn. Hình học trong thư viện là minh họa tham số, không đại diện một mã sản phẩm cụ thể.', safetyNotes: 'Kiểm tra sơ đồ tiếp điểm, định mức điện và trạng thái an toàn; xử lý dội tín hiệu khi đọc bằng MCU.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'buzzer', catalogId: 'buzzer', label: 'Buzzer', category: 'Đầu ra', emoji: '◖', pins: [pin('signal','SIG','input'),pin('gnd','GND','ground','negative')], explanation: 'Bộ rung nhận tín hiệu điều khiển; loại chủ động tự tạo dao động.', safetyNotes: 'Kiểm tra dòng tải; không nối tải lớn trực tiếp vào GPIO.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'potentiometer', catalogId: 'potentiometer', label: 'Biến trở', category: 'Linh kiện cơ bản', emoji: '◉', pins: [pin('vcc','VCC','power','positive'),pin('wiper','SIG / wiper','output'),pin('gnd','GND','ground','negative')], explanation: 'Chân giữa (wiper) tạo mức tín hiệu thay đổi, thường đọc bằng ADC. Bài biến trở mô phỏng đầu vào chuẩn hóa 0–100.', safetyNotes: 'Không vượt miền điện áp ADC; simulator không mô phỏng độ phân giải hay điện áp thật.', simulation: 'supported', sourceRefs: [] },
  { id: 'ldr', catalogId: 'ldr', label: 'Quang trở LDR', category: 'Cảm biến', emoji: '☼', pins: [pin('a','Đầu 1','passive'),pin('b','Đầu 2','passive')], explanation: 'Điện trở thay đổi theo ánh sáng; bài học dùng bộ chia áp LDR phía VCC + R cố định 10 kΩ phía GND để tính Vout theo điện trở giả định.', safetyNotes: 'Đường cong 100 kΩ khi tối → 1 kΩ khi sáng và VCC 3,3 V là giả định giáo dục; không quy đổi ra lux, không đại diện đặc tuyến/điện áp ADC vật lý. Cần kiểm tra đúng board/module và dải điện áp.', simulation: 'supported', sourceRefs: [] },
  { id: 'ir-sensor', catalogId: 'ir-obstacle', label: 'Cảm biến hồng ngoại', category: 'Cảm biến', emoji: '◉', pins: [pin('out','OUT','output'),pin('vcc','VCC','power','positive'),pin('gnd','GND','ground','negative')], explanation: 'Module phát/thu tia hồng ngoại và báo trạng thái vật cản ở OUT.', safetyNotes: 'Active HIGH/LOW và điện áp phụ thuộc module cụ thể.', simulation: 'supported', sourceRefs: [] },
  { id: 'ultrasonic', catalogId: 'hc-sr04', label: 'HC-SR04 siêu âm', category: 'Cảm biến', emoji: '◉', pins: [pin('trig','TRIG','input'),pin('echo','ECHO','output'),pin('vcc','VCC','power','positive'),pin('gnd','GND','ground','negative')], explanation: 'TRIG khởi tạo phép đo; ECHO mang độ rộng xung theo thời gian khứ hồi.', safetyNotes: 'VCC thường 5 V; ECHO cần chia áp trước GPIO 3,3 V. Bài học dùng khoảng cách ảo.', simulation: 'supported', sourceRefs: [] },
  { id: 'oled', catalogId: 'oled', label: 'OLED I²C', category: 'Hiển thị', emoji: '▣', pins: [pin('vcc','VCC','power','positive'),pin('gnd','GND','ground','negative'),pin('sda','SDA','passive'),pin('scl','SCL','passive')], explanation: 'Màn hình giao tiếp I²C dùng hai đường dữ liệu SDA/SCL.', safetyNotes: 'Điện áp cấp, pull-up và địa chỉ tùy breakout; chưa mô phỏng hiển thị.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'servo', catalogId: 'servo', label: 'Servo', category: 'Cơ điện', emoji: '⟳', pins: [pin('gnd','GND','ground','negative'),pin('vcc','V+','power','positive'),pin('signal','Signal','input')], explanation: 'Servo nhận xung PWM dạng servo để đặt vị trí.', safetyNotes: 'Dòng khởi động có thể lớn; dùng nguồn thích hợp và chung GND.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'seven-segment', catalogId: 'seven-segment', label: 'LED 7 đoạn · cathode chung', category: 'Hiển thị', emoji: '▥', pins: [...['A','B','C','D','E','F','G','DP'].map(name=>pin(name.toLowerCase(),name,'passive')),pin('com1','COM1','ground','negative'),pin('com2','COM2','ground','negative')], explanation: 'Tám LED biểu diễn bảy đoạn và dấu chấm. Mẫu bài học dùng cathode chung.', safetyNotes: 'Cần điện trở hạn dòng riêng mỗi đoạn. Anode chung dùng logic đảo; loại thực tế cần xác định trước khi nối.', simulation: 'supported', sourceRefs: [] },
  { id: 'diode', catalogId: 'diode', label: 'Diode chỉnh lưu', category: 'Linh kiện cơ bản', emoji: '▶', pins: [pin('anode','Anode (A)','passive','positive'),pin('cathode','Cathode (K)','passive','negative')], explanation: 'Dẫn điện chủ yếu từ anode sang cathode; vạch thường đánh dấu cathode.', safetyNotes: 'Chọn đúng dòng và điện áp ngược; chưa mô phỏng đặc tuyến/sụt áp.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'rgb-led', catalogId: 'rgb-led', label: 'LED RGB 4 chân', category: 'Đầu ra', emoji: '✦', pins: [pin('red','R','passive'),pin('green','G','passive'),pin('blue','B','passive'),pin('common','COM','passive')], explanation: 'Ba kênh LED màu trong một package; có thể là common anode hoặc common cathode.', safetyNotes: 'Mỗi kênh cần điện trở riêng; xác định chân chung và cực tính.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'transistor', catalogId: 'transistor-bjt', label: 'Transistor NPN', category: 'Đầu ra', emoji: '⋔', pins: [pin('base','B','input'),pin('collector','C','passive'),pin('emitter','E','passive')], explanation: 'Có thể làm công tắc tải; GPIO điều khiển base qua điện trở.', safetyNotes: 'Sơ đồ chân tùy package; tải lớn cần driver phù hợp.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'mosfet', catalogId: 'mosfet', label: 'MOSFET logic-level', category: 'Đầu ra', emoji: '⋔', pins: [pin('gate','G','input'),pin('drain','D','passive'),pin('source','S','passive')], explanation: 'Công tắc điện tử điều khiển bằng điện áp cổng.', safetyNotes: 'Chọn đúng logic-level theo VGS; tải cảm cần diode bảo vệ.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'dc-motor', catalogId: 'dc-motor', label: 'Động cơ DC', category: 'Cơ điện', emoji: '⚙', pins: [pin('positive','M+','passive','positive'),pin('negative','M−','passive','negative')], explanation: 'Động cơ quay khi được cấp nguồn DC phù hợp; đảo cực có thể đổi chiều.', safetyNotes: 'Không nối trực tiếp GPIO; cần driver và nguồn thích hợp.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'thermistor', catalogId: 'ntc', label: 'Nhiệt điện trở NTC', category: 'Cảm biến', emoji: '♨', pins: [pin('a','Đầu 1','passive'),pin('b','Đầu 2','passive')], explanation: 'Điện trở thường giảm khi nhiệt độ tăng; dùng cầu phân áp để đọc ADC.', safetyNotes: 'Cần đặc tuyến/hiệu chuẩn; demo chưa mô phỏng nhiệt độ.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'slide-switch', catalogId: 'slide-switch', label: 'Công tắc gạt', category: 'Đầu vào', emoji: '⇆', pins: [pin('common','COM','passive'),pin('a','A','passive'),pin('b','B','passive')], explanation: 'Chuyển COM nối với một trong hai ngả.', safetyNotes: 'Xác nhận sơ đồ chân và dòng/áp định mức.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'battery', catalogId: 'dc-supply', label: 'Nguồn DC thấp áp', category: 'Nguồn', emoji: '▥', pins: [pin('positive','+','power','positive'),pin('negative','−','ground','negative')], explanation: 'Cấp nguồn DC cho mạch trong giới hạn phù hợp.', safetyNotes: 'Kiểm tra điện áp/dòng; không cấp đồng thời nhiều nguồn khi chưa hiểu mạch nguồn.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'relay', catalogId: 'relay', label: 'Relay 1 kênh', category: 'Đầu ra', emoji: '☷', pins: [pin('in','IN','input'),pin('vcc','VCC','power','positive'),pin('gnd','GND','ground','negative'),pin('com','COM','passive'),pin('no','NO','passive'),pin('nc','NC','passive')], explanation: 'Cuộn dây điều khiển tiếp điểm COM/NO/NC; nhiều module có driver tích hợp.', safetyNotes: 'Chỉ thực hành tải thấp áp; điện lưới nguy hiểm. Demo không đóng/ngắt relay.', simulation: 'visual-only', sourceRefs: [] },
  { id: 'buck-converter', catalogId: 'buck', label: 'Module hạ áp DC–DC', category: 'Nguồn', emoji: '▤', pins: [pin('inPlus','IN+','power','positive'),pin('inMinus','IN−','ground','negative'),pin('outPlus','OUT+','power','positive'),pin('outMinus','OUT−','ground','negative')], explanation: 'Bộ chuyển đổi buck hạ điện áp DC đầu vào xuống mức đầu ra có thể chỉnh hoặc cố định.', safetyNotes: 'Điều chỉnh và đo VOUT trước khi nối MCU; dòng, dải vào/ra, hiệu suất và nhiệt phụ thuộc đúng module. Mô phỏng chỉ minh họa luồng khối.', simulation: 'visual-only', sourceRefs: [], voltageDomain: 'low-voltage' },
  { id: 'boost-converter', catalogId: 'boost', label: 'Module tăng áp DC–DC', category: 'Nguồn', emoji: '▤', pins: [pin('inPlus','IN+','power','positive'),pin('inMinus','IN−','ground','negative'),pin('outPlus','OUT+','power','positive'),pin('outMinus','OUT−','ground','negative')], explanation: 'Bộ chuyển đổi boost nâng điện áp DC đầu vào lên mức đầu ra cao hơn.', safetyNotes: 'Đầu ra có thể vượt ngưỡng chịu đựng của board dù đầu vào thấp; đo VOUT trước khi nối tải. Mô phỏng không tính ripple hay dòng.', simulation: 'visual-only', sourceRefs: [], voltageDomain: 'low-voltage' },
  { id: 'tb6612', catalogId: 'motor-driver', label: 'Driver cầu H TB6612FNG', category: 'Cơ điện', emoji: '▦', pins: [pin('vcc','VCC logic','power','positive'),pin('vm','VM motor','power','positive'),pin('gnd','GND','ground','negative'),pin('ain1','AIN1','input'),pin('ain2','AIN2','input'),pin('pwma','PWMA','input'),pin('stby','STBY','input'),pin('a01','AO1','output'),pin('a02','AO2','output')], explanation: 'IC cầu H nhận tín hiệu logic và điều khiển chiều/tốc độ một hoặc hai động cơ DC qua ngõ ra driver.', safetyNotes: 'Không nối motor trực tiếp GPIO. Nối chung GND theo sơ đồ module; VM/VCC và dòng tải phải đúng datasheet. STBY phải ở trạng thái hoạt động.', simulation: 'visual-only', sourceRefs: [], voltageDomain: 'low-voltage' },
  { id: 'h-bridge', catalogId: 'h-bridge-l298n', label: 'Module cầu H L298N', category: 'Cơ điện', emoji: '▦', pins: [pin('logicVcc','5V logic','power','positive'),pin('motorVcc','VS motor','power','positive'),pin('gnd','GND','ground','negative'),pin('in1','IN1','input'),pin('in2','IN2','input'),pin('ena','ENA / PWM','input'),pin('out1','OUT1','output'),pin('out2','OUT2','output')], explanation: 'Module cầu H điều khiển đảo chiều động cơ DC; một số board còn có jumper và bộ ổn áp.', safetyNotes: 'Đọc sơ đồ của đúng module; ngưỡng áp/dòng và sụt áp khác nhau. Không cấp nguồn motor vào GPIO; nối chung GND khi thiết kế yêu cầu.', simulation: 'visual-only', sourceRefs: [], voltageDomain: 'low-voltage' },
]

const shapeById: Record<string, { shape3d: string; dimensionsMm: [number, number, number] }> = {
  board: { shape3d: 'development-board', dimensionsMm: [52, 28, 2] }, breadboard: { shape3d: 'breadboard', dimensionsMm: [55, 35, 8] },
  led: { shape3d: 'led', dimensionsMm: [5, 5, 8] }, resistor: { shape3d: 'axial-resistor', dimensionsMm: [10, 3, 3] }, capacitor: { shape3d: 'radial-capacitor', dimensionsMm: [8, 8, 12] },
  button: { shape3d: 'tactile-button', dimensionsMm: [6, 6, 5] }, potentiometer: { shape3d: 'potentiometer', dimensionsMm: [12, 12, 8] }, 'ir-sensor': { shape3d: 'ir-module', dimensionsMm: [20, 14, 7] }, ultrasonic: { shape3d: 'ultrasonic-module', dimensionsMm: [45, 20, 15] },
  'seven-segment': { shape3d: 'seven-segment', dimensionsMm: [15, 20, 8] }, battery: { shape3d: 'battery', dimensionsMm: [30, 20, 14] }, 'buck-converter': { shape3d: 'converter', dimensionsMm: [24, 18, 8] }, 'boost-converter': { shape3d: 'converter', dimensionsMm: [24, 18, 8] },
  tb6612: { shape3d: 'motor-driver', dimensionsMm: [25, 20, 5] }, 'h-bridge': { shape3d: 'motor-driver-large', dimensionsMm: [43, 43, 15] }, 'dc-motor': { shape3d: 'dc-motor', dimensionsMm: [22, 22, 28] },
}

export const componentRegistry: ComponentDefinition[] = baseComponentRegistry.map((part): ComponentDefinition => ({
  ...part,
  visual: { ...(shapeById[part.id] ?? { shape3d: 'small-component', dimensionsMm: [8, 6, 4] as [number, number, number] }), modelStatus: 'parametric-illustration' },
}))

export type ComponentId = (typeof componentRegistry)[number]['id']
export function getComponentDefinition(id: string) { return componentRegistry.find((component) => component.id === id) }
