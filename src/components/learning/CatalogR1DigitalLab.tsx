import { useState, type ReactNode } from 'react'
import {
  advanceFlipFlop, advanceShiftRegister, andGate, captureMcp3008, initialFlipFlop, initialShiftRegister,
  schmittInverter, type Logic,
} from '../../simulation/catalogR1Digital'

function Channel({ count, value, onChange, label = 'Cổng' }: { count: number; value: number; onChange: (value: number) => void; label?: string }) {
  return <label>{label}<select value={value} onChange={event => onChange(Number(event.target.value))}>
    {Array.from({ length: count }, (_, i) => <option key={i} value={i}>{label === 'Kênh ADC' ? 'CH' + i : i + 1}</option>)}
  </select></label>
}

function Level({ name, value, onChange }: { name: string; value: Logic; onChange: (value: Logic) => void }) {
  return <label>{name}<select value={value} onChange={event => onChange(event.target.value === 'X' ? 'X' : event.target.value === '1' ? 1 : 0)}>
    <option value="0">0 · LOW</option><option value="1">1 · HIGH</option><option value="X">X · Trôi</option>
  </select></label>
}
const bit = (value: boolean): 0 | 1 => value ? 1 : 0
const show = (children: ReactNode) => <output className="part-r1-readings" aria-live="polite">{children}</output>

function AndLab({ powered }: { powered: boolean }) {
  const [channel, setChannel] = useState(0)
  const [inputs, setInputs] = useState<Logic[][]>(() => Array.from({ length: 4 }, () => [0, 0]))
  const setInput = (index: number, value: Logic) => setInputs(previous => previous.map((pair, i) =>
    i === channel ? pair.map((level, j) => j === index ? value : level) : pair))
  return <>
    <div className="part-r1-controls"><Channel count={4} value={channel} onChange={setChannel} />
      <Level name="A" value={inputs[channel][0]} onChange={value => setInput(0, value)} />
      <Level name="B" value={inputs[channel][1]} onChange={value => setInput(1, value)} /></div>
    {show(inputs.map(([a, b], i) => `${i + 1}Y = ${andGate(powered, a, b)}`).join(' · '))}
  </>
}

function SchmittLab({ powered }: { powered: boolean }) {
  const [channel, setChannel] = useState(0)
  const [gates, setGates] = useState(() => Array.from({ length: 6 }, () => ({ volts: 0, output: 1 as Logic })))
  const setVolts = (volts: number) => setGates(previous => previous.map((gate, i) =>
    i === channel ? { volts, output: schmittInverter(powered, volts, gate.output) } : gate))
  return <>
    <div className="part-r1-controls"><Channel count={6} value={channel} onChange={setChannel} />
      <label>Điện áp đầu vào (V)<input type="number" min="0" max="4.5" step=".1" value={gates[channel].volts}
        onChange={event => setVolts(Number(event.target.value))} /></label>
      <button type="button" onClick={() => setVolts(0)}>Mẫu 0 V</button>
      <button type="button" onClick={() => setVolts(2)}>Mẫu 2 V</button>
      <button type="button" onClick={() => setVolts(4.5)}>Mẫu 4,5 V</button></div>
    {show(gates.map((gate, i) => `${i + 1}Y = ${powered ? gate.output : 'X'}`).join(' · '))}
  </>
}

function FlipLab({ powered }: { powered: boolean }) {
  const [channel, setChannel] = useState(0)
  const [states, setStates] = useState(() => [initialFlipFlop, initialFlipFlop])
  const [inputs, setInputs] = useState<{ d: Logic; pre: Logic; clr: Logic }[]>(() => Array.from({ length: 2 }, () => ({ d: 0, pre: 1, clr: 1 })))
  const logic = inputs[channel]
  const apply = (clk: Logic, inputs = logic) => setStates(previous => previous.map((state, i) =>
    i === channel ? advanceFlipFlop(state, { powered, ...inputs, clk }) : state))
  const setPin = (name: keyof typeof logic, value: Logic) => {
    const next = { ...logic, [name]: value }
    setInputs(previous => previous.map((input, index) => index === channel ? next : input))
    apply(states[channel].clk, next)
  }
  return <>
    <div className="part-r1-controls"><Channel count={2} value={channel} onChange={setChannel} label="Flip-flop" />
      <Level name="D" value={logic.d} onChange={value => setPin('d', value)} />
      <Level name="/PRE" value={logic.pre} onChange={value => setPin('pre', value)} />
      <Level name="/CLR" value={logic.clr} onChange={value => setPin('clr', value)} />
      <button type="button" onClick={() => apply(0)}>CLK xuống 0</button>
      <button type="button" onClick={() => apply(1)}>CLK lên 1</button></div>
    {show(states.map(({ q, qn }, i) => `${i + 1}Q = ${powered ? q : 'X'} · /Q = ${powered ? qn : 'X'}`).join(' | '))}
  </>
}

function ShiftLab({ powered }: { powered: boolean }) {
  const [state, setState] = useState(initialShiftRegister)
  const [ser, setSer] = useState<Logic>(0)
  const [oe, setOe] = useState(false)
  const run = (action: 'shift' | 'latch' | 'clear' | 'sample') => setState(previous => {
    const pins = { powered, ser, srclk: 0 as const, rclk: 0 as const, srclr: bit(action !== 'clear'), oe: bit(oe) }
    let next = advanceShiftRegister(previous, pins).next
    if (action === 'sample') {
      for (const digit of '10010110') {
        const input = { ...pins, ser: bit(digit === '1') }
        next = advanceShiftRegister(next, input).next
        next = advanceShiftRegister(next, { ...input, srclk: 1 }).next
      }
      return advanceShiftRegister(next, pins).next
    }
    return advanceShiftRegister(next, { ...pins, srclk: bit(action === 'shift'), rclk: bit(action === 'latch') }).next
  })
  const output = advanceShiftRegister(state, { powered, ser, srclk: state.srclk, rclk: state.rclk, srclr: 1, oe: bit(oe) })
  return <>
    <div className="part-r1-controls"><Level name="SER" value={ser} onChange={setSer} />
      <button type="button" onClick={() => run('shift')}>Xung dịch SRCLK</button>
      <button type="button" onClick={() => run('latch')}>Xung chốt RCLK</button>
      <button type="button" onClick={() => run('clear')}>Hạ /SRCLR</button>
      <button type="button" onClick={() => run('sample')}>Dịch byte 0x96</button>
      <label><input type="checkbox" checked={oe} onChange={event => setOe(event.target.checked)} /> Ngắt đầu ra (/OE = 1)</label></div>
    {show(`QH…QA = ${[...output.q].reverse().join('')} · QH′ = ${output.serial}`)}
    <small>Thanh ghi dịch: {[...state.shift].reverse().join('')}</small>
  </>
}

function AdcLab({ powered }: { powered: boolean }) {
  const [channel, setChannel] = useState(0)
  const [volts, setVolts] = useState<number[]>(() => Array(8).fill(0))
  const [single, setSingle] = useState(true)
  const [trace, setTrace] = useState<ReturnType<typeof captureMcp3008>>()
  const clear = () => setTrace(undefined)
  return <>
    <div className="part-r1-controls">
      <Channel label="Kênh ADC" count={8} value={channel} onChange={index => { setChannel(index); clear() }} />
      <label>Điện áp kênh (V)<input type="number" min="0" max="5" step=".01" value={volts[channel]}
        onChange={event => { const value = Number(event.target.value); setVolts(previous => previous.map((v, i) => channel === i ? value : v)); clear() }} /></label>
      <label><input type="checkbox" checked={single} onChange={event => { setSingle(event.target.checked); clear() }} /> Single-ended</label>
      <button type="button" onClick={() => setTrace(captureMcp3008(channel, volts, powered, bit(single)))}>Giao dịch SPI</button>
    </div>
    {trace && show(trace.code === undefined ? 'Không nhận được mã ADC trong điều kiện này.' : `CH${channel} → ${trace.code} / 1023`)}
    {trace && <details><summary>DOUT theo cạnh lên SCLK</summary>
      <p>{trace.clocks.map(sample => sample.dout).join(' ')}</p><small>1 MHz · đọc từ trái sang phải, Z là ngõ ra trở kháng cao.</small>
    </details>}
  </>
}

export function CatalogR1DigitalLab({ id }: { id: string }) {
  const [powered, setPowered] = useState(true)
  const Panel = id === 'sn74hc08' ? AndLab : id === 'sn74hc14' ? SchmittLab
    : id === 'sn74hc74' ? FlipLab : id === 'sn74hc595' ? ShiftLab : AdcLab
  return <>
    <label><input type="checkbox" checked={powered} onChange={event => setPowered(event.target.checked)} /> Cấp nguồn bài thử</label>
    <Panel key={String(powered)} powered={powered} />
    <small>X: chưa xác định · Z: trở kháng cao.</small>
  </>
}
