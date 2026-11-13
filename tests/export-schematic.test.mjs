import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let exportModule

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  exportModule = await server.ssrLoadModule('/src/lib/exportSchematic.ts')
})

after(async () => { await server?.close() })

test('standalone SVG is valid XML markup, records the component count, and has no page CSS variables', () => {
  const sampleComponents = [
    '<article data-schematic-component="board"><svg><text>Board</text></svg></article>',
    '<article data-schematic-component="led"><svg><text>LED</text></svg></article>',
  ]
  const content = `<div>${sampleComponents.join('')}</div>`
  const svg = exportModule.createStandaloneSchematicSvg(content, 400, 240, sampleComponents.length)
  const serializedComponentCount = (svg.match(/data-schematic-component=/g) ?? []).length
  assert.match(svg, /^<svg\b/)
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
  assert.equal(serializedComponentCount, sampleComponents.length)
  assert.match(svg, new RegExp(`<metadata>${serializedComponentCount} linh kiện<\\/metadata>`))
  assert.match(svg, /data-schematic-component="board"/)
  assert.match(svg, /data-schematic-component="led"/)
  assert.match(svg, /<\/svg>$/)
  assert.doesNotMatch(svg, /var\s*\(\s*--/)
})

test('PNG raster source uses SVG-native markup without foreignObject', () => {
  const vectorMarkup = '<g><rect x="10" y="10" width="20" height="12" fill="#fcfcf5"/><text x="20" y="18">LED</text></g>'
  const svg = exportModule.createStandaloneSchematicRasterSvg(vectorMarkup, 80, 60, 1)
  assert.match(svg, /^<svg\b/)
  assert.match(svg, /<rect x="10" y="10" width="20" height="12"/)
  assert.match(svg, /<text x="20" y="18">LED<\/text>/)
  assert.doesNotMatch(svg, /foreignObject/i)
  assert.doesNotMatch(svg, /var\s*\(\s*--/)
})

test('safe schematic filename contains only portable filename characters', () => {
  const filename = exportModule.safeSchematicFilename('Mạch của An / lesson:1', 'png')
  assert.match(filename, /^[A-Za-z0-9._-]+$/)
  assert.ok(filename.endsWith('.png'))
  assert.doesNotMatch(filename, /An/)
})
