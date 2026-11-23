import { compileSketch, type SketchSnapshot } from '../sketchInterpreter'
import type { LivePinState } from '../avrLiveMachine'
import type { LiveWorkerRequest, LiveWorkerResponse } from '../../simulation/liveRuntimeProtocol'
import { getFreestyleBoard, sketchBoardFor, type FreestyleEngine, type FreestyleLanguage } from './freestyleCircuit'
import { apiRequest } from '../api'

/**
 * Chọn và điều khiển engine chạy code cho bàn lắp mạch tự do (2026-11-14):
 * - Uno/Nano/Mega + dịch vụ cục bộ: biên dịch thật bằng arduino-cli → firmware chạy trên avr8js.
 * - Pico + MicroPython + dịch vụ cục bộ: MicroPython chính thức chạy trên rp2040js.
 * - Còn lại hoặc bản web tĩnh: trình thông dịch Arduino C++ rút gọn (ghi rõ trên giao diện).
 */
export type LocalTools = { arduinoCli: boolean; rp2040Bootrom: string; boards: string[] }
export type RuntimeFrame = { pins: Record<number, LivePinState>; serial: string; simulatedMilliseconds: number; speed?: number }
export type RuntimeCallbacks = {
  onFrame: (frame: RuntimeFrame) => void
  onStatus: (text: string) => void
  onError: (message: string, line?: number) => void
  onStopped: (reason: string) => void
}
export type RuntimeController = { engine: FreestyleEngine; setDigital(pin: number, level: boolean): void; setAnalog(pin: number, ratio: number): void; stop(): void }

const API = '/api/local-tools'
export const MICROPYTHON_FIRMWARE_PATH = 'firmware/micropython/RPI_PICO-20260824-v1.29.0.uf2'

let toolsPromise: Promise<LocalTools | null> | undefined
/** Hỏi dịch vụ cục bộ (chỉ có khi chạy `vite` dev/preview trên máy). Bản tĩnh trả null. */
export function detectLocalTools(force = false): Promise<LocalTools | null> {
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
    return Promise.resolve(null)
  }
  if (!force && toolsPromise) return toolsPromise
  toolsPromise = (async () => {
    try {
      const response = await apiRequest(API + '/health')
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
      const body = await response.json() as Partial<LocalTools> & { ok?: boolean }
      return body.ok ? { arduinoCli: Boolean(body.arduinoCli), rp2040Bootrom: String(body.rp2040Bootrom ?? ''), boards: Array.isArray(body.boards) ? body.boards.map(String) : [] } : null
    } catch { return null }
  })()
  return toolsPromise
}

export function chooseEngine(boardId: string, language: FreestyleLanguage, tools: LocalTools | null): { engine: FreestyleEngine; label: string; note: string } {
  const board = getFreestyleBoard(boardId)
  if (language === 'micropython') {
    return tools
      ? { engine: 'micropython', label: 'MicroPython thật · rp2040js', note: 'MicroPython v1.29 chính thức chạy trên CPU RP2040 giả lập; mô phỏng, không phải đo trên board thật.' }
      : { engine: 'micropython', label: 'Cần dịch vụ cục bộ', note: 'MicroPython cần dịch vụ cục bộ (npm.cmd run dev) để lấy bootrom RP2040. Chuyển sang Arduino C++ để chạy bằng trình thông dịch rút gọn.' }
  }
  if (board.realEngine === 'avr' && tools?.arduinoCli && tools.boards.includes(boardId)) return { engine: 'avr', label: 'arduino-cli + avr8js', note: 'Biên dịch thật bằng arduino-cli trên máy, firmware .hex chạy trên lõi ATmega giả lập (avr8js).' }
  return { engine: 'interpreter', label: 'Trình thông dịch rút gọn', note: `Chạy bằng trình thông dịch rút gọn: không biên dịch, chỉ một tập con Arduino C++. ${board.limitation}` }
}

export async function compileOnLocalService(boardId: string, source: string): Promise<{ ok: boolean; hex?: string; log: string }> {
  const response = await apiRequest(API + '/compile', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ board: boardId, source }),
  }, [400, 403, 404, 413, 415, 422, 429, 500, 503])
  const body = await response.json().catch(() => ({})) as { ok?: boolean; hex?: string; log?: string; message?: string }
  return { ok: Boolean(body.ok && body.hex), ...(body.hex ? { hex: body.hex } : {}), log: body.log ?? body.message ?? `HTTP ${response.status}` }
}

/** Dòng lỗi đầu tiên của gcc: "<sketch>/sketch.ino:5:3: error: …". */
export function firstCompileError(log: string): { line?: number; message: string } {
  const match = /sketch\.ino:(\d+):(?:\d+:)?\s*(?:fatal )?error:\s*(.+)/.exec(log)
  return match ? { line: Number(match[1]), message: match[2].trim() } : { message: log.trim().split('\n').slice(-3).join(' ') || 'Biên dịch thất bại.' }
}

let micropythonAssets: Promise<{ bootrom: ArrayBuffer; firmware: ArrayBuffer }> | undefined
function loadMicroPythonAssets() {
  micropythonAssets ??= (async () => {
    const [bootrom, firmware] = await Promise.all([
      apiRequest(API + '/rp2040-bootrom').then(response => response.arrayBuffer()),
      fetch(`${import.meta.env.BASE_URL}${MICROPYTHON_FIRMWARE_PATH}`).then(response => { if (!response.ok) throw new Error('Không tải được firmware MicroPython.'); return response.arrayBuffer() }),
    ])
    return { bootrom, firmware }
  })().catch(error => { micropythonAssets = undefined; throw error })
  return micropythonAssets
}

let micropythonWorker: Worker | undefined
const newRunId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function attachWorker(worker: Worker, runId: string, callbacks: RuntimeCallbacks, persistent: boolean): RuntimeController['stop'] {
  const listener = (event: MessageEvent<LiveWorkerResponse>) => {
    const message = event.data
    if (message.runId !== runId) return
    if (message.type === 'frame') callbacks.onFrame(message.frame)
    else if (message.type === 'status') callbacks.onStatus(message.text)
    else if (message.type === 'error') callbacks.onError(message.message)
    else if (message.type === 'stopped') { callbacks.onStopped(message.reason); worker.removeEventListener('message', listener) }
  }
  worker.addEventListener('message', listener)
  return () => {
    worker.postMessage({ type: 'stop', runId } satisfies LiveWorkerRequest)
    if (!persistent) setTimeout(() => worker.terminate(), 50)
  }
}

export async function startFreestyleRun(options: { boardId: string; language: FreestyleLanguage; code: string; tools: LocalTools | null } & RuntimeCallbacks): Promise<RuntimeController | null> {
  const choice = chooseEngine(options.boardId, options.language, options.tools)
  const runId = newRunId()

  if (choice.engine === 'micropython') {
    if (!options.tools) { options.onError(choice.note); return null }
    options.onStatus('Đang tải MicroPython và bootrom RP2040…')
    let assets
    try { assets = await loadMicroPythonAssets() } catch (error) { options.onError(error instanceof Error ? error.message : 'Không tải được MicroPython.'); return null }
    micropythonWorker ??= new Worker(new URL('../../workers/micropython.worker.ts', import.meta.url), { type: 'module' })
    const worker = micropythonWorker
    const stop = attachWorker(worker, runId, options, true)
    // Sao chép buffer: worker giữ máy đã khởi động, lượt sau vẫn cần bản gốc.
    worker.postMessage({ type: 'start', runId, engine: 'micropython', bootrom: assets.bootrom.slice(0), firmware: assets.firmware.slice(0), code: options.code } satisfies LiveWorkerRequest)
    return { engine: 'micropython', stop, setDigital: (pin, level) => worker.postMessage({ type: 'digital', runId, pin, level } satisfies LiveWorkerRequest), setAnalog: (pin, ratio) => worker.postMessage({ type: 'analog', runId, pin, ratio } satisfies LiveWorkerRequest) }
  }

  if (choice.engine === 'avr') {
    options.onStatus('Đang biên dịch bằng arduino-cli…')
    let result
    try { result = await compileOnLocalService(options.boardId, options.code) } catch { result = { ok: false, log: 'Mất kết nối dịch vụ cục bộ.' } }
    if (!result.ok || !result.hex) { const error = firstCompileError(result.log); options.onError(`Lỗi biên dịch: ${error.message}`, error.line); return null }
    options.onStatus('Biên dịch xong. Firmware đang chạy trên avr8js.')
    const worker = new Worker(new URL('../../workers/avrLive.worker.ts', import.meta.url), { type: 'module' })
    const stop = attachWorker(worker, runId, options, false)
    worker.postMessage({ type: 'start', runId, engine: 'avr', board: options.boardId, hex: result.hex } satisfies LiveWorkerRequest)
    return { engine: 'avr', stop, setDigital: (pin, level) => worker.postMessage({ type: 'digital', runId, pin, level } satisfies LiveWorkerRequest), setAnalog: (pin, ratio) => worker.postMessage({ type: 'analog', runId, pin, ratio } satisfies LiveWorkerRequest) }
  }

  const compiled = compileSketch(options.code, sketchBoardFor(options.boardId))
  if (!compiled.ok) { options.onError(compiled.error.message, compiled.error.line); return null }
  const run = compiled.run
  options.onStatus('Đang chạy bằng trình thông dịch rút gọn (thời gian ảo).')
  let frameId: number | null = null
  let last = performance.now()
  let serialLength = 0
  const toFrame = (snapshot: SketchSnapshot): RuntimeFrame => {
    const pins: Record<number, LivePinState> = {}
    for (const [pin, state] of Object.entries(snapshot.pins)) if (state.mode !== 'unset') pins[Number(pin)] = { mode: state.mode, level: state.level, ...(state.pwm === undefined ? {} : { pwm: state.pwm }) }
    const serial = snapshot.serial.length >= serialLength ? snapshot.serial.slice(serialLength) : snapshot.serial
    serialLength = snapshot.serial.length
    return { pins, serial, simulatedMilliseconds: snapshot.simulatedMilliseconds }
  }
  const tick = (now: number) => {
    const elapsed = Math.min(100, Math.max(0, now - last))
    last = now
    const snapshot = run.advance(elapsed)
    options.onFrame(toFrame(snapshot))
    if (snapshot.error) { options.onError(snapshot.error.message, snapshot.error.line); frameId = null; return }
    if (snapshot.phase === 'stopped') { options.onStopped('Chương trình đã dừng.'); frameId = null; return }
    frameId = requestAnimationFrame(tick)
  }
  frameId = requestAnimationFrame(tick)
  return {
    engine: 'interpreter',
    stop() { if (frameId !== null) cancelAnimationFrame(frameId); frameId = null; run.stop(); options.onStopped('Người dùng dừng.') },
    setDigital: (pin, level) => run.setDigitalInput(pin, level),
    setAnalog: (pin, ratio) => run.setAnalogInput(pin, ratio),
  }
}
