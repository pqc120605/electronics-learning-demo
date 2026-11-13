import { createHash } from 'node:crypto'

const SHA256_PATTERN = /^[a-f0-9]{64}$/i
const COMMIT_PATTERN = /^[a-f0-9]{40}$/i

export function getPublicReleaseBlockers(manifest, wasmBytes) {
  const redistribution = manifest?.redistribution ?? {}
  const runtime = manifest?.runtime ?? {}
  const review = redistribution.distributionReview ?? {}
  const blockers = []

  if (redistribution.status !== 'cleared') blockers.push('exact WASM redistribution status is not cleared')

  if (!(wasmBytes instanceof Uint8Array) || wasmBytes.byteLength === 0) {
    blockers.push('the exact public WASM artifact is missing or unreadable')
  } else {
    const actualHash = createHash('sha256').update(wasmBytes).digest('hex')
    if (!SHA256_PATTERN.test(runtime.wasmSha256 ?? '') || actualHash !== runtime.wasmSha256.toLowerCase()) {
      blockers.push('the served WASM SHA-256 does not match the provenance record')
    }
    if (!Number.isInteger(runtime.wasmBytes) || wasmBytes.byteLength !== runtime.wasmBytes) {
      blockers.push('the served WASM byte count does not match the provenance record')
    }
  }

  const sourceCommit = redistribution.sourceCommit
  if (!COMMIT_PATTERN.test(sourceCommit ?? '') || runtime.sourceCommit !== sourceCommit) {
    blockers.push('the exact source commit is missing or does not match the runtime provenance')
  }
  if (typeof redistribution.buildRecipe !== 'string' || redistribution.buildRecipe.trim().length < 24 || /not-recorded|unknown|pending/i.test(redistribution.buildRecipe)) {
    blockers.push('reproducible build recipe and toolchain record are missing')
  }

  const inventory = redistribution.componentInventory
  const completeInventory = Array.isArray(inventory) && inventory.length > 0 && inventory.every((component) =>
    component && typeof component === 'object' &&
    ['name', 'version', 'license', 'sourceUrl', 'noticePath', 'redistributionBasis'].every((field) =>
      typeof component[field] === 'string' && component[field].trim().length > 0) &&
    /^https:\/\//i.test(component.sourceUrl),
  )
  if (!completeInventory) blockers.push('compiled component/license inventory is missing or incomplete')

  const reviewedHash = review.artifactSha256
  if (review.status !== 'approved' || !review.reviewer?.trim?.() || !review.reviewedAt?.trim?.() || !review.evidence?.trim?.() ||
      !SHA256_PATTERN.test(reviewedHash ?? '') || reviewedHash.toLowerCase() !== (runtime.wasmSha256 ?? '').toLowerCase()) {
    blockers.push('distribution review evidence is incomplete or is not bound to the exact artifact hash')
  }

  return blockers
}
