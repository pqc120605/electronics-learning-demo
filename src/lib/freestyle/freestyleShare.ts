import type { CircuitEndpointV2 } from '../circuitDocV2'
import { parseFreestyleWorkspace, SIGNAL_PINS, type FreestyleWorkspace } from './freestyleCircuit'
import { readWireLayout } from './freestyleWireLayout'

const maxFragment = 8_192
const maxJsonBytes = 256_000
const invalidLink = 'Liên kết mạch không hợp lệ hoặc đã bị thay đổi.'
const tooLarge = 'Mạch quá lớn để chia sẻ bằng link, hãy xuất tệp.'
const epoch = '1970-01-01T00:00:00.000Z'

const pinOrHole = (endpoint: CircuitEndpointV2): CircuitEndpointV2 => endpoint.kind === 'pin'
  ? { kind: 'pin', partId: endpoint.partId, pinId: endpoint.pinId } : { kind: 'hole', holeId: endpoint.holeId }

export function portableWorkspace(workspace: FreestyleWorkspace): FreestyleWorkspace {
  const { doc } = workspace
  return {
    version: 1, boardId: workspace.boardId, code: workspace.code, language: workspace.language, sampleId: workspace.sampleId,
    updatedAt: epoch,
    pinMap: Object.fromEntries(SIGNAL_PINS.map(pin => [pin, workspace.pinMap[pin]])) as FreestyleWorkspace['pinMap'],
    wireLayout: readWireLayout(workspace.wireLayout, doc.wires),
    doc: {
      schema: 2, lessonId: 'freestyle',
      breadboards: doc.breadboards.map(({ id, spec, railSplit }) => ({ id, spec, railSplit })),
      parts: doc.parts.map(({ id, type, mount, value, intentionalShort, geometrySource }) => ({
        id, type,
        mount: mount.kind === 'breadboard'
          ? { kind: mount.kind, board: mount.board, col: mount.col, row: mount.row, rotation: mount.rotation }
          : { kind: mount.kind, lane: mount.lane, order: mount.order },
        value: value && { ohm: value.ohm, farad: value.farad, label: value.label },
        intentionalShort, geometrySource,
      })),
      wires: doc.wires.map(({ id, from, to, role }) => ({ id, from: pinOrHole(from), to: pinOrHole(to), role })),
      openPins: doc.openPins?.map(({ partId, pinId, reason }) => ({ partId, pinId, reason })),
      expect: { partCount: doc.expect.partCount, wireCount: doc.expect.wireCount, netCount: doc.expect.netCount },
    },
  }
}

function base64Url(bytes: Uint8Array) {
  let text = ''
  for (const value of bytes) text += String.fromCharCode(value)
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

async function checksum(bytes: Uint8Array<ArrayBuffer>) {
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)).subarray(0, 12))
}

async function readBounded(stream: ReadableStream<Uint8Array>, max: number, error: string): Promise<Uint8Array<ArrayBuffer>> {
  const reader = stream.getReader()
  const chunks = []
  let size = 0
  try {
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > max) throw new Error(error)
      chunks.push(chunk.value)
    }
    const result = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    return result
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export async function encodeFreestyleShare(workspace: FreestyleWorkspace): Promise<string> {
  const json = JSON.stringify(portableWorkspace(workspace))
  const bytes = new TextEncoder().encode(json)
  if (bytes.byteLength > maxJsonBytes) throw new Error(tooLarge)
  if (!workspace.boardId || !parseFreestyleWorkspace(json)) throw new Error('Chọn board và kiểm tra mạch trước khi chia sẻ.')
  const packed = await readBounded(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')), maxFragment, tooLarge)
  const fragment = `#s=1.${await checksum(packed)}.${base64Url(packed)}`
  if (fragment.length > maxFragment) throw new Error(tooLarge)
  return fragment
}

export async function readFreestyleShare(fragment: string): Promise<FreestyleWorkspace> {
  const match = fragment.length <= maxFragment && /^#s=1\.([\w-]{16})\.([\w-]+)$/.exec(fragment)
  if (!match) throw new Error(invalidLink)
  try {
    const binary = atob(match[2].replaceAll('-', '+').replaceAll('_', '/'))
    const bytes = Uint8Array.from(binary, value => value.charCodeAt(0))
    if (base64Url(bytes) !== match[2] || await checksum(bytes) !== match[1]) throw new Error(invalidLink)
    const expanded = await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')), maxJsonBytes, invalidLink)
    const workspace = parseFreestyleWorkspace(new TextDecoder('utf-8', { fatal: true }).decode(expanded))
    if (!workspace?.boardId) throw new Error(invalidLink)
    return portableWorkspace(workspace)
  } catch {
    throw new Error(invalidLink)
  }
}
