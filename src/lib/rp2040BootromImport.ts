const romLength = 16 * 1024
const binarySha = '9c19b46f068c21f90d200c514faad4a0d5cecfc978f155b8c9d25cb6bc2efd81'
const elfSha = '3a3c4c617d83bc9b910a6fa7bfdffa11ce26ff89370271d861507be821cc49aa'

async function sha256(bytes: ArrayBuffer) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')
}

/** Accept the known B2 revision from user-owned bytes, without upload or persistence. */
export async function importRp2040Bootrom(file: Blob): Promise<ArrayBuffer> {
  if (file.size < romLength || file.size > 2 * 1024 * 1024) throw new Error('Chọn tệp boot ROM RP2040 B2 có kích thước hợp lệ.')
  const bytes = await file.arrayBuffer()
  const hash = await sha256(bytes)
  if (bytes.byteLength === romLength && hash === binarySha) return bytes
  if (hash !== elfSha) throw new Error('SHA-256 không khớp bản boot ROM RP2040 B2 được hỗ trợ.')
  const view = new DataView(bytes)
  const start = view.getUint32(28, true)
  const stride = view.getUint16(42, true)
  const count = view.getUint16(44, true)
  if (stride >= 32 && start + stride * count <= bytes.byteLength) {
    for (let index = 0; index < count; index++) {
      const entry = start + stride * index
      const offset = view.getUint32(entry + 4, true)
      if (view.getUint32(entry, true) === 1 && view.getUint32(entry + 12, true) === 0 &&
          view.getUint32(entry + 16, true) === romLength && offset + romLength <= bytes.byteLength) {
        const rom = bytes.slice(offset, offset + romLength)
        if (await sha256(rom) === binarySha) return rom
      }
    }
  }
  throw new Error('Không tìm thấy đoạn boot ROM 16 KiB hợp lệ.')
}
