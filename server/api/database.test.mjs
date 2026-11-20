import assert from 'node:assert/strict'
import test from 'node:test'
import { migrateStagingDatabase, parseStagingConnection, STAGING_OWNER, STAGING_APP } from './database.mjs'

const stagingUrl = (user = STAGING_APP, host = '127.0.0.1', database = 'machmo_api_staging') =>
  'postgresql://' + user + '@' + host + ':55432/' + database

test('runtime and migration connections must stay on the dedicated staging database and role', () => {
  assert.equal(parseStagingConnection(stagingUrl(), STAGING_APP), stagingUrl())
  assert.equal(parseStagingConnection(stagingUrl(STAGING_OWNER), STAGING_OWNER), stagingUrl(STAGING_OWNER))
  assert.throws(() => parseStagingConnection(stagingUrl(STAGING_OWNER), STAGING_APP), /staging/i)
  assert.throws(() => parseStagingConnection(stagingUrl(STAGING_APP, 'db.example'), STAGING_APP), /staging/i)
  assert.throws(() => parseStagingConnection(stagingUrl(STAGING_APP, '127.0.0.1', 'machmo_analytics'), STAGING_APP), /staging/i)
  assert.throws(() => parseStagingConnection('not-a-url-with-private-data', STAGING_APP),
    error => !error.message.includes('private-data') && /staging/i.test(error.message))
})

function databaseFixture({ superuser = false, failure, mismatch = false } = {}) {
  const ledger = new Map()
  const calls = []
  const client = {
    async query(sql, params = []) {
      calls.push(sql)
      if (sql.includes('current_database()')) {
        return { rows: [{ name: 'machmo_api_staging', role: STAGING_OWNER, superuser, create_role: false, create_db: false }] }
      }
      if (failure && sql.includes(failure)) throw new Error('fixture failure')
      if (sql.startsWith('SELECT version, sha256')) {
        return { rows: [...ledger].map(([version, sha256]) => ({ version, sha256: mismatch ? 'bad' : sha256 })) }
      }
      if (sql.startsWith('INSERT INTO public.schema_migrations')) ledger.set(...params)
      return { rows: [] }
    },
    release() { calls.push('release') },
  }
  return { pool: { connect: async () => client }, calls }
}

test('the staging migration ledger locks concurrent writes and skips already recorded SQL', async () => {
  const { pool, calls } = databaseFixture()
  assert.deepEqual(await migrateStagingDatabase(pool), [1, 2, 3])
  assert.deepEqual(await migrateStagingDatabase(pool), [])
  assert.equal(calls.filter(sql => sql.includes('CREATE TABLE machmo_analytics.events')).length, 1)
  assert.equal(calls.filter(sql => sql.includes('CREATE TABLE machmo_community.oauth_identities')).length, 1)
  assert.equal(calls.filter(sql => sql.includes('pg_advisory_xact_lock')).length, 2)
  assert.equal(calls.filter(sql => sql === 'COMMIT').length, 2)
})

test('migration rejects a privileged role and rolls back an incomplete transaction', async () => {
  const privileged = databaseFixture({ superuser: true })
  await assert.rejects(migrateStagingDatabase(privileged.pool), /staging/i)
  assert.ok(!privileged.calls.some(sql => sql.includes('CREATE')))
  const incomplete = databaseFixture({ failure: 'CREATE TABLE machmo_analytics.events' })
  await assert.rejects(migrateStagingDatabase(incomplete.pool), /fixture failure/)
  assert.ok(incomplete.calls.includes('ROLLBACK'))
  assert.ok(!incomplete.calls.includes('COMMIT'))
})

test('migration rejects a digest mismatch before reapplying SQL', async () => {
  const { pool, calls } = databaseFixture({ mismatch: true })
  await migrateStagingDatabase(pool)
  await assert.rejects(migrateStagingDatabase(pool), /checksum/i)
  assert.equal(calls.filter(sql => sql.includes('CREATE TABLE machmo_analytics.events')).length, 1)
})
