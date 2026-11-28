import { randomUUID } from 'node:crypto'
import { isLocalRequest } from './arduino-compile-service.mjs'
import { renodeInvalidSession } from './renode-local-process.mjs'

async function bodyFor(req, stage) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new Error('Cần gửi JSON.')
  const sizeLimit = 768
  if (Number(req.headers['content-length']) > sizeLimit) throw new Error('Yêu cầu ' + stage + ' quá lớn.')
  let size = 0
  let body = ''
  req.setEncoding('utf8')
  for await (const piece of req.iterator({ destroyOnReturn: false })) {
    size += Buffer.byteLength(piece)
    if (size > sizeLimit) throw new Error('Yêu cầu ' + stage + ' quá lớn.')
    body += piece
  }
  const value = JSON.parse(body)
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Yêu cầu ' + stage + ' không hợp lệ.')
  return value
}

function reply(res, status, value) {
  if (res.destroyed) return
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(value))
}

export function createRenodeLocalService(root, { stage, prefix, openMachine, perTab = false,
  authorize = req => isLocalRequest(req) && req.headers.origin === (req.socket.encrypted ? 'https://' : 'http://') + req.headers.host,
  reserve = () => () => {},
}) {
  const invalidSession = renodeInvalidSession(stage)
  const sessions = new Map()
  function release(session) {
    session.cancel.abort(new Error(invalidSession))
    return session.retirement ??= (async () => {
      const machine = await session.opened?.catch(() => undefined)
      try { await machine?.stop() }
      finally {
        sessions.delete(session.id)
        session.free()
      }
    })()
  }

  async function middleware(req, res, next) {
    if (!req.url?.startsWith(prefix)) return next()
    const fail = (status, message) => reply(res, status, { message })
    if (!authorize(req)) return fail(403, 'Origin không được phép chạy ' + stage + '.')
    if (req.method !== 'POST') return fail(405, stage + ' yêu cầu POST.')
    const operation = req.url.slice(prefix.length)
    if (operation !== 'start' && operation !== 'step' && operation !== 'stop') return fail(404, 'Không có thao tác ' + stage + ' này.')
    let body
    try { body = await bodyFor(req, stage) } catch { req.resume(); return fail(400, 'Yêu cầu ' + stage + ' không hợp lệ.') }
    if (operation === 'start') {
      const tab = perTab ? body.tab : undefined
      if (Object.keys(body).length !== (perTab ? 2 : 1) || typeof body.boardId !== 'string'
          || perTab && (typeof tab !== 'string' || !/^[a-f0-9-]{36}$/i.test(tab))) {
        return fail(400, 'Cần chọn board ' + stage + '.')
      }
      if ([...sessions.values()].some(session => session.tab === tab)) return fail(409, 'Đã có phiên firmware ' + stage + '.')
      const free = reserve(req, tab)
      if (!free) return fail(429, 'Máy chủ đang bận. Thử lại sau.')
      const session = { id: randomUUID(), tab, free, cancel: new AbortController(), pending: true }
      sessions.set(session.id, session)
      const disconnect = () => { if (!res.writableEnded) void release(session) }
      res.once('close', disconnect)
      session.opened = Promise.resolve().then(() => openMachine(root, body.boardId, session.cancel.signal))
      try {
        const machine = await session.opened
        machine.signal.addEventListener('abort', () => { void release(session) }, { once: true })
        void machine.closed.then(() => release(session))
        session.pending = false
        reply(res, 200, { ...machine.initial, id: session.id, approvalSha256: machine.approvalSha256 })
      } catch (error) {
        await release(session)
        fail(503, error instanceof Error && !('code' in error) ? error.message : 'Chưa mở được phiên ' + stage + '.')
      } finally { res.off('close', disconnect) }
      return
    }
    const step = operation === 'step'
    const duration = perTab && step ? body.milliseconds : undefined
    if (Object.keys(body).length !== (step ? 2 : 1) + Number(duration !== undefined) || typeof body.id !== 'string'
      || step && typeof body.pressed !== 'boolean'
      || duration !== undefined && (!Number.isInteger(duration) || duration < 1 || duration > 100)) {
      return fail(400, 'Bước ' + stage + ' không hợp lệ.')
    }
    const session = sessions.get(body.id)
    if (operation === 'stop') {
      if (session?.id === body.id) await release(session)
      return reply(res, 200, { stopped: true })
    }
    if (!session || session.id !== body.id || session.cancel.signal.aborted) return fail(404, invalidSession)
    if (session.pending) return fail(409, 'Phiên firmware đang xử lý bước trước.')
    session.pending = true
    const disconnect = () => { if (!res.writableEnded) void release(session) }
    res.once('close', disconnect)
    try {
      const machine = await session.opened
      reply(res, 200, await machine.step(body.pressed, duration))
    } catch {
      await release(session)
      fail(503, invalidSession)
    } finally {
      session.pending = false
      res.off('close', disconnect)
    }
  }
  return { middleware, close: () => { for (const session of sessions.values()) void release(session) } }
}
