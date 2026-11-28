import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { cortexMLinkerScript } from './cortexm-elf.mjs'
import { a8ApprovalSha256, a8Assets, assertA8Image, hash, platformForA8, readA8Proposal, sourceFile } from './a8-ra4m1-profile.mjs'

const root = process.cwd()
const proposal = await readA8Proposal(root)
const { firmware, runtime } = proposal
const { flash, sram } = firmware.memoryMap
const run = (path, args) => execFileSync(path, args, { encoding: 'utf8', windowsHide: true })
const runnerDirectory = dirname(resolve(root, runtime.launcher.path))
const check = async ({ path, sha256, bytes }) => {
  const content = await readFile(path)
  if (hash(content) !== sha256 || (bytes && content.length !== bytes)) throw new Error('Checksum không khớp: ' + path)
}
for (const artifact of [runtime.archive, runtime.launcher, firmware.toolchain.archive,
  ...runtime.archiveEvidence.map(entry => ({ ...entry, path: resolve(runnerDirectory, entry.path) }))]) await check(artifact)
const version = run(resolve(root, runtime.launcher.path), ['--version'])
if (!version.includes(runtime.windowsBuild)) throw new Error('Phiên bản Renode không khớp A8.')
const tool = name => resolve(dirname(firmware.toolchain.archive.path), 'bin', 'arm-none-eabi-' + name + '.exe')
if (!run(tool('gcc'), ['--version']).includes('14.2.Rel1')) throw new Error('Phiên bản Arm GNU không khớp A8.')
const source = resolve(sourceFile)
const sourceSha256 = hash(await readFile(source))
const platform = platformForA8(proposal)
const linkerScript = cortexMLinkerScript({ ...flash, base: flash.start }, { ...sram, base: sram.start })
for (const board of proposal.boards) {
  const directory = resolve(root, a8Assets, board.sku)
  await mkdir(directory, { recursive: true })
  const linker = resolve(directory, 'firmware.ld')
  const elf = resolve(directory, 'firmware.elf')
  await writeFile(linker, linkerScript)
  run(tool('gcc'), [...firmware.toolchain.flags, '-DA8_SKU="' + board.sku + '"', '-DA8_INPUT=' + board.button.bit,
    '-DA8_OUTPUT=' + board.led.bit, '-T', linker, source, '-o', elf])
  const bytes = await readFile(elf)
  assertA8Image(bytes, board, firmware.memoryMap)
  if (!/Tag_CPU_arch:\s*v7E-M\b/.test(run(tool('readelf'), ['-A', elf]))) throw new Error('CPU ELF A8 khác Armv7E-M.')
  const symbols = run(tool('nm'), ['--defined-only', elf])
  const tickAddress = Number.parseInt(symbols.match(/^([a-f0-9]+)\s+[Bb]\s+a8_ticks_ms$/mi)?.[1], 16)
  if (!Number.isSafeInteger(tickAddress)) throw new Error('Thiếu biến thời gian SysTick trong ELF A8.')
  await writeFile(resolve(directory, 'target.repl'), platform)
  await writeFile(resolve(directory, 'manifest.json'), JSON.stringify({
    approvalSha256: a8ApprovalSha256, boardId: board.id, sku: board.sku, revision: board.catalogRevision,
    fixtureId: board.fixtureId, modelSha256: board.model.sha256, sourceSha256, tickAddress,
    elfSha256: hash(bytes), platformSha256: hash(platform), runnerArchiveSha256: runtime.archive.sha256,
  }, null, 2) + '\n')
  console.log(board.sku, hash(bytes))
}
