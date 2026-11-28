
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { approvalSha256, assertA7Image, assetDirectory, digest, platformFor, readA7Proposal, renodeDirectory } from './a7-stm32-profile.mjs'

const root = process.cwd()
const proposal = await readA7Proposal(root)
const { firmware, runtime } = proposal
const assets = resolve(root, assetDirectory)
const archive = resolve(assets, 'renode-1.17.0.windows-portable.zip')
const toolchain = firmware.toolchain.windowsArchive
const check = async (path, bytes, sha) => {
  if ((await stat(path)).size !== bytes || digest(await readFile(path)) !== sha) {
    throw new Error('Checksum không khớp: ' + path)
  }
}
await check(archive, runtime.archive.bytes, runtime.archive.sha256)
await check(toolchain.priorLocalPath, toolchain.bytes, toolchain.sha256)

const renode = resolve(assets, renodeDirectory, 'Renode.exe')
const version = execFileSync(renode, ['--version'], { encoding: 'utf8', windowsHide: true })
if (!version.includes('Renode v' + runtime.version)) throw new Error('Phiên bản Renode không khớp cấu hình A7.')
console.log(version.trim())

const bin = resolve('.tmp/a5-vendor/bin')
const tool = name => resolve(bin, 'arm-none-eabi-' + name + '.exe')
const versionText = execFileSync(tool('gcc'), ['--version'], { encoding: 'utf8', windowsHide: true })
if (!versionText.includes('14.2.Rel1')) throw new Error('Phiên bản Arm GNU Toolchain không khớp A7.')
const source = resolve('firmware/stm32f4-a7/button_led.c')
const sourceSha256 = digest(await readFile(source))

for (const board of proposal.boards) {
  const directory = resolve(assets, board.target)
  await mkdir(directory, { recursive: true })
  const linker = resolve(directory, 'firmware.ld')
  const elf = resolve(directory, 'firmware.elf')
  await writeFile(linker, [
    'ENTRY(Reset_Handler)',
    'MEMORY {',
    '  FLASH (rx) : ORIGIN = ' + board.flash.base + ', LENGTH = ' + board.flash.bytes,
    '  SRAM (rwx) : ORIGIN = ' + board.sram.base + ', LENGTH = ' + board.sram.bytes,
    '}',
    '__stack_top = ORIGIN(SRAM) + LENGTH(SRAM);',
    'SECTIONS {',
    '  .vectors : { KEEP(*(.vectors)) } > FLASH',
    '  .text : { *(.text*) *(.rodata*) } > FLASH',
    '  .ARM.exidx : { *(.ARM.exidx*) } > FLASH',
    '  .data : { . = ALIGN(4); __data_start = .; *(.data*) . = ALIGN(4); __data_end = .; } > SRAM AT > FLASH',
    '  __data_load = LOADADDR(.data);',
    '  .bss (NOLOAD) : { . = ALIGN(4); __bss_start = .; *(.bss*) *(COMMON) . = ALIGN(4); __bss_end = .; } > SRAM',
    '}',
    '',
  ].join('\n'))

  execFileSync(tool('gcc'), [...firmware.flags, '-DA7_TARGET="' + board.target + '"',
    '-T', linker, source, '-o', elf], { encoding: 'utf8', windowsHide: true })
  const bytes = await readFile(elf)
  assertA7Image(bytes, board)
  const header = execFileSync(tool('readelf'), ['-A', elf], { encoding: 'utf8', windowsHide: true })
  if (!/Tag_CPU_arch:\s*v7E-M\b/.test(header)) throw new Error('CPU firmware A7 khác Armv7E-M.')
  const symbols = execFileSync(tool('nm'), ['--defined-only', elf], { encoding: 'utf8', windowsHide: true })
  const tickAddress = Number.parseInt(symbols.match(/^([a-f0-9]+)\s+[Bb]\s+a7_ticks_ms$/mi)?.[1], 16)
  if (!Number.isSafeInteger(tickAddress)) throw new Error('Thiếu biến thời gian SysTick trong ELF A7.')
  const profile = platformFor(board, runtime.profiling)
  await writeFile(resolve(directory, 'target.repl'), profile)
  await writeFile(resolve(directory, 'manifest.json'), JSON.stringify({
    approvalSha256, boardId: board.id, revision: board.revision, target: board.target,
    fixtureId: board.fixtureId, modelSha256: board.model.sha256, sourceSha256, tickAddress,
    elfSha256: digest(bytes), platformSha256: digest(profile), runnerArchiveSha256: runtime.archive.sha256,
    compiler: firmware.toolchain.name,
  }, null, 2) + '\n')
  console.log(board.target, digest(bytes))
}
