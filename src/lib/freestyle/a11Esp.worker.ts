import type { A2WorkerEvent } from './a2C3Runtime'
import { a11Settings, sampleA11Gpio, type A11WorkerMessage } from './a11EspRuntime'

type Machine = Parameters<typeof sampleA11Gpio>[0] & {
  load_default_rom(): void
  load_firmware(image: Uint8Array): void
  gpio_set_input(pin: number, high: boolean): void
  run_batch(instructions: number): string
  cycles(): number
  cycles_per_us(): number
  faulted(): boolean
  fault_report(): string
}

const output = (message: A2WorkerEvent) => globalThis.postMessage(message)
const { inputGpio, readyLine } = a11Settings.firmware
let machine: Machine | undefined
let pressed = false
let booting = false

async function loadModule(bytes: ArrayBuffer) {
  // The caller checks the digest of these exact bytes before transfer.
  const url = URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }))
  try { return await import(/* @vite-ignore */ url) } finally { URL.revokeObjectURL(url) }
}

globalThis.onmessage = async ({ data }: MessageEvent<A11WorkerMessage>) => {
  pressed = data.pressed
  if (data.type === 'input') {
    machine?.gpio_set_input(inputGpio, !pressed)
    return
  }
  if (booting) return
  booting = true
  try {
    const { flash, engineJs, wasm, cosimJs } = data.assets
    const [engine, bridge] = await Promise.all([loadModule(engineJs), loadModule(cosimJs)])
    await engine.default({ module_or_path: wasm })
    const current: Machine = new engine.WasmEmulator(a11Settings.machine.target)
    machine = current
    current.load_default_rom()
    current.load_firmware(new Uint8Array(flash))
    current.gpio_set_input(inputGpio, !pressed)
    let serial = ''
    for (let batch = 0; batch < 350; batch++) {
      serial = (serial + current.run_batch(250_000)).slice(-8000)
      if (current.faulted()) throw new Error(current.fault_report())
      if (serial.split(/\r?\n/).includes(readyLine)) {
        output({ type: 'uart', text: serial })
        let previous = -1
        const pump = new bridge.CosimPump(current, {}, 1000)
        pump.start((text: string) => output({ type: 'uart', text }), (error: unknown) => {
          output({ type: 'error', message: error instanceof Error ? error.message : String(error) })
        }, { onBatch() {
          const sample = sampleA11Gpio(current)
          if (!sample) return
          const levels = Number(sample.inputHigh) + 2 * Number(sample.outputHigh)
          if (levels === previous) return
          previous = levels
          output({ type: 'sample', sample: { ...sample, timeUs: Math.floor(current.cycles() / current.cycles_per_us()) } })
        } })
        return
      }
      if (batch % 4 === 3) await new Promise<void>(resolve => setTimeout(resolve, 0))
    }
    throw new Error(`Firmware chưa phát tín hiệu khởi động ${readyLine}.`)
  } catch (error) {
    output({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
