import { GPIOPinState, Simulator, USBCDC } from 'rp2040js'
import { parseUf2 } from './rp2040Runner'
import type { LivePinState } from './avrLiveMachine'

/**
 * Chạy MicroPython thật trên RP2040 giả lập (rp2040js) — 2026-11-14.
 * - Firmware: UF2 MicroPython chính thức cho RPI_PICO (MIT), nạp vào flash như khi kéo thả vào ổ RPI-RP2.
 * - Bootrom: B2 chính thức của Raspberry Pi, do dịch vụ cục bộ tải về máy (không đóng gói trong repo).
 * - Code người dùng gửi qua USB CDC bằng raw REPL (Ctrl-A … Ctrl-D), giống công cụ mpremote.
 * Mô phỏng CPU + ngoại vi số; không mô phỏng điện. Tốc độ thường chậm hơn thời gian thực.
 */
export type MicroPythonPhase = 'booting' | 'entering-raw' | 'resetting' | 'sending' | 'running' | 'idle'
export type MicroPythonFrame = {
  phase: MicroPythonPhase
  pins: Record<number, LivePinState>
  /** Output chương trình mới (đã bỏ ký tự giao thức raw REPL). */
  output: string
  /** Traceback nếu chương trình lỗi. */
  error?: string
  simulatedMilliseconds: number
}

const CYCLE_NANOS = 1e9 / 125_000_000
const RAW_PROMPT = 'raw REPL; CTRL-B to exit\r\n>'
const PICO_ADC_PINS: Record<number, number> = { 26: 0, 27: 1, 28: 2, 29: 3 }

/**
 * Bộ tách giao thức raw REPL: đầu ra sau "OK" là stdout, giữa hai ký tự 0x04 là stderr (traceback).
 * Tách riêng để kiểm thử không cần CPU giả lập.
 */
export function createRawReplParser() {
  let state: 'await-ok' | 'stdout' | 'stderr' | 'done' = 'await-ok'
  let pending = ''
  return {
    get state() { return state },
    reset() { state = 'await-ok'; pending = '' },
    push(text: string): { stdout: string; stderr: string; finished: boolean } {
      let stdout = '', stderr = ''
      for (const char of text) {
        if (state === 'await-ok') {
          pending = (pending + char).slice(-2)
          if (pending === 'OK') state = 'stdout'
        } else if (state === 'stdout') {
          if (char === '\x04') state = 'stderr'
          else stdout += char
        } else if (state === 'stderr') {
          if (char === '\x04') state = 'done'
          else stderr += char
        }
      }
      return { stdout, stderr, finished: state === 'done' }
    },
  }
}

export function createMicroPythonMachine({ bootrom, firmware }: { bootrom: Uint8Array; firmware: Uint8Array }) {
  if (bootrom.length !== 16 * 1024) throw new Error('Bootrom RP2040 phải đúng 16 KB.')
  const simulator = new Simulator()
  const mcu = simulator.rp2040
  const clock = simulator.clock
  mcu.logger = { debug() {}, info() {}, warn() {}, error() {} }
  const rom = new Uint32Array(4096)
  new Uint8Array(rom.buffer).set(bootrom)
  mcu.loadBootrom(rom)
  mcu.flash.set(parseUf2(firmware))
  // Bắt đầu từ boot2 ở đầu flash, như rp2040js làm khi chạy MicroPython.
  mcu.core.PC = 0x10000000

  const cdc = new USBCDC(mcu.usbCtrl)
  let received = ''
  let connected = false
  cdc.onDeviceConnected = () => { connected = true; cdc.sendSerialByte(13) }
  cdc.onSerialData = (buffer) => { received += String.fromCharCode(...buffer) }
  const outbox: number[] = []
  const send = (text: string) => { for (const byte of new TextEncoder().encode(text)) outbox.push(byte) }

  type Track = { level: boolean; since: number; high: number; edges: number }
  const tracks = new Map<number, Track>()
  let windowStart = 0
  mcu.gpio.forEach((pin, index) => pin.addListener((state) => {
    if (state !== GPIOPinState.High && state !== GPIOPinState.Low) return
    const level = state === GPIOPinState.High
    // Trên chip thật, bộ đệm vào của pad đọc lại mức đang xuất; rp2040js không tự làm nên Pin.value() trả 0.
    pin.setInputValue(level)
    const track = tracks.get(index)
    if (!track) { tracks.set(index, { level, since: clock.nanos, high: 0, edges: 0 }); return }
    if (track.level === level) return
    if (track.level) track.high += clock.nanos - Math.max(track.since, windowStart)
    track.level = level
    track.since = clock.nanos
    track.edges += 1
  }))

  let phase: MicroPythonPhase = 'booting'
  let pendingCode: string | null = null
  let hasRun = false
  const parser = createRawReplParser()
  let output = ''
  let error = ''

  function advanceProtocol() {
    if (phase === 'booting' && connected && received.includes('>>> ')) { received = ''; phase = 'idle' }
    if (phase === 'idle' && pendingCode !== null) { received = ''; send('\r\x03\x03\x02\x01'); phase = 'entering-raw' }
    if (phase === 'entering-raw' && received.includes(RAW_PROMPT)) {
      received = ''
      if (hasRun) { send('\x04'); phase = 'resetting' } // soft reset để chân và biến về trạng thái đầu
      else phase = 'sending'
    }
    if (phase === 'resetting' && received.includes(RAW_PROMPT)) { received = ''; phase = 'sending' }
    if (phase === 'sending' && pendingCode !== null) {
      parser.reset()
      send(pendingCode.replace(/\r\n?/g, '\n'))
      send('\x04')
      pendingCode = null
      hasRun = true
      phase = 'running'
    }
    if (phase === 'running' && received) {
      const chunk = parser.push(received)
      received = ''
      output += chunk.stdout
      error += chunk.stderr
      if (chunk.finished) phase = 'idle'
    }
  }

  function pinStates(): Record<number, LivePinState> {
    const result: Record<number, LivePinState> = {}
    const windowNanos = Math.max(1, clock.nanos - windowStart)
    mcu.gpio.forEach((pin, index) => {
      if (index > 29) return
      const state = pin.value
      if (state === GPIOPinState.Input && !pin.inputValue) return
      const output = state === GPIOPinState.High || state === GPIOPinState.Low
      const track = tracks.get(index)
      let pwm: number | undefined
      if (output && track && track.edges >= 4) pwm = Math.min(1, (track.high + (track.level ? clock.nanos - Math.max(track.since, windowStart) : 0)) / windowNanos)
      result[index] = {
        mode: output ? 'output' : state === GPIOPinState.InputPullUp ? 'input_pullup' : 'input',
        level: output ? state === GPIOPinState.High : pin.inputValue,
        ...(pwm === undefined ? {} : { pwm }),
      }
    })
    for (const track of tracks.values()) { track.high = 0; track.edges = 0 }
    windowStart = clock.nanos
    return result
  }

  return {
    get phase() { return phase },
    /** Nạp code: chạy ngay khi REPL sẵn sàng (sau khi khởi động hoặc sau soft reset). */
    submit(code: string) {
      pendingCode = code; output = ''; error = ''
      // Chương trình cũ còn chạy: Ctrl-C, về REPL thường (Ctrl-B) rồi vào lại raw REPL.
      if (phase !== 'booting') phase = 'idle'
    },
    runFor(milliseconds: number): MicroPythonFrame {
      const end = clock.nanos + Math.min(250, Math.max(0, milliseconds)) * 1e6
      while (clock.nanos < end) {
        // Đẩy dữ liệu gửi vào FIFO USB khi còn chỗ (FIFO đầy sẽ bỏ byte).
        while (outbox.length && cdc.txFIFO.itemCount < cdc.txFIFO.size) cdc.sendSerialByte(outbox.shift()!)
        const sliceEnd = Math.min(end, clock.nanos + 1e6)
        while (clock.nanos < sliceEnd) {
          if (mcu.core.waiting) {
            const wait = clock.nanosToNextAlarm
            if (!(wait > 0) || !Number.isFinite(wait)) { clock.tick(sliceEnd - clock.nanos); break }
            clock.tick(Math.min(wait, sliceEnd - clock.nanos + CYCLE_NANOS))
          } else {
            clock.tick(mcu.core.executeInstruction() * CYCLE_NANOS)
          }
        }
        advanceProtocol()
      }
      const frame: MicroPythonFrame = { phase, pins: pinStates(), output, ...(error ? { error } : {}), simulatedMilliseconds: clock.nanos / 1e6 }
      output = ''
      return frame
    },
    setDigitalInput(pin: number, level: boolean) { mcu.gpio[pin]?.setInputValue(level) },
    /** `ratio` 0..1 của 3,3 V; chỉ GP26–GP29 có ADC. */
    setAnalogInput(pin: number, ratio: number) {
      const channel = PICO_ADC_PINS[pin]
      if (channel !== undefined) mcu.adc.channelValues[channel] = Math.round(Math.min(1, Math.max(0, ratio)) * 4095)
    },
  }
}
