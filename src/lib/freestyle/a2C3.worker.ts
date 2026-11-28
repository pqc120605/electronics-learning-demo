import { a2Assets, type A2WorkerEvent, type A2WorkerMessage, type EspGpioTarget } from './a2C3Runtime'

const emit = (message: A2WorkerEvent) => globalThis.postMessage(message)
const baseUrl = new URL(a2Assets, globalThis.location.origin)
// The worker is created on Run. Compile WASM while the page downloads and checks the flash image.
const runtime = Promise.all([
  import(/* @vite-ignore */ new URL('esp_emu.js', baseUrl).href),
  import(/* @vite-ignore */ new URL('cosim.js', baseUrl).href),
]).then(async ([engine, bridge]) => {
  await engine.default({ module_or_path: new URL('esp_emu_bg.wasm', baseUrl) })
  return { engine, bridge } as const
}).catch((error: unknown) => ({ error } as const))
type Emulator = {
  load_default_rom(): void
  load_firmware(image: Uint8Array): void
  gpio_set_input(pin: number, high: boolean): void
  gpio_state(): Uint32Array
  read_memory(address: number, bytes: number): Uint8Array
  cycles(): number
  cycles_per_us(): number
  run_batch(instructions: number): string
  faulted(): boolean
  fault_report(): string
}

let emu: Emulator | undefined
let pressed = false
let booting = false
let gpio: EspGpioTarget = { chip: 'esp32c3', inputPin: 4, inputRegister: 0x6000403c }


async function bootFirmware(machine: Emulator, ready: string) {
  // Boot has no virtual parts to service. Larger batches reduce the IPC and
  // scheduling overhead of the 5,000-instruction interactive pump.

  let serial = ''
  for (let batch = 0; batch < 350; batch++) {
    serial = (serial + machine.run_batch(250_000)).slice(-8000)
    if (machine.faulted()) throw new Error(machine.fault_report())
    if (serial.split(/\r?\n/).includes(ready)) {
      emit({ type: 'uart', text: serial })
      return
    }
    if (batch % 4 === 3) await new Promise<void>(resolve => setTimeout(resolve, 0))
  }
  throw new Error(`Firmware chưa phát tín hiệu khởi động ${ready}.`)
}

globalThis.onmessage = async (event: MessageEvent<A2WorkerMessage>) => {
  const message = event.data
  pressed = message.pressed
  if (message.type === 'input') {
    emu?.gpio_set_input(gpio.inputPin, !pressed)
    return
  }
  if (booting) return
  booting = true
  gpio = message.target ?? gpio
  try {
    const loaded = await runtime
    if ('error' in loaded) throw loaded.error
    emit({ type: 'prepared' })
    const { engine, bridge } = loaded
    const machine: Emulator = new engine.WasmEmulator(gpio.chip)
    emu = machine
    machine.load_default_rom()
    machine.load_firmware(new Uint8Array(message.image))
    machine.gpio_set_input(gpio.inputPin, !pressed)
    if (message.target) await bootFirmware(machine, gpio.readyLine ?? `A3_READY=${gpio.chip}`)
    const ledPin = gpio.ledPin ?? 10
    const pump = new bridge.CosimPump(machine, {}, 1000)
    let lastLevels = -1
    pump.start((text: string) => emit({ type: 'uart', text }), (error: unknown) => {
      emit({ type: 'error', message: error instanceof Error ? error.message : String(error) })
    }, {
      onBatch() {
        const [output, , enable] = machine.gpio_state()
        if (!(enable & (1 << ledPin))) return
        const inputHigh = Boolean(machine.read_memory(gpio.inputRegister, 1)[0] & (1 << gpio.inputPin))
        const outputHigh = Boolean(output & (1 << ledPin))
        const levels = Number(inputHigh) + 2 * Number(outputHigh)
        if (levels === lastLevels) return
        lastLevels = levels
        emit({ type: 'sample', sample: { timeUs: Math.floor(machine.cycles() / machine.cycles_per_us()), inputHigh, outputHigh } })
      },
    })
  } catch (error) {
    emit({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
