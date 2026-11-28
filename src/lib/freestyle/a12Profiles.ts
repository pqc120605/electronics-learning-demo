import proposal from '../../../docs/research/2026-11-28-s2-nano-every-electrical-firmware-a12-proposal.json'

export const a12Revision = proposal.revision
export const a12ApprovalSha256 = 'f558c56ab135bd4d4ad5912d7ae48c368b588d54a63f41542d567a3ec7674919'
export const a12Boards = proposal.boards.map(board => ({
  ...board,
  ...board.pins,
  button: { ...board.pins.button, gpio: board.pins.button.gpio ?? 2 },
  led: { ...board.pins.led, gpio: board.pins.led.gpio ?? 8 },
}))
export type A12Board = typeof a12Boards[number]
export const getA12Board = (id: string) => a12Boards.find(board => board.id === id)
