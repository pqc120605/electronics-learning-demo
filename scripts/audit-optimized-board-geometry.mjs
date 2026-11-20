import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'

const modelDirectory = resolve('public/models')
const compressedDirectory = resolve(process.argv[2] || 'public/models/optimized')
const toArrayBuffer = value => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
const sha256 = value => createHash('sha256').update(value).digest('hex')
const vite = await createServer({ logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
try {
  const parser = await vite.ssrLoadModule('/src/components/board/glbParser.ts')
  const names = (await readdir(compressedDirectory)).filter(name => name.endsWith('.meshopt.glb')).sort()
  assert.ok(names.length > 0, 'No optimized board assets to check')
  const pinned = process.argv[2] ? null : JSON.parse(await readFile('src/data/optimizedBoardModels.json','utf8'))
  if (pinned) assert.deepEqual(names,pinned.map(record=>record.optimized).sort())
  const results = []
  for (const name of names) {
    const original = name.replace('.meshopt.glb', '.glb')
    const before = await readFile(resolve(modelDirectory,original)), after = await readFile(resolve(compressedDirectory,name))
    const source = parser.parseBoardGlb(toArrayBuffer(before))
    const optimized = await parser.parseOptimizedBoardGlb(toArrayBuffer(after))
    const bounds = new Map(optimized.nodeBounds.map(node => [node.nodeName,node]))
    const missing = source.nodeBounds.filter(node => !bounds.has(node.nodeName)).map(node => node.nodeName)
    const maxErrorMm = Math.max(...source.nodeBounds.flatMap(node => bounds.has(node.nodeName)
      ? ['center','min','max'].flatMap(key => node[key].map((value,i) => Math.abs(value - bounds.get(node.nodeName)[key][i]) * 1000)) : []))
    const metadata = { original, optimized:name, sourceBytes:before.length, optimizedBytes:after.length, sourceSha256:sha256(before), optimizedSha256:sha256(after),
      sourceNodes:source.nodeBounds.length, optimizedNodes:bounds.size, maxErrorMm, missing }
    if (pinned) {
      const record=pinned.find(item=>item.optimized===name)
      assert.equal(metadata.sourceSha256,record.sourceSha256,original)
      assert.equal(metadata.optimizedSha256,record.optimizedSha256,name)
    }
    results.push(metadata)
    console.log(JSON.stringify(metadata))
  }
  const failures = results.filter(result => result.missing.length || result.optimizedNodes !== result.sourceNodes || !(result.maxErrorMm <= .025) || result.optimizedBytes > 2 * 1024 * 1024)
  assert.deepEqual(failures.map(result => result.original),[],'Optimized models must retain every named node and stay within 0.025 mm and 2 MiB')
} finally { await vite.close() }
