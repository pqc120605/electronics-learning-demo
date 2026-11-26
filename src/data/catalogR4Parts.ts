import type { ComponentPin, ElectricalType } from './componentRegistry'

export const catalogR4Approval = '674fd405fcb4ca7641fe2f20e29023d2727f03e5edcc1cfbe64dfeae6803faa3'

export const r4ControllerType = 'r4-controller'
export const r4ControllerSignals = ['sda','scl','dq','data','clock','latch','blank','gsclk','feedback','alert'] as const

const types: Record<string, ElectricalType> = {
  i: 'input', o: 'output', b: 'bidirectional', v: 'power', g: 'ground', p: 'passive',
}
const ti = (name: string) => 'https://www.ti.com/lit/ds/symlink/' + name + '.pdf'
const adi = (name: string) => 'https://www.analog.com/media/en/technical-documentation/data-sheets/' + name + '.pdf'
const st = (name: string) => 'https://www.st.com/resource/en/datasheet/' + name + '.pdf'

function define<Id extends string>(catalogId: Id, mpn: string, manufacturer: string,
  packageName: string, source: string, pinoutPage: number, bus: 'i2c' | 'one-wire' | 'serial',
  pads: string, scope: string, labels: Record<string, string> = {}) {
  return {
    id: `${catalogId}-r4` as const, catalogId, mpn, manufacturer, packageName, packageKey: `${catalogId}R4` as const,
    source, datasheet: mpn, pinoutPage, scope, revision: 'R4' as const, simulation: 'digital' as const, bus,
    pins: pads.split(' ').map((entry, index): ComponentPin & { pad: number } => {
      const [id, role = 'p'] = entry.split(':')
      return { id, label: labels[id] ?? id.toUpperCase(), electricalType: types[role], pad: index + 1 }
    }),
  }
}

const outputs = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => 'out' + (i + from) + ':o').join(' ')
const tempPins = 'scl:i gnd:g alert:o addr:i vcc:v sda:b'
const tempLabels = { addr: 'ADD0', vcc: 'V+' }

export const catalogR4Parts = [
  define('ds18b20', 'DS18B20+', 'Analog Devices', 'TO-92', adi('DS18B20'), 4, 'one-wire',
    'gnd:g dq:b vdd:v', 'Một thiết bị 1-Wire, cấp nguồn ngoài. Đo 12 bit, scratchpad và CRC-8.'),
  define('tmp102', 'TMP102AIDRLR', 'Texas Instruments', 'SOT-563 · DRL', ti('tmp102'), 3, 'i2c',
    tempPins, 'Nhiệt độ 12 bit, 4 mẫu/giây và ngõ ALERT với hai ngưỡng.', tempLabels),
  define('tmp117', 'TMP117AIDRVR', 'Texas Instruments', 'WSON-6 · DRV', ti('tmp117'), 4, 'i2c',
    tempPins + ' ep', 'Đo một lần, dữ liệu có dấu và cờ mẫu mới. Pad nhiệt để hở.', tempLabels),
  define('hdc1080', 'HDC1080DMBR', 'Texas Instruments', 'PWSON-6 · DMB', ti('hdc1080'), 3, 'i2c',
    'sda:b gnd:g nc3 nc4 vdd:v scl:i dap', 'Đọc cặp nhiệt độ và độ ẩm qua I²C. Vùng nhạy nằm trên mặt trên.',
    { nc3: 'NC', nc4: 'NC', dap: 'DAP · để hở' }),
  define('opt3001', 'OPT3001DNPR', 'Texas Instruments', 'USON-6 · DNP0006A', ti('opt3001'), 3, 'i2c',
    'vdd:v addr:i gnd:g scl:i int:o sda:b ep', 'Đo độ rọi một lần, tự chọn dải, đọc số mũ và phần định trị.'),
  define('bme280', 'BME280 · 0 273 141 185', 'Bosch Sensortec', 'LGA-8 · 2,5 × 2,5 mm',
    'https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf', 9, 'i2c',
    'gnd:g csb:i sda:b scl:i sdo:b vddio:v gnd7:g vdd:v',
    'Đo forced-mode. Đọc mẫu thô, hệ số hiệu chuẩn và tính bù nhiệt độ, áp suất, độ ẩm.',
    { sda: 'SDI / SDA', scl: 'SCK / SCL', gnd7: 'GND' }),
  define('ds3231', 'DS3231SN#', 'Analog Devices', 'SOIC-16W · W16#H2', adi('DS3231'), 9, 'i2c',
    'clk32:o vcc:v int:o rst:b nc5:g nc6:g nc7:g nc8:g nc9:g nc10:g nc11:g nc12:g gnd:g vbat:v sda:b scl:i',
    'Đồng hồ 24 giờ, ngày nhuận và pin dự phòng. Pad 5–12 nối mass.',
    { clk32: '32 kHz', int: '/INT / SQW', rst: '/RST', ...Object.fromEntries(Array.from({length: 8}, (_, i) => ['nc' + (i + 5), 'NC → GND'])) }),
  define('adxl345', 'ADXL345BCCZ', 'Analog Devices', 'LGA-14 · CC-14-1', adi('ADXL345'), 6, 'i2c',
    'vddio:v gnd2:g res3 gnd4:g gnd5:g vs:v cs:i int1:o int2:o nc10 res11 sdo:b sda:b scl:i',
    'Gia tốc XYZ ±2 g ở 100 Hz. Dữ liệu có dấu và cờ sẵn sàng.',
    { gnd2: 'GND', gnd4: 'GND', gnd5: 'GND', res3: 'RES', res11: 'RES', nc10: 'NC', sdo: 'SDO / ALT_ADDR', sda: 'SDA / SDI / SDIO', scl: 'SCL / SCLK' }),
  define('vl53l0x', 'VL53L0CXV0DH/1', 'STMicroelectronics', 'Optical LGA-12', st('vl53l0x'), 4, 'i2c',
    'avddvcsel:v avssvcsel:g gnd:g gnd2:g xshut:i gnd3:g gpio1:o dnc sda:b scl:i avdd:v gnd4:g',
    'Đọc khoảng cách ảo single-shot qua I²C 2,8 V và kiểm XSHUT.'),
  define('lis3dh', 'LIS3DHTR', 'STMicroelectronics', 'LGA-16 · 3 × 3 mm', st('lis3dh'), 9, 'i2c',
    'vddio:v nc2 nc3 scl:i gnd5:g sda:b sdo:b cs:i int2:o res:g int1:o gnd:g adc3:i vdd:v adc2:i adc1:i',
    'Đọc XYZ 12 bit ở 100 Hz với snapshot BDU và auto-increment.',
    { vddio: 'VDD_IO', nc2: 'NC', nc3: 'NC', gnd5: 'GND', res: 'RES → GND', scl: 'SCL / SPC', sda: 'SDA / SDI / SDO', sdo: 'SDO / SA0' }),
  define('max6951', 'MAX6951CEE+', 'Analog Devices', 'QSOP-16-EP · E16E-10', adi('MAX6950-MAX6951'), 1, 'serial',
    'din:i clk:i seg3:b seg2:b seg1:b seg0:b iset gnd:g osc:i seg8:o seg7:b seg6:b seg5:b seg4:b cs:i vcc:v ep',
    'Quét LED cathode chung, cập nhật và giải mã từng chữ số.',
    { cs: '/CS', vcc: 'V+', ep: 'EP · GND trên PCB', ...Object.fromEntries(Array.from({length: 8}, (_, i) => ['seg' + i, 'DIG' + i + ' / SEG' + i])) }),
  define('tlc5940', 'TLC5940NT', 'Texas Instruments', 'PDIP-28 · NT', ti('tlc5940'), 3, 'serial',
    outputs(1,15) + ' xerr:o sout:o gsclk:i dcprg:i iref vcc:v gnd:g blank:i xlat:i sclk:i sin:i vprg:i out0:o',
    'Chốt 192 bit, PWM 12 bit và xung GSCLK. Dùng dot correction EEPROM mặc định.', { xerr: '/XERR' }),
  define('tlc5928', 'TLC5928PWPR', 'Texas Instruments', 'HTSSOP-24 · PWP0024B', ti('tlc5928'), 7, 'serial',
    'gnd:g sin:i sclk:i lat:i ' + outputs(0,15) + ' blank:i sout:o iref vcc:v ep:g',
    'Chốt 16 kênh hút dòng. Kiểm BLANK và pad tản nhiệt nối GND.', { ep: 'EP → GND' }),
  define('tlc59116', 'TLC59116IPWR', 'Texas Instruments', 'TSSOP-28 · PW', ti('tlc59116'), 4, 'i2c',
    'rext a0:i a1:i a2:i a3:i ' + outputs(0,3) + ' gnd10:g ' + outputs(4,11) + ' gnd19:g ' + outputs(12,15) + ' gnd:g reset:i scl:i sda:b vcc:v',
    'Đặt chế độ và duty của từng kênh bằng PWM và LEDOUT trên I²C.',
    { gnd10: 'GND', gnd19: 'GND', reset: '/RESET' }),
  define('tlc5916', 'TLC5916IN', 'Texas Instruments', 'PDIP-16 · N', ti('tlc5916'), 3, 'serial',
    'gnd:g sdi:i clk:i le:i ' + outputs(0,7) + ' oe:i sdo:o rext vdd:v',
    'Normal mode, 8 bit, chốt LE và đầu ra Hi-Z khi /OE cao.', { oe: '/OE / ED2', le: 'LE / ED1', rext: 'R-EXT' }),
] as const

export type R4Part = typeof catalogR4Parts[number]
export type R4Model = R4Part['catalogId']

export const getR4PartByType = (type: string) => catalogR4Parts.find(part => part.id === type)
