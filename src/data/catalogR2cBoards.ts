import type { BreadboardGrid } from './componentModels'

export const R2C_SHA256 = '51E32E94A43CD50F39C3E7FEE339E54DFCEC42D26D51422E4598A55701F2D6DA'

export const LEGACY_BREADBOARD = '400-30'
export type R2cBreadboardSpec = 'adafruit-239-r2c-1' | 'adafruit-65-r2c-1'
export type BreadboardSpec = typeof LEGACY_BREADBOARD | R2cBreadboardSpec
export type BreadboardConfig = { id: 'bb1'; spec: BreadboardSpec; railSplit: boolean }

const pitch = 2.54
const rows = [13.97, 11.43, 8.89, 6.35, 3.81, -3.81, -6.35, -8.89, -11.43, -13.97]

function profile(pid: '239' | '65', columns: number, length: number, width: number,
  rails: number[], drawing: string, drawingSha256: string, photoSha256: string) {
  const spec: R2cBreadboardSpec = pid === '239' ? 'adafruit-239-r2c-1' : 'adafruit-65-r2c-1'
  const catalogId = 'breadboard-adafruit-' + pid
  const sizeMm = [length, 8, width] as const
  const railHoles = rails.length ? 50 : 0
  const grid: BreadboardGrid = { spec, pitch, columns, topY: sizeMm[1], firstColumnX: -(columns - 1) * pitch / 2, rows, rails }
  return {
    spec, catalogId, pid, sizeMm, grid, railHoles, pointCount: columns * rows.length + rails.length * railHoles,
    openingMm: 1, vendor: 'https://www.adafruit.com/product/' + pid,
    drawing, drawingSha256, photoSha256,
    sourceFile: pid === '239' ? 'adafruit-239-c49.pdf' : 'adafruit-65-c212.pdf',
    photoFile: 'adafruit-' + pid + '-top.jpg',
    footprintFile: 'Adafruit_' + pid + '_R2C.kicad_mod',
  }
}

export const r2cBreadboards = [
  profile('239', 63, 165.2, 54.6, [-21, -23.5, 23.5, 21],
    'https://cdn-shop.adafruit.com/product-files/239/C49+++++++datasheet.pdf',
    '77BD40293E7B0555B4612FC38FC4C34D94D914022BF978770C671B7BC2770E10',
    'E9ACD0D80E35CAA8BFBB7BA9D1D9ABA23ADED461B3559180FB95A447D0496FE0'),
  profile('65', 17, 45.5, 34.5, [],
    'https://cdn-shop.adafruit.com/product-files/65/C212+datasheet.pdf',
    'E188DEBBB081A5296600A078087A1D34CF4C87A63949C3AD7A60B9F495CF0BB6',
    'F4F3CBDBBA1AABE5A050AE644DEDE9898D6E638B250510D7DFCD7875DBAC5B9B'),
]

export type R2cBreadboard = typeof r2cBreadboards[number]

export function getR2cBreadboard(id: unknown) {
  return r2cBreadboards.find(profile => profile.spec === id || profile.catalogId === id)
}

export function isBreadboardSpec(value: unknown): value is BreadboardSpec {
  return value === LEGACY_BREADBOARD || r2cBreadboards.some(board => board.spec === value)
}
