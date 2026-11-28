import config from '../../../docs/research/2026-11-27-esp32-lx6-electrical-firmware-a11-proposal.json'

export const a11ApprovalSha256 = '44584deeb8f5472852ee6174c29907466cbfdf5c2e04a295343c006823e4a333'
export const a11Revision = config.revision
export const a11Settings = config.runtime
export const a11Boards = config.boards.map(board => ({ ...board, ...board.pins }))
export type A11Board = typeof a11Boards[number]
export const getA11Board = (id: string) => a11Boards.find(board => board.id === id)
export const getA11Fixture = (id: string) => a11Boards.find(board => board.fixtureId === id)

export function assertA11Image(image: Uint8Array) {
  const flash = a11Settings.flash
  if (image.byteLength !== flash.bytes) throw new Error('Ảnh flash A11 phải đúng 4 MiB.')
  for (const [offset, section] of [[Number(flash.bootloaderOffset), 'bootloader 0x1000'], [Number(flash.factoryAppOffset), 'ứng dụng 0x10000']] as const) {
    const chip = image[offset + 12] | (image[offset + 13] << 8)
    if (image[offset] !== 0xe9 || !image[offset + 1] || chip !== Number(a11Settings.machine.imageChipId)) {
      throw new Error(`Ảnh A11 thiếu ${section} đúng chip ESP32.`)
    }
  }
  const boot = Number(flash.bootloaderOffset)
  if (image[boot + 2] !== 2 || image[boot + 3] !== 0x20) {
    throw new Error('Header bootloader A11 phải khớp flash 4 MiB, DIO và 40 MHz.')
  }
  const partition = Number(flash.partitionTableOffset)
  if (image[partition] !== 0xaa || image[partition + 1] !== 0x50) {
    throw new Error('Ảnh A11 thiếu bảng phân vùng ESP-IDF.')
  }
}

type GpioMachine = { read_memory(address: number, bytes: number): Uint8Array }
const { gpioInputRegister, gpioOutputRegister, gpioEnableRegister, gpioWordBytes } = a11Settings.machine
const { inputGpio, outputGpio } = a11Settings.firmware

export function sampleA11Gpio(machine: GpioMachine) {
  const read = (address: string) => {
    const bytes = machine.read_memory(Number(address), gpioWordBytes)
    if (bytes.byteLength !== gpioWordBytes) throw new Error('Bộ mô phỏng thiếu 32 bit thanh ghi GPIO A11.')
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true)
  }
  const outputBit = 1 << outputGpio
  if (!(read(gpioEnableRegister) & outputBit)) return undefined
  return { inputHigh: Boolean(read(gpioInputRegister) & (1 << inputGpio)), outputHigh: Boolean(read(gpioOutputRegister) & outputBit) }
}

export const a11Base = '/api/local-tools/a11-esp/'
const digestPattern = /^[a-f0-9]{64}$/

export function assertA11Source(image: Uint8Array, sourceSha256: string) {
  const app = image.subarray(Number(a11Settings.flash.factoryAppOffset))
  const text = new TextDecoder('iso-8859-1').decode(app)
  if (!digestPattern.test(sourceSha256) || !text.includes('A11_SOURCE_SHA256=' + sourceSha256 + '\0')) {
    throw new Error('SHA-256 mã nguồn A11 không khớp ảnh flash. Hãy biên dịch lại firmware.')
  }
}

const engineFiles = ['esp_emu.js', 'esp_emu_bg.wasm', 'cosim.js'] as const
type EngineFile = typeof engineFiles[number]
type FileDigest = { bytes: number; sha256: string }
type Manifest = {
  approvalSha256?: string; revision?: string; target?: string; sourceSha256?: string; archiveSha256?: string
  flash?: FileDigest; engine?: Partial<Record<EngineFile, FileDigest>>
  fixtures?: Record<string, { id: string; revision: string; sha256: string }>
}

async function sha256(bytes: BufferSource) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function validFile(file?: FileDigest) {
  return file && Number.isSafeInteger(file.bytes) && file.bytes > 0 && file.bytes < 16 * 1024 * 1024 && digestPattern.test(file.sha256)
}

export type A11Assets = { flash: ArrayBuffer; engineJs: ArrayBuffer; wasm: ArrayBuffer; cosimJs: ArrayBuffer }
export type A11WorkerMessage = { type: 'boot'; pressed: boolean; assets: A11Assets } | { type: 'input'; pressed: boolean }

export async function loadA11Firmware(board: A11Board, fixtureJson: string, signal: AbortSignal): Promise<A11Assets> {
  const response = await fetch(a11Base + 'image/manifest.json', { signal })
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Firmware và bộ mô phỏng A11 chưa được chuẩn bị trên máy này.')
  }
  const manifest: Manifest | null = await response.json()
  const fixture = manifest?.fixtures?.[board.id]
  if (manifest?.approvalSha256 !== a11ApprovalSha256 || manifest.revision !== a11Revision
    || manifest.target !== a11Settings.machine.target || manifest.archiveSha256 !== a11Settings.archive.sha256
    || !digestPattern.test(manifest.sourceSha256 ?? '') || fixture?.id !== board.fixtureId || fixture.revision !== board.revision
    || manifest.flash?.bytes !== a11Settings.flash.bytes || !validFile(manifest.flash)
    || engineFiles.some(file => !validFile(manifest.engine?.[file]))) {
    throw new Error('Manifest firmware không khớp cấu hình A11.')
  }
  if (fixture.sha256 !== await sha256(new TextEncoder().encode(fixtureJson))) {
    throw new Error('SHA-256 mạch mẫu A11 không khớp manifest.')
  }
  const asset = async (path: string, expected: FileDigest) => {
    const response = await fetch(a11Base + path, { signal })
    if (!response.ok) throw new Error('Chưa tải được tài sản A11: ' + path)
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength !== expected.bytes || await sha256(bytes) !== expected.sha256) {
      throw new Error('SHA-256 hoặc kích thước tài sản A11 không khớp: ' + path)
    }
    return bytes
  }
  const [flash, engineJs, wasm, cosimJs] = await Promise.all([
    asset('image/flash.bin', manifest.flash), ...engineFiles.map(file => asset('engine/' + file, manifest.engine![file]!)),
  ])
  const image = new Uint8Array(flash)
  assertA11Image(image)
  assertA11Source(image, manifest.sourceSha256!)
  return { flash, engineJs, wasm, cosimJs }
}
