import type { Atmega328pSnapshot } from '../../lib/avr8jsRunner'
import { useState } from 'react'
import { measureLogicSignal } from '../../lib/waveformMeasure'
import './DigitalWaveform.css'

type Props = {
  events: Atmega328pSnapshot['pinTransitionEvents']
  simulatedMilliseconds: number
  signalName?: string
  variant?: 'dark' | 'light'
  truncated?: boolean
}

function formatTime(value: number) {
  if (Math.abs(value) < 1) return `${value.toFixed(3)} ms`
  if (Math.abs(value) < 10) return `${value.toFixed(2)} ms`
  return `${value.toFixed(1)} ms`
}

export function DigitalWaveform({ events, simulatedMilliseconds, signalName = 'D13 / PB5', variant = 'dark', truncated = false }: Props) {
  const [cursorA, setCursorA] = useState(0)
  const [cursorB, setCursorB] = useState(Math.max(events.length - 1, 0))
  if (events.length === 0) {
    return <p className="digital-waveform-empty">Chưa có chuyển mức để vẽ. Chạy firmware có cấu hình D13/PB5 làm output để bắt đầu ghi.</p>
  }

  const firstTime = events[0].simulatedMilliseconds
  const endTime = Math.max(simulatedMilliseconds, events.at(-1)!.simulatedMilliseconds)
  const duration = Math.max(endTime - firstTime, 0.001)
  const left = 46
  const right = 632
  const top = 18
  const highY = 35
  const lowY = 82
  const bottom = 96
  const xAt = (time: number) => left + Math.max(0, Math.min(1, (time - firstTime) / duration)) * (right - left)
  const yAt = (level: boolean) => level ? highY : lowY
  let path = `M ${left} ${yAt(events[0].level)}`
  let priorLevel = events[0].level
  for (const event of events.slice(1)) {
    const x = xAt(event.simulatedMilliseconds)
    path += ` L ${x.toFixed(2)} ${yAt(priorLevel)} L ${x.toFixed(2)} ${yAt(event.level)}`
    priorLevel = event.level
  }
  path += ` L ${right} ${yAt(priorLevel)}`
  const logicEvents = events.map(event => ({ time: event.simulatedMilliseconds, level: event.level }))
  const estimate = measureLogicSignal(logicEvents)
  const cursorStart = events[Math.min(cursorA, events.length - 1)]
  const cursorEnd = events[Math.min(cursorB, events.length - 1)]
  const cursorDeltaMs = Math.abs(cursorEnd.simulatedMilliseconds - cursorStart.simulatedMilliseconds)
  const ticks = Array.from({ length: 5 }, (_, index) => index / 4)

  return <figure className="digital-waveform" data-variant={variant}>
    <figcaption>
      <strong>Logic Analyzer · {signalName}</strong>
      <span>{events.length}{truncated ? '+' : ''} lần đổi mức · {formatTime(duration)} thời gian mô phỏng</span>
    </figcaption>
    <svg viewBox="0 0 650 122" role="img" aria-label={`Dạng sóng số ${signalName}, ${events.length} lần chuyển mức trong ${formatTime(duration)}`}>
      {ticks.map((fraction, index) => {
        const x = left + fraction * (right - left)
        return <g key={fraction}>
          <line className="digital-waveform-grid" x1={x} x2={x} y1={top} y2={bottom}/>
          {index % 2 === 0 && <text className="digital-waveform-axis" x={x} y="115" textAnchor={index === 0 ? 'start' : index === 4 ? 'end' : 'middle'}>{formatTime(duration * fraction)}</text>}
        </g>
      })}
      <line className="digital-waveform-grid" x1={left} x2={right} y1={highY} y2={highY}/>
      <line className="digital-waveform-grid" x1={left} x2={right} y1={lowY} y2={lowY}/>
      <text className="digital-waveform-level" x="1" y={highY + 4}>HIGH</text>
      <text className="digital-waveform-level" x="1" y={lowY + 4}>LOW</text>
      <path className="digital-waveform-trace" d={path}/>
      {[cursorA, cursorB].map((cursor, index) => <line key={index} className="waveform-cursor" x1={xAt(events[Math.min(cursor, events.length - 1)].simulatedMilliseconds)} x2={xAt(events[Math.min(cursor, events.length - 1)].simulatedMilliseconds)} y1={top} y2={bottom}/>) }
    </svg>
    <div className="waveform-cursor-controls" aria-label="Đo khoảng thời gian trên trace logic">
      {[cursorA, cursorB].map((cursor, index) => <label key={index}>Cursor {index === 0 ? 'A' : 'B'}
        <input type="range" min="0" max={events.length - 1} value={Math.min(cursor, events.length - 1)} aria-valuetext={`${index === 0 ? 'Cursor A' : 'Cursor B'} tại ${formatTime(events[Math.min(cursor, events.length - 1)].simulatedMilliseconds - firstTime)}, mức ${events[Math.min(cursor, events.length - 1)].level ? 'HIGH' : 'LOW'}`} onChange={event => (index === 0 ? setCursorA : setCursorB)(Number(event.currentTarget.value))}/>
      </label>)}
      <output>Δt {formatTime(cursorDeltaMs)} · {cursorStart.level ? 'HIGH' : 'LOW'} → {cursorEnd.level ? 'HIGH' : 'LOW'} · giá trị là logic, không phải điện áp</output>
    </div>
    <div className="digital-waveform-stats" aria-label="Ước tính từ các chu kỳ hoàn chỉnh">
      {estimate
        ? <><span><b>{estimate.frequencyHz >= 1000 ? `${(estimate.frequencyHz / 1000).toPrecision(3)} kHz` : `${estimate.frequencyHz.toPrecision(3)} Hz`}</b> tần số ước tính (trace logic)</span><span><b>{estimate.dutyCycle.toFixed(1)}%</b> duty cycle trung bình</span><span>{estimate.periods} chu kỳ hoàn chỉnh</span></>
        : <span>Cần ít nhất hai cạnh lên và cạnh xuống tương ứng để ước tính tần số/duty cycle.</span>}
    </div>
    <details className="digital-waveform-events">
      <summary>Danh sách chuyển mức có timestamp</summary>
      <ol>{events.map((event, index) => <li key={`${event.cycles}-${index}`}><code>{formatTime(event.simulatedMilliseconds - firstTime)}</code><b>{event.level ? 'HIGH' : 'LOW'}</b><span>{event.cycles.toLocaleString('vi-VN')} chu kỳ CPU</span></li>)}</ol>
    </details>
    <small className="digital-waveform-disclaimer">Trục thời gian lấy từ chu kỳ CPU mô phỏng AVR8js, bắt đầu ở lần đổi mức đầu tiên. Đây không phải phép đo trên board thật; {truncated ? 'trace đã bị cắt sau 128 lần chuyển mức.' : 'trace lưu tối đa 128 lần chuyển mức.'}</small>
  </figure>
}
