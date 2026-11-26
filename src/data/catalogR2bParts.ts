import type { ComponentPin, ElectricalType } from './componentRegistry'

export const catalogR2bApproval = 'e9c5113901fad2fdfcc24589db2caea701a4692f5a90aa73499bd025ec0670c4'

export const r2bPackages = {
  dip8: { asset: 'Package_DIP/DIP-8_W7.62mm',
    footprintSha: '44500fc2989169a1ea877ba89e69cd60d0a77414af60fd2d1997de5569f2dee5',
    stepSha: '4a377a56a8d9e9c0b86c095ef9ecc1869ac19e7f5069a3247b294250bf4f235d', mount: 'breadboard' },
  dip16: { asset: 'Package_DIP/DIP-16_W7.62mm',
    footprintSha: '08cec2c2fafeffb19d0c6d17db37b67017e6518147516b0b75e6a4719b235465',
    stepSha: '17a30b1f0ab3fd5384a1231e3c63c394888d5b952c542a8c189e023ed3467464', mount: 'breadboard' },
  dip28: { asset: 'Package_DIP/DIP-28_W7.62mm',
    footprintSha: '554208c80f8bd504ce7a1dfcb1b5321c6cd89a465f2deb73d92bce1a1f5e9a8b',
    stepSha: '7bf4503e368ad9b7a3eddfa94bc8dee656da5d6921b677e17307b3d7f29177ab', mount: 'breadboard' },
  tssop24: { asset: 'Package_SO/TSSOP-24_4.4x7.8mm_P0.65mm',
    footprintSha: 'f90a7d7f67e28018a3cd6412407f451a79c53ad36e334329b114cdd895a47106',
    stepSha: '706322f42d9793ebf28d5b80100a68bfa8769998a00b78acadf7af937fc1454f', mount: 'bench' },
  dgs10: { asset: 'Package_SO/TSSOP-10_3x3mm_P0.5mm',
    footprintSha: 'e54c3d2d0c55b0b4f834390bf39f761cf5314cc77aac950ad7fe1d9f61803c66',
    stepSha: '39602ed75f3c6c524a0e4bab680480a2804b32aa5aa5eb0d979f088f4fb9c652', mount: 'bench' },
  soic8: { asset: 'Package_SO/SOIC-8_3.9x4.9mm_P1.27mm',
    footprintSha: '3c9b63198dd4dbf5e6c28c84702c29fad46a35103b821a19306c4ac888ad8e76',
    stepSha: '07f46cff378d30e6c27dfd5a03092c795323f86d91c71fc7e743f4f418dc553a', mount: 'bench' },
  soic16: { asset: 'Package_SO/SOIC-16_3.9x9.9mm_P1.27mm',
    footprintSha: 'a3e0cad48591b1bf41f77aa964868c62b28d32f1014a42a763a17ac184231f7f',
    stepSha: 'd5eeddb4c0b304dc61950919b126fc61d7586abd5f16ab71a2a79759ec6498bf', mount: 'bench' },
} as const

export type R2bModel = 'cd4051b' | 'cd74hc4067' | 'pcf8574' | 'mcp23017' | '24lc256' | 'mcp4921' |
  'ads1115' | 'tca9548a' | 'lm358' | 'lm393' | 'sn65hvd230' | 'max3232'

const ti = 'https://www.ti.com/lit/ds/symlink/'
const microchip = 'https://ww1.microchip.com/downloads/'
const roles: Record<string, ElectricalType> = { i: 'input', o: 'output', b: 'bidirectional', v: 'power', g: 'ground', n: 'passive' }

function define(catalogId: R2bModel, mpn: string, packageName: string, packageKey: keyof typeof r2bPackages,
  datasheet: string, source: string, pinoutPage: number, scope: string, pads: string,
  labels: Record<string, string> = {}) {
  return {
    id: catalogId + '-r2b', catalogId, mpn, manufacturer: source.startsWith(ti) ? 'Texas Instruments' : 'Microchip',
    packageName, packageKey, datasheet, source, pinoutPage, scope, revision: 'R2B' as const, simulation: 'interface' as const,
    pins: pads.split(' ').map((entry, index): ComponentPin & { pad: number } => {
      const [id, role = 'i'] = entry.split(':')
      return { id, label: labels[id] ?? id.toUpperCase(), electricalType: roles[role], pad: index + 1 }
    }),
  }
}

const channels = (prefix: string, first: number, count: number, role: string) =>
  Array.from({ length: count }, (_, i) => prefix + (first + i) + ':' + role).join(' ')
const branch = (first: number, count: number) =>
  Array.from({ length: count }, (_, i) => 'sd' + (first + i) + ':b sc' + (first + i) + ':b').join(' ')
const dual = 'out1:o in1n in1p gnd:g in2p in2n out2:o vcc:v'
const dualLabels = { in1p: '1IN+', in1n: '1IN−', in2p: '2IN+', in2n: '2IN−' }

export const catalogR2bParts = [
  define('cd4051b', 'CD4051BE', 'PDIP-16 (N)', 'dip16', 'CD405xB Rev. O', ti + 'cd4051b.pdf', 3,
    'Công tắc analog 8 kênh hai chiều, INH mức cao nhả mọi kênh. VDD 5 V, VSS và VEE về 0 V.',
    'ch4:b ch6:b com:b ch7:b ch5:b inh vee:g gnd:g c b a ch3:b ch0:b ch1:b ch2:b vcc:v',
    { vcc: 'VDD', gnd: 'VSS' }),
  define('cd74hc4067', 'CD74HC4067PWR', 'TSSOP-24 (PW)', 'tssop24', 'CD74HCx4067 Rev. D', ti + 'cd74hc4067.pdf', 4,
    'Công tắc analog 16 kênh hai chiều. S0 là bit thấp, /E mức cao nhả mọi kênh. Nguồn 5 V.',
    'com:b ch7:b ch6:b ch5:b ch4:b ch3:b ch2:b ch1:b ch0:b s0 s1 gnd:g s3 s2 en ch15:b ch14:b ch13:b ch12:b ch11:b ch10:b ch9:b ch8:b vcc:v',
    { en: '/E' }),
  define('pcf8574', 'PCF8574N', 'PDIP-16 (N)', 'dip16', 'PCF8574 Rev. K', ti + 'pcf8574.pdf', 3,
    'I²C 100 kHz, 5 V. Tám cổng quasi-bidirectional. Chốt 1 kéo lên yếu, chốt 0 kéo xuống.',
    'a0 a1 a2 ' + channels('p',0,4,'b') + ' gnd:g ' + channels('p',4,4,'b') + ' int:o scl sda:b vcc:v',
    { int: '/INT' }),
  define('mcp23017', 'MCP23017-E/SP', 'SPDIP-28 (SP), 300 mil', 'dip28', 'DS20001952',
    microchip + 'aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP23017-Data-Sheet-DS20001952.pdf', 1,
    'I²C 100 kHz, 5 V, BANK=0. Hai nhóm GPIO và ngắt đổi mức. GPA7 và GPB7 dùng làm đầu ra.',
    channels('gpb',0,7,'b') + ' gpb7:o vcc:v gnd:g nc11:n scl sda:b nc14:n a0 a1 a2 reset intb:o inta:o ' + channels('gpa',0,7,'b') + ' gpa7:o',
    { nc11: 'NC', nc14: 'NC', reset: '/RESET', vcc: 'VDD', gnd: 'VSS' }),
  define('24lc256', '24LC256-I/P', 'PDIP-8 (P), 300 mil', 'dip8', 'DS20001203X',
    microchip + 'en/DeviceDoc/24AA256-24LC256-24FC256-256-Kbit-I2C-Serial-EEPROM-20001203X.pdf', 1,
    'EEPROM 32 KiB, page 64 byte. I²C 100 kHz, 5 V. Giữ dữ liệu trong phiên chạy khi ngắt nguồn ảo.',
    'a0 a1 a2 gnd:g sda:b scl wp vcc:v', { gnd: 'VSS' }),
  define('mcp4921', 'MCP4921-E/P', 'PDIP-8 (P), 300 mil', 'dip8', 'DS21897B', microchip + 'en/DeviceDoc/21897B.pdf', 1,
    'DAC 12 bit. VDD 5 V, VREF 2,500 V, SPI mode 0 MSB-first ở 1 MHz. /LDAC chốt điện áp.',
    'vcc:v cs sck sdi ldac vref gnd:g vout:o', { vcc:'VDD', cs:'/CS', ldac:'/LDAC', gnd:'VSS' }),
  define('ads1115', 'ADS1115IDGSR', 'VSSOP-10 (DGS0010A)', 'dgs10', 'ADS111x Rev. E', ti + 'ads1115.pdf', 3,
    'ADC có dấu 16 bit. 5 V, 100 kHz, single-shot 128 SPS, dải ±2,048 V và comparator tắt.',
    'addr alert:o gnd:g ain0 ain1 ain2 ain3 vcc:v sda:b scl', { alert: 'ALERT/RDY', vcc: 'VDD' }),
  define('tca9548a', 'TCA9548APWR', 'TSSOP-24 (PW)', 'tssop24', 'TCA9548A Rev. H', ti + 'tca9548a.pdf', 3,
    'Công tắc I²C 8 nhánh. 5 V, 100 kHz. Mặt nạ có hiệu lực sau STOP, reset đóng ngắt toàn bộ.',
    'a0 a1 reset ' + branch(0,4) + ' gnd:g ' + branch(4,4) + ' a2 scl:b sda:b vcc:v', { reset: '/RESET' }),
  define('lm358', 'LM358P', 'PDIP-8 (P)', 'dip8', 'LM358 Rev. AB', ti + 'lm358.pdf', 3,
    'Hai op-amp mô hình DC, nguồn đơn 5 V tại 25 °C. Thử bộ đệm và hồi tiếp không đảo.',
    dual, { ...dualLabels, gnd: 'V−', vcc: 'V+' }),
  define('lm393', 'LM393P', 'PDIP-8 (P)', 'dip8', 'LM393 Rev. AH', ti + 'lm393.pdf', 3,
    'Hai comparator open-collector. Mô hình DC 5 V tại 25 °C với kéo lên 10 kΩ.',
    dual, dualLabels),
  define('sn65hvd230', 'SN65HVD230DR', 'SOIC-8 (D)', 'soic8', 'SN65HVD23x Rev. O', ti + 'sn65hvd230.pdf', 5,
    'Transceiver CAN 3,3 V. Hai đầu tuyến 120 Ω. Kiểm dominant, recessive, standby và ngưỡng vi sai.',
    'd gnd:g vcc:v r:o vref:o canl:b canh:b rs'),
  define('max3232', 'MAX3232EIDR', 'SOIC-16 hẹp (D)', 'soic16', 'MAX3232E Rev. E', ti + 'max3232e.pdf', 3,
    'Hai đường phát/thu RS-232 đảo mức. Nguồn 3,3 V, C1–C4 100 nF, tải phát 3 kΩ, ±5 V danh định.',
    'c1p:n vp:o c1n:n c2p:n c2n:n vn:o dout2:o rin2 rout2:o din2 din1 rout1:o rin1 dout1:o gnd:g vcc:v',
    { c1p:'C1+', c1n:'C1−', c2p:'C2+', c2n:'C2−', vp:'V+', vn:'V−' }),
]

export type CatalogR2bPart = typeof catalogR2bParts[number]
