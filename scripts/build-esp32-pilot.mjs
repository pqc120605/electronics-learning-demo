import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const [approvedSha, runName] = process.argv.slice(2)
if (!/^[0-9a-f]{64}$/.test(approvedSha ?? '') || !/^[a-z0-9-]{1,36}$/.test(runName ?? '')) {
  throw new Error('Usage: node scripts/build-esp32-pilot.mjs <founder-approved config SHA-256> <new run name>')
}
const configPath = new URL('../docs/reviews/2026-11-19-full-web-audit/l6e-esp32-build-proposal.json', import.meta.url)
const raw = await readFile(configPath)
if (hash(raw) !== approvedSha) throw new Error('The approved config SHA-256 does not match this checkout.')
const config = JSON.parse(raw)
if (config.schemaVersion !== 1 || config.mode !== 'proposal' || config.board !== 'esp32-devkit' || config.lesson !== 'blink'
  || config.eraseAll !== false || config.flashBytes !== 4 * 1024 * 1024) throw new Error('Unsupported pilot configuration.')

const command = process.env.MACHMO_PILOT_ARDUINO_CLI ?? 'arduino-cli'
const cli = (args) => execFileSync(command, args, { encoding:'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 5 * 60_000 })
if (!cli(['version']).includes(`Version: ${config.arduinoCliVersion}`)) throw new Error(`Required arduino-cli ${config.arduinoCliVersion}.`)
const coreList = cli(['core','list'])
if (!new RegExp(`^esp32:esp32\\s+${config.esp32CoreVersion.replaceAll('.', '\\.')}\\s`, 'm').test(coreList)) {
  throw new Error(`Required core esp32:esp32@${config.esp32CoreVersion}.`)
}

const server = await createServer({logLevel:'silent',server:{middlewareMode:true,hmr:false}})
let sketch
try {
  const lab = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  sketch = lab.defaultFreestyleWorkspace(config.board, config.lesson).code
} finally { await server.close() }
if (hash(sketch) !== config.sketchSha256) throw new Error('The current Blink sketch differs from the approved source.')

const out = resolve('.tmp', `esp32-pilot-${runName}`)
const sourceDir = resolve(out, 'blink')
const buildDir = resolve(out, 'build')
const reviewDir = resolve(out, 'review-only')
await mkdir(resolve('.tmp'), {recursive:true})
await mkdir(out)
await Promise.all([mkdir(sourceDir),mkdir(buildDir),mkdir(reviewDir)])
await writeFile(resolve(sourceDir, 'blink.ino'), sketch)
const compiled = cli(['compile','--fqbn',config.fqbn,'--build-path',buildDir,sourceDir])
await writeFile(resolve(out,'compile.log'), compiled)

const flashArgs = await readFile(resolve(buildDir,'flash_args'), 'utf8')
const names = { bootloader:'blink.ino.bootloader.bin', partitions:'blink.ino.partitions.bin', boot_app0:'boot_app0.bin', app:'blink.ino.bin' }
const expected = Object.entries(names).map(([kind,name])=>[config.parts[kind],name])
const actual = [...flashArgs.matchAll(/^\s*(0x[\da-f]+)\s+(\S+\.bin)[ \t]*\r?$/gmi)].map(([,offset,name])=>[parseInt(offset,16),name])
if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Pinned toolchain reported flash_args different from the approved offsets.')
const images = []
for (const [kind, name] of Object.entries(names)) {
  const bytes=await readFile(resolve(buildDir,name))
  images.push({kind, bytes:bytes.length, sha256:hash(bytes), offset:config.parts[kind]})
  await writeFile(resolve(reviewDir, `${kind}.bin`), bytes)
}
const manifest = {version:1,board:config.board,lesson:config.lesson,fqbn:config.fqbn,coreVersion:config.esp32CoreVersion,
  sketchSha256:config.sketchSha256,serialBaud:config.serialBaud,flashBytes:config.flashBytes,images}
const encoded = JSON.stringify(manifest,null,2)+'\n'
await writeFile(resolve(reviewDir,'manifest.json'),encoded)
console.log(`Review directory ${reviewDir}`)
console.log(`Config SHA-256 ${approvedSha}\nManifest SHA-256 ${hash(encoded)}`)
