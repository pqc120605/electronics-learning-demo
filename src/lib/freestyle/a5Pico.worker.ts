import type { A2Sample, A2WorkerEvent } from './a2C3Runtime'
import { createA5Machine } from './a5PicoMachine'
import type { A5WorkerMessage } from './a5PicoRuntime'

const emit = (message: A2WorkerEvent) => globalThis.postMessage(message)
let machine: ReturnType<typeof createA5Machine> | undefined

globalThis.onmessage = ({ data }: MessageEvent<A5WorkerMessage>) => {
  if (data.type === 'input') {
    machine?.setPressed(data.pressed)
    return
  }
  if (machine) return
  const { sdkBoard } = data
  const report = (error: unknown) => emit({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  try {
    let serial = ''
    let readyText = ''
    let ready = false
    let last: A2Sample | undefined
    const target = createA5Machine(new Uint8Array(data.flash), new Uint8Array(data.bootrom), text => { serial += text })
    machine = target
    target.setPressed(data.pressed)

    function tick() {
      try {
        for (let index = 0; index < 4; index++) {
          target.step()
          if (serial) {
            emit({ type: 'uart', text: serial })
            if (!ready) {
              readyText = (readyText + serial).slice(-4096)
              const lines = readyText.split(/\r?\n/)
              lines.pop()
              ready = lines.includes(`A5_READY=${sdkBoard}`)
            }
            serial = ''
          }
          const sample = ready && target.sample()
          if (sample && (sample.inputHigh !== last?.inputHigh || sample.outputHigh !== last?.outputHigh)) {
            last = sample
            emit({ type: 'sample', sample })
          }
        }
        setTimeout(tick, 0)
      } catch (error) {
        report(error)
      }
    }

    tick()
  } catch (error) {
    report(error)
  }
}
