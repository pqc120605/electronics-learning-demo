import approval from '../../../docs/research/2026-11-26-board-pin-electrical-firmware-a-proposal.json'
import { createNetIndexV2 } from '../circuitNetsV2'
import type { CircuitDocV2, CircuitPartV2 } from '../circuitDocV2'
import type { CircuitStimuli } from './coupledCircuit'
import { getFreestyleBoard, SIGNAL_PINS, type PinMap, type SignalPin } from './freestyleBoards'

export const a1BoardId = 'arduino-uno-r3'
type FixtureId = 'dht11' | 'dht22-bare' | 'keypad-4x4' | 'seven-segment-anode'
type FirmwareAsset = { file: string; source: string; sha256: string; bytes: number }
const artifacts = import.meta.glob<{ boardId: string; fixtures: Record<FixtureId, FirmwareAsset> }>('/src/data/a1-uno-firmware.json', { eager: true, import: 'default' })
const firmware = artifacts['/src/data/a1-uno-firmware.json']
type ApprovedFixture = (typeof approval.fixtures)[number]
export const a1UnoFixtures = approval.fixtures as Array<ApprovedFixture & { id: FixtureId }>

export function getA1UnoFixture(value: string | undefined | null) {
  const id = value?.startsWith('a1-') ? value.slice(3) : value
  return a1UnoFixtures.find(fixture => fixture.id === id)
}

export function getA1UnoFirmware(fixtureId: FixtureId) {
  return firmware?.boardId === a1BoardId ? firmware.fixtures[fixtureId] : undefined
}

export function getA1UnoFixtureFromDoc(doc: CircuitDocV2) {
  return getA1UnoFixture(doc.parts.find(part => part.id === 'a1-device')?.type)
}

export function buildA1UnoFixture(fixture: (typeof a1UnoFixtures)[number]) {
  const mount = (order: number, lane: 'left' | 'right' | 'bottom'): CircuitPartV2['mount'] => ({ kind: 'bench', lane, order })
  const parts: CircuitPartV2[] = [{ id: 'board', type: 'board', mount: mount(0,'left') },
    { id: 'a1-device', type: fixture.id, mount: mount(0,'right') }]
  const wires: CircuitDocV2['wires'] = []
  const wire = (from: string, fromPin: string, to: string, toPin: string, role: 'signal' | 'power' | 'ground' = 'signal') => {
    wires.push({ id: 'a1-wire-' + (wires.length + 1), from: { kind: 'pin', partId: from, pinId: fromPin },
      to: { kind: 'pin', partId: to, pinId: toPin }, role })
  }
  const resistor = (name: string, ohm: number) => {
    const id = 'a1-r-' + name
    parts.push({ id, type: 'resistor', mount: mount(parts.length - 2,'bottom'), value: { ohm } })
    return id
  }
  const pinMap: PinMap = { ...getFreestyleBoard(a1BoardId).defaultPins }
  const definitions = Object.entries(fixture.pins).filter(([name, target]) => name !== 'pad3' && target !== undefined)
  let placed = 0
  for (const [name, target] of definitions) {
    if (target === '5V' || target === 'GND') {
      wire('board', target === '5V' ? 'vcc' : 'gnd', 'a1-device', name, target === '5V' ? 'power' : 'ground')
      continue
    }
    const role: SignalPin = fixture.reading ? 'input' : SIGNAL_PINS[placed++]
    pinMap[role] = Number(target!.slice(1))
    if (fixture.seriesOhmEach) {
      const id = resistor(name, fixture.seriesOhmEach)
      wire('board', role, id, 'a')
      wire(id, 'b', 'a1-device', name)
    } else {
      wire('board', role, 'a1-device', name)
    }
  }
  if (fixture.pullup) {
    const id = resistor('pullup', fixture.pullup.ohm)
    wire('board', 'vcc', id, 'a', 'power')
    wire(id, 'b', 'a1-device', 'data')
  }
  const doc: CircuitDocV2 = { schema: 2, lessonId: 'freestyle', breadboards: [], parts, wires,
    expect: { partCount: parts.length, wireCount: wires.length, netCount: 0 } }
  doc.expect.netCount = createNetIndexV2(doc).netsList().length
  const controls: CircuitStimuli = fixture.reading
    ? { 'a1-device:temperature': fixture.reading.temperatureC, 'a1-device:humidity': fixture.reading.humidityPercent } : {}
  return { doc, pinMap, controls }
}

export async function loadA1UnoHex(fixtureId: FixtureId, signal: AbortSignal) {
  const spec = getA1UnoFirmware(fixtureId)
  if (!spec) throw new Error('Mẫu này chưa có firmware Uno A1 biên dịch.')
  const response = await fetch(spec.file, { signal })
  if (!response.ok) throw new Error('Chưa mở được firmware Uno đã kiểm cho mẫu này.')
  const bytes = await response.arrayBuffer()
  if (bytes.byteLength !== spec.bytes) throw new Error('Kích thước firmware không khớp bản A1.')
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2,'0')).join('')
  if (digest !== spec.sha256) throw new Error('SHA-256 firmware không khớp bản A1.')
  return new TextDecoder().decode(bytes)
}
