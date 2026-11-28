import { firmwareSessionBase, firmwareTab, isHostedFirmware } from './firmwareDelivery'
import type { A2Sample } from './a2C3Runtime'
import { a7ApprovalSha256, a7Limits } from './a7Stm32Profiles'
import { a8ApprovalSha256, a8Transport } from './a8Ra4m1Profiles'
import { a9ApprovalSha256, a9Transport } from './a9Stm32Profiles'

type Frame = { serial: string; sample: A2Sample }
type Boot = Frame & { id: string; approvalSha256: string }

export function createLocalFirmwareRuntime(stage: string, base: string, sha256: string,
  limits: { startupWallMs: number; runWallMs: number }, provider = 'Renode', perTab = false) {
  let tab: string | undefined
  async function post(operation: string, body: object, signal?: AbortSignal, keepalive = false) {
    const response = await fetch(firmwareSessionBase(stage, base) + operation, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal, keepalive,
    })
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Dịch vụ ' + provider + ' ' + stage + ' chưa khả dụng.')
    }
    const result = await response.json()
    if (!response.ok) throw new Error(result.message ?? 'Phiên ' + provider + ' ' + stage + ' đã mất kết nối.')
    return result
  }

  let retirement = Promise.resolve()
  function stop(id: string) {
    const signal = AbortSignal.timeout(limits.startupWallMs)
    const request = post('stop', { id }, signal, true).then(() => {}, () => {})
    retirement = Promise.all([retirement, request]).then(() => {})
    return request
  }
  return {
    limits,
    async start(board: { id: string; readyLine: string }, signal: AbortSignal): Promise<Boot> {
      await retirement
      signal.throwIfAborted()
      if (perTab || isHostedFirmware()) tab ??= firmwareTab()
      const boot: Boot = await post('start', { boardId: board.id, ...(tab ? { tab } : {}) }, signal)
      if (boot.approvalSha256 !== sha256 || !boot.serial.split(/\r?\n/).includes(board.readyLine)) {
        void stop(boot.id)
        throw new Error('Phiên ' + stage + ' không khớp board đã chọn.')
      }
      return boot
    },
    step(id: string, pressed: boolean, signal: AbortSignal, milliseconds?: number): Promise<Frame> {
      return post('step', { id, pressed, ...(milliseconds === undefined ? {} : { milliseconds }) }, signal)
    },
    stop,
  }
}

export const a7Runtime = createLocalFirmwareRuntime('A7', '/api/local-tools/a7-stm32/', a7ApprovalSha256, a7Limits)
export const a8Runtime = createLocalFirmwareRuntime('A8', a8Transport.route, a8ApprovalSha256, a8Transport.limits)
export const a9Runtime = createLocalFirmwareRuntime('A9', a9Transport.route, a9ApprovalSha256, a9Transport.limits)
