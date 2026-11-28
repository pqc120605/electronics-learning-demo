import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const approved = 'ad345e14d3cfa2e2d23b50bc23d0f6539ba944372a76ec5d280939df95687e65'
const config = await readFile(new URL('../docs/research/2026-11-27-rp2040-electrical-firmware-a5-proposal.json', import.meta.url))
if (sha256(config) !== approved) throw new Error('A5 configuration SHA-256 mismatch')
const proposal = JSON.parse(config)
const { compiler, sdk, target } = proposal.runtime
const [buildRoot, vendorRoot] = process.argv.slice(2)
if (!buildRoot || !vendorRoot) throw new Error('Pass the A5 build root and verified vendor directory')
const sdkPath = resolve(vendorRoot, 'pico-sdk')
const sdkCommit = execFileSync('git', ['-C', sdkPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
if (sdkCommit !== sdk.commit || execFileSync('git', ['-C', sdkPath, 'status', '--porcelain'], { encoding: 'utf8' }).trim()) {
  throw new Error('Pico SDK checkout does not match the approved commit')
}
const compilerFile = basename(compiler.winArchive)
if (sha256(await readFile(resolve(vendorRoot, compilerFile))) !== compiler.sha256) {
  throw new Error('SHA-256 of the Arm GNU compiler archive does not match A5')
}
const tools = resolve(vendorRoot, 'bin')
const bootrom = await readFile(target.bootrom.local)
if (bootrom.byteLength !== target.bootrom.bytes || sha256(bootrom) !== target.bootrom.sha256) {
  throw new Error('RP2040 B2 boot ROM does not match A5')
}

const source = await readFile(new URL('../firmware/rp2040-a5/button_led.c', import.meta.url))
const artifacts = []
for (const board of proposal.boards) {
  const path = resolve(buildRoot, board.sdkBoard)
  const cache = await readFile(join(path, 'CMakeCache.txt'), 'utf8')
  const boardSet = new RegExp(`^PICO_BOARD:[^=]+=${board.sdkBoard}\\r?$`, 'm')
  if (!boardSet.test(cache) || !/^PICO_PLATFORM:[^=]+=rp2040\r?$/m.test(cache)
    || !/^CMAKE_BUILD_TYPE:[^=]+=Release\r?$/m.test(cache)) {
    throw new Error(`Unexpected CMake target for ${board.sdkBoard}`)
  }
  const elf = join(path, 'machmo_rp2040_a5.elf')
  const details = execFileSync(join(tools, 'arm-none-eabi-readelf.exe'), ['-h', '-A', elf], { encoding: 'utf8' })
  if (!/Machine:\s+ARM/.test(details) || !/Class:\s+ELF32/.test(details)
    || !/Tag_CPU_arch:\s+v6S?-M/.test(details) || !/Tag_THUMB_ISA_use:\s+Thumb-1/.test(details)) {
    throw new Error(`Expected Cortex-M0+ Thumb ELF for ${board.sdkBoard}`)
  }
  const boot2Path = join(path, 'boot2-a5.bin')
  execFileSync(join(tools, 'arm-none-eabi-objcopy.exe'), ['-O', 'binary', '--only-section=.boot2', elf, boot2Path])
  const boot2 = await readFile(boot2Path)
  const image = await readFile(join(path, 'machmo_rp2040_a5.bin'))
  if (boot2.length !== 256 || !boot2.equals(image.subarray(0, 256)) || image.length <= 0x108 || image.length > board.flashBytes) {
    throw new Error(`Invalid boot2 or flash size for ${board.sdkBoard}`)
  }
  const stack = image.readUInt32LE(0x100)
  const reset = image.readUInt32LE(0x104)
  if (stack <= 0x20000000 || stack > 0x20042000 || stack % 8
    || !(reset & 1) || reset < 0x10000109 || reset >= 0x10000000 + image.length) {
    throw new Error(`Bad RP2040 stack or Thumb reset vector for ${board.sdkBoard}`)
  }
  const flash = Buffer.alloc(board.flashBytes, 0xff)
  image.copy(flash)
  const manifest = {
    approvalSha256: approved, boardId: board.id, revision: board.revision, pcbRevision: board.pcbRevision,
    sdkBoard: board.sdkBoard, target: target.platform, sdk: sdk.version, sdkCommit, compiler: compiler.name,
    flash: { bytes: flash.length, sha256: sha256(flash) }, bootrom: { bytes: bootrom.length, sha256: sha256(bootrom) },
    elfSha256: sha256(await readFile(elf)), sourceSha256: sha256(source), cacheSha256: sha256(cache),
  }
  artifacts.push({ board, flash, manifest })
}

for (const { board, flash, manifest } of artifacts) {
  const directory = resolve('.tmp/a5-local-assets', board.sdkBoard)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'flash.bin'), flash)
  await writeFile(join(directory, 'flash.bin.gz'), gzipSync(flash))
  await writeFile(join(directory, 'bootrom.bin'), bootrom)
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest))
}
