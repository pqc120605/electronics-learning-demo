import { createMicroPythonMachine } from '../lib/micropythonRunner'
import { LIVE_MAX_SIMULATED_MS, type LiveWorkerRequest, type LiveWorkerResponse } from '../simulation/liveRuntimeProtocol'

/**
 * Worker chạy MicroPython thật trên rp2040js — 2026-11-14.
 * Máy giả lập được giữ lại giữa các lượt chạy (chỉ soft reset) để không phải khởi động lại MicroPython.
 */
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<LiveWorkerRequest>) => void) | null
  postMessage: (message: LiveWorkerResponse) => void
}

let machine: ReturnType<typeof createMicroPythonMachine> | undefined
let runId: string | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let lastPhase = ''

const phaseText: Record<string, string> = {
  booting: 'Đang khởi động MicroPython trên RP2040 giả lập…',
  'entering-raw': 'Đang vào raw REPL…',
  resetting: 'Soft reset MicroPython…',
  sending: 'Đang gửi code qua USB CDC…',
  running: 'MicroPython đang chạy code của bạn.',
  idle: 'Chương trình đã kết thúc; chân giữ trạng thái cuối.',
}

function loop(currentRun: string) {
  if (!machine || runId !== currentRun) return
  const started = performance.now()
  try {
    const frame = machine.runFor(20)
    const cost = performance.now() - started
    if (frame.phase !== lastPhase) { lastPhase = frame.phase; scope.postMessage({ type: 'status', runId: currentRun, text: phaseText[frame.phase] ?? frame.phase }) }
    scope.postMessage({ type: 'frame', runId: currentRun, frame: { pins: frame.pins, serial: frame.output + (frame.error ? `\n${frame.error}` : ''), simulatedMilliseconds: frame.simulatedMilliseconds, speed: Math.min(1, 20 / Math.max(1, cost)) } })
    if (frame.error) scope.postMessage({ type: 'error', runId: currentRun, message: frame.error.trim().split('\n').at(-1) ?? 'Lỗi MicroPython.' })
    if (frame.simulatedMilliseconds >= LIVE_MAX_SIMULATED_MS) { runId = undefined; scope.postMessage({ type: 'stopped', runId: currentRun, reason: 'Đã chạy 10 phút mô phỏng, tự dừng.' }); return }
  } catch (error) {
    runId = undefined
    machine = undefined
    scope.postMessage({ type: 'error', runId: currentRun, message: error instanceof Error ? error.message : 'Lỗi rp2040js.' })
    return
  }
  timer = setTimeout(() => loop(currentRun), 0)
}

scope.onmessage = (event) => {
  const message = event.data
  if (message.type === 'start') {
    if (message.engine !== 'micropython') return
    if (timer) clearTimeout(timer)
    if (runId) scope.postMessage({ type: 'stopped', runId, reason: 'Bắt đầu lượt chạy mới.' })
    runId = message.runId
    lastPhase = ''
    try {
      machine ??= createMicroPythonMachine({ bootrom: new Uint8Array(message.bootrom), firmware: new Uint8Array(message.firmware) })
      machine.submit(message.code)
      loop(message.runId)
    } catch (error) {
      runId = undefined
      scope.postMessage({ type: 'error', runId: message.runId, message: error instanceof Error ? error.message : 'Không khởi tạo được MicroPython.' })
    }
    return
  }
  if (!machine || message.runId !== runId) return
  if (message.type === 'stop') {
    if (timer) clearTimeout(timer)
    runId = undefined
    scope.postMessage({ type: 'stopped', runId: message.runId, reason: 'Người dùng dừng.' })
  } else if (message.type === 'digital') machine.setDigitalInput(message.pin, message.level)
  else if (message.type === 'analog') machine.setAnalogInput(message.pin, message.ratio)
}
