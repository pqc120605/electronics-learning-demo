
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

const hash = (bytes, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(bytes).digest(encoding)
const approvalSha256 = '0c66dcb5aaf2543791587d27f9b1e9f008848f6d752c1f89590d31d1ad2acf8e'
const config = await readFile(new URL('../docs/research/2026-11-27-rp2350-electrical-firmware-a6-proposal.json', import.meta.url))
if (hash(config) !== approvalSha256) throw new Error('A6 configuration SHA-256 mismatch')
const proposal = JSON.parse(config)
const { firmware, runtime } = proposal
const [buildRoot, vendorRoot, packageArchive] = process.argv.slice(2)
if (!buildRoot || !vendorRoot || !packageArchive) throw new Error('Pass the A6 CMake build directory, A5 vendor directory and verified npm tarball')

const sdkPath = resolve(vendorRoot, 'pico-sdk')
const sdkCommit = execFileSync('git', ['-C', sdkPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
if (sdkCommit !== firmware.sdk.commit || execFileSync('git', ['-C', sdkPath, 'status', '--porcelain'], { encoding: 'utf8' }).trim()) {
  throw new Error('Pico SDK checkout does not match A6')
}
const compilerArchive = await readFile(resolve(vendorRoot, basename(firmware.toolchain.url)))
if (hash(compilerArchive) !== firmware.toolchain.sha256) throw new Error('Arm GNU compiler archive does not match A6')
const cache = await readFile(resolve(buildRoot, 'CMakeCache.txt'), 'utf8')
for (const [key, expected] of Object.entries(firmware.build)) {
  if (key === 'language') continue
  const line = cache.split(/\r?\n/).find(item => item.startsWith(key + ':'))
  if (line?.slice(line.indexOf('=') + 1) !== String(expected)) throw new Error('Unexpected CMake setting: ' + key)
}
const exe = process.platform === 'win32' ? '.exe' : ''
const elfPath = resolve(buildRoot, 'machmo_rp2350_a6.elf')
const elf = await readFile(elfPath)
const details = execFileSync(resolve(vendorRoot, 'bin', 'arm-none-eabi-readelf' + exe), ['-h', '-A', elfPath], { encoding: 'utf8' })
if (!/Class:\s+ELF32/.test(details) || !/Data:.*little endian/.test(details) || !/Machine:\s+ARM/.test(details)
  || !/Tag_CPU_arch:\s+v8-M\.mainline/.test(details) || !/Tag_THUMB_ISA_use:\s+Yes/.test(details)) {
  throw new Error('Expected an Armv8-M.main Thumb ELF for Pico 2')
}
const artifact = runtime.artifact
const archive = await readFile(packageArchive)
if (archive.byteLength !== artifact.bytes || hash(archive) !== artifact.sha256 || 'sha512-' + hash(archive, 'sha512', 'base64') !== artifact.integrity) {
  throw new Error('pico-emu archive checksum does not match A6')
}
const extracted = artifact.files.map(file => {
  const bytes = execFileSync('tar', ['-xOf', packageArchive, file.path])
  if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error('pico-emu member does not match A6: ' + file.path)
  return [basename(file.path), bytes]
})

const sourceSha256 = hash(await readFile(new URL('../firmware/rp2350-a6/button_led.c', import.meta.url)))
const root = resolve('.tmp/a6-local-assets')
const engineDirectory = join(root, 'engine')
await mkdir(engineDirectory, { recursive: true })
for (const [name, bytes] of extracted) await writeFile(join(engineDirectory, name), bytes)
const image = { bytes: elf.length, sha256: hash(elf) }
for (const board of proposal.boards) {
  const directory = join(root, board.id)
  const manifest = {
    approvalSha256, boardId: board.id, revision: board.revision, fixtureId: board.fixtureId,
    sdkBoard: board.sdkBoard, target: firmware.build.PICO_PLATFORM, sdkCommit, sourceSha256,
    modelSha256: board.model.sha256, topViewSha256: board.topView.sha256, elf: image,
  }
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'firmware.elf'), elf)
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest))
}
