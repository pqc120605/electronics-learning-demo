import approval from '../../../docs/research/2026-11-27-uno-r4-ra4m1-electrical-firmware-a8-proposal.json'
import { boards } from '../../data/boards'

export const a8ApprovalSha256 = 'c49ab23aa1e01d91fa6f7e3b9e9abc63cd98ad42d9b743bd60510a3b0ba5cd2d'
export const a8Revision = approval.revision
export const a8Transport = approval.runtime.transport
const { button, led, power, ground } = approval.commonHeader

const profiles = approval.boards.map(profile => {
  const board = boards.find(item => item.id === profile.id && item.revision === profile.catalogRevision)
  if (!board) throw new Error('A8: sai phiên bản board ' + profile.id)
  return {
    ...profile, name: board.name, revision: profile.catalogRevision, power, ground,
    button: { ...button, gpio: button.arduinoNumber, label: button.label + ' / ' + profile.button.gpio },
    led: { ...led, gpio: led.arduinoNumber, label: led.label + ' / ' + profile.led.gpio },
  }
})

export type A8Board = typeof profiles[number]
export const getA8Board = (boardId: string) => profiles.find(profile => profile.id === boardId)
export const getA8Fixture = (fixtureId: string) => profiles.find(profile => profile.fixtureId === fixtureId)
