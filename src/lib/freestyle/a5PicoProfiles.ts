import approval from '../../../docs/research/2026-11-27-rp2040-electrical-firmware-a5-proposal.json'
import { boards } from '../../data/boards'

export const a5ApprovalSha256 = 'ad345e14d3cfa2e2d23b50bc23d0f6539ba944372a76ec5d280939df95687e65'
export const a5Revision = approval.revision
export const a5Pins = approval.pins
export const a5Target = approval.runtime.target
export const a5FlashLayout = approval.runtime.flash
export type A5SdkBoard = 'pico' | 'pico_w'

const profiles = approval.boards.map(profile => {
  const board = boards.find(item => item.id === profile.id && item.revision === profile.revision)
  if (!board) throw new Error(`A5: sai phiên bản board ${profile.id}`)
  return { ...profile, ...a5Pins, sdkBoard: profile.sdkBoard as A5SdkBoard, name: board.name }
})

export type A5Board = typeof profiles[number]
export const getA5Board = (boardId: string) => profiles.find(profile => profile.id === boardId)
export const getA5Fixture = (fixtureId: string) => profiles.find(profile => profile.fixtureId === fixtureId)
