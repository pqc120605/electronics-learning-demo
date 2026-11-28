import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const lock = '9518d9f6aad764021e448763534a185c098c37643e56d6f587e6cbf81a542dd5'
const approvalBytes = await readFile(new URL('../docs/research/2026-11-27-esp32-riscv-electrical-firmware-a3-proposal.json', import.meta.url))
if (hash(approvalBytes) !== lock) throw new Error('A3 configuration SHA-256 mismatch')
const approval = JSON.parse(approvalBytes)
const [buildPath, vendorPath] = process.argv.slice(2)
if (!buildPath || !vendorPath) throw new Error('Pass the build root and verified vendor directory')
const archive = await readFile(join(vendorPath, 'esp-emu-1.2.0-wasm.tar.gz'))
if (hash(archive) !== approval.runtime.engineAssetSha256) throw new Error('ESP-EMU archive SHA-256 mismatch')

const source = await readFile(new URL('../firmware/esp32-riscv-a3/main/button_led.c', import.meta.url))
const artifacts = []
for (const [target, settings] of Object.entries(approval.runtime.targets)) {
  const build = resolve(buildPath, target)
  const info = JSON.parse(await readFile(join(build, 'project_description.json'), 'utf8'))
  const sdkconfig = await readFile(join(build, 'config', 'sdkconfig.h'))
  const flashConfigSymbol = 'CONFIG_ESPTOOLPY_FLASHFREQ_' + settings.flashFrequencyMHz + 'M'
  if (info.target !== target || !/^v5\.5\.6(?:-dirty)?$/.test(info.git_revision)
    || !info.c_compiler?.includes('esp-14.2.0_20260121') || !sdkconfig.includes(`#define ${flashConfigSymbol} 1`)) {
    throw new Error(`Wrong ESP-IDF target, version, compiler or frequency for ${target}`)
  }
  const flasher = await readFile(join(build, 'flasher_args.json'))
  const args = JSON.parse(flasher)
  const size = settings.flashBytes / 1048576 + 'MB'
  const freq = (settings.bootImageFrequencyMHz ?? settings.flashFrequencyMHz) + 'm'
  if (args.extra_esptool_args.chip !== target || args.flash_settings.flash_size !== size
    || args.flash_settings.flash_mode !== 'dio' || args.flash_settings.flash_freq !== freq) {
    throw new Error(`Flash settings do not match A3 for ${target}`)
  }
  const flash = Buffer.alloc(settings.flashBytes, 0xff)
  const layout = [[0, 0x8000], [0x8000, 0x10000], [0x10000, 0x110000]]
  if (Object.keys(args.flash_files).length !== layout.length) throw new Error('Unexpected flash layout')
  for (const [address, limit] of layout) {
    const file = args.flash_files['0x' + address.toString(16)]
    if (!file) throw new Error(`Missing flash file at ${address}`)
    const image = await readFile(join(build, file))
    if (address + image.length > limit) throw new Error(`Image exceeds partition at ${address}`)
    image.copy(flash, address)
  }
  for (const offset of [0, 0x10000]) {
    if (flash[offset] !== 0xe9 || !flash[offset + 1] || flash.readUInt16LE(offset + 12) !== Number(settings.chipId)) {
      throw new Error(`Wrong image chip header for ${target}`)
    }
  }
  if (flash.readUInt16LE(0x8000) !== 0x50aa) throw new Error('Missing ESP-IDF partition table')
  const manifest = { revision: approval.revision, approvalSha256: lock, target, engine: 'ESP-EMU 1.2.0',
    sdk: info.git_revision, compiler: approval.runtime.compiler,
    flash: { bytes: flash.length, sha256: hash(flash) }, flasherArgsSha256: hash(flasher),
    sdkconfigSha256: hash(sdkconfig), sourceSha256: hash(source) }
  artifacts.push({ target, flash, manifest })
}

for (const { target, flash, manifest } of artifacts) {
  const output = resolve('.tmp/a3-local-assets', target)
  await mkdir(output, { recursive: true })
  await writeFile(join(output, 'flash.bin'), flash)
  await writeFile(join(output, 'flash.bin.gz'), gzipSync(flash))
  await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest))
}
