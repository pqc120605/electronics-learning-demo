import { useEffect, useMemo, useState } from 'react'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import { compileCoupledCircuit, type CoupledCircuit } from '../../lib/freestyle/coupledCircuit'
import type { PinMap } from '../../lib/freestyle/freestyleBoards'
import { arduinoBlinkSampleName, arduinoBlinkSamplePath, createFirmwareLoadGuard, fetchFirmwareText } from '../../lib/firmwareWorkflow'
import { inspectIntelHex } from '../../lib/intelHex'
import { getA1UnoFirmware, getA1UnoFixtureFromDoc, loadA1UnoHex } from '../../lib/freestyle/a1UnoFixtures'

export type CoupledHexRun = { hex: string; graph: CoupledCircuit }
type Props = { doc: CircuitDocV2; pinMap: PinMap; boardId: string; busy: boolean; onRun: (run: CoupledHexRun) => void }

export function CoupledFirmwareControls({ doc, pinMap, boardId, busy, onRun }: Props) {
  const guard = useMemo(createFirmwareLoadGuard, [])
  const [selection, setSelection] = useState<{ hex: string; name: string }>()
  const [message, setMessage] = useState('')
  const compiled = useMemo(() => compileCoupledCircuit(doc, boardId, pinMap), [doc, boardId, pinMap])
  const fixture = getA1UnoFixtureFromDoc(doc)
  const asset = fixture && getA1UnoFirmware(fixture.id)
  useEffect(() => () => guard.cancel(), [guard])
  useEffect(() => { guard.cancel(); setSelection(undefined); setMessage('') }, [fixture?.id, guard])

  async function load(file?: File) {
    const request = guard.start()
    setSelection(undefined)
    setMessage('Đang kiểm tra HEX…')
    try {
      if (file && file.size > 2 * 1024 * 1024) throw new Error('Tệp HEX vượt giới hạn 2 MiB.')
      const hex = file ? await file.text() : fixture
        ? await loadA1UnoHex(fixture.id, request.signal) : await fetchFirmwareText(arduinoBlinkSamplePath, request.signal)
      if (!request.isCurrent()) return
      inspectIntelHex(hex, { maxBytes: 32 * 1024 })
      const name = file?.name ?? (fixture ? fixture.mpn + ' · Uno A1' : arduinoBlinkSampleName)
      setSelection({ hex, name })
      setMessage('Đã nạp ' + name + ' vào tab.')
    } catch (error) {
      if (request.isCurrent()) setMessage(error instanceof Error ? error.message : 'Không đọc được HEX.')
    }
  }

  return <details className="freestyle-card" open={fixture ? true : undefined}>
    <summary>Firmware HEX và mạch số Uno</summary>
    <p>Chạy HEX của Uno R3 trên AVR8js. Các net trên bàn đưa tín hiệu vào GPIO và IC theo sự kiện của CPU.</p>
    <p>Miền thử gồm IC logic R1 và R2A, MCP3008 single-ended SPI mode 0 do firmware tạo xung GPIO,
      LED, điện trở, nút nhấn, biến trở, DHT11/DHT22, keypad 4×4 và LED 7 đoạn anode chung.</p>
    {!compiled.ok && <ul aria-label="Điều kiện chạy firmware cùng mạch">{compiled.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
    <button className="freestyle-button" type="button" disabled={busy || Boolean(fixture && !asset)} onClick={() => void load()}>
      {fixture ? 'Mở firmware Uno đã biên dịch' : 'Mở HEX Blink Arduino Uno có sẵn'}
    </button>
    {asset && <a href={asset.source} download>Tải mã nguồn Arduino</a>}
    {fixture && !asset && <p role="status">Mạch thử đã có. Cần nạp HEX biên dịch cho Arduino Uno R3 để chạy.</p>}
    <label>HEX Arduino Uno R3 <input type="file" accept=".hex,text/plain" disabled={busy} onChange={event => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) void load(file)
    }} /></label>
    {message && <p role="status">{message}</p>}
    <button className="freestyle-run-button" type="button" disabled={busy || !compiled.ok || !selection}
      onClick={() => { if (compiled.ok && selection) onRun({ hex: selection.hex, graph: compiled.graph }) }}>
      Chạy HEX cùng mạch
    </button>
  </details>
}
