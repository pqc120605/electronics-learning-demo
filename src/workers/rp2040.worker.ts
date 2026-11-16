import { createRp2040Machine, type Rp2040Snapshot } from '../lib/rp2040Runner'

export type Rp2040WorkerRequest = { type: 'start'; runId: string; image: Uint8Array } | { type: 'stop'; runId: string }
export type Rp2040WorkerResponse =
  | { type: 'frame' | 'complete'; runId: string; frame: Rp2040Snapshot }
  | { type: 'stopped'; runId: string }
  | { type: 'error'; runId: string; message: string }

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<Rp2040WorkerRequest>) => void) | null
  postMessage: (message: Rp2040WorkerResponse) => void
}

/** Giới hạn 1 giây mô phỏng ở 125 MHz để worker không chạy vô hạn. */
const MAX_CYCLES = 125_000_000
const CHUNK_CYCLES = 1_250_000
let activeRunId: string | undefined

scope.onmessage = (event) => {
  if (event.data.type === 'stop') {
    if (event.data.runId === activeRunId) { activeRunId = undefined; scope.postMessage({ type: 'stopped', runId: event.data.runId }) }
    return
  }
  const { runId } = event.data
  activeRunId = runId
  try {
    const machine = createRp2040Machine(event.data.image)
    const runChunk = () => {
      if (activeRunId !== runId) return
      try {
        const frame = machine.step(CHUNK_CYCLES)
        if (frame.cycles >= MAX_CYCLES) { activeRunId = undefined; scope.postMessage({ type: 'complete', runId, frame }) }
        else { scope.postMessage({ type: 'frame', runId, frame }); setTimeout(runChunk, 0) }
      } catch (error) {
        activeRunId = undefined
        scope.postMessage({ type: 'error', runId, message: error instanceof Error ? error.message : 'Lỗi khi chạy rp2040js.' })
      }
    }
    runChunk()
  } catch (error) {
    activeRunId = undefined
    scope.postMessage({ type: 'error', runId, message: error instanceof Error ? error.message : 'Không khởi tạo được firmware RP2040.' })
  }
}
