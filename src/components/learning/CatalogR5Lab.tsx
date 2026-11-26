import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getR5PartByType, type R5Part } from '../../data/catalogR5Parts'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import { useProductRoute } from '../../lib/useProductRoute'
import { r5SpicePeaks } from '../../simulation/catalogR5Analog'
import type { R5Sample } from '../../simulation/catalogR5Drivers'
import { measureR5, r5Modes } from '../../simulation/catalogR5Lab'
import '../CatalogR1Explorer.css'

type Result = { ok: boolean; text: string; samples?: R5Sample[] }
type SpiceSeries = { name: string; values: number[] }
type Message = { type: 'progress' } | { type: 'error'; message: string } | { type: 'result'; series: SpiceSeries[] }
const channelLabels: Record<string, string> = {
  load: 'Loa (V)', ampout: 'VOUT trước tụ (V)', outa: 'Kênh A (V)', outb: 'Kênh B (V)', v: 'Điện áp (V)', i: 'Dòng (A)',
  velocity: 'Tốc độ A (rad/s)', velocityB: 'Tốc độ B (rad/s)', iB: 'Dòng B (A)', iA: 'Dòng pha A (A)',
  left: 'Trái', right: 'Phải', pcmLeft: 'PCM trái', pcmRight: 'PCM phải', phaseA: 'Pha A đặt (A)',
  phaseB: 'Pha B đặt (A)', index: 'Chỉ số bước', home: '/HOME', enable: 'Bật cầu', a: 'Dòng (A)',
}

function runSpice(measurement: Extract<ReturnType<typeof measureR5>, { kind: 'spice' }>, publish: (result: Result) => void) {
  let worker: Worker
  try {
    worker = new Worker(new URL('../../simulation/spice.worker.ts', import.meta.url), { type: 'module' })
  } catch {
    publish({ ok: false, text: 'Trình duyệt không khởi tạo được ngspice WASM.' })
    return
  }
  function finish(result?: Result) {
    window.clearTimeout(timeout)
    worker.terminate()
    if (result) publish(result)
  }
  const timeout = window.setTimeout(() => finish({ ok: false, text: 'Ngspice vượt 30 giây.' }), 30_000)
  worker.onerror = () => finish({ ok: false, text: 'Không tải được ngspice WASM.' })
  worker.onmessage = (event: MessageEvent<Message>) => {
    const message = event.data
    if (message.type === 'progress') return
    if (message.type === 'error') return finish({ ok: false, text: message.message })
    try {
      const peaks = r5SpicePeaks(measurement.probes, message.series)
      const time = message.series.find(series => series.name.toLowerCase() === 'time')!.values
      const channels = Object.entries(measurement.probes).map(([key, name]) =>
        [key, message.series.find(series => series.name.toLowerCase() === name)!.values] as const)
      const samples = time.map((seconds, index) => ({
        timeMs: seconds * 1000,
        values: Object.fromEntries(channels.map(([key, values]) => [key, values[index]])),
      }))
      finish({ ok: true, text: measurement.text + ' · ' + Object.entries(peaks).map(([key, peak]) =>
        channelLabels[key] + ' ' + peak.toFixed(3) + ' V đỉnh').join(' · ') + ' · ngspice WASM', samples })
    } catch (error) {
      finish({ ok: false, text: error instanceof Error ? error.message : 'Thiếu số đo ngspice.' })
    }
  }
  worker.postMessage({ type: 'run', runId: 'r5', netlist: measurement.netlist })
  return finish
}

function R5Trace({ samples }: { samples: R5Sample[] }) {
  const channels = Object.keys(samples[0].values)
  const [selected, setSelected] = useState('')
  const channel = channels.includes(selected) ? selected : (channels.includes('v') ? 'v' : channels[0])
  const values = samples.map(point => point.values[channel])
  const low = Math.min(...values), high = Math.max(...values)
  const first = samples[0].timeMs, last = samples.at(-1)!.timeMs
  const points = samples.map(({ timeMs }, index) => {
    const x = (timeMs - first) * 314 / (last - first || 1) + 3
    const y = high === low ? 39 : 77 - 75 * (values[index] - low) / (high - low)
    return x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
  return <figure style={{ margin: '0.75rem 0', maxWidth: 460 }}>
    <label>Kênh đo <select value={channel} onChange={event => setSelected(event.target.value)}>
      {channels.map(key => <option key={key} value={key}>{channelLabels[key] ?? key}</option>)}
    </select></label>
    <svg viewBox="0 0 320 80" width="100%" role="img" aria-label={'Đồ thị ' + (channelLabels[channel] ?? channel)}>
      <path d="M3 2v75h314" fill="none" stroke="currentColor" opacity=".35" />
      <polyline points={points} fill="none" stroke="#12818a" strokeWidth="2" />
    </svg>
    <figcaption>{first.toFixed(2)}–{last.toFixed(2)} ms · min {low.toFixed(3)} · max {high.toFixed(3)}</figcaption>
  </figure>
}

export function CatalogR5Lab({ part }: { part: R5Part }) {
  const route = useProductRoute()
  const link = (variant = '') => route('/build/freestyle?fixture=' + encodeURIComponent(part.id + variant))
  return <ul>
    <li><Link to={link()}>Mở mạch thử đã nối trên bàn tự do</Link></li>
    {part.catalogId === 'lm386' && <>
      <li><Link to={link(':gain')}>Mạch độ lợi 200× với tụ 10 µF</Link></li>
      <li><Link to={link(':clip')}>Mạch đo bão hòa LM386</Link></li>
    </>}
    {part.catalogId === 'ne5532' && <li><Link to={link(':gain')}>Mạch độ lợi 5× với Rf 4 kΩ</Link></li>}
  </ul>
}

export function R5CircuitControls({ doc, selectedId }: { doc: CircuitDocV2; selectedId?: string | null }) {
  const ids = doc.parts.filter(item => getR5PartByType(item.type))
  const component = ids.find(part => part.id === selectedId) ?? ids[0]
  const part = component && getR5PartByType(component.type)
  const [request, setRequest] = useState<{ doc: CircuitDocV2; id: string; mode: string }>()
  const [result, setResult] = useState<{ request: NonNullable<typeof request>; reading: Result }>()
  const active = request?.doc === doc && request.id === component?.id ? request : undefined
  const reading = active && result?.request === active ? result.reading : undefined
  useEffect(() => {
    if (!active) return
    const publish = (reading: Result) => setResult({ request: active, reading })
    const measurement = measureR5(active.doc, active.id, active.mode)
    if (measurement.kind !== 'spice') return publish(measurement)
    return runSpice(measurement, publish)
  }, [active])

  if (!part) return null
  return <section className="part-r1-practice" aria-label="Điều khiển mạch R5">
    <h3>Đo {part.mpn}</h3>
    <p>{part.scope}</p>
    <div className="part-r1-tabs" role="group" aria-label="Kích thích mạch">
      {r5Modes[part.catalogId].map(([mode, label]) =>
        <button type="button" key={mode} aria-pressed={active?.mode === mode}
          onClick={() => setRequest({ doc, id: component.id, mode })}>{label}</button>)}
    </div>
    <output aria-label="Kết quả mạch R5" data-r5-ok={reading?.ok}>
      {reading?.text ?? (active ? 'Đang đo trên mạch đã nối…' : 'Chọn kích thích để đo trên mạch đã nối.')}
    </output>
    {reading?.samples?.length ? <R5Trace samples={reading.samples} /> : null}
  </section>
}
