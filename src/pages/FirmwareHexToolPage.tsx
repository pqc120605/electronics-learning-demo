import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { createFirmwareLoadGuard, fetchFirmwareText, downloadFirmwareTrace } from '../lib/firmwareWorkflow'
import { inspectIntelHex, type IntelHexImage } from '../lib/intelHex'
import { atmega328pFirmwareTargets, canRunAtmega328pFirmware, getAtmega328pFirmwareTarget, type Atmega328pBoardId } from '../lib/firmwareTarget'
import type { Atmega328pSnapshot } from '../lib/avr8jsRunner'
import { DigitalWaveform } from '../components/builder/DigitalWaveform'
import { createSimulationRunId, isCurrentSimulationRun } from '../lib/workspaceSimulationSession'
import type { AVR8jsWorkerResponse } from '../simulation/avr8jsProtocol'
import { useProductRoute } from '../lib/useProductRoute'
import './FirmwareHexToolPage.css'

function addressLabel(address: number) {
  return `0x${address.toString(16).toUpperCase().padStart(8, '0')}`
}

export function FirmwareHexToolPage() {
  const productRoute = useProductRoute()
  const [image, setImage] = useState<IntelHexImage>()
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [hexSource, setHexSource] = useState('')
  const [avrFrame, setAvrFrame] = useState<Atmega328pSnapshot>()
  const [avrRunning, setAvrRunning] = useState(false)
  const [avrError, setAvrError] = useState('')
  const [targetId, setTargetId] = useState<Atmega328pBoardId>('arduino-uno-r3')
  const [targetConfirmed, setTargetConfirmed] = useState(false)
  const loadGuard = useRef(createFirmwareLoadGuard())
  const [loading, setLoading] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const currentRunIdRef = useRef('')
  const timeoutRef = useRef<number | undefined>(undefined)
  const target = getAtmega328pFirmwareTarget(targetId)

  useEffect(() => () => {
    loadGuard.current.cancel()
    currentRunIdRef.current = ''
    workerRef.current?.terminate()
    if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current)
  }, [])

  async function inspectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    const request = loadGuard.current.start()
    stopAvrSpike()
    setLoading(false)
    setImage(undefined)
    setError('')
    setHexSource('')
    setAvrFrame(undefined)
    setAvrRunning(false)
    setAvrError('')
    setTargetConfirmed(false)
    setFileName(file?.name ?? '')
    if (!file) return
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Tệp vượt giới hạn 2 MB.')
      setLoading(true)
      const source = await file.text()
      if (!request.isCurrent()) return
      const parsed = inspectIntelHex(source)
      setHexSource(source)
      setImage(parsed)
    } catch (caught) {
      if (request.isCurrent()) setError(caught instanceof Error ? caught.message : 'Không đọc được tệp Intel HEX.')
    } finally { if (request.isCurrent()) setLoading(false) }
  }

  function clear() {
    loadGuard.current.cancel()
    stopAvrSpike()
    setLoading(false)
    setImage(undefined)
    setFileName('')
    setError('')
    setHexSource('')
    setAvrFrame(undefined)
    setAvrRunning(false)
    setAvrError('')
    setTargetConfirmed(false)
    const input = document.getElementById('firmware-hex-file') as HTMLInputElement | null
    if (input) input.value = ''
  }

  async function loadFirmwareSample(path: string, sampleName: string) {
    const request = loadGuard.current.start()
    stopAvrSpike()
    setFileName('')
    setLoading(true)
    const input = document.getElementById('firmware-hex-file') as HTMLInputElement | null
    if (input) input.value = ''
    setImage(undefined)
    setError('')
    setHexSource('')
    setAvrFrame(undefined)
    setAvrRunning(false)
    setAvrError('')
    setTargetConfirmed(false)
    try {
      const source = await fetchFirmwareText(path, request.signal)
      if (!request.isCurrent()) return
      const parsed = inspectIntelHex(source)
      setFileName(sampleName)
      setHexSource(source)
      setImage(parsed)
    } catch (caught) {
      if (request.isCurrent()) setError(caught instanceof Error ? caught.message : 'Không nạp được firmware mẫu.')
    } finally { if (request.isCurrent()) setLoading(false) }
  }

  function loadBlinkFirmware() {
    return loadFirmwareSample('/firmware/atmega328p-d13-blink.hex', 'atmega328p-d13-blink.hex')
  }

  function loadArduinoBlinkFirmware() {
    return loadFirmwareSample('/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex', 'arduino-uno-d13-blink.hex · Arduino IDE')
  }

  function runAvrSpike() {
    if (!hexSource || !canRunAtmega328pFirmware(targetId, targetConfirmed)) return
    workerRef.current?.terminate()
    if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current)
    const runId = createSimulationRunId()
    currentRunIdRef.current = runId
    setAvrFrame(undefined)
    setAvrError('')
    setAvrRunning(true)
    let worker: Worker
    try {
      worker = new Worker(new URL('../workers/avr8js.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      setAvrError('Trình duyệt không hỗ trợ khởi chạy Web Worker cho AVR8js.')
      setAvrRunning(false)
      return
    }
    workerRef.current = worker
    timeoutRef.current = window.setTimeout(() => {
      if (!isCurrentSimulationRun(runId, currentRunIdRef.current)) return
      worker.terminate()
      if (workerRef.current === worker) workerRef.current = null
      currentRunIdRef.current = ''
      setAvrError('AVR8js vượt quá giới hạn 30 giây và đã được dừng an toàn.')
      setAvrRunning(false)
    }, 30_000)
    worker.onmessage = (event: MessageEvent<AVR8jsWorkerResponse>) => {
      if (!isCurrentSimulationRun(event.data.runId, currentRunIdRef.current)) return
      if ('frame' in event.data) setAvrFrame(event.data.frame)
      if (event.data.type === 'error') setAvrError(event.data.message)
      if (event.data.type === 'complete' || event.data.type === 'error' || event.data.type === 'stopped') {
        setAvrRunning(false)
        if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current)
        currentRunIdRef.current = ''
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
      }
    }
    worker.onerror = () => {
      if (!isCurrentSimulationRun(runId, currentRunIdRef.current)) return
      setAvrError('Worker AVR gặp lỗi. Hãy kiểm tra firmware và thử lại.')
      setAvrRunning(false)
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current)
      currentRunIdRef.current = ''
      worker.terminate()
      if (workerRef.current === worker) workerRef.current = null
    }
    worker.postMessage({ type: 'start', runId, hex: hexSource, targetId })
  }

  function stopAvrSpike() {
    const worker = workerRef.current
    const runId = currentRunIdRef.current
    if (worker && runId) { try { worker.postMessage({ type: 'stop', runId }) } catch { /* already terminated */ } }
    worker?.terminate()
    workerRef.current = null
    currentRunIdRef.current = ''
    if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = undefined
    setAvrRunning(false)
  }

  return (
    <div className="firmware-tool-page">
      <header className="firmware-tool-hero">
        <p className="eyebrow"><span className="eyebrow-line" /> CÔNG CỤ BỔ TRỢ · FIRMWARE</p>
        <h1>Kiểm tra tệp Intel HEX</h1>
        <p>Chọn firmware đã biên dịch để kiểm tra cấu trúc, checksum, vùng địa chỉ và dung lượng trước khi dùng với simulator tương thích.</p>
        <Link to={productRoute('/build')}>Quay lại bàn lắp mạch <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="firmware-tool-card" aria-labelledby="firmware-tool-upload-title">
        <div className="firmware-tool-card-heading">
          <span className="firmware-tool-icon" aria-hidden="true">HEX</span>
          <div>
            <h2 id="firmware-tool-upload-title">Chọn firmware</h2>
            <p>Tệp được đọc ngay trong trình duyệt; nội dung không tải lên máy chủ.</p>
          </div>
        </div>
        <label className="firmware-tool-file" htmlFor="firmware-hex-file">
          <span>Chọn tệp .hex</span>
          <small>{fileName || 'Hỗ trợ .hex, .ihx, .ihex · tối đa 2 MB'}</small>
          <input id="firmware-hex-file" type="file" accept=".hex,.ihx,.ihex,text/plain" onChange={inspectFile} />
        </label>
        <div className="firmware-tool-sample-actions">
          <button className="firmware-tool-fixture" type="button" onClick={loadBlinkFirmware}>Nạp firmware LED nhấp nháy mẫu</button>
          <button className="firmware-tool-fixture" type="button" onClick={loadArduinoBlinkFirmware}>Nạp HEX biên dịch từ Arduino IDE</button>
          <a href="/firmware/atmega328p-d13-blink.hex" download="atmega328p-d13-blink.hex">Tải file .hex</a>
          <a href="/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex" download="arduino-uno-d13-blink.hex">Tải HEX Arduino Uno</a>
          <a href="/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.ino" download="arduino-uno-d13-blink.ino">Tải sketch .ino cho Arduino IDE</a>
        </div>
        {loading && <p role="status">Đang đọc firmware…</p>}
        {loading && <button type="button" onClick={clear}>Hủy tải firmware</button>}
        {error && <p className="firmware-tool-error" role="alert"><strong>Tệp chưa hợp lệ</strong>{error}</p>}
        {avrFrame && !avrRunning && avrFrame.pinTransitionEvents.length > 0 && <button type="button" className="firmware-tool-fixture" onClick={() => downloadFirmwareTrace(avrFrame)}>Tải trace D13 · CSV</button>}
        {image && (
          <div className="firmware-tool-result" role="status" aria-live="polite">
            <div className="firmware-tool-result-heading">
              <div><span className="firmware-tool-valid-dot" /> Cấu trúc hợp lệ</div>
              <button type="button" onClick={clear}>Xóa kết quả</button>
            </div>
            <dl className="firmware-tool-stats">
              <div><dt>Dữ liệu</dt><dd>{image.byteLength.toLocaleString('vi-VN')} byte</dd></div>
              <div><dt>Bản ghi</dt><dd>{image.recordCount}</dd></div>
              <div><dt>Địa chỉ bắt đầu</dt><dd>{image.entryAddress === undefined ? 'Không khai báo' : addressLabel(image.entryAddress)}</dd></div>
            </dl>
            <h3>Các vùng địa chỉ</h3>
            <ul className="firmware-tool-segments">
              {image.segments.map((segment) => (
                <li key={segment.address}>
                  <code>{addressLabel(segment.address)} – {addressLabel(segment.address + segment.data.length - 1)}</code>
                  <span>{segment.data.length.toLocaleString('vi-VN')} byte</span>
                </li>
              ))}
            </ul>
            <div className="firmware-avr-runner">
              <div>
                <strong>Thử nghiệm firmware · AVR8js</strong>
                <small>{target?.name ?? 'Chọn board hỗ trợ'} · ATmega328P · tối đa 1 giây mô phỏng ở 16 MHz</small>
              </div>
              <label className="firmware-target-select">
                <span>Chọn board đích</span>
                <select value={targetId} disabled={avrRunning} onChange={(event) => {
                  loadGuard.current.cancel();setLoading(false);stopAvrSpike()
                  setTargetId(event.currentTarget.value as Atmega328pBoardId)
                  setTargetConfirmed(false)
                  setAvrFrame(undefined)
                  setAvrError('')
                }}>
                  {atmega328pFirmwareTargets.map((item) => <option key={item.boardId} value={item.boardId}>{item.name} · {item.mcu}</option>)}
                </select>
                {target && <a className="firmware-target-source" href={target.referenceUrl} target="_blank" rel="noreferrer">Tài liệu board và pinout chính hãng ↗</a>}
              </label>
              <label className="firmware-target-confirmation">
                <input type="checkbox" checked={targetConfirmed} disabled={avrRunning} onChange={(event) => setTargetConfirmed(event.currentTarget.checked)} />
                <span>Tôi xác nhận HEX được biên dịch cho ATmega328P trên {target?.name ?? 'board đã chọn'}. Intel HEX không tự khai báo hoặc xác minh MCU đích.</span>
              </label>
              <button type="button" onClick={avrRunning ? stopAvrSpike : runAvrSpike} disabled={!avrRunning && !canRunAtmega328pFirmware(targetId, targetConfirmed)}>
                {avrRunning ? 'Dừng' : 'Chạy thử'}
              </button>
            </div>
            {avrError && <p className="firmware-tool-error" role="alert">{avrError}</p>}
            {avrFrame && (
              <div className="firmware-avr-frame" role="status" aria-live="polite">
                <strong>{target?.d13Alias ?? 'D13'}: {avrFrame.led13 === 'on' ? 'HIGH · LED bật' : avrFrame.led13 === 'off' ? 'LOW · LED tắt' : 'INPUT · chưa cấu hình output'}</strong>
                <span>{avrFrame.simulatedMilliseconds.toFixed(1)} ms mô phỏng · {avrFrame.cycles.toLocaleString('vi-VN')} chu kỳ</span>
                {avrFrame.traceTruncated && <small>Trace đã đạt giới hạn lưu 128 lần chuyển mức.</small>}
              </div>
            )}
            {avrFrame && <DigitalWaveform events={avrFrame.pinTransitionEvents} simulatedMilliseconds={avrFrame.simulatedMilliseconds} signalName={`${target?.d13Alias ?? 'D13'} / PB5 · ${target?.name ?? 'ATmega328P'}`} variant="light" truncated={avrFrame.traceTruncated}/>}
            {avrFrame && <section className="firmware-serial-monitor" aria-labelledby="firmware-serial-title">
              <strong id="firmware-serial-title">Serial Monitor · UART0</strong>
              <pre aria-label="Dữ liệu UART0 do AVR8js phát ra">{avrFrame.serialText || 'Chưa có dữ liệu UART trong khoảng chạy này.'}</pre>
              <small>{avrFrame.serialByteCount.toLocaleString('vi-VN')} byte{avrFrame.serialTruncated ? ' · đã chạm giới hạn lưu 4.096 byte' : ''}</small>
            </section>}
            <p className="firmware-tool-disclaimer">Intel HEX được kiểm tra cú pháp; CPU AVR8js chạy trong Web Worker và chỉ quan sát GPIO D13 cùng một số ngoại vi cơ bản. Firmware phải được biên dịch cho ATmega328P. Đây chưa phải mô phỏng mạch điện, không xác minh đúng MCU từ nội dung HEX và không nạp lên board thật.</p>
          </div>
        )}
      </section>
      <section className="firmware-tool-note">
        <strong>Phân biệt hai tệp mẫu</strong>
        <p>Trang có hai HEX mẫu cho ATmega328P: một bản assembly bare-metal và một bản biên dịch từ sketch Arduino Uno bằng Arduino IDE 2.3.10, Arduino AVR Boards 1.8.8 (arduino:avr:uno). Chọn Uno R3 hoặc Nano classic để chạy cùng core ATmega328P 16 MHz và quan sát D13/PB5. Đây không phải bằng chứng mô phỏng đầy đủ firmware hoặc mạch điện; các board khác chưa chạy firmware trong công cụ này.</p>
      </section>
    </div>
  )
}
