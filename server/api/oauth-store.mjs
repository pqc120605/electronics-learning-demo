import { randomUUID } from 'node:crypto'
import { sessionDigest } from '../community/session-http.mjs'

export async function inTransaction(pool, work) {
  const client = await pool.connect()
  let discard = false
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try { await client.query('ROLLBACK') } catch { discard = true }
    throw error
  } finally {
    client.release(discard)
  }
}

export function createOAuthStore(pool, adminAccounts = '') {
  const admins = new Set(adminAccounts.split(',').map(value => value.trim()).filter(Boolean))
  const roleFor = (provider, id) => admins.has(provider + ':' + id) ? 'admin' : 'user'
  return {
    async saveAttempt({ key, provider, next, verifier, nonce, expiresAt }) {
      await pool.query('INSERT INTO machmo_community.oauth_attempts VALUES ($1,$2,$3,$4,$5,$6)',
        [sessionDigest(key), provider, next, verifier, nonce, expiresAt])
    },
    async consumeAttempt(key, provider) {
      const { rows } = await pool.query(
        'DELETE FROM machmo_community.oauth_attempts WHERE digest=$1 AND provider=$2 RETURNING next, verifier, nonce, expires_at AS "expiresAt"',
        [sessionDigest(key), provider])
      return rows[0]
    },
    async startSession(identity, session, previousDigest) {
      const { provider, providerUserId, displayName, avatarUrl } = identity
      const accountKey = provider + ':' + providerUserId
      const role = roleFor(provider, providerUserId)
      await inTransaction(pool, async client => {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', ['machmo-s2:' + accountKey])
        const { rows } = await client.query(
          'SELECT account_id FROM machmo_community.oauth_identities WHERE provider=$1 AND provider_user_id=$2',
          [provider, providerUserId])
        let id = rows[0]?.account_id
        if (id) {
          const updated = await client.query(
            'UPDATE machmo_community.accounts SET display_name=$2, avatar_url=$3, role=$4 WHERE id=$1 AND revoked_at IS NULL',
            [id, displayName, avatarUrl, role])
          if (!updated.rowCount) throw new Error('Account unavailable')
        } else {
          id = randomUUID()
          await client.query('INSERT INTO machmo_community.accounts (id, display_name, avatar_url, role) VALUES ($1,$2,$3,$4)', [id, displayName, avatarUrl, role])
          await client.query('INSERT INTO machmo_community.oauth_identities VALUES ($1,$2,$3)', [provider, providerUserId, id])
        }
        if (previousDigest) await client.query('DELETE FROM machmo_community.sessions WHERE digest=$1', [previousDigest])
        await client.query('INSERT INTO machmo_community.sessions VALUES ($1,$2,$3)', [session.digest, id, session.expiresAt])
      })
    },
    async read(digest) {
      const { rows } = await pool.query(
        'SELECT a.id, a.display_name AS "displayName", a.avatar_url AS "avatarUrl", i.provider, i.provider_user_id, s.expires_at AS "expiresAt" ' +
        'FROM machmo_community.sessions s JOIN machmo_community.accounts a ON a.id=s.account_id ' +
        'JOIN machmo_community.oauth_identities i ON i.account_id=a.id ' +
        'WHERE s.digest=$1 AND s.expires_at>now() AND a.revoked_at IS NULL', [digest])
      const account = rows[0]
      if (!account) return null
      const { provider_user_id, ...session } = account
      return { ...session, role: roleFor(account.provider, provider_user_id) }
    },
    async rotate(id, digest, session) {
      const result = await pool.query(
        'WITH old AS (DELETE FROM machmo_community.sessions WHERE digest=$1 AND account_id=$2 AND expires_at>now() RETURNING account_id) ' +
        'INSERT INTO machmo_community.sessions SELECT $3,account_id,$4 FROM old', [digest, id, session.digest, session.expiresAt])
      return result.rowCount === 1
    },
    async revoke(digest) {
      await pool.query('DELETE FROM machmo_community.sessions WHERE digest=$1', [digest])
    },
    async deleteAccount(id) {
      await inTransaction(pool, async client => {
        await client.query('SELECT id FROM machmo_community.accounts WHERE id=$1 FOR UPDATE', [id])
        await client.query('DELETE FROM machmo_community.sessions WHERE account_id=$1', [id])
        await client.query('DELETE FROM machmo_community.accounts WHERE id=$1', [id])
      })
    },
    async expire() {
      await pool.query('DELETE FROM machmo_community.oauth_attempts WHERE expires_at<=now()')
    },
  }
}
