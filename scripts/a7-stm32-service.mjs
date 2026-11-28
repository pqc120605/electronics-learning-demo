import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { approvalSha256, assertA7Image, assertA7Manifest, assetDirectory, digest, platformFor, readA7Proposal, renodeDirectory } from './a7-stm32-profile.mjs'
import { openRenodeMachine } from './renode-local-process.mjs'
import { createRenodeLocalService } from './renode-local-service.mjs'

const engineHash = '67c2c21eb977181a50a19acbf582c4204d8177d2b4ae0bac4c3d3d51da7a7b4e'

export async function openA7Machine(root, boardId, lifetime) {
  const proposal = await readA7Proposal(root)
  const board = proposal.boards.find(item => item.id === boardId)
  if (!board) throw new Error('Chọn một board đã duyệt cho A7.')
  const assets = resolve(root, assetDirectory)
  const file = name => resolve(assets, board.target, name)
  const runner = resolve(assets, renodeDirectory, 'Renode.exe')
  let manifest, elf, platform, engine, source
  try {
    const [metadata, ...payloads] = await Promise.all([readFile(file('manifest.json'), 'utf8'), readFile(file('firmware.elf')),
      readFile(file('target.repl')), readFile(runner), readFile(resolve(root, 'firmware/stm32f4-a7/button_led.c'))])
    manifest = JSON.parse(metadata)
    const [image, description, executable, firmware] = payloads
    elf = image
    platform = description
    engine = executable
    source = firmware
  } catch {
    throw new Error('Renode và ELF A7 chưa được chuẩn bị trên máy này.')
  }
  assertA7Manifest(manifest, board)
  assertA7Image(elf, board)
  const { runtime } = proposal
  const { limits } = runtime.localTransport
  if (manifest.runnerArchiveSha256 !== runtime.archive.sha256 || digest(engine) !== engineHash
    || digest(elf) !== manifest.elfSha256 || !elf.includes(Buffer.from(board.readyLine + '\n'))
    || digest(source) !== manifest.sourceSha256 || digest(platform) !== manifest.platformSha256
    || platform.toString() !== platformFor(board, runtime.profiling)) {
    throw new Error('Checksum Renode, cấu hình hoặc ELF A7 không khớp.')
  }

  return openRenodeMachine({
    stage: 'A7', assets, runner, runnerArguments: runtime.localTransport.runnerArguments, limits,
    elf, platform, lifetime, approvalSha256, readyLine: board.readyLine,
    uartDevice: 'sysbus.usart2', inputDevice: 'sysbus.gpioPortA', inputBit: 10,
    registers: [manifest.tickAddress, 0x40020010, 0x40020400, 0x40020414, 0x40020410],
    observe([gpioInput, mode, odr, idr], pressed) {
      const inputHigh = Boolean(gpioInput & (1 << 10))
      const outputHigh = Boolean(odr & (1 << 5))
      if ((mode >> 10 & 3) !== 1 || inputHigh === pressed || outputHigh !== Boolean(idr & (1 << 5))) {
        throw new Error('GPIO A7 không khớp trạng thái máy ảo.')
      }
      return { inputHigh, outputHigh }
    },
  })
}

export function createA7LocalService(root) {
  return createRenodeLocalService(root, { stage: 'A7', prefix: '/api/local-tools/a7-stm32/', openMachine: openA7Machine })
}
