import { validateCircuitDoc, type CircuitDocV2, type CircuitEndpointV2 } from './circuitDocV2'
import { createNetIndexV2 } from './circuitNetsV2'
import { evaluateProgram, parseEducationalProgram, type EducationalProgramEvent } from './educationalProgram'
import type { WireFlow } from './logicTrace'
import { occupancy } from './mountResolve'

export type ButtonLedTraceContext = {
  doc: CircuitDocV2
  code: string
  boardId: string
  pressed: boolean
}

type ButtonLedTrace = {
  status: 'ready' | 'stale' | 'unsupported' | 'invalid'
  message: string
  events: readonly EducationalProgramEvent[]
  activeKeys: ReadonlySet<string>
  wireFlows: Map<string, WireFlow>
}

export type ButtonLedLessonFrame = {
  event: EducationalProgramEvent | null
  activeKeys: ReadonlySet<string>
  wireFlows: Map<string, WireFlow>
  activePartIds: ReadonlySet<string>
}

export const buttonLedEndpointKey = (endpoint: CircuitEndpointV2) =>
  endpoint.kind === 'pin' ? `${endpoint.partId}:${endpoint.pinId}` : endpoint.holeId

const pathPins = {
  input: ['board-1:input', 'button-1:contactA'],
  output: ['board-1:ledOut', 'res-1:a'],
  series: ['res-1:b', 'led-1:anode'],
  return: ['board-1:gnd', 'button-1:contactB', 'led-1:cathode'],
} as const

function blocked(status: 'stale' | 'unsupported' | 'invalid', message: string): ButtonLedTrace {
  return { status, message, events: [], activeKeys: new Set(), wireFlows: new Map() }
}

/** Maps the interpreted input and LED actions onto a validated lesson topology. */
export function getButtonLedLessonTrace(current: ButtonLedTraceContext, requested: ButtonLedTraceContext | null): ButtonLedTrace {
  const { doc, boardId, code, pressed } = current
  if (doc.lessonId !== 'button-led') return blocked('invalid', 'Mạch hiện tại không thuộc bài nút nhấn và LED.')
  const issue = validateCircuitDoc(doc).find(item => item.severity === 'error')
  if (issue) return blocked('invalid', issue.message)

  const index = createNetIndexV2(doc)
  const groups = Object.values(pathPins)
  const nets = groups.map(keys => index.netOf(keys[0]))
  const complete = groups.every((keys, groupIndex) => {
    const net = nets[groupIndex]
    const expected = new Set<string>(keys)
    return net && keys.every(key => net.endpoints.has(key))
      && [...net.endpoints].every(key => expected.has(key) || key.startsWith('bb-1:'))
  })
  if (!complete || new Set(nets).size !== groups.length) {
    return blocked('invalid', 'Kiểm tra lại đường nút đến GPIO IN, đường LED qua điện trở và các đường về GND. Các net tín hiệu phải tách nhau.')
  }

  const parsed = parseEducationalProgram(code, 'button-led', boardId)
  if (!parsed.ok) return blocked('unsupported', `Dòng ${parsed.line} · ${parsed.message}`)
  if (parsed.program.kind !== 'input-branch') return blocked('unsupported', 'Code hiện tại chưa có nhánh điều khiển LED được hỗ trợ.')
  if (!requested || requested.doc !== doc || requested.code !== code || requested.boardId !== boardId || requested.pressed !== pressed) {
    return blocked('stale', 'Phiên đã thay đổi. Chạy lại hoặc đổi trạng thái nút để xem kết quả mới.')
  }

  const events = evaluateProgram(parsed.program, { pressed }).events
  if (!events) return blocked('unsupported', 'Chưa có sự kiện cho đoạn code hiện tại.')
  const [read, , write] = events
  const flowForLevel = (level: 'HIGH' | 'LOW'): WireFlow => ({ signal: level === 'HIGH' ? 'high' : 'low', label: level, direction: 'none' })
  const flows: WireFlow[] = [flowForLevel(read.level), flowForLevel(write.level), { signal: 'active', direction: 'none' }, { signal: 'ground', direction: 'none' }]
  const wireFlows = new Map<string, WireFlow>()
  const activeKeys = new Set<string>()
  nets.forEach((net, index) => {
    for (const key of net?.endpoints ?? []) activeKeys.add(key)
    for (const id of net?.wireIds ?? []) wireFlows.set(id, flows[index])
  })
  for (const wire of doc.wires) {
    if (wireFlows.has(wire.id)) {
      activeKeys.add(buttonLedEndpointKey(wire.from))
      activeKeys.add(buttonLedEndpointKey(wire.to))
    }
  }
  for (const [holeId, entry] of Object.entries(occupancy(doc))) {
    if (entry.legs.some(leg => activeKeys.has(`${leg.partId}:${leg.pinId}`))) activeKeys.add(holeId)
  }
  return { status: 'ready', message: '', events, activeKeys, wireFlows }
}

/** One logical action, never a voltage/current or electron-flow projection. */
export function getButtonLedLessonFrame(current: ButtonLedTraceContext, requested: ButtonLedTraceContext | null, step: number): ButtonLedLessonFrame {
  const trace = getButtonLedLessonTrace(current, requested)
  const empty: ButtonLedLessonFrame = { event: null, activeKeys: new Set(), wireFlows: new Map(), activePartIds: new Set() }
  if (trace.status !== 'ready' || !Number.isInteger(step) || step < 0 || step >= trace.events.length) return empty
  const event = trace.events[step]
  const index = createNetIndexV2(current.doc)
  const groups = event.kind === 'write' ? [pathPins.output, pathPins.series] : [pathPins.input]
  const activeKeys = new Set<string>()
  const activePartIds = new Set<string>()
  const wireFlows = new Map<string, WireFlow>()
  for (const keys of groups) {
    const net = index.netOf(keys[0])!
    for (const key of net.endpoints) activeKeys.add(key)
    for (const key of keys) activePartIds.add(key.split(':')[0])
    for (const id of net.wireIds) wireFlows.set(id, trace.wireFlows.get(id)!)
  }
  for (const wire of current.doc.wires) {
    if (!wireFlows.has(wire.id)) continue
    activeKeys.add(buttonLedEndpointKey(wire.from))
    activeKeys.add(buttonLedEndpointKey(wire.to))
  }
  for (const [holeId, entry] of Object.entries(occupancy(current.doc))) {
    if (entry.legs.some(leg => activeKeys.has(`${leg.partId}:${leg.pinId}`))) activeKeys.add(holeId)
  }
  return { event, activeKeys, wireFlows, activePartIds }
}
