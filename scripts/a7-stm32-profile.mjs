import { assertCortexMImage } from './cortexm-elf.mjs'

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const approvalSha256 = '3e5d974d2bd3f6d70b19d1d7ea3617cd698d90b4ded524291b86961e47315c3e'
export const proposalFile = 'docs/research/2026-11-27-stm32f4-electrical-firmware-a7-proposal.json'
export const assetDirectory = '.tmp/a7-local-assets'
export const renodeDirectory = 'renode_1.17.0-portable'
export const digest = data => createHash('sha256').update(data).digest('hex')

export async function readA7Proposal(root) {
  const bytes = await readFile(resolve(root, proposalFile))
  if (digest(bytes) !== approvalSha256) throw new Error('SHA-256 cấu hình A7 không khớp.')
  return JSON.parse(bytes)
}

export function platformFor(board, { cpu, devices }) {
  const { nvic, gpioA, gpioB, usart2, rcc, rtc } = devices
  const peripheral = (name, device) => name + ': ' + device.class + ' @ sysbus ' + device.base
  return [
    'flash: Memory.MappedMemory @ sysbus ' + board.flash.base,
    '    size: ' + board.flash.bytes,
    'sram: Memory.MappedMemory @ sysbus ' + board.sram.base,
    '    size: ' + board.sram.bytes,
    peripheral('nvic', nvic),
    '    priorityMask: ' + nvic.priorityMask,
    '    systickFrequency: ' + nvic.systickFrequency,
    '    IRQ -> cpu@0',
    'cpu: ' + cpu.type + ' @ sysbus',
    '    cpuType: "' + cpu.cpuType + '"',
    '    nvic: nvic',
    '    InitVectorTableOffset: ' + cpu.initVectorTableOffset,
    '    PerformanceInMips: ' + cpu.nominalPerformanceMips,
    `gpioPortA: ${gpioA.class} @ sysbus <${gpioA.base}, +0x400>`,
    '    modeResetValue: ' + gpioA.modeResetValue,
    '    numberOfAFs: ' + gpioA.numberOfAFs,
    `gpioPortB: ${gpioB.class} @ sysbus <${gpioB.base}, +0x400>`,
    '    modeResetValue: ' + gpioB.modeResetValue,
    '    numberOfAFs: ' + gpioB.numberOfAFs,
    `usart2: ${usart2.class} @ sysbus <${usart2.base}, +0x100>`,
    '    frequency: ' + usart2.inputFrequencyHz,
    '    -> nvic@' + usart2.nvicLine,
    peripheral('rtc', rtc),
    peripheral('rcc', rcc),
    '    rtcPeripheral: ' + rcc.rtcPeripheral,
    '',
  ].join('\n')
}

export function assertA7Image(elf, board) {
  assertCortexMImage(elf, board, 'A7')
}

export function assertA7Manifest(manifest, board) {
  if (manifest?.approvalSha256 !== approvalSha256
    || manifest.boardId !== board.id
    || manifest.revision !== board.revision
    || manifest.target !== board.target
    || manifest.fixtureId !== board.fixtureId
    || manifest.modelSha256 !== board.model.sha256
    || ![manifest.elfSha256, manifest.platformSha256, manifest.sourceSha256].every(value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value))
    || !Number.isInteger(manifest.tickAddress)
    || manifest.tickAddress < Number(board.sram.base)
    || manifest.tickAddress + 4 > Number(board.sram.endExclusive) || manifest.tickAddress % 4) {
    throw new Error('Manifest mô phỏng A7 không khớp board và revision đã duyệt.')
  }
}
