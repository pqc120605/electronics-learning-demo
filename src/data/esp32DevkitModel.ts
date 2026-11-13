import type { BoardModelManifest } from '../components/board/boardSceneTypes'
import { getBoardAssetVersion } from './boardAssetVersions'

const pcbAssetVersion = getBoardAssetVersion('/models/esp32-devkit-v1-30pin.glb')
const assemblyAssetVersion = getBoardAssetVersion('/models/esp32-led-assembly.glb')

export const esp32DevkitModel: BoardModelManifest = {
  id: 'esp32-devkit-v1-30pin',
  assetUrl: `/models/esp32-devkit-v1-30pin.glb?v=${pcbAssetVersion}`,
  assetVersion: pcbAssetVersion,
  scenes: [],
  pinoutEvidence: {
    summary: 'Các chân theo thiết kế ESP32 Dev Kit Clone 30 chân được nêu trong hồ sơ model; đây không phải pinout phổ quát cho mọi board bán dưới tên DevKit V1. Đối chiếu revision thực tế trước khi đấu.',
    sourceLabel: 'Mở PCB và schematic của thiết kế clone ESP32 Dev Kit 30 chân',
    sourceUrl: 'https://github.com/BrijModi/ESP32-Dev-Kit-Clone',
  },
  features: [
    {
      id: 'wroom-module',
      name: 'Module ESP32-WROOM-32',
      plainDescription: 'Đây là bộ xử lý chính của board. Nó chạy chương trình và giao tiếp với Wi‑Fi, Bluetooth cùng các chân GPIO.',
      technicalRole: 'Module vi điều khiển ESP32 tích hợp bộ xử lý, bộ nhớ và kết nối không dây.',
      connection: 'Trong bài này, chương trình dùng GPIO 23 để điều khiển LED ngoài. Vị trí chân có thể khác giữa các board clone.',
      safetyNote: 'Các GPIO dùng mức logic 3,3 V; không đưa 5 V hoặc điện lưới vào chân GPIO.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'usb-connector',
      name: 'Cổng USB Micro-B',
      plainDescription: 'Cổng Micro-B đưa nguồn USB vào board và mang dữ liệu USB tới chip CP2102 để nạp chương trình hoặc xem log.',
      technicalRole: 'Đầu nối USB J1; D+ và D− đi tới CP2102, VBUS cấp vào nhánh nguồn board.',
      connection: 'J1 pin 1 đưa +5 V qua diode D1 tới đầu vào bộ ổn áp U2. J1 D+/D− nối với U3 CP2102.',
      safetyNote: 'Dừng sử dụng nếu board nóng bất thường, có mùi lạ hoặc cáp/đầu nối hư hỏng.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'regulator',
      name: 'Bộ ổn áp 3,3 V',
      plainDescription: 'AMS1117-3.3 nhận nguồn ở đầu vào và tạo rail 3,3 V cho module ESP32 cùng chân nguồn 3V3.',
      technicalRole: 'U2 · AMS1117-3.3, package SOT-223; trên PCB pin 3 là đầu vào, pin 2 là đầu ra 3,3 V, pin 1 là GND.',
      connection: 'USB +5 V → D1 → U2 IN; U2 OUT → rail 3,3 V → U1 và chân 3V3 trên J2.',
      safetyNote: 'Không dùng mô hình 3D để kiểm tra điện áp thật; chỉ cấp nguồn qua đầu vào board phù hợp.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'usb-uart',
      name: 'Giao tiếp USB–UART',
      plainDescription: 'CP2102 chuyển dữ liệu USB từ máy tính thành UART để ESP32 nhận chương trình và gửi log.',
      technicalRole: 'U3 · Silicon Labs CP2102-GMR trong package VFQFN-28 5×5 mm. Hình 3D dùng vỏ QFN chuẩn KiCad cùng kích thước, không có chữ in mặt chip.',
      connection: 'J1 D+/D− ↔ U3 USB; U3 TXD → ESP32 RX0, U3 RXD ← ESP32 TX0. DTR/RTS đi tới mạch tự động BOOT/EN.',
      safetyNote: 'Mã linh kiện theo schematic nguồn của thiết kế tham chiếu; chip clone hoặc board khác có thể thay đổi.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'boot-button',
      name: 'Nút BOOT',
      plainDescription: 'Nút BOOT kéo tín hiệu Boot xuống GND. ESP32 đọc trạng thái này khi reset để vào bootloader nạp firmware.',
      technicalRole: 'SW1 nối net /Boot với GND; điện trở R2 kéo Boot lên 3,3 V khi không nhấn.',
      connection: 'Giữ BOOT rồi nhấn RESET/EN khi cần vào bootloader thủ công; thiết kế này còn có auto-reset qua CP2102.',
      safetyNote: 'Tên, vị trí và thao tác nút có thể khác trên board clone.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'reset-button',
      name: 'Nút EN / RESET',
      plainDescription: 'Nút RESET kéo chân EN xuống thấp, khiến ESP32 dừng và khởi động lại khi thả nút.',
      technicalRole: 'SW2 nối net /EN với GND; R5 kéo EN lên 3,3 V khi thả.',
      connection: 'EN nối tới chân enable của module U1; mạch auto-reset cũng có thể điều khiển net này khi nạp code.',
      safetyNote: 'Nút trên board thật có thể mang nhãn khác.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'pin-headers',
      name: 'Hai hàng chân kết nối',
      plainDescription: 'Các chân ở hai bên đưa GPIO, nguồn và GND ra ngoài để nối cảm biến hoặc linh kiện.',
      technicalRole: 'J2 và J3 là hai header 1×15, bước 2,54 mm; tên net trên từng pad lấy từ PCB nguồn.',
      connection: 'J2 pad 15 là GPIO23; J2 pad 2 là GND. J3 pad 1 là 5V; J2 pad 1 là 3V3. Tra bảng pinout để xem đủ 30 vị trí.',
      safetyNote: 'Mô hình theo một thiết kế ESP32 Dev Kit Clone cụ thể; board DevKit V1 khác có thể đảo thứ tự hoặc dùng linh kiện khác.',
      relatedLessonPartIds: ['esp32', 'jumper'],
    },
    {
      id: 'status-leds',
      name: 'LED trạng thái trên board',
      plainDescription: 'D2 là LED báo nguồn trên thiết kế này; nó khác LED rời mà bài học nối với GPIO23.',
      technicalRole: 'D2 là LED SMD; R1 330 Ω nối tiếp từ rail 3,3 V để hạn dòng, phía còn lại về GND.',
      connection: 'Rail 3,3 V → R1 → D2 → GND. LED ngoài của bài học là một nhánh độc lập trên breadboard.',
      safetyNote: 'Không suy luận trạng thái GPIO23 từ LED báo nguồn tích hợp.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'board-passives',
      name: 'Điện trở và tụ điện SMD',
      plainDescription: 'Điện trở đặt mức mặc định cho BOOT/EN, nối mạch auto-reset và hạn dòng LED nguồn; tụ điện lọc rail nguồn và ghép tín hiệu.',
      technicalRole: 'R1–R6 có trị số theo BOM/schematic nguồn; C1–C6 là tụ lọc nguồn và tín hiệu trong mạch này.',
      connection: 'R2 kéo /Boot lên 3,3 V; R5 kéo /EN lên 3,3 V; R4/R6 nối RTS/DTR tới Q1/Q2. C1–C3 lọc rail nguồn; C6 ghép DTR với Boot.',
      safetyNote: 'Không tháo hoặc hàn linh kiện trên board khi chưa có kiến thức và dụng cụ phù hợp.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'usb-protection',
      name: 'Diode Schottky đầu vào · D1',
      plainDescription: 'D1 nằm trên nhánh nguồn USB trước bộ ổn áp, giúp tách nhánh nguồn theo chiều dẫn của diode.',
      technicalRole: 'D1 · diode Schottky package SOD-123; anode nối +5 V, cathode nối đầu vào U2 và tụ C1.',
      connection: 'J1 VBUS (+5 V) → D1 → U2 IN. D1 không nằm trên đường dữ liệu USB D+/D−.',
      safetyNote: 'Vai trò mô tả theo netlist/schematic nguồn; không xem đây là bảo vệ chống mọi kiểu cắm sai nguồn.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'boot-reset-control',
      name: 'Transistor điều khiển · Q1 / Q2',
      plainDescription: 'Hai transistor nhận tín hiệu từ chip USB–UART để tự đưa ESP32 vào bootloader hoặc reset khi nạp code.',
      technicalRole: 'Q1/Q2 được schematic khai báo là 2N2222 package SOT-23; R4/R6 ghép RTS/DTR tới các nhánh điều khiển Boot/EN.',
      connection: 'U3 RTS/DTR → R4/R6 → Q1/Q2 → net /Boot và /EN; transistor kéo tín hiệu xuống GND theo chu trình auto-reset.',
      safetyNote: 'Tín hiệu auto-reset phụ thuộc firmware nạp và mạch điều khiển; không phải board nào cũng có cấu trúc này.',
      relatedLessonPartIds: ['esp32'],
    },
    {
      id: 'breadboard', name: 'Breadboard · bảng cắm thử',
      plainDescription: 'Breadboard nối các lỗ theo nhóm bên trong để thử mạch mà chưa cần hàn. Mô hình chỉ minh hoạ cách bố trí phổ biến.',
      technicalRole: 'Bảng cắm thử không hàn; các hàng tiếp điểm bên trong không được mô phỏng điện.',
      connection: 'LED và điện trở được đặt ở các hàng khác nhau; dây jumper đưa GPIO23 và GND từ ESP32 tới mạch thử.',
      safetyNote: 'Rút USB trước khi đổi dây. Lỗ và thanh nguồn có thể được nối khác nhau tùy loại breadboard.', relatedLessonPartIds: ['breadboard'],
    },
    {
      id: 'external-led', name: 'LED đỏ ngoài board',
      plainDescription: 'LED là linh kiện phát sáng khi dòng điện đi qua theo chiều phù hợp. Chân dài thường là anode (+), chân ngắn thường là cathode (−).',
      technicalRole: 'Diode phát quang 5 mm; hình dạng minh hoạ, cực tính phải kiểm tra trên linh kiện thật.',
      connection: 'Bài mẫu nối GPIO23 qua điện trở 220 Ω tới anode; cathode nối về GND.',
      safetyNote: 'Không nối LED trực tiếp vào GPIO; luôn mắc điện trở nối tiếp và kiểm tra cực tính.', relatedLessonPartIds: ['led'],
    },
    {
      id: 'external-resistor', name: 'Điện trở 220 Ω',
      plainDescription: 'Điện trở hạn chế dòng điện trong nhánh LED, giúp bảo vệ LED và chân GPIO.',
      technicalRole: 'Điện trở xuyên lỗ 220 Ω; kích thước và vòng màu trên mô hình không phải mã nhận dạng chính xác.',
      connection: 'Mắc nối tiếp giữa GPIO23 và LED. Điện trở có thể nằm trước hoặc sau LED trong cùng nhánh.',
      safetyNote: 'Đối chiếu trị số thật trước khi cấp nguồn; mô hình không tính dòng hay xác nhận an toàn điện.', relatedLessonPartIds: ['resistor'],
    },
    {
      id: 'jumper-wires', name: 'Dây jumper',
      plainDescription: 'Dây jumper tạo kết nối giữa chân board và các hàng tiếp điểm trên breadboard.',
      technicalRole: 'Dây nối cách điện; màu chỉ giúp phân biệt đường trong bài học, không xác nhận điện áp.',
      connection: 'Dây tín hiệu đi từ GPIO23; dây hồi đi từ cathode LED về chân GND.',
      safetyNote: 'Không dựa vào màu dây để xác định cực; kiểm tra từng đầu nối trước khi cấp nguồn.', relatedLessonPartIds: ['jumper'],
    },
  ],
  hotspots: [
    { id: 'hotspot-wroom', featureId: 'wroom-module', label: 'Module ESP32-WROOM-32', nodeNames: ['U1'] },
    { id: 'hotspot-usb', featureId: 'usb-connector', label: 'Cổng USB Micro-B', nodeNames: ['J1'] },
    { id: 'hotspot-regulator', featureId: 'regulator', label: 'Bộ ổn áp 3,3 V', nodeNames: ['U2'] },
    { id: 'hotspot-usb-uart', featureId: 'usb-uart', label: 'Giao tiếp USB–UART', nodeNames: ['U3'] },
    { id: 'hotspot-boot', featureId: 'boot-button', label: 'Nút BOOT', nodeNames: ['SW1'] },
    { id: 'hotspot-reset', featureId: 'reset-button', label: 'Nút EN / RESET', nodeNames: ['SW2'] },
    { id: 'hotspot-headers', featureId: 'pin-headers', label: 'Hai hàng chân kết nối', nodeNames: ['J2', 'J3'] },
    { id: 'hotspot-status-leds', featureId: 'status-leds', label: 'LED nguồn · D2', nodeNames: ['D2'] },
    { id: 'hotspot-passives', featureId: 'board-passives', label: 'Điện trở và tụ điện SMD', nodeNames: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'] },
    { id: 'hotspot-usb-protection', featureId: 'usb-protection', label: 'Diode Schottky đầu vào · D1', nodeNames: ['D1'] },
    { id: 'hotspot-reset-control', featureId: 'boot-reset-control', label: 'Mạch điều khiển BOOT / RESET', nodeNames: ['Q1', 'Q2'] },
    { id: 'hotspot-breadboard', featureId: 'breadboard', label: 'Breadboard', nodeNames: ['BREADBOARD', 'BREADBOARD_RAIL_RED', 'BREADBOARD_RAIL_BLUE'] },
    { id: 'hotspot-led-external', featureId: 'external-led', label: 'LED ngoài board', nodeNames: ['LED_EXT'] },
    { id: 'hotspot-resistor-external', featureId: 'external-resistor', label: 'Điện trở 220 Ω', nodeNames: ['R_LED'] },
    { id: 'hotspot-wires-external', featureId: 'jumper-wires', label: 'Dây jumper', nodeNames: ['WIRE_GPIO23', 'WIRE_GND'] },
  ],
  pins: (() => {
    const left = [
      ['5V', undefined], ['GND', undefined], ['D13', 13], ['D12', 12], ['D14', 14], ['D27', 27], ['D26', 26], ['D25', 25], ['D33', 33], ['D32', 32], ['D35', 35], ['D34', 34], ['VN', 39], ['VP', 36], ['EN', undefined],
    ] as const
    const right = [
      ['3V3', undefined], ['GND', undefined], ['D15', 15], ['D2', 2], ['D4', 4], ['RX2', 16], ['TX2', 17], ['D5', 5], ['D18', 18], ['D19', 19], ['D21', 21], ['RX0', 3], ['TX0', 1], ['D22', 22], ['D23', 23],
    ] as const
    return [...left.map((entry, index) => ({ side: 'left' as const, entry, index })), ...right.map((entry, index) => ({ side: 'right' as const, entry, index }))].map(({ side, entry, index }) => {
      const [label, gpio] = entry
      const functions = label === '5V' ? ['Nguồn USB 5 V trên rail board'] : label === '3V3' ? ['Nguồn 3,3 V'] : label === 'GND' ? ['Mass / đường hồi dòng'] : label === 'EN' ? ['Enable', 'Reset mức thấp'] : gpio === 21 ? ['GPIO', 'I²C SDA mặc định'] : gpio === 22 ? ['GPIO', 'I²C SCL mặc định'] : gpio === 1 ? ['GPIO', 'UART0 TX'] : gpio === 3 ? ['GPIO', 'UART0 RX'] : [34, 35, 36, 39].includes(gpio ?? -1) ? ['GPIO input-only', 'ADC1'] : [25, 26].includes(gpio ?? -1) ? ['GPIO', 'ADC', 'DAC'] : [23, 19, 18, 5].includes(gpio ?? -1) ? ['GPIO', 'VSPI thường dùng'] : ['GPIO digital', ...(gpio !== undefined && gpio >= 32 ? ['ADC1'] : [])]
      const plainDescription = label === '5V' ? 'Chân +5 V trên header J3, cùng net nguồn USB trước nhánh ổn áp.' : label === '3V3' ? 'Đường nguồn 3,3 V do U2 AMS1117 tạo ra.' : label === 'GND' ? 'Mốc điện áp chung và đường dòng điện quay về nguồn.' : label === 'EN' ? 'Cho phép ESP32 chạy; kéo thấp sẽ giữ chip ở trạng thái reset.' : `Chân GPIO${gpio} có thể được cấu hình bằng phần mềm cho những chức năng phù hợp.`
      const technicalRole = label === '5V' ? 'Rail +5 V lấy từ USB qua D1 ở nhánh nguồn.' : label === '3V3' ? 'Đầu ra rail 3,3 V của U2.' : label === 'GND' ? 'Ground reference.' : label === 'EN' ? 'Chip enable, active-low reset.' : functions.join(' · ')
      const connection = gpio === 23 ? 'J2 pad 15; bài LED có thể nối GPIO23 → điện trở nối tiếp → LED → GND.' : gpio === 21 ? 'J2 pad 11; thường dùng SDA trong ví dụ I²C, nhưng ESP32 có thể ánh xạ ngoại vi sang chân khác.' : gpio === 22 ? 'J2 pad 14; thường dùng SCL trong ví dụ I²C, nhưng ESP32 có thể ánh xạ ngoại vi sang chân khác.' : gpio === 1 || gpio === 3 ? 'J2 pad 13/12; UART0 nối với cầu USB–UART trong schematic này, nên có thể dùng khi nạp code và xem log.' : label === 'GND' ? 'Nối chung GND giữa board và module/cảm biến; J2/J3 pad 2 là GND trong thiết kế này.' : label === '5V' || label === '3V3' ? 'Đối chiếu điện áp định mức của thiết bị trước khi nối.' : 'Chọn chức năng trong firmware; kiểm tra xung đột chân với board và thiết bị đang nối.'
      const padX = side === 'left' ? 0.1644092 - index * 0.00254 : 0.1645108 - index * 0.00254
      const padZ = side === 'left' ? 0.1188466 : 0.093345
      return { id: `${side}-${index + 1}`, side, position: index + 1, label, gpio, anchor: [padX, 0.0023, padZ] as [number, number, number], plainDescription, technicalRole, connection, safetyNote: label === '5V' ? 'Chân +5 V; không nối trực tiếp vào GPIO hoặc cảm biến chỉ chịu 3,3 V.' : label === '3V3' ? 'Chỉ dùng tải phù hợp; không đưa 5 V vào chân 3V3 hoặc GPIO.' : label === 'GND' ? 'Rút USB trước khi thay dây.' : gpio !== undefined && [34, 35, 36, 39].includes(gpio) ? 'Chân này chỉ nhận input; không dùng làm output. GPIO chịu mức logic 3,3 V, không chịu 5 V.' : 'GPIO dùng mức logic 3,3 V; không đưa 5 V hoặc điện lưới vào chân.', functions }
    })
  })(),
  signalFlows: [
    { id: 'power', title: 'Nguồn điện đi qua board', summary: 'Theo dấu net nguồn trên schematic và PCB tham chiếu.', steps: ['J1 đưa VBUS +5 V vào board', 'D1 Schottky nối nhánh +5 V tới đầu vào U2', 'U2 AMS1117 tạo rail 3,3 V cho U1 và header J2', 'GND là đường hồi chung của các khối'], relatedPinIds: ['left-1', 'left-2', 'right-1'], note: 'Luồng theo schematic nguồn đính kèm. Đây là đường chức năng của board, không phải mô phỏng điện.' },
    { id: 'program', title: 'Nạp chương trình qua USB', summary: 'Theo net USB, UART0 và tín hiệu điều khiển BOOT/EN.', steps: ['Máy tính gửi USB D+/D− qua cổng J1', 'U3 CP2102 chuyển USB sang UART', 'U3 TXD/RXD trao đổi với RX0/TX0 của ESP32', 'DTR/RTS qua Q1/Q2 điều khiển Boot và EN để reset/nạp'], relatedPinIds: ['right-12', 'right-13', 'left-15'], note: 'Sơ đồ thể hiện thiết kế nguồn cụ thể này; các ESP32 clone khác có thể dùng chip và mạch auto-reset khác.' },
    { id: 'led', title: 'GPIO điều khiển LED ngoài', summary: 'Một chân số xuất mức logic để bật/tắt tải nhỏ.', steps: ['Firmware đặt GPIO23 thành OUTPUT', 'GPIO23 xuất mức HIGH hoặc LOW', 'Dòng đi qua điện trở hạn dòng và LED', 'Mạch khép kín qua GND'], relatedPinIds: ['right-15', 'left-2'], note: 'Mô hình luồng không tính dòng điện; luôn dùng điện trở nối tiếp phù hợp.' },
    { id: 'i2c', title: 'ESP32 đọc cảm biến I²C', summary: 'Hai dây dữ liệu và xung nhịp kết nối board với cảm biến.', steps: ['Cấp 3,3 V và GND chung cho cảm biến', 'SDA mang dữ liệu hai chiều', 'SCL tạo nhịp giao tiếp', 'ESP32 đọc giá trị qua firmware'], relatedPinIds: ['right-1', 'right-2', 'right-11', 'right-14'], note: 'GPIO21/22 là cặp mặc định phổ biến trong ví dụ; ESP32 có thể ánh xạ I²C sang GPIO khác.' },
    { id: 'analog', title: 'Đọc tín hiệu analog', summary: 'ADC biến điện áp cảm biến thành giá trị số để chương trình xử lý.', steps: ['Cảm biến tạo điện áp đầu ra', 'Điện áp vào chân ADC1 phù hợp', 'ADC lấy mẫu và chuyển thành số', 'Firmware hiển thị hoặc phản hồi theo giá trị'], relatedPinIds: ['left-5', 'left-6', 'left-13', 'left-14'], note: 'ADC2 có giới hạn khi Wi‑Fi hoạt động; hãy ưu tiên ADC1 cho bài nhập môn và đối chiếu datasheet.' },
  ],
}

const externalFeatureIds = new Set(['breadboard', 'external-led', 'external-resistor', 'jumper-wires'])
esp32DevkitModel.scenes = [
  {
    id: 'pcb', label: 'PCB tham chiếu', assetUrl: `/models/esp32-devkit-v1-30pin.glb?v=${pcbAssetVersion}`, assetVersion: pcbAssetVersion,
    hotspots: esp32DevkitModel.hotspots.filter((hotspot) => !externalFeatureIds.has(hotspot.featureId)),
    note: 'Theo thiết kế ESP32 Dev Kit Clone 30 chân có schematic và PCB, kích thước khoảng 47,06 × 29,23 mm. Không đại diện cho mọi board bán dưới tên DevKit V1.',
  },
  {
    id: 'assembly', label: 'Lắp mạch LED', assetUrl: `/models/esp32-led-assembly.glb?v=${assemblyAssetVersion}`, assetVersion: assemblyAssetVersion,
    hotspots: esp32DevkitModel.hotspots,
    note: 'Mô hình lắp ráp học tập dựa trên PCB tham chiếu cụ thể này cùng breadboard và linh kiện ngoài board. Dây ngoài board minh họa, không phải netlist hay mô phỏng điện.',
  },
]
