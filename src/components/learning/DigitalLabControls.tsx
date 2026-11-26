import { useState, type ReactNode } from 'react'
import { bcdDisplay, nandOutput, simulateTelemetry, timer555Astable, type WifiCondition } from '../../simulation/digitalLabModels'

export function LabToggle({ children, checked, onChange }: { children: ReactNode; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="digital-lab-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />{children}</label>
}

const format = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

export function NandLab() {
  const [a, setA] = useState(false)
  const [b, setB] = useState(false)
  const [prediction, setPrediction] = useState('')
  const [result, setResult] = useState('')
  const [recorded, setRecorded] = useState<Record<string, number>>({})

  return <>
    <div className="digital-lab-controls">
      <LabToggle checked={a} onChange={value => { setA(value); setResult('') }}>Đầu vào A = {Number(a)}</LabToggle>
      <LabToggle checked={b} onChange={value => { setB(value); setResult('') }}>Đầu vào B = {Number(b)}</LabToggle>
      <label>Dự đoán Y<select value={prediction} onChange={event => setPrediction(event.target.value)}>
        <option value="">Chọn 0 hoặc 1</option><option>0</option><option>1</option>
      </select></label>
    </div>
    <button type="button" className="button-primary" onClick={() => {
      const output = Number(nandOutput(a, b))
      setRecorded(previous => ({ ...previous, [`${Number(a)}${Number(b)}`]: output }))
      setResult(`Y = ${output}${prediction ? (Number(prediction) === output ? ' · dự đoán đúng' : ' · khác với dự đoán') : ''}`)
    }}>Kiểm đầu ra</button>
    <p className="digital-lab-reading" role="status">{result || 'Chọn A và B rồi kiểm đầu ra.'}</p>
    <table className="digital-lab-truth"><caption>Bảng đã kiểm trong bài</caption><thead><tr><th scope="col">A</th><th scope="col">B</th><th scope="col">Y</th></tr></thead>
      <tbody>{['00', '01', '10', '11'].map(key => <tr key={key}><td>{key[0]}</td><td>{key[1]}</td><td>{recorded[key] ?? '—'}</td></tr>)}</tbody>
    </table>
  </>
}

export function BcdLab() {
  const [code, setCode] = useState(5)
  const [hold, setHold] = useState(false)
  const [lampTest, setLampTest] = useState(false)
  const [blanking, setBlanking] = useState(false)
  const [reading, setReading] = useState<ReturnType<typeof bcdDisplay> | null>(null)
  const segments = reading?.segments

  return <>
    <div className="digital-lab-controls">
      <label>Mã D3–D0<select value={code} onChange={event => setCode(Number(event.target.value))}>
        {Array.from({ length: 16 }, (_, value) => <option key={value} value={value}>{value.toString(2).padStart(4, '0')} · {value}</option>)}
      </select></label>
      <LabToggle checked={hold} onChange={setHold}>Giữ mã (LE = 1)</LabToggle>
      <LabToggle checked={blanking} onChange={setBlanking}>Tắt hiển thị (BL = 0)</LabToggle>
      <LabToggle checked={lampTest} onChange={setLampTest}>Thử đèn (LT = 0)</LabToggle>
    </div>
    <button type="button" className="button-primary" onClick={() => setReading(previous => bcdDisplay(code, previous?.captured ?? null, { hold, lampTest, blanking }))}>Áp dụng đầu vào</button>
    <div className="digital-seven-segment" aria-hidden="true">
      {[...'abcdefg'].map(id => <span key={id} data-segment={id} data-lit={Boolean(segments?.includes(id))} />)}
    </div>
    <p className="digital-lab-reading" role="status">{!reading ? 'Chưa áp dụng đầu vào.' : segments == null ? 'Chưa có mã được chốt.' : segments ? `Đoạn sáng ${[...segments].join(' ')}.` : 'Tất cả đoạn tắt.'}</p>
  </>
}

export function TimerLab() {
  const [ra, setRa] = useState(10)
  const [rb, setRb] = useState(10)
  const [capacitance, setCapacitance] = useState(10)
  const [reset, setReset] = useState(false)
  const timing = timer555Astable(ra, rb, capacitance)!

  return <>
    <div className="digital-lab-controls">
      <label>Rₐ (kΩ)<select value={ra} onChange={event => setRa(Number(event.target.value))}>{[10, 22, 47].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Rᵦ (kΩ)<select value={rb} onChange={event => setRb(Number(event.target.value))}>{[10, 22, 47].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>C (µF)<select value={capacitance} onChange={event => setCapacitance(Number(event.target.value))}>{[1, 10, 22].map(value => <option key={value}>{value}</option>)}</select></label>
      <LabToggle checked={reset} onChange={setReset}>RESET ở LOW</LabToggle>
    </div>
    <div className="digital-lab-reading" role="status">
      {reset ? <p>OUT ở LOW. Bộ dao động dừng.</p> : <>
        <p>Chu kỳ <strong>{format(timing.periodMs)} ms</strong> · Tần số <strong>{format(timing.hz)} Hz</strong> · Duty HIGH <strong>{format(timing.duty * 100)}%</strong></p>
        <div className="digital-timer-wave" aria-hidden="true"><div style={{ flex: timing.duty }}>HIGH</div><div style={{ flex: 1 - timing.duty }}>LOW</div></div>
        <p>HIGH {format(timing.highMs)} ms · LOW {format(timing.lowMs)} ms</p>
      </>}
    </div>
  </>
}

const wifiChoices: { id: WifiCondition; label: string }[] = [
  { id: 'connected', label: 'Đúng mạng và mật khẩu' }, { id: 'wrong-password', label: 'Sai mật khẩu mô phỏng' }, { id: 'no-network', label: 'Ngoài vùng phủ' },
]
const telemetryMessage = {
  'wrong-password': 'Wi-Fi từ chối vì sai mật khẩu. Chưa gửi tới broker.',
  'no-network': 'Không tìm thấy điểm truy cập. Chưa gửi tới broker.',
  'broker-unavailable': 'Wi-Fi đã kết nối. Broker mô phỏng đang ngoại tuyến.',
  'no-match': 'Broker nhận bản tin. Thuê bao đang nghe một topic khác.',
  delivered: 'Thuê bao đã nhận bản tin.',
}

export function WirelessLab() {
  const [wifi, setWifi] = useState<WifiCondition>('connected')
  const [brokerOnline, setOnline] = useState(true)
  const [topic, setTopic] = useState('lop/nhiet-do')
  const [subscription, setSubscription] = useState('lop/nhiet-do')
  const [temperature, setTemperature] = useState(25)
  const [reading, setReading] = useState<ReturnType<typeof simulateTelemetry> | null>(null)

  return <>
    <div className="digital-lab-controls">
      <label>Điều kiện Wi-Fi<select value={wifi} onChange={event => setWifi(event.target.value as WifiCondition)}>{wifiChoices.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <LabToggle checked={brokerOnline} onChange={setOnline}>Broker đang chạy</LabToggle>
      <label>Topic gửi<select value={topic} onChange={event => setTopic(event.target.value)}><option>lop/nhiet-do</option><option>lop/do-am</option></select></label>
      <label>Topic thuê bao<select value={subscription} onChange={event => setSubscription(event.target.value)}><option>lop/nhiet-do</option><option>lop/do-am</option></select></label>
      <label>Nhiệt độ mẫu ({temperature} °C)<input type="range" min={0} max={50} value={temperature} onChange={event => setTemperature(event.target.valueAsNumber)} /></label>
    </div>
    <button type="button" className="button-primary" onClick={() => setReading(simulateTelemetry({ wifi, brokerOnline, topic, subscription, payload: JSON.stringify({ nhietDo: temperature }) }))}>Gửi bản tin QoS 0</button>
    <div className="digital-lab-reading" role="status">{reading ? <><p>{telemetryMessage[reading.stage]}</p>{reading.payload !== null && <code>{reading.payload}</code>}</> : 'Chưa có lần gửi nào.'}</div>
  </>
}
