/**
 * Dịch vụ công cụ cục bộ của Mạch Mở (2026-11-14).
 *
 * - POST /api/local-tools/compile   { board, source } → { ok, hex, log } — biên dịch thật bằng arduino-cli.
 * - GET  /api/local-tools/health    → arduino-cli có trên máy không, board nào biên dịch được.
 * - GET  /api/local-tools/rp2040-bootrom → bootrom RP2040 B2 (16 KB) cho rp2040js.
 *
 * Bảo mật: chỉ nhận kết nối loopback + Host/Origin localhost, giới hạn kích thước, một lượt biên dịch
 * mỗi lúc, timeout, thư mục tạm riêng mỗi lượt, đối số cố định (không shell, không cờ do người dùng chọn),
 * chặn #include đường dẫn tuyệt đối hoặc "..".
 *
 * Bootrom: KHÔNG nằm trong repo. Tệp chứa mufplib (Mark Owen) chỉ được Raspberry Pi cấp phép dùng trên
 * chip RP2040 thật (hoặc GPLv2 từ tác giả), nên dịch vụ tải bản phát hành chính thức về cache cục bộ
 * `.tmp/firmware-cache/` của máy người dùng, kiểm SHA-256 rồi mới dùng.
 *
 * Dùng như middleware Vite (xem vite.config.ts) hoặc chạy riêng: `node scripts/arduino-compile-service.mjs`.
 */
import { spawn } from 'node:child_process'
import { createGuideAiMiddleware } from './guide-ai-service.mjs'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))

export const DEFAULT_ARDUINO_CLI = process.env.MACHMO_ARDUINO_CLI || 'D:/Arduino/Arduino IDE/resources/app/lib/backend/resources/arduino-cli.exe'
export const API_PREFIX = '/api/local-tools'
export const MAX_SKETCH_BYTES = 64 * 1024
export const COMPILE_TIMEOUT_MS = 120_000
const MAX_LOG_CHARS = 16_000
const MAX_HEX_BYTES = 2 * 1024 * 1024

/** Board của Mạch Mở → FQBN arduino-cli. Danh sách đóng: người dùng không gửi FQBN tự do. */
export const ARDUINO_FQBN = Object.freeze({
  'arduino-uno-r3': 'arduino:avr:uno',
  'arduino-nano': 'arduino:avr:nano:cpu=atmega328',
  'arduino-mega-2560': 'arduino:avr:mega:cpu=atmega2560',
})

export const RP2040_BOOTROM = Object.freeze({
  url: 'https://github.com/raspberrypi/pico-bootrom-rp2040/releases/download/b2/b2.elf',
  sha256: '3a3c4c617d83bc9b910a6fa7bfdffa11ce26ff89370271d861507be821cc49aa',
  bytes: 16 * 1024,
  cacheFile: path.join(projectRoot, '.tmp', 'firmware-cache', 'rp2040-bootrom-b2.bin'),
})

const INCLUDE_RE = /^\s*#\s*include\s*([<"])([^>"]*)[>"]/gm

/** Kiểm tra yêu cầu biên dịch; trả lỗi tiếng Việt kèm mã HTTP. */
export function validateCompileRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, status: 400, message: 'Yêu cầu phải là JSON { board, source }.' }
  const { board, source } = body
  if (typeof board !== 'string' || !Object.hasOwn(ARDUINO_FQBN, board)) return { ok: false, status: 400, message: `Board "${String(board)}" không biên dịch được bằng arduino-cli trên máy. Hỗ trợ: ${Object.keys(ARDUINO_FQBN).join(', ')}.` }
  if (typeof source !== 'string' || !source.trim()) return { ok: false, status: 400, message: 'Sketch trống.' }
  if (Buffer.byteLength(source, 'utf8') > MAX_SKETCH_BYTES) return { ok: false, status: 413, message: `Sketch vượt ${MAX_SKETCH_BYTES / 1024} KB.` }
  if (source.includes('\0')) return { ok: false, status: 400, message: 'Sketch chứa ký tự NUL.' }
  for (const match of source.matchAll(INCLUDE_RE)) {
    const target = match[2].trim()
    if (!/^[A-Za-z0-9_][A-Za-z0-9_./-]*$/.test(target) || target.includes('..') || target.startsWith('/')) {
      return { ok: false, status: 400, message: `#include "${target}" không được phép: chỉ dùng tên thư viện như <Servo.h>, không dùng đường dẫn tuyệt đối hoặc "..".` }
    }
  }
  return { ok: true, board, fqbn: ARDUINO_FQBN[board], source }
}

function runProcess(command, args, { timeoutMs, cwd }) {
  return new Promise((resolve) => {
    let output = ''
    let timedOut = false
    const child = spawn(command, args, { cwd, shell: false, windowsHide: true, env: { ...process.env, NO_COLOR: '1' } })
    const append = (chunk) => { if (output.length < MAX_LOG_CHARS * 2) output += chunk.toString('utf8') }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL') }, timeoutMs)
    child.on('error', (error) => { clearTimeout(timer); resolve({ code: -1, output: `${output}\n${error.message}`, timedOut }) })
    child.on('close', (code) => { clearTimeout(timer); resolve({ code: code ?? -1, output, timedOut }) })
  })
}

function cleanLog(log, workDir) {
  const normalized = log.split(workDir).join('<sketch>').split(workDir.replaceAll('\\', '/')).join('<sketch>')
  return normalized.length > MAX_LOG_CHARS ? `${normalized.slice(0, MAX_LOG_CHARS)}\n… (log đã cắt bớt)` : normalized
}

/** Biên dịch một sketch bằng arduino-cli trong thư mục tạm riêng, luôn dọn thư mục sau khi xong. */
export async function compileArduinoSketch({ source, fqbn, cliPath = DEFAULT_ARDUINO_CLI, timeoutMs = COMPILE_TIMEOUT_MS }) {
  if (!existsSync(cliPath)) return { ok: false, unavailable: true, log: `Không tìm thấy arduino-cli tại ${cliPath}.` }
  const workDir = await mkdtemp(path.join(os.tmpdir(), 'machmo-sketch-'))
  try {
    const sketchDir = path.join(workDir, 'sketch')
    const outDir = path.join(workDir, 'out')
    await mkdir(sketchDir)
    await writeFile(path.join(sketchDir, 'sketch.ino'), source, 'utf8')
    const started = Date.now()
    const result = await runProcess(cliPath, ['compile', '--fqbn', fqbn, '--output-dir', outDir, '--no-color', sketchDir], { timeoutMs, cwd: workDir })
    const log = cleanLog(result.output, workDir)
    if (result.timedOut) return { ok: false, log: `${log}\nHết thời gian biên dịch (${Math.round(timeoutMs / 1000)} s).`, durationMs: Date.now() - started }
    const hexPath = path.join(outDir, 'sketch.ino.hex')
    if (result.code !== 0 || !existsSync(hexPath)) return { ok: false, log, durationMs: Date.now() - started }
    const hex = await readFile(hexPath, 'utf8')
    if (hex.length > MAX_HEX_BYTES) return { ok: false, log: `${log}\nTệp HEX quá lớn.` }
    return { ok: true, hex, log, durationMs: Date.now() - started }
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

/** Lấy đoạn nạp ở địa chỉ 0 (bootrom 16 KB) từ ELF 32-bit little-endian. */
export function extractBootromFromElf(elf) {
  if (elf.length < 52 || elf.readUInt32BE(0) !== 0x7f454c46) throw new Error('Tệp bootrom không phải ELF.')
  const phoff = elf.readUInt32LE(28), phentsize = elf.readUInt16LE(42), phnum = elf.readUInt16LE(44)
  for (let index = 0; index < phnum; index += 1) {
    const at = phoff + index * phentsize
    const type = elf.readUInt32LE(at), offset = elf.readUInt32LE(at + 4), paddr = elf.readUInt32LE(at + 12), size = elf.readUInt32LE(at + 16)
    if (type === 1 && paddr === 0 && size === RP2040_BOOTROM.bytes) return elf.subarray(offset, offset + size)
  }
  throw new Error('ELF không có đoạn bootrom 16 KB ở địa chỉ 0.')
}

let bootromPromise
/** Bootrom B2 từ cache cục bộ, hoặc tải bản phát hành chính thức rồi kiểm SHA-256. */
export async function loadRp2040Bootrom(fetchImpl = fetch) {
  if (existsSync(RP2040_BOOTROM.cacheFile)) return readFile(RP2040_BOOTROM.cacheFile)
  const response = await fetchImpl(RP2040_BOOTROM.url)
  if (!response.ok) throw new Error(`Tải bootrom thất bại (HTTP ${response.status}).`)
  const elf = Buffer.from(await response.arrayBuffer())
  const digest = createHash('sha256').update(elf).digest('hex')
  if (digest !== RP2040_BOOTROM.sha256) throw new Error('SHA-256 của bootrom không khớp bản phát hành B2 chính thức.')
  const rom = Buffer.from(extractBootromFromElf(elf))
  await mkdir(path.dirname(RP2040_BOOTROM.cacheFile), { recursive: true })
  await writeFile(RP2040_BOOTROM.cacheFile, rom)
  return rom
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/** Chỉ cho phép máy cục bộ; chặn DNS rebinding qua Host và trang lạ qua Origin. */
export function isLocalRequest(req) {
  if (!LOOPBACK.has(req.socket?.remoteAddress ?? '')) return false
  const host = String(req.headers.host ?? '').replace(/:\d+$/, '').toLowerCase()
  if (!LOCAL_HOSTNAMES.has(host)) return false
  const origin = req.headers.origin
  if (origin) {
    try { if (!LOCAL_HOSTNAMES.has(new URL(origin).hostname.toLowerCase())) return false } catch { return false }
  }
  return true
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) { reject(Object.assign(new Error('too-large'), { status: 413 })); req.destroy(); return }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** Middleware kiểu connect cho Vite dev/preview hoặc http.createServer. */
export function createLocalToolsMiddleware(options = {}) {
  const guideAi = createGuideAiMiddleware()
  const cliPath = options.cliPath ?? DEFAULT_ARDUINO_CLI
  const compile = options.compile ?? compileArduinoSketch
  const getBootrom = options.loadBootrom ?? (() => (bootromPromise ??= loadRp2040Bootrom().catch((error) => { bootromPromise = undefined; throw error })))
  let busy = false
  return async function localTools(req, res, next) {
    const url = req.url ?? ''
    if (url.startsWith('/api/guide-ai/')) { await guideAi(req, res, next); return }
    if (!url.startsWith(API_PREFIX)) { next?.(); return }
    if (!isLocalRequest(req)) { sendJson(res, 403, { ok: false, message: 'Dịch vụ công cụ cục bộ chỉ nhận yêu cầu từ localhost.' }); return }
    const route = url.slice(API_PREFIX.length).split('?')[0]
    try {
      if (route === '/health' && req.method === 'GET') {
        sendJson(res, 200, { ok: true, arduinoCli: existsSync(cliPath), boards: Object.keys(ARDUINO_FQBN), rp2040Bootrom: existsSync(RP2040_BOOTROM.cacheFile) ? 'cached' : 'downloadable' })
        return
      }
      if (route === '/rp2040-bootrom' && req.method === 'GET') {
        const rom = await getBootrom()
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-store')
        res.end(rom)
        return
      }
      if (route === '/compile' && req.method === 'POST') {
        if (!String(req.headers['content-type'] ?? '').includes('application/json')) { sendJson(res, 415, { ok: false, message: 'Cần Content-Type application/json.' }); return }
        let body
        try { body = JSON.parse(await readBody(req, MAX_SKETCH_BYTES + 4096)) } catch (error) {
          sendJson(res, error.status === 413 ? 413 : 400, { ok: false, message: error.status === 413 ? 'Yêu cầu quá lớn.' : 'JSON không hợp lệ.' })
          return
        }
        const request = validateCompileRequest(body)
        if (!request.ok) { sendJson(res, request.status, { ok: false, message: request.message }); return }
        if (busy) { sendJson(res, 429, { ok: false, message: 'Đang biên dịch một sketch khác, thử lại sau vài giây.' }); return }
        busy = true
        try {
          const result = await compile({ source: request.source, fqbn: request.fqbn, cliPath })
          sendJson(res, result.unavailable ? 503 : 200, { ...result, board: request.board, fqbn: request.fqbn })
        } finally { busy = false }
        return
      }
      sendJson(res, 404, { ok: false, message: 'Không có API này.' })
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error instanceof Error ? error.message : 'Lỗi dịch vụ cục bộ.' })
    }
  }
}

/** Chạy riêng: chỉ nghe 127.0.0.1. */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.MACHMO_TOOLS_PORT || 5197)
  const middleware = createLocalToolsMiddleware()
  http.createServer((req, res) => middleware(req, res, () => sendJson(res, 404, { ok: false, message: 'Không có API này.' })))
    .listen(port, '127.0.0.1', () => console.log(`Mạch Mở local tools: http://127.0.0.1:${port}${API_PREFIX}/health`))
}
