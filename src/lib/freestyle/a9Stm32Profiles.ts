import approval from '../../../docs/research/2026-11-27-stm32-f1-l4-electrical-firmware-a9-proposal.json'

export const a9ApprovalSha256 = '954006616229f5045215e90c5b59ce1d313cfa65250670e8aa1fc26198856b99'
export const a9Revision = approval.revision
export const a9Transport = approval.runtime.transport

const profiles = approval.boards.map(board => ({
  ...board,
  revision: board.boardRevision,
  readyLine: board.firmware.readyLine,
  button: { ...board.pins.input, gpio: board.pins.input.alias, label: board.pins.input.gpio },
  led: { ...board.pins.output, gpio: board.pins.output.alias, label: board.pins.output.gpio },
  power: { ...board.pins.power, label: board.pins.power.signal },
  ground: { ...board.pins.ground, label: board.pins.ground.signal },
}))

export type A9Board = typeof profiles[number]
export const getA9Board = (boardId: string) => profiles.find(board => board.id === boardId)
export const getA9Fixture = (fixtureId: string) => profiles.find(board => board.fixtureId === fixtureId)
