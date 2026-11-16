import { useEffect, useMemo, useRef, useState } from 'react'
import { DigitalWaveform } from '../components/builder/DigitalWaveform'
import { compileSketch, sketchBoards, type SketchError, type SketchRun, type SketchSnapshot } from '../lib/sketchInterpreter'
import './SketchRunnerPage.css'

type Example = { id: string; name: string; board: string; code: string; inputs?: string }

const examples: readonly Example[] = [
  { id: 'esp32-blink', name: 'ESP32 · Nháy LED trên board', board: 'esp32-devkit', code: `// LED trên ESP32 DevKit V1 nối GPIO 2
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 bat dau nhay LED");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("LED: BAT");
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED: TAT");
  delay(500);
}
` },
  { id: 'esp32-button', name: 'ESP32 · Nút nhấn bật LED', board: 'esp32-devkit', inputs: 'Giữ nút GPIO 4 ở khung "Đầu vào".', code: `const int BUTTON = 4;   // nút nối GPIO 4 xuống GND
const int LED = 2;
int lastState = HIGH;

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  int state = digitalRead(BUTTON);
  digitalWrite(LED, state == LOW);
  if (state != lastState) {
    Serial.println(state == LOW ? "Nhan" : "Nha");
    lastState = state;
  }
  delay(20);
}
` },
  { id: 'esp32-pot-pwm', name: 'ESP32 · Biến trở chỉnh độ sáng (PWM)', board: 'esp32-devkit', inputs: 'Kéo thanh trượt GPIO 34 ở khung "Đầu vào".', code: `const int POT = 34;   // chân giữa biến trở
const int LED = 25;   // LED + điện trở 220 ohm

void setup() {
  Serial.begin(115200);
  ledcAttach(LED, 5000, 8);   // 5 kHz, 8 bit
}

void loop() {
  int raw = analogRead(POT);              // 0..4095 trên ESP32
  int duty = map(raw, 0, 4095, 0, 255);
  ledcWrite(LED, duty);
  Serial.printf("ADC=%d duty=%d%%\\n", raw, duty * 100 / 255);
  delay(200);
}
` },
  { id: 'uno-traffic', name: 'Arduino Uno · Đèn giao thông', board: 'arduino-uno-r3', code: `int lights[] = {13, 12, 11};   // đỏ, vàng, xanh
int durations[] = {3000, 1000, 2000};

void setup() {
  for (int i = 0; i < 3; i++) pinMode(lights[i], OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) digitalWrite(lights[j], i == j);
    Serial.print("Den so ");
    Serial.println(i);
    delay(durations[i]);
  }
}
` },
  { id: 'pico-blink', name: 'Raspberry Pi Pico · Nháy GP25', board: 'raspberry-pi-pico', code: `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);   // GP25
}

void loop() {
  digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  delay(250);
}
` },
]

const MAX_RUN_MS = 120_000

export function SketchRunnerPage() {
  const [exampleId, setExampleId] = useState(examples[0].id)
  const [boardId, setBoardId] = useState(examples[0].board)
  const [code, setCode] = useState(examples[0].code)
  const [running, setRunning] = useState(false)
  const [frame, setFrame] = useState<SketchSnapshot>()
  const [compileError, setCompileError] = useState<SketchError>()
  const [inputs, setInputs] = useState<Record<number, boolean>>({})
  const [analog, setAnalog] = useState<Record<number, number>>({})
  const runRef = useRef<SketchRun | null>(null)
  const frameRef = useRef<number | null>(null)
  const serialRef = useRef<HTMLPreElement>(null)
  const board = sketchBoards.find(item => item.id === boardId) ?? sketchBoards[0]
  const example = examples.find(item => item.id === exampleId)
  const lineCount = useMemo(() => code.split('\n').length, [code])
  const error = compileError ?? frame?.error

  useEffect(() => () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current) }, [])
  useEffect(() => { const element = serialRef.current; if (element) element.scrollTop = element.scrollHeight }, [frame?.serial])

  function stop() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    runRef.current?.stop()
    setRunning(false)
  }

  function start() {
    stop()
    setFrame(undefined)
    const compiled = compileSketch(code, board)
    if (!compiled.ok) { setCompileError(compiled.error); return }
    setCompileError(undefined)
    const sketch = compiled.run
    for (const [pin, level] of Object.entries(inputs)) sketch.setDigitalInput(Number(pin), level)
    for (const [pin, value] of Object.entries(analog)) sketch.setAnalogInput(Number(pin), value)
    runRef.current = sketch
    setRunning(true)
    let last = performance.now()
    const tick = (now: number) => {
      const elapsed = Math.min(100, Math.max(0, now - last))
      last = now
      const next = sketch.advance(elapsed)
      setFrame(next)
      if (next.error || next.phase === 'stopped' || next.simulatedMilliseconds >= MAX_RUN_MS) { frameRef.current = null; setRunning(false); return }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  function chooseExample(id: string) {
    const next = examples.find(item => item.id === id)
    if (!next) return
    stop()
    setExampleId(id)
    setBoardId(next.board)
    setCode(next.code)
    setFrame(undefined)
    setCompileError(undefined)
  }

  function setDigital(pin: number, level: boolean) {
    setInputs(current => ({ ...current, [pin]: level }))
    runRef.current?.setDigitalInput(pin, level)
  }
  function setAnalogValue(pin: number, value: number) {
    setAnalog(current => ({ ...current, [pin]: value }))
    runRef.current?.setAnalogInput(pin, value)
  }

  const pins = frame ? Object.entries(frame.pins).map(([pin, state]) => ({ pin: Number(pin), ...state })).sort((a, b) => a.pin - b.pin) : []
  const outputs = pins.filter(pin => pin.mode === 'output')
  const inputPins = [...new Set([...(frame?.digitalReads ?? []), ...pins.filter(pin => pin.mode === 'input' || pin.mode === 'input_pullup').map(pin => pin.pin)])].filter(pin => frame?.pins[pin]?.mode !== 'output').sort((a, b) => a - b)
  const analogPins = frame?.analogReads ?? []
  const pinLabel = (pin: number) => `${board.id.startsWith('arduino') ? (Object.entries(board.analogAliases).find(([, value]) => value === pin)?.[0] ?? `D${pin}`) : board.id === 'raspberry-pi-pico' ? `GP${pin}` : `GPIO ${pin}`}${pin === board.ledBuiltin ? ' · LED trên board' : ''}`

  return <div className="sketch-page mm-fit">
    <header className="sketch-head">
      <div><p className="eyebrow">CÔNG CỤ · CHẠY CODE TRÊN WEB</p><h1>Chạy code Arduino / ESP32</h1></div>
      <p className="sketch-head-note">Thông dịch Arduino C++ con ngay trong trình duyệt, theo thời gian ảo. <strong>Không biên dịch và không nạp firmware thật</strong>; WiFi, I²C, SPI chưa mô phỏng.</p>
    </header>
    <div className="sketch-toolbar" role="group" aria-label="Thiết lập và điều khiển sketch">
      <label>Ví dụ<select value={exampleId} onChange={event => chooseExample(event.target.value)}>{examples.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Board / MCU<select value={boardId} onChange={event => { stop(); setBoardId(event.target.value) }}>{sketchBoards.map(item => <option key={item.id} value={item.id}>{item.name} · {item.mcu}</option>)}</select></label>
      <button type="button" className="sketch-run" onClick={running ? stop : start}>{running ? '■ Dừng' : '▶ Chạy'}</button>
      <span className="sketch-clock" aria-live="polite">{frame ? `${(frame.simulatedMilliseconds / 1000).toFixed(2)} s ảo · ${frame.phase === 'setup' ? 'setup()' : frame.phase === 'loop' ? 'loop()' : 'đã dừng'}` : 'Chưa chạy'}</span>
    </div>
    <div className="sketch-body">
      <section className="sketch-editor" aria-label="Mã nguồn sketch">
        <div className="sketch-editor-frame">
          <pre className="sketch-gutter" aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => <span key={index} className={error?.line === index + 1 ? 'is-error' : undefined}>{index + 1}</span>)}</pre>
          <textarea rows={lineCount + 1} value={code} onChange={event => { setCode(event.target.value); setCompileError(undefined) }} spellCheck={false} aria-label="Mã nguồn Arduino C++" aria-invalid={error ? true : undefined} aria-describedby={error ? 'sketch-error' : undefined} wrap="off" />
        </div>
        {error && <p id="sketch-error" className="sketch-error" role="alert">{error.line ? `Dòng ${error.line}: ` : ''}{error.message}</p>}
        {frame?.warnings.map(warning => <p key={warning} className="sketch-warning">{warning}</p>)}
        <p className="sketch-board-note">{board.mcu} · ADC {board.adcBits} bit · {board.note}</p>
      </section>
      <section className="sketch-observe" aria-label="Quan sát mô phỏng">
        <div className="sketch-card">
          <h2>Chân đầu ra</h2>
          {outputs.length ? <ul className="sketch-pins">{outputs.map(pin => <li key={pin.pin} className={pin.level ? 'is-high' : 'is-low'}><span className="sketch-led" style={{ ['--duty' as string]: String(pin.pwm ?? (pin.level ? 1 : 0)) }} aria-hidden="true" /><strong>{pinLabel(pin.pin)}</strong><span>{pin.pwm !== undefined ? `PWM ${Math.round(pin.pwm * 100)} %` : pin.level ? 'HIGH' : 'LOW'}</span></li>)}</ul> : <p className="sketch-empty">Chưa có chân nào được đặt OUTPUT.</p>}
        </div>
        <div className="sketch-card">
          <h2>Đầu vào</h2>
          {example?.inputs && <p className="sketch-hint">{example.inputs}</p>}
          {inputPins.length === 0 && analogPins.length === 0 && <p className="sketch-empty">Sketch chưa đọc digitalRead/analogRead.</p>}
          {inputPins.map(pin => {
            const idle = frame?.pins[pin]?.mode === 'input_pullup'
            const level = inputs[pin] ?? idle
            return <button key={pin} type="button" className="sketch-input" aria-pressed={level !== idle} onPointerDown={() => setDigital(pin, !idle)} onPointerUp={() => setDigital(pin, idle)} onPointerLeave={() => setDigital(pin, idle)} onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') setDigital(pin, !idle) }} onKeyUp={() => setDigital(pin, idle)}>Giữ để nhấn · {pinLabel(pin)} <small>{level ? 'HIGH' : 'LOW'}</small></button>
          })}
          {analogPins.map(pin => <label key={pin} className="sketch-analog">{pinLabel(pin)} · {Math.round((analog[pin] ?? 0) * 100)} % Vref<input type="range" min={0} max={100} value={Math.round((analog[pin] ?? 0) * 100)} onChange={event => setAnalogValue(pin, Number(event.target.value) / 100)} /></label>)}
        </div>
        <div className="sketch-card sketch-serial-card">
          <h2>Serial Monitor</h2>
          <pre ref={serialRef} className="sketch-serial" aria-label="Đầu ra Serial" tabIndex={0}>{frame?.serial || 'Chưa có dữ liệu Serial.'}{frame?.serialTruncated ? '\n… đã cắt bớt' : ''}</pre>
        </div>
        {outputs.some(pin => frame?.events[pin.pin]?.length) && <div className="sketch-card sketch-analyzer"><h2>Logic analyzer</h2>{outputs.filter(pin => frame?.events[pin.pin]?.length).slice(0, 4).map(pin => <DigitalWaveform key={pin.pin} events={frame!.events[pin.pin]} simulatedMilliseconds={frame!.simulatedMilliseconds} signalName={pinLabel(pin.pin)} variant="light" engineLabel="trình thông dịch (thời gian ảo)" maxEvents={512} />)}</div>}
      </section>
    </div>
  </div>
}
