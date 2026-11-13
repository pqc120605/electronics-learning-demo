// Records each published board GLB and derives its browser cache version from its bytes.
// Run after replacing a GLB: node scripts/export-board-asset-lock.mjs
import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
const load = (path) => server.ssrLoadModule(path)
const [{ esp32DevkitModel }, { arduinoBoardModels }, { raspberryPiBoardModels }, { communityBoardModels }, { adafruitBoardModels }, { seeedBoardModels }, { espressifBoardModels }] = await Promise.all(['/src/data/esp32DevkitModel.ts', '/src/data/arduinoBoardModels.ts', '/src/data/raspberryPiBoardModels.ts', '/src/data/communityBoardModels.ts', '/src/data/adafruitBoardModels.ts', '/src/data/seeedBoardModels.ts', '/src/data/espressifBoardModels.ts'].map(load))

const lock = {}
for (const model of [esp32DevkitModel, ...arduinoBoardModels, ...raspberryPiBoardModels, ...communityBoardModels, ...adafruitBoardModels, ...seeedBoardModels, ...espressifBoardModels]) {
  for (const scene of model.scenes) {
    const path = scene.assetUrl.split('?')[0]
    const file = new URL(`../public${path}`, import.meta.url)
    const sha256 = createHash('sha256').update(await readFile(file)).digest('hex')
    lock[path] = { sha256, bytes: (await stat(file)).size, version: sha256.slice(0, 12) }
  }
}
const sorted = Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)))
await writeFile(new URL('../src/data/board-asset-lock.json', import.meta.url), `${JSON.stringify(sorted, null, 2)}\n`)
await server.close()
