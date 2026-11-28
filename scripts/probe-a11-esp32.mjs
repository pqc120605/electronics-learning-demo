import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import { a11Approval, a11AssetDir, digestA11, readA11LockedFile } from './a11-esp32-assets.mjs'

export async function createA11Machine(runtime, flash) {
  const manifest = JSON.parse(await readFile(resolve(a11AssetDir, 'image/manifest.json'), 'utf8'))
  assert.equal(manifest.approvalSha256, a11Approval)
  assert.equal(digestA11(flash), manifest.flash.sha256)
  runtime.assertA11Image(flash)
  runtime.assertA11Source(flash, manifest.sourceSha256)
  await readA11LockedFile(resolve(a11AssetDir, 'engine/esp_emu.js'), manifest.engine['esp_emu.js'].sha256)
  const wasm = await readA11LockedFile(resolve(a11AssetDir, 'engine/esp_emu_bg.wasm'), manifest.engine['esp_emu_bg.wasm'].sha256)
  const engine = await import(pathToFileURL(resolve(a11AssetDir, 'engine/esp_emu.js')).href)
  await engine.default({ module_or_path: wasm })
  const machine = new engine.WasmEmulator('esp32')
  try {
    machine.load_default_rom()
    machine.load_firmware(flash)
    const input = runtime.a11Settings.firmware.inputGpio
    machine.gpio_set_input(input, true)
    const cyclesPerUs = machine.cycles_per_us()
    const read = () => {
      const pins = runtime.sampleA11Gpio(machine)
      if (!pins) throw new Error('A11 never enabled GPIO26 as output')
      return { ...pins, timeUs: Math.floor(machine.cycles() / cyclesPerUs) }
    }
    function run(instructions) {
      const serial = machine.run_batch(instructions)
      if (machine.faulted()) throw new Error(machine.fault_report())
      return serial
    }
    let serial = ''
    let ready = false
    const readyLine = runtime.a11Settings.firmware.readyLine
    for (let batch = 0; batch < 350 && !ready; batch++) {
      serial = (serial + run(250_000)).slice(-8000)
      ready = serial.split(/\r?\n/).includes(readyLine)
    }
    if (!ready) throw new Error('A11 firmware did not boot: ' + serial)
    read()
    return {
      serial,
      step(pressed, ms) {
        machine.gpio_set_input(input, !pressed)
        const end = machine.cycles() + ms * 1000 * cyclesPerUs
        let serial = ''
        let limit = 0
        while (machine.cycles() < end && limit++ < 10_000) {
          serial += run(Math.min(5000, Math.max(1, end - machine.cycles())))
        }
        if (machine.cycles() < end) throw new Error('A11 simulation clock did not advance')
        return { ...read(), serial }
      },
      close() { machine.free() },
    }
  } catch (error) {
    machine.free()
    throw error
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const vite = await createServer({ configFile: false, envFile: false, logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null } })
  try {
    const runtime = await vite.ssrLoadModule('/src/lib/freestyle/a11EspRuntime.ts')
    const machine = await createA11Machine(runtime, await readFile(resolve(a11AssetDir, 'image/flash.bin')))
    try {
      const states = [machine.step(false, 80), machine.step(true, 20), machine.step(true, 60), machine.step(false, 60)]
      assert.deepEqual(states.map(frame => [frame.inputHigh, frame.outputHigh]), [[true, false], [false, false], [false, true], [true, false]])
      console.log(JSON.stringify({ ready: runtime.a11Settings.firmware.readyLine, states }))
    } finally { machine.close() }
  } finally { await vite.close() }
}
