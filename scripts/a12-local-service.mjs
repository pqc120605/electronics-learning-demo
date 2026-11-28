import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { setTimeout as delay } from 'node:timers/promises'
import { createRenodeLocalService } from './renode-local-service.mjs'

export const a12FirmwareApproval = 'ef88a72e4dba5015a288d84ddccf9eda0b0a84dd05a8aaac3e77ad663da15960'
const planPath = 'docs/research/2026-11-28-a12-firmware-r2-proposal.json'
const staged = '.tmp/a12-fw-r2/runtime'
const container = 'machmo-a12-fw-r2'
const runtime = '/r2/runtime/'
const profiles = {
  esp32s2: {
    id: 'esp32-s2-devkitc-1', key: 'esp32s2',
    firmware: 's2.elf', executable: 'qemu-system-xtensa', files: ['s2.elf', 's2rom.bin', 'run-s2.py', 'qemu-system-xtensa'],
    command: ['python3', runtime + 'run-s2.py', runtime + 'qemu-system-xtensa', runtime, runtime + 's2.elf'],
  },
  atmega4809: {
    id: 'arduino-nano-every', key: 'nanoEvery',
    firmware: 'nano.elf', executable: 'nano-runner', files: ['nano.elf', 'nano.hex', 'nano-runner'],
    command: [runtime + 'nano-runner', runtime + 'nano.hex'],
  },
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const readyLine = target => 'A12_READY=' + target
const limitError = 'Phiên firmware A12 đã hết thời gian hoặc dừng.'

async function verifyAssets(root, target, requireEvidence) {
  const profile = profiles[target]
  const planBytes = await readFile(resolve(root, planPath))
  if (sha256(planBytes) !== a12FirmwareApproval) throw new Error('SHA-256 cấu hình A12-FW-R2 không khớp.')
  const plan = JSON.parse(planBytes)
  const directory = resolve(root, staged)
  let manifest
  try {
    manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'))
  } catch {
    throw new Error('Chưa có runner A12-FW-R2 đã xác minh trên laptop.')
  }
  if (manifest.approvalSha256 !== a12FirmwareApproval) throw new Error('Sai phiên bản runner A12-FW-R2.')
  if (requireEvidence && manifest.passed?.[target] !== manifest.files?.[profile.executable]) {
    throw new Error('Runner A12 chưa vượt phép thử GPIO, thời gian và UART cho board này.')
  }
  for (const file of profile.files) {
    const actual = sha256(await readFile(resolve(directory, file)))
    if (actual !== manifest.files?.[file] ||
        (file === profile.firmware && actual !== plan.runners[profile.key].firmware.sha256.toLowerCase())) {
      throw new Error('SHA-256 tệp firmware hoặc runner A12 không khớp.')
    }
  }
  return profile
}

function transcript(child, signal) {
  let buffered
  let pending
  let failure
  function fail(error) {
    failure ??= error
    pending?.reject(failure)
    pending = undefined
  }
  const reader = createInterface({ input: child.stdout, crlfDelay: Infinity })
  reader.on('line', line => {
    if (!line.startsWith('{')) return
    if (line.length > 8192 || buffered) return fail(new Error('Phản hồi runner A12 không hợp lệ.'))
    try {
      const frame = JSON.parse(line)
      if (!pending) buffered = frame
      else {
        const complete = pending
        pending = undefined
        complete.resolve(frame)
      }
    } catch { fail(new Error('Không đọc được phản hồi runner A12.')) }
  })
  child.on('error', () => fail(new Error('Không mở được Podman WSL cho A12.')))
  child.once('close', () => fail(new Error(limitError)))
  child.stdin.on('error', () => fail(new Error(limitError)))
  child.stderr.resume()
  signal.addEventListener('abort', () => fail(signal.reason), { once: true })
  return next => {
    signal.throwIfAborted()
    if (failure) throw failure
    if (pending) throw new Error('Runner A12 đang xử lý bước trước.')
    if (buffered) {
      if (next) throw new Error('Runner A12 gửi thêm khung ngoài yêu cầu.')
      const frame = buffered
      buffered = undefined
      return Promise.resolve(frame)
    }
    return new Promise((resolve, reject) => {
      pending = { resolve, reject }
      if (next) child.stdin.write(next)
    })
  }
}

function validateFrame(target, frame, previous, pressed, ms) {
  const { startUs, timeUs, edgeUs, uartUs, edges, inputHigh, outputHigh, serial } = frame ?? {}
  const clockOk = target === 'esp32s2'
    ? Number.isSafeInteger(frame?.ticks) && Math.abs(timeUs - frame.ticks) <= 10
    : Number.isSafeInteger(frame?.timerAcks) && frame.timerAcks >= (previous?.timerAcks ?? 0)
      && Math.abs(frame.timerAcks * 1024 - timeUs) <= 3000
  if (frame?.target !== target || !clockOk || inputHigh !== !pressed || typeof outputHigh !== 'boolean'
      || typeof serial !== 'string' || serial.length > 4096
      || ![timeUs, startUs, edgeUs, uartUs, edges].every(Number.isSafeInteger)
      || Math.abs(timeUs - startUs - ms * 1000) > 1000
      || startUs < (previous?.timeUs ?? 0) || edges < (previous?.edges ?? 0)
      || edgeUs < (previous?.edgeUs ?? 0) || edgeUs > timeUs
      || uartUs < (previous?.uartUs ?? 0) || uartUs > timeUs || serial && (uartUs < startUs || uartUs < edgeUs)) {
    throw new Error('Mức GPIO hoặc đồng hồ mô phỏng A12 không hợp lệ.')
  }
  return frame
}

export async function openA12Machine(root, target, lifetime, requireEvidence = false) {
  lifetime.throwIfAborted()
  const { command } = await verifyAssets(root, target, requireEvidence)
  lifetime.throwIfAborted()
  const control = new AbortController()
  const child = spawn('wsl.exe', ['-d', 'podman-machine-default', '--', 'podman', 'exec', '-i',
    container, 'timeout', '--kill-after=2s', '120s', ...command],
  { cwd: root, windowsHide: true, shell: false })
  const closed = new Promise(resolve => child.once('close', resolve))
  const next = transcript(child, control.signal)
  let expiry
  let stopping
  function stop() {
    return stopping ??= (async () => {
      clearTimeout(expiry)
      lifetime.removeEventListener('abort', stop)
      control.abort(new Error(limitError))
      child.stdin.end()
      if (!await Promise.race([closed.then(() => true), delay(900, false, { ref: false })])) child.kill()
      await Promise.race([closed, delay(900, undefined, { ref: false })])
    })()
  }
  lifetime.addEventListener('abort', stop, { once: true })
  expiry = setTimeout(stop, 30_000).unref()
  try {
    let last = validateFrame(target, await next(), undefined, false, 90)
    if (last.outputHigh || last.edges || !last.serial.split(/\r?\n/).includes(readyLine(target))) {
      throw new Error('UART chưa xác nhận firmware A12 đúng board.')
    }
    let serial = last.serial
    function result() {
      return {
        serial, sample: { timeUs: last.timeUs, inputHigh: last.inputHigh, outputHigh: last.outputHigh },
        edgeUs: last.edgeUs, edges: last.edges, startUs: last.startUs, uartUs: last.uartUs,
        ticks: last.ticks, timerAcks: last.timerAcks,
      }
    }
    clearTimeout(expiry)
    expiry = setTimeout(stop, 90_000).unref()
    return {
      closed, stop, signal: control.signal, initial: result(), approvalSha256: a12FirmwareApproval,
      async step(pressed, milliseconds = 90) {
        if (typeof pressed !== 'boolean' || !Number.isInteger(milliseconds) || milliseconds < 1 || milliseconds > 100) {
          throw new Error('Bước thời gian A12 không hợp lệ.')
        }
        last = validateFrame(target, await next(Number(pressed) + ' ' + milliseconds + '\n'), last, pressed, milliseconds)
        serial = (serial + last.serial).slice(-4096)
        return result()
      },
    }
  } catch (error) {
    await stop()
    throw error
  }
}

export function createA12LocalService(root) {
  return createRenodeLocalService(root, {
    stage: 'A12', prefix: '/api/local-tools/a12/', perTab: true,
    openMachine: (directory, boardId, signal) => {
      const target = Object.keys(profiles).find(name => profiles[name].id === boardId)
      if (!target) return Promise.reject(new Error('Runner A12 không khớp board đã chọn.'))
      return openA12Machine(directory, target, signal, true)
    },
  })
}
