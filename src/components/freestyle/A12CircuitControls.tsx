import { useEffect, useRef, useState } from 'react'
import { a12DcNetlist, validateA12Circuit } from '../../lib/freestyle/a12Fixture'
import type { A12Board } from '../../lib/freestyle/a12Profiles'
import { a12Runtime as runtime } from '../../lib/freestyle/a12Runtime'
import type { A2Sample } from '../../lib/freestyle/a2C3Runtime'
import type { PinMap } from '../../lib/freestyle/freestyleBoards'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'

type Reading = { input: number; led: number; currentMa: number }
type SpiceResponse = { type: 'progress' } | { type: 'error'; message: string }
  | { type: 'result'; series: { name: string; values: number[] }[] }
type Session = {
  doc: CircuitDocV2
  pinMap: PinMap
  cancel: AbortController
  id?: string
  requestedPressed: boolean
  pending: Promise<void>
  sequence: number
  pressedAt?: number
  pressTimer?: number
  expiry?: number
}

export default function A12CircuitControls({ doc, pinMap, board }: { doc: CircuitDocV2; pinMap: PinMap; board: A12Board }) {
  const [pressed, setPressed] = useState(false)
  const [result, setResult] = useState<{ doc: CircuitDocV2; pinMap: PinMap; reading: Reading }>()
  const [status, setStatus] = useState('')
  const [firmwareError, setFirmwareError] = useState('')
  const [running, setRunning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState<{ owner: Session; sample: A2Sample; serial: string }>()
  const session = useRef<Session | undefined>(undefined)
  const active = useRef<{ worker: Worker; timer: number } | undefined>(undefined)
  const issues = validateA12Circuit(doc, board.id, pinMap)
  const reading = result?.doc === doc && result.pinMap === pinMap && !issues.length ? result.reading : undefined
  const firmware = live?.owner.doc === doc && live.owner.pinMap === pinMap && !issues.length ? live : undefined

  function cancelMeasurement() {
    if (!active.current) return
    window.clearTimeout(active.current.timer)
    active.current.worker.terminate()
    active.current = undefined
  }

  function retire() {
    const previous = session.current
    session.current = undefined
    window.clearTimeout(previous?.pressTimer)
    window.clearTimeout(previous?.expiry)
    previous?.cancel.abort()
    if (previous?.id) void runtime.stop(previous.id)
  }

  useEffect(() => {
    setStatus('')
    setResult(undefined)
    setRunning(false)
    setBusy(false)
    setLive(undefined)
    setFirmwareError('')
    const hide = () => stopFirmware()
    window.addEventListener('pagehide', hide)
    return () => {
      window.removeEventListener('pagehide', hide)
      retire()
      cancelMeasurement()
    }
  }, [doc, pinMap, board])

  function stopFirmware() {
    retire()
    cancelMeasurement()
    setRunning(false)
    setBusy(false)
    setLive(undefined)
    setStatus('')
    setResult(undefined)
  }

  async function startFirmware() {
    if (issues.length || session.current) return
    cancelMeasurement()
    setResult(undefined)
    setStatus('')
    setFirmwareError('')
    setRunning(true)
    setBusy(true)
    const opening: Session = { doc, pinMap, cancel: new AbortController(), requestedPressed: false, pending: Promise.resolve(), sequence: 0 }
    session.current = opening
    try {
      const boot = await runtime.start({ id: board.id, readyLine: board.firmware.readyLine },
        AbortSignal.any([opening.cancel.signal, AbortSignal.timeout(runtime.limits.startupWallMs)]))
      if (session.current !== opening) {
        void runtime.stop(boot.id)
        return
      }
      opening.id = boot.id
      opening.expiry = window.setTimeout(() => {
        if (session.current !== opening) return
        stopFirmware()
        setFirmwareError('Phiên firmware A12 đã hết thời gian. Hãy chạy lại.')
      }, runtime.limits.runWallMs)
      setLive({ owner: opening, sample: boot.sample, serial: boot.serial })
      measure(boot.sample)
    } catch (error) {
      if (session.current !== opening) return
      stopFirmware()
      setFirmwareError(error instanceof Error ? error.message : 'Không mở được firmware A12.')
    } finally {
      if (session.current === opening) setBusy(false)
    }
  }

  function driveButton(value: boolean) {
    const current = session.current
    const id = current?.id
    if (!current || !id || current.requestedPressed === value) return
    current.requestedPressed = value
    if (value) {
      current.pressedAt = performance.now()
      current.pressTimer = window.setTimeout(() => {
        current.pressTimer = undefined
        if (session.current === current && current.requestedPressed) runButtonStep(current, id, true, 65)
      }, 65)
      return
    }
    if (current.pressTimer !== undefined) {
      window.clearTimeout(current.pressTimer)
      current.pressTimer = undefined
      const hold = Math.round(performance.now() - (current.pressedAt ?? performance.now()))
      runButtonStep(current, id, true, Math.max(1, Math.min(65, hold)))
    }
    runButtonStep(current, id, false, 90)
  }

  function runButtonStep(current: Session, id: string, pressed: boolean, milliseconds: number) {
    const sequence = ++current.sequence
    cancelMeasurement()
    setResult(undefined)
    setStatus('')
    setBusy(true)
    current.pending = current.pending.then(async () => {
      if (session.current !== current) return
      const signal = AbortSignal.any([current.cancel.signal, AbortSignal.timeout(15_000)])
      const frame = await runtime.step(id, pressed, signal, milliseconds)
      if (session.current !== current || sequence !== current.sequence) return
      setLive({ owner: current, sample: frame.sample, serial: frame.serial })
      setBusy(false)
      measure(frame.sample)
    }).catch(() => {
      if (session.current !== current) return
      stopFirmware()
      setFirmwareError('Phiên firmware A12 đã dừng. Hãy chạy lại.')
    })
  }

  function measure(sample = firmware?.sample) {
    if (issues.length) return
    cancelMeasurement()
    setResult(undefined)
    setStatus('Đang giải điểm làm việc DC…')
    try {
      const worker = new Worker(new URL('../../simulation/spice.worker.ts', import.meta.url), { type: 'module' })
      const finish = (message: string) => {
        if (active.current?.worker !== worker) return
        cancelMeasurement()
        setStatus(message)
      }
      const timer = window.setTimeout(() => finish('ngspice vượt 30 giây.'), 30_000)
      active.current = { worker, timer }
      worker.onerror = () => finish('Không mở được ngspice WASM.')
      worker.onmessage = ({ data }: MessageEvent<SpiceResponse>) => {
        if (active.current?.worker !== worker || data.type === 'progress') return
        if (data.type === 'error') return finish(data.message)
        const value = (name: string) => data.series.find(series => series.name.toLowerCase() === name)?.values[0]
        const input = value('v(gpio' + board.button.gpio + ')')
        const led = value('v(anode)')
        const current = value('i(vout)')
        if (input === undefined || led === undefined || current === undefined) return finish('ngspice chưa trả đủ kênh đo.')
        setResult({ doc, pinMap, reading: { input, led, currentMa: Math.max(0, -1000 * current) } })
        finish('')
      }
      worker.postMessage({ type: 'run', runId: 'A12-dc',
        netlist: sample ? a12DcNetlist(board, !sample.inputHigh, sample.outputHigh) : a12DcNetlist(board, pressed, pressed) })
    } catch {
      cancelMeasurement()
      setStatus('Không khởi tạo được ngspice WASM.')
    }
  }

  return <section className="freestyle-card" aria-label={'Mạch nút nhấn và LED ' + board.name + ' A12'}>
    <h3>{board.name} · Nút nhấn và LED</h3>
    <p>{board.button.label} ({board.button.pad}) · {board.led.label} ({board.led.pad}) · nguồn {board.power.label}.</p>
    <p aria-label="Nguồn trạng thái">{firmware ? 'GPIO từ firmware · điểm làm việc DC' : 'Đặt bằng tay · điểm làm việc DC'}</p>
    {issues.length > 0 && <ul aria-label="Kiểm tra mạch A12">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
    <div className="freestyle-work-actions">
      {running
        ? <button className="freestyle-button" type="button" onClick={stopFirmware}>Dừng firmware A12</button>
        : <button className="freestyle-button" type="button" disabled={issues.length > 0}
          onClick={() => void startFirmware()}>Chạy firmware A12</button>}
      {firmware && <button className="freestyle-button" type="button" aria-pressed={!firmware.sample.inputHigh}
        onPointerDown={event => {
          if (event.button !== 0) return
          event.currentTarget.setPointerCapture(event.pointerId)
          driveButton(true)
        }} onLostPointerCapture={() => driveButton(false)} onPointerUp={() => driveButton(false)}
        onPointerCancel={() => driveButton(false)} onBlur={() => driveButton(false)}
        onKeyDown={event => {
          if (event.key !== ' ' && event.key !== 'Enter') return
          event.preventDefault()
          driveButton(true)
        }} onKeyUp={event => {
          if (event.key !== ' ' && event.key !== 'Enter') return
          event.preventDefault()
          driveButton(false)
        }}>Giữ nút nhấn A12</button>}
      {!running && <label>Trạng thái đo DC <select value={pressed ? 'pressed' : 'released'} onChange={event => {
        cancelMeasurement()
        setResult(undefined)
        setStatus('')
        setPressed(event.target.value === 'pressed')
      }}>
        <option value="released">Nút nhả · ngõ ra LOW</option>
        <option value="pressed">Nút giữ · ngõ ra HIGH</option>
      </select></label>}
      <button className="freestyle-button" type="button" disabled={issues.length > 0 || busy}
        onClick={() => measure()}>Đo DC bằng ngspice</button>
    </div>
    {busy && <p role="status">{firmware ? 'Đang chạy bước mô phỏng…' : 'Đang khởi động firmware A12…'}</p>}
    {firmwareError && <p role="alert">{firmwareError}</p>}
    {firmware && <>
      <p aria-label="GPIO firmware A12">
        {board.button.label} {firmware.sample.inputHigh ? 'HIGH' : 'LOW'} · {board.led.label} {firmware.sample.outputHigh ? 'HIGH' : 'LOW'}
        {' · '}{firmware.sample.outputHigh ? 'LED sáng' : 'LED tắt'}
      </p>
      <pre aria-label="UART firmware A12">{firmware.serial}</pre>
    </>}
    {status && <p role="status">{status}</p>}
    {reading && <p aria-label="Kết quả ngspice A12">{board.button.label} {reading.input.toFixed(4)} V · LED {reading.led.toFixed(3)} V · I LED {reading.currentMa.toFixed(3)} mA</p>}
  </section>
}
