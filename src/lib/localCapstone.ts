import { addWire } from './circuitDocEdits'
import type { LivePinState } from './avrLiveMachine'
import {
  buildSampleCircuit, evaluateFreestyleCircuit, freestyleBoards, pinCodeName, placePart,
} from './freestyle/freestyleCircuit'

export const CAPSTONE_STORAGE_KEY = 'machmo-local-capstone-v1'
export const CAPSTONE_MAX_FILE_BYTES = 96 * 1024
export const CAPSTONE_MAX_OBSERVATIONS = 20
export const CAPSTONE_MAX_NOTES = 2000
const MODEL = 'mach-mo-logic-v1'
const FORMAT = 'mach-mo-local-capstone'
const boardIds = ['arduino-uno-r3', 'arduino-nano', 'arduino-mega-2560'] as const
type CapstoneBoardId = typeof boardIds[number]
export const capstoneBoards = freestyleBoards.filter(board => boardIds.some(id => id === board.id))

export type CapstoneSettings = {
  boardId: CapstoneBoardId | ''
  threshold: number
  inputPercent: number
  pressed: boolean
  gndConnected: boolean
}

type CircuitSettings = Pick<CapstoneSettings, 'boardId' | 'threshold' | 'gndConnected'>
type ObservationResult = {
  inputAdc: number
  thresholdAdc: number
  buttonHigh: boolean
  outputHigh: boolean
  ledOn: boolean
  activeWireIds: string[]
}
export type CapstonePrediction = 'on' | 'off'
export type CapstoneObservation = CapstoneSettings & { prediction: CapstonePrediction; result: ObservationResult }
export type CapstoneReport = { projectId: string; settings: CapstoneSettings; notes: string; observations: CapstoneObservation[] }

export function newCapstoneId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function emptyCapstone(): CapstoneReport {
  return { projectId: newCapstoneId(), settings: { boardId: '', threshold: 50, inputPercent: 50, pressed: false, gndConnected: true }, notes: '', observations: [] }
}

function adc(percent: number) {
  return Math.round(percent * 1023 / 100)
}

export function getCapstoneCircuit(settings: CircuitSettings) {
  const board = capstoneBoards.find(item => item.id === settings.boardId)
  if (!board) return null
  const sample = buildSampleCircuit('pot-dimmer', board.id)
  const pinMap = { ...sample.pinMap, trig: 2 }
  const button = placePart(sample.doc, 'button')
  const buttonId = button.partId
  const potentiometer = sample.doc.parts.find(part => part.type === 'potentiometer')
  if (!buttonId || !potentiometer) return null
  const buttonPin = (pinId: string) => ({ kind: 'pin' as const, partId: buttonId, pinId })
  const signal = addWire(button.doc, {
    id: 'button-sense', from: { kind: 'pin', partId: 'board', pinId: 'trig' }, to: buttonPin('contactA'), role: 'signal',
  })
  if (signal.doc === button.doc) return null
  const ground = settings.gndConnected ? addWire(signal.doc, {
    id: 'button-return', from: buttonPin('contactB'), to: { kind: 'hole', holeId: 'bb1:B-:25' }, role: 'ground',
  }) : null
  if (ground?.doc === signal.doc) return null
  const code = `const int LED_PIN = ${pinMap.ledOut};\nconst int BUTTON_PIN = ${pinMap.trig};\nconst int SENSOR_PIN = ${pinCodeName(board.id, pinMap.input)};\nconst int TRIP_ADC = ${adc(settings.threshold)};\n\nvoid setup() {\n  pinMode(BUTTON_PIN, INPUT_PULLUP);\n  pinMode(LED_PIN, OUTPUT);\n}\n\nvoid loop() {\n  bool pressed = digitalRead(BUTTON_PIN) == LOW;\n  int input = analogRead(SENSOR_PIN);\n  digitalWrite(LED_PIN, pressed && input > TRIP_ADC ? HIGH : LOW);\n}\n`
  return { board, pinMap, doc: ground?.doc ?? signal.doc, code, buttonId, sensorId: potentiometer.id }
}

export function observeCapstone(settings: CapstoneSettings): ObservationResult | null {
  const circuit = getCapstoneCircuit(settings)
  if (!circuit) return null
  const { doc, pinMap, buttonId, sensorId } = circuit
  const controls = { [buttonId]: settings.pressed, [sensorId]: settings.inputPercent / 100 }
  const pinStates: Record<number, LivePinState> = {
    [pinMap.trig]: { mode: 'input_pullup', level: true },
    [pinMap.input]: { mode: 'input', level: false },
    [pinMap.ledOut]: { mode: 'output', level: false },
  }
  const evaluation = evaluateFreestyleCircuit(doc, pinMap, pinStates, controls)
  const button = evaluation.inputs.find(input => input.pin === pinMap.trig)
  const sensor = evaluation.inputs.find(input => input.pin === pinMap.input && input.source === sensorId)
  if (!button || !sensor) return null
  const inputAdc = adc(sensor.analog * 100)
  const thresholdAdc = adc(settings.threshold)
  const outputHigh = !button.digital && inputAdc > thresholdAdc
  pinStates[pinMap.ledOut].level = outputHigh
  const result = evaluateFreestyleCircuit(doc, pinMap, pinStates, controls)
  const led = result.outputs.find(output => output.kind === 'led')
  return led?.kind === 'led' ? {
    inputAdc, thresholdAdc, buttonHigh: button.digital, outputHigh, ledOn: led.on,
    activeWireIds: [...result.activeWireIds],
  } : null
}

export function getCapstoneSkillSteps(report: CapstoneReport) {
  const { boardId, threshold } = report.settings
  const cases = report.observations.filter(item => item.boardId === boardId && item.threshold === threshold)
  const matches = (item: CapstoneObservation) => (item.prediction === 'on') === item.result.ledOn
  const atThreshold = (item: CapstoneObservation) => item.pressed && item.gndConnected && item.inputPercent === threshold && !item.result.ledOn
  const aboveThreshold = (item: CapstoneObservation) => item.pressed && item.gndConnected && item.inputPercent > threshold && item.result.ledOn
  const buttonIsReleased = (item: CapstoneObservation) => !item.pressed && item.gndConnected && item.inputPercent > threshold && !item.result.ledOn
  const groundIsOpen = (item: CapstoneObservation) => item.pressed && !item.gndConnected && item.inputPercent > threshold && !item.result.ledOn
  const restored = (item: CapstoneObservation, later: CapstoneObservation) => aboveThreshold(later) && later.inputPercent === item.inputPercent
  const evidence = cases.filter(matches)
  const boundary = evidence.some(atThreshold)
  const openSample = evidence.find(groundIsOpen)
  const paired = (items: CapstoneObservation[]) => items.some((item, index) =>
    groundIsOpen(item) && items.slice(index + 1).some(later => restored(item, later)))
  return [
    {
      id: 'button', title: 'Nhả nút khi biến trở trên ngưỡng', skill: 'Kiểm tra tín hiệu nút',
      recorded: cases.some(buttonIsReleased), verified: evidence.some(buttonIsReleased),
      next: { pressed: false, gndConnected: true, inputPercent: threshold + 1 },
    },
    {
      id: 'threshold', title: 'Giữ nút đúng tại ngưỡng', skill: 'Phân biệt bằng ngưỡng và vượt ngưỡng',
      recorded: cases.some(atThreshold), verified: boundary && evidence.some(aboveThreshold),
      next: { pressed: true, gndConnected: true, inputPercent: boundary ? threshold + 1 : threshold },
    },
    {
      id: 'return', title: 'Thử dây GND hở rồi nối lại ở cùng mức trên ngưỡng', skill: 'Tìm và sửa đường GND hở',
      recorded: paired(cases), verified: paired(evidence),
      next: { pressed: true, gndConnected: Boolean(openSample), inputPercent: openSample?.inputPercent ?? threshold + 1 },
    },
  ]
}

function snapshot(report: CapstoneReport) {
  const circuit = getCapstoneCircuit(report.settings)
  const artifacts = circuit ? { doc: circuit.doc, code: circuit.code, pinMap: circuit.pinMap } : null
  return { format: FORMAT, version: 1, model: MODEL, report, artifacts }
}

export function encodeCapstone(report: CapstoneReport) {
  return JSON.stringify(snapshot(report), null, 2) + '\n'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function integerBetween(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

function parseSettings(value: unknown): CapstoneSettings | null {
  if (!isRecord(value)) return null
  const { boardId, threshold, inputPercent, pressed, gndConnected } = value
  const board = boardIds.find(id => id === boardId)
  if ((!board && boardId !== '') || !integerBetween(threshold, 1, 99) || !integerBetween(inputPercent, 0, 100)
    || typeof pressed !== 'boolean' || typeof gndConnected !== 'boolean') return null
  return { boardId: board ?? '', threshold, inputPercent, pressed, gndConnected }
}

// Compare against the shape we generated, ignoring JSON object key ordering.
function matches(value: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) return Array.isArray(value) && value.length === expected.length
    && expected.every((item, index) => matches(value[index], item))
  if (!isRecord(expected)) return value === expected
  if (!isRecord(value)) return false
  const keys = Object.keys(expected)
  return Object.keys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key) && matches(value[key], expected[key]))
}

export function decodeCapstone(raw: string): { ok: true; report: CapstoneReport } | { ok: false; error: string } {
  const invalid = { ok: false as const, error: 'Hồ sơ sai định dạng hoặc nội dung không khớp với mô hình.' }
  if (raw.length > CAPSTONE_MAX_FILE_BYTES || new TextEncoder().encode(raw).length > CAPSTONE_MAX_FILE_BYTES) {
    return { ok: false, error: 'Hồ sơ vượt quá 96 KiB.' }
  }
  let data: unknown
  try { data = JSON.parse(raw) } catch { return invalid }
  if (!isRecord(data) || data.format !== FORMAT) return invalid
  if (data.version !== 1 || data.model !== MODEL) return { ok: false, error: 'Phiên bản hồ sơ hoặc mô hình chưa được hỗ trợ.' }
  if (!isRecord(data.report)) return invalid
  const { projectId, notes, observations } = data.report
  const settings = parseSettings(data.report.settings)
  if (!settings || typeof projectId !== 'string' || !/^[0-9a-f]{32}$/.test(projectId) || typeof notes !== 'string' || notes.length > CAPSTONE_MAX_NOTES
    || !Array.isArray(observations) || observations.length > CAPSTONE_MAX_OBSERVATIONS) return invalid
  const verified: CapstoneObservation[] = []
  for (const entry of observations) {
    if (!isRecord(entry) || (entry.prediction !== 'on' && entry.prediction !== 'off')) return invalid
    const context = parseSettings(entry)
    const result = context && observeCapstone(context)
    if (!context || !result) return invalid
    verified.push({ ...context, prediction: entry.prediction, result })
  }
  const report = { projectId, settings, notes, observations: verified }
  return matches(data, snapshot(report)) ? { ok: true, report } : invalid
}
