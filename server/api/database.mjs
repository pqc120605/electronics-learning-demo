import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

export const STAGING_DATABASE = 'machmo_api_staging'
export const STAGING_OWNER = 'machmo_api_stg_owner'
export const STAGING_APP = 'machmo_api_stg_app'

const migrationFiles = [
  [1, './migrations/001-session.sql'],
  [2, './migrations/002-analytics.sql'],
  [3, './migrations/003-oauth-community.sql'],
  [4, './migrations/004-guide-ai.sql'],
  [5, './migrations/005-admin-analytics.sql'],
  [6, './migrations/006-projects.sql'],
  [7, './migrations/007-classrooms.sql'],
  [8, './migrations/008-site-feedback.sql'],
  [9, './migrations/009-dashboard-sites.sql'],
  [10, './migrations/010-dashboard-access.sql'],
  [11, './migrations/011-community-attachments.sql'],
]
const requirePg = createRequire(new URL('../community/package.json', import.meta.url))

export function parseStagingConnection(value, role) {
  let url
  try { url = new URL(value) } catch {}
  if (!url || !['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1'
    || url.pathname !== '/' + STAGING_DATABASE || url.username !== role || url.search || url.hash
    || ![STAGING_APP, STAGING_OWNER].includes(role)) {
    throw new Error('Use the dedicated staging database and role on 127.0.0.1')
  }
  return value
}

export function createStagingPool(value, role) {
  const connectionString = parseStagingConnection(value, role)
  const { Pool } = requirePg('pg')
  const pool = new Pool({ connectionString, max: 4, connectionTimeoutMillis: 2500, idleTimeoutMillis: 10_000, statement_timeout: 4000 })
  pool.on('error', () => console.error(JSON.stringify({ event: 'staging_db_connection_closed' })))
  return pool
}

async function verifyStagingRole(client, role) {
  const result = await client.query(`
    SELECT current_database() AS name, current_user AS role,
           rolsuper AS superuser, rolcreaterole AS create_role, rolcreatedb AS create_db
    FROM pg_catalog.pg_roles WHERE rolname = current_user`)
  const row = result.rows[0]
  if (row?.name !== STAGING_DATABASE || row?.role !== role || row.superuser || row.create_role || row.create_db) {
    throw new Error('Unexpected staging database or privileged staging role')
  }
}

async function readMigrations() {
  return Promise.all(migrationFiles.map(async ([version, path]) => {
    // Normalize checkout line endings so the ledger stays portable between Windows and Linux.
    const sql = (await readFile(new URL(path, import.meta.url), 'utf8')).replaceAll('\r\n', '\n')
    return { version, sql, sha256: createHash('sha256').update(sql).digest('hex') }
  }))
}

export async function migrateStagingDatabase(pool) {
  const migrations = await readMigrations()
  const client = await pool.connect()
  let transaction = false
  let discard = false
  try {
    await verifyStagingRole(client, STAGING_OWNER)
    await client.query('BEGIN')
    transaction = true
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('machmo-api-staging-migrations', 0))")
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version integer PRIMARY KEY,
        sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
        applied_at timestamptz NOT NULL DEFAULT now()
      );
      REVOKE ALL ON public.schema_migrations FROM PUBLIC;
      GRANT SELECT ON public.schema_migrations TO machmo_api_stg_app;
    `)
    const ledger = await client.query('SELECT version, sha256 FROM public.schema_migrations')
    const applied = new Map(ledger.rows.map(row => [row.version, row.sha256]))
    const changed = []
    for (const migration of migrations) {
      if (applied.has(migration.version)) {
        if (applied.get(migration.version) !== migration.sha256) throw new Error('Migration checksum mismatch')
        continue
      }
      await client.query(migration.sql)
      await client.query('INSERT INTO public.schema_migrations (version, sha256) VALUES ($1, $2)', [migration.version, migration.sha256])
      changed.push(migration.version)
    }
    await client.query('COMMIT')
    transaction = false
    return changed
  } catch (error) {
    if (transaction) {
      try { await client.query('ROLLBACK') } catch { discard = true }
    }
    throw error
  } finally {
    client.release(discard)
  }
}

export async function verifyStagingDatabase(pool) {
  await verifyStagingRole(pool, STAGING_APP)
  const result = await pool.query('SELECT version, sha256 FROM public.schema_migrations')
  const installed = new Map(result.rows.map(row => [row.version, row.sha256]))
  const migrations = await readMigrations()
  if (!migrations.every(migration => installed.get(migration.version) === migration.sha256)) return false
  await pool.query('SELECT 1 FROM machmo_community.sessions LIMIT 0')
  await pool.query('SELECT 1 FROM machmo_analytics.events LIMIT 0')
  await pool.query('SELECT 1 FROM machmo_community.site_feedback LIMIT 0')
  return true
}
