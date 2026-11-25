export const ATTACHMENT_LIMITS = { count: 5, fileBytes: 10 * 1024 * 1024, totalBytes: 25 * 1024 * 1024 } as const
export type CommunityAttachment = { id: string; name: string; size: number; kind: 'image' | 'file'; path?: string }
const rasterExtensions = /\.(png|jpe?g|webp|gif)$/i
const allowedExtensions = /\.(png|jpe?g|webp|gif|pdf|txt|md|csv|json|ino|c|h|cpp|hpp|py|hex|log)$/i
export function safeDownloadName(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1f\x7f\uD800-\uDFFF]/gu, '_').trim()
  const extension = allowedExtensions.exec(cleaned)?.[0] ?? ''
  const stem = (extension ? cleaned.slice(0, -extension.length) : cleaned)
    .replace(/^[. ]+/, '').slice(0, 120 - extension.length).replace(/[\uD800-\uDBFF]$/, '').trimEnd()
  return (stem || (extension ? 'attachment' : 'attachment.bin')) + extension
}
export function validateAttachments(files: readonly Pick<File, 'name' | 'size'>[]): string | null {
  if (files.length > ATTACHMENT_LIMITS.count) return 'Tối đa 5 tệp mỗi bài.'
  let total = 0
  for (const file of files) {
    if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > ATTACHMENT_LIMITS.fileBytes) return 'Mỗi tệp cần lớn hơn 0 và tối đa 10 MiB.'
    if (!allowedExtensions.test(file.name)) return 'Định dạng chưa hỗ trợ. Chọn ảnh PNG/JPEG/WebP/GIF, PDF, văn bản hoặc mã nguồn; không nhận HTML/SVG/JS.'
    total += file.size
  }
  return total > ATTACHMENT_LIMITS.totalBytes ? 'Tổng dung lượng tối đa 25 MiB mỗi bài.' : null
}
/** Never trust File.type: require a raster signature AND actual browser decoding. */
export async function decodeRaster(blob: Blob): Promise<boolean> {
  const b = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  const signature = (b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71)
    || (b[0] === 255 && b[1] === 216 && b[2] === 255)
    || ['GIF87a', 'GIF89a'].includes(String.fromCharCode(...b.slice(0, 6)))
    || (String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP')
  if (!signature) return false
  try {
    const bitmap = await createImageBitmap(blob)
    const valid = bitmap.width > 0 && bitmap.height > 0 && bitmap.width * bitmap.height <= 40_000_000
    bitmap.close()
    return valid
  } catch { return false }
}
export async function prepareAttachment(file: File, id: string = crypto.randomUUID()): Promise<CommunityAttachment> {
  const error = validateAttachments([file])
  if (error) throw new Error(error)
  const image = rasterExtensions.test(file.name)
  if (image && !await decodeRaster(file)) throw new Error('Không giải mã được ảnh raster (PNG/JPEG/WebP/GIF, tối đa 40 megapixel).')
  return { id, name: safeDownloadName(file.name), size: file.size, kind: image ? 'image' : 'file' }
}
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }))
  const link = document.createElement('a')
  link.href = url
  link.download = safeDownloadName(name)
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
