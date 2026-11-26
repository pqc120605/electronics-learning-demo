import type { ComponentReference } from './componentReferences'
import type { ComponentCategory, ComponentRecord } from './components'

type Family = 'power' | 'diode' | 'transistor' | 'sensor' | 'audio' | 'driver' | 'display' | 'logic' | 'interface' | 'board'
type Entry = [code: string, title: string, purpose: string, source?: string]

const families: Record<Family, { category: ComponentCategory; context: string }> = {
  power: { category: 'Nguồn', context: 'Tra ngưỡng điện áp, tải, tản nhiệt và mạch ứng dụng của đúng phiên bản.' },
  diode: { category: 'Linh kiện cơ bản', context: 'Tra chiều anode/cathode và đường đặc tính dòng–áp của đúng mã.' },
  transistor: { category: 'Linh kiện cơ bản', context: 'Kiểm loại transistor, package, thứ tự chân và điều kiện kích.' },
  sensor: { category: 'Cảm biến', context: 'Tra điều kiện đo, kiểu giao tiếp và nguồn của IC. Module thương mại có thể bố trí khác.' },
  audio: { category: 'Âm thanh', context: 'Tra kiểu đầu vào, tải đầu ra và cách cấp nguồn trước khi thử với loa hoặc tín hiệu âm thanh.' },
  driver: { category: 'Cơ điện', context: 'Tính theo dòng tải và nhiệt. Đối chiếu điều kiện nguồn và chân điều khiển trong datasheet.' },
  display: { category: 'Hiển thị', context: 'Tra giao tiếp, giới hạn dòng và kiểu kết nối tải LED của driver.' },
  logic: { category: 'IC logic', context: 'Xem bảng chân trị, điện áp logic và các chân điều khiển trong tài liệu đúng package.' },
  interface: { category: 'Kết nối', context: 'Đối chiếu mức điện áp, giao tiếp và package trước khi kết nối với board.' },
  board: { category: 'Board & dây nối', context: 'Kiểm các nhóm lỗ nối ngầm và rail nguồn trên đúng mẫu breadboard.' },
}

const ti = 'https://www.ti.com/product/'
const onsemi = 'https://www.onsemi.com/download/data-sheet/pdf/'
const analog = (code: string) => `https://www.analog.com/en/products/${code.toLowerCase()}.html`

const entries: Record<Family, Entry[]> = {
  power: [
    ['LM7805', 'Ổn áp tuyến tính 5 V', 'Tạo đường nguồn 5 V cố định từ đầu vào DC cao hơn.', ti + 'LM7800'],
    ['LM317', 'Ổn áp chỉnh được', 'Đặt điện áp đầu ra bằng một mạng điện trở ngoài.'],
    ['TL431', 'Tham chiếu shunt', 'Tạo tham chiếu điều chỉnh được để dùng trong mạch hồi tiếp.'],
    ['LM2596', 'IC hạ áp', 'Chuyển đổi DC hạ áp theo mạch dùng cuộn cảm ngoài.'],
    ['LM2577', 'IC tăng áp', 'Tạo điện áp DC cao hơn đầu vào bằng mạch chuyển mạch thích hợp.'],
    ['TPS61023', 'IC tăng áp đồng bộ', 'Tăng áp từ nguồn DC thấp cho thiết bị dùng pin.'],
    ['LM1117', 'Ổn áp LDO', 'Ổn áp tuyến tính với phiên bản cố định hoặc điều chỉnh được.'],
    ['TPS5430', 'IC nguồn buck', 'Hạ áp DC bằng bộ chuyển đổi tích hợp công tắc công suất.'],
    ['TPS62160', 'IC hạ áp đồng bộ', 'Tạo đường nguồn DC từ đầu vào cao hơn với bộ chuyển đổi đồng bộ.'],
    ['BQ24074', 'IC sạc Li-ion một cell', 'Quản lý sạc và phân phối nguồn hệ thống qua mạch power path.'],
    ['REF5025', 'Nguồn tham chiếu 2,5 V', 'Cấp mức tham chiếu cho đo lường hoặc bộ chuyển đổi dữ liệu.'],
    ['LM4040', 'Tham chiếu shunt cố định', 'Tạo mức điện áp tham chiếu khi được phân cực bằng dòng thích hợp.'],
  ],
  diode: [
    ['1N4007', 'Diode chỉnh lưu', 'Chỉnh lưu nguồn tần số thấp hoặc chặn dòng ngược.', onsemi + '1n4001-d.pdf'],
    ['1N4148', 'Diode chuyển mạch', 'Chuyển trạng thái trong mạch tín hiệu nhỏ.', onsemi + '1n914-d.pdf'],
    ['1N5819', 'Diode Schottky', 'Chỉnh lưu khi muốn giảm sụt áp thuận so với nhiều diode silicon PN.', onsemi + '1n5817-d.pdf'],
    ['1N4733A', 'Diode Zener', 'Giới hạn điện áp trong mạch phân cực ngược có hạn dòng.', onsemi + '1n4736at-d.pdf'],
  ],
  transistor: [
    ['2N3904', 'Transistor NPN', 'Đóng cắt hoặc khuếch đại tín hiệu nhỏ.', onsemi + '2n3904-d.pdf'],
    ['2N3906', 'Transistor PNP', 'Minh họa phân cực của transistor PNP hoặc đóng cắt phía nguồn.', onsemi + '2n3906-d.pdf'],
    ['TIP120', 'Darlington NPN', 'Dùng cặp transistor ghép Darlington để tăng hệ số khuếch đại dòng.', onsemi + 'tip120-d.pdf'],
    ['IRLZ44N', 'MOSFET kênh N', 'Đóng cắt tải DC tùy theo điện áp kích cổng phù hợp.', 'https://www.infineon.com/part/IRLZ44N'],
    ['2N7000', 'MOSFET tín hiệu nhỏ', 'Đóng cắt tải nhỏ theo mức điện áp trên gate.', onsemi + '2n7000-d.pdf'],
  ],
  sensor: [
    ['TMP36', 'Nhiệt độ ngõ ra analog', 'Đổi nhiệt độ thành điện áp để đọc bằng ADC.', analog('TMP36')],
    ['DS18B20', 'Nhiệt kế số 1-Wire', 'Đọc nhiệt độ qua bus 1-Wire và phân biệt từng thiết bị theo địa chỉ.', analog('DS18B20')],
    ['TMP102', 'Cảm biến nhiệt độ I²C', 'Đọc nhiệt độ và theo dõi ngưỡng qua thanh ghi số.'],
    ['TMP117', 'Nhiệt kế số chính xác', 'Theo dõi nhiệt độ với dữ liệu số và ngõ cảnh báo lập trình được.'],
    ['HDC1080', 'Độ ẩm và nhiệt độ', 'Đo độ ẩm tương đối và nhiệt độ qua I²C.'],
    ['OPT3001', 'Cảm biến ánh sáng', 'Đọc độ rọi môi trường qua thanh ghi I²C.'],
    ['BME280', 'Áp suất, độ ẩm và nhiệt độ', 'Gom ba đại lượng môi trường vào một cảm biến số.', 'https://www.bosch-sensortec.com/products/environmental-sensors/humidity-sensors-bme280/'],
    ['DS3231', 'Đồng hồ thời gian thực', 'Giữ giờ và ngày bằng bộ dao động bù nhiệt, có hỗ trợ cấp nguồn dự phòng.', analog('DS3231')],
    ['ADXL345', 'Gia tốc kế ba trục', 'Đo gia tốc hoặc góc nghiêng gần tĩnh qua giao tiếp số.', analog('ADXL345')],
    ['VL53L0X', 'Đo khoảng cách ToF', 'Đo khoảng cách quang học bằng thời gian bay của tín hiệu.', 'https://www.st.com/en/imaging-and-photonics-solutions/vl53l0x.html'],
    ['LIS3DH', 'Gia tốc kế công suất thấp', 'Đo gia tốc ba trục và phát hiện ngắt chuyển động theo cấu hình.', 'https://www.st.com/en/mems-and-sensors/lis3dh.html'],
  ],
  audio: [
    ['LM386', 'Khuếch đại công suất âm tần', 'Tăng biên độ tín hiệu để điều khiển loa nhỏ.'],
    ['MAX98357A', 'Khuếch đại số I²S', 'Nhận dữ liệu âm thanh I²S và điều khiển loa bằng tầng Class D.', analog('MAX98357A')],
    ['TPA2012D2', 'Khuếch đại Class D stereo', 'Điều khiển hai kênh loa từ tín hiệu âm thanh analog.'],
    ['NE5532', 'Op-amp kép âm thanh', 'Lọc, đệm hoặc khuếch đại tín hiệu ở tầng tiền khuếch đại.'],
  ],
  driver: [
    ['L293D', 'Driver cầu H kép', 'Đảo chiều động cơ nhỏ hoặc điều khiển các cuộn dây bằng tầng công suất.', ti + 'L293'],
    ['DRV8833', 'Driver hai cầu H', 'Điều khiển hai motor DC hoặc một động cơ bước lưỡng cực.'],
    ['DRV8825', 'Driver động cơ bước', 'Điều khiển động cơ bước lưỡng cực với chế độ vi bước.'],
    ['ULN2003A', 'Mảng Darlington bảy kênh', 'Kéo dòng cho tải cảm như relay và cuộn dây động cơ bước nhỏ.'],
    ['ULN2803A', 'Mảng Darlington tám kênh', 'Đóng cắt nhiều tải từ các đầu vào logic.', 'https://www.st.com/en/interfaces-and-transceivers/uln2803a.html'],
    ['DRV8871', 'Cầu H cho motor DC', 'Đảo chiều và điều chỉnh dòng của một động cơ DC chổi than.'],
  ],
  display: [
    ['MAX6951', 'Driver hiển thị bảy đoạn', 'Quét các chữ số LED với điều khiển nối tiếp.', analog('MAX6951')],
    ['TLC5940', 'Driver LED PWM', 'Điều chỉnh độ sáng từng kênh bằng PWM và ngõ ra dòng không đổi.'],
    ['TLC5928', 'Driver LED dòng không đổi', 'Nhận dữ liệu nối tiếp để bật tắt từng kênh LED.'],
    ['TLC59116', 'Driver LED I²C', 'Điều khiển độ sáng riêng và theo nhóm qua I²C.'],
    ['TLC5916', 'Driver LED tám kênh', 'Điều khiển nhiều đèn LED qua thanh ghi nối tiếp.'],
  ],
  logic: [
    ['SN74HC02', 'Bốn cổng NOR', 'Đầu ra ở mức cao khi cả hai đầu vào đều thấp.'],
    ['SN74HC04', 'Sáu cổng đảo', 'Đảo mức logic của một tín hiệu vào.'],
    ['SN74HC08', 'Bốn cổng AND', 'Đầu ra lên mức cao khi cả hai đầu vào cao.'],
    ['SN74HC14', 'Sáu cổng đảo Schmitt', 'Làm sạch cạnh tín hiệu nhờ hai ngưỡng chuyển khác nhau.'],
    ['SN74HC32', 'Bốn cổng OR', 'Đầu ra lên mức cao khi có ít nhất một đầu vào cao.'],
    ['SN74HC86', 'Bốn cổng XOR', 'So sánh hai bit hoặc tạo bit tổng trong mạch cộng.'],
    ['SN74HC74', 'Hai flip-flop D', 'Lưu mức đầu vào tại cạnh lên của clock, có preset và clear.'],
    ['SN74HC125', 'Bộ đệm ba trạng thái', 'Kết nối đầu ra tới bus khi tín hiệu cho phép ở mức thấp.'],
    ['SN74HC126', 'Bộ đệm cho phép mức cao', 'Điều khiển đầu ra ba trạng thái từ tín hiệu cho phép mức cao.'],
    ['SN74HC138', 'Giải mã 3 sang 8', 'Chọn một trong tám đầu ra tích cực mức thấp.'],
    ['SN74HC139', 'Hai bộ giải mã 2 sang 4', 'Chọn độc lập một trong bốn đầu ra trên mỗi nửa IC.'],
    ['SN74HC151', 'Chọn dữ liệu 8 sang 1', 'Chọn một bit trong tám đầu vào bằng ba bit địa chỉ.'],
    ['SN74HC153', 'Hai bộ chọn dữ liệu 4 sang 1', 'Chọn đồng thời hai đường tín hiệu theo cùng địa chỉ.'],
    ['SN74HC157', 'Bốn bộ chọn 2 sang 1', 'Chọn một trong hai nhóm dữ liệu bốn bit.'],
    ['SN74HC165', 'Thanh ghi dịch vào song song', 'Đọc nhiều đầu vào rồi chuyển từng bit ra nối tiếp.'],
    ['SN74HC164', 'Thanh ghi dịch ra song song', 'Dịch dữ liệu nối tiếp ra các ngõ song song theo từng xung clock.'],
    ['SN74HC245', 'Thu phát bus hai chiều', 'Đặt hướng truyền giữa hai bus song song tám bit.'],
    ['SN74HC595', 'Thanh ghi dịch có chốt', 'Mở rộng đầu ra song song bằng dữ liệu nối tiếp và chốt riêng.'],
  ],
  interface: [
    ['CD4051B', 'Bộ chọn kênh analog 8 sang 1', 'Nối một trong tám tín hiệu analog với nút chung.'],
    ['CD74HC4067', 'Bộ chọn kênh analog 16 sang 1', 'Mở rộng số tín hiệu có thể đưa tới một đầu đo.'],
    ['PCF8574', 'Mở rộng cổng I²C', 'Thêm tám đường I/O kiểu quasi-bidirectional qua I²C.'],
    ['MCP23017', 'Mở rộng GPIO I²C', 'Thêm 16 GPIO và theo dõi thay đổi đầu vào qua ngắt.', 'https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP23017-Data-Sheet-DS20001952.pdf'],
    ['24LC256', 'EEPROM nối tiếp', 'Giữ cấu hình sau khi tắt nguồn và đọc lại qua I²C.', 'https://ww1.microchip.com/downloads/en/DeviceDoc/24AA256-24LC256-24FC256-256-Kbit-I2C-Serial-EEPROM-20001203X.pdf'],
    ['MCP3008', 'ADC nhiều kênh SPI', 'Chuyển các điện áp analog thành dữ liệu số để đọc qua SPI.', 'https://ww1.microchip.com/downloads/aemDocuments/documents/MSLD/ProductDocuments/DataSheets/MCP3004-MCP3008-Data-Sheet-DS20001295.pdf'],
    ['MCP4921', 'DAC điều khiển qua SPI', 'Tạo điện áp đầu ra từ mã số được ghi qua SPI.', 'https://ww1.microchip.com/downloads/en/DeviceDoc/21897B.pdf'],
    ['ADS1115', 'ADC có bộ khuếch đại PGA', 'Đo tín hiệu analog đơn hoặc vi sai và đọc kết quả qua I²C.'],
    ['TCA9548A', 'Công tắc I²C tám kênh', 'Tách các nhánh bus I²C khi nhiều thiết bị trùng địa chỉ.'],
    ['LM358', 'Op-amp kép', 'Khuếch đại, đệm hoặc lọc tín hiệu analog trong các mạch đo.'],
    ['LM393', 'Comparator kép', 'So sánh hai điện áp với đầu ra kiểu cực thu hở.'],
    ['SN65HVD230', 'Transceiver CAN', 'Chuyển tín hiệu logic của bộ điều khiển CAN sang bus vi sai.'],
    ['MAX3232', 'Transceiver RS-232', 'Chuyển mức logic giữa UART và đường truyền RS-232.'],
  ],
  board: [
    ['239', 'Breadboard 830 điểm', 'Dựng mạch thử lớn trên bảng cắm không hàn của Adafruit.', 'https://www.adafruit.com/product/239'],
    ['65', 'Breadboard 170 điểm', 'Dựng các mạch thử gọn trên bảng cắm mini của Adafruit.', 'https://www.adafruit.com/product/65'],
  ],
}

// These are reference records. They do not register physical footprints or simulator parts.
export const expandedCatalog = Object.entries(entries).flatMap(([key, rows]) => {
  const family = key as Family
  const { category, context } = families[family]
  return rows.map(([code, title, purpose, url = ti + code]) => {
    const id = family === 'board' ? `breadboard-adafruit-${code}` : code.toLowerCase()
    const part: ComponentRecord = {
      id,
      name: family === 'board' ? title : `${code} · ${title}`,
      category,
      summary: purpose,
      pins: family === 'board'
        ? 'Các lỗ cắm thuộc từng nhóm tiếp điểm. Xem sơ đồ liên kết của mẫu trong tài liệu.'
        : 'Xem sơ đồ chân và chức năng theo đúng mã đặt hàng và package trong tài liệu hãng.',
      use: family === 'board' ? 'Lắp thử không hàn và thay đổi vị trí dây khi kiểm mạch.' : context,
      caution: 'Đối chiếu tài liệu của đúng phiên bản trước khi chọn linh kiện cho mạch thật.',
      tags: [code, ...code.match(/^SN(74.+)$/)?.slice(1) ?? [], category],
      source: url,
    }
    const reference: ComponentReference = {
      label: family === 'board' ? `Adafruit · ${code}` : `Tài liệu hãng · ${code}`,
      url,
      kind: family === 'board' ? 'Tài liệu board' : 'Datasheet chip',
      note: context,
    }
    return { part, reference, family, code }
  })
})
