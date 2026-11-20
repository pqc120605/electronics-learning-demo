import { useEffect, useRef, useState } from 'react'
import { arduinoSourceFile } from '../../lib/arduinoSketchExport'
import { downloadBlob } from '../../lib/communityAttachments'
import { loadPinnedFirmware, releasedEsp32Firmware, type Esp32Board, type VerifiedFirmware } from '../../lib/esp32Firmware'
import { createEsp32Driver, flashVerifiedEsp32, getWebSerial, monitorSerial } from '../../lib/esp32WebSerial'

type Props = { board: Esp32Board; lesson?: string; code: string; onClose: () => void }

export function Esp32UsbDialog({board, lesson, code, onClose}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const flash = useRef<AbortController | undefined>(undefined)
  const monitor = useRef<AbortController | undefined>(undefined)
  const [verified, setVerified] = useState<VerifiedFirmware>()
  const [acknowledged, setAcknowledged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [percent, setPercent] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [serialText, setSerialText] = useState('')
  const pin = releasedEsp32Firmware.find(item => item.board === board && item.lesson === lesson)
  const serial = getWebSerial()

  useEffect(() => {
    dialog.current?.showModal()
    return () => { flash.current?.abort(); monitor.current?.abort() }
  }, [])

  useEffect(() => {
    if (!pin || !serial) return
    const abort = new AbortController()
    setStatus('Đang kiểm SHA-256 của bản firmware mẫu…')
    void loadPinnedFirmware(pin, code, {signal:abort.signal}).then(value => {
      if (!abort.signal.aborted) { setVerified(value); setStatus('Đã kiểm đủ các tệp theo manifest.') }
    }).catch(reason => {
      if (!abort.signal.aborted) { setError(reason.message); setStatus('') }
    })
    return () => abort.abort()
  }, [pin, code, serial])

  useEffect(() => {
    if (!busy) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = true }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy])

  async function connectAndFlash() {
    if (!serial || !verified || !acknowledged || flash.current || listening) return
    const operation = new AbortController()
    flash.current = operation
    setBusy(true); setError(''); setPercent(0); setSerialText(''); setStatus('Đang chờ bạn chọn cổng USB…')
    let port
    try {
      port = await serial.requestPort()
      operation.signal.throwIfAborted()
      setStatus('Đang nhận diện chip và dung lượng flash…')
      await flashVerifiedEsp32(verified, await createEsp32Driver(port), value => {
        if (!operation.signal.aborted) { setPercent(value); setStatus('Đang ghi firmware và khởi động lại board…') }
      }, operation.signal)
      if (!operation.signal.aborted) setStatus('Đã ghi xong. Đang mở Serial sau khi khởi động lại.')
    } catch (reason) {
      if (!operation.signal.aborted) {
        setStatus('')
        setError(reason instanceof DOMException && reason.name === 'NotFoundError' ? 'Bạn chưa chọn cổng USB.'
          : reason instanceof Error ? reason.message : 'Không thể nạp qua cổng USB.')
      }
      return
    } finally {
      flash.current = undefined
      if (!operation.signal.aborted) setBusy(false)
    }
    if (operation.signal.aborted || !port) return
    const receiver = new AbortController()
    monitor.current = receiver
    setListening(true)
    try {
      await monitorSerial(port, verified.manifest.serialBaud, chunk => setSerialText(previous => (previous + chunk).slice(-8192)), receiver.signal)
      setStatus('Đã ngắt Serial.')
    } catch {
      if (!receiver.signal.aborted) setError('Đã ghi firmware. Không mở lại được Serial; kiểm lại cổng sau khi board khởi động.')
    } finally { setListening(false); monitor.current = undefined }
  }

  return <dialog ref={dialog} className="freestyle-tools" aria-labelledby="freestyle-usb-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header className="freestyle-tools-head"><h2 id="freestyle-usb-title">Nạp mẫu qua USB</h2><button className="freestyle-button" disabled={busy} onClick={onClose}>Đóng bảng USB</button></header>
    <div className="freestyle-tools-body">
      <p>Mô hình bài học chạy trong web. Firmware từ bảng này chạy trên ESP32 thật sau khi ghi qua USB.</p>
      {!serial && <p>Web Serial cần Chrome hoặc Edge trên máy tính và trang HTTPS hoặc localhost.</p>}
      {!pin && <p role="status">{lesson ? 'Mẫu này chưa có firmware đã kiểm và duyệt.' : 'Code tự viết cần dịch vụ biên dịch. Bạn có thể tải sketch để mở trong Arduino IDE.'}</p>}
      {code.trim() && <button className="freestyle-button" onClick={() => {
        const sketch = arduinoSourceFile(code, board)
        downloadBlob(new Blob([sketch.contents], {type:'text/plain'}), sketch.fileName)
      }}>Tải sketch .ino</button>}
      {verified && <div>
        <label><input type="checkbox" checked={acknowledged} disabled={busy} onChange={event => setAcknowledged(event.target.checked)} /> Tôi xác nhận firmware mẫu sẽ thay chương trình hiện tại trên board.</label>
        <button type="button" className="freestyle-button" disabled={!acknowledged || busy || listening} onClick={() => void connectAndFlash()}>Kết nối board và nạp</button>
      </div>}
      {busy && <progress max="100" value={percent} aria-label="Tiến độ nạp firmware" />}
      {listening && <button className="freestyle-button" onClick={() => monitor.current?.abort()}>Ngắt kết nối</button>}
      {(listening || serialText) && <pre aria-label="Dữ liệu Serial từ board thật">{serialText || 'Đang chờ dữ liệu Serial…'}</pre>}
      {error && <p role="alert">{error}</p>}{status && <p role="status">{status}</p>}
      <details><summary>Không thấy cổng hoặc không kết nối được</summary><p>Dùng cáp truyền dữ liệu và đóng Arduino IDE/Serial Monitor nếu đang giữ cổng. Với board không tự vào bootloader, giữ BOOT khi kết nối hoặc làm theo hướng dẫn của đúng board.</p>
        <ul><li><a href="https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers" target="_blank" rel="noreferrer">Driver CP210x · Silicon Labs</a></li><li><a href="https://www.wch-ic.com/downloads/CH341SER_EXE.html" target="_blank" rel="noreferrer">Driver CH340 · WCH</a></li></ul></details>
    </div>
  </dialog>
}
