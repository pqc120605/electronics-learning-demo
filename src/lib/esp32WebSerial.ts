import { esp32Targets, firmwareSha256, parseFirmwareManifest, type VerifiedFirmware } from './esp32Firmware'

type WebSerialPort = {
  readonly readable: ReadableStream<Uint8Array> | null
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
}
type WebSerial = { requestPort(): Promise<WebSerialPort> }
export function getWebSerial() {
  return globalThis.isSecureContext && typeof navigator !== 'undefined'
    ? (navigator as Navigator & { serial?: WebSerial }).serial : undefined
}

type Esp32Driver = {
  connect(): Promise<{ chip: string; flashBytes: number }>
  write(files: VerifiedFirmware['files'], progress: (percent: number) => void): Promise<void>
  reset(): Promise<void>
  disconnect(): Promise<void>
}

export async function flashVerifiedEsp32(firmware: VerifiedFirmware, driver: Esp32Driver, progress: (percent: number) => void, signal?: AbortSignal) {
  const { files } = firmware
  const manifest = parseFirmwareManifest(firmware.manifest, firmware.manifest)
  if (manifest.images.length !== files.length) throw new Error('Bộ firmware thiếu tệp đã ghim.')
  for (const [index, image] of manifest.images.entries()) {
    const file = files[index]
    if (file.address !== image.offset || file.data.byteLength !== image.bytes || await firmwareSha256(file.data) !== image.sha256) throw new Error('Firmware đã thay đổi kể từ khi kiểm SHA-256.')
  }
  signal?.throwIfAborted()
  try {
    const device = await driver.connect()
    signal?.throwIfAborted()
    if (device.chip !== esp32Targets[manifest.board].chip) throw new Error(`Chip đang cắm là ${device.chip}; mẫu yêu cầu ${esp32Targets[manifest.board].chip}. Chưa ghi flash.`)
    if (device.flashBytes !== manifest.flashBytes) throw new Error('Dung lượng flash chưa xác nhận hoặc không khớp cấu hình đã duyệt. Chưa ghi flash.')
    await driver.write(files, progress)
    await driver.reset()
    progress(100)
  } finally { await driver.disconnect().catch(() => {}) }
}

export async function createEsp32Driver(port: WebSerialPort): Promise<Esp32Driver> {
  const { ESPLoader, Transport } = await import('esptool-js')
  const transport = new Transport(port as ConstructorParameters<typeof Transport>[0], false)
  const loader = new ESPLoader({ transport, baudrate: 115200, romBaudrate: 115200 })
  return {
    async connect() {
      await loader.main('default_reset')
      const size = await loader.detectFlashSize()
      const match = /^(\d+)MB$/.exec(size ?? '')
      return { chip: loader.chip.CHIP_NAME, flashBytes: match ? Number(match[1]) * 1024 * 1024 : 0 }
    },
    async write(fileArray, progress) {
      const count = fileArray.length
      await loader.writeFlash({ fileArray, flashMode: 'keep', flashFreq: 'keep', flashSize: 'keep', eraseAll: false, compress: true,
        reportProgress: (fileIndex, written, total) => { if (total > 0) progress(Math.min(99, Math.round((fileIndex + written / total) / count * 100))) },
      })
    },
    async reset() { await loader.after('hard_reset') },
    async disconnect() { await transport.disconnect() },
  }
}

export async function monitorSerial(port: WebSerialPort, baudRate: number, onText: (text: string) => void, signal: AbortSignal) {
  signal.throwIfAborted()
  await port.open({ baudRate })
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  const cancel = () => { void reader?.cancel().catch(() => {}) }
  try {
    signal.throwIfAborted()
    reader = port.readable?.getReader()
    if (!reader) throw new Error('Cổng Serial không có dữ liệu đọc được.')
    signal.addEventListener('abort', cancel, { once: true })
    const decoder = new TextDecoder()
    while (!signal.aborted) {
      const chunk = await reader.read()
      if (chunk.done) break
      onText(decoder.decode(chunk.value, { stream: true }))
    }
    if (!signal.aborted) onText(decoder.decode())
  } finally {
    signal.removeEventListener('abort', cancel)
    reader?.releaseLock()
    await port.close().catch(() => {})
  }
}
