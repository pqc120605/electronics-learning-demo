import { useEffect, useRef } from 'react'
import type { FlowLegendEntry, SerialEntry } from '../../lib/signalFlow'
import './SignalFlowPanel.css'

type Props = {
  code: string
  activeLine?: number
  serial: readonly SerialEntry[]
  legend: readonly FlowLegendEntry[]
  running: boolean
  illustrative: boolean
}

const arrow = (direction: FlowLegendEntry['direction']) => direction === 'none' ? '' : ' →'

/** Code line, Serial log and net legend for the running lesson; all values come from the trace/provider frame. */
export function SignalFlowPanel({ code, activeLine, serial, legend, running, illustrative }: Props) {
  const lines = code.split(/\r\n|\r|\n/)
  const listRef = useRef<HTMLOListElement>(null)
  useEffect(() => {
    // Scroll only inside the code box so the page itself never jumps.
    const list = listRef.current, item = list?.querySelector<HTMLElement>('.is-current')
    if (list && item) list.scrollTop = Math.max(0, item.offsetTop - list.clientHeight / 2)
  }, [activeLine])
  return (
    <section className="signal-flow-panel" aria-label="Luồng tín hiệu khi chạy">
      <header>
        <strong>Luồng tín hiệu</strong>
        {illustrative && <span className="signal-flow-badge">minh họa · không chạy code</span>}
        {!running && <span className="signal-flow-idle">Bấm chạy hoặc chạy từng bước để xem.</span>}
      </header>
      {legend.length > 0 && <ul className="signal-flow-legend" aria-label="Nhãn mức trên các dây">
        {legend.map(entry => <li key={entry.wireId} data-signal={entry.signal}>{entry.label}{arrow(entry.direction)}</li>)}
      </ul>}
      <div className="signal-flow-columns">
        <ol ref={listRef} className="signal-flow-code" tabIndex={0} aria-label="Code bài học, dòng đang chạy được tô nền">
          {lines.map((line, index) => {
            const current = running && activeLine === index + 1
            return <li key={index} className={current ? 'is-current' : undefined} aria-current={current ? 'step' : undefined}><code>{line || ' '}</code></li>
          })}
        </ol>
        <div className="signal-flow-serial">
          <strong>Serial (sự kiện mô phỏng)</strong>
          <div role="log" aria-live="polite">
            <ol>
              {serial.length === 0 ? <li className="signal-flow-empty">Chưa có sự kiện.</li> : serial.map(entry => <li key={`${entry.atMs}-${entry.text}`}><time>{(entry.atMs / 1000).toFixed(1)} s</time> {entry.text}</li>)}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
