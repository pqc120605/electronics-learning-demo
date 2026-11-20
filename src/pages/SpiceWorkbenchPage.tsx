import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { SpiceProbeMap } from '../components/spice/SpiceProbeMap'
import { formatEngineering, parseSpiceTopology, probeValue } from '../simulation/spiceProbes'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useProductRoute } from '../lib/useProductRoute'
import { readCalculatorSpiceHandoff, type CalculatorSpiceHandoff } from '../lib/calculatorSpice'
import { compileKicadXmlNetlist, type KicadSpiceImportResult } from '../lib/kicadSpiceImport'
import { clearWorkspaceSpiceHandoff, readWorkspaceSpiceHandoff, storeWorkspaceSpiceObservation, type WorkspaceSpiceAnalysisResult, type WorkspaceSpiceHandoff } from '../lib/workspaceSpice'
import { getBrowserStorage } from '../lib/workspaceStorage'
import { createSimulationRunId, isCurrentSimulationRun } from '../lib/workspaceSimulationSession'
import { inspectSpiceNetlist, type SpiceNetlistInspection } from '../simulation/spiceNetlist'
import { KicadPcbSpiceImport } from '../components/spice/KicadPcbSpiceImport'
import { AnalysisPicker } from '../components/spice/AnalysisPicker'
import { formatAxisDeltaSymbol, measureAnalogCursors } from '../lib/waveformMeasure'
import { signalWindow } from '../lib/signalWindow'
import './SpiceWorkbenchPage.css'

type SpiceSeries = { name: string; type: string; values: number[] }
type SpiceResult = { analysis: string; dataType: 'real' | 'complex'; numPoints: number; displayedPoints: number; series: SpiceSeries[]; warnings: string[]; netlist?: string }
type SpiceWorkerMessage =
  | { type: 'progress'; runId: string; stage: 'loading' | 'initializing' | 'solving'; message: string }
  | { type: 'result'; runId: string; analysis: string; dataType: 'real' | 'complex'; numPoints: number; displayedPoints: number; series: SpiceSeries[]; warnings: string[] }
  | { type: 'error'; runId: string; message: string }
type RunState = 'idle' | 'running' | 'complete' | 'error'
const WORKER_TIMEOUT_MS = 30_000

const examples = [
  {
    id: 'divider',
    name: 'Bộ chia áp · DC',
    description: 'Nguồn 5 V và hai điện trở bằng nhau. Thử dự đoán điện áp ở giữa.',
    netlist: `Voltage divider · two equal resistors
V1 IN 0 DC 5
R1 IN OUT 1k
R2 OUT 0 1k
.op
.end`,
  },
  {
    id: 'rc',
    name: 'Đáp ứng RC · quá độ',
    description: 'Quan sát điện áp tụ khi đầu vào chuyển mức.',
    netlist: `RC step response · 1kΩ and 10µF
V1 IN 0 PULSE(0 5 0 1us 1us 5ms 10ms)
R1 IN OUT 1k
C1 OUT 0 10u
.tran 10us 50ms
.end`,
  },
  {
    id: 'led',
    name: 'LED và điện trở · điểm làm việc',
    description: 'Ước lượng dòng điện với model diode SPICE đơn giản.',
    netlist: `LED with series resistor · idealized model
V1 VIN 0 DC 5
R1 VIN ANODE 330
D1 ANODE 0 DLED
.model DLED D(IS=1e-14 N=2)
.op
.end`,
  },
] as const

function compact(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(value)
}

function DividerPractice({ result, running, prediction, run }: { result?: SpiceResult; running: boolean; prediction: number | null; run: (prediction: number) => void }) {
  const [input, setInput] = useState('')
  const trimmed = input.trim()
  const expected = /^\d+(?:[.,]\d+)?$/.test(trimmed) ? Number(trimmed.replace(',', '.')) : Number.NaN
  const canRun = Number.isFinite(expected) && expected >= 0 && expected <= 5 && !running
  const voltage = result?.analysis === 'op' && result.dataType === 'real' && result.netlist === examples[0].netlist
    ? probeValue(result.series, 'v(out)', 0)
    : undefined
  return <section className="spice-divider-practice" aria-labelledby="spice-divider-title">
    <h3 id="spice-divider-title">Đo điện áp bộ chia</h3>
    <p>Điện áp từ nút OUT ở giữa R1–R2 về GND là bao nhiêu?</p>
    <form onSubmit={event => {
      event.preventDefault()
      if (canRun) run(expected)
    }}>
      <label htmlFor="spice-divider-guess">Dự đoán V(OUT), đơn vị V</label>
      <div className="spice-divider-actions">
        <input id="spice-divider-guess" type="text" inputMode="decimal" placeholder="0–5" maxLength={16} value={input} onChange={event => setInput(event.target.value)} />
        <button type="submit" disabled={!canRun}>Ghi dự đoán và chạy</button>
      </div>
    </form>
    <div role="status" aria-live="polite">
      {voltage !== undefined && prediction !== null && <>
        <p><strong>Ngspice · V(OUT) = {compact(voltage)} V</strong></p>
        <p>Dự đoán {compact(prediction)} V · Chênh lệch {compact(Math.abs(voltage - prediction))} V.</p>
        <p>R1 và R2 bằng nhau nên mỗi điện trở nhận một nửa điện áp nguồn trong mạch này. Chọn nút OUT trên <a href="#spice-results-heading">sơ đồ kết quả</a> để xem điểm đo.</p>
      </>}
      {running && prediction !== null && <p>Đang kiểm dự đoán {compact(prediction)} V bằng ngspice.</p>}
    </div>
  </section>
}

function downloadCsv(result: SpiceResult) {
  const header = result.series.map(series => series.name).join(',')
  const rows = Array.from({ length: result.displayedPoints }, (_, index) => result.series.map(series => String(series.values[index] ?? '')).join(','))
  const blob = new Blob([`${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'mach-mo-spice-results.csv'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

const spiceUnits: Record<string, string> = { time: 's', frequency: 'Hz', voltage: 'V', current: 'A' }
const spiceUnit = (type: string) => spiceUnits[type] ?? ''

function SpicePlot({ x, y, comparison, complex, cursors, zoom, position }: { x: SpiceSeries; y: SpiceSeries; comparison?: SpiceSeries; complex: boolean; cursors: [number, number]; zoom: number; position: number }) {
  const signals = comparison ? [y, comparison] : [y]
  const points = Math.min(x.values.length, ...signals.map(signal => signal.values.length))
  if (points < 2) return <p className="spice-plot-note">Phép phân tích có một điểm; xem giá trị trong bảng kết quả.</p>
  const { start, end } = signalWindow(points, zoom, position)
  const xValues = x.values.slice(start, end)
  const values = signals.map(signal => signal.values.slice(start, end))
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const yMin = Math.min(...values.flat())
  const yMax = Math.max(...values.flat())
  const width = 720
  const height = 240
  const pad = { left: 48, right: 16, top: 14, bottom: 34 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const xSpan = xMax - xMin || 1
  const ySpan = yMax - yMin || 1
  const xAt = (value: number) => pad.left + ((value - xMin) / xSpan) * innerW
  const yAt = (value: number) => pad.top + innerH - ((value - yMin) / ySpan) * innerH
  const label = `${signals.map(signal => signal.name).join(' và ')} theo ${x.name}${complex ? ' · độ lớn AC' : ''}`

  return <figure className="spice-plot">
    <figcaption>{label}</figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Đồ thị ${label}; trục ngang ${x.name}, trục dọc ${y.name}`}>
      {[0, 1, 2, 3].map(line => { const yPos = pad.top + (innerH * line / 3); return <line key={line} x1={pad.left} x2={width - pad.right} y1={yPos} y2={yPos} className="spice-grid-line" /> })}
      <line x1={pad.left} x2={pad.left} y1={pad.top} y2={height - pad.bottom} className="spice-axis-line" />
      <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className="spice-axis-line" />
      {signals.map((signal, channel) => <path key={signal.name} d={xValues.map((value, index) => `${index ? 'L' : 'M'}${xAt(value).toFixed(2)},${yAt(values[channel][index]).toFixed(2)}`).join(' ')} className={`spice-plot-line${channel === 1 ? ' spice-plot-compare' : ''}`} data-spice-series={signal.name} />)}
      {cursors.map((index, cursor) => index >= start && index < end && <g key={cursor} aria-hidden="true"><line x1={xAt(x.values[index])} x2={xAt(x.values[index])} y1={pad.top} y2={height - pad.bottom} className="spice-plot-cursor"/><text x={xAt(x.values[index])} y={pad.top - 2} className="spice-axis-label">{cursor === 0 ? 'A' : 'B'}</text></g>)}
      <text x={pad.left} y={height - 9} className="spice-axis-label">{formatEngineering(xMin, spiceUnit(x.type))}</text>
      <text x={width - pad.right} y={height - 9} textAnchor="end" className="spice-axis-label">{formatEngineering(xMax, spiceUnit(x.type))}</text>
      <text x={pad.left - 8} y={pad.top + 5} textAnchor="end" className="spice-axis-label">{formatEngineering(yMax, spiceUnit(y.type))}</text>
      <text x={pad.left - 8} y={height - pad.bottom} textAnchor="end" className="spice-axis-label">{formatEngineering(yMin, spiceUnit(y.type))}</text>
    </svg>
  </figure>
}

function Results({ result, onDownload }: { result: SpiceResult; onDownload: () => void }) {
  const x = result.series.find(series => series.type === 'time' || series.type === 'frequency')
  const candidates = result.series.filter(series => series !== x)
  const defaultSeries = candidates.find(series => series.type === 'voltage') ?? candidates[0]
  const seriesSignature = candidates.map(series => `${series.name}:${series.type}`).join('|')
  const [selectedSeriesName, setSelectedSeriesName] = useState(defaultSeries?.name ?? '')
  const selected = candidates.find(series => series.name === selectedSeriesName) ?? defaultSeries
  const [comparisonName, setComparisonName] = useState('')
  const compatible = candidates.filter(series => series !== selected && series.type === selected?.type)
  const comparison = compatible.find(series => series.name === comparisonName)
  const indices = [...new Set([0, Math.floor((result.displayedPoints - 1) / 2), Math.max(0, result.displayedPoints - 1)])]
  const topology = useMemo(() => result.netlist ? parseSpiceTopology(result.netlist) : undefined, [result.netlist])
  const lastIndex = Math.max(0, result.displayedPoints - 1)
  const [cursorIndex, setCursorIndex] = useState(lastIndex)
  const cursorX = x?.values[Math.min(cursorIndex, lastIndex)]
  const selectedUnit = selected?.type === 'current' ? 'A' : selected?.type === 'voltage' ? 'V' : ''
  const [cursorA, setCursorA] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState(0)

  useEffect(() => { setSelectedSeriesName(defaultSeries?.name ?? '') }, [seriesSignature])
  useEffect(() => { setCursorIndex(lastIndex); setCursorA(0); setZoom(1); setPosition(0); setComparisonName('') }, [lastIndex, seriesSignature])

  return <section className="spice-results" aria-labelledby="spice-results-heading">
    <div className="spice-results-heading"><div><p>KẾT QUẢ · NGSPICE WASM</p><h2 id="spice-results-heading">Mô phỏng hoàn tất</h2></div><button type="button" onClick={onDownload}>Tải CSV</button></div>
    <p className="spice-result-meta">Phân tích {result.analysis.toUpperCase()} · {result.numPoints.toLocaleString('vi-VN')} điểm solver · hiển thị {result.displayedPoints.toLocaleString('vi-VN')} điểm để giữ giao diện nhẹ.</p>
    {result.warnings.length > 0 && <details className="spice-warnings"><summary>{result.warnings.length} thông báo từ engine</summary><ul>{result.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></details>}
    {topology && topology.elements.length > 0 && <SpiceProbeMap topology={topology} series={result.series} index={Math.min(cursorIndex, lastIndex)} magnitudeOnly={result.dataType === 'complex'} selectedProbe={selected?.name ?? ''} onSelectProbe={name => { if (candidates.some(item => item.name === name)) setSelectedSeriesName(name) }} />}
    {x && lastIndex > 0 && <label className="spice-probe-cursor"><span>Thời điểm đo</span><input type="range" min={0} max={lastIndex} value={Math.min(cursorIndex, lastIndex)} onChange={event => setCursorIndex(Number(event.target.value))} aria-label={`Chọn điểm dữ liệu theo ${x.name}`} /><output>{formatEngineering(cursorX, x.type === 'time' ? 's' : x.type === 'frequency' ? 'Hz' : '')}</output></label>}
    {selected && <p className="spice-probe-readout" role="status" aria-live="polite"><span>Probe</span><strong>{selected.name}</strong><span>=</span><strong>{formatEngineering(probeValue(result.series, selected.name.toLowerCase(), Math.min(cursorIndex, lastIndex)), selectedUnit)}</strong>{x && <span>tại {formatEngineering(cursorX, x.type === 'time' ? 's' : x.type === 'frequency' ? 'Hz' : '')}</span>}<span>· số từ ngspice; dòng qua R/C/L/D đo bằng nguồn 0 V nối tiếp do Mạch Mở chèn. Mô phỏng, không phải phép đo thực.</span></p>}
    {x && candidates.length > 1 && <div className="spice-plot-series-picker"><label htmlFor="spice-plot-series">Tín hiệu trên đồ thị</label><select id="spice-plot-series" aria-label="Tín hiệu trên đồ thị" value={selected?.name ?? ''} onChange={event => setSelectedSeriesName(event.target.value)}>{candidates.map(series => <option key={series.name} value={series.name}>{series.name}{series.type !== 'notype' ? ` · ${series.type}` : ''}</option>)}</select></div>}
    {x && selected && lastIndex > 0 && <fieldset className="spice-chart-controls">
      <legend>Đồ thị SPICE · Con trỏ A/B</legend>
      {compatible.length > 0 && <label>Kênh so sánh cùng đơn vị<select value={comparison?.name ?? ''} onChange={event => setComparisonName(event.target.value)}><option value="">Một kênh</option>{compatible.map(series => <option key={series.name} value={series.name}>{series.name}</option>)}</select></label>}
      <label>Con trỏ A <input type="range" min={0} max={lastIndex} value={cursorA} onChange={event => setCursorA(event.target.valueAsNumber)} /></label>
      <label>Con trỏ B <input type="range" min={0} max={lastIndex} value={Math.min(cursorIndex, lastIndex)} onChange={event => setCursorIndex(event.target.valueAsNumber)} /></label>
      <label>Thu phóng đồ thị<select value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[1,2,4,8].map(value => <option key={value} value={value}>{value}×</option>)}</select></label>
      {zoom > 1 && <label>Vị trí cửa sổ<input type="range" min="0" max="1" step="0.01" value={position} onChange={event => setPosition(event.target.valueAsNumber)} /></label>}
      <div className="spice-chart-deltas" aria-label="Chênh lệch A/B">{(comparison ? [selected, comparison] : [selected]).map(series => {
        const result = measureAnalogCursors(x.values.map((time, index) => ({ time, value: series.values[index] })), cursorA, Math.min(cursorIndex, lastIndex), spiceUnit(x.type), spiceUnit(series.type))
        return result && <output key={series.name}>{series.name} · {formatAxisDeltaSymbol(x.type)} {formatEngineering(result.deltaTime, result.timeUnit)} · {series.type === 'voltage' ? 'ΔV' : series.type === 'current' ? 'ΔI' : 'Δ'} {formatEngineering(result.deltaValue, result.valueUnit)}</output>
      })}</div>
    </fieldset>}
    {x && selected && <SpicePlot x={x} y={selected} comparison={comparison} complex={result.dataType === 'complex'} cursors={[cursorA, Math.min(cursorIndex, lastIndex)]} zoom={zoom} position={position} />}
    {!x && <p className="spice-plot-note">Kết quả điểm làm việc/đường quét được trình bày dưới dạng bảng dữ liệu.</p>}
    <div className="spice-table-wrap" role="region" aria-label="Bảng mẫu kết quả mô phỏng" tabIndex={0}>
      <table><caption>Một số điểm lấy từ dữ liệu hiển thị</caption><thead><tr>{result.series.map(series => <th key={series.name} scope="col">{series.name}{series.type !== 'notype' ? ` · ${series.type}` : ''}</th>)}</tr></thead>
        <tbody>{indices.map(index => <tr key={index}>{result.series.map(series => <td key={series.name}>{compact(series.values[index] ?? Number.NaN)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>
}

export function SpiceWorkbenchPage() {
  const productRoute = useProductRoute()
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as { calculatorSpice?: unknown } | null
  const initialHandoff = readCalculatorSpiceHandoff(routeState?.calculatorSpice, location.search)
  const workspaceSpiceId = new URLSearchParams(location.search).get('workspaceSpice')
  const initialWorkspaceHandoff = readWorkspaceSpiceHandoff(getBrowserStorage('sessionStorage'), workspaceSpiceId)
  const [handoff, setHandoff] = useState<CalculatorSpiceHandoff | undefined>(initialHandoff)
  const [workspaceHandoff, setWorkspaceHandoff] = useState<WorkspaceSpiceHandoff | undefined>(initialWorkspaceHandoff)
  const [netlist, setNetlist] = useState<string>(initialHandoff?.netlist ?? initialWorkspaceHandoff?.netlist ?? examples[1].netlist)
  const [result, setResult] = useState<SpiceResult>()
  const [runState, setRunState] = useState<RunState>('idle')
  const [runProgress, setRunProgress] = useState('')
  const [error, setError] = useState('')
  const [workspaceResultSaved, setWorkspaceResultSaved] = useState(false)
  const [workspaceResultMessage, setWorkspaceResultMessage] = useState('')
  const [selectedExample, setSelectedExample] = useState<string>(initialHandoff || initialWorkspaceHandoff ? 'custom' : examples[1].id)
  const [dividerPrediction, setDividerPrediction] = useState<number | null>(null)
  const [kicadFileName, setKicadFileName] = useState('')
  const [kicadSource, setKicadSource] = useState('')
  const [kicadExclusions, setKicadExclusions] = useState<string[]>([])
  const [kicadMessage, setKicadMessage] = useState('')
  const workerRef = useRef<Worker | null>(null)
  const timeoutRef = useRef<number | undefined>(undefined)
  const currentRunIdRef = useRef('')
  const workspaceReturnUrl = workspaceHandoff ? new URL(workspaceHandoff.returnTo, window.location.origin) : null
  if (workspaceReturnUrl) {
    workspaceReturnUrl.searchParams.delete('workspaceSpiceResult')
    if (workspaceResultSaved && workspaceSpiceId) workspaceReturnUrl.searchParams.set('workspaceSpiceResult', workspaceSpiceId)
  }
  const inspection: SpiceNetlistInspection = useMemo(() => inspectSpiceNetlist(netlist), [netlist])
  const kicadResult: KicadSpiceImportResult | undefined = useMemo(
    () => kicadSource ? compileKicadXmlNetlist(kicadSource, kicadExclusions) : undefined,
    [kicadSource, kicadExclusions],
  )
  const cancelWorker = useCallback(() => {
    currentRunIdRef.current = ''
    if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = undefined
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  const resetSimulation = useCallback(() => {
    cancelWorker()
    setRunProgress('')
    setRunState('idle')
    setResult(undefined)
    setError('')
    setWorkspaceResultSaved(false)
    setWorkspaceResultMessage('')
    setDividerPrediction(null)
  }, [cancelWorker])

  useEffect(() => {
    const routeHandoff = readCalculatorSpiceHandoff((location.state as { calculatorSpice?: unknown } | null)?.calculatorSpice, location.search)
    const id = new URLSearchParams(location.search).get('workspaceSpice')
    const workspaceRouteHandoff = readWorkspaceSpiceHandoff(getBrowserStorage('sessionStorage'), id)
    if (!routeHandoff && !workspaceRouteHandoff) {
      setHandoff(undefined)
      setWorkspaceHandoff(undefined)
      if (id) {
        resetSimulation()
        setError('Bản chuyển mạch từ workspace không còn hợp lệ hoặc đã hết hạn. Đang dùng ví dụ SPICE; quay lại workspace để tạo bản mới.')
        setRunState('error')
        setSelectedExample(examples[1].id)
        setNetlist(examples[1].netlist)
      }
      return
    }
    resetSimulation()
    setHandoff(routeHandoff)
    setWorkspaceHandoff(workspaceRouteHandoff)
    setNetlist(routeHandoff?.netlist ?? workspaceRouteHandoff?.netlist ?? examples[1].netlist)
    setSelectedExample('custom')
  }, [location.key, location.state, location.search, resetSimulation])

  useEffect(() => cancelWorker, [cancelWorker])

  function stopSimulation() {
    cancelWorker()
    setRunProgress('')
    setRunState('idle')
    setError('Đã dừng mô phỏng.')
  }

  function updateWorkspaceAnalysis(result: WorkspaceSpiceAnalysisResult) {
    if (!result.ok) return
    resetSimulation()
    setNetlist(result.netlist)
  }

  function clearCalculatorHandoff() {
    if (!handoff) return
    setHandoff(undefined)
    const searchParams = new URLSearchParams(location.search)
    searchParams.delete('calculatorSpice')
    const search = searchParams.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true, state: null })
  }

  function clearWorkspaceHandoff() {
    if (!workspaceHandoff) return
    const id = new URLSearchParams(location.search).get('workspaceSpice')
    clearWorkspaceSpiceHandoff(getBrowserStorage('sessionStorage'), id)
    setWorkspaceHandoff(undefined)
    const searchParams = new URLSearchParams(location.search)
    searchParams.delete('workspaceSpice')
    const search = searchParams.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true, state: null })
  }

  function runSimulation(prediction: number | null = null) {
    resetSimulation()
    if (inspection.errors.length) {
      setError(inspection.errors.join(' '))
      setRunState('error')
      setResult(undefined)
      return
    }
    const runId = createSimulationRunId()
    currentRunIdRef.current = runId
    setDividerPrediction(prediction)
    setResult(undefined)
    setError('')
    setWorkspaceResultSaved(false)
    setWorkspaceResultMessage('')
    setRunState('running')
    setRunProgress('Đang khởi chạy worker…')

    let worker: Worker
    try {
      worker = new Worker(new URL('../simulation/spice.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      currentRunIdRef.current = ''
      setError('Trình duyệt không tạo được Web Worker cho SPICE.')
      setRunState('error')
      return
    }
    workerRef.current = worker
    timeoutRef.current = window.setTimeout(() => {
      if (!isCurrentSimulationRun(runId, currentRunIdRef.current)) return
      cancelWorker()
      setRunState('error')
      setError('Đã dừng vì solver vượt quá giới hạn 30 giây. Hãy giảm số linh kiện hoặc độ dài phân tích, rồi thử lại.')
    }, WORKER_TIMEOUT_MS)
    worker.onmessage = (event: MessageEvent<SpiceWorkerMessage>) => {
      if (!isCurrentSimulationRun(event.data.runId, currentRunIdRef.current)) return
      if (event.data.type === 'progress') {
        setRunProgress(event.data.message)
        return
      }
      cancelWorker()
      setRunProgress('')
      if (event.data.type === 'error') {
        setRunState('error')
        setError(event.data.message)
      } else {
        setResult({ ...event.data, netlist })
        setRunState('complete')
        if (workspaceHandoff && workspaceSpiceId) {
          const fingerprint = workspaceHandoff.workspaceFingerprint
          const saved = Boolean(fingerprint && storeWorkspaceSpiceObservation(getBrowserStorage('sessionStorage'), {
            handoffId: workspaceSpiceId,
            workspaceFingerprint: fingerprint,
            createdAt: Date.now(),
            analysis: event.data.analysis,
            dataType: event.data.dataType,
            numPoints: event.data.numPoints,
            displayedPoints: event.data.displayedPoints,
            series: event.data.series,
            warnings: event.data.warnings,
          }))
          setWorkspaceResultSaved(saved)
          setWorkspaceResultMessage(saved
            ? 'Kết quả đã lưu trong phiên tab, gắn với đúng revision workspace và sẽ hết hạn sau 30 phút.'
            : 'Không thể chuyển kết quả sang workspace (bản handoff cũ, hết quota hoặc dữ liệu vượt 1 MiB). Kết quả vẫn còn ở trang SPICE; bạn có thể tải CSV.')
        }
      }
    }
    worker.onerror = () => {
      if (!isCurrentSimulationRun(runId, currentRunIdRef.current)) return
      cancelWorker()
      setRunProgress('')
      setRunState('error')
      setError('Worker SPICE gặp lỗi khi nạp solver. Hãy tải lại trang rồi thử lại.')
    }
    worker.postMessage({ type: 'run', runId, netlist })
  }

  function selectExample(id: string) {
    const example = examples.find(item => item.id === id)
    if (!example && id !== 'custom') return
    resetSimulation()
    clearCalculatorHandoff()
    clearWorkspaceHandoff()
    setSelectedExample(id)
    if (example) setNetlist(example.netlist)
  }

  async function readKicadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (file.size > 1_000_000) {
      setKicadSource('')
      setKicadFileName('')
      setKicadMessage('Tệp netlist vượt giới hạn 1 MB; chưa thay đổi netlist đang soạn.')
      return
    }
    try {
      const source = await file.text()
      setKicadSource(source)
      setKicadFileName(file.name)
      setKicadExclusions([])
      setKicadMessage('Đã đọc XML. Xem danh sách phần tử và giả định trước khi đưa phần tương đương vào editor.')
    } catch {
      setKicadSource('')
      setKicadFileName('')
      setKicadMessage('Không đọc được tệp; netlist đang soạn được giữ nguyên.')
    }
  }

  function applyKicadNetlist() {
    if (!kicadResult?.ok) return
    resetSimulation()
    clearCalculatorHandoff()
    clearWorkspaceHandoff()
    setNetlist(kicadResult.netlist)
    setSelectedExample('custom')
    setKicadMessage('Đã đưa mạch tương đương từng phần vào editor. Đọc kỹ giả định và node nguồn trước khi chạy.')
  }

  function applyPcbKicadNetlist(importedNetlist: string) {
    resetSimulation()
    clearCalculatorHandoff()
    clearWorkspaceHandoff()
    setNetlist(importedNetlist)
    setSelectedExample('custom')
  }

  function dismissWorkspaceResultTransfer() {
    setWorkspaceResultSaved(false)
    setWorkspaceResultMessage('Kết quả SPICE vẫn nằm ở trang này; đã tắt đường chuyển kết quả về workspace.')
  }

  return <main className="spice-workbench-page">
    <header className="spice-workbench-hero">
      <p className="eyebrow"><span className="eyebrow-line" /> CÔNG CỤ · MÔ PHỎNG ĐIỆN SPICE</p>
      <h1>Thử mạch analog <span>trên solver thật.</span></h1>
      <p>Ngspice chạy bằng WebAssembly trong Web Worker. Netlist và kết quả được xử lý trong trình duyệt; không tải lên máy chủ.</p>
      <div className="spice-hero-actions"><Link to={productRoute('/build')}>Quay lại phòng thử <span aria-hidden="true">↗</span></Link><span>Ngspice WASM · chạy cục bộ</span></div>
    </header>

    <section className="spice-workbench-grid" aria-label="Trình soạn netlist và kết quả SPICE">
      <div className="spice-editor-card">
        <div className="spice-card-heading"><div><p>NETLIST · NGSPICE</p><h2>Thiết lập mạch</h2></div><span>tối đa 16 kB</span></div>
        <label className="spice-example-label" htmlFor="spice-example">Bắt đầu từ ví dụ</label>
        <select id="spice-example" value={selectedExample} onChange={event => selectExample(event.target.value)}>
          {examples.map(example => <option key={example.id} value={example.id}>{example.name}</option>)}
          <option value="custom">Netlist tùy chỉnh</option>
        </select>
        <p className="spice-example-description">{examples.find(item => item.id === selectedExample)?.description ?? (handoff ? 'Netlist được tạo từ các trị số bạn vừa tính.' : workspaceHandoff ? 'Netlist tương đương được biên dịch từ topology dây workspace.' : 'Đang chỉnh netlist tùy chỉnh.')}</p>
        {selectedExample === 'divider' && netlist === examples[0].netlist && <DividerPractice result={result} running={runState === 'running'} prediction={dividerPrediction} run={runSimulation} />}
        <section className="spice-kicad-import" aria-labelledby="spice-kicad-title">
          <div><p className="spice-kicad-kicker">TỪ SCHEMATIC CAD</p><h3 id="spice-kicad-title">Nhập netlist XML từ KiCad Eeschema</h3><p>Trình nhập chỉ ánh xạ R, C, L và nguồn V DC có trị số cố định; IC, MCU, diode, mạch tích hợp và phần tử khác cần bị loại trừ rõ ràng hoặc được tự dựng model trong netlist.</p></div>
          <label className="spice-kicad-file-label">Chọn netlist KiCad XML<input type="file" accept=".xml,application/xml,text/xml" onChange={event => void readKicadFile(event)} /></label>
          {kicadFileName && <p className="spice-kicad-filename">Tệp: <strong>{kicadFileName}</strong></p>}
          {kicadResult && !kicadResult.ok && kicadResult.unsupportedRefs && <fieldset className="spice-kicad-exclusions"><legend>Chọn rõ phần tử không mô phỏng trong mạch tương đương</legend>{kicadResult.unsupportedRefs.map(ref => <label key={ref}><input type="checkbox" checked={kicadExclusions.includes(ref)} onChange={event => setKicadExclusions(current => event.currentTarget.checked ? [...new Set([...current, ref])] : current.filter(item => item !== ref))} /> Loại {ref} khỏi mạch tương đương</label>)}</fieldset>}
          {kicadResult?.ok && <div className="spice-kicad-preview" role="status"><strong>Netlist từng phần sẵn sàng · {kicadResult.excludedRefs.length} phần tử bị loại</strong><ul>{kicadResult.assumptions.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>}
          {kicadResult && !kicadResult.ok && <p className="spice-kicad-error" role="alert">{kicadResult.issues.join(' ')}</p>}
          {kicadMessage && <p className="spice-kicad-status" role="status">{kicadMessage}</p>}
          <button className="spice-kicad-apply" type="button" disabled={!kicadResult?.ok} onClick={applyKicadNetlist}>Dùng netlist tương đương trong editor</button>
          <small>Không nhập project trực tiếp và không lấy đường đồng làm model điện. Xuất XML từ Eeschema trước; phần tử bị loại được xem như ranh giới hở. Luồng PCB bên dưới sẽ dùng IPC-D-356 cùng schematic XML để kiểm tra liên kết pad/net.</small>
        </section>
        <KicadPcbSpiceImport onApply={applyPcbKicadNetlist} />
        {workspaceHandoff && workspaceResultMessage && <p className="spice-workspace-return-status" role="status">{workspaceResultMessage}{workspaceResultSaved && <button type="button" onClick={dismissWorkspaceResultTransfer}>Hủy chuyển kết quả</button>}</p>}
        {handoff && selectedExample === 'custom' && <aside className="spice-calculator-handoff" aria-labelledby="spice-handoff-title"><div><strong id="spice-handoff-title">Netlist tương đương · {handoff.title}</strong><p>{handoff.assumption}</p><small>Đây là mạch tương đương theo giả định nêu trên; không chuyển dây canvas và không xác minh board thật.</small></div><Link to={productRoute(handoff.calculator === 'ldr-divider' ? handoff.returnTo ?? '/build?lesson=analog-ldr&guided=1' : '/tools/electronics-calculators')}>{handoff.calculator === 'ldr-divider' ? 'Quay lại bài LDR ↗' : 'Quay lại bộ tính ↗'}</Link></aside>}
        {workspaceHandoff && workspaceReturnUrl && selectedExample === 'custom' && <aside className="spice-calculator-handoff" aria-labelledby="workspace-spice-handoff-title"><div><strong id="workspace-spice-handoff-title">Mạch tương đương từ workspace · {workspaceHandoff.title}</strong><ul>{workspaceHandoff.assumptions.map((assumption, index) => <li key={`${index}-${assumption}`}>{assumption}</li>)}</ul>{workspaceHandoff.ignoredUnwiredParts.length > 0 && <p>Không đưa vào netlist vì chưa nối dây: {workspaceHandoff.ignoredUnwiredParts.length} linh kiện chưa nối dây; xem lại danh sách trong workspace.</p>}<small>Chỉ mô phỏng phần tử analog có model. Firmware, GPIO, board power circuitry và đường đồng PCB không được chuyển hoặc chạy trong SPICE.</small></div><Link to={productRoute(`${workspaceReturnUrl.pathname}${workspaceReturnUrl.search}${workspaceReturnUrl.hash}`)}>Quay lại workspace ↗</Link></aside>}
        {workspaceHandoff && selectedExample === 'custom' && <AnalysisPicker key={workspaceSpiceId ?? workspaceHandoff.createdAt} netlist={workspaceHandoff.netlist} onNetlistChange={updateWorkspaceAnalysis} />}
        <label className="spice-netlist-label" htmlFor="spice-netlist">Netlist SPICE</label>
        <textarea id="spice-netlist" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={netlist} aria-invalid={runState === 'error' && inspection.errors.length > 0 ? true : undefined} aria-describedby={runState === 'error' && inspection.errors.length ? 'spice-netlist-help spice-netlist-error' : 'spice-netlist-help'} onChange={event => { resetSimulation(); clearCalculatorHandoff(); clearWorkspaceHandoff(); setNetlist(event.target.value); setSelectedExample('custom') }} />
        <p id="spice-netlist-help" className="spice-netlist-help">Hỗ trợ R, C, L, V, I, diode, BJT, MOSFET; phân tích .op, .tran, .ac, .dc; diode/BJT/MOSFET cần .model khai báo trong netlist. Lần đầu tải engine WASM khoảng 6,1 MB; trạng thái khởi tạo hiển thị ở đây và có thể dừng bất cứ lúc nào.</p>
        {runState === 'error' && error && <p className="spice-error" id="spice-netlist-error" role="alert">{error}</p>}
        {runState === 'idle' && error && <p className="spice-stop-note" role="status">{error}</p>}
        {selectedExample === 'divider' && netlist === examples[0].netlist && <p className="spice-netlist-help">“Chạy SPICE” mở kết quả solver trực tiếp. Để so sánh với dự đoán, dùng bài đo điện áp ở trên.</p>}
        <div className="spice-run-actions"><button className="spice-run-button" type="button" onClick={() => runSimulation()} disabled={runState === 'running'}>Chạy SPICE</button>{runState === 'running' && <button type="button" onClick={stopSimulation}>Dừng solver</button>}<span role="status" aria-live="polite">{runState === 'running' ? runProgress : runState === 'complete' ? 'Mô phỏng hoàn tất.' : ''}</span></div>
        <p className="spice-budget">{inspection.elementCount} linh kiện · giới hạn phân tích {inspection.maxAnalysisPoints.toLocaleString('vi-VN')} điểm · tự ngắt sau 30 giây.</p>
      </div>
      <div className="spice-output-card">
        {result ? <Results result={result} onDownload={() => downloadCsv(result)} /> : <div className="spice-empty-results" role="status"><span aria-hidden="true">∿</span><h2>{runState === 'running' ? 'Đang tính mạch' : 'Kết quả sẽ hiện ở đây'}</h2><p>Chạy một ví dụ để xem điểm làm việc hoặc đồ thị thời gian/tần số. Có thể dừng solver bất cứ lúc nào.</p></div>}
      </div>
    </section>

    <section className="spice-scope-note" aria-labelledby="spice-scope-title">
      <strong id="spice-scope-title">Phạm vi và giới hạn</strong>
      <p>Đây là mô phỏng SPICE của mạch analog theo các model bạn khai báo, không thực thi firmware MCU và không tự chuyển board/breadboard thành netlist. Không hỗ trợ lệnh .include, .control, truy cập file hoặc mọi model/vendor. Kết quả phụ thuộc model, điều kiện đầu và hội tụ; đối chiếu datasheet và đo kiểm trước khi dùng phần cứng.</p>
    </section>
  </main>
}
