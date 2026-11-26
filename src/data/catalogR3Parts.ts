import type { ComponentPin, ElectricalType } from './componentRegistry'

export const catalogR3Approval = '60db39dbfd91ebdb56032615a8b9afb0974626b4e8f57f0b06577345f94eed81'

export const r3Packages = {
  to220R3: { asset: 'Package_TO_SOT_THT/TO-220-3_Vertical',
    footprintSha: 'e116fbdc5f090042cbd25c86eaef6544bb417581019e1d2da0b5dc6e40b7b4bf',
    stepSha: '7cb065d935df5771f0ba6e48ddd180863a121af76483dad7f18e667a7b68204a', mount: 'breadboard' },
  to220StaggeredR3: { asset: 'Package_TO_SOT_THT/TO-220-5_P3.4x3.7mm_StaggerOdd_Lead3.8mm_Vertical',
    footprintSha: 'db543cd4143bd5b86f98b338a0913d47e98ea7e6e44574a07509493345bb4f1a',
    stepSha: 'd7962bdb0828f2d617258183df50c90920ef8e316727b628ecb8671809b4efcf', mount: 'bench' },
  to92R3: { asset: 'Package_TO_SOT_THT/TO-92_Inline',
    footprintSha: 'fc2e306a210a4f40c12f2af3cc09bf923761c9faadfeed9e6d331799a6bde77d',
    stepSha: 'f0b61c32ecbf0067157adc5a3d4966ceadf5d6dafe93c51af35f76c41c71a54a', mount: 'bench' },
  sot563R3: { asset: 'Package_TO_SOT_SMD/SOT-563',
    footprintSha: '5db336475df2eb434a83572346092efba42569eff34d06282fa8f90bf3b786a4',
    stepSha: '76c34aa4905777c0a8abe4718019904a3a9f8343cab7cc056f4516b7ef5165fc', mount: 'bench' },
  sot223R3: { asset: 'Package_TO_SOT_SMD/SOT-223-3_TabPin2',
    footprintSha: 'b6babdabd232a3e3170a86a17e8ed042377c2bb1854965c489d82c0e98179444',
    stepSha: '77ad6dbacc493cb619c728f26d2ddcf461eb0feb6b977b47d01d51e67016f654', mount: 'bench', stepFile: 'SOT-223.step' },
  powerPad8R3: { asset: 'Package_SO/TI_SO-PowerPAD-8',
    footprintSha: '9c8aa32351f3e80287fd4fcb02bc559cc23d3ab18494248a11da0d7ff8cc08a3',
    stepSha: '53b055ee4d166c0b9de551669cc1294f95b96baacbfe26d9316b576c1ce29fbf', mount: 'bench' },
  wson8R3: { asset: 'Package_SON/Texas_DSG0008A_WSON-8-1EP_2x2mm_P0.5mm_EP0.9x1.6mm',
    footprintSha: 'fa30bcd3829c456865f0f79f87e2ae74d7b92912ab9e6a3d4026eec63f8a895a',
    stepSha: '7672cac8d88d8679800ef3bf90954e7996ea74e8ddb1f157f2d82bca6b2015e4', mount: 'bench', stepFile: 'WSON-8-1EP_2x2mm_P0.5mm_EP0.9x1.6mm.step' },
  qfn16R3: { asset: 'Package_DFN_QFN/WQFN-16-1EP_3x3mm_P0.5mm_EP1.68x1.68mm',
    footprintSha: '407c05feda04356243424834ae0bf8c97b4b702a6fb261102d8874ad8fb72afd',
    stepSha: '5cf5334cfc656bd6d862f8585cd09e4e5df8cf505cfd6ebb00ce69e35a707340', mount: 'bench' },
  soic8R3: { asset: 'Package_SO/SOIC-8_3.9x4.9mm_P1.27mm',
    footprintSha: '3c9b63198dd4dbf5e6c28c84702c29fad46a35103b821a19306c4ac888ad8e76',
    stepSha: '07f46cff378d30e6c27dfd5a03092c795323f86d91c71fc7e743f4f418dc553a', mount: 'bench' },
  sot23R3: { asset: 'Package_TO_SOT_SMD/SOT-23',
    footprintSha: '7fb2859c6463f3a37966a1a20c31d8bfe7d4e8459d00bb165d5a7488270816c5',
    stepSha: 'dd5d1711204e1d8d26cd11490923bd84340820baa69538c385a4300ec2539bc0', mount: 'bench' },
  do41R3: { asset: 'Diode_THT/D_DO-41_SOD81_P10.16mm_Horizontal',
    footprintSha: 'fdb8a0fafb90ba28fa9108225076263ede43610f2de398aeb6d4947e3eac85d8',
    stepSha: 'c3e23d4b276811b74eecb329bd4480209ad3dbc8cf6e6e3f2a5b542c5ca343c1', mount: 'breadboard' },
} as const

const roles: Record<string, ElectricalType> = {
  i: 'input', o: 'output', b: 'bidirectional', v: 'power', g: 'ground', p: 'passive',
}

function define<Id extends string>(catalogId: Id, mpn: string, manufacturer: string,
  packageName: string, packageKey: keyof typeof r3Packages, datasheet: string, source: string,
  pinoutPage: number, scope: string, pads: string, labels: Record<string, string> = {}) {
  return {
    id: `${catalogId}-r3` as const, catalogId, mpn, manufacturer, packageName, packageKey,
    datasheet, source, pinoutPage, scope, revision: 'R3' as const, simulation: 'analog' as const,
    pins: pads.split(' ').map((entry, index): ComponentPin & { pad: number } => {
      const [id, role = 'p'] = entry.split(':')
      return { id, label: labels[id] ?? id.toUpperCase(), electricalType: roles[role], pad: index + 1 }
    }),
  }
}

export const catalogR3Parts = [
  define('lm7805', 'L7805CV', 'STMicroelectronics', 'TO220-3', 'to220R3',
    "L78", "https://www.st.com/resource/en/datasheet/l78.pdf", 3,
    "Ổn áp tuyến tính 5 V. Bài thử so sánh điện áp danh định và mất ổn áp.", 'vin:v gnd:g vout:o', {"vin":"IN","vout":"OUT","gnd":"GND · tab"}),
  define('lm317', 'LM317T/NOPB', 'Texas Instruments', 'TO220-3 · NDE', 'to220R3',
    "LM317-N Rev Q", "https://www.ti.com/lit/ds/symlink/lm317-n.pdf", 5,
    "Ổn áp điều chỉnh. Tỉ lệ chia áp và dòng ADJ quyết định điện áp ra.", 'adj:i vout:o vin:v', {"vout":"OUT · tab","vin":"IN"}),
  define('tl431', 'TL431AILP', 'Texas Instruments', 'TO92 · LP', 'to92R3',
    "TL431 Rev S", "https://www.ti.com/lit/ds/symlink/tl431.pdf", 4,
    "Tham chiếu shunt điều chỉnh, cần dòng phân cực qua cathode.", 'ref:i a:g k:b'),
  define('lm2596', 'LM2596T-5.0/NOPB', 'Texas Instruments', 'TO220-5 · NDH', 'to220StaggeredR3',
    "LM2596 Rev G", "https://www.ti.com/lit/ds/symlink/lm2596.pdf", 3,
    "Buck 5 V cố định. ON/OFF mức thấp bật. Mô hình trung bình DC.", 'vin:v sw:o gnd:g fb:i onoff:i', {"gnd":"GND · tab","onoff":"ON/OFF"}),
  define('lm2577', 'LM2577T-ADJ/LF03', 'Texas Instruments', 'TO220-5 · NDH', 'to220StaggeredR3',
    "LM2577 Rev D", "https://www.ti.com/lit/ds/symlink/lm2577.pdf", 3,
    "Boost điều chỉnh 5 V lên khoảng 12 V ở mức tải thử. Mô hình trung bình DC.", 'comp:i fb:i gnd:g vin:v sw:o', {"gnd":"GND · tab"}),
  define('tps61023', 'TPS61023DRLR', 'Texas Instruments', 'SOT563 · DRL', 'sot563R3',
    "TPS61023 Rev B", "https://www.ti.com/lit/ds/symlink/tps61023.pdf", 3,
    "Boost đồng bộ. Ca thử gồm ngắt đầu ra qua EN. Mô hình trung bình DC.", 'fb:i en:i vin:v gnd:g sw:b vout:o'),
  define('lm1117', 'LM1117MPX-3.3/NOPB', 'Texas Instruments', 'SOT223 · DCY', 'sot223R3',
    "LM1117", "https://www.ti.com/lit/ds/symlink/lm1117.pdf", 3,
    "Ổn áp tuyến tính 3,3 V. Kiểm đầu ra khi đủ điện áp vào và khi thiếu dự trữ.", 'gnd:g vout:o vin:v', {"vout":"VOUT · tab"}),
  define('tps5430', 'TPS5430DDAR', 'Texas Instruments', 'SOIC8-EP · DDA', 'powerPad8R3',
    "TPS5430 Rev L", "https://www.ti.com/lit/ds/symlink/tps5430.pdf", 3,
    "Buck điều chỉnh. BOOT nối tụ về PH, pad tản nhiệt về GND. Mô hình trung bình DC.", 'boot:b nc2 nc3 fb:i en:i gnd:g vin:v sw:o ep:g', {"fb":"VSENSE","en":"ENA","sw":"PH","ep":"EP → GND"}),
  define('tps62160', 'TPS62160DSGR', 'Texas Instruments', 'WSON8 · DSG', 'wson8R3',
    "TPS62160 Rev E", "https://www.ti.com/lit/ds/symlink/tps62160.pdf", 4,
    "Buck đồng bộ điều chỉnh, PG open-drain. Mô hình trung bình DC.", 'pgnd:g vin:v en:i agnd:g fb:i vos:i sw:o pg:o ep:g', {"ep":"EP → AGND"}),
  define('bq24074', 'BQ24074RGTR', 'Texas Instruments', 'QFN16 · RGT0016B', 'qfn16R3',
    "BQ24074 Rev N", "https://www.ti.com/lit/ds/symlink/bq24074.pdf", 7,
    "Sạc DC với pin ảo và giới hạn dòng vào USB500. Không mô phỏng hóa học hay chu kỳ sạc.", 'ts:i bat2:b bat3:b ce:i en2:i en1:i pgood:o vss:g chg:o out10:o out11:o ilim:i vin:v tmr:i iterm:i iset:i ep:g', {"bat2":"BAT","bat3":"BAT","out10":"OUT","out11":"OUT","ce":"/CE","vin":"IN","chg":"/CHG","pgood":"/PGOOD","ep":"EP → VSS"}),
  define('ref5025', 'REF5025IDR', 'Texas Instruments', 'SOIC8 · D', 'soic8R3',
    "REF50 Rev O", "https://www.ti.com/lit/ds/symlink/ref50.pdf", 4,
    "Nguồn tham chiếu 2,5 V trong miền tải thử. TEMP và TRIM/NR để hở.", 'dnc1 vin:v temp:o gnd:g trim:i vout:o nc7 dnc8', {"dnc1":"DNC","dnc8":"DNC","nc7":"NC","trim":"TRIM/NR"}),
  define('lm4040', 'LM4040A25IDBZR', 'Texas Instruments', 'SOT23 · DBZ', 'sot23R3',
    "LM4040 Rev Q", "https://www.ti.com/lit/ds/symlink/lm4040.pdf", 4,
    "Tham chiếu shunt 2,5 V với điện trở phân cực. Chân 3 để hở.", 'k:b a:g nc3', {"nc3":"* · để hở"}),
  define('1n4007', '1N4007-E3/54', 'Vishay', 'DO41', 'do41R3',
    "1N4001–1N4007", "https://www.vishay.com/docs/88503/1n4001.pdf", 1,
    "Diode silicon theo hướng A → K. Phép đo thuận và rò ngược ở 25 °C.", 'k a'),
  define('1n5819', '1N5819-E3/54', 'Vishay', 'DO41', 'do41R3',
    "1N5817–1N5819", "https://www.vishay.com/docs/88525/1n5817.pdf", 1,
    "Diode Schottky. Đối chiếu sụt áp với diode silicon ở cùng dòng.", 'k a'),
  define('1n4733a', '1N4733A-TAP', 'Vishay', 'DO41', 'do41R3',
    "1N4728A–1N4761A Rev 2.7", "https://www.vishay.com/docs/85816/1n4728a.pdf", 1,
    "Diode Zener 5,1 V. Đo trong cả miền thuận và phân cực ngược.", 'k a'),
  define('2n3906', '2N3906G', 'onsemi', 'TO92 · Case 29 Style 1', 'to92R3',
    "2N3906", "https://www.onsemi.com/download/data-sheet/pdf/2n3906-d.pdf", 1,
    "BJT PNP. Đo sụt E–C khi cấp dòng base, rồi thử ngắt.", 'e b:i c'),
  define('tip120', 'TIP120G', 'onsemi', 'TO220-3 · TO-220AB', 'to220R3',
    "TIP120", "https://www.onsemi.com/pdf/datasheet/tip120-d.pdf", 1,
    "Cặp Darlington NPN. Đo điện áp collector khi bật và ngắt.", 'b:i c e', {"c":"C · tab"}),
  define('irlz44n', 'IRLZ44NPBF', 'Infineon', 'TO220-3 · TO-220AB', 'to220R3',
    "IRLZ44N Rev 1.1", "https://www.infineon.com/dgdl/Infineon-IRLZ44N-DataSheet-v01_01-EN.pdf?fileId=5546d462533600a40153567217c32725", 1,
    "MOSFET kênh N. Kiểm ở VGS 0 V và 5 V, có diode thân.", 'g:i d s', {"d":"D · tab"}),
  define('2n7000', '2N7000-G', 'Microchip', 'TO92 · TO-92 thẳng', 'to92R3',
    "DS20005695A", "https://ww1.microchip.com/downloads/en/DeviceDoc/2N7000-N-Channel-Enhancement-Mode-Vertical-DMOS-FET-Data-Sheet-20005695A.pdf", 3,
    "MOSFET kênh N tín hiệu nhỏ. Kiểm tải khoảng 20 mA và chiều diode thân.", 's g:i d'),
] as const

export type R3Part = typeof catalogR3Parts[number]
export type R3Model = R3Part['catalogId']

const byType = new Map<string, R3Part>(catalogR3Parts.map(part => [part.id, part]))
export const getR3PartByType = (type: string) => byType.get(type)
