import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const approvalBytes = await readFile(new URL('../docs/research/2026-11-27-esp32-c3-electrical-firmware-a2-proposal.json', import.meta.url))
const approvalHash = '452a965fe0028db65003a721abd6a9f253660501876949d2c1d8ede05c46b8a3'
if (hash(approvalBytes) !== approvalHash) throw new Error('A2 configuration SHA-256 mismatch')
const approval = JSON.parse(approvalBytes)
const [buildPath, vendorPath] = process.argv.slice(2)
if (!buildPath || !vendorPath) throw new Error('Pass the ESP-IDF build directory and verified vendor staging directory')
const build = resolve(buildPath)
const vendor = resolve(vendorPath)
const archive = await readFile(join(vendor, 'esp-emu-1.2.0-wasm.tar.gz'))
if (hash(archive) !== approval.runtime.engineAssetSha256) throw new Error('ESP-EMU archive SHA-256 mismatch')
const www = join(vendor, 'esp-emu-1.2.0-wasm', 'www')
const flasher = await readFile(join(build, 'flasher_args.json'))
const args = JSON.parse(flasher)
const buildInfo = JSON.parse(await readFile(join(build, 'project_description.json'), 'utf8'))
const sdk = buildInfo.git_revision
if (buildInfo.target !== 'esp32c3' || !/^v5\.5\.6(?:-dirty)?$/.test(sdk) || !buildInfo.c_compiler?.includes('esp-14.2.0_20260121')) {
  throw new Error('Wrong ESP-IDF target, version or compiler')
}
const flash = Buffer.alloc(approval.runtime.flash.bytes, 0xff)
for (const [offset, entry] of Object.entries(args.flash_files)) {
  const image = await readFile(join(build, entry))
  const address = Number(offset)
  if (address < 0 || address + image.length > flash.length) throw new Error('ESP-IDF build file exceeds 4 MiB flash')
  image.copy(flash, address)
}
for (const offset of [0, 0x10000]) {
  if (flash[offset] !== 0xe9 || flash.readUInt16LE(offset + 12) !== 5) throw new Error('Wrong ESP32-C3 image header')
}
if (flash.readUInt16LE(0x8000) !== 0x50aa || args.flash_settings.flash_size !== '4MB' || args.flash_settings.flash_mode !== 'dio' || args.flash_settings.flash_freq !== '40m') {
  throw new Error('Partition table or flash settings do not match A2')
}

const output = resolve('.tmp/a2-local-assets')
await mkdir(output, { recursive: true })
for (const [source, target] of [['pkg/esp_emu.js', 'esp_emu.js'], ['pkg/esp_emu_bg.wasm', 'esp_emu_bg.wasm'], ['pkg/LICENSE', 'LICENSE-ESP-EMU'], ['cosim.js', 'cosim.js']]) {
  await copyFile(join(www, source), join(output, target))
}
await writeFile(join(output, 'flash.bin'), flash)
const manifest = { revision: approval.revision, approvalSha256: approvalHash, target: 'esp32c3', engine: 'ESP-EMU 1.2.0',
  sdk, compiler: 'riscv32-esp-elf esp-14.2.0_20260121', flash: { bytes: flash.length, sha256: hash(flash) }, flasherArgsSha256: hash(flasher),
  sdkconfigSha256: hash(await readFile(join(build, 'config', 'sdkconfig.h'))),
  sourceSha256: hash(await readFile('firmware/esp32-c3-a2/main/button_led.c')) }
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify(manifest))
