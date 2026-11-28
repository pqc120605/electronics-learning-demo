import approval from '../../../docs/research/2026-11-27-stm32f4-electrical-firmware-a7-proposal.json'
import { boards } from '../../data/boards'

export const a7ApprovalSha256 = '3e5d974d2bd3f6d70b19d1d7ea3617cd698d90b4ded524291b86961e47315c3e'
export const a7Limits = approval.runtime.localTransport.limits
export const a7Revision = approval.revision
export const a7Pins = {
  ...approval.pins,
  button: { ...approval.pins.button, gpio: approval.pins.button.bit },
  led: { ...approval.pins.led, gpio: approval.pins.led.bit },
}

const profiles = approval.boards.map(profile => {
  const board = boards.find(item => item.id === profile.id && item.revision === profile.revision)
  if (!board) throw new Error('A7: sai phiên bản board ' + profile.id)
  return { ...profile, ...a7Pins, name: board.name }
})

export type A7Board = typeof profiles[number]
export const getA7Board = (boardId: string) => profiles.find(profile => profile.id === boardId)
export const getA7Fixture = (fixtureId: string) => profiles.find(profile => profile.fixtureId === fixtureId)
