import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtemp, open, rmdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const renodeInvalidSession = stage => 'Phiên firmware ' + stage + ' đã dừng. Hãy chạy lại.'

function monitor(child, signal, stage) {
  const runtimeError = 'Renode không hoàn thành lệnh của mạch ' + stage + '.'
  let pending
  let transcript = ''
  let failed
  function fail(error) {
    failed ??= error
    const waiting = pending
    pending = undefined
    waiting?.reject(failed)
  }
  child.on('error', () => fail(new Error('Không khởi chạy được Renode ' + stage + ' trên máy này.')))
  child.on('exit', () => fail(new Error(renodeInvalidSession(stage))))
  child.stdin.on('error', () => fail(new Error(runtimeError)))
  child.stderr.resume()
  signal.addEventListener('abort', () => fail(signal.reason), { once: true })
  child.stdout.setEncoding('utf8').on('data', data => {
    if (failed) return
    transcript += data.replace(/\r/g, '\n')
    if (transcript.length > 65_536) return fail(new Error(runtimeError))
    if (!pending || !pending.complete(transcript)) return
    const result = transcript
    transcript = ''
    const waiting = pending
    pending = undefined
    if (/There was an error executing command|No such command or device|Error E\d+/i.test(result)) {
      fail(new Error(runtimeError))
      waiting.reject(failed)
    } else waiting.resolve(result)
  })
  function wait(complete, input) {
    signal.throwIfAborted()
    if (failed) throw failed
    if (pending) throw new Error('Renode đang xử lý bước trước.')
    if (complete(transcript)) {
      const result = transcript
      transcript = ''
      return Promise.resolve(result)
    }
    return new Promise((resolve, reject) => {
      pending = { complete, resolve, reject }
      if (input) child.stdin.write(input)
    })
  }
  return {
    ready: () => wait(result => result.includes('(monitor)')),
    async batch(commands) {
      const end = stage + '_END_' + randomUUID().replaceAll('-', '')
      const result = await wait(value => value.includes('\n' + end + '\n'),
        [...commands, 'echo "' + end + '"', ''].join('\n'))
      return result.split('\n').map(line => line.trim()).filter(line => /^0x[0-9a-f]{8}$/i.test(line)).map(Number)
    },
  }
}

async function serialTail(path, limit) {
  const file = await open(path, 'r')
  try {
    const { size } = await file.stat()
    const offset = Math.max(0, size - limit)
    const bytes = Buffer.alloc(size - offset)
    const { bytesRead } = await file.read(bytes, 0, bytes.length, offset)
    return bytes.subarray(0, bytesRead).toString('utf8')
  } finally { await file.close() }
}

export async function openRenodeMachine({ stage, assets, runner, runnerArguments, limits, elf, platform, lifetime, approvalSha256,
  readyLine, uartDevice, inputDevice, inputBit, registers, observe }) {
  lifetime.throwIfAborted()
  const directory = await mkdtemp(resolve(assets, 'run-'))
  const path = name => resolve(directory, name)
  const monitorPath = name => '@' + path(name).replaceAll('\\', '/')
  const files = ['target.repl', 'firmware.elf', 'uart.log', 'renode.config', 'renode.config.lock', 'monitor.history']
  let child
  let closed
  let expiry
  let closing
  const processLifetime = new AbortController()
  function stop() {
    closing ??= Promise.resolve().then(async () => {
      clearTimeout(expiry)
      processLifetime.abort(new Error(renodeInvalidSession(stage)))
      lifetime.removeEventListener('abort', stop)
      child?.kill()
      await closed
      await Promise.all(files.map(name => unlink(path(name)).catch(() => {})))
      await rmdir(directory).catch(() => {})
    })
    return closing
  }
  try {
    if (files.some(name => !/^@[a-z]:\/[a-z0-9_./-]+$/i.test(monitorPath(name)))) {
      throw new Error('Renode ' + stage + ' yêu cầu thư mục local có đường dẫn không dấu và không có khoảng trắng.')
    }
    const config = path('renode.config')
    // AntShell saves history on each command, so give every process its own file.
    const history = path('monitor.history').replaceAll('\\', '/')
    await Promise.all([
      writeFile(path(files[0]), platform), writeFile(path(files[1]), elf),
      writeFile(config, '[general]\nhistory-path = ' + history + '\n'),
    ])
    lifetime.throwIfAborted()
    child = spawn(runner, [...runnerArguments, '--config', config], { cwd: directory, windowsHide: true, shell: false })
    closed = new Promise(resolve => child.once('close', resolve))
    lifetime.addEventListener('abort', stop, { once: true })
    expiry = setTimeout(stop, limits.startupWallMs).unref()
    const cli = monitor(child, processLifetime.signal, stage)
    await cli.ready()
    await cli.batch(['logLevel 3', 'mach create "fixture"', 'machine LoadPlatformDescription ' + monitorPath(files[0]),
      'sysbus LoadELF ' + monitorPath(files[1])])
    let elapsedMs = 0
    let serial = ''
    async function step(pressed, milliseconds = limits.maxStepMs) {
      if (typeof pressed !== 'boolean' || !Number.isInteger(milliseconds) || milliseconds < 1 || milliseconds > limits.maxStepMs) {
        throw new Error('Bước thời gian ' + stage + ' không hợp lệ.')
      }
      const uartPath = monitorPath(files[2])
      const words = await cli.batch([
        uartDevice + ' CreateFileBackend ' + uartPath + ' true',
        inputDevice + ' OnGPIO ' + inputBit + ' ' + !pressed,
        'emulation RunFor "' + (milliseconds / 1000).toFixed(3) + '"',
        ...registers.map(address => 'sysbus ReadDoubleWord 0x' + address.toString(16)),
        uartDevice + ' CloseFileBackend ' + uartPath,
      ])
      elapsedMs += milliseconds
      const ticks = words[0]
      if (words.length !== registers.length || Math.abs(ticks - elapsedMs) > 1) {
        throw new Error('SysTick ' + stage + ' không khớp thời gian mô phỏng.')
      }
      const { inputHigh, outputHigh } = observe(words.slice(1), pressed)
      serial = (serial + await serialTail(path('uart.log'), limits.serialTailBytes)).slice(-limits.serialTailBytes)
      await unlink(path('uart.log'))
      return { serial,
        sample: { timeUs: elapsedMs * 1000, inputHigh, outputHigh }, ticks }
    }
    const initial = await step(false)
    if (!initial.serial.split(/\r?\n/).includes(readyLine) || initial.sample.outputHigh) {
      throw new Error('UART chưa xác nhận firmware ' + stage + ' đúng board.')
    }
    clearTimeout(expiry)
    expiry = setTimeout(stop, limits.runWallMs).unref()
    return { initial, step, stop, closed, signal: processLifetime.signal, approvalSha256 }
  } catch (error) {
    await stop()
    throw error
  }
}
