import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { createServer } from 'vite'
import { a11Approval, a11AssetDir, digestA11, readA11LockedFile, readA11Proposal } from './a11-esp32-assets.mjs'

const proposal = await readA11Proposal()
const { runtime } = proposal
const archive = resolve('.tmp/a11-vendor/esp-emu-1.3.0-wasm.tar.gz')
await readA11LockedFile(archive, runtime.archive.sha256)
await readA11LockedFile('.tmp/a2-vendor/esp-idf-v5.5.6.zip', runtime.sdk.archiveSha256)
await readA11LockedFile('.tmp/a4-vendor/xtensa-esp-elf-14.2.0_20260121-x86_64-w64-mingw32.zip', runtime.compiler.sha256)

const build = resolve(process.argv[2] ?? '.tmp/a11-build')
const info = JSON.parse(await readFile(join(build, 'project_description.json'), 'utf8'))
const configHeader = await readFile(join(build, 'config/sdkconfig.h'), 'utf8')
const sdkLines = new Set(configHeader.split(/\r?\n/))
const invalidKconfig = runtime.sdkConfig.some(line => {
  const [name, value] = line.split('=')
  const macroValue = value === 'y' ? '1' : name === 'CONFIG_IDF_TARGET' ? JSON.stringify(value) : value
  return !sdkLines.has(`#define ${name} ${macroValue}`)
})
if (info.target !== 'esp32' || !/^v5\.5\.6(?:-dirty)?$/.test(info.git_revision)
    || !/a4-vendor[\\/].*xtensa-esp32-elf-gcc/i.test(info.c_compiler ?? '') || invalidKconfig
    || !sdkLines.has('#define CONFIG_ESP_CONSOLE_UART_BAUDRATE 115200') || sdkLines.has('#define CONFIG_SPIRAM 1')) {
  throw new Error('A11 ESP-IDF build settings do not match the approved configuration')
}

const rawArgs = await readFile(join(build, 'flasher_args.json'))
const args = JSON.parse(rawArgs)
const { bootloaderOffset, partitionTableOffset, factoryAppOffset, bytes: flashSize } = runtime.flash
const layout = [[bootloaderOffset, Number(partitionTableOffset), 'bootloader/bootloader.bin'],
  [partitionTableOffset, Number(factoryAppOffset), 'partition_table/partition-table.bin'],
  [factoryAppOffset, 0x110000, 'machmo_esp32_lx6_a11.bin']]
if (args.extra_esptool_args?.chip !== 'esp32' || args.flash_settings?.flash_size !== '4MB'
    || args.flash_settings.flash_mode !== 'dio' || args.flash_settings.flash_freq !== '40m'
    || Object.keys(args.flash_files).length !== layout.length) throw new Error('Invalid A11 flash layout')
const flash = Buffer.alloc(flashSize, 0xff)
for (const [offset, limit, expected] of layout) {
  const addr = Number(offset)
  if (args.flash_files[offset] !== expected) throw new Error(`Unexpected file at ${offset}`)
  const image = await readFile(join(build, expected))
  if (!image.length || addr + image.length > limit) throw new Error(`Image exceeds A11 partition at ${offset}`)
  image.copy(flash, addr)
}

const vite = await createServer({ configFile: false, envFile: false, logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null } })
const fixtures = {}
const sourceSha256 = digestA11(await readFile('firmware/esp32-lx6-a11/main/button_led.c'))
try {
  const { assertA11Image, assertA11Source } = await vite.ssrLoadModule('/src/lib/freestyle/a11EspRuntime.ts')
  const { buildA11Fixture } = await vite.ssrLoadModule('/src/lib/freestyle/a11EspFixture.ts')
  assertA11Image(flash)
  assertA11Source(flash, sourceSha256)
  for (const board of proposal.boards) {
    const fixture = buildA11Fixture(board.fixtureId)
    if (!fixture || fixture.boardId !== board.id) throw new Error('Missing A11 fixture ' + board.id)
    fixtures[board.id] = { id: board.fixtureId, revision: board.revision, sha256: digestA11(JSON.stringify(fixture)) }
  }
} finally { await vite.close() }

const archiveFiles = {
  'esp_emu.js': 'pkg/esp_emu.js', 'esp_emu_bg.wasm': 'pkg/esp_emu_bg.wasm', 'cosim.js': 'cosim.js', 'LICENSE': 'pkg/LICENSE',
}
const engine = Object.fromEntries(Object.entries(archiveFiles).map(([name, member]) => [name,
  execFileSync('tar', ['-xOf', archive, 'esp-emu-1.3.0-wasm/www/' + member], { windowsHide: true, maxBuffer: 16 * 1024 * 1024 }),
]))
const assetInfo = data => ({ bytes: data.length, sha256: digestA11(data) })
const manifest = { approvalSha256: a11Approval, revision: proposal.revision, target: 'esp32', sdk: info.git_revision,
  archiveSha256: runtime.archive.sha256, sourceSha256, flasherArgsSha256: digestA11(rawArgs),
  sdkconfigSha256: digestA11(configHeader), fixtures, flash: assetInfo(flash),
  engine: Object.fromEntries(Object.entries(engine).map(([name, bytes]) => [name, assetInfo(bytes)])) }
const out = resolve(a11AssetDir)
await mkdir(join(out, 'engine'), { recursive: true })
await mkdir(join(out, 'image'), { recursive: true })
await Promise.all(Object.entries(engine).map(([name, bytes]) => writeFile(join(out, 'engine', name), bytes)))
await writeFile(join(out, 'image/flash.bin'), flash)
await writeFile(join(out, 'image/flash.bin.gz'), gzipSync(flash))
await writeFile(join(out, 'image/manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ target: manifest.target, flash: manifest.flash, wasm: manifest.engine['esp_emu_bg.wasm'], fixtures }, null, 2))
