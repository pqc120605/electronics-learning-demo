import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { a9ApprovalSha256, a9Assets, a9Source, assertA9Image, hash, platformForA9, readA9Proposal } from './a9-stm32-profile.mjs'
import { cortexMLinkerScript } from './cortexm-elf.mjs'

const root = process.cwd()
const proposal = await readA9Proposal(root)
const { firmwareShared, runtime, boards, electrical } = proposal
const run = (path, args) => execFileSync(path, args, { encoding: 'utf8', windowsHide: true })
const check = async ({ path, sha256, bytes }) => {
  const content = await readFile(resolve(root, path))
  if (hash(content) !== sha256 || (bytes && content.length !== bytes)) throw new Error('Checksum không khớp: ' + path)
}
for (const artifact of [runtime.archive, runtime.launcher, ...runtime.evidence, firmwareShared.toolchain.archive, electrical.engine]) {
  await check(artifact)
}
for (const { boardEvidence } of boards) {
  for (const artifact of [boardEvidence.model, boardEvidence.optimizedModel, boardEvidence.topView, boardEvidence.padSource].filter(Boolean)) {
    await check(artifact)
  }
}
const version = run(resolve(root, runtime.launcher.path), ['--version'])
if (!version.includes(runtime.version)) throw new Error('Phiên bản Renode không khớp A9.')
const tool = name => resolve(root, dirname(firmwareShared.toolchain.archive.path), 'bin', 'arm-none-eabi-' + name + '.exe')
if (!run(tool('gcc'), ['--version']).includes('14.2.Rel1')) throw new Error('Phiên bản Arm GNU không khớp A9.')
const source = resolve(root, a9Source)
const sourceSha256 = hash(await readFile(source))

for (const board of boards) {
  const { firmware, boardEvidence } = board
  const directory = resolve(root, a9Assets, firmware.target)
  await mkdir(directory, { recursive: true })
  const linker = resolve(directory, 'firmware.ld')
  const elf = resolve(directory, 'firmware.elf')
  const platform = platformForA9(board)
  await writeFile(linker, cortexMLinkerScript(firmware.flash, firmware.sram))
  const flags = firmwareShared.flags.map(flag => flag === '-mcpu=<cpu hợp đồng board>' ? '-mcpu=' + firmware.cpu : flag)
  const family = firmware.cpu === 'cortex-m3' ? 'F103' : 'L476'
  run(tool('gcc'), [...flags, '-DA9_' + family, '-DA9_TARGET="' + firmware.target + '"',
    '-DA9_SYSTICK_RELOAD=' + firmware.clock.systickReload, '-DA9_BRR=' + firmware.uart.brr,
    '-T', linker, source, '-o', elf])
  const bytes = await readFile(elf)
  assertA9Image(bytes, board)
  const attributes = run(tool('readelf'), ['-A', elf])
  const architecture = attributes.match(/Tag_CPU_arch:\s*([^\s]+)/)?.[1]
  if (architecture !== (firmware.elfArmArchitecture === 'v7-M' ? 'v7' : firmware.elfArmArchitecture)
    || !/Tag_CPU_arch_profile:\s*Microcontroller/.test(attributes)) throw new Error('Kiến trúc ELF A9 không khớp.')
  const symbols = run(tool('nm'), ['--defined-only', elf])
  const tickAddress = Number.parseInt(symbols.match(/^([a-f0-9]+)\s+[Bb]\s+a9_ticks_ms$/mi)?.[1], 16)
  if (!Number.isSafeInteger(tickAddress)) throw new Error('Thiếu biến SysTick trong ELF A9.')
  await writeFile(resolve(directory, 'target.repl'), platform)
  await writeFile(resolve(directory, 'manifest.json'), JSON.stringify({
    approvalSha256: a9ApprovalSha256, boardId: board.id, revision: board.boardRevision, fixtureId: board.fixtureId,
    target: firmware.target, modelSha256: boardEvidence.model.sha256, sourceSha256, tickAddress,
    elfSha256: hash(bytes), platformSha256: hash(platform), runnerArchiveSha256: runtime.archive.sha256,
  }, null, 2) + '\n')
  console.log(firmware.target, hash(bytes))
}
