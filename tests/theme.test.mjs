import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readTheme, setTheme } from '../src/lib/theme.ts'
test('theme validates persistence, defaults to light and leaves other keys alone', () => {
  const data = new Map([['draft', 'exact bytes']])
  const storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  const root = { dataset: {} }
  assert.equal(readTheme(storage), 'light')
  for (const value of ['dark', 'system', 'light']) {
    setTheme(value, storage, root)
    assert.equal(root.dataset.theme, value)
    assert.equal(readTheme(storage), value)
    assert.equal(data.get('draft'), 'exact bytes')
  }
  storage.setItem('mm-theme', 'unsupported')
  assert.equal(readTheme(storage), 'light')
})
test('blocked storage still allows changing theme for the current session', () => {
  const blocked = { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('quota') } }
  const root = { dataset: {} }
  assert.equal(readTheme(blocked), 'light')
  assert.doesNotThrow(() => setTheme('dark', blocked, root))
  assert.equal(root.dataset.theme, 'dark')
})
