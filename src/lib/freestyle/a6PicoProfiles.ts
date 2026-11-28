
import approval from '../../../docs/research/2026-11-27-rp2350-electrical-firmware-a6-proposal.json'
import { boards } from '../../data/boards'

export const a6ApprovalSha256 = '0c66dcb5aaf2543791587d27f9b1e9f008848f6d752c1f89590d31d1ad2acf8e'
export const a6Revision = approval.revision
export const a6Pins = approval.pins
export const a6Firmware = approval.firmware
export const a6ReadyLine = approval.firmware.behavior.readyLine
export const a6Limits = approval.runtime.limits
export const a6RuntimeAssets = approval.runtime.artifact.files

const profiles = approval.boards.map(profile => {
  const board = boards.find(item => item.id === profile.id && item.revision === profile.revision)
  if (!board) throw new Error('A6: sai phiên bản board ' + profile.id)
  return { ...profile, ...a6Pins, name: board.name }
})

export type A6Board = typeof profiles[number]
export const getA6Board = (boardId: string) => profiles.find(profile => profile.id === boardId)
export const getA6Fixture = (fixtureId: string) => profiles.find(profile => profile.fixtureId === fixtureId)
