const summaryQuery = `
WITH filtered AS (
  SELECT session_id, event_name, path, created_at
  FROM machmo_analytics.events WHERE created_at >= $1 AND created_at < $2
), daily AS (
  SELECT (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
    count(*) AS events, count(DISTINCT session_id) AS sessions FROM filtered GROUP BY 1
), event_counts AS (
  SELECT event_name, count(*) AS events FROM filtered GROUP BY event_name
), path_counts AS (
  SELECT path, count(*) AS events FROM filtered GROUP BY path ORDER BY events DESC, path LIMIT 30
)
SELECT jsonb_build_object(
  'sessionCount', (SELECT count(DISTINCT session_id) FROM filtered),
  'eventCount', (SELECT count(*) FROM filtered),
  'daily', COALESCE((SELECT jsonb_agg(to_jsonb(daily) ORDER BY day) FROM daily), '[]'::jsonb),
  'byEvent', COALESCE((SELECT jsonb_agg(jsonb_build_object('eventName', event_name, 'events', events) ORDER BY event_name) FROM event_counts), '[]'::jsonb),
  'byPath', COALESCE((SELECT jsonb_agg(to_jsonb(path_counts) ORDER BY events DESC, path) FROM path_counts), '[]'::jsonb)
) AS summary`

export function createPostgresStore(pool, extended = false) {
  return {
    async record({ session_id, event_name, path, component_id, device, referrer_host, lesson_id, board_id }) {
      const client = await pool.connect()
      let discard = false
      try {
        await client.query('BEGIN')
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [session_id.toLowerCase()])
        const result = await client.query(`
          INSERT INTO machmo_analytics.events (session_id, event_name, path, component_id${extended ? ', device, referrer_host, lesson_id, board_id' : ''})
          SELECT $1::uuid, $2, $3, $4${extended ? ', $5, $6, $7, $8' : ''} WHERE (
            SELECT count(*) FROM machmo_analytics.events
            WHERE session_id = $1::uuid AND created_at > now() - interval '1 minute'
          ) < 60 AND (
            SELECT count(*) FROM machmo_analytics.events
            WHERE session_id = $1::uuid AND created_at > now() - interval '1 day'
          ) < 1000`, [session_id, event_name, path, component_id, ...(extended ? [device, referrer_host, lesson_id, board_id] : [])])
        await client.query('COMMIT')
        return result.rowCount === 1
      } catch (error) {
        try { await client.query('ROLLBACK') } catch { discard = true }
        throw error
      } finally {
        client.release(discard)
      }
    },
    async summarize(start, end) {
      const result = await pool.query(summaryQuery, [start, end])
      return result.rows[0].summary
    },
    async expire() { await pool.query('SELECT machmo_analytics.expire_events()') },
  }
}
