/** Keep the application role separate from the account/invitation issuer. */
export function createSessionStore(pool) {
  return {
    async redeem(inviteDigest, sessionDigest, expiresAt) {
      const result = await pool.query(`
        WITH redeemed AS (
          UPDATE machmo_community.invites AS invite
          SET redeemed_at = now()
          FROM machmo_community.accounts AS account
          WHERE invite.digest = $1 AND invite.redeemed_at IS NULL AND invite.expires_at > now()
            AND account.id = invite.account_id AND account.revoked_at IS NULL
          RETURNING invite.account_id, account.display_name
        ), session AS (
          INSERT INTO machmo_community.sessions (digest, account_id, expires_at)
          SELECT $2, account_id, $3 FROM redeemed
          RETURNING account_id
        )
        SELECT session.account_id AS id, redeemed.display_name AS "displayName"
        FROM session JOIN redeemed USING (account_id)
      `, [inviteDigest, sessionDigest, expiresAt])
      return result.rows[0] ?? null
    },
    async read(sessionDigest) {
      const result = await pool.query(`
        SELECT account.id, account.display_name AS "displayName"
        FROM machmo_community.sessions AS session
        JOIN machmo_community.accounts AS account ON account.id = session.account_id
        WHERE session.digest = $1 AND session.expires_at > now() AND account.revoked_at IS NULL
      `, [sessionDigest])
      return result.rows[0] ?? null
    },
    async revoke(sessionDigest) {
      await pool.query('DELETE FROM machmo_community.sessions WHERE digest = $1', [sessionDigest])
    },
    async expire() {
      await pool.query('DELETE FROM machmo_community.sessions WHERE expires_at <= now()')
    },
  }
}
