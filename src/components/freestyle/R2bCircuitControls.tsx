import { useMemo, useState, type FormEvent } from 'react'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import { compileCoupledCircuit } from '../../lib/freestyle/coupledCircuit'
import type { PinMap } from '../../lib/freestyle/freestyleBoards'
import { byteHex, type R2bBusEvent } from '../../simulation/catalogR2bI2c'
import { createCoupledDigital } from '../../simulation/coupledDigital'

export function R2bBusTrace({ events, issues }: { events?: R2bBusEvent[]; issues?: string[] }) {
  if (!events?.length && !issues?.length) return null
  return <div aria-label="Nhật ký giao tiếp">
    {issues?.map(issue => <p key={issue} className="freestyle-note">{issue}</p>)}
    {Boolean(events?.length) && <ol className="catalog-logic-trace">
      {events?.map(({timeMs, bus, detail}, index) => <li key={index}>{timeMs.toFixed(3)} ms · {bus} · {detail}</li>)}
    </ol>}
  </div>
}

type Props = { doc: CircuitDocV2; pinMap: PinMap; busy: boolean }

export function R2bCircuitControls({ doc, pinMap, busy }: Props) {
  const compiled = useMemo(() => compileCoupledCircuit(doc, 'arduino-uno-r3', pinMap), [doc, pinMap])
  const controller = useMemo(() => compiled.ok ? {
    circuit: createCoupledDigital(compiled.graph, { pot: 0.5 }), time: 0,
  } : undefined, [compiled])
  const [last, setLast] = useState<{ controller: typeof controller; message: string }>()
  if (!compiled.ok || !controller?.circuit.interfaces) return null
  const {circuit} = controller
  const ports = circuit.interfaces!
  const drives: Record<number, { mode: 'output'; level: boolean }> = ports.hasSpi ? {9: {mode: 'output', level: true}, 10: {mode: 'output', level: true}} : {}
  const step = (elapsed = 0) => {
    controller.time += elapsed
    circuit.step(drives, controller.time)
  }
  const message = (value: string) => setLast({controller, message: value})

  function transfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const addressText = String(fields.get('address')).trim()
    const tokens = String(fields.get('bytes')).trim().split(/\s+/).filter(Boolean)
    const count = Number(fields.get('count'))
    const delay = Number(fields.get('delay'))
    const address = Number.parseInt(addressText, 16)
    if (!/^[\da-f]{1,2}$/i.test(addressText) || address > 127 || tokens.length > 66 ||
        tokens.some(token => !/^[\da-f]{2}$/i.test(token)) || !Number.isInteger(count) || count < 0 || count > 16 ||
        !Number.isFinite(delay) || delay < 0 || delay > 1000) {
      message('Kiểm địa chỉ 7 bit, byte hex, số byte đọc và thời gian chờ.')
      return
    }
    const {i2c} = ports
    const write = tokens.length > 0 || count === 0
    step(delay)
    i2c.start(false)
    step(0.09)
    let ack = i2c.connect(address, write)
    for (const token of tokens) {
      if (!ack) break
      step(0.09)
      ack = i2c.write(Number.parseInt(token, 16))
    }
    if (ack && count > 0 && write) {
      i2c.start(true)
      step(0.09)
      ack = i2c.connect(address, false)
    }
    const data = []
    for (let index = 0; ack && index < count; index++) {
      step(0.09)
      const value = i2c.read(index < count - 1)
      data.push(value === 'X' ? value : byteHex(value))
    }
    i2c.stop()
    step()
    message(ack ? (data.length ? data.join(' ') : 'ACK') : 'NACK')
  }

  function shift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('word')).trim()
    if (!/^[\da-f]{1,4}$/i.test(value) || !drives[9] || !drives[10]) return
    const word = Number.parseInt(value, 16)
    step()
    drives[10].level = false
    step()
    step(0.008)
    const high = ports.spi(word >> 8, 1_000_000, 0, true)
    step(0.008)
    const low = ports.spi(word & 255, 1_000_000, 0, true)
    drives[10].level = true
    step()
    drives[9].level = false
    step()
    drives[9].level = true
    step()
    const output = compiled.ok ? compiled.graph.parts.flatMap(part => part.kind === 'r2b' && part.model === 'mcp4921'
      ? [part.id + ' VOUT = ' + (circuit.snapshot().levels[part.pins.vout] ?? 'Z')] : []) : []
    message(high && low ? output.join(' · ') : 'DAC chưa nhận đủ hai byte.')
  }

  return <details className="freestyle-note">
    <summary>Bộ điều khiển ảo I²C / SPI</summary>
    <p>Uno R3 · I²C 100 kHz và SPI mode 0 ở 1 MHz. Giao dịch dùng dây trên bàn và thời gian ảo riêng.</p>
    {ports.hasI2c && <form onSubmit={transfer}>
      <fieldset disabled={busy} className="catalog-logic-inputs">
        <legend>Giao dịch I²C</legend>
        <label>Địa chỉ hex<input name="address" maxLength={2} defaultValue="20" required /></label>
        <label>Byte ghi hex<input name="bytes" maxLength={197} placeholder="00 FE" /></label>
        <label>Số byte đọc<input name="count" type="number" min="0" max="16" defaultValue="0" required /></label>
        <label>Chờ trước lệnh (ms)<input name="delay" type="number" min="0" max="1000" step="any" defaultValue="0" required /></label>
        <button type="submit" className="freestyle-button">Gửi I²C</button>
      </fieldset>
    </form>}
    {ports.hasSpi && <form onSubmit={shift}>
      <fieldset disabled={busy} className="catalog-logic-inputs">
        <legend>Truyền MCP4921</legend>
        <label>Lệnh SPI hex<input name="word" maxLength={4} defaultValue="3800" required /></label>
        <button type="submit" className="freestyle-button">Gửi SPI và chốt</button>
      </fieldset>
    </form>}
    {last?.controller === controller && <>
      <output aria-label="Kết quả giao dịch ảo">{last.message}</output>
      <R2bBusTrace events={circuit.snapshot().bus} issues={circuit.snapshot().busIssues} />
    </>}
  </details>
}
