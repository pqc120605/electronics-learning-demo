import { a3ApprovalSha256, a3TargetSettings, type A3Target } from './a3EspProfiles'

export function assertA3Image(image: Uint8Array, target: A3Target) {
  const settings = a3TargetSettings[target]
  if (!settings || image.byteLength !== settings.flashBytes) throw new Error('Kích thước ảnh flash A3 không khớp target.')
  for (const offset of [0, 0x10000]) {
    const chip = image[offset + 12] | (image[offset + 13] << 8)
    if (image[offset] !== 0xe9 || image[offset + 1] === 0 || chip !== Number(settings.chipId)) {
      throw new Error(`Ảnh bootloader và ứng dụng A3 phải đúng chip ${target}.`)
    }
  }
}

export async function loadA3Firmware(target: A3Target, signal: AbortSignal) {
  const base = `/api/local-tools/a3-esp/${target}/`
  const response = await fetch(base + 'manifest.json', { signal })
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error(`Firmware A3 cho ${target} chưa được chuẩn bị trên máy này.`)
  }
  const manifest = await response.json()
  if (manifest?.approvalSha256 !== a3ApprovalSha256 || manifest.target !== target
    || manifest.flash?.bytes !== a3TargetSettings[target].flashBytes || !/^[a-f0-9]{64}$/.test(manifest.flash?.sha256 ?? '')) {
    throw new Error('Manifest firmware không khớp cấu hình A3.')
  }
  const flash = await fetch(base + 'flash.bin', { signal })
  if (!flash.ok) throw new Error(`Chưa tải được firmware A3 cho ${target}.`)
  const bytes = await flash.arrayBuffer()
  assertA3Image(new Uint8Array(bytes), target)
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('')
  if (digest !== manifest.flash.sha256) throw new Error('SHA-256 firmware A3 không khớp.')
  return bytes
}
