import approval from '../../../docs/research/2026-11-27-esp32-riscv-electrical-firmware-a3-proposal.json'
import { boards } from '../../data/boards'

export type A3Target = keyof typeof approval.runtime.targets
export const a3TargetSettings = approval.runtime.targets
export const a3ApprovalSha256 = '9518d9f6aad764021e448763534a185c098c37643e56d6f587e6cbf81a542dd5'

const profiles = approval.boards.map(profile => {
  const board = boards.find(item => item.id === profile.id && item.revision === profile.revision)
  if (!board) throw new Error(`A3: sai phiên bản board ${profile.id}`)
  return { ...profile, name: board.name, target: profile.target as A3Target }
})
export type A3Board = typeof profiles[number]
export const getA3Board = (boardId: string) => profiles.find(profile => profile.id === boardId)
export const getA3Fixture = (fixtureId: string) => profiles.find(profile => profile.fixtureId === fixtureId)
