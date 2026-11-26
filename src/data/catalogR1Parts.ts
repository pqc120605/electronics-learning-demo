import type { ComponentPin, ElectricalType } from './componentRegistry'

export const catalogR1Approval = '3f2b432af585d7cb547777d6fb2b6bd5aa4737b1e3c91085e8a99c73d0fad947'

export const r1Packages = {
  dip14: { asset: 'Package_DIP/DIP-14_W7.62mm', footprintSha: '6e9fc056d23e88e219b9e20d58ff74e1d351ca9a77a7b3e6b633f5475d6040f1', stepSha: '3dae072a95c64bee0d1e58be8e75383639f5017ab982de1749d05808a4eed058', mount: 'breadboard' },
  dip16: { asset: 'Package_DIP/DIP-16_W7.62mm', footprintSha: '08cec2c2fafeffb19d0c6d17db37b67017e6518147516b0b75e6a4719b235465', stepSha: '17a30b1f0ab3fd5384a1231e3c63c394888d5b952c542a8c189e023ed3467464', mount: 'breadboard' },
  do35: { asset: 'Diode_THT/D_DO-35_SOD27_P7.62mm_Horizontal', footprintSha: '815fad98c36b0836240b8b93ae4ff4b6a6006c6f64b987f73e4faf078eedd8cd', stepSha: '9704292191fcb13b3dfc88c1e572df18313ac20023bb230486c878d8dddfdb54', mount: 'breadboard' },
  to92: { asset: 'Package_TO_SOT_THT/TO-92_Inline', footprintSha: 'fc2e306a210a4f40c12f2af3cc09bf923761c9faadfeed9e6d331799a6bde77d', stepSha: 'f0b61c32ecbf0067157adc5a3d4966ceadf5d6dafe93c51af35f76c41c71a54a', mount: 'bench' },
} as const

type Pin = ComponentPin & { pad: number }
type PackageKey = keyof typeof r1Packages
type CatalogPartR1 = {
  id: string
  catalogId: string
  mpn: string
  manufacturer: string
  packageName: string
  packageKey: PackageKey
  source: string
  scope: string
  simulation: 'digital' | 'spice'
  pins: Pin[]
}

function define(part: Omit<CatalogPartR1, 'id' | 'pins'>, pins: readonly (readonly [string, ElectricalType, string?])[]): CatalogPartR1 {
  return {
    ...part,
    id: part.catalogId + '-r1',
    pins: pins.map(([name, electricalType, label], index) => ({
      id: name.toLowerCase(),
      label: label ?? name,
      electricalType,
      pad: index + 1,
    })),
  }
}

const ground = ['GND', 'ground'] as const
const supply = ['VCC', 'power'] as const
const input = (name: string, label?: string) => [name, 'input', label] as const
const output = (name: string, label?: string) => [name, 'output', label] as const
const ti = 'https://www.ti.com/lit/ds/symlink/'

export const catalogR1Parts = [
  define({ catalogId: 'sn74hc08', mpn: 'SN74HC08N', manufacturer: 'Texas Instruments', packageName: 'PDIP-14 (N)',
    packageKey: 'dip14', source: ti + 'sn74hc08.pdf', simulation: 'digital',
    scope: 'Bốn cổng AND. Đầu vào logic xác định, đầu vào trôi và trạng thái mất nguồn ở bài thực hành.' },
  [input('1A'), input('1B'), output('1Y'), input('2A'), input('2B'), output('2Y'), ground,
   output('3Y'), input('3A'), input('3B'), output('4Y'), input('4A'), input('4B'), supply]),
  define({ catalogId: 'sn74hc14', mpn: 'SN74HC14N', manufacturer: 'Texas Instruments', packageName: 'PDIP-14 (N)',
    packageKey: 'dip14', source: ti + 'sn74hc14.pdf', simulation: 'digital',
    scope: 'Sáu cổng đảo Schmitt. Ngưỡng điển hình 2,5 V khi tăng và 1,6 V khi giảm, VCC 4,5 V và 25 °C.' },
  [input('1A'), output('1Y'), input('2A'), output('2Y'), input('3A'), output('3Y'), ground,
   output('4Y'), input('4A'), output('5Y'), input('5A'), output('6Y'), input('6A'), supply]),
  define({ catalogId: 'sn74hc74', mpn: 'SN74HC74N', manufacturer: 'Texas Instruments', packageName: 'PDIP-14 (N)',
    packageKey: 'dip14', source: ti + 'sn74hc74.pdf', simulation: 'digital',
    scope: 'Hai flip-flop D, cạnh lên của clock và điều khiển bất đồng bộ mức thấp. Thời điểm mô phỏng theo sự kiện.' },
  [input('1CLR','1/CLR'), input('1D'), input('1CLK'), input('1PRE','1/PRE'), output('1Q'), output('1QN','1/Q'), ground,
   output('2QN','2/Q'), output('2Q'), input('2PRE','2/PRE'), input('2CLK'), input('2D'), input('2CLR','2/CLR'), supply]),
  define({ catalogId: 'sn74hc595', mpn: 'SN74HC595N', manufacturer: 'Texas Instruments', packageName: 'PDIP-16 (N)',
    packageKey: 'dip16', source: ti + 'sn74hc595.pdf', simulation: 'digital',
    scope: 'Dịch dữ liệu 8 bit, chốt đầu ra, reset thanh ghi dịch, nối tiếp QH′ và ba trạng thái khi ngắt ngõ ra.' },
  [output('QB'), output('QC'), output('QD'), output('QE'), output('QF'), output('QG'), output('QH'), ground,
   output('QHS','QH′'), input('SRCLR','/SRCLR'), input('SRCLK'), input('RCLK'), input('OE','/OE'), input('SER'), output('QA'), supply]),
  define({ catalogId: '1n4148', mpn: '1N4148-TAP', manufacturer: 'Vishay', packageName: 'DO-35 · lắp ngang 7,62 mm',
    packageKey: 'do35', source: 'https://www.vishay.com/docs/81857/1n4148.pdf', simulation: 'spice',
    scope: 'Đặc tuyến thuận DC tại 1, 5, 10 mA và dòng rò ngược tại 20 V, ở 25 °C.' },
  [['K', 'passive', 'K · Cathode'], ['A', 'passive', 'A · Anode']]),
  define({ catalogId: '2n3904', mpn: '2N3904BU', manufacturer: 'onsemi', packageName: 'TO-92-3 · chân thẳng',
    packageKey: 'to92', source: 'https://www.onsemi.com/download/data-sheet/pdf/2n3904-d.pdf', simulation: 'spice',
    scope: 'Kiểm dòng ngắt, hFE và VCE bão hòa với ngspice tại các điểm 25 °C trong datasheet.' },
  [['E', 'passive', 'E · Emitter'], ['B', 'input', 'B · Base'], ['C', 'passive', 'C · Collector']]),
  define({ catalogId: 'tmp36', mpn: 'TMP36GT9Z', manufacturer: 'Analog Devices', packageName: 'TO-92 (T-3-1) · chân thẳng',
    packageKey: 'to92', source: 'https://www.analog.com/media/en/technical-documentation/data-sheets/tmp35_36_37.pdf', simulation: 'spice',
    scope: 'Điện áp ra điển hình với nguồn 3,3 V, tải trở kháng cao và nhiệt độ 0–75 °C.' },
  [['VS', 'power', '+VS'], output('VOUT'), ground]),
  define({ catalogId: 'mcp3008', mpn: 'MCP3008-I/P', manufacturer: 'Microchip', packageName: 'PDIP-16 · 300 mil',
    packageKey: 'dip16', source: 'https://ww1.microchip.com/downloads/aemDocuments/documents/MSLD/ProductDocuments/DataSheets/MCP3004-MCP3008-Data-Sheet-DS20001295.pdf', simulation: 'digital',
    scope: 'Tám kênh single-ended, lượng tử hóa 10 bit lý tưởng và SPI mode 0, 1 MHz ở VDD = VREF = 5 V.' },
  [...Array.from({ length: 8 }, (_, index) => input('CH' + index)), ['DGND','ground'], input('CS','/CS/SHDN'),
   input('DIN'), output('DOUT'), input('SCLK'), ['AGND','ground'], ['VREF','power'], ['VDD','power']]),
]

export function getCatalogR1Part(id: string | undefined) {
  return catalogR1Parts.find((part) => part.id === id || part.catalogId === id)
}
