import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const lock = '87ecccdc51aea68b8c75b0a8aa07623d146e5bea4b520827e86e77cff8066475'
const config = await readFile(new URL('../docs/research/2026-11-27-esp32-s3-electrical-firmware-a4-proposal.json', import.meta.url))
if (sha256(config) !== lock) throw new Error('A4 configuration SHA-256 mismatch')
const { revision, runtime } = JSON.parse(config)
const [buildRoot, sdkVendor, compilerVendor] = process.argv.slice(2)
if (!buildRoot || !sdkVendor || !compilerVendor) {
  throw new Error('Pass the A4 build root, A2 SDK/ESP-EMU vendor directory and A4 compiler vendor directory')
}
for (const [path, expected] of [
  [join(sdkVendor, basename(runtime.engineAsset)), runtime.engineAssetSha256],
  [join(sdkVendor, 'esp-idf-v5.5.6.zip'), runtime.sdkArchiveSha256],
  [join(compilerVendor, basename(runtime.compilerWin64Archive)), runtime.compilerWin64Sha256],
]) {
  if (sha256(await readFile(path)) !== expected) throw new Error(`SHA-256 mismatch for ${basename(path)}`)
}

const source = await readFile(new URL('../firmware/esp32-s3-a4/main/button_led.c', import.meta.url))
const target = runtime.target.name
const artifacts = []
for (const flashMiB of runtime.flash.sizeMiB) {
  const size = flashMiB + 'm'
  const build = resolve(buildRoot, size)
  const info = JSON.parse(await readFile(join(build, 'project_description.json'), 'utf8'))
  const sdkconfig = await readFile(join(build, 'config', 'sdkconfig.h'))
  if (info.target !== target || !/^v5\.5\.6(?:-dirty)?$/.test(info.git_revision)
    || !info.c_compiler?.includes('xtensa-esp') || !info.c_compiler.includes('a4-vendor')
    || !sdkconfig.includes(`#define CONFIG_ESPTOOLPY_FLASHSIZE_${flashMiB}MB 1`)
    || !sdkconfig.includes('#define CONFIG_ESP_CONSOLE_UART_BAUDRATE 115200')
    || !sdkconfig.includes('#define CONFIG_FREERTOS_HZ 100')
    || sdkconfig.includes('#define CONFIG_SPIRAM 1') || sdkconfig.includes('#define CONFIG_FREERTOS_UNICORE 1')) {
    throw new Error(`ESP-IDF build settings do not match A4 for ${size}`)
  }
  const flasher = await readFile(join(build, 'flasher_args.json'))
  const args = JSON.parse(flasher)
  if (args.extra_esptool_args.chip !== target || args.flash_settings.flash_size !== flashMiB + 'MB'
    || args.flash_settings.flash_mode !== 'dio' || args.flash_settings.flash_freq !== '40m') {
    throw new Error(`Flash settings do not match A4 for ${size}`)
  }
  const flash = Buffer.alloc(flashMiB * 1048576, 0xff)
  const layout = [[0, 0x8000], [0x8000, 0x10000], [0x10000, 0x110000]]
  if (Object.keys(args.flash_files).length !== layout.length) throw new Error('Unexpected A4 flash layout')
  for (const [address, limit] of layout) {
    const file = args.flash_files['0x' + address.toString(16)]
    if (!file) throw new Error(`Missing image at ${address}`)
    const image = await readFile(join(build, file))
    if (address + image.length > limit) throw new Error(`Image exceeds partition at ${address}`)
    image.copy(flash, address)
  }
  for (const offset of [0, 0x10000]) {
    if (flash[offset] !== 0xe9 || !flash[offset + 1] || flash.readUInt16LE(offset + 12) !== Number(runtime.target.chipId)
      || flash[offset + 2] !== 2 || flash[offset + 3] !== (Math.log2(flashMiB) << 4)) {
      throw new Error(`Wrong chip, mode, frequency or size in A4 header at ${offset} for ${size}`)
    }
  }
  if (flash.readUInt16LE(0x8000) !== 0x50aa) throw new Error('Missing A4 partition table')
  const manifest = {
    revision, approvalSha256: lock, target, engine: 'ESP-EMU 1.2.0', sdk: info.git_revision,
    compiler: runtime.compiler, flashMiB, flash: { bytes: flash.length, sha256: sha256(flash) },
    flasherArgsSha256: sha256(flasher), sdkconfigSha256: sha256(sdkconfig), sourceSha256: sha256(source),
  }
  artifacts.push({ size, flash, manifest })
}

for (const { size, flash, manifest } of artifacts) {
  const output = resolve('.tmp/a4-local-assets', size)
  await mkdir(output, { recursive: true })
  await writeFile(join(output, 'flash.bin'), flash)
  await writeFile(join(output, 'flash.bin.gz'), gzipSync(flash))
  await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest))
}
