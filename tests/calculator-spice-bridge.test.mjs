import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

let server
let bridge
let validation
let calculators
let analogDivider
let workspaceSpice
let CalculatorPage
let SpicePage
let BuilderPage

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  bridge = await server.ssrLoadModule('/src/lib/calculatorSpice.ts')
  validation = await server.ssrLoadModule('/src/simulation/spiceNetlist.ts')
  calculators = await server.ssrLoadModule('/src/lib/electronicsCalculators.ts')
  analogDivider = await server.ssrLoadModule('/src/lib/analogDivider.ts')
  workspaceSpice = await server.ssrLoadModule('/src/lib/workspaceSpice.ts')
  CalculatorPage = (await server.ssrLoadModule('/src/pages/ElectronicsCalculatorsPage.tsx')).ElectronicsCalculatorsPage
  SpicePage = (await server.ssrLoadModule('/src/pages/SpiceWorkbenchPage.tsx')).SpiceWorkbenchPage
  BuilderPage = (await server.ssrLoadModule('/src/pages/CircuitBuilderPage.tsx')).CircuitBuilderPage
})

after(async () => { await server?.close() })

async function solve(netlist) {
  const simulation = new Simulation()
  await simulation.start()
  simulation.setNetList(validation.normalizeSpiceNetlistForEngine(netlist))
  return simulation.runSim()
}

test('LED calculator handoff builds a valid idealized diode operating-point model', async () => {
  const draft = bridge.createCalculatorSpiceHandoff('led', { supplyVolts: 3.3, forwardVolts: 2, currentMilliAmps: 10 })
  assert.deepEqual(validation.inspectSpiceNetlist(draft.netlist).errors, [])
  assert.match(draft.netlist, /R1 VIN ANODE/)
  assert.match(draft.assumption, /Shockley lý tưởng/i)

  const result = await solve(draft.netlist)
  const anode = result.data.find(item => item.name.toLowerCase().includes('anode'))
  assert.ok(anode, `expected LED node in ${result.variableNames.join(', ')}`)
  assert.ok(anode.values[0] > 1.8 && anode.values[0] < 2.2, `expected Vf near 2 V, got ${anode.values[0]}`)
})

test('ADC divider handoff uses the calculated E24 resistors and solves the output node', async () => {
  const draft = bridge.createCalculatorSpiceHandoff('adc-divider', { inputMaxVolts: 12, adcMaxVolts: 3.1, lowerResistorKOhms: 10 })
  assert.deepEqual(validation.inspectSpiceNetlist(draft.netlist).errors, [])
  assert.match(draft.netlist, /R2 OUT 0 1e\+4/)
  const result = await solve(draft.netlist)
  const output = result.data.find(item => item.name.toLowerCase().includes('out'))
  assert.ok(output, `expected output node in ${result.variableNames.join(', ')}`)
  const expected = calculators.calculateAdcDivider(12, 3.1, 10).outputAtMaxVolts
  assert.ok(Math.abs(output.values[0] - expected) < 1e-6, `expected ${expected} V, got ${output.values[0]}`)
})

test('I2C handoff models only the calculated pull-up rise as an RC equivalent', async () => {
  const draft = bridge.createCalculatorSpiceHandoff('i2c-pullup', { supplyVolts: 3.3, busCapacitancePf: 100, speed: 'fast' })
  assert.deepEqual(validation.inspectSpiceNetlist(draft.netlist).errors, [])
  assert.match(draft.assumption, /sườn lên/i)
  const result = await solve(draft.netlist)
  const bus = result.data.find(item => item.name.toLowerCase().includes('sda'))
  assert.ok(bus, `expected SDA node in ${result.variableNames.join(', ')}`)
  assert.ok(bus.values.at(-1) > 3.2, `expected released bus to rise near VDD, got ${bus.values.at(-1)}`)
})

test('RC handoff solves the calculator time constant and survives route-state serialization', async () => {
  const draft = bridge.createCalculatorSpiceHandoff('rc', { resistanceKOhms: 10, capacitanceMicroFarads: 1 })
  assert.deepEqual(validation.inspectSpiceNetlist(draft.netlist).errors, [])
  const result = await solve(draft.netlist)
  const output = result.data.find(item => item.name.toLowerCase().includes('out'))
  assert.ok(output, `expected RC output node in ${result.variableNames.join(', ')}`)
  assert.ok(output.values.some(value => value > 3), 'expected capacitor voltage to charge toward the 5 V step')

  assert.deepEqual(bridge.parseCalculatorSpiceHandoff(JSON.parse(JSON.stringify(draft))), draft)
})

test('LDR divider handoff matches the stated educational divider model at dark, middle, and bright inputs', async () => {
  for (const lightPercent of [0, 25, 100]) {
    const draft = bridge.createCalculatorSpiceHandoff('ldr-divider', { lightPercent })
    assert.deepEqual(validation.inspectSpiceNetlist(draft.netlist).errors, [])
    assert.match(draft.netlist, /R1 VCC MID/)
    assert.match(draft.netlist, /R2 MID 0 1e\+4/)
    assert.match(draft.assumption, /không phải.*đặc tuyến/i)

    const simulation = await solve(draft.netlist)
    const midpoint = simulation.data.find(item => item.name.toLowerCase().includes('mid'))
    assert.ok(midpoint, `expected divider midpoint in ${simulation.variableNames.join(', ')}`)
    const expected = analogDivider.calculateLdrDivider(lightPercent).outputVoltageVolts
    assert.ok(Math.abs(midpoint.values[0] - expected) < 1e-6, `expected ${expected} V at ${lightPercent}% light, got ${midpoint.values[0]}`)
  }
  assert.throws(() => bridge.createCalculatorSpiceHandoff('ldr-divider', { lightPercent: 101 }), /0 đến 100/)
})

test('LDR workspace handoff is restricted to the supported lesson, 3.3 V board, valid circuit, and 10 kΩ divider', () => {
  const input = {
    lessonId: 'analog-ldr',
    boardLogicLevel: '3.3 V GPIO',
    hasCircuitErrors: false,
    placedParts: [
      { id: 'ldr-1', type: 'ldr' },
      { id: 'resistor-ldr-1', type: 'resistor', value: '10 kΩ' },
    ],
  }
  assert.equal(workspaceSpice.getLdrDividerSpiceBlockReason(input), undefined)
  assert.match(workspaceSpice.getLdrDividerSpiceBlockReason({ ...input, boardLogicLevel: '5 V' }), /3,3 V/)
  assert.match(workspaceSpice.getLdrDividerSpiceBlockReason({ ...input, hasCircuitErrors: true }), /sửa lỗi kết nối/i)
  assert.match(workspaceSpice.getLdrDividerSpiceBlockReason({ ...input, placedParts: input.placedParts.map(part => part.id === 'resistor-ldr-1' ? { ...part, value: '4.7 kΩ' } : part) }), /10 kΩ/)
  assert.match(workspaceSpice.getLdrDividerSpiceBlockReason({ ...input, lessonId: 'blink' }), /bài LDR/i)
})

test('LDR return route is preserved only for a bounded internal guided-builder URL', () => {
  const handoff = {
    ...bridge.createCalculatorSpiceHandoff('ldr-divider', { lightPercent: 25 }),
    returnTo: '/build?lesson=analog-ldr&guided=1&board=seeed-xiao-esp32-s3',
  }
  assert.deepEqual(bridge.parseCalculatorSpiceHandoff(handoff), handoff)
  assert.equal(bridge.parseCalculatorSpiceHandoff({ ...handoff, returnTo: 'https://example.com' }), undefined)
  assert.equal(bridge.parseCalculatorSpiceHandoff({ ...handoff, returnTo: '/build?lesson=analog-ldr&guided=1&board=abc&redirect=https://example.com' }), undefined)
})

test('calculator SPICE handoff can be restored from a bounded URL parameter after reload', () => {
  const draft = bridge.createCalculatorSpiceHandoff('rc', { resistanceKOhms: 10, capacitanceMicroFarads: 1 })
  const encoded = bridge.serializeCalculatorSpiceHandoff(draft)
  assert.equal(typeof encoded, 'string')
  assert.deepEqual(bridge.readCalculatorSpiceHandoff(null, `?calculatorSpice=${encodeURIComponent(encoded)}`), draft)
  assert.equal(bridge.readCalculatorSpiceHandoff(null, `?calculatorSpice=${'x'.repeat(24_001)}`), undefined)

  const page = renderToString(createElement(MemoryRouter, {
    initialEntries: [{ pathname: '/tools/spice', search: `?calculatorSpice=${encodeURIComponent(encoded)}` }],
  }, createElement(SpicePage)))
  assert.match(page, /Netlist tương đương ·/)
  assert.match(page, /Nguồn bước lý tưởng 5 V/)
  assert.match(page, /R1 IN OUT 1e\+4/)
})

test('SPICE handoff discards malformed or unsupported netlists instead of loading them', () => {
  assert.equal(bridge.parseCalculatorSpiceHandoff({ schemaVersion: 1, calculator: 'rc', title: 'bad', assumption: '', netlist: 'unsafe\n.include secret.lib\n.op\n.end' }), undefined)
  assert.equal(bridge.parseCalculatorSpiceHandoff({ schemaVersion: 2, calculator: 'unknown', title: 'bad', assumption: '', netlist: 'unsafe\nV1 a 0 DC 5\n.op\n.end' }), undefined)
})

test('all four valid calculator results offer a direct SPICE action', () => {
  const page = renderToString(createElement(MemoryRouter, { initialEntries: ['/tools/electronics-calculators'] }, createElement(CalculatorPage)))
  assert.equal((page.match(/class="electronics-spice-action"/g) ?? []).length, 4)
})

test('SPICE workbench loads and labels a validated calculator handoff from route state', () => {
  const draft = bridge.createCalculatorSpiceHandoff('adc-divider', { inputMaxVolts: 12, adcMaxVolts: 3.1, lowerResistorKOhms: 10 })
  const page = renderToString(createElement(MemoryRouter, {
    initialEntries: [{ pathname: '/tools/spice', state: { calculatorSpice: draft } }],
  }, createElement(SpicePage)))
  assert.match(page, /Netlist tương đương ·/)
  assert.match(page, /Nguồn Vin lý tưởng/)
  assert.match(page, /R2 OUT 0 1e\+4/)
})

test('SPICE workbench labels LDR assumptions and returns to the matching guided lesson', () => {
  const draft = {
    ...bridge.createCalculatorSpiceHandoff('ldr-divider', { lightPercent: 50 }),
    returnTo: '/build?lesson=analog-ldr&guided=1&board=seeed-xiao-esp32-s3',
  }
  const page = renderToString(createElement(MemoryRouter, {
    initialEntries: [{ pathname: '/tools/spice', state: { calculatorSpice: draft } }],
  }, createElement(SpicePage)))
  assert.match(page, /Bộ chia áp LDR/)
  assert.match(page, /không phải đặc tuyến datasheet/i)
  assert.match(page, /Quay lại bài LDR/)
  assert.match(page, /href="\/build\?lesson=analog-ldr&amp;guided=1&amp;board=seeed-xiao-esp32-s3"/)
  assert.match(page, /R1 VCC MID/)
})

test('LDR builder exposes the SPICE handoff only when the selected board supports its 3.3 V model', () => {
  const renderBuilder = board => renderToString(createElement(MemoryRouter, {
    initialEntries: [`/build?lesson=analog-ldr&guided=1&board=${board}`],
  }, createElement(BuilderPage)))
  const esp32 = renderBuilder('esp32-devkit')
  assert.match(esp32, /Mở bộ chia áp LDR trong SPICE/)
  const esp32LdrButton = esp32.match(/<button[^>]*>Mở bộ chia áp LDR trong SPICE ↗<\/button>/)?.[0] ?? ''
  assert.ok(esp32LdrButton)
  assert.doesNotMatch(esp32LdrButton, /disabled=/)

  const uno = renderBuilder('arduino-uno-r3')
  assert.match(uno, /Mở bộ chia áp LDR trong SPICE/)
  const unoLdrButton = uno.match(/<button[^>]*>Mở bộ chia áp LDR trong SPICE ↗<\/button>/)?.[0] ?? ''
  assert.ok(unoLdrButton)
  assert.match(unoLdrButton, /disabled=/)
  assert.match(uno, /board có mức logic 3,3 V/)
})
