import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { ARDUINO_FQBN, DEFAULT_ARDUINO_CLI, compileArduinoSketch } from '../scripts/arduino-compile-service.mjs'

const noOptionalToolchain = !process.env.MACHMO_ARDUINO_CLI && !existsSync(DEFAULT_ARDUINO_CLI)
const liveToolchain = { timeout: 240_000, skip: noOptionalToolchain ? 'arduino-cli và AVR core là công cụ kiểm thử tùy chọn' : false }

// Chạy firmware thật do arduino-cli biên dịch trên avr8js (cần arduino-cli + core AVR trên máy).
let server, live
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  live = await server.ssrLoadModule('/src/lib/avrLiveMachine.ts')
})
after(async () => { await server?.close() })

const sketch = `void setup() {
  pinMode(13, OUTPUT);
  pinMode(2, INPUT_PULLUP);
  pinMode(7, OUTPUT);
  Serial.begin(9600);
  Serial.println("san sang");
}
void loop() {
  digitalWrite(13, HIGH);
  digitalWrite(7, digitalRead(2) == LOW);
  delay(100);
  digitalWrite(13, LOW);
  Serial.println(analogRead(A0));
  delay(100);
}
`

async function build(board) {
  assert.ok(existsSync(DEFAULT_ARDUINO_CLI), `Thiếu arduino-cli tại ${DEFAULT_ARDUINO_CLI}`)
  const result = await compileArduinoSketch({ source: sketch, fqbn: ARDUINO_FQBN[board] })
  assert.equal(result.ok, true, result.log)
  return result.hex
}

function runCollect(machine, totalMs, onFrame) {
  const levels = []
  let serial = ''
  for (let t = 0; t < totalMs; t += 20) {
    const frame = machine.runFor(20)
    serial += frame.serial
    levels.push(frame.pins[13]?.level)
    onFrame?.(frame)
  }
  return { levels, serial }
}

for (const board of ['arduino-uno-r3', 'arduino-nano', 'arduino-mega-2560']) {
  test(`${board}: compiled blink toggles D13, prints Serial and reads button + A0 from the circuit`, liveToolchain, async () => {
    const machine = live.createAvrLiveMachine(await build(board), board)
    machine.setDigitalInput(2, true)
    machine.setAnalogInput(board === 'arduino-mega-2560' ? 54 : 14, 0.5)
    const first = runCollect(machine, 700)
    assert.ok(first.levels.includes(true) && first.levels.includes(false), 'D13 phải đổi mức')
    assert.match(first.serial, /san sang/)
    const reading = Number(first.serial.split(/\r?\n/).find(line => /^\d+$/.test(line)))
    assert.ok(reading >= 500 && reading <= 524, `analogRead(A0) ≈ 512, nhận ${reading}`)
    let led7 = false
    machine.setDigitalInput(2, false)
    runCollect(machine, 400, frame => { if (frame.pins[7]?.level) led7 = true })
    assert.equal(led7, true, 'nhấn nút (D2 = LOW) phải bật D7')
    const frame = machine.runFor(20)
    assert.equal(frame.pins[2].mode, 'input_pullup')
    assert.equal(frame.pins[13].mode, 'output')
  })
}

test('PWM duty is measured from real timer output', liveToolchain, async () => {
  const result = await compileArduinoSketch({ source: 'void setup(){ pinMode(9, OUTPUT); analogWrite(9, 64); }\nvoid loop(){}\n', fqbn: ARDUINO_FQBN['arduino-uno-r3'] })
  assert.equal(result.ok, true, result.log)
  const machine = live.createAvrLiveMachine(result.hex, 'arduino-uno-r3')
  machine.runFor(50)
  const frame = machine.runFor(100)
  assert.ok(Math.abs(frame.pins[9].pwm - 64 / 255) < 0.03, `duty ≈ 25 %, nhận ${frame.pins[9].pwm}`)
})
