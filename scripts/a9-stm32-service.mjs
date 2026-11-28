import { a9ApprovalSha256, loadA9Target } from './a9-stm32-profile.mjs'
import { openRenodeMachine } from './renode-local-process.mjs'
import { createRenodeLocalService } from './renode-local-service.mjs'

const prefix = '/api/local-tools/a9-stm32/'

export async function openA9Machine(root, boardId, lifetime, hosted) {
  const { proposal, board, assets, runner, elf, platform, tickAddress } = await loadA9Target(root, boardId, hosted)
  const { route, runnerArguments, limits } = proposal.runtime.transport
  if (route !== prefix) throw new Error('Đường dẫn dịch vụ không khớp cấu hình A9.')
  const { uart, observation, readyLine, cpu } = board.firmware
  const { inputPort, outputPort } = observation
  const legacyGpio = cpu === 'cortex-m3'
  const expectedMode = legacyGpio ? { bits: 4, value: 2 } : { bits: 2, value: 1 }
  return openRenodeMachine({
    stage: 'A9', assets, runner, runnerArguments, limits, elf, platform, lifetime, launch: hosted?.launch,
    approvalSha256: a9ApprovalSha256, readyLine,
    uartDevice: 'sysbus.' + uart.device, inputDevice: 'sysbus.' + inputPort.name, inputBit: inputPort.pin,
    registers: [tickAddress, ...[inputPort.idr, outputPort.mode, outputPort.odr, outputPort.idr].map(Number)],
    observe([input, mode, odr, idr], pressed) {
      const inputHigh = Boolean(input & (1 << inputPort.pin))
      const outputMask = 1 << outputPort.pin
      const outputHigh = Boolean(odr & outputMask)
      const selectedMode = (mode >>> (outputPort.pin * expectedMode.bits)) & ((1 << expectedMode.bits) - 1)
      // The locked F1 model tracks external inputs in IDR and output state in ODR separately.
      if (selectedMode !== expectedMode.value || inputHigh === pressed || (!legacyGpio && outputHigh !== Boolean(idr & outputMask))) {
        throw new Error('GPIO A9 không khớp trạng thái máy ảo.')
      }
      return { inputHigh, outputHigh }
    },
  })
}

export function createA9LocalService(root) {
  return createRenodeLocalService(root, { stage: 'A9', prefix, openMachine: openA9Machine })
}
