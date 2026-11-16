import type { KeyboardEvent } from 'react'
import { currentSeriesName, formatEngineering, probeValue, voltageSeriesName, type SpiceSeriesLike, type SpiceTopology } from '../../simulation/spiceProbes'
import './SpiceProbeMap.css'

type Props = {
  topology: SpiceTopology
  series: readonly SpiceSeriesLike[]
  index: number
  /** AC trả độ lớn: không có chiều dòng. */
  magnitudeOnly: boolean
  selectedProbe: string
  onSelectProbe: (seriesName: string) => void
}

const RAIL_Y = 92
const GROUND_Y = 236
const PAD_X = 70

function activate(event: KeyboardEvent<SVGGElement>, select: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  select()
}

/**
 * Sơ đồ nút–nhánh lấy từ netlist: mỗi nút là điểm đo áp, mỗi phần tử hai cực là một nhánh
 * với dòng do ngspice giải. Bố cục tự động (minh họa), không thay schematic gốc.
 */
export function SpiceProbeMap({ topology, series, index, magnitudeOnly, selectedProbe, onSelectProbe }: Props) {
  const nodes = topology.nodes.filter(node => node !== '0')
  const WIDTH = Math.min(720, Math.max(400, 140 + nodes.length * 150))
  const span = nodes.length > 1 ? (WIDTH - PAD_X * 2) / (nodes.length - 1) : 0
  const xOf = (node: string) => nodes.length === 1 ? WIDTH / 2 : PAD_X + nodes.indexOf(node) * span
  const twoTerminal = topology.elements.filter(element => element.nodes.length === 2 && element.nodes.some(node => node !== '0'))
  const skipped = topology.elements.filter(element => element.nodes.length !== 2)
  const currents = twoTerminal.map(element => probeValue(series, currentSeriesName(element.name), index))
  const maxCurrent = Math.max(1e-15, ...currents.map(value => Math.abs(value ?? 0)))
  const groundCount = new Map<string, number>()
  const arcCount = new Map<string, number>()

  const branches = twoTerminal.map((element, elementIndex) => {
    const current = currents[elementIndex]
    const [first, second] = element.nodes
    const toGround = first === '0' || second === '0'
    let d: string
    let labelX: number
    let labelY: number
    if (toGround) {
      const node = first === '0' ? second : first
      const slot = groundCount.get(node) ?? 0
      groundCount.set(node, slot + 1)
      const x = xOf(node) + (slot % 2 ? 1 : -1) * Math.ceil(slot / 2) * 22
      // Path đi theo thứ tự nút trong netlist để dấu dòng (nút 1 -> nút 2) khớp chiều vẽ.
      d = first === '0' ? `M${x} ${GROUND_Y} L${x} ${RAIL_Y + 12}` : `M${x} ${RAIL_Y + 12} L${x} ${GROUND_Y}`
      labelX = x > WIDTH * 0.6 ? x - 8 : x + 8
      labelY = (RAIL_Y + GROUND_Y) / 2 + 20 + slot * 14
    } else {
      const key = [first, second].sort().join('|')
      const slot = arcCount.get(key) ?? 0
      arcCount.set(key, slot + 1)
      const x1 = xOf(first)
      const x2 = xOf(second)
      const lift = 26 + slot * 20
      d = `M${x1} ${RAIL_Y} Q${(x1 + x2) / 2} ${RAIL_Y - lift * 2} ${x2} ${RAIL_Y}`
      labelX = (x1 + x2) / 2
      labelY = RAIL_Y - lift - 6
    }
    const magnitude = current === undefined ? undefined : Math.abs(current)
    const ratio = magnitude === undefined ? 0 : magnitude / maxCurrent
    const flowing = !magnitudeOnly && magnitude !== undefined && magnitude > 1e-12
    const reverse = current !== undefined && current < 0
    const probe = currentSeriesName(element.name)
    const [from, to] = reverse ? [second, first] : [first, second]
    const arrow = !flowing ? '' : toGround ? (to === '0' ? '↓ ' : '↑ ') : (xOf(to) > xOf(from) ? '→ ' : '← ')
    return { element, current, magnitude, d, labelX, labelY, ratio, flowing, reverse, probe, toGround, arrow, lineX: toGround ? Number(/^M(-?[\d.]+)/.exec(d)?.[1] ?? 0) : 0 }
  })

  const xOfBranch = (branch: { lineX: number }) => branch.lineX
  return <figure className="spice-probe-map">
    <figcaption>
      <strong>Sơ đồ đo · nút và nhánh</strong>
      <span>Bấm một nút để xem điện áp, bấm một nhánh để xem dòng trên đồ thị. {magnitudeOnly ? 'Phân tích AC chỉ có độ lớn, không có chiều dòng.' : 'Mũi tên và vạch chạy theo chiều dòng; độ dày theo độ lớn so với nhánh lớn nhất.'}</span>
    </figcaption>
    <svg viewBox={`0 0 ${WIDTH} ${GROUND_Y + 30}`} role="group" aria-label="Sơ đồ nút và nhánh của netlist với giá trị do ngspice giải">
      <defs>
        <marker id="spice-probe-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" /></marker>
      </defs>
      <line className="spice-probe-ground" x1={PAD_X - 40} x2={WIDTH - PAD_X + 40} y1={GROUND_Y} y2={GROUND_Y} />
      <text className="spice-probe-ground-label" x={WIDTH - PAD_X + 40} y={GROUND_Y + 20} textAnchor="end">0 · GND = 0 V</text>
      {branches.map(branch => {
        const valueText = branch.magnitude === undefined ? (branch.element.kind === 'I' ? 'nguồn dòng' : '—') : `${magnitudeOnly ? '|I| ' : ''}${formatEngineering(branch.magnitude, 'A')}`
        return <g key={branch.element.name} className={`spice-probe-branch kind-${branch.element.kind.toLowerCase()} ${branch.flowing ? 'is-flowing' : ''} ${branch.reverse ? 'is-reverse' : ''} ${selectedProbe === branch.probe ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-pressed={selectedProbe === branch.probe} aria-label={`${branch.element.name.toUpperCase()} giữa nút ${branch.element.nodes[0]} và ${branch.element.nodes[1]}: ${valueText}${branch.flowing ? `, chiều từ ${branch.reverse ? branch.element.nodes[1] : branch.element.nodes[0]} sang ${branch.reverse ? branch.element.nodes[0] : branch.element.nodes[1]}` : ''}`} onClick={() => onSelectProbe(branch.probe)} onKeyDown={event => activate(event, () => onSelectProbe(branch.probe))} style={{ ['--flow-ratio' as string]: branch.ratio.toFixed(3) }}>
          <path className="spice-probe-hit" d={branch.d} />
          <path className="spice-probe-wire" d={branch.d} style={{ strokeWidth: 2 + branch.ratio * 6 }} markerEnd={branch.flowing && !branch.reverse ? 'url(#spice-probe-arrow)' : undefined} markerStart={branch.flowing && branch.reverse ? 'url(#spice-probe-arrow)' : undefined} />
          {branch.flowing && <path className="spice-probe-flow" d={branch.d} aria-hidden="true" />}
          <text className="spice-probe-branch-label" x={branch.labelX} y={branch.labelY} textAnchor={branch.toGround ? (branch.labelX < xOfBranch(branch) ? 'end' : 'start') : 'middle'}>{branch.arrow}{branch.element.name.toUpperCase()} · {valueText}</text>
        </g>
      })}
      {nodes.map(node => {
        const probe = voltageSeriesName(node)
        const voltage = probeValue(series, probe, index)
        return <g key={node} className={`spice-probe-node ${selectedProbe === probe ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-pressed={selectedProbe === probe} aria-label={`Nút ${node}: ${formatEngineering(voltage, 'V')}`} onClick={() => onSelectProbe(probe)} onKeyDown={event => activate(event, () => onSelectProbe(probe))} transform={`translate(${xOf(node)} ${RAIL_Y})`}>
          <circle r="9" />
          <text className="spice-probe-node-name" y="-16" textAnchor="middle">{node}</text>
          <text className="spice-probe-node-value" x="14" y="26">{formatEngineering(voltage, 'V')}</text>
        </g>
      })}
    </svg>
    {skipped.length > 0 && <p className="spice-probe-note">{skipped.map(element => element.name.toUpperCase()).join(', ')}: linh kiện nhiều chân chưa vẽ trên sơ đồ đo; xem số trong bảng.</p>}
  </figure>
}
