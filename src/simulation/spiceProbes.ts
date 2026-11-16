/**
 * Probe dòng/áp cho SPICE workbench (2026-11-14, cải tiến #7).
 *
 * Ngspice chỉ trả dòng nhánh của nguồn áp. Để có dòng qua R/C/L/D mà không đoán số,
 * Mạch Mở chèn một nguồn 0 V nối tiếp mỗi phần tử hai cực (ammeter SPICE chuẩn):
 *   R1 A B 1k  ->  R1 A __mmp_r1 1k  +  VMMP_R1 __mmp_r1 B DC 0
 * Nguồn 0 V không đổi điện áp/dòng của mạch. Dòng i(vmmp_r1) dương nghĩa là dòng
 * chạy qua R1 từ nút thứ nhất (A) sang nút thứ hai (B), theo quy ước nguồn của ngspice.
 * Chỉ chạy sau khi netlist đã qua inspectSpiceNetlist.
 */

export type SpiceElementKind = 'R' | 'C' | 'L' | 'D' | 'V' | 'I' | 'Q' | 'M'

export type SpiceTopologyElement = {
  name: string
  kind: SpiceElementKind
  /** Nút theo thứ tự trong netlist, đã chuẩn hóa chữ thường như ngspice. */
  nodes: string[]
  value?: string
}

export type SpiceTopology = { elements: SpiceTopologyElement[]; nodes: string[] }

export type SpiceSeriesLike = { name: string; type: string; values: number[] }

const PROBE_NODE_PREFIX = '__mmp_'
const PROBE_SOURCE_PREFIX = 'vmmp_'
const TWO_TERMINAL_PROBED = new Set<SpiceElementKind>(['R', 'C', 'L', 'D'])
const TERMINALS: Record<SpiceElementKind, number> = { R: 2, C: 2, L: 2, D: 2, V: 2, I: 2, Q: 3, M: 4 }

function meaningfulLines(netlist: string): string[] {
  return netlist.replace(/\r\n?/g, '\n').split('\n')
}

export function parseSpiceTopology(netlist: string): SpiceTopology {
  const elements: SpiceTopologyElement[] = []
  const lines = meaningfulLines(netlist).map(line => line.trim()).filter(line => line && !line.startsWith('*'))
  for (const line of lines.slice(1)) {
    if (line.startsWith('.')) continue
    const tokens = line.split(/\s+/)
    const kind = tokens[0][0]?.toUpperCase() as SpiceElementKind
    if (!(kind in TERMINALS)) continue
    const count = TERMINALS[kind]
    if (tokens.length < count + 1) continue
    elements.push({ name: tokens[0].toLowerCase(), kind, nodes: tokens.slice(1, count + 1).map(node => node.toLowerCase()), value: tokens.slice(count + 1).join(' ') || undefined })
  }
  const nodes = [...new Set(elements.flatMap(element => element.nodes))].sort((left, right) => left === '0' ? 1 : right === '0' ? -1 : left.localeCompare(right, 'en'))
  return { elements, nodes }
}

/** Thêm ammeter 0 V cho R/C/L/D. Trả netlist mới và tên series dòng theo phần tử. */
export function instrumentSpiceNetlist(netlist: string): { netlist: string; currentSeries: Record<string, string> } {
  const currentSeries: Record<string, string> = {}
  const lines = meaningfulLines(netlist)
  let titleSeen = false
  const out: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!titleSeen) { out.push(raw); if (line) titleSeen = true; continue }
    if (!line || line.startsWith('*') || line.startsWith('.')) { out.push(raw); continue }
    const tokens = line.split(/\s+/)
    const kind = tokens[0][0]?.toUpperCase() as SpiceElementKind
    if (!TWO_TERMINAL_PROBED.has(kind) || tokens.length < 4) { out.push(raw); continue }
    const name = tokens[0].toLowerCase()
    const probeNode = `${PROBE_NODE_PREFIX}${name}`
    const probeSource = `${PROBE_SOURCE_PREFIX}${name}`
    out.push([tokens[0], tokens[1], probeNode, ...tokens.slice(3)].join(' '))
    out.push(`${probeSource} ${probeNode} ${tokens[2]} DC 0`)
    currentSeries[name] = `i(${probeSource})`
  }
  return { netlist: out.join('\n'), currentSeries }
}

/** Đổi i(vmmp_r1) -> i(r1) và bỏ điện áp nút phụ (bằng nút kế bên, không có ý nghĩa với người học). */
export function cleanProbeSeries<T extends SpiceSeriesLike>(series: T[]): T[] {
  return series
    .filter(item => !item.name.toLowerCase().startsWith(`v(${PROBE_NODE_PREFIX}`))
    .map(item => {
      const match = /^i\(vmmp_(.+)\)$/i.exec(item.name)
      return match ? { ...item, name: `i(${match[1].toLowerCase()})`, type: 'current' } : item
    })
}

export function voltageSeriesName(node: string): string { return `v(${node.toLowerCase()})` }
export function currentSeriesName(element: string): string { return `i(${element.toLowerCase()})` }

/** Giá trị tại chỉ số mẫu; nút đất luôn 0 V theo định nghĩa SPICE. */
export function probeValue(series: readonly SpiceSeriesLike[], name: string, index: number): number | undefined {
  if (name === 'v(0)') return 0
  const found = series.find(item => item.name.toLowerCase() === name)
  const value = found?.values[Math.min(index, (found?.values.length ?? 1) - 1)]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function formatEngineering(value: number | undefined, unit: string): string {
  if (value === undefined || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const scales: Array<[number, string]> = [[1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']]
  if (abs === 0) return `0 ${unit}`
  const [scale, prefix] = scales.find(([candidate]) => abs >= candidate) ?? scales[scales.length - 1]
  const scaled = value / scale
  return `${scaled.toLocaleString('vi-VN', { maximumFractionDigits: Math.abs(scaled) >= 100 ? 1 : Math.abs(scaled) >= 10 ? 2 : 3 })} ${prefix}${unit}`
}
