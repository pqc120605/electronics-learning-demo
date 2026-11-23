import { inTransaction } from './oauth-store.mjs'

const vietnamDay = "(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date"
const capReached = Symbol('quota')

export function createGuideStore(pool) {
  return {
    async reserve(id, daily, perAccount) {
      try {
        await inTransaction(pool, async db => {
          const total = await db.query('INSERT INTO machmo_guide_ai.daily_total AS total (day,used) ' +
            'VALUES (' + vietnamDay + ',1) ON CONFLICT (day) DO UPDATE SET used=total.used+1 WHERE total.used<$1', [daily])
          if (!total.rowCount) throw capReached
          const account = await db.query('INSERT INTO machmo_guide_ai.daily_account AS account (day,account_id,used) ' +
            'VALUES (' + vietnamDay + ',$1,1) ON CONFLICT (day,account_id) DO UPDATE SET used=account.used+1 WHERE account.used<$2',
          [id, perAccount])
          if (!account.rowCount) throw capReached
        })
        return true
      } catch (error) {
        if (error === capReached) return false
        throw error
      }
    },
    async record(row) {
      await pool.query('INSERT INTO machmo_guide_ai.guide_ai_requests ' +
        '(id,provider,model,status,elapsed_ms,input_tokens,output_tokens,cache_hit,failure_reason) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [
        row.id, row.provider, row.model, row.status, row.elapsedMs,
        row.inputTokens, row.outputTokens, row.cacheHit, row.failureReason,
      ])
    },
    async vote(id, helpful) {
      const result = await pool.query("UPDATE machmo_guide_ai.guide_ai_requests SET helpful=$2 WHERE id=$1 AND status='answered'", [id, helpful])
      return result.rowCount === 1
    },
    async expire() {
      await pool.query('DELETE FROM machmo_guide_ai.daily_total WHERE day<' + vietnamDay + '-1')
      await pool.query('DELETE FROM machmo_guide_ai.daily_account WHERE day<' + vietnamDay + '-1')
      await pool.query("DELETE FROM machmo_guide_ai.guide_ai_requests WHERE created_at<now()-interval '90 days'")
    },
  }
}
