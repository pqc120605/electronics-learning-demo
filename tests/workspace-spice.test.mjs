import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let compileWorkspaceSpice
let setWorkspaceSpiceAnalysis
let inspectSpiceNetlist

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ compileWorkspaceSpice, setWorkspaceSpiceAnalysis } = await server.ssrLoadModule('/src/lib/workspaceSpice.ts'))
  ;({ inspectSpiceNetlist } = await server.ssrLoadModule('/src/simulation/spiceNetlist.ts'))
})

after(async () => { await server?.close() })

const wire = (id, from, to) => ({ id, from: endpoint(from), to: endpoint(to) })
const endpoint = (value) => { const [partId, pinId] = value.split(':'); return { partId, pinId } }
const dcCircuit = () => ({
  boardLogicLevel: '3.3 V',
  parts: [
    { id: 'src', type: 'battery' },
    { id: 'r', type: 'resistor', value: '1 kΩ' },
    { id: 'led', type: 'led' },
  ],
  connections: [
    wire('a', 'src:positive', 'r:a'),
    wire('b', 'r:b', 'led:anode'),
    wire('c', 'led:cathode', 'src:negative'),
  ],
})

test('compiles a wired source, resistor and LED into a valid deterministic SPICE netlist', () => {
  const input = dcCircuit()
  const first = compileWorkspaceSpice(input)
  const second = compileWorkspaceSpice(input)
  assert.equal(first.ok, true)
  assert.equal(first.netlist, second.netlist)
  assert.match(first.netlist, /V1 .* 0 DC 5/)
  assert.match(first.netlist, /R1 .* 1k/)
  assert.match(first.netlist, /D1 .* DLED/)
  assert.match(first.netlist, /\.model DLED D\(/)
  assert.equal(inspectSpiceNetlist(first.netlist).errors.length, 0)
  assert.match(first.assumptions.join(' '), /không thực thi firmware/i)
})

test('selects a bounded transient analysis for an RC workspace circuit', () => {
  const input = {
    boardLogicLevel: '5 V',
    parts: [{ id: 'src', type: 'battery', value: '5 V' }, { id: 'r', type: 'resistor', value: '1 kΩ' }, { id: 'c', type: 'capacitor', value: '100 µF' }],
    connections: [wire('a', 'src:positive', 'r:a'), wire('b', 'r:b', 'c:plus'), wire('c', 'c:minus', 'src:negative')],
  }
  const compiled = compileWorkspaceSpice(input)
  assert.equal(compiled.ok, true, compiled.ok ? '' : compiled.issues.join(' '))
  const transient = setWorkspaceSpiceAnalysis(compiled.netlist, { kind: 'tran', step: '1 ms', stop: '100 ms' })
  assert.equal(transient.ok, true, transient.ok ? '' : transient.issues.join(' '))
  assert.match(transient.netlist, /^\.tran 1m 100m$/m)
  assert.equal(inspectSpiceNetlist(transient.netlist).errors.length, 0)
  assert.ok(inspectSpiceNetlist(transient.netlist).maxAnalysisPoints <= 20_000)
  assert.equal(setWorkspaceSpiceAnalysis(compiled.netlist, { kind: 'tran', step: '1 ms', stop: '30 s' }).ok, false)
})

test('selects a DC sweep only for an existing voltage source and rejects invalid sweep ranges', () => {
  const compiled = compileWorkspaceSpice(dcCircuit())
  assert.equal(compiled.ok, true, compiled.ok ? '' : compiled.issues.join(' '))
  const swept = setWorkspaceSpiceAnalysis(compiled.netlist, { kind: 'dc', source: 'V1', start: '0 V', stop: '5 V', step: '0.1 V' })
  assert.equal(swept.ok, true, swept.ok ? '' : swept.issues.join(' '))
  assert.match(swept.netlist, /^\.dc V1 0 5 0\.1$/m)
  assert.equal(inspectSpiceNetlist(swept.netlist).errors.length, 0)
  assert.equal(setWorkspaceSpiceAnalysis(compiled.netlist, { kind: 'dc', source: 'V99', start: '0', stop: '5', step: '0.1' }).ok, false)
  assert.equal(setWorkspaceSpiceAnalysis(compiled.netlist, { kind: 'dc', source: 'V1', start: '5', stop: '0', step: '0.1' }).ok, false)
})

test('uses explicit wires as the only connectivity evidence and rejects a floating pin', () => {
  const input = dcCircuit()
  input.connections = input.connections.slice(0, 2)
  const result = compileWorkspaceSpice(input)
  assert.equal(result.ok, false)
  assert.match(result.issues.join(' '), /chưa được nối|nối dây/i)
})

test('rejects a connected MCU signal because firmware behavior is outside SPICE scope', () => {
  const input = dcCircuit()
  input.parts.push({ id: 'mcu', type: 'board' })
  input.connections.push(wire('gpio', 'mcu:ledOut', 'src:positive'))
  const result = compileWorkspaceSpice(input)
  assert.equal(result.ok, false)
  assert.match(result.issues.join(' '), /GPIO|firmware/i)
})

test('rejects connected components without an electrical equivalent instead of omitting them', () => {
  const input = dcCircuit()
  input.parts.push({ id: 'sensor', type: 'ultrasonic' })
  input.connections.push(wire('sensor-vcc', 'sensor:vcc', 'src:positive'))
  const result = compileWorkspaceSpice(input)
  assert.equal(result.ok, false)
  assert.match(result.issues.join(' '), /siêu âm|ultrasonic|model điện/i)
})

test('rejects malformed endpoints and invalid component values', () => {
  const input = dcCircuit()
  input.parts[1].value = 'Infinity'
  const result = compileWorkspaceSpice(input)
  assert.equal(result.ok, false)
  assert.match(result.issues.join(' '), /trị số/i)
  input.parts[1].value = '1 kΩ'
  input.connections[0].to.pinId = 'not-a-pin'
  assert.equal(compileWorkspaceSpice(input).ok, false)
})

test('rejects values whose physical unit does not match the workspace component', () => {
  const cases = [
    ['resistor', '5 V'],
    ['capacitor', '100 Ω'],
    ['ldr', '12 mH'],
    ['battery', '220 Ω'],
  ]
  for (const [type, value] of cases) {
    const input = dcCircuit()
    const part = type === 'battery' ? input.parts[0] : type === 'resistor' ? input.parts[1] : type === 'capacitor' ? { id: 'c', type, value } : { id: 'ldr', type, value }
    if (type === 'battery' || type === 'resistor') part.value = value
    else {
      input.parts.push(part)
      const [positive, negative] = type === 'capacitor' ? ['plus', 'minus'] : ['a', 'b']
      input.connections.push(wire(`${type}-positive`, 'src:positive', `${part.id}:${positive}`), wire(`${type}-negative`, `${part.id}:${negative}`, 'src:negative'))
    }
    assert.equal(compileWorkspaceSpice(input).ok, false, `${type} should reject ${value}`)
  }
})

test('normalizes explicit resistance, capacitance and voltage units before producing the netlist', () => {
  const input = dcCircuit()
  input.parts[0].value = '3,3 v'
  input.parts[1].value = '1 kOhm'
  const result = compileWorkspaceSpice(input)
  assert.equal(result.ok, true, result.ok ? '' : result.issues.join(' '))
  assert.match(result.netlist, /DC 3\.3/i)
  assert.match(result.netlist, /1k/i)
})

test('supports capacitor and a value-driven LDR only with complete wiring', () => {
  const input = {
    boardLogicLevel: '3.3 V',
    parts: [
      { id: 'src', type: 'battery', value: '3.3 V' },
      { id: 'r', type: 'resistor', value: '10 kΩ' },
      { id: 'ldr', type: 'ldr', value: '20 kΩ' },
      { id: 'c', type: 'capacitor', value: '100 µF' },
    ],
    connections: [
      wire('a', 'src:positive', 'ldr:a'), wire('b', 'ldr:b', 'r:a'),
      wire('c', 'r:b', 'src:negative'), wire('d', 'ldr:b', 'c:plus'),
      wire('e', 'c:minus', 'src:negative'),
    ],
  }
  const result = compileWorkspaceSpice(input)
  assert.equal(result.ok, true, result.ok ? '' : result.issues.join(' '))
  assert.match(result.netlist, /C1 .* 100u/i)
  assert.match(result.netlist, /R\d+ .* 10k/i)
  assert.match(result.netlist, /R\d+ .* 20k/i)
})

test('treats a breadboard symbol pin as one declared group only when explicit wires meet there', () => {
  const input = {
    boardLogicLevel: '5 V',
    parts: [
      { id: 'src', type: 'battery', value: '5 V' },
      { id: 'bb', type: 'breadboard' },
      { id: 'r', type: 'resistor', value: '1 kΩ' },
      { id: 'led', type: 'led' },
    ],
    connections: [
      wire('source-to-rail', 'src:positive', 'bb:railPlus'),
      wire('rail-to-resistor', 'bb:railPlus', 'r:a'),
      wire('resistor-to-led', 'r:b', 'led:anode'),
      wire('led-to-return-rail', 'led:cathode', 'bb:railMinus'),
      wire('rail-to-source-return', 'bb:railMinus', 'src:negative'),
    ],
  }
  const result = compileWorkspaceSpice(input)
  assert.equal(result.ok, true, result.ok ? '' : result.issues.join(' '))
  assert.match(result.netlist, /V\d+ N\d+ 0 DC 5/)
  assert.match(result.netlist, /R\d+ N\d+ N\d+ 1k/i)
  assert.match(result.assumptions.join(' '), /breadboard.*rail \+.*dây đã nối/i)
  assert.match(result.assumptions.join(' '), /không suy luận.*lỗ|không mô phỏng.*lỗ/i)
})

test('unwired visual parts are listed as excluded, while oversized workspace input is rejected', () => {
  const input = dcCircuit()
  input.parts.push({ id: 'unwired-motor', type: 'dc-motor' })
  const result = compileWorkspaceSpice(input)
  assert.equal(result.ok, true)
  assert.deepEqual(result.ignoredUnwiredParts, ['unwired-motor'])
  assert.equal(compileWorkspaceSpice({ ...input, parts: new Array(502).fill(input.parts[0]) }).ok, false)
})

test('workspace handoff is bounded, expires, and rejects tampered or unknown ids', async () => {
  const { storeWorkspaceSpiceHandoff, readWorkspaceSpiceHandoff, clearWorkspaceSpiceHandoff } = await server.ssrLoadModule('/src/lib/workspaceSpice.ts')
  const storage = new Map()
  const fakeStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
  const compiled = compileWorkspaceSpice(dcCircuit())
  assert.equal(compiled.ok, true)
  const id = storeWorkspaceSpiceHandoff(fakeStorage, compiled, 'Bài thử', 1000, 'test-handoff-1')
  assert.equal(readWorkspaceSpiceHandoff(fakeStorage, id, 1001)?.title, 'Bài thử')
  assert.equal(readWorkspaceSpiceHandoff(fakeStorage, '../bad', 1001), undefined)
  assert.equal(readWorkspaceSpiceHandoff(fakeStorage, id, 1000 + 31 * 60_000), undefined)
  storage.set(`machmo-workspace-spice-${id}`, JSON.stringify({ schemaVersion: 1, netlist: 'malicious' }))
  assert.equal(readWorkspaceSpiceHandoff(fakeStorage, id, 1001), undefined)
  clearWorkspaceSpiceHandoff(fakeStorage, id)
  assert.equal(storage.has(`machmo-workspace-spice-${id}`), false)

  const largeStorage = new Map()
  const largeResult = { ...compiled, assumptions: new Array(100).fill('x'.repeat(500)) }
  assert.equal(storeWorkspaceSpiceHandoff(fakeStorageFor(largeStorage), largeResult, 'Lớn', 2000, 'oversized-handoff'), undefined)
  assert.equal(largeStorage.size, 0)
})

function fakeStorageFor(storage) {
  return {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  }
}
