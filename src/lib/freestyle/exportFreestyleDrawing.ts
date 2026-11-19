import { downloadBlob } from '../communityAttachments'

// Preserve the geometry from viewBox and inline only the SVG presentation attributes.
const properties = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
  'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'visibility']

async function embedImages(svg: SVGSVGElement) {
  for (const image of svg.querySelectorAll('image')) {
    const href = image.getAttribute('href')
    if (!href) continue
    const url = new URL(href, document.baseURI)
    if (url.origin !== location.origin) throw new Error('Hình board phải có trong bản web hiện tại.')
    const response = await fetch(url)
    const blob = await response.blob()
    if (!response.ok || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(blob.type) || blob.size > 5 * 1024 * 1024) {
      throw new Error('Không đọc được hình board để chèn vào ảnh.')
    }
    image.setAttribute('href', await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Không chèn được hình board.'))
      reader.readAsDataURL(blob)
    }))
  }
}

export async function exportFreestyleDrawing(source: SVGSVGElement, kind: 'breadboard' | 'schematic', format: 'svg' | 'png') {
  const { width, height } = source.viewBox.baseVal
  if (!(width > 0 && height > 0)) throw new Error('Mạch chưa có khung hình để xuất.')
  const svg = source.cloneNode(true) as SVGSVGElement
  const nodes = [source, ...source.querySelectorAll('*')]
  const targets = [svg, ...svg.querySelectorAll('*')]
  const displayProperties = ['display', ...properties]
  nodes.forEach((node, index) => {
    const target = targets[index]
    const style = getComputedStyle(node)
    const original = target.getAttribute('style') ?? ''
    const inline = displayProperties.map(property => {
      // Browsers serialize local paint servers as absolute URLs in computed styles.
      const value = style.getPropertyValue(property).replace(/url\(["']?[^)]*#([^"')]+)["']?\)/g, 'url(#$1)')
      return `${property}:${value}`
    })
    target.setAttribute('style', [original, ...inline, 'font-family:Arial,sans-serif'].filter(Boolean).join(';'))
    for (const attribute of target.getAttributeNames()) if (attribute.startsWith('on') || attribute === 'tabindex') target.removeAttribute(attribute)
  })
  svg.removeAttribute('class')
  svg.style.width = ''
  svg.style.height = ''
  svg.style.minWidth = ''
  svg.style.maxHeight = ''
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  await embedImages(svg)
  const vector = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
  const filename = `mach-mo-${kind}.${format}`
  if (format === 'svg') { downloadBlob(vector, filename); return }

  const url = URL.createObjectURL(vector)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(2, 4096 / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width * scale)
    canvas.height = Math.ceil(height * scale)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas không khả dụng để xuất PNG.')
    context.fillStyle = '#faf7ef'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const raster = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!raster) throw new Error('Không tạo được ảnh PNG.')
    downloadBlob(raster, filename)
  } finally { URL.revokeObjectURL(url) }
}
