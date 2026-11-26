import type { ComponentPin, ElectricalType } from './componentRegistry'
import { r1Packages } from './catalogR1Parts.ts'

export const catalogR2aApproval = 'd049bcb6254dea581eeec7cb480bf68f05083f0a9765e22939c5547dc8fb8713'

export const r2aPackages = {
  dip14: r1Packages.dip14,
  dip16: r1Packages.dip16,
  dip20: {
    asset: 'Package_DIP/DIP-20_W7.62mm',
    footprintSha: 'cad70146d4309f902333a00f6a27a700edf6e27f0225fc25a716c05e3ba0a3f5',
    stepSha: 'ca359c9b9e0ce94efcb6c96866513f659eef6517d629ace3c4a0a779f6fd57bb',
    mount: 'breadboard',
  },
} as const

export type R2aModel = '02' | '04' | '32' | '86' | '125' | '126' | '138' | '139' | '151' | '153' | '157' | '164' | '165' | '245'
export type CatalogR2aPart = {
  id: string
  catalogId: string
  mpn: string
  manufacturer: 'Texas Instruments'
  packageName: string
  packageKey: keyof typeof r2aPackages
  source: string
  datasheet: string
  pinoutPage: number
  scope: string
  simulation: 'digital'
  model: R2aModel
  revision: 'R2A'
  pins: (ComponentPin & { pad: number })[]
}

type Pin = readonly [id: string, electricalType: ElectricalType, label: string]
const input = (id: string, label = id): Pin => [id.toLowerCase(), 'input', label]
const output = (id: string, label = id): Pin => [id.toLowerCase(), 'output', label]
const bus = (id: string): Pin => [id.toLowerCase(), 'bidirectional', id]
const gnd: Pin = ['gnd', 'ground', 'GND']
const vcc: Pin = ['vcc', 'power', 'VCC']

function define(model: R2aModel, padCount: 14 | 16 | 20, datasheet: string, scope: string,
  pins: readonly Pin[], pinoutPage = 3): CatalogR2aPart {
  const catalogId = 'sn74hc' + model
  return {
    id: catalogId + '-r2a', catalogId, mpn: catalogId.toUpperCase() + 'N', manufacturer: 'Texas Instruments',
    packageName: 'PDIP-' + padCount + ' (N)', packageKey: padCount === 14 ? 'dip14' : padCount === 16 ? 'dip16' : 'dip20',
    source: 'https://www.ti.com/lit/ds/symlink/' + catalogId + '.pdf', datasheet, pinoutPage,
    simulation: 'digital', revision: 'R2A', model, scope,
    pins: pins.map(([id, electricalType, label], index) => ({ id, electricalType, label, pad: index + 1 })),
  }
}

const quadGates = [
  input('1A'), input('1B'), output('1Y'), input('2A'), input('2B'), output('2Y'), gnd,
  output('3Y'), input('3A'), input('3B'), output('4Y'), input('4A'), input('4B'), vcc,
]
function buffers(activeLow: boolean) {
  const oe = (channel: number) => input(channel + 'OE', channel + (activeLow ? '/OE' : 'OE'))
  return [
    oe(1), input('1A'), output('1Y'), oe(2), input('2A'), output('2Y'), gnd,
    output('3Y'), input('3A'), oe(3), output('4Y'), input('4A'), oe(4), vcc,
  ]
}

export const catalogR2aParts = [
  define('02', 14, 'SCLS076G', 'Bốn cổng NOR. Y lên 1 khi cả hai đầu vào ở 0.', [
    output('1Y'), input('1A'), input('1B'), output('2Y'), input('2A'), input('2B'), gnd,
    input('3A'), input('3B'), output('3Y'), input('4A'), input('4B'), output('4Y'), vcc,
  ]),
  define('04', 14, 'SCLS078H', 'Sáu cổng đảo. Mỗi Y là mức đối nghịch với A của cổng tương ứng.', [
    input('1A'), output('1Y'), input('2A'), output('2Y'), input('3A'), output('3Y'), gnd,
    output('4Y'), input('4A'), output('5Y'), input('5A'), output('6Y'), input('6A'), vcc,
  ]),
  define('32', 14, 'SCLS200F', 'Bốn cổng OR. Chỉ tổ hợp 00 cho Y bằng 0.', quadGates),
  define('86', 14, 'SCLS100F', 'Bốn cổng XOR. Hai đầu vào khác nhau cho Y bằng 1.', quadGates),
  define('125', 14, 'SCLS104F', 'Bốn bộ đệm. /OE ở 0 cho Y theo A, /OE ở 1 nhả Y về Z.', buffers(true)),
  define('126', 14, 'SCLS103F', 'Bốn bộ đệm. OE ở 1 cho Y theo A, OE ở 0 nhả Y về Z.', buffers(false)),
  define('138', 16, 'SCLS107G', 'Giải mã 3 sang 8. Khi G1 = 1 và /G2A = /G2B = 0, ngõ được chọn xuống 0.', [
    input('A'), input('B'), input('C'), input('G2A','/G2A'), input('G2B','/G2B'), input('G1'), output('Y7','/Y7'), gnd,
    output('Y6','/Y6'), output('Y5','/Y5'), output('Y4','/Y4'), output('Y3','/Y3'), output('Y2','/Y2'), output('Y1','/Y1'), output('Y0','/Y0'), vcc,
  ]),
  define('139', 16, 'SCLS108E', 'Hai bộ giải mã 2 sang 4. Mỗi nửa có /G riêng và kéo ngõ được chọn xuống 0.', [
    input('1G','1/G'), input('1A'), input('1B'), output('1Y0','1/Y0'), output('1Y1','1/Y1'), output('1Y2','1/Y2'), output('1Y3','1/Y3'), gnd,
    output('2Y3','2/Y3'), output('2Y2','2/Y2'), output('2Y1','2/Y1'), output('2Y0','2/Y0'), input('2B'), input('2A'), input('2G','2/G'), vcc,
  ]),
  define('151', 16, 'SCLS110F', 'Chọn D0–D7 bằng CBA. /G = 0 cho Y theo dữ liệu và W đảo. /G = 1 đặt Y = 0, W = 1.', [
    input('D3'), input('D2'), input('D1'), input('D0'), output('Y'), output('W'), input('G','/G'), gnd,
    input('C'), input('B'), input('A'), input('D7'), input('D6'), input('D5'), input('D4'), vcc,
  ]),
  define('153', 16, 'SCLS112E', 'Hai bộ chọn 4 sang 1 dùng chung BA. /G riêng ở 1 buộc Y tương ứng về 0.', [
    input('1G','1/G'), input('B'), input('1C3'), input('1C2'), input('1C1'), input('1C0'), output('1Y'), gnd,
    output('2Y'), input('2C0'), input('2C1'), input('2C2'), input('2C3'), input('A'), input('2G','2/G'), vcc,
  ]),
  define('157', 16, 'SCLS113F', 'Chọn bốn bit A hoặc B. /G ở 1 buộc cả bốn Y về 0.', [
    input('SEL','A/B'), input('1A'), input('1B'), output('1Y'), input('2A'), input('2B'), output('2Y'), gnd,
    output('3Y'), input('3B'), input('3A'), output('4Y'), input('4B'), input('4A'), input('G','/G'), vcc,
  ]),
  define('165', 16, 'SCLS116H', 'Nạp song song khi SH/LD ở 0. Đọc H trước, rồi dịch G đến A khi cổng clock tạo cạnh lên.', [
    input('SHLD','SH/LD'), input('CLK'), input('E'), input('F'), input('G'), input('H'), output('QHN','/QH'), gnd,
    output('QH'), input('SER'), input('A'), input('B'), input('C'), input('D'), input('CLKINH','CLK INH'), vcc,
  ]),
  define('164', 14, 'SCLS115G', 'Dịch A AND B vào QA ở cạnh lên. /CLR ở 0 xóa cả tám ngõ ngay cả khi chưa có xung.', [
    input('A'), input('B'), output('QA'), output('QB'), output('QC'), output('QD'), gnd,
    input('CLK'), input('CLR','/CLR'), output('QE'), output('QF'), output('QG'), output('QH'), vcc,
  ], 4),
  define('245', 20, 'SCLS131F', 'Bus 8 bit. DIR ở 1 truyền từ A sang B. DIR ở 0 truyền từ B sang A. /OE ở 1 nhả cả hai phía.', [
    input('DIR'), bus('A1'), bus('A2'), bus('A3'), bus('A4'), bus('A5'), bus('A6'), bus('A7'), bus('A8'), gnd,
    bus('B8'), bus('B7'), bus('B6'), bus('B5'), bus('B4'), bus('B3'), bus('B2'), bus('B1'), input('OE','/OE'), vcc,
  ]),
]
