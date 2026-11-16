import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { DigitalWaveform } from '../builder/DigitalWaveform'
import { buildPicoBlinkDemoImage, parseUf2, type Rp2040Snapshot } from '../../lib/rp2040Runner'
import type { Rp2040WorkerResponse } from '../../workers/rp2040.worker'

/** Chạy firmware Raspberry Pi Pico thật (rp2040js) trong Web Worker; quan sát GPIO và UART0. */
export function Rp2040FirmwarePanel() {
  const [image, setImage] = useState<Uint8Array>()
  const [source, setSource] = useState('')
  const [frame, setFrame] = useState<Rp2040Snapshot>()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const workerRef = useRef<Worker | null>(null)
  const runIdRef = useRef('')

  useEffect(() => () => workerRef.current?.terminate(), [])

  function reset(next?: Uint8Array, label = '') {
    workerRef.current?.terminate()
    workerRef.current = null
    setRunning(false)
    setFrame(undefined)
    setError('')
    setImage(next)
    setSource(label)
  }

  async function readUf2(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error('Tệp UF2 tối đa 4 MB.')
      reset(parseUf2(new Uint8Array(await file.arrayBuffer())), file.name)
    } catch (caught) {
      reset()
      setError(caught instanceof Error ? caught.message : 'Không đọc được UF2.')
    }
  }

  function run() {
    if (!image) return
    workerRef.current?.terminate()
    let worker: Worker
    try {
      worker = new Worker(new URL('../../workers/rp2040.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      setError('Trình duyệt không hỗ trợ Web Worker cho rp2040js.')
      return
    }
    workerRef.current = worker
    const runId = `pico-${Date.now()}`
    runIdRef.current = runId
    setRunning(true)
    setError('')
    worker.onmessage = (event: MessageEvent<Rp2040WorkerResponse>) => {
      if (event.data.runId !== runIdRef.current) return
      if (event.data.type === 'frame' || event.data.type === 'complete') setFrame(event.data.frame)
      if (event.data.type === 'error') setError(event.data.message)
      if (event.data.type !== 'frame') { setRunning(false); worker.terminate(); workerRef.current = null }
    }
    worker.onerror = () => { setRunning(false); setError('Worker RP2040 gặp lỗi.') }
    worker.postMessage({ type: 'start', runId, image: image.slice() })
  }

  function stop() {
    workerRef.current?.postMessage({ type: 'stop', runId: runIdRef.current })
  }

  const channels = frame ? Object.entries(frame.channels).filter(([, events]) => events.length > 0).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })) : []

  return <section className="firmware-tool-panel rp2040-panel" aria-labelledby="rp2040-panel-title">
    <p className="eyebrow">THỬ NGHIỆM FIRMWARE · RP2040JS</p>
    <h2 id="rp2040-panel-title">Raspberry Pi Pico · RP2040</h2>
    <p>CPU Cortex-M0+ của RP2040 được giả lập bằng rp2040js trong Web Worker, tối đa 1 giây mô phỏng ở 125 MHz. Quan sát GPIO 0–29 và UART0.</p>
    <div className="rp2040-actions">
      <label className="rp2040-file"><span>Chọn tệp .uf2</span><input type="file" accept=".uf2,application/octet-stream" onChange={readUf2} disabled={running} /></label>
      <button type="button" onClick={() => reset(buildPicoBlinkDemoImage(), 'pico-blink-gp25 (Mạch Mở lắp ráp)')} disabled={running}>Nạp firmware Pico mẫu · nháy GP25</button>
      <button type="button" className="rp2040-run" onClick={running ? stop : run} disabled={!image && !running}>{running ? 'Dừng' : 'Chạy trên RP2040'}</button>
    </div>
    {source && <p className="rp2040-source">Firmware: <strong>{source}</strong></p>}
    <p className="rp2040-note">Firmware dùng Pico SDK/Arduino-Pico gọi hàm trong bootrom RP2040. Bản này chưa nạp bootrom nên các UF2 đó có thể dừng sớm; firmware mẫu tự lắp ráp không cần bootrom.</p>
    {error && <p className="simulation-instrument-error" role="alert">{error}</p>}
    {frame && <>
      <div className="simulation-avr-state" role="status"><strong>GP25 (LED trên board) · {frame.led25 === 'on' ? 'HIGH · LED bật' : frame.led25 === 'off' ? 'LOW · LED tắt' : 'INPUT · chưa cấu hình output'}</strong><span>{frame.simulatedMilliseconds.toFixed(2)} ms mô phỏng · {frame.cycles.toLocaleString('vi-VN')} chu kỳ</span></div>
      {channels.length > 0
        ? <section className="simulation-logic-analyzer" aria-label="Logic analyzer RP2040"><strong>Logic analyzer · {channels.length} kênh GPIO</strong>{channels.map(([name, events]) => <DigitalWaveform key={name} events={events} simulatedMilliseconds={frame.simulatedMilliseconds} signalName={`${name} · Raspberry Pi Pico`} truncated={frame.channelsTruncated} engineLabel="rp2040js (125 MHz)" maxEvents={2048} />)}</section>
        : <p className="rp2040-note">Chưa có GPIO nào đổi mức trong khoảng chạy này.</p>}
      <div className="firmware-serial"><strong>UART0</strong><pre aria-label="Dữ liệu UART0 do rp2040js phát ra">{frame.serialText || 'Chưa có dữ liệu UART trong khoảng chạy này.'}</pre></div>
    </>}
    <p className="firmware-tool-disclaimer">Đây là giả lập CPU và ngoại vi số, không phải phép đo trên board thật và không mô phỏng điện áp/dòng.</p>
  </section>
}
