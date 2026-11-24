import { createAvrLiveMachine, isAvrLiveBoard } from '../lib/avrLiveMachine'
import { LIVE_MAX_SIMULATED_MS, type LiveWorkerRequest, type LiveWorkerResponse } from '../simulation/liveRuntimeProtocol'

/** Worker chạy firmware AVR thật (hex từ arduino-cli) theo nhịp thời gian thực — 2026-11-14. */
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<LiveWorkerRequest>) => void) | null
  postMessage: (message: LiveWorkerResponse) => void
}

let active: { runId: string; machine: ReturnType<typeof createAvrLiveMachine>; timer?: ReturnType<typeof setTimeout> } | undefined

function stop(reason: string) {
  if (!active) return
  if (active.timer) clearTimeout(active.timer)
  scope.postMessage({ type: 'stopped', runId: active.runId, reason })
  active = undefined
}

scope.onmessage = (event) => {
  const message = event.data
  if (message.type === 'start') {
    stop('Bắt đầu lượt chạy mới.')
    if (message.engine !== 'avr' || !isAvrLiveBoard(message.board)) {
      scope.postMessage({ type: 'error', runId: message.runId, message: 'Board không chạy được firmware AVR.' })
      return
    }
    try {
      const machine = createAvrLiveMachine(message.hex, message.board)
      for (const input of message.inputs) {
        machine.setDigitalInput(input.pin, input.digital)
        machine.setAnalogInput(input.pin, input.analog)
      }
      const run = { runId: message.runId, machine, timer: undefined as ReturnType<typeof setTimeout> | undefined }
      active = run
      let last = performance.now()
      const tick = () => {
        if (active !== run) return
        const now = performance.now()
        const elapsed = Math.min(50, Math.max(1, now - last))
        last = now
        try {
          const started = performance.now()
          const frame = machine.runFor(elapsed)
          const cost = performance.now() - started
          scope.postMessage({ type: 'frame', runId: run.runId, frame: { pins: frame.pins, serial: frame.serial, simulatedMilliseconds: frame.simulatedMilliseconds, speed: Math.min(1, elapsed / Math.max(elapsed, cost)) } })
          if (frame.simulatedMilliseconds >= LIVE_MAX_SIMULATED_MS) { stop('Đã chạy 10 phút mô phỏng, tự dừng.'); return }
        } catch (error) {
          scope.postMessage({ type: 'error', runId: run.runId, message: error instanceof Error ? error.message : 'Lỗi khi chạy AVR.' })
          active = undefined
          return
        }
        run.timer = setTimeout(tick, 16)
      }
      tick()
    } catch (error) {
      scope.postMessage({ type: 'error', runId: message.runId, message: error instanceof Error ? error.message : 'Không nạp được firmware AVR.' })
    }
    return
  }
  if (!active || message.runId !== active.runId) return
  if (message.type === 'stop') stop('Người dùng dừng.')
  else if (message.type === 'digital') active.machine.setDigitalInput(message.pin, message.level)
  else if (message.type === 'analog') active.machine.setAnalogInput(message.pin, message.ratio)
}
