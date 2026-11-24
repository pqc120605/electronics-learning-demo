import { createHmac } from 'node:crypto'

export function normalizeDashboardEmail(value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email.length <= 254 && /^[^@\s,]+@[^@\s,.]+(?:\.[^@\s,.]+)+$/.test(email) ? email : null
}

export function createDashboardAccess(allowlist = '', secret, now = Date.now) {
  const entries = allowlist.split(',').map(item => item.trim()).filter(Boolean)
  if (entries.length && (typeof secret !== 'string' || Buffer.byteLength(secret) < 32)) {
    throw new TypeError('Dashboard access requires a session signing secret')
  }
  const digest = email => createHmac('sha256', secret).update('dashboard-email-v1\0').update(email).digest('hex')
  const allowed = new Set(entries.map(entry => {
    const email = normalizeDashboardEmail(entry)
    if (!email) throw new TypeError('Invalid dashboard email allowlist entry')
    return digest(email)
  }))

  return {
    issue(value) {
      const email = allowed.size ? normalizeDashboardEmail(value) : null
      const proof = email && digest(email)
      if (!allowed.has(proof)) return { proof: null, expires: null }
      return { proof: Buffer.from(proof, 'hex'), expires: new Date(now() + 8 * 3_600_000) }
    },
    allows(proof, expires) {
      return Buffer.isBuffer(proof) && expires instanceof Date && expires.getTime() > now()
        && allowed.has(proof.toString('hex'))
    },
  }
}
