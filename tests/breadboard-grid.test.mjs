import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let grid
let layout
let breadboardGrid

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;[breadboardGrid, layout, grid] = await Promise.all([
    server.ssrLoadModule('/src/lib/breadboardGrid.ts'),
    server.ssrLoadModule('/src/lib/assemblyLayout.ts'),
    server.ssrLoadModule('/src/data/componentModels.ts'),
  ])
  grid = grid.getComponentMesh('breadboard').gridMm
})

after(async () => { await server?.close() })

test('all 400 hole IDs round-trip parse and format', () => {
  const ids = []
  for (let column = 1; column <= 30; column++) {
    for (const row of 'abcdefghij') ids.push(`bb1:${column}${row}`)
  }
  for (const rail of ['T+', 'T-', 'B+', 'B-']) {
    for (let hole = 1; hole <= 25; hole++) ids.push(`bb1:${rail}:${hole}`)
  }
  assert.equal(ids.length, 400)
  for (const id of ids) assert.equal(breadboardGrid.formatHole(breadboardGrid.parseHole(id)), id)
})

test('strip and rail electrical grouping follows breadboard connectivity', () => {
  const hole = id => breadboardGrid.parseHole(id)
  assert.equal(breadboardGrid.holeNet(hole('bb1:10a')), breadboardGrid.holeNet(hole('bb1:10e')))
  assert.notEqual(breadboardGrid.holeNet(hole('bb1:10e')), breadboardGrid.holeNet(hole('bb1:10f')))
  assert.notEqual(breadboardGrid.holeNet(hole('bb1:10a')), breadboardGrid.holeNet(hole('bb1:11a')))
  assert.notEqual(breadboardGrid.holeNet(hole('bb1:T+:1')), breadboardGrid.holeNet(hole('bb1:T-:1')))
  assert.equal(breadboardGrid.holeNet(hole('bb1:T+:1')), breadboardGrid.holeNet(hole('bb1:T+:25')))
  assert.notEqual(breadboardGrid.holeNet(hole('bb1:T+:1'), { railSplit: true }), breadboardGrid.holeNet(hole('bb1:T+:25'), { railSplit: true }))
  assert.equal(breadboardGrid.stripHoles(hole('bb1:10c')).length, 5)
  assert.equal(breadboardGrid.railHoles('T+').length, 25)
})

test('hole coordinates match assemblyLayout.holePoint for at least three grid holes', () => {
  for (const [id, column, row] of [['bb1:1a', 0, 0], ['bb1:14c', 13, 2], ['bb1:30j', 29, 9]]) {
    const actual = breadboardGrid.holeToMm(breadboardGrid.parseHole(id), grid)
    const expected = layout.holePoint({ ...grid, originX: 0, originZ: 0 }, column, row)
    assert.ok(Math.max(...actual.map((value, index) => Math.abs(value - expected[index]))) <= 1e-9, id)
  }
})

test('invalid IDs and non-finite points return null without throwing', () => {
  for (const id of ['', 'bb1:31a', 'bb1:5k', 'bb1:01a', 'bb1:T+:26', 'bb1:T+:01', 'bb1:t+:1']) assert.equal(breadboardGrid.parseHole(id), null)
  assert.equal(breadboardGrid.holeToMm(null, grid), null)
  assert.equal(breadboardGrid.snapNearest([Number.NaN, 0, 0], grid), null)
})

test('malformed object rows are rejected consistently by every hole helper', () => {
  for (const row of ['', 'ab']) {
    const hole = { kind: 'grid', board: 'bb1', column: 1, row }
    assert.equal(breadboardGrid.formatHole(hole), null, `formatHole row ${JSON.stringify(row)}`)
    assert.equal(breadboardGrid.holeToMm(hole, grid), null, `holeToMm row ${JSON.stringify(row)}`)
    assert.equal(breadboardGrid.holeNet(hole), null, `holeNet row ${JSON.stringify(row)}`)
    assert.deepEqual(breadboardGrid.stripHoles(hole), [], `stripHoles row ${JSON.stringify(row)}`)
  }
})

test('nearest-hole snapping is deterministic and returns the exact grid point', () => {
  const expected = breadboardGrid.parseHole('bb1:14c')
  const point = breadboardGrid.holeToMm(expected, grid)
  assert.deepEqual(breadboardGrid.snapNearest(point, grid), expected)
})
