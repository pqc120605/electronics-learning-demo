import { useEffect, useRef, useState } from 'react'
import { createLcd1602, createLedMatrix7219, createOled1306, labHex, lcdPortBytes } from '../../simulation/digitalLabModels'
import { LabToggle } from './DigitalLabControls'

function I2cControls({ name, addresses, configured, target, powered, setConfigured, setTarget, setPowered, scan }: {
  name: string; addresses: readonly number[]; configured: number; target: number; powered: boolean
  setConfigured: (address: number) => void; setTarget: (address: number) => void; setPowered: (powered: boolean) => void; scan: () => void
}) {
  return <div className="digital-lab-controls">
    <label>Địa chỉ của module<select value={configured} onChange={event => setConfigured(Number(event.target.value))}>
      {addresses.map(address => <option key={address} value={address}>{labHex(address)}</option>)}
    </select></label>
    <label>Địa chỉ gửi<select value={target} onChange={event => setTarget(Number(event.target.value))}>
      {addresses.map(address => <option key={address} value={address}>{labHex(address)}</option>)}
    </select></label>
    <LabToggle checked={powered} onChange={setPowered}>Cấp nguồn {name}</LabToggle>
    <button type="button" className="button-secondary" onClick={scan}>Quét bus I²C ảo</button>
  </div>
}

function scanResult(addresses: readonly number[], responds: (address: number) => boolean) {
  const found = addresses.filter(responds).map(labHex)
  return found.length ? `Địa chỉ ACK khi quét: ${found.join(', ')}.` : 'Quét bus không tìm thấy thiết bị.'
}

const emptyLcd = [' '.repeat(16), ' '.repeat(16)]
const lcdAddresses = [0x27, 0x3f]

export function LcdLab() {
  const [configured, setConfigured] = useState(0x27)
  const [target, setTarget] = useState(0x27)
  const [powered, setPowered] = useState(true)
  const [line1, setLine1] = useState('MACH MO')
  const [line2, setLine2] = useState('THU I2C')
  const [rows, setRows] = useState(emptyLcd)
  const [status, setStatus] = useState('Chưa gửi dữ liệu.')
  const [previewBytes, setPreviewBytes] = useState<number[]>([])

  function writeLcd() {
    const textBytes = (line: string) => [...line.replace(/[^\x20-\x7e]/g, '?')].flatMap(char => lcdPortBytes(char.charCodeAt(0), true))
    const bytes = [...lcdPortBytes(0x0c, false), ...lcdPortBytes(0x80, false), ...textBytes(line1), ...lcdPortBytes(0xc0, false), ...textBytes(line2)]
    const lcd = createLcd1602(configured, powered)
    const ack = lcd.write(target, bytes)
    setStatus(ack ? `ACK tại ${labHex(target)} · LCD đã nhận ${bytes.length} byte cổng.` : `NACK tại ${labHex(target)} · kiểm tra địa chỉ và nguồn.`)
    setRows(lcd.rows())
    setPreviewBytes(bytes.slice(0, 12))
  }

  return <>
    <I2cControls name="LCD" addresses={lcdAddresses} {...{ configured, target, powered, setConfigured, setTarget }} setPowered={value => {
      setPowered(value)
      setRows(emptyLcd)
      setStatus('Đã đổi nguồn. Quét hoặc gửi lại để thử.')
    }} scan={() => {
      const lcd = createLcd1602(configured, powered)
      setStatus(scanResult(lcdAddresses, address => lcd.write(address, [])))
    }} />
    <div className="digital-lab-controls">
      <label>Nội dung dòng 1<input type="text" maxLength={16} value={line1} onChange={event => setLine1(event.target.value)} /></label>
      <label>Nội dung dòng 2<input type="text" maxLength={16} value={line2} onChange={event => setLine2(event.target.value)} /></label>
    </div>
    <button className="button-primary" type="button" onClick={writeLcd}>Gửi văn bản I²C</button>
    <div className="digital-lcd" role="group" aria-label="Hai dòng LCD">{rows.map((row, index) => <code key={index}>{row}</code>)}</div>
    <p className="digital-lab-reading" role="status">{status}</p>
    {previewBytes.length > 0 && <p className="digital-frame">Byte đầu của lần gửi <code>{previewBytes.map(labHex).join(' ')}</code></p>}
  </>
}

function PixelSurface({ pixels, width, height, name, intensity = 15 }: { pixels: Uint8Array; width: number; height: number; name: string; intensity?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#152229'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = `rgba(111, 231, 216, ${0.25 + intensity / 20})`
    pixels.forEach((value, index) => { if (value) ctx.fillRect(index % width, Math.floor(index / width), 1, 1) })
  }, [pixels, width, height, intensity])
  const count = pixels.reduce((total, value) => total + value, 0)
  return <figure className="digital-pixels">
    <canvas ref={canvas} width={width} height={height} role="img" aria-label={`${name}, ${count} điểm sáng`} />
    <figcaption>{name} · {count} điểm sáng</figcaption>
  </figure>
}

const oledAddresses = [0x3c, 0x3d]

export function OledLab() {
  const [configured, setConfigured] = useState(0x3c)
  const [target, setTarget] = useState(0x3c)
  const [powered, setPowered] = useState(true)
  const [page, setPage] = useState(0)
  const [pattern, setPattern] = useState(0xaa)
  const [pixels, setPixels] = useState(() => new Uint8Array(8192))
  const [status, setStatus] = useState('Chưa gửi dữ liệu.')
  const [frame, setFrame] = useState<number[]>([])

  function drawOled() {
    const oled = createOled1306(configured, powered)
    const commands = [0x00, 0xaf, 0xb0 | page, 0x00, 0x10]
    const data = [0x40, ...Array<number>(128).fill(pattern)]
    const ack = oled.write(target, commands) && oled.write(target, data)
    setPixels(oled.pixels())
    setFrame(commands)
    setStatus(ack ? `ACK tại ${labHex(target)} · đã ghi 128 byte vào page ${page}.` : `NACK tại ${labHex(target)} · kiểm tra địa chỉ và nguồn.`)
  }

  return <>
    <I2cControls name="OLED" addresses={oledAddresses} {...{ configured, target, powered, setConfigured, setTarget }} setPowered={value => {
      setPowered(value)
      setPixels(new Uint8Array(8192))
      setStatus('Đã đổi nguồn. Quét hoặc gửi lại để thử.')
    }} scan={() => {
      const oled = createOled1306(configured, powered)
      setStatus(scanResult(oledAddresses, address => oled.write(address, [])))
    }} />
    <div className="digital-lab-controls">
      <label>Page màn hình<select value={page} onChange={event => setPage(Number(event.target.value))}>
        {Array.from({ length: 8 }, (_, index) => <option key={index}>{index}</option>)}
      </select></label>
      <label>Byte dữ liệu mỗi cột<select value={pattern} onChange={event => setPattern(Number(event.target.value))}>
        {[0xaa, 0xff, 0x01, 0x00].map(byte => <option key={byte} value={byte}>{labHex(byte)}</option>)}
      </select></label>
    </div>
    <button className="button-primary" type="button" onClick={drawOled}>Ghi page OLED</button>
    <PixelSurface pixels={pixels} width={128} height={64} name="OLED 128 × 64" />
    <p className="digital-lab-reading" role="status">{status}</p>
    {frame.length > 0 && <p className="digital-frame">Khung lệnh của lần gửi <code>{frame.map(labHex).join(' ')}</code></p>}
  </>
}

export function MatrixLab() {
  const [driver] = useState(createLedMatrix7219)
  const [row, setRow] = useState(1)
  const [mask, setMask] = useState(0x81)
  const [intensity, setIntensity] = useState(8)
  const [shutdown, setShutdown] = useState(false)
  const [test, setTest] = useState(false)
  const [view, setView] = useState(() => driver.read())
  const [status, setStatus] = useState('Chưa ghi hàng nào.')

  return <>
    <div className="digital-lab-controls">
      <label>Hàng LED<select value={row} onChange={event => setRow(Number(event.target.value))}>{Array.from({ length: 8 }, (_, index) => <option key={index}>{index + 1}</option>)}</select></label>
      <label>Bitmask tám cột<select value={mask} onChange={event => setMask(Number(event.target.value))}>{[0x81, 0xaa, 0xff, 0x01, 0x00].map(byte => <option key={byte} value={byte}>{byte.toString(2).padStart(8, '0')} · {labHex(byte)}</option>)}</select></label>
      <label>Mức sáng ({intensity}/15)<input type="range" min={0} max={15} value={intensity} onChange={event => setIntensity(event.target.valueAsNumber)} /></label>
      <LabToggle checked={shutdown} onChange={setShutdown}>Shutdown</LabToggle>
      <LabToggle checked={test} onChange={setTest}>Thử tất cả LED</LabToggle>
    </div>
    <button className="button-primary" type="button" onClick={() => {
      for (const word of [0x0b07, 0x0a00 | intensity, 0x0c00 | Number(!shutdown), 0x0f00 | Number(test), (row << 8) | mask]) driver.write(word)
      setView(driver.read())
      setStatus(`Đã ghi thanh ghi ${labHex(row)} với dữ liệu ${labHex(mask)}.`)
    }}>Ghi thanh ghi LED matrix</button>
    <PixelSurface pixels={view.pixels} width={8} height={8} intensity={view.intensity} name="LED matrix 8 × 8" />
    <p className="digital-lab-reading" role="status">{status}</p>
  </>
}
