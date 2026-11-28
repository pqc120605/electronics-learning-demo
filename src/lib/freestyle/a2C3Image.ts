export function assertA2C3Image(image: Uint8Array) {
  if (image.byteLength !== 4 * 1024 * 1024) throw new Error('Ảnh flash A2 cần đúng 4 MiB.')
  for (const offset of [0, 0x10000]) {
    const chip = image[offset + 12] | (image[offset + 13] << 8)
    if (image[offset] !== 0xe9 || image[offset + 1] === 0 || chip !== 5) throw new Error('Ảnh bootloader và ứng dụng phải đúng chip ESP32-C3.')
  }
}

export async function fetchA2C3Image(url: string, sha256: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Chưa tải được firmware ESP32-C3 A2.')
  const bytes = await response.arrayBuffer()
  const image = new Uint8Array(bytes)
  assertA2C3Image(image)
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('')
  if (digest !== sha256) throw new Error('SHA-256 firmware A2 không khớp.')
  return bytes
}
