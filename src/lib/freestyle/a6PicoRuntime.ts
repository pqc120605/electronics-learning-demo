
import { a6ApprovalSha256, a6Firmware, a6RuntimeAssets, type A6Board } from './a6PicoProfiles'

const base = '/api/local-tools/a6-pico/'
const maxElfBytes = 1024 * 1024
const shaPattern = /^[a-f0-9]{64}$/
const flash = [0x10000000, 0x10400000] as const
const sram = [0x20000000, 0x20082000] as const
type AssetDigest = { bytes: number; sha256: string }
type A6Manifest = {
  approvalSha256: string; boardId: string; revision: string; fixtureId: string
  target: string; sdkBoard: string; sdkCommit: string
  modelSha256: string; topViewSha256: string
  elf: AssetDigest
}

export type A6WorkerMessage = { type: 'input'; pressed: boolean } | {
  type: 'boot'; elf: ArrayBuffer; wrapper: ArrayBuffer; wasm: ArrayBuffer; pressed: boolean
}

const fits = (address: number, size: number, [from, to]: readonly [number, number]) =>
  address >= from && address < to && address + size <= to

export function assertA6Elf(bytes: Uint8Array) {
  const bad = () => new Error('ELF A6 thiếu header ARM Thumb hoặc vùng nạp RP2350 hợp lệ.')
  if (bytes.byteLength < 52 || bytes.byteLength > maxElfBytes) throw bad()
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const word = (offset: number) => view.getUint32(offset, true)
  const short = (offset: number) => view.getUint16(offset, true)
  if (word(0) !== 0x464c457f || bytes[4] !== 1 || bytes[5] !== 1 || bytes[6] !== 1
    || short(16) !== 2 || short(18) !== 40 || word(20) !== 1 || short(40) !== 52) throw bad()
  const entry = word(24)
  const table = word(28)
  const stride = short(42)
  const count = short(44)
  if (!(entry & 1) || !fits(entry, 1, flash) || table < 52 || stride !== 32 || !count
    || table + stride * count > bytes.byteLength) throw bad()

  let mappedEntry = false
  for (let offset = table; offset < table + stride * count; offset += stride) {
    if (word(offset) !== 1) continue
    const start = word(offset + 4)
    const virtual = word(offset + 8)
    const physical = word(offset + 12)
    const payload = word(offset + 16)
    const size = word(offset + 20)
    const flags = word(offset + 24)
    if (payload > size || start + payload > bytes.byteLength
      || !(fits(virtual, size, flash) || fits(virtual, size, sram))
      || !(fits(physical, payload, flash) || fits(physical, payload, sram))) throw bad()
    if ((flags & 1) && virtual <= entry - 1 && entry - 1 < virtual + payload) mappedEntry = true
  }
  if (!mappedEntry) throw bad()
}

export function assertA6Manifest(value: unknown, board: A6Board): asserts value is A6Manifest {
  const parsed = value as Partial<A6Manifest> | null
  if (parsed?.approvalSha256 !== a6ApprovalSha256 || parsed.boardId !== board.id || parsed.revision !== board.revision
    || parsed.fixtureId !== board.fixtureId || parsed.sdkBoard !== board.sdkBoard
    || parsed.target !== a6Firmware.build.PICO_PLATFORM || parsed.sdkCommit !== a6Firmware.sdk.commit
    || parsed.modelSha256 !== board.model.sha256 || parsed.topViewSha256 !== board.topView.sha256
    || !parsed.elf || !Number.isInteger(parsed.elf.bytes) || parsed.elf.bytes < 52 || parsed.elf.bytes > maxElfBytes
    || typeof parsed.elf.sha256 !== 'string' || !shaPattern.test(parsed.elf.sha256)) {
    throw new Error('Manifest firmware không khớp cấu hình A6.')
  }
}

async function checkedAsset(path: string, expected: AssetDigest, signal: AbortSignal, label: string) {
  const response = await fetch(base + path, { signal })
  if (!response.ok) throw new Error('Chưa tải được ' + label + '.')
  const bytes = await response.arrayBuffer()
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('')
  if (bytes.byteLength !== expected.bytes || hash !== expected.sha256) {
    throw new Error('SHA-256 hoặc dung lượng ' + label + ' không khớp cấu hình A6.')
  }
  return bytes
}

export async function loadA6Firmware(board: A6Board, signal: AbortSignal) {
  const response = await fetch(base + board.id + '/manifest.json', { signal })
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Firmware A6 chưa được chuẩn bị trên máy này.')
  }
  const manifest: unknown = await response.json()
  assertA6Manifest(manifest, board)
  const js = a6RuntimeAssets.find(file => file.path === 'package/picoemu.wasm.js')!
  const binary = a6RuntimeAssets.find(file => file.path === 'package/picoemu.wasm.wasm')!
  const [elf, wrapper, wasm] = await Promise.all([
    checkedAsset(board.id + '/firmware.elf', manifest.elf, signal, 'ELF firmware A6'),
    checkedAsset('engine/picoemu.wasm.js', js, signal, 'trình nạp pico-emu'),
    checkedAsset('engine/picoemu.wasm.wasm', binary, signal, 'pico-emu WASM'),
  ])
  assertA6Elf(new Uint8Array(elf))
  return { elf, wrapper, wasm }
}
