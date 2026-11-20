import { useId, useState } from 'react'
import { pinDisplayName } from '../../lib/freestyle/freestyleCircuit'
import { freestyleTraceCsv, traceChannels, tracePath, type TraceSample } from '../../lib/freestyle/freestyleTrace'
import { isValidSampledTrace, measureSampledCursors, type SampledCursor } from '../../lib/freestyle/freestyleTraceMeasure'
import { signalWindow } from '../../lib/signalWindow'
import { downloadBlob } from '../../lib/communityAttachments'
import './FreestyleWaveform.css'

type Props = { samples: TraceSample[]; boardId: string; source: string; running: boolean; preferredPins?: number[]; captureKey?: string | number }

// Presentation only: timestamp identity, measurements and SVG geometry stay exact.
const displayMs = (value: number) => Number(value.toFixed(3)).toString()

/** New capture/context resets controls synchronously, even if React batches the empty trace. */
export function FreestyleWaveform(props: Props) {
  return <WaveformCapture key={JSON.stringify([props.boardId, props.source, props.captureKey, props.samples.length === 0])} {...props}/>
}

function WaveformCapture({ samples, boardId, source, running, preferredPins = [] }: Props) {
  const controlId = useId()
  const [focusPin, setFocusPin] = useState<number>()
  const [measurementPin, setMeasurementPin] = useState<number>()
  // Undefined follows the window endpoint; explicit timestamps never become indices.
  const [aMs, setAMs] = useState<number>()
  const [bMs, setBMs] = useState<number>()
  const [freeze, setFreeze] = useState<TraceSample[]>()
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState(1)
  const capture = freeze ?? samples
  const valid = isValidSampledTrace(capture)
  const { start: windowStart, end: windowEnd } = signalWindow(capture.length, zoom, position)
  const points = valid ? capture.slice(windowStart, windowEnd) : []
  const observed = [...new Set(points.flatMap(sample => Object.keys(sample.pins).map(Number)))].filter(Number.isFinite).sort((a, b) => a - b)
  const channels = traceChannels(points, preferredPins, focusPin)
  const pin = measurementPin ?? observed[0]
  const start = points[0]?.atMs ?? 0, end = points.at(-1)?.atMs ?? 0
  const aTime = aMs ?? start, bTime = bMs ?? end
  const aIndex = points.findIndex(sample => sample.atMs === aTime), bIndex = points.findIndex(sample => sample.atMs === bTime)
  const result = measureSampledCursors(points, pin ?? -1, aTime, bTime)
  const pinMissing = pin !== undefined && !observed.includes(pin)
  const markerX = (time: number) => (time - start) / Math.max(1, end - start) * 1000
  const formatCursor = (cursor: SampledCursor) => `${displayMs(cursor.atMs)} ms mô phỏng · ${cursor.level}${cursor.pwm === undefined ? '' : ` · PWM metadata runtime: ${Math.round(cursor.pwm * 100)}%`}`

  return <section className="freestyle-waveform" aria-label="Dạng sóng tín hiệu">
    <header><h3>Dạng sóng logic</h3><span>{source} · {freeze ? 'đồ thị đang tạm dừng' : running ? 'đang lấy mẫu' : points.length ? 'đã dừng' : 'chưa chạy'}</span></header>
    <p>Mẫu trạng thái từ runtime, tối đa 512 mẫu gần nhất / 8 kênh vẽ. Xung nhanh có thể bị bỏ lỡ; khoảng trống là chưa có dữ liệu. HIGH/LOW không phải điện áp đo hay kết quả SPICE.</p>
    {!valid ? <p role="status">Timestamp không hợp lệ; chưa thể đo. Chạy lại để thu dữ liệu mới.</p> : !points.length ? <p className="freestyle-empty">Chọn board, viết code và bấm Chạy để thu tín hiệu GPIO.</p> : <>
      <div className="freestyle-wave-tools" role="group" aria-label="Điều khiển đồ thị logic">
        <button type="button" className="freestyle-button" onClick={() => setFreeze(freeze ? undefined : samples)}>{freeze ? 'Tiếp tục đồ thị' : 'Tạm dừng đồ thị'}</button>
        <button type="button" className="freestyle-button" onClick={() => downloadBlob(new Blob([freestyleTraceCsv(capture)], {type:'text/csv;charset=utf-8'}), 'mach-mo-trace-logic.csv')}>Tải trace CSV</button>
        <label>Thu phóng trace<select value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[1,2,4,8].map(value => <option key={value} value={value}>{value}×</option>)}</select></label>
        {zoom > 1 && <label>Vị trí trace<input type="range" min="0" max="1" step="0.01" value={position} onChange={event => setPosition(event.target.valueAsNumber)} /></label>}
      </div>
      <label className="freestyle-channel-picker">Ưu tiên kênh<select value={focusPin ?? ''} onChange={event => setFocusPin(event.target.value === '' ? undefined : Number(event.target.value))}><option value="">Chân đang nối trong mạch</option>{observed.map(value => <option key={value} value={value}>{pinDisplayName(boardId, value)}</option>)}</select><span>Đang vẽ {channels.length}/{observed.length} kênh có dữ liệu</span></label>
      <fieldset className="freestyle-measure">
        <legend>Con trỏ trên mẫu logic</legend>
        <div className="freestyle-measure-toolbar"><div className="freestyle-measure-picker"><label htmlFor={`${controlId}-pin`}>Kênh đo</label><select id={`${controlId}-pin`} value={pin ?? ''} disabled={!observed.length && pin === undefined} onChange={event => setMeasurementPin(Number(event.target.value))}>
          {pin === undefined && <option value="">Chưa có GPIO trong mẫu</option>}
          {pinMissing && <option value={pin}>{pinDisplayName(boardId, pin)} · ngoài cửa sổ</option>}
          {observed.map(value => <option key={value} value={value}>{pinDisplayName(boardId, value)}</option>)}
        </select></div><button type="button" className="freestyle-button" onClick={() => { setAMs(undefined); setBMs(undefined) }}>Đặt lại A/B</button></div>
        <p>Mặc định A/B theo đầu/cuối cửa sổ; di chuyển để giữ timestamp. Đặt lại trả về mặc định. Đổi tab hoặc dock có thể đặt lại con trỏ.</p>
        {pinMissing && <p role="status">Kênh đo không còn trong cửa sổ; mức mẫu là UNKNOWN. Chọn kênh khác để tiếp tục.</p>}
        {([{ name: 'A', index: aIndex, time: aTime, set: setAMs }, { name: 'B', index: bIndex, time: bTime, set: setBMs }]).map(cursor => {
          const point = measureSampledCursors(points, pin ?? -1, cursor.time, cursor.time)
          const reading = formatCursor(point.status === 'ok' ? point.a : { atMs: cursor.time, level: 'UNKNOWN' })
          return <div className="freestyle-cursor" key={cursor.name}>
          <label htmlFor={`${controlId}-${cursor.name}`}>Con trỏ {cursor.name}</label>
          <input id={`${controlId}-${cursor.name}`} type="range" min={0} max={points.length - 1} step={1} value={cursor.index < 0 ? 0 : cursor.index}
            aria-valuetext={cursor.index < 0 ? 'Mẫu đã ngoài cửa sổ; chọn lại hoặc đặt lại A/B' : reading}
            onChange={event => cursor.set(points[Number(event.target.value)]?.atMs)}/>
          <output data-cursor={cursor.name} aria-live="off">{cursor.index < 0 ? `Mẫu ${displayMs(cursor.time)} ms đã ngoài cửa sổ; chọn lại hoặc đặt lại A/B.` : reading}</output>
        </div>})}
        {result.status === 'missing-cursor' && <p role="status">Mẫu con trỏ đã ngoài cửa sổ; chọn lại hoặc đặt lại A/B.</p>}
        <p className="freestyle-measure-result" aria-live="off">{result.status === 'ok' ? `Δt: ${displayMs(result.deltaMs)} ms` : 'Chưa có Δt: chọn lại mẫu ngoài cửa sổ hoặc đặt lại A/B.'}</p>
        <p>Cửa sổ hiện tại: {displayMs(start)}–{displayMs(end)} ms mô phỏng · {points.length}/512 mẫu. Thời gian hiển thị làm tròn tối đa 3 chữ số thập phân (ms). Δt chỉ là khoảng cách hai timestamp; không xác nhận mức liên tục, tần số hay duty. PWM chỉ là metadata runtime.</p>
      </fieldset>
      <div className="freestyle-wave-axis"><span>{displayMs(start)} ms</span><span>{displayMs(end)} ms mô phỏng</span></div>
      {channels.map(value => {
        const latest = measureSampledCursors(points, value, end, end)
        return <div className="freestyle-wave-channel" key={value} data-wave-pin={value}>
        <strong>{pinDisplayName(boardId, value)}</strong><svg viewBox="0 0 1000 72" preserveAspectRatio="none" role="img" aria-label={`${pinDisplayName(boardId, value)} · ${points.length} mẫu logic`}>
          <path className="freestyle-wave-grid" d="M0 18H1000M0 54H1000M250 0V72M500 0V72M750 0V72"/>
          <path className="freestyle-wave-path" d={tracePath(points, value, start, end)}/>
          {value === pin && aIndex >= 0 && <path className="freestyle-cursor-marker freestyle-cursor-a" d={`M${markerX(aTime)} 0V72`}/>}
          {value === pin && bIndex >= 0 && <path className="freestyle-cursor-marker freestyle-cursor-b" d={`M${markerX(bTime)} 0V72`}/>}
        </svg>
        <span>{latest.status === 'ok' ? latest.a.pwm === undefined ? latest.a.level : `PWM ${Math.round(latest.a.pwm * 100)}% (metadata runtime)` : 'UNKNOWN'}</span>
      </div>})}
    </>}
  </section>
}
