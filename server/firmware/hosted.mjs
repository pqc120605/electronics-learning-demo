import { execFile, spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { openA7Machine } from '../../scripts/a7-stm32-service.mjs'
import { openA8Machine } from '../../scripts/a8-ra4m1-service.mjs'
import { openA9Machine } from '../../scripts/a9-stm32-service.mjs'
import { openA12Machine } from '../../scripts/a12-local-service.mjs'
import { createRenodeLocalService } from '../../scripts/renode-local-service.mjs'
import { EDGE_CLIENT_HEADER, readEdgeClientProof } from '../api/edge-client-proof.mjs'

const revision = '60cdc46a7126156d03ba1b74f3bce42dabb59aa642a412e44f75a286528d8509'
const assetPrefix = '/api/tools/firmware-fixtures/r1/'
const sessionPrefix = '/api/tools/firmware-sessions/r1/'
const host = 'mach-mo.vercel.app'
const origin = 'https://' + host
const root = fileURLToPath(new URL('../../', import.meta.url))
const execute = promisify(execFile)
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const makers = { A7: openA7Machine, A8: openA8Machine, A9: openA9Machine }
const targetsA12 = new Map([['esp32-s2-devkitc-1', 'esp32s2'], ['arduino-nano-every', 'atmega4809']])
const types = { '.json': 'application/json', '.js': 'text/javascript', '.wasm': 'application/wasm',
  '.hex': 'text/plain; charset=utf-8', '.bin': 'application/octet-stream', '.elf': 'application/octet-stream' }

function send(res, status, value) {
  if (res.destroyed || res.writableEnded) return
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(value))
}

async function checkedJson(path, hash) {
  const bytes = await readFile(path)
  if (digest(bytes) !== hash) throw new Error('Firmware configuration does not match the approved checksum')
  return JSON.parse(bytes)
}

function routeFor(stage, relative) {
  const [, target, file] = /^(?:[^/]+)\/([^/]+)\/([^/]+)$/.exec(relative) ?? []
  return assetPrefix + stage.toLowerCase() + '/' + (target ?? 'default') + '/' + (file ?? basename(relative))
}

function containerLauncher(image, isolation) {
  return (command, mounts, duration = '90s') => {
    const name = 'machmo-fw-r1-' + randomUUID()
    const child = spawn('podman', ['run', '--rm', '-i', '--pull=never', '--name=' + name,
      '--label=machmo.firmware=r1', '--network=none', '--cap-drop=ALL', '--security-opt=no-new-privileges',
      '--read-only', '--read-only-tmpfs=false', '--tmpfs=/tmp:rw,nosuid,nodev,size=' + isolation.tmpfsMiBPerSession + 'm',
      '--cpus=' + isolation.cpusPerSession, '--memory=' + isolation.memoryMiBPerSession + 'm',
      '--memory-swap=' + isolation.memoryMiBPerSession + 'm', '--pids-limit=' + isolation.pidsPerSession,
      '--userns=keep-id', '--env=HOME=/tmp', '--env=DOTNET_CLI_TELEMETRY_OPTOUT=1',
      ...mounts.flatMap(mount => ['--volume', mount]), '--entrypoint=/usr/bin/timeout', image,
      '--kill-after=2s', duration, ...command], { shell: false })
    const clean = () => execute('podman', ['rm', '--force', '--ignore', name], { timeout: 5000 }).catch(() => {})
    return { child, clean }
  }
}

export async function createHostedFirmwareServer({
  assetsRoot, enabledStages, edgeKey, releaseNotices, projectRoot = root,
}) {
  const data = resolve(assetsRoot)
  const plan = await checkedJson(resolve(projectRoot, 'docs/research/2026-11-28-a1-a12-hosted-firmware-proposal.json'), revision)
  const { browser, miniPc } = plan
  const approved = new Set([...browser.stages, ...miniPc.stages])
  const stages = new Set(enabledStages)
  if (!stages.size || [...stages].some(stage => !approved.has(stage))
      || (['A3', 'A4'].some(stage => stages.has(stage)) && !stages.has('A2'))) {
    throw new Error('Unknown or incomplete hosted firmware stage selection')
  }

  const files = new Map()
  const offer = (route, entry) => files.set(route, entry)
  for (const [stage, entries] of Object.entries({ ...browser.assets, ...miniPc.assets })) {
    if (!stages.has(stage)) continue
    for (const [relative, expected] of Object.entries(entries)) {
      const file = resolve(data, 'assets', relative)
      const bytes = await readFile(file)
      if (bytes.length !== expected.bytes || digest(bytes) !== expected.sha256) {
        throw new Error('Firmware asset does not match approved configuration: ' + relative)
      }
      if (!(stage in browser.assets)) continue
      const route = routeFor(stage, relative.replace(/\.gz$/, ''))
      if (relative.endsWith('.gz')) {
        const entry = files.get(route)
        if (!entry) throw new Error('Compressed firmware asset is missing its source')
        entry.gzip = { file, length: bytes.length }
      } else {
        const extension = /\.[^.]+$/.exec(relative)?.[0]
        offer(route, { file, length: bytes.length, type: types[extension] ?? 'text/plain; charset=utf-8' })
      }
    }
  }
  const notices = await readFile(resolve(projectRoot, releaseNotices))
  offer(assetPrefix + 'notices.txt', { bytes: notices, length: notices.length, type: 'text/plain; charset=utf-8' })
  const native = miniPc.stages.filter(stage => stages.has(stage))
  const run = containerLauncher(miniPc.baseImage, miniPc.isolation)
  if (native.length) await execute('podman', ['image', 'exists', miniPc.baseImage], { timeout: 5000 })
  const renode = resolve(data, 'renode')
  if (native.some(stage => stage in makers)) {
    const archive = await readFile(resolve(data, basename(miniPc.renode.url)))
    if (digest(archive) !== miniPc.renode.sha256) throw new Error('Renode archive does not match the approved build')
    await access(resolve(renode, 'renode'))
  }
  let a12
  if (stages.has('A12')) {
    const pilot = await checkedJson(resolve(projectRoot, miniPc.a12Pilot.file), miniPc.a12Pilot.sha256)
    const assets = resolve(data, '../firmware-pilot-r1/runtime')
    a12 = { assets, manifest: { approvalSha256: pilot.baseline.sha256, files: pilot.artifacts },
      launch: command => run(command, [assets + ':/r2/runtime:ro']) }
    for (const [file, expected] of Object.entries(pilot.artifacts)) {
      if (digest(await readFile(resolve(assets, file))) !== expected) throw new Error('A12 artifact is missing or differs')
    }
  }

  const workers = new Map()
  const requests = new Map()
  const tabIds = new Set()
  const local = req => req.socket.remoteAddress === '127.0.0.1'
  const authorize = req => local(req) && req.headers.host === host && req.headers.origin === origin
  function reserve(req, tab) {
    if (tabIds.size >= miniPc.sessions.maxConcurrent || tabIds.has(tab)) return null
    const now = Date.now()
    for (const [key, value] of requests) if (now >= value.until) requests.delete(key)
    const id = readEdgeClientProof(edgeKey, req.headers[EDGE_CLIENT_HEADER], req.method, req.url)
    const key = id ?? 'guest'
    const count = requests.get(key) ?? { until: now + 60_000, count: 0 }
    if (requests.size >= 128 && !requests.has(key) || count.count >= (id ? 8 : 24)) return null
    count.count += 1
    requests.set(key, count)
    tabIds.add(tab)
    return () => tabIds.delete(tab)
  }

  for (const stage of native) {
    const prefix = sessionPrefix + stage.toLowerCase() + '/'
    const hosted = {
      runner: '/renode/renode',
      assets: resolve(data, 'assets'),
      launch: (runner, args, directory) => run([runner, ...args], [renode + ':/renode:ro', directory + ':' + directory + ':rw']),
    }
    const openMachine = async (checkout, board, signal) => {
      if (stage !== 'A12') return makers[stage](checkout, board, signal, hosted)
      const target = targetsA12.get(board)
      if (!target) throw new Error('Chọn một board đã duyệt cho A12.')
      return openA12Machine(checkout, target, signal, false, a12)
    }
    workers.set(prefix, createRenodeLocalService(projectRoot, { stage, prefix, openMachine, perTab: true, authorize, reserve }))
  }

  const server = createServer({ headersTimeout: 10_000, requestTimeout: 30_000, maxHeaderSize: 8192 }, (req, res) => {
    const path = req.url?.split('?')[0]
    const worker = [...workers].find(([key]) => path?.startsWith(key))?.[1]
    if (worker) {
      void worker.middleware(req, res, () => send(res, 404, {})).catch(() => send(res, 503, { message: 'Phiên firmware đã dừng.' }))
      return
    }
    if (!local(req) || req.headers.host !== host) return send(res, 403, {})
    if (req.method !== 'GET') return send(res, 405, {})
    if (path === assetPrefix + 'status') return send(res, 200, { revision, stages: [...stages].sort() })
    const entry = files.get(path)
    if (!entry) return send(res, 404, {})
    const compressed = entry.gzip && /(?:^|,)\s*gzip\s*(?:,|$)/i.test(req.headers['accept-encoding'] ?? '')
    const transfer = compressed ? entry.gzip : entry
    res.writeHead(200, { 'Content-Type': entry.type, 'Content-Length': transfer.length,
      'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin',
      'Cache-Control': 'no-store', ...(entry.gzip ? { Vary: 'Accept-Encoding' } : {}),
      ...(compressed ? { 'Content-Encoding': 'gzip' } : {}) })
    if (entry.bytes) res.end(entry.bytes)
    else {
      const stream = createReadStream(transfer.file)
      stream.on('error', () => res.destroy())
      res.once('close', () => stream.destroy())
      stream.pipe(res)
    }
  })
  server.on('close', () => { for (const worker of workers.values()) worker.close() })
  return server
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [assetsRoot, stages] = process.argv.slice(2)
  const server = await createHostedFirmwareServer({ assetsRoot, enabledStages: stages.split(','),
    edgeKey: process.env.MACHMO_EDGE_PROXY_HMAC, releaseNotices: 'server/firmware/hosted-notices.txt' })
  server.listen(8286, '127.0.0.1', () => console.info('Approved firmware fixtures ready on loopback'))
  for (const event of ['SIGINT', 'SIGTERM']) process.once(event, () => server.close())
}
