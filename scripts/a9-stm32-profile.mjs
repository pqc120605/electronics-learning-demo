import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assertCortexMImage } from './cortexm-elf.mjs'

export const a9ApprovalSha256 = '954006616229f5045215e90c5b59ce1d313cfa65250670e8aa1fc26198856b99'
export const a9Assets = '.tmp/a9-local-assets'
export const a9Source = 'firmware/stm32-a9/button_led.c'
export const hash = value => createHash('sha256').update(value).digest('hex')

export async function readA9Proposal(root) {
  const bytes = await readFile(resolve(root, 'docs/research/2026-11-27-stm32-f1-l4-electrical-firmware-a9-proposal.json'))
  if (hash(bytes) !== a9ApprovalSha256) throw new Error('SHA-256 cấu hình A9 không khớp.')
  return JSON.parse(bytes)
}

export function platformForA9({ firmware }) {
  const { flash, sram, clock, cpu, uart, observation } = firmware
  const legacy = cpu === 'cortex-m3'
  const gpio = port => [
    port.name + ': ' + observation.gpioClass + ' @ sysbus <' + port.base + ', +0x400>',
    ...(legacy ? [] : ['    numberOfAFs: 16']),
  ]
  return [
    'flash: Memory.MappedMemory @ sysbus ' + flash.base,
    '    size: ' + flash.bytes,
    'sram: Memory.MappedMemory @ sysbus ' + sram.base,
    '    size: ' + sram.bytes,
    'nvic: IRQControllers.NVIC @ sysbus 0xE000E000',
    '    priorityMask: 0xF0',
    '    systickFrequency: ' + clock.hz,
    '    IRQ -> cpu@0',
    'cpu: CPU.CortexM @ sysbus',
    '    cpuType: "' + cpu + '"',
    '    nvic: nvic',
    '    InitVectorTableOffset: ' + flash.base,
    '    PerformanceInMips: ' + clock.renodePerformanceMips,
    ...gpio(observation.inputPort),
    ...gpio(observation.outputPort),
    uart.device + ': ' + uart.class + ' @ sysbus <' + uart.base + ', +0x100>',
    '    frequency: ' + clock.hz,
    (legacy ? '    -> nvic@' : '    IRQ -> nvic@') + uart.nvicIrq,
    'rccFixture: Memory.MappedMemory @ sysbus 0x40021000',
    '    size: 0x400',
    '',
  ].join('\n')
}

export function assertA9Image(elf, board) {
  const region = info => ({ ...info, endExclusive: Number(info.base) + info.bytes })
  assertCortexMImage(elf, { flash: region(board.firmware.flash), sram: region(board.firmware.sram) }, 'A9',
    board.firmware.cpu === 'cortex-m3' ? 'Cortex-M3' : 'Cortex-M4')
  if (!elf.includes(Buffer.from(board.firmware.readyLine + '\n'))) throw new Error('ELF A9 không đúng STM32 đã chọn.')
}

export async function loadA9Target(root, boardId, hosted) {
  const proposal = await readA9Proposal(root)
  const board = proposal.boards.find(candidate => candidate.id === boardId)
  if (!board) throw new Error('Chọn một board đã duyệt cho A9.')
  const { runtime } = proposal
  const assets = hosted ? resolve(hosted.assets, 'a9-local-assets') : resolve(root, a9Assets)
  const runner = hosted?.runner ?? resolve(root, runtime.launcher.path)
  const file = name => resolve(assets, board.firmware.target, name)
  let manifest, elf, platform, engine, infrastructure, source
  try {
    [manifest, elf, platform, engine, infrastructure, source] = await Promise.all([
      readFile(file('manifest.json'), 'utf8').then(JSON.parse), readFile(file('firmware.elf')),
      readFile(file('target.repl')), hosted ? undefined : readFile(runner),
      hosted ? undefined : readFile(resolve(root, runtime.evidence[0].path)), readFile(resolve(root, a9Source)),
    ])
  } catch {
    throw new Error('Renode và ELF A9 chưa được chuẩn bị trên máy này.')
  }
  const { tickAddress } = manifest ?? {}
  const base = Number(board.firmware.sram.base)
  if (manifest?.approvalSha256 !== a9ApprovalSha256 || manifest.boardId !== board.id
    || manifest.target !== board.firmware.target || manifest.revision !== board.boardRevision || manifest.fixtureId !== board.fixtureId
    || manifest.modelSha256 !== board.boardEvidence.model.sha256 || manifest.runnerArchiveSha256 !== runtime.archive.sha256
    || !Number.isInteger(tickAddress) || tickAddress % 4 || tickAddress < base || tickAddress + 4 > base + board.firmware.sram.bytes) {
    throw new Error('Manifest A9 không khớp board hoặc revision đã duyệt.')
  }
  assertA9Image(elf, board)
  if (hash(elf) !== manifest.elfSha256 || hash(source) !== manifest.sourceSha256
    || hash(platform) !== manifest.platformSha256 || platform.toString() !== platformForA9(board)
    || !hosted && (hash(engine) !== runtime.launcher.sha256 || hash(infrastructure) !== runtime.evidence[0].sha256)) {
    throw new Error('Checksum Renode, cấu hình hoặc ELF A9 không khớp.')
  }
  return { proposal, board, assets, runner, elf, platform, tickAddress }
}
