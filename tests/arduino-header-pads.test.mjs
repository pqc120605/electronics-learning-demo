import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let models
let otherModels
const references = {
  'arduino-uno-r3': { count: 44, d13: 'IOH0:6', supply: 'POWER0:5', legacy: 25 },
  'arduino-nano-classic': { count: 36, d13: 'J2:15', supply: 'J2:4', legacy: 27 },
  'arduino-mega-2560-r3': { count: 98, d13: 'JP6:5', supply: 'POWER0:5', legacy: 75 },
}

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
  ;({ arduinoBoardModels: models } = await server.ssrLoadModule('/src/data/arduinoBoardModels.ts'))
  const [{ esp32DevkitModel }, { raspberryPiBoardModels }] = await Promise.all([
    server.ssrLoadModule('/src/data/esp32DevkitModel.ts'),
    server.ssrLoadModule('/src/data/raspberryPiBoardModels.ts'),
  ])
  otherModels = [esp32DevkitModel, raspberryPiBoardModels.find(row => row.id === 'raspberry-pi-pico')]
})

after(async () => { await server?.close() })

for (const [id, expected] of Object.entries(references)) {
  test(`${id}: every header pad is selectable with a unique CAD identity and source-verified X/Z position`, async () => {
    const model = models.find((row) => row.id === id)
    assert.equal(model.pinPicking, true)
    assert.equal(model.pins.length, expected.count)
    assert.equal(new Set(model.pins.map(pin => pin.id)).size, expected.count)
    for (let position = 1; position <= expected.legacy; position += 1) {
      assert.ok(model.pins.some(pin => pin.id === `pin-${position}`), `preserve legacy pin-${position}`)
    }
    const padId = pin => `${pin.headerReference}:${pin.padNumber}`
    assert.equal(new Set(model.pins.map(padId)).size, expected.count)
    assert.equal(padId(model.pins.find(pin => pin.label === 'D13' || pin.label === 'D13/PWM')), expected.d13)
    assert.equal(padId(model.pins.find(pin => pin.id === `pin-${expected.legacy - 4}`)), expected.supply)
    const file = new URL(`../src/data/board-components/${id}.json`, import.meta.url)
    const data = JSON.parse(await readFile(file, 'utf8'))
    assert.equal(data.source.license, 'CC BY-SA 4.0')
    assert.match(data.source.sha256, /^[0-9a-f]{64}$/)
    assert.ok(data.maxHeaderCenterErrorMm <= 0.3)
    for (const pin of model.pins) {
      const component = data.components.find(row => row.ref === pin.headerReference)
      const pad = component?.pads.find(row => row.padNumber === pin.padNumber && row.pinId === pin.id)
      assert.ok(pad, padId(pin))
      assert.ok(Math.hypot(pin.anchor[0] * 1000 - pad.xMm - data.modelOffsetMm.x, pin.anchor[2] * 1000 - pad.yMm - data.modelOffsetMm.z) <= 0.001)
    }
  })
}

for (const [id, count, index] of [['esp32-devkit', 30, 0], ['raspberry-pi-pico', 40, 1]]) {
  test(`${id}: component data agrees with each pad in the board model`, async () => {
    const file = new URL(`../src/data/board-components/${id}.json`, import.meta.url)
    const data = JSON.parse(await readFile(file, 'utf8'))
    assert.ok(data.components.length > 20)
    const model = otherModels[index]
    const headerPads = data.components.flatMap(row => row.pads.filter(pad => pad.pinId))
    assert.equal(headerPads.length, count)
    assert.equal(model.pins.length, count)
    for (const pin of model.pins) {
      const header = data.components.find(row => row.ref === pin.headerReference)
      const pad = header?.pads.find(row => row.padNumber === pin.padNumber && row.pinId === pin.id)
      assert.ok(pad, pin.id)
      assert.ok(Math.hypot(pin.anchor[0] * 1000 - pad.xMm - data.modelOffsetMm.x, pin.anchor[2] * 1000 - pad.yMm - data.modelOffsetMm.z) <= 0.001)
    }
  })
}
