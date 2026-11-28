
import type { A2Sample, A2WorkerEvent } from './a2C3Runtime'
import { createA6Machine, type A6EmulatorFactory } from './a6PicoMachine'
import { a6ReadyLine } from './a6PicoProfiles'
import type { A6WorkerMessage } from './a6PicoRuntime'

const emit = (event: A2WorkerEvent) => globalThis.postMessage(event)
let booted = false
let pressed = false

globalThis.onmessage = ({ data }: MessageEvent<A6WorkerMessage>) => {
  pressed = data.pressed
  if (data.type === 'input' || booted) return
  booted = true
  void run(data)
}

async function run({ elf, wrapper, wasm }: Extract<A6WorkerMessage, { type: 'boot' }>) {
  const report = (error: unknown) => emit({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  const moduleUrl = URL.createObjectURL(new Blob([wrapper], { type: 'text/javascript' }))
  const wasmUrl = URL.createObjectURL(new Blob([wasm], { type: 'application/wasm' }))
  try {
    // Import the same bytes that passed the SHA-256 check on the page.
    const { default: create } = await import(/* @vite-ignore */ moduleUrl) as { default: A6EmulatorFactory }
    // Emscripten resolves a WASM URL even with wasmBinary supplied. Relative URLs cannot use a blob module as their base.
    const mcu = await create({ wasmBinary: new Uint8Array(wasm), locateFile: () => wasmUrl, print: () => {}, printErr: () => {} })
    let ready = false
    let partialUart = ''
    let sample: A2Sample | undefined
    const machine = createA6Machine(mcu, new Uint8Array(elf), text => {
      emit({ type: 'uart', text })
      if (ready) return
      const lines = (partialUart + text).split(/\r?\n/)
      partialUart = (lines.pop() ?? '').slice(-256)
      ready = lines.includes(a6ReadyLine)
    })

    function tick() {
      try {
        // One input change per scheduled slice also bounds allocations in the runner's script loader.
        machine.setPressed(pressed)
        for (let index = 0; index < 4; index++) {
          machine.step()
          const next = ready && machine.sample()
          if (next && (next.inputHigh !== sample?.inputHigh || next.outputHigh !== sample?.outputHigh)) {
            sample = next
            emit({ type: 'sample', sample })
          }
        }
        setTimeout(tick, 8)
      } catch (error) {
        report(error)
      }
    }

    tick()
  } catch (error) {
    report(error)
  } finally {
    URL.revokeObjectURL(moduleUrl)
    URL.revokeObjectURL(wasmUrl)
  }
}
