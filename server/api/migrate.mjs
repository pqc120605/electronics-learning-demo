import { createStagingPool, migrateStagingDatabase, STAGING_OWNER } from './database.mjs'

let pool
try {
  pool = createStagingPool(process.env.DATABASE_OWNER_URL, STAGING_OWNER)
  const applied = await migrateStagingDatabase(pool)
  console.log(JSON.stringify({ event: 'staging_migration_complete', applied }))
} catch {
  console.error(JSON.stringify({ event: 'staging_migration_failed' }))
  process.exitCode = 1
} finally {
  if (pool) await pool.end()
}
