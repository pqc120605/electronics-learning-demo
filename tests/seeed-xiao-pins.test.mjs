import assert from 'node:assert/strict'
import { test } from 'node:test'

test('KiCad pad-local coordinates rotate around the footprint origin', async () => {
  const { transformPadToBoard } = await import('../scripts/kicadPadCoordinates.mjs')

  assert.deepEqual(transformPadToBoard({ x: 148.4376, y: 112.6236, rotation: 90 }, { x: 0, y: -7.62 }), [156.0576, 112.6236])
  assert.deepEqual(transformPadToBoard({ x: 148.4376, y: 97.3836, rotation: -90 }, { x: 0, y: -7.62 }), [140.8176, 97.3836])
})

test('XIAO ESP32-C3 exposes all 14 CAD-anchored header pins with documented chip mappings', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  const { seeedXiaoEsp32C3BoardModel } = await server.ssrLoadModule('/src/data/seeedXiaoEsp32C3BoardModel.ts')
  await server.close()

  const model = seeedXiaoEsp32C3BoardModel
  assert.equal(model.pinPicking, true)
  assert.equal(model.pins.length, 14)
  assert.deepEqual(model.pins.find((pin) => pin.label === 'D0')?.anchor, [0.1408176, 0.00155, 0.0980186])
  assert.deepEqual(model.pins.find((pin) => pin.label === 'D10')?.anchor, [0.1484376, 0.00155, 0.1119886])
  assert.equal(model.pins.find((pin) => pin.label === 'D0')?.gpio, 2)
  assert.equal(model.pins.find((pin) => pin.label === 'D4')?.gpio, 6)
  assert.equal(model.pins.find((pin) => pin.label === 'D7')?.gpio, 20)
  assert.equal(model.pins.find((pin) => pin.label === 'D9')?.gpio, 9)
  assert.ok(model.pins.find((pin) => pin.label === 'D9')?.safetyNote.includes('strapping'))
  assert.ok(model.pins.every((pin) => pin.connection.includes('PCB KiCad v1.3')))
})

