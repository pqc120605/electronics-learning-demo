// 2026-11-15: tour hướng dẫn lần đầu + điều hướng năm khu vực.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { TOURS, TOUR_ORDER, TOUR_SEEN_KEY, markTourSeen, readSeenTours, tourIdForPath } from '../src/components/onboarding/tours.ts'

function memoryStorage() {
  const data = new Map()
  return { getItem: (k) => data.has(k) ? data.get(k) : null, setItem: (k, v) => { data.set(k, String(v)) } }
}

test('each guided page maps to its own tour; other pages have none', () => {
  assert.equal(tourIdForPath('/'), 'home')
  assert.equal(tourIdForPath('/build/freestyle'), 'freestyle')
  assert.equal(tourIdForPath('/app/lab/freestyle/'), 'freestyle')
  assert.equal(tourIdForPath('/build'), 'lab')
  assert.equal(tourIdForPath('/app/lab'), 'lab')
  assert.equal(tourIdForPath('/learn/esp32-led'), 'lesson')
  assert.equal(tourIdForPath('/app/learn/esp32-led'), 'lesson')
  assert.equal(tourIdForPath('/app'), 'app-home')
  for (const path of ['/boards', '/components', '/app/boards', '/app/components']) assert.equal(tourIdForPath(path), 'library', path)
  for (const path of ['/tools/sketch', '/app/tools/sketch']) assert.equal(tourIdForPath(path), 'tools', path)
  for (const path of ['/learn/blink', '/community']) assert.equal(tourIdForPath(path), null, path)
})

test('tours are short, labelled and point every step at a region', () => {
  assert.deepEqual([...TOUR_ORDER].sort(), Object.keys(TOURS).sort())
  for (const tour of Object.values(TOURS)) {
    assert.ok(tour.steps.length >= 3 && tour.steps.length <= 7, `${tour.id} has ${tour.steps.length} steps`)
    assert.equal(tourIdForPath(tour.publicPath), tour.id)
    assert.equal(tourIdForPath(tour.appPath), tour.id)
    for (const step of tour.steps) {
      assert.ok(step.target.length > 0 && step.title && step.body, `${tour.id}: ${step.title}`)
    }
    assert.equal(tour.steps.at(-1).target[0], '.help-menu-button', `${tour.id} ends by pointing at Help`)
  }
})

test('seen state round-trips through localStorage and survives bad data', () => {
  const storage = memoryStorage()
  assert.deepEqual(readSeenTours(storage), {})
  markTourSeen(storage, 'lab', 111)
  markTourSeen(storage, 'home', 222)
  assert.deepEqual(readSeenTours(storage), { lab: 111, home: 222 })
  storage.setItem(TOUR_SEEN_KEY, '{oops')
  assert.deepEqual(readSeenTours(storage), {})
  storage.setItem(TOUR_SEEN_KEY, '[1,2]')
  assert.deepEqual(readSeenTours(storage), {})
  assert.deepEqual(readSeenTours(null), {})
  assert.doesNotThrow(() => markTourSeen({ getItem: () => null, setItem: () => { throw new Error('quota') } }, 'home'))
})

test('public navigation is grouped into five areas without dropping any route', async () => {
  const nav = await readFile('src/components/SiteNavigation.tsx', 'utf8')
  const labels = [...nav.matchAll(/\{ id: '[a-z]+', label: '([^']+)', items:/g)].map(match => match[1])
  assert.deepEqual(labels, ['Học', 'Lắp mạch', 'Thư viện', 'Dự án'])
  assert.match(nav, /F\.community\.publicRoute/)
  for (const route of ['F.lesson', 'F.learning', 'F.projects', 'F.dashboard', 'F.classroom', 'R.publicFreestyle', 'F.lab', 'F.boards', 'F.components', 'F.sketch', 'F.spice', 'F.calculators', 'F.firmware']) assert.ok(nav.includes(route), route)
})
