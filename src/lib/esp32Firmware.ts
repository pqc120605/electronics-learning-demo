export const esp32Targets = {
  'esp32-devkit': { chip: 'ESP32', fqbn: 'esp32:esp32:esp32', bootloader: 0x1000 },
  'esp32-s3-devkitc-1': { chip: 'ESP32-S3', fqbn: 'esp32:esp32:esp32s3', bootloader: 0 },
  'seeed-xiao-esp32c3': { chip: 'ESP32-C3', fqbn: 'esp32:esp32:XIAO_ESP32C3', bootloader: 0 },
} as const
export type Esp32Board = keyof typeof esp32Targets
export const isEsp32Target = (id: string): id is Esp32Board => Object.hasOwn(esp32Targets, id)
export const ESP32_CORE_VERSION = '4.0.0'
const hexSha = /^[0-9a-f]{64}$/
const sampleId = /^[a-z0-9-]{1,50}$/
const limit = 16 * 1024 * 1024

type ImageKind = 'bootloader' | 'partitions' | 'boot_app0' | 'app'
type FirmwareImage = { kind: ImageKind; bytes: number; sha256: string; offset: number }
export type FirmwareManifest = { version: 1; board: Esp32Board; lesson: string; fqbn: string; coreVersion: string; sketchSha256: string; serialBaud: number; flashBytes: number; images: FirmwareImage[] }
export type PinnedFirmware = { lesson: string; board: Esp32Board; manifestSha256: string }

// The app recognizes only reviewed manifests pinned in source. Build artifacts are reviewed separately.
export const releasedEsp32Firmware: readonly PinnedFirmware[] = []

export async function firmwareSha256(bytes: Uint8Array<ArrayBuffer>) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('')
}

export function parseFirmwareManifest(value: unknown, pin: Pick<PinnedFirmware, 'board' | 'lesson'>): FirmwareManifest {
  if (!value || typeof value !== 'object' || !isEsp32Target(pin.board) || !sampleId.test(pin.lesson)) throw new Error('Manifest firmware không hợp lệ.')
  const manifest = value as FirmwareManifest
  const target = esp32Targets[pin.board]
  if (manifest.version !== 1 || manifest.board !== pin.board || manifest.lesson !== pin.lesson || manifest.fqbn !== target.fqbn
    || manifest.coreVersion !== ESP32_CORE_VERSION || typeof manifest.sketchSha256 !== 'string' || !hexSha.test(manifest.sketchSha256)
    || ![2, 4, 8, 16].some(size => manifest.flashBytes === size * 1024 * 1024)
    || ![9600, 115200].includes(manifest.serialBaud) || !Array.isArray(manifest.images) || manifest.images.length !== 4) throw new Error('Manifest không khớp bài, board hoặc phiên bản core.')
  const layout: readonly [ImageKind, number, number][] = [
    ['bootloader', target.bootloader, 0x8000], ['partitions', 0x8000, 0xe000], ['boot_app0', 0xe000, 0x10000], ['app', 0x10000, manifest.flashBytes],
  ]
  const images = layout.map(([kind, offset, ceiling]) => {
    const image = manifest.images.find(item => item?.kind === kind)
    if (!image || image.offset !== offset || !Number.isSafeInteger(image.bytes) || image.bytes <= 0 || image.bytes > ceiling - offset
      || typeof image.sha256 !== 'string' || !hexSha.test(image.sha256)) throw new Error(`Offset, kích thước hoặc SHA-256 firmware ${kind} không hợp lệ.`)
    return image
  })
  return { ...manifest, images }
}

async function getBoundedBytes(fetcher: typeof fetch, url: string, max: number, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetcher(url, { signal, credentials: 'omit', cache: 'no-store', redirect: 'error' })
  if (!response.ok || !response.body || Number(response.headers.get('content-length')) > max) throw new Error('Không đọc được tệp firmware đã ghim.')
  const bytes = new Uint8Array(max)
  const reader = response.body.getReader()
  let length = 0
  try {
    for (;;) {
      const part = await reader.read()
      if (part.done) break
      if (part.value.byteLength > max - length) throw new Error('Tệp firmware lớn hơn giới hạn đã ghim.')
      bytes.set(part.value, length)
      length += part.value.byteLength
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
  return bytes.slice(0, length)
}

export type VerifiedFirmware = { manifest: FirmwareManifest; files: { address: number; data: Uint8Array<ArrayBuffer> }[] }
export async function loadPinnedFirmware(pin: PinnedFirmware, code: string, options: { fetcher?: typeof fetch; signal?: AbortSignal } = {}): Promise<VerifiedFirmware> {
  if (!sampleId.test(pin.lesson) || !isEsp32Target(pin.board) || !hexSha.test(pin.manifestSha256)) throw new Error('Firmware chưa được duyệt.')
  const { fetcher = fetch, signal } = options
  const path = `${import.meta.env.BASE_URL}firmware/esp32/${pin.lesson}/${pin.board}/`
  const raw = await getBoundedBytes(fetcher, `${path}manifest.json`, 12 * 1024, signal)
  if (await firmwareSha256(raw) !== pin.manifestSha256) throw new Error('SHA-256 của manifest khác bản đã ghim.')
  const manifest = parseFirmwareManifest(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)), pin)
  if (await firmwareSha256(new TextEncoder().encode(code)) !== manifest.sketchSha256) throw new Error('Code đang mở khác mẫu đã biên dịch. Hãy tải sketch .ino để tự biên dịch.')
  const files: VerifiedFirmware['files'] = []
  for (const spec of manifest.images) {
    const data = await getBoundedBytes(fetcher, `${path}${spec.kind}.bin`, Math.min(limit, spec.bytes), signal)
    if (data.length !== spec.bytes || await firmwareSha256(data) !== spec.sha256) throw new Error(`Tệp ${spec.kind} sai kích thước hoặc SHA-256.`)
    files.push({ address: spec.offset, data })
  }
  return { manifest, files }
}
