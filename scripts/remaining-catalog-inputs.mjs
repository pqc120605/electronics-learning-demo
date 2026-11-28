import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const approval = 'b4ffbe029a95931441999ba5385a5f05d3976c2e192c515d2d7a62bc071a2841'
export const proposalPath = 'docs/research/2026-11-26-catalog-model-remaining-13-proposal.json'
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export async function loadRemainingCatalog(kicadLibrary) {
  const bytes = await readFile(proposalPath)
  if (sha256(bytes) !== approval) throw new Error('Remaining catalog approval SHA-256 mismatch')
  const config = JSON.parse(bytes)
  for (const [id, source] of Object.entries(config.sourceLocks)) {
    const path = source.library ? join(kicadLibrary, source.path) : source.path
    const input = await readFile(path)
    if (sha256(input) !== source.sha256 || input.length !== source.bytes) throw new Error('Source SHA-256 mismatch: ' + id)
  }
  return config
}
