import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assertCortexMImage } from './cortexm-elf.mjs'

export const a8ApprovalSha256 = 'c49ab23aa1e01d91fa6f7e3b9e9abc63cd98ad42d9b743bd60510a3b0ba5cd2d'
export const a8Assets = '.tmp/a8-local-assets'
export const sourceFile = 'firmware/ra4m1-a8/button_led.c'
export const hash = data => createHash('sha256').update(data).digest('hex')

export async function readA8Proposal(root) {
  const bytes = await readFile(resolve(root, 'docs/research/2026-11-27-uno-r4-ra4m1-electrical-firmware-a8-proposal.json'))
  if (hash(bytes) !== a8ApprovalSha256) throw new Error('SHA-256 cấu hình A8 không khớp.')
  return JSON.parse(bytes)
}

export function platformForA8({ firmware, runtime }) {
  const { flash, sram } = firmware.memoryMap
  const { cpu, nvic, icu, portMisc, ports, sci2 } = runtime.profile
  return [
    'code_flash: Memory.MappedMemory @ sysbus ' + flash.start,
    '    size: ' + flash.bytes,
    'sram: Memory.MappedMemory @ sysbus ' + sram.start,
    '    size: ' + sram.bytes,
    'nvic: ' + nvic.class + ' @ sysbus ' + nvic.base,
    '    systickFrequency: ' + nvic.systickFrequency,
    '    IRQ -> cpu@0',
    'cpu: ' + cpu.type + ' @ sysbus',
    '    cpuType: "' + cpu.cpuType + '"',
    '    nvic: nvic',
    '    InitVectorTableOffset: ' + cpu.initVectorTableOffset,
    '    PerformanceInMips: ' + cpu.nominalPerformanceMips,
    'icu: ' + icu.class + ' @ sysbus ' + icu.base,
    '    nvic: nvic',
    'portMisc: ' + portMisc.class + ' @ sysbus ' + portMisc.base,
    ...ports.flatMap(port => [
      port.name + ': ' + port.class + ' @ {',
      '    sysbus ' + port.base + ';',
      '    sysbus new Bus.BusMultiRegistration { address: ' + port.pfsBase + '; size: ' + port.pfsBytes + '; region: "pinConfiguration" }',
      '}',
      '    portNumber: ' + port.portNumber,
      '    numberOfConnections: ' + port.pins,
      '    pfsMisc: portMisc',
    ]),
    'sci2: ' + sci2.class + ' @ sysbus ' + sci2.base,
    '    frequency: ' + sci2.frequencyHz,
    '    enableManchesterMode: ' + sci2.enableManchesterMode,
    '    enableFIFO: ' + sci2.enableFIFO,
    '    fullModel: ' + sci2.fullModel,
    ...['ReceiveIRQ', 'TransmitIRQ', 'TransmitEndIRQ'].map((name, ix) => '    ' + name + ' -> icu@' + sci2.irqRoutes[ix]),
    '',
  ].join('\n')
}

export function assertA8Image(elf, board, { flash, sram }) {
  assertCortexMImage(elf, {
    flash: { ...flash, base: flash.start },
    sram: { ...sram, base: sram.start },
  }, 'A8')
  if (!elf.includes(Buffer.from(board.readyLine + '\n'))) throw new Error('ELF A8 không đúng SKU board.')
}

export async function loadA8Target(root, boardId, hosted) {
  const proposal = await readA8Proposal(root)
  const board = proposal.boards.find(candidate => candidate.id === boardId)
  if (!board) throw new Error('Chọn một board đã duyệt cho A8.')
  const { firmware, runtime } = proposal
  const assets = hosted ? resolve(hosted.assets, 'a8-local-assets') : resolve(root, a8Assets)
  const runner = hosted?.runner ?? resolve(root, runtime.launcher.path)
  const path = name => resolve(assets, board.sku, name)
  let manifest, elf, platform, engine, source
  try {
    [manifest, elf, platform, engine, source] = await Promise.all([
      readFile(path('manifest.json'), 'utf8').then(JSON.parse), readFile(path('firmware.elf')),
      readFile(path('target.repl')), hosted ? undefined : readFile(runner), readFile(resolve(root, sourceFile)),
    ])
  } catch {
    throw new Error('Renode và ELF A8 chưa được chuẩn bị trên máy này.')
  }
  const { sram } = firmware.memoryMap
  if (manifest?.approvalSha256 !== a8ApprovalSha256 || manifest.boardId !== board.id
    || manifest.sku !== board.sku || manifest.revision !== board.catalogRevision || manifest.fixtureId !== board.fixtureId
    || manifest.modelSha256 !== board.model.sha256 || manifest.runnerArchiveSha256 !== runtime.archive.sha256
    || !Number.isInteger(manifest.tickAddress) || manifest.tickAddress % 4
    || manifest.tickAddress < Number(sram.start) || manifest.tickAddress + 4 > Number(sram.endExclusive)) {
    throw new Error('Manifest A8 không khớp board hoặc revision đã duyệt.')
  }
  assertA8Image(elf, board, firmware.memoryMap)
  if (hash(elf) !== manifest.elfSha256 || hash(source) !== manifest.sourceSha256
    || hash(platform) !== manifest.platformSha256 || platform.toString() !== platformForA8(proposal)
    || !hosted && hash(engine) !== runtime.launcher.sha256) throw new Error('Checksum Renode, cấu hình hoặc ELF A8 không khớp.')
  return { proposal, board, assets, runner, elf, platform, tickAddress: manifest.tickAddress }
}
