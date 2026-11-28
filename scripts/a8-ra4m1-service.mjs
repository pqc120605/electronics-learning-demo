import { a8ApprovalSha256, loadA8Target } from './a8-ra4m1-profile.mjs'
import { openRenodeMachine } from './renode-local-process.mjs'
import { createRenodeLocalService } from './renode-local-service.mjs'

const prefix = '/api/local-tools/a8-ra4m1/'

export async function openA8Machine(root, boardId, lifetime) {
  const { proposal, board, assets, runner, elf, platform, tickAddress } = await loadA8Target(root, boardId)
  const { route, runnerArguments, limits } = proposal.runtime.transport
  if (route !== prefix) throw new Error('Đường dẫn dịch vụ không khớp cấu hình A8.')
  return openRenodeMachine({
    stage: 'A8', assets, runner, runnerArguments, limits, elf, platform, lifetime,
    approvalSha256: a8ApprovalSha256, readyLine: board.readyLine,
    uartDevice: 'sysbus.sci2', inputDevice: 'sysbus.port' + board.button.port, inputBit: board.button.bit,
    registers: [tickAddress, Number(board.button.pfs), Number(board.led.pfs)],
    observe([input, output], pressed) {
      const inputHigh = Boolean(input & 2)
      const outputHigh = Boolean(output & 1)
      if ((input & 4) || !(output & 4) || inputHigh === pressed || outputHigh !== Boolean(output & 2)) {
        throw new Error('GPIO A8 không khớp trạng thái máy ảo.')
      }
      return { inputHigh, outputHigh }
    },
  })
}

export function createA8LocalService(root) {
  return createRenodeLocalService(root, { stage: 'A8', prefix, openMachine: openA8Machine })
}
