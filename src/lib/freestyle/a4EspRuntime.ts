import { a4ApprovalSha256, a4Target } from './a4EspProfiles'

const mib = 1024 * 1024

export function assertA4Image(image: Uint8Array, flashMiB: number) {
  if (![4, 8, 16].includes(flashMiB) || image.byteLength !== flashMiB * mib) {
    throw new Error('Dung lượng ảnh flash A4 không khớp phiên bản board.')
  }
  for (const offset of [0, 0x10000]) {
    const chip = image[offset + 12] | (image[offset + 13] << 8)
    if (image[offset] !== 0xe9 || image[offset + 1] === 0 || chip !== Number(a4Target.chipId)) {
      throw new Error('Ảnh bootloader và ứng dụng A4 phải đúng chip ESP32-S3.')
    }
  }
  if (image[2] !== 2 || image[3] !== Math.log2(flashMiB) << 4) {
    throw new Error('Header flash A4 phải khớp dung lượng board, DIO và 40 MHz.')
  }
  if (image[0x8000] !== 0xaa || image[0x8001] !== 0x50) {
    throw new Error('Ảnh A4 thiếu bảng phân vùng ESP-IDF.')
  }
}

export async function loadA4Firmware(flashMiB: number, signal: AbortSignal) {
  const base = `/api/local-tools/a4-esp/${flashMiB}m/`
  const response = await fetch(base + 'manifest.json', { signal })
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error(`Firmware A4 ${flashMiB} MiB chưa được chuẩn bị trên máy này.`)
  }
  const manifest = await response.json()
  if (manifest?.approvalSha256 !== a4ApprovalSha256 || manifest.target !== a4Target.name || manifest.flashMiB !== flashMiB
    || manifest.flash?.bytes !== flashMiB * mib || !/^[a-f0-9]{64}$/.test(manifest.flash?.sha256 ?? '')) {
    throw new Error('Manifest firmware không khớp cấu hình A4.')
  }
  const flash = await fetch(base + 'flash.bin', { signal })
  if (!flash.ok) throw new Error(`Chưa tải được firmware A4 ${flashMiB} MiB.`)
  const bytes = await flash.arrayBuffer()
  assertA4Image(new Uint8Array(bytes), flashMiB)
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('')
  if (digest !== manifest.flash.sha256) throw new Error('SHA-256 firmware A4 không khớp.')
  return bytes
}
