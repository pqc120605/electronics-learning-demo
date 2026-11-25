import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'

const origin = 'https://mach-mo.vercel.app'
const host = new URL(origin).host
const prefix = '/api/tools/arduino'
const maxBodyBytes = 40 * 1024
const maxSourceBytes = 32 * 1024
const maxHexBytes = 1024 * 1024
const maxLogBytes = 12 * 1024
const imageIdPattern = /^sha256:[0-9a-f]{64}$/
const fqbnByBoard = new Map([
  ['arduino-uno-r3', 'arduino:avr:uno'],
  ['arduino-nano', 'arduino:avr:nano:cpu=atmega328'],
  ['arduino-mega-2560', 'arduino:avr:mega:cpu=atmega2560'],
])

export function podmanCompileArgs(image, name, fqbn) {
  if (!imageIdPattern.test(image) || !/^machmo-avr-[0-9a-f-]{36}$/.test(name)
    || !new Set(fqbnByBoard.values()).has(fqbn)) throw new TypeError('Invalid compiler job configuration')
  return [
    'run', '--rm', '--interactive', '--pull=never', '--name', name,
    '--network=none', '--read-only', '--read-only-tmpfs=false', '--user=65532:65532',
    '--cap-drop=all', '--security-opt=no-new-privileges', '--pids-limit=64',
    '--memory=384m', '--memory-swap=384m', '--cpus=1', '--timeout=45',
    '--tmpfs', '/work:rw,noexec,nosuid,nodev,size=64m,mode=1777',
    '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=16m,mode=1777',
    '--http-proxy=false', '--env=HOME=/work', '--env=TMPDIR=/tmp', image, fqbn,
  ]
}

export function createPodmanCompiler({ image, podman = '/usr/bin/podman' }) {
  if (!imageIdPattern.test(image)) throw new TypeError('Compiler image must be an immutable SHA-256 image ID')
  return async (fqbn, source, signal) => {
    const name = 'machmo-avr-' + randomUUID()
    const child = spawn(podman, podmanCompileArgs(image, name, fqbn), { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let cancelled = false
    let cleanup
    const cancel = () => {
      if (cancelled) return
      cancelled = true
      child.kill('SIGKILL')
      const remove = spawn(podman, ['rm', '--force', '--ignore', name], { stdio: 'ignore' })
      const deadline = setTimeout(() => remove.kill('SIGKILL'), 3_000)
      cleanup = once(remove, 'close').catch(() => {}).finally(() => clearTimeout(deadline))
    }
    child.stdout.on('data', chunk => {
      if (stdout.length + chunk.length > maxHexBytes) cancel()
      else stdout += chunk.toString('ascii')
    })
    child.stderr.on('data', chunk => {
      if (stderr.length < maxLogBytes) stderr += chunk.toString('utf8').slice(0, maxLogBytes - stderr.length)
    })
    child.stdin.on('error', () => {})
    const deadline = setTimeout(cancel, 50_000)
    const done = once(child, 'close')
    if (signal.aborted) cancel()
    else {
      signal.addEventListener('abort', cancel, { once: true })
      child.stdin.end(source)
    }
    try {
      const [code] = await done
      if (cancelled || code === 137) return { status: 503, log: 'Lượt biên dịch đã dừng hoặc quá thời gian.' }
      if (code === 2) return { status: 422, log: stderr.replaceAll('/work/sketch', '<sketch>') || 'Không biên dịch được sketch.' }
      if (code === 0 && /^:[0-9A-F]/i.test(stdout) && stdout.trimEnd().endsWith(':00000001FF')) {
        return { status: 200, hex: stdout }
      }
      return { status: 503, log: 'Máy chủ biên dịch tạm thời chưa khả dụng.' }
    } catch {
      return { status: 503, log: 'Máy chủ biên dịch tạm thời chưa khả dụng.' }
    } finally {
      clearTimeout(deadline)
      signal.removeEventListener('abort', cancel)
      await cleanup
    }
  }
}

async function parseRequest(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length
    if (size > maxBodyBytes) {
      request.resume()
      return { status: 413, log: 'Yêu cầu biên dịch quá lớn.' }
    }
    chunks.push(chunk)
  }
  let value
  try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch {}
  const fqbn = fqbnByBoard.get(value?.board)
  if (!fqbn || typeof value.source !== 'string' || !value.source.trim() || value.source.includes('\0')) {
    return { status: 400, log: 'Hãy chọn Arduino Uno, Nano hoặc Mega và nhập sketch hợp lệ.' }
  }
  if (Buffer.byteLength(value.source) > maxSourceBytes) return { status: 413, log: 'Sketch vượt 32 KiB.' }
  return { fqbn, source: value.source }
}

export function createCompilerServer({ compile, now = Date.now }) {
  let busy = false
  let requestTimes = []
  return createServer({ maxHeaderSize: 8192, requestTimeout: 10_000, headersTimeout: 5_000, keepAliveTimeout: 4_000 }, async (request, response) => {
    const json = (status, payload, extra = {}) => {
      if (response.destroyed) return
      response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', ...extra,
      })
      response.end(JSON.stringify(payload))
    }
    if (request.headers.host !== host ||
        (request.headers.origin !== undefined && request.headers.origin !== origin)) return json(403, { ok: false })
    if (request.url === prefix + '/status' && request.method === 'GET') {
      return json(200, { ok: true, boards: [...fqbnByBoard.keys()] })
    }
    if (request.url !== prefix + '/compile') return json(404, { ok: false })
    if (request.method !== 'POST') return json(405, { ok: false }, { Allow: 'POST' })
    if (request.headers.origin !== origin || request.headers['x-machmo-csrf'] !== '1' ||
        (request.headers['sec-fetch-site'] !== undefined && request.headers['sec-fetch-site'] !== 'same-origin')) {
      return json(403, { ok: false, log: 'Yêu cầu biên dịch phải xuất phát từ Mạch Mở.' })
    }
    if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return json(415, { ok: false, log: 'Cần gửi sketch ở dạng JSON.' })
    }
    if (Number(request.headers['content-length'] ?? 0) > maxBodyBytes) {
      return json(413, { ok: false, log: 'Yêu cầu biên dịch quá lớn.' }, { Connection: 'close' })
    }
    try {
      const parsed = await parseRequest(request)
      if (parsed.status) {
        return json(parsed.status, { ok: false, log: parsed.log }, parsed.status === 413 ? { Connection: 'close' } : {})
      }
      const time = now()
      requestTimes = requestTimes.filter(previous => previous > time - 60_000)
      if (busy || requestTimes.length >= 8) {
        return json(429, { ok: false, log: 'Máy chủ đang bận biên dịch. Bạn có thể thử lại hoặc dùng mô phỏng trong trình duyệt.' },
          { 'Retry-After': busy ? '5' : '60' })
      }
      busy = true
      requestTimes.push(time)
      const disconnect = new AbortController()
      response.once('close', () => disconnect.abort())
      try {
        const { status, hex, log } = await compile(parsed.fqbn, parsed.source, disconnect.signal)
        return json(status, { ok: status === 200, ...(status === 200 ? { hex } : { log }) })
      } finally {
        busy = false
      }
    } catch {
      return json(503, { ok: false, log: 'Máy chủ biên dịch tạm thời chưa khả dụng.' })
    }
  })
}

if (import.meta.main) {
  if (process.platform !== 'linux' || process.getuid() === 0) throw new Error('Run compiler as a rootless Linux user')
  const compile = createPodmanCompiler({ image: process.env.MACHMO_COMPILER_IMAGE })
  createCompilerServer({ compile }).listen(8285, '127.0.0.1', () => console.log('Mạch Mở AVR compiler listening on loopback 8285'))
}
