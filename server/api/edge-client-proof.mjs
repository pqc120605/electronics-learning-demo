import { createHmac, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'

export const EDGE_CLIENT_HEADER = 'x-machmo-edge-client'
export const validEdgeKey = key => typeof key === 'string' && /^[0-9a-f]{64}$/.test(key)
const digest = (key, text) => createHmac('sha256', Buffer.from(key, 'hex')).update(text).digest('base64url')
const signature = (key, timestamp, id, method, path) => digest(key, ['edge-proof-v1', timestamp, id, method, path].join('\n'))

function canonicalAddress(address) {
  const family = isIP(address)
  if (!family || address.includes('%')) return null
  if (family === 4) return address
  const host = new URL('http://[' + address + ']').hostname.slice(1, -1)
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(host)
  if (!mapped) return host
  const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16)
  return [high >> 8, high & 255, low >> 8, low & 255].join('.')
}

export function makeEdgeClientProof(key, address, method, path, now = Date.now()) {
  const ip = canonicalAddress(address)
  if (!validEdgeKey(key) || !ip) return null
  const time = Math.floor(now / 1000)
  const id = digest(key, ['edge-client-v1', Math.floor(time / 86400), ip].join('\n'))
  return [time, id, signature(key, time, id, method, path)].join('.')
}

export function readEdgeClientProof(key, proof, method, path, now = Date.now()) {
  if (!validEdgeKey(key) || typeof proof !== 'string') return null
  const fields = /^(\d{10})\.([a-zA-Z0-9_-]{43})\.([a-zA-Z0-9_-]{43})$/.exec(proof)
  if (!fields) return null
  const [, time, id, mac] = fields
  const age = Math.floor(now / 1000) - Number(time)
  if (age < -5 || age > 60) return null
  const expected = signature(key, time, id, method, path)
  return timingSafeEqual(Buffer.from(mac), Buffer.from(expected)) ? id : null
}
