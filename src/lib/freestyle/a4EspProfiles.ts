import approval from '../../../docs/research/2026-11-27-esp32-s3-electrical-firmware-a4-proposal.json'
import { boards } from '../../data/boards'

export const a4ApprovalSha256 = '87ecccdc51aea68b8c75b0a8aa07623d146e5bea4b520827e86e77cff8066475'
export const a4Target = approval.runtime.target
export const a4Revision = approval.revision

const profiles = approval.boards.map(profile => {
  const board = boards.find(item => item.id === profile.id && item.revision === profile.revision)
  if (!board) throw new Error(`A4: sai phiên bản board ${profile.id}`)
  return { ...profile, name: board.name }
})

export type A4Board = typeof profiles[number]
export const getA4Board = (boardId: string) => profiles.find(profile => profile.id === boardId)
export const getA4Fixture = (fixtureId: string) => profiles.find(profile => profile.fixtureId === fixtureId)
