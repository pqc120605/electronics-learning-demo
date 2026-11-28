import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

export const a1Approval = '63d5b0db7a420da9fbda0dc7beda4f92c606fb922cfe9db2d99b371ca8b66826'
const revisionFile = new URL('../docs/research/2026-11-26-board-pin-electrical-firmware-a-proposal.json', import.meta.url)
export const a1Sha256 = value => createHash('sha256').update(value).digest('hex')

export async function loadApprovedA1() {
  const bytes = await readFile(revisionFile)
  if (a1Sha256(bytes) !== a1Approval) throw new Error('A1 configuration SHA-256 does not match the approved revision')
  const config = JSON.parse(bytes)
  const locked = config.lockedComponentReference
  const componentReference = await readFile(new URL('../' + locked.path, import.meta.url))
  if (a1Sha256(componentReference) !== locked.sha256) throw new Error('A1 component revision mismatch')
  return config
}
