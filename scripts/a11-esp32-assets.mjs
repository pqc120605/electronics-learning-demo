import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const a11Approval = '44584deeb8f5472852ee6174c29907466cbfdf5c2e04a295343c006823e4a333'
export const digestA11 = bytes => createHash('sha256').update(bytes).digest('hex')
export const a11AssetDir = '.tmp/a11-local-assets'

export async function readA11LockedFile(path, expected) {
  const bytes = await readFile(path)
  if (digestA11(bytes) !== expected) throw new Error(`A11 SHA-256 mismatch: ${path}`)
  return bytes
}

export async function readA11Proposal(root = process.cwd()) {
  const proposal = JSON.parse(await readA11LockedFile(resolve(root,
    'docs/research/2026-11-27-esp32-lx6-electrical-firmware-a11-proposal.json'), a11Approval))
  const { engine } = proposal.electrical
  await readA11LockedFile(resolve(root, engine.path), engine.sha256)
  for (const board of proposal.boards) {
    for (const asset of board.assets) await readA11LockedFile(resolve(root, asset.path), asset.sha256)
  }
  return proposal
}
