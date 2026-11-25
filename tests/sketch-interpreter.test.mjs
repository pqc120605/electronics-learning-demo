import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let sk
const board = id => sk.sketchBoards.find(item => item.id === id)

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  sk = await server.ssrLoadModule('/src/lib/sketchInterpreter.ts')
})

after(async () => { await server?.close() })

const run = (source, boardId = 'esp32-devkit') => {
  const compiled = sk.compileSketch(source, board(boardId))
  assert.equal(compiled.ok, true, compiled.ok ? '' : `${compiled.error.line}: ${compiled.error.message}`)
  return compiled.run
}

test('missing semicolon points to the preceding statement rather than the next line', () => {
  const result = sk.compileSketch('void setup(){\nSerial.begin(9600)\nSerial.println(1);\n}\nvoid loop(){}', board('arduino-uno-r3'))
  assert.equal(result.ok, false)
  assert.equal(result.error.line, 2)
  assert.match(result.error.message, /Thiếu ';'/)
})

test('ESP32 blink toggles LED_BUILTIN (GPIO 2) every 500 ms of virtual time and prints Serial', () => {
  const sketch = run(`
#define LED LED_BUILTIN
void setup() { pinMode(LED, OUTPUT); Serial.begin(115200); Serial.println("Bat dau"); }
void loop() { digitalWrite(LED, HIGH); delay(500); digitalWrite(LED, LOW); delay(500); }`)
  const frame = sketch.advance(2_100)
  assert.equal(frame.error, undefined)
  assert.deepEqual(frame.events[2].map(event => event.level), [true, false, true, false, true])
  assert.ok(Math.abs(frame.events[2][1].simulatedMilliseconds - 500) < 1)
  assert.equal(frame.serial, 'Bat dau\r\n')
  assert.equal(frame.pins[2].mode, 'output')
})

test('loops, arrays, functions, integer and float arithmetic follow C semantics', () => {
  const sketch = run(`
int pins[] = {4, 5, 18};
float half(int x) { return x / 2.0; }
int total = 0;
void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 3; i++) { pinMode(pins[i], OUTPUT); digitalWrite(pins[i], i % 2 == 0); total += pins[i]; }
  Serial.println(7 / 2);
  Serial.println(half(7));
  Serial.printf("t=%d hex=%X\\n", total, 255);
  Serial.println(String("v=") + 3);
}
void loop() { delay(1000); }`)
  const frame = sketch.advance(10)
  assert.equal(frame.error, undefined)
  assert.equal(frame.serial, '3\r\n3.50\r\nt=27 hex=FF\nv=3\r\n')
  assert.equal(frame.pins[4].level, true)
  assert.equal(frame.pins[5].level, false)
  assert.equal(frame.pins[18].level, true)
})

test('digital and analog inputs drive branches; millis polling terminates on virtual time', () => {
  const sketch = run(`
const int BTN = 2; const int LED = 13; unsigned long t0;
void setup() { pinMode(BTN, INPUT_PULLUP); pinMode(LED, OUTPUT); t0 = millis(); while (millis() - t0 < 20) {} }
void loop() { int pct = map(analogRead(A0), 0, 1023, 0, 100); digitalWrite(LED, digitalRead(BTN) == LOW && pct > 50); delay(10); }`, 'arduino-uno-r3')
  let frame = sketch.advance(100)
  assert.equal(frame.error, undefined)
  assert.ok(frame.simulatedMilliseconds >= 20)
  assert.equal(frame.pins[13].level, false, 'pull-up keeps button HIGH (not pressed)')
  sketch.setDigitalInput(2, false)
  sketch.setAnalogInput(14, 0.8)
  frame = sketch.advance(50)
  assert.equal(frame.pins[13].level, true)
  assert.deepEqual(frame.analogReads, [14])
  assert.deepEqual(frame.digitalReads, [2])
})

test('ESP32 PWM via ledcAttach/ledcWrite records duty cycle', () => {
  const sketch = run(`void setup() { ledcAttach(25, 5000, 8); ledcWrite(25, 64); } void loop() { delay(100); }`)
  const frame = sketch.advance(5)
  assert.ok(Math.abs(frame.pins[25].pwm - 64 / 255) < 1e-9)
})

test('board rules and unsupported features produce line-numbered Vietnamese errors', () => {
  const missing = sk.compileSketch('void setup() {}', board('esp32-devkit'))
  assert.equal(missing.ok, false)
  assert.match(missing.error.message, /setup\(\).*loop\(\)/)
  const syntax = sk.compileSketch('void setup() {\n  int x = ;\n}\nvoid loop() {}', board('esp32-devkit'))
  assert.equal(syntax.ok, false)
  assert.equal(syntax.error.line, 2)
  const badPin = run('void setup() {\n pinMode(40, OUTPUT);\n}\nvoid loop() {}').advance(1)
  assert.equal(badPin.error.line, 2)
  assert.match(badPin.error.message, /không có chân GPIO 40/)
  const inputOnly = run('void setup() { pinMode(34, OUTPUT); } void loop() {}').advance(1)
  assert.match(inputOnly.error.message, /chỉ là input/)
  const noLed = run('void setup() { pinMode(LED_BUILTIN, OUTPUT); } void loop() {}', 'esp32-s3-devkitc-1').advance(1)
  assert.match(noLed.error.message, /không có LED_BUILTIN/)
  const wifi = run('void setup() { WiFi.begin("a", "b"); } void loop() {}').advance(1)
  assert.match(wifi.error.message, /chưa được mô phỏng/)
})

test('Pico profile maps LED_BUILTIN to GP25 and A0 to GP26', () => {
  const sketch = run('void setup() { pinMode(LED_BUILTIN, OUTPUT); digitalWrite(LED_BUILTIN, HIGH); Serial.println(A0); } void loop() { delay(10); }', 'raspberry-pi-pico')
  const frame = sketch.advance(1)
  assert.equal(frame.pins[25].level, true)
  assert.equal(frame.serial, '26\r\n')
})


test('Serial distinguishes float precision from integer radix and models AVR int width', () => {
  const source = `
  void setup() {
    int value = 32767;
    value = value + 1;
    Serial.println(value);
    Serial.println(3.14159, 2);
    Serial.println(3.14159, 8);
    Serial.println(3, BIN);
  }
  void loop() { delay(1000); }`
  for (const [id, printed] of [['arduino-uno-r3', '-32768'], ['arduino-nano', '-32768'], ['arduino-mega-2560', '-32768'], ['esp32-devkit', '32768']]) {
    assert.equal(run(source, id).advance(10).serial, printed + '\r\n3.14\r\n3.14159000\r\n11\r\n', id)
  }
})
