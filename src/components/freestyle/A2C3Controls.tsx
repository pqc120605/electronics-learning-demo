import { useEffect, useMemo, useRef, useState } from 'react'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import { a2DcNetlist, validateA2C3Circuit } from '../../lib/freestyle/a2C3Fixture'
import { loadA2Firmware, type A2Sample, type A2WorkerEvent } from '../../lib/freestyle/a2C3Runtime'
import type { PinMap } from '../../lib/freestyle/freestyleBoards'
import { a3DcNetlist, validateA3Circuit } from '../../lib/freestyle/a3EspFixture'
import { a3TargetSettings, type A3Board } from '../../lib/freestyle/a3EspProfiles'
import { loadA3Firmware } from '../../lib/freestyle/a3EspRuntime'
import { a4DcNetlist, validateA4Circuit } from '../../lib/freestyle/a4EspFixture'
import { a4Target, type A4Board } from '../../lib/freestyle/a4EspProfiles'
import { loadA4Firmware } from '../../lib/freestyle/a4EspRuntime'
import { a5DcNetlist, validateA5Circuit } from '../../lib/freestyle/a5PicoFixture'
import type { A5Board } from '../../lib/freestyle/a5PicoProfiles'
import { loadA5Firmware, type A5WorkerMessage } from '../../lib/freestyle/a5PicoRuntime'

import { a6DcNetlist, validateA6Circuit } from '../../lib/freestyle/a6PicoFixture'
import { a6Limits, a6ReadyLine, type A6Board } from '../../lib/freestyle/a6PicoProfiles'
import { loadA6Firmware, type A6WorkerMessage } from '../../lib/freestyle/a6PicoRuntime'
import { a7DcNetlist, validateA7Circuit } from '../../lib/freestyle/a7Stm32Fixture'
import type { A7Board } from '../../lib/freestyle/a7Stm32Profiles'
import { a8DcNetlist, validateA8Circuit } from '../../lib/freestyle/a8Ra4m1Fixture'
import type { A8Board } from '../../lib/freestyle/a8Ra4m1Profiles'
import { a9DcNetlist, validateA9Circuit } from '../../lib/freestyle/a9Stm32Fixture'
import type { A9Board } from '../../lib/freestyle/a9Stm32Profiles'
import { a7Runtime, a8Runtime, a9Runtime } from '../../lib/freestyle/renodeRuntime'
import { a10ButtonId, a10DcNetlist, buildA10Fixture, compileA10Circuit } from '../../lib/freestyle/a10AvrFixture'
import { loadA10Hex, type A10Board } from '../../lib/freestyle/a10AvrRuntime'
import { a11DcNetlist, buildA11Fixture, validateA11Circuit } from '../../lib/freestyle/a11EspFixture'
import { a11Settings, loadA11Firmware, type A11Board, type A11WorkerMessage } from '../../lib/freestyle/a11EspRuntime'
import type { LiveWorkerRequest, LiveWorkerResponse } from '../../simulation/liveRuntimeProtocol'
import { isHostedFirmware } from '../../lib/freestyle/firmwareDelivery'

type Props = { doc: CircuitDocV2; boardId: string; pinMap: PinMap; pressed: boolean; onSample: (sample?: A2Sample) => void; a3?: A3Board; a4?: A4Board; a5?: A5Board; a6?: A6Board; a7?: A7Board; a8?: A8Board; a9?: A9Board; a10?: A10Board; a11?: A11Board }
type Run = { worker?: Worker; abort: AbortController; timeout?: number; repeat?: number; stopLocal?: () => void }
type Reading = { input: number; current: number; led: number; timeUs: number }
type SpiceMessage = { type: 'progress' } | { type: 'error'; message: string } | { type: 'result'; series: { name: string; values: number[] }[] }

export default function A2C3Controls({ doc, boardId, pinMap, pressed, onSample, a3, a4, a5, a6, a7, a8, a9, a10, a11 }: Props) {
  const renode = a9 ? a9Runtime : a8 ? a8Runtime : a7 ? a7Runtime : undefined
  const renodeBoard = a9 ?? a8 ?? a7
  const stage = a11 ? 'A11' : a10 ? 'A10' : a9 ? 'A9' : a8 ? 'A8' : a7 ? 'A7' : a6 ? 'A6' : a5 ? 'A5' : a4 ? 'A4' : a3 ? 'A3' : 'A2'
  const pico = a6 ?? a5
  const title = a11?.name ?? a10?.name ?? renodeBoard?.name ?? pico?.name ?? a4?.name ?? a3?.name ?? 'ESP32-C3'
  const inputPin = a11?.button.gpio ?? a10?.button.gpio ?? renodeBoard?.button.gpio ?? pico?.button.gpio ?? a4?.button.gpio ?? a3?.button.gpio ?? 4
  const ledPin = a11?.led.gpio ?? a10?.led.gpio ?? renodeBoard?.led.gpio ?? pico?.led.gpio ?? a4?.led.gpio ?? 10
  const inputLabel = a10?.button.label ?? (a8 ? a8.button.label : a7 || a9 ? 'PA10' : pico?.button.label ?? 'GPIO' + inputPin)
  const ledLabel = a10?.led.label ?? (a8 ? a8.led.label : a7 || a9 ? 'PB5' : pico?.led.label ?? 'GPIO' + ledPin)
  const traceLabel = inputLabel + ' / ' + ledLabel
  const run = useRef<Run | undefined>(undefined)
  const spice = useRef<{ worker: Worker; timeout: number } | undefined>(undefined)
  const input = useRef(pressed)
  input.current = pressed
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [serial, setSerial] = useState('')
  const [samples, setSamples] = useState<A2Sample[]>([])
  const [observedDc, setObservedDc] = useState<{ pressed?: A2Sample; released?: A2Sample }>({})
  const [reading, setReading] = useState<Reading>()
  const [measurement, setMeasurement] = useState('')
  const [dcState, setDcState] = useState<'latest' | 'pressed' | 'released'>('latest')
  const avrCircuit = useMemo(() => a10 && compileA10Circuit(doc, boardId, pinMap), [a10, doc, boardId, pinMap])
  const issues = avrCircuit?.issues ?? (a11 ? validateA11Circuit(doc, boardId, pinMap) : a9 ? validateA9Circuit(doc, boardId, pinMap) : a8 ? validateA8Circuit(doc, boardId, pinMap) : a7 ? validateA7Circuit(doc, boardId, pinMap) : a6 ? validateA6Circuit(doc, boardId, pinMap) : a5 ? validateA5Circuit(doc, boardId, pinMap) : a4 ? validateA4Circuit(doc, boardId, pinMap) : a3 ? validateA3Circuit(doc, boardId, pinMap) : validateA2C3Circuit(doc, boardId, pinMap))
  const latest = samples.at(-1)
  const rememberDc = Boolean(renode || a10 || a11)
  const pressedSample = rememberDc ? observedDc.pressed : samples.findLast(sample => !sample.inputHigh && sample.outputHigh)
  const releasedSample = rememberDc ? observedDc.released : samples.findLast(sample => sample.inputHigh && !sample.outputHigh)
  const dcSample = dcState === 'pressed' ? pressedSample : dcState === 'released' ? releasedSample
    : (a6 || rememberDc) && latest && latest.inputHigh === latest.outputHigh ? undefined : latest

  function showSample(sample: A2Sample) {
    setSamples(current => [...current.slice(-23), sample])
    if (rememberDc && sample.inputHigh !== sample.outputHigh) {
      const state = sample.inputHigh ? 'released' : 'pressed'
      setObservedDc(current => current[state] ? current : { ...current, [state]: sample })
    }
    onSample(sample)
  }

  function closeRun() {
    const active = run.current
    run.current = undefined
    active?.abort.abort()
    active?.worker?.terminate()
    active?.stopLocal?.()
    window.clearTimeout(active?.timeout)
    window.clearTimeout(active?.repeat)
  }

  function stop(message: string, failed = false) {
    closeRun()
    setBusy(false)
    setStatus(message)
    onSample(undefined)
    if (failed || a4 || pico || rememberDc) setSamples([])
    if (rememberDc) {
      setSerial('')
      setObservedDc({})
    }
    if (a4 || pico || rememberDc) {
      closeSpice()
      setReading(undefined)
      setMeasurement('')
      setDcState('latest')
    }
  }

  function closeSpice() {
    const pending = spice.current
    pending?.worker.terminate()
    window.clearTimeout(pending?.timeout)
    spice.current = undefined
  }

  useEffect(() => {
    setObservedDc({})
    setSamples([])
    setSerial('')
    setStatus('')
    setMeasurement('')
    setReading(undefined)
    setDcState('latest')
    setBusy(false)
    return () => { closeRun(); closeSpice(); onSample(undefined) }
  }, [doc, boardId, pinMap, onSample, a3, a4, a5, a6, a7, a8, a9, a10, a11])

  useEffect(() => {
    if (!rememberDc) return
    const unload = () => stop('Đã dừng firmware.')
    window.addEventListener('pagehide', unload)
    return () => window.removeEventListener('pagehide', unload)
  }, [rememberDc, onSample])

  useEffect(() => {
    const message = a10
      ? { type: 'circuit-stimuli', runId: 'a10', stimuli: { [a10ButtonId]: pressed } } satisfies LiveWorkerRequest
      : { type: 'input', pressed }
    run.current?.worker?.postMessage(message)
  }, [pressed, a10])

  async function start() {
    closeRun()
    closeSpice()
    const active: Run = { abort: new AbortController() }
    run.current = active
    setBusy(true)
    setStatus(`Đang nạp ${a10 ? 'HEX' : a6 || renode ? 'ELF' : 'ảnh flash'} và khởi động ${title}…`)
    setSerial('')
    setObservedDc({})
    setSamples([])
    setReading(undefined)
    setDcState('latest')
    setMeasurement('')
    onSample(undefined)
    const startupMs = renode ? renode.limits.startupWallMs : a11 ? 20_000 : a6 ? a6Limits.startupWallMs : 10_000
    const separateDownload = isHostedFirmware() && !renode
    function countBootTime() {
      window.clearTimeout(active.timeout)
      active.timeout = window.setTimeout(() => stop(`${title} chưa khởi động sau ${startupMs / 1000} giây.`, true), startupMs)
    }
    if (separateDownload) {
      active.timeout = window.setTimeout(() => stop(`Chưa tải xong tài nguyên firmware ${title} sau 30 giây.`, true), 30_000)
    } else countBootTime()
    try {
      if (a10 && avrCircuit?.graph) {
        const hex = await loadA10Hex(a10, JSON.stringify(buildA10Fixture(a10.fixtureId)), active.abort.signal)
        if (run.current !== active) return
        if (separateDownload) countBootTime()
        const worker = active.worker = new Worker(new URL('../../workers/avrLive.worker.ts', import.meta.url), { type: 'module' })
        let uart = ''
        let ready = false
        worker.onerror = () => { if (run.current === active) stop('Không tải được AVR8js cho A10.', true) }
        worker.onmessage = ({ data }: MessageEvent<LiveWorkerResponse>) => {
          if (run.current !== active || data.runId !== 'a10') return
          if (data.type === 'error') return stop(data.message, true)
          if (data.type === 'stopped') return stop(data.reason)
          if (data.type !== 'frame') return
          const frame = data.frame
          if (frame.serial) {
            uart = (uart + frame.serial).slice(-8000)
            setSerial(uart)
            if (!ready && uart.split(/\r?\n/).includes(a10.readyLine)) {
              ready = true
              window.clearTimeout(active.timeout)
              active.timeout = window.setTimeout(() => stop('Đã dừng sau 60 giây chạy.'), 60_000)
              setStatus(`Đang chạy firmware ${title}.`)
            }
          }
          const pinIn = frame.pins[inputPin]
          const pinOut = frame.pins[ledPin]
          if (ready && pinIn?.mode === 'input' && pinOut?.mode === 'output') {
            showSample({ inputHigh: pinIn.level, outputHigh: pinOut.level, timeUs: Math.round(frame.simulatedMilliseconds * 1000) })
          }
        }
        worker.postMessage({ type: 'start', runId: 'a10', engine: 'avr', board: a10.runnerId, hex, inputs: [],
          circuit: { graph: avrCircuit.graph, stimuli: { [a10ButtonId]: input.current } } } satisfies LiveWorkerRequest)
        return
      }
      if (renode && renodeBoard) {
        const signal = active.abort.signal
        const boot = await renode.start(renodeBoard, signal)
        if (run.current !== active) {
          void renode.stop(boot.id)
          return
        }
        active.stopLocal = () => { void renode.stop(boot.id) }
        window.clearTimeout(active.timeout)
        active.timeout = window.setTimeout(() => stop('Đã dừng sau 60 giây chạy.'), renode.limits.runWallMs)
        setStatus(`Đang chạy firmware ${title}.`)
        const show = ({ serial, sample }: typeof boot | Awaited<ReturnType<typeof renode.step>>) => {
          setSerial(serial)
          showSample(sample)
        }
        const tick = async () => {
          try {
            const frame = await renode.step(boot.id, input.current, signal)
            if (run.current !== active) return
            show(frame)
            active.repeat = window.setTimeout(tick, 40)
          } catch (error) {
            if (run.current === active) stop(error instanceof Error ? error.message : 'Phiên Renode ' + stage + ' đã mất kết nối.', true)
          }
        }
        show(boot)
        active.repeat = window.setTimeout(tick, 40)
        return
      }
      const worker = active.worker = a11
        ? new Worker(new URL('../../lib/freestyle/a11Esp.worker.ts', import.meta.url), { type: 'module' })
        : a6
        ? new Worker(new URL('../../lib/freestyle/a6Pico.worker.ts', import.meta.url), { type: 'module' })
        : a5
        ? new Worker(new URL('../../lib/freestyle/a5Pico.worker.ts', import.meta.url), { type: 'module' })
        : new Worker(new URL('../../lib/freestyle/a2C3.worker.ts', import.meta.url), { type: 'module' })
      const readyLine = a11 ? a11Settings.firmware.readyLine : a6 ? a6ReadyLine : a5 ? `A5_READY=${a5.sdkBoard}` : a4 ? `A4_READY=esp32s3:${a4.flashMiB}` : a3 ? `A3_READY=${a3.target}` : 'A2_READY'
      let uart = ''
      worker.onerror = () => { if (run.current === active) stop(a6 ? 'Không tải được bộ mô phỏng RP2350.' : a5 ? 'Không tải được bộ mô phỏng RP2040.' : 'Không tải được bộ mô phỏng ESP-EMU.', true) }
      worker.onmessage = ({ data }: MessageEvent<A2WorkerEvent>) => {
        if (run.current !== active) return
        if (data.type === 'error') return stop(data.message, true)
        if (data.type === 'prepared') {
          if (separateDownload) countBootTime()
          return
        }
        if (data.type === 'uart') {
          uart = (uart + data.text).slice(-8000)
          setSerial(uart)
          if (active.repeat === undefined && uart.split(/\r?\n/).includes(readyLine)) {
            window.clearTimeout(active.timeout)
            active.repeat = window.setTimeout(() => stop('Đã dừng sau 60 giây chạy.'), a6 ? a6Limits.runWallMs : 60_000)
            setStatus(`Đang chạy firmware ${title}.`)
          }
        } else {
          showSample(data.sample)
        }
      }
      const signal = active.abort.signal
      if (a11) {
        const assets = await loadA11Firmware(a11, JSON.stringify(buildA11Fixture(a11.fixtureId)), signal)
        if (run.current !== active) return
        if (separateDownload) countBootTime()
        worker.postMessage({ type: 'boot', assets, pressed: input.current } satisfies A11WorkerMessage, Object.values(assets))
        return
      }
      if (a6) {
        const { elf, wrapper, wasm } = await loadA6Firmware(a6, signal)
        if (run.current !== active) return
        if (separateDownload) countBootTime()
        worker.postMessage({ type: 'boot', elf, wrapper, wasm, pressed: input.current } satisfies A6WorkerMessage, [elf, wrapper, wasm])
        return
      }
      if (a5) {
        const { flash, bootrom } = await loadA5Firmware(a5, signal)
        if (run.current !== active) return
        if (separateDownload) countBootTime()
        worker.postMessage({ type: 'boot', flash, bootrom, pressed: input.current, sdkBoard: a5.sdkBoard } satisfies A5WorkerMessage, [flash, bootrom])
        return
      }
      const image = a4 ? await loadA4Firmware(a4.flashMiB, signal)
        : a3 ? await loadA3Firmware(a3.target, signal) : await loadA2Firmware(signal)
      if (run.current !== active) return
      const target = a4 ? { chip: 'esp32s3' as const, inputPin, ledPin, inputRegister: Number(a4Target.gpioInputRegister), readyLine } : a3 && { chip: a3.target, inputPin, inputRegister: Number(a3TargetSettings[a3.target].gpioInputRegister) }
      worker.postMessage({ type: 'boot', image, pressed: input.current, target }, [image])
    } catch (error) {
      if (run.current === active) stop(error instanceof Error ? error.message : `Chưa chạy được firmware ${stage}.`, true)
    }
  }

  function measure(sample: A2Sample) {
    closeSpice()
    setReading(undefined)
    setMeasurement('Đang giải điểm làm việc DC…')
    try {
      const worker = new Worker(new URL('../../simulation/spice.worker.ts', import.meta.url), { type: 'module' })
      const timeout = window.setTimeout(() => { closeSpice(); setMeasurement('ngspice vượt 30 giây.') }, 30_000)
      spice.current = { worker, timeout }
      worker.onerror = () => {
        if (spice.current?.worker !== worker) return
        closeSpice()
        setMeasurement('Không tải được ngspice WASM.')
      }
      worker.onmessage = ({ data }: MessageEvent<SpiceMessage>) => {
        if (spice.current?.worker !== worker || data.type === 'progress') return
        closeSpice()
        if (data.type === 'error') return setMeasurement(data.message)
        const value = (name: string) => data.series.find(series => series.name.toLowerCase() === name)?.values[0]
        const [input, current, led] = [value(`v(gpio${inputPin})`), value('i(vout)'), value('v(anode)')]
        if (input === undefined || current === undefined || led === undefined) return setMeasurement('ngspice chưa trả đủ kênh đo.')
        setReading({ input, current: -current * 1000, led, timeUs: sample.timeUs })
        setMeasurement('')
      }
      const netlist = a11 ? a11DcNetlist(!sample.inputHigh, sample.outputHigh) : a10 ? a10DcNetlist(a10, !sample.inputHigh, sample.outputHigh) : a9 ? a9DcNetlist(!sample.inputHigh, sample.outputHigh) : a8 ? a8DcNetlist(!sample.inputHigh, sample.outputHigh) : a7 ? a7DcNetlist(!sample.inputHigh, sample.outputHigh) : a6 ? a6DcNetlist(!sample.inputHigh, sample.outputHigh) : a5 ? a5DcNetlist(!sample.inputHigh, sample.outputHigh) : a4 ? a4DcNetlist(!sample.inputHigh, sample.outputHigh) : a3 ? a3DcNetlist(boardId, !sample.inputHigh, sample.outputHigh) : a2DcNetlist(!sample.inputHigh, sample.outputHigh)
      worker.postMessage({ type: 'run', runId: `${stage}-gpio-dc`, netlist })
    } catch {
      closeSpice()
      setMeasurement('Không khởi tạo được ngspice WASM.')
    }
  }

  const cortex = a9?.firmware.cpu === 'cortex-m3' ? 'Cortex-M3' : 'Cortex-M4'
  const serialPort = a10 ? 'USART0' : a9?.firmware.uart.device.toUpperCase() ?? (a8 ? 'SCI2' : a7 ? 'USART2' : 'UART0')
  return <section className="freestyle-card" aria-label={`Firmware và mạch ${title} ${stage}`}>
    <h3>{title} · Nút nhấn và LED</h3>
    <p>{a10 ? `AVR8js chạy HEX ${a10.mcu} trên board ảo ở 16 MHz.` : renode ? `Renode chạy ELF ${cortex} được biên dịch cho board này.` : a6 ? 'pico-emu chạy firmware C cho RP2350A Cortex-M33.' : a5 ? 'rp2040js chạy firmware C từ Pico SDK trên board ảo.' : 'ESP-EMU WASM chạy ảnh flash ESP-IDF local.'} Giữ nút nhấn để {inputLabel} xuống LOW. Firmware điều khiển LED từ {ledLabel}.</p>
    {a10 && <p className="freestyle-note">{a10.revision} · 5 V · {inputLabel} ({a10.button.pad}) · {ledLabel} ({a10.led.pad}). ngspice đo hai điểm làm việc DC từ mức GPIO ổn định.</p>}
    {a11 && <p className="freestyle-note">{a11.revision} · 3,3 V · {inputLabel} ({a11.button.pad}) · {ledLabel} ({a11.led.pad}). ESP-EMU 1.3.0 chạy Xtensa LX6. ngspice đo hai điểm DC từ mức GPIO đã ghi.</p>}
    {a9 && <p className="freestyle-note">{a9.revision} · PA10 ({a9.button.pad}) · PB5 ({a9.led.pad}). ngspice đo hai điểm làm việc DC từ mức GPIO ổn định.</p>}
    {a8 && <p className="freestyle-note">{a8.revision} · 5 V · {a8.button.label} · {a8.led.label}. ngspice đo hai điểm làm việc DC từ mức GPIO ổn định.</p>}
    {a7 && <p className="freestyle-note">{a7.revision} · PA10 ({a7.button.pad}) · PB5 ({a7.led.pad}). ngspice đo hai điểm làm việc DC từ mức GPIO ổn định.</p>}
    {a6 && <p className="freestyle-note">{a6.revision} · {inputLabel} ({a6.button.pad}) · {ledLabel} ({a6.led.pad}).
      ngspice đo hai trạng thái GPIO ổn định. SWD chỉ dùng để tra cứu chân.</p>}
    {a5 && <p className="freestyle-note">{a5.pcbRevision} · {inputLabel} ({a5.button.pad}) · {ledLabel} ({a5.led.pad}). Đo ngspice tại trạng thái GPIO đã ghi.</p>}
    {a4 && <p className="freestyle-note">{a4.hardwareVariant} · {a4.button.label} ({a4.button.pad}) → {inputLabel} · {a4.led.label} ({a4.led.pad}) → {ledLabel}. Đo ngspice tại trạng thái GPIO đã ghi.</p>}
    {issues.length > 0 && <ul aria-label={`Kiểm tra mạch ${stage}`}>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
    <div className="freestyle-work-actions">
      <button className="freestyle-run-button" type="button" disabled={issues.length > 0}
        onClick={() => busy ? stop('Đã dừng firmware.') : void start()}>{busy ? `Dừng firmware ${title}` : `Chạy firmware ${title}`}</button>
      <label>Trạng thái đã quan sát <select value={dcState} onChange={event => {
        if (a11) {
          closeSpice()
          setReading(undefined)
          setMeasurement('')
        }
        setDcState(event.target.value as typeof dcState)
      }}>
        <option value="latest">Mức gần nhất</option>
        <option value="pressed" disabled={!pressedSample}>Khi nút đã nhấn</option>
        <option value="released" disabled={!releasedSample}>Khi nút đã nhả</option>
      </select></label>
      <button className="freestyle-button" type="button" disabled={!dcSample || issues.length > 0}
        onClick={() => { if (dcSample) measure(dcSample) }}>Đo DC bằng ngspice</button>
    </div>
    {status && <p role="status">{status}</p>}
    {latest && <p aria-label={`Mức chân ${title}`}>{inputLabel} {latest.inputHigh ? 'HIGH' : 'LOW'} · {ledLabel} {latest.outputHigh ? 'HIGH · LED sáng' : 'LOW · LED tắt'}</p>}
    {measurement && <p role="status">{measurement}</p>}
    {reading && <p aria-label={`Kết quả ngspice ${stage}`}>ngspice DC tại trạng thái {reading.timeUs} µs · {inputLabel} {reading.input.toFixed(4)} V · LED {reading.led.toFixed(3)} V · I LED {Math.max(0, reading.current).toFixed(3)} mA</p>}
    <details><summary>Serial {serialPort}</summary><pre className="freestyle-serial" aria-label={`Serial ${title} ${stage}`}>{serial || 'Chưa có dữ liệu.'}</pre></details>
    <details><summary>Dạng sóng {traceLabel}</summary>
      <ol aria-label={`Trace GPIO ${title}`}>{samples.map((sample, index) => <li key={`${sample.timeUs}-${index}`}>
        {sample.timeUs} µs · {inputLabel} {sample.inputHigh ? 'HIGH' : 'LOW'} · {ledLabel} {sample.outputHigh ? 'HIGH' : 'LOW'}
      </li>)}</ol>
    </details>
  </section>
}
