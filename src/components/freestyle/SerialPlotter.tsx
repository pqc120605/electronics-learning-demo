import { useId } from 'react'
import { MAX_SERIAL_SAMPLES, MAX_SERIAL_SERIES, serialPlotCsv, type SerialPlotState } from '../../lib/freestyle/serialPlot'
import './SerialPlotter.css'

const colors = ['#007a78', '#a54800', '#6747b5', '#b02d62']
const format = (value: number) => Number(value.toPrecision(4)).toString()
const reading = (values: Record<string, number>, label: string): number | undefined => Object.hasOwn(values, label) ? values[label] : undefined

export function SerialPlotter({ state, source, expanded, onToggle }: {
  state: SerialPlotState
  source: string
  expanded: boolean
  onToggle?: () => void
}) {
  const id = useId()
  const values = state.samples.flatMap(sample => Object.values(sample.values))
  // Normalize first so subtraction of two finite extreme readings cannot overflow.
  const scale = Math.max(...values.map(Math.abs), 1)
  const min = values.length ? Math.min(...values.map(value => value / scale)) : 0
  const max = values.length ? Math.max(...values.map(value => value / scale)) : 1
  const first = state.samples[0]?.ordinal ?? 1
  const last = state.samples.at(-1)?.ordinal ?? first
  const x = (ordinal: number) => 58 + (ordinal - first) / Math.max(1, last - first) * 392
  const y = (value: number) => max === min ? 100 : 168 - (value / scale - min) / (max - min) * 140
  function download() {
    const url = URL.createObjectURL(new Blob(['\ufeff', serialPlotCsv(state)], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'mach-mo-serial.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="serial-plotter" aria-label="Serial Plotter">
    <button type="button" className="freestyle-button" aria-expanded={expanded} aria-controls={id} onClick={onToggle}>{expanded ? 'Ẩn đồ thị Serial' : 'Mở đồ thị Serial'}</button>
    <div id={id} hidden={!expanded}>
      <h3>Serial Plotter</h3>
      <p className="serial-plotter-note">Nguồn: {source}. Thứ tự mẫu, không phải thời gian hay phép đo mạch thật.</p>
      <p className="serial-plotter-note">Tối đa {MAX_SERIAL_SAMPLES} mẫu, {MAX_SERIAL_SERIES} chuỗi đầu tiên mỗi lượt chạy. Nhận số hoặc nhãn:giá_trị trên dòng hoàn chỉnh; bỏ dòng lỗi. Dừng giữ dữ liệu; chạy lại xóa đồ thị. Dữ liệu chỉ ở phiên này.</p>
      {state.samples.length === 0 ? <p className="serial-plotter-empty">Chưa có mẫu số. Thử Serial.println(123) hoặc Serial.println("sensor:123").</p> : <>
        <svg viewBox="0 0 470 210" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
          <title id={`${id}-title`}>Đồ thị Serial theo thứ tự mẫu</title>
          <desc id={`${id}-desc`}>{state.samples.length} mẫu từ {first} đến {last}. Các chuỗi: {state.series.join(', ')}. Giá trị chi tiết nằm trong bảng bên dưới; không suy ra đơn vị.</desc>
          <path d="M58 24V168H450" className="serial-plotter-axis" />
          <text x="52" y="32" textAnchor="end">{format(max * scale)}</text>
          <text x="52" y="172" textAnchor="end">{format(min * scale)}</text>
          <text x="58" y="187">{first}</text>
          <text x="450" y="187" textAnchor="end">{last}</text>
          <text x="254" y="204" textAnchor="middle">Thứ tự mẫu</text>
          {state.series.map((label, index) => {
            let connected = false
            const path = state.samples.map(sample => {
              const value = reading(sample.values, label)
              if (value === undefined) { connected = false; return '' }
              const command = connected ? 'L' : 'M'
              connected = true
              return `${command}${x(sample.ordinal)},${y(value)}`
            }).join(' ')
            return <g key={label} stroke={colors[index]} fill={colors[index]}>
              <path d={path} fill="none" strokeWidth="2" />
              {state.samples.filter(sample => reading(sample.values, label) !== undefined).map(sample => <circle key={sample.ordinal} cx={x(sample.ordinal)} cy={y(reading(sample.values, label)!)} r="2.5" />)}
            </g>
          })}
        </svg>
        <ul className="serial-plotter-legend" aria-label="Chuỗi dữ liệu">{state.series.map((label, index) => <li key={label}><span style={{ background: colors[index] }} aria-hidden="true" />{label}</li>)}</ul>
        <details className="serial-plotter-values"><summary>Xem bảng giá trị ({state.samples.length} mẫu)</summary><div className="serial-plotter-table" tabIndex={0} role="region" aria-label="Bảng mẫu Serial"><table><caption>Giá trị theo thứ tự mẫu; dấu — là không có dữ liệu.</caption><thead><tr><th scope="col">Mẫu</th>{state.series.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{state.samples.map(sample => <tr key={sample.ordinal}><th scope="row">{sample.ordinal}</th>{state.series.map(label => <td key={label}>{reading(sample.values, label) ?? '—'}</td>)}</tr>)}</tbody></table></div></details>
      </>}
      <button type="button" className="freestyle-button" disabled={!state.samples.length} onClick={download}>Tải CSV Serial</button>
    </div>
  </section>
}
