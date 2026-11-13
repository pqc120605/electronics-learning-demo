import { createAtmega328pMachine } from '../lib/avr8jsRunner'
import type { AVR8jsWorkerRequest, AVR8jsWorkerResponse } from '../simulation/avr8jsProtocol'

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<AVR8jsWorkerRequest>) => void) | null
  postMessage: (message: AVR8jsWorkerResponse) => void
}

let activeRunId: string | undefined

scope.onmessage = (event) => {
  if (event.data.type === 'stop') {
    if (event.data.runId === activeRunId) {
      activeRunId = undefined
      scope.postMessage({ type: 'stopped', runId: event.data.runId })
    }
    return
  }
  const { runId } = event.data
  activeRunId = runId
  try {
    const machine = createAtmega328pMachine(event.data.hex, event.data.targetId)
    let nextProgressCycles = 1_000_000
    const runChunk = () => {
      if (activeRunId !== runId) return
      try {
        const frame = machine.step(200_000)
        if (frame.cycles >= machine.maxCycles) {
          activeRunId = undefined
          scope.postMessage({ type: 'complete', runId, frame })
        }
        else {
          if (frame.cycles >= nextProgressCycles) {
            scope.postMessage({ type: 'frame', runId, frame })
            nextProgressCycles += 1_000_000
          }
          setTimeout(runChunk, 0)
        }
      } catch (error) {
        activeRunId = undefined
        scope.postMessage({ type: 'error', runId, message: error instanceof Error ? error.message : 'Lỗi khi chạy AVR8js.' })
      }
    }
    runChunk()
  } catch (error) {
    activeRunId = undefined
    scope.postMessage({ type: 'error', runId, message: error instanceof Error ? error.message : 'Không khởi tạo được firmware AVR.' })
  }
}
