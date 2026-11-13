import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import type { Atmega328pSnapshot } from '../../lib/avr8jsRunner'
import type { SimulationInstrumentId, SimulationSessionStatus } from '../../simulation/contracts'
import { formatAxisDeltaSymbol, measureAnalogCursors } from '../../lib/waveformMeasure'
import { DigitalWaveform } from './DigitalWaveform'
import './SimulationInstrumentsPanel.css'

export type BuilderSimulationRuntime = 'lesson' | 'firmware'
export type PanelSpiceObservation = {
  analysis: string
  dataType: 'real' | 'complex'
  numPoints: number
  displayedPoints: number
  series: Array<{ name: string; type: string; values: number[] }>
  warnings: string[]
}

type Props = {
  lessonTitle: string
  providerName?: string
  accuracyLabel?: string
  status: SimulationSessionStatus
  statusMessage: string
  runtime: BuilderSimulationRuntime
  targetName: string
  firmwareAvailable: boolean
  firmwareUnavailableReason: string
  firmwareSketchAvailable: boolean
  firmwareToolRoute: string
  firmwareFileName: string
  firmwareLoading: boolean
  firmwareError: string
  firmwareRunning: boolean
  firmwareConfirmed: boolean
  firmwareFrame?: Atmega328pSnapshot
  lessonTrace: readonly string[]
  logicFlows: readonly { wireId: string; signal: string; label?: string; direction: 'forward' | 'reverse' | 'none' }[]
  spiceObservation?: PanelSpiceObservation
  onRuntimeChange: (runtime: BuilderSimulationRuntime) => void
  onFirmwareFile: (file?: File) => void
  onFirmwareConfirmation: (confirmed: boolean) => void
  onFirmwareRun: () => void
  onFirmwareStop: () => void
  onDownloadSketch: () => void
  onLoadFirmwareSample: () => void
  onExportFirmwareTrace: () => void
  onSwitchToSupportedBoard: () => void
  onDismissSpice?: () => void
}

const instrumentLabels: Record<SimulationInstrumentId, string> = {
  'digital-trace': 'Trace số / Logic Analyzer',
  'serial-monitor': 'Serial Monitor',
  'spice-waveform': 'Waveform SPICE',
}
const statusLabels: Record<SimulationSessionStatus, string> = {
  ready: 'Sẵn sàng', running: 'Đang chạy', completed: 'Đã chạy xong', stopped: 'Đã dừng',
  unsupported: 'Chưa hỗ trợ', invalid: 'Cần sửa đầu vào', timeout: 'Đã dừng do quá thời gian', failed: 'Lỗi mô phỏng',
}

function SpiceMiniPlot({ observation }: { observation: PanelSpiceObservation }) {
  const [cursorA, setCursorA] = useState(0)
  const [cursorB, setCursorB] = useState(1)
  const x = observation.series.find(item => item.type === 'time' || item.type === 'frequency')
  const y = observation.series.find(item => item !== x && item.type === 'voltage') ?? observation.series.find(item => item !== x)
  if (!x || !y || Math.min(x.values.length, y.values.length) < 2) {
    return <p className="simulation-instrument-note">Kết quả SPICE có {observation.displayedPoints} điểm; chưa đủ hai chuỗi để vẽ waveform, hãy xem kết quả trong bộ SPICE.</p>
  }
  const count = Math.min(x.values.length, y.values.length, 600)
  const stride = Math.max(1, Math.ceil(Math.min(x.values.length, y.values.length) / count))
  const points = Array.from({ length: Math.ceil(Math.min(x.values.length, y.values.length) / stride) }, (_, index) => ({ x: x.values[index * stride], y: y.values[index * stride] }))
  const xValues = points.map(point => point.x)
  const yValues = points.map(point => point.y)
  const xMin = Math.min(...xValues), xMax = Math.max(...xValues)
  const yMin = Math.min(...yValues), yMax = Math.max(...yValues)
  const xSpan = xMax - xMin || 1, ySpan = yMax - yMin || 1
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${(8 + (point.x - xMin) / xSpan * 284).toFixed(2)},${(96 - (point.y - yMin) / ySpan * 84).toFixed(2)}`).join(' ')
  const samples = points.map(point => ({ time: point.x, value: point.y }))
  const timeUnit = x.type === 'time' ? 's' : 'Hz'
  const axisDeltaSymbol = formatAxisDeltaSymbol(x.type)
  const valueUnit = y.type === 'voltage' ? 'V' : y.type === 'current' ? 'A' : y.type
  const measurement = measureAnalogCursors(samples, cursorA, cursorB, timeUnit, valueUnit)
  const xAt = (index: number) => 8 + (points[index].x - xMin) / xSpan * 284
  return <figure className="simulation-spice-plot">
    <figcaption>{y.name} theo {x.name} · {observation.analysis.toUpperCase()}{observation.dataType === 'complex' ? ' · độ lớn phức' : ''} · nguồn: solver SPICE</figcaption>
    <svg viewBox="0 0 300 112" role="img" aria-label={`Waveform SPICE ${y.name} theo ${x.name}`}><line x1="8" x2="292" y1="96" y2="96"/><line x1="8" x2="8" y1="8" y2="96"/><path d={path}/>{[cursorA, cursorB].map((index, cursor) => <line key={cursor} className="waveform-cursor" x1={xAt(index)} x2={xAt(index)} y1="8" y2="96"/>)}</svg>
    <div className="waveform-cursor-controls" aria-label="Đo waveform SPICE">
      {[cursorA, cursorB].map((index, cursor) => <label key={cursor}>Cursor {cursor === 0 ? 'A' : 'B'}
        <input type="range" min="0" max={points.length - 1} value={index} aria-valuetext={`${cursor === 0 ? 'Cursor A' : 'Cursor B'} tại ${points[index].x.toPrecision(4)} ${timeUnit}, ${points[index].y.toPrecision(4)} ${valueUnit}`} onChange={event => (cursor === 0 ? setCursorA : setCursorB)(Number(event.currentTarget.value))}/>
      </label>)}
      {measurement && <output>{axisDeltaSymbol} {measurement.deltaTime.toPrecision(4)} {measurement.timeUnit} · Δ{y.type === 'voltage' ? 'V' : y.type === 'current' ? 'I' : 'giá trị'} {measurement.deltaValue.toPrecision(4)} {measurement.valueUnit}</output>}
    </div>
    <small>{x.name}: {xMin.toPrecision(4)}–{xMax.toPrecision(4)} {x.type} · {y.name}: {yMin.toPrecision(4)}–{yMax.toPrecision(4)} {y.type}</small>
  </figure>
}

export function SimulationInstrumentsPanel(props: Props) {
  const [activeInstrument, setActiveInstrument] = useState<SimulationInstrumentId>('digital-trace')
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([])
  const firmwareTabEnabled = props.runtime === 'firmware' && props.firmwareAvailable
  const enabled: Record<SimulationInstrumentId, boolean> = {
    'digital-trace': true,
    'serial-monitor': firmwareTabEnabled,
    'spice-waveform': Boolean(props.spiceObservation),
  }
  const tabs = Object.keys(instrumentLabels) as SimulationInstrumentId[]
  const activeTab = enabled[activeInstrument] ? activeInstrument : 'digital-trace'

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const allowed = tabs.map((id, tabIndex) => enabled[id] ? tabIndex : -1).filter(tabIndex => tabIndex >= 0)
    if (!allowed.length) return
    const nextIndex = event.key === 'Home' ? allowed[0]
      : event.key === 'End' ? allowed.at(-1)!
        : allowed[(allowed.indexOf(index) + (event.key === 'ArrowRight' ? 1 : -1) + allowed.length) % allowed.length]
    setActiveInstrument(tabs[nextIndex])
    tabsRef.current[nextIndex]?.focus()
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    props.onFirmwareFile(event.currentTarget.files?.[0])
    event.currentTarget.value = ''
  }

  return <section className="simulation-instruments" aria-labelledby="simulation-instruments-title">
    <header className="simulation-instruments-heading">
      <div><p>QUAN SÁT · {props.lessonTitle}</p><h3 id="simulation-instruments-title">Kết quả đến từ đâu?</h3></div>
      <span className={`simulation-status simulation-status-${props.status}`} role="status">{statusLabels[props.status]}</span>
    </header>
    <p className="simulation-instruments-summary">{props.statusMessage}</p>
    <div className="simulation-runtime-picker" role="group" aria-label="Chọn cách mô phỏng">
      <button type="button" aria-pressed={props.runtime === 'lesson'} onClick={() => props.onRuntimeChange('lesson')}>Mô hình bài học</button>
      <button type="button" aria-pressed={props.runtime === 'firmware'} disabled={!props.firmwareAvailable} title={!props.firmwareAvailable ? props.firmwareUnavailableReason : undefined} onClick={() => props.onRuntimeChange('firmware')}>Firmware HEX · AVR8js</button>
    </div>
    {!props.firmwareAvailable && <div className="simulation-firmware-unavailable"><p className="simulation-instrument-note">Firmware HEX: {props.firmwareUnavailableReason} Mô phỏng firmware hiện chỉ chạy ATmega328P trên Uno R3/Nano classic; ESP32, Pico và STM32 chưa chạy firmware ở đây.</p><div><button type="button" onClick={props.onSwitchToSupportedBoard}>Chuyển sang Uno R3</button><a href={props.firmwareToolRoute}>Mở công cụ firmware HEX ↗</a></div></div>}
    <div className="simulation-instrument-tabs" role="tablist" aria-label="Công cụ quan sát mô phỏng">
      {tabs.map((id, index) => <button key={id} ref={node => { tabsRef.current[index] = node }} type="button" role="tab" id={`instrument-tab-${id}`} aria-controls={`instrument-panel-${id}`} aria-selected={activeTab === id} aria-disabled={!enabled[id]} tabIndex={activeTab === id ? 0 : -1} disabled={!enabled[id]} onClick={() => setActiveInstrument(id)} onKeyDown={event => handleTabKey(event, index)}>{instrumentLabels[id]}</button>)}
    </div>
    <div className="simulation-instrument-content" role="tabpanel" id={`instrument-panel-${activeTab}`} aria-labelledby={`instrument-tab-${activeTab}`} tabIndex={0}>
      {activeTab === 'digital-trace' && <>
        {props.runtime === 'lesson' && <p className="simulation-instrument-source">{props.accuracyLabel ?? 'Mô phỏng hành vi cơ bản'}{props.providerName ? ` · ${props.providerName}` : ''}. Đây là trace giáo dục, không phải phép đo điện.</p>}
        {props.runtime === 'firmware' && <>
          <p className="simulation-instrument-source">AVR8js · {props.targetName} · chỉ quan sát built-in LED D13/PB5. HEX không tự xác nhận MCU đích.</p>
          <section className="simulation-firmware-guide" aria-label="Các bước chạy firmware HEX">
            <strong>Quy trình firmware</strong>
            <ol><li>{props.firmwareSketchAvailable ? 'Xuất sketch .ino từ bài hiện tại.' : 'Dùng công cụ HEX hoặc mở bài LED cơ bản trên Uno/Nano để xuất sketch.'}</li><li>Mở sketch bằng Arduino IDE, chọn đúng board Uno R3 hoặc Nano classic rồi biên dịch.</li><li>Trong Arduino IDE, dùng mục Sketch → Export Compiled Binary để tạo tệp .hex.</li><li>Chọn tệp HEX ở dưới, xác nhận ATmega328P và chạy để xem D13/UART0.</li></ol>
            <div>{props.firmwareSketchAvailable && <button type="button" onClick={props.onDownloadSketch}>Xuất sketch .ino</button>}<a href={props.firmwareToolRoute}>Mở công cụ firmware HEX ↗</a></div>
            <small>Mạch Mở không biên dịch, nạp firmware lên board thật hay xác nhận target từ HEX; simulator chỉ chạy AVR8js cho ATmega328P.</small>
            <button type="button" disabled={props.firmwareLoading} onClick={props.onLoadFirmwareSample}>Nạp HEX mẫu D13 · Arduino IDE</button>
            <small>Mẫu được biên dịch sẵn cho Uno ATmega328P 16 MHz; quan sát LED tích hợp D13, độc lập với code và linh kiện trong bài hiện tại. Cần xác nhận target trước khi chạy.</small>
          </section>
          {props.firmwareLoading && <p role="status">Đang đọc firmware…</p>}
          <label className="simulation-firmware-file">Chọn firmware Intel HEX (.hex)<input type="file" accept=".hex,.ihx,.ihex,text/plain" onChange={handleFile}/></label>
          {props.firmwareFileName && <small className="simulation-firmware-filename">{props.firmwareFileName}</small>}
          <label className="simulation-firmware-confirm"><input type="checkbox" checked={props.firmwareConfirmed} disabled={props.firmwareRunning} onChange={event => props.onFirmwareConfirmation(event.currentTarget.checked)}/> Tôi xác nhận tệp được biên dịch cho ATmega328P.</label>
          <button type="button" className="simulation-firmware-run" disabled={props.firmwareLoading || (!props.firmwareRunning && (!props.firmwareFileName || !props.firmwareConfirmed))} onClick={props.firmwareRunning ? props.onFirmwareStop : props.onFirmwareRun}>{props.firmwareRunning ? 'Dừng firmware' : 'Chạy firmware'}</button>
          {props.firmwareError && <p className="simulation-instrument-error" role="alert">{props.firmwareError}</p>}
          {props.firmwareFrame && <>
            <div className="simulation-avr-state"><strong>D13 · {props.firmwareFrame.led13 === 'on' ? 'HIGH · LED bật' : props.firmwareFrame.led13 === 'off' ? 'LOW · LED tắt' : 'INPUT · chưa cấu hình output'}</strong><span>{props.firmwareFrame.simulatedMilliseconds.toFixed(1)} ms mô phỏng · {props.firmwareFrame.cycles.toLocaleString('vi-VN')} chu kỳ</span></div>
            <DigitalWaveform events={props.firmwareFrame.pinTransitionEvents} simulatedMilliseconds={props.firmwareFrame.simulatedMilliseconds} signalName={`D13 / PB5 · ${props.targetName}`} truncated={props.firmwareFrame.traceTruncated}/>
            <button type="button" className="simulation-firmware-run" disabled={props.firmwareRunning || !props.firmwareFrame.pinTransitionEvents.length} onClick={props.onExportFirmwareTrace}>Tải trace D13 · CSV</button>
          </>}
        </>}
        {props.runtime === 'lesson' && <ol className="simulation-trace-list">{props.lessonTrace.length ? props.lessonTrace.map((line, index) => <li key={`${index}-${line}`}>{line}</li>) : <li>Chạy hoặc chạy từng bước để tạo trace từ provider bài học.</li>}</ol>}
        {props.runtime === 'lesson' && props.logicFlows.length > 0 && <details className="simulation-logic-lines"><summary>Luồng logic trên {props.logicFlows.length} đoạn dây</summary><ul>{props.logicFlows.slice(0, 40).map(flow => <li key={flow.wireId}><b>{flow.label ?? flow.signal}</b><span>{flow.direction === 'forward' ? 'theo chiều nối' : flow.direction === 'reverse' ? 'ngược chiều nối' : 'không gán chiều'} · {flow.wireId}</span></li>)}</ul>{props.logicFlows.length > 40 && <small>Chỉ hiện 40 đoạn; các dây còn lại vẫn giữ trên canvas.</small>}</details>}
      </>}
      {activeTab === 'serial-monitor' && <section className="simulation-serial-monitor" aria-labelledby="simulation-serial-title"><h4 id="simulation-serial-title">Serial Monitor · UART0</h4><pre>{props.firmwareFrame?.serialText || (props.firmwareRunning ? 'Đang chờ firmware phát UART…' : 'Chạy HEX hỗ trợ Serial để xem dữ liệu UART0.')}</pre><small>{props.firmwareFrame?.serialByteCount ?? 0} byte đã thu{props.firmwareFrame?.serialTruncated ? ' · đã chạm giới hạn lưu' : ''}. Baud timing/peripheral fidelity chưa được xác minh.</small></section>}
      {activeTab === 'spice-waveform' && props.spiceObservation && <>
        <p className="simulation-instrument-source">Dữ liệu solver SPICE đã chạy từ phần mạch tương đương. Không phải phép đo board thật; firmware/GPIO MCU không chạy trong solver.</p>
        <SpiceMiniPlot observation={props.spiceObservation}/>
        {props.spiceObservation.warnings.length > 0 && <details><summary>{props.spiceObservation.warnings.length} cảnh báo từ solver</summary><ul>{props.spiceObservation.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul></details>}
        {props.onDismissSpice && <button type="button" className="simulation-dismiss-spice" onClick={props.onDismissSpice}>Đóng kết quả SPICE khỏi workspace</button>}
      </>}
      {!enabled[activeInstrument] && <p className="simulation-instrument-note">Công cụ này chưa được bật cho provider/phiên hiện tại.</p>}
    </div>
  </section>
}
