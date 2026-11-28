import { createLocalFirmwareRuntime } from './renodeRuntime'

const sha256 = 'ef88a72e4dba5015a288d84ddccf9eda0b0a84dd05a8aaac3e77ad663da15960'
const limits = { startupWallMs: 30_000, runWallMs: 90_000 }
export const a12Runtime = createLocalFirmwareRuntime('A12', '/api/local-tools/a12/', sha256, limits, 'Podman', true)
