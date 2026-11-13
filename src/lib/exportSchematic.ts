const SVG_NS = 'http://www.w3.org/2000/svg'

function finiteDimension(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 1
}

export function createStandaloneSchematicSvg(contentMarkup: string, width: number, height: number, componentCount: number) {
  const safeWidth = finiteDimension(width)
  const safeHeight = finiteDimension(height)
  const safeCount = Number.isFinite(componentCount) ? Math.max(0, Math.floor(componentCount)) : 0
  return `<svg xmlns="${SVG_NS}" xmlns:xhtml="http://www.w3.org/1999/xhtml" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}" role="img" aria-label="Sơ đồ mạch Mạch Mở"><metadata>${safeCount} linh kiện</metadata><rect width="100%" height="100%" fill="#ffffff"/><foreignObject x="0" y="0" width="${safeWidth}" height="${safeHeight}"><xhtml:div xmlns="http://www.w3.org/1999/xhtml" style="width:${safeWidth}px;height:${safeHeight}px;overflow:hidden;font-family:Arial,sans-serif">${contentMarkup}</xhtml:div></foreignObject></svg>`
}

export function createStandaloneSchematicRasterSvg(contentMarkup: string, width: number, height: number, componentCount: number) {
  const safeWidth = finiteDimension(width)
  const safeHeight = finiteDimension(height)
  const safeCount = Number.isFinite(componentCount) ? Math.max(0, Math.floor(componentCount)) : 0
  return `<svg xmlns="${SVG_NS}" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}" role="img" aria-label="Sơ đồ mạch Mạch Mở"><metadata>${safeCount} linh kiện</metadata><rect width="100%" height="100%" fill="#ffffff"/>${contentMarkup}</svg>`
}

export function safeSchematicFilename(_name: string, format: 'svg' | 'png') {
  return `mach-mo-so-do.${format}`
}

export function serializeSchematicElement(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement
  const inline = (source: Element, target: Element) => {
    const computed = source.ownerDocument.defaultView?.getComputedStyle(source)
    if (computed) {
      const styles: string[] = []
      for (let index = 0; index < computed.length; index += 1) {
        const property = computed.item(index)
        if (property.startsWith('--')) continue
        const value = property === 'font-family' ? 'Arial, sans-serif' : computed.getPropertyValue(property).trim()
        if (value && !/var\s*\(\s*--/i.test(value)) styles.push(`${property}:${value}`)
      }
      target.setAttribute('style', styles.join(';'))
    }
    const sourceChildren = [...source.children]
    const targetChildren = [...target.children]
    sourceChildren.forEach((child, index) => inline(child, targetChildren[index]))
  }
  inline(element, clone)
  clone.style.fontFamily = 'Arial, sans-serif'
  return clone.outerHTML
}

export function createSchematicSvg(element: HTMLElement, componentCount: number) {
  const width = finiteDimension(element.clientWidth || element.getBoundingClientRect().width)
  const height = finiteDimension(element.clientHeight || element.getBoundingClientRect().height)
  return createStandaloneSchematicSvg(serializeSchematicElement(element), width, height, componentCount)
}

function createRasterMarkup(element: HTMLElement) {
  const rootRect = element.getBoundingClientRect()
  const width = finiteDimension(element.clientWidth || rootRect.width)
  const height = finiteDimension(element.clientHeight || rootRect.height)
  const xFor = (node: Element) => ((node.getBoundingClientRect().left - rootRect.left) / Math.max(1, rootRect.width)) * width
  const yFor = (node: Element) => ((node.getBoundingClientRect().top - rootRect.top) / Math.max(1, rootRect.height)) * height
  const sizeFor = (node: Element) => {
    const rect = node.getBoundingClientRect()
    return { width: (rect.width / Math.max(1, rootRect.width)) * width, height: (rect.height / Math.max(1, rootRect.height)) * height }
  }
  const inlineSvgStyles = (source: Element, target: Element) => {
    const computed = source.ownerDocument.defaultView?.getComputedStyle(source)
    if (computed) {
      const styles: string[] = []
      for (let index = 0; index < computed.length; index += 1) {
        const property = computed.item(index)
        if (property.startsWith('--')) continue
        const value = property === 'font-family' ? 'Arial, sans-serif' : computed.getPropertyValue(property).trim()
        if (value && !/var\s*\(\s*--/i.test(value)) styles.push(`${property}:${value}`)
      }
      target.setAttribute('style', styles.join(';'))
    }
    const sourceChildren = [...source.children]
    const targetChildren = [...target.children]
    sourceChildren.forEach((child, index) => inlineSvgStyles(child, targetChildren[index]))
  }
  const render = (node: Element): string => {
    const bounds = node.getBoundingClientRect()
    const x = xFor(node)
    const y = yFor(node)
    const size = sizeFor(node)
    if (node.namespaceURI === SVG_NS) {
      const clone = node.cloneNode(true) as Element
      inlineSvgStyles(node, clone)
      clone.setAttribute('x', String(x))
      clone.setAttribute('y', String(y))
      clone.setAttribute('width', String(size.width))
      clone.setAttribute('height', String(size.height))
      return clone.outerHTML
    }
    const style = node.ownerDocument.defaultView?.getComputedStyle(node)
    if (!style || style.display === 'none' || style.visibility === 'hidden' || bounds.width === 0 || bounds.height === 0) return ''
    const background = style.backgroundColor
    const borderWidth = Number.parseFloat(style.borderTopWidth) || 0
    const border = style.borderTopColor
    const radius = Number.parseFloat(style.borderTopLeftRadius) || 0
    const hasBackground = background !== 'transparent' && !/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(background)
    const shapes = hasBackground || borderWidth > 0
      ? `<rect x="${x}" y="${y}" width="${size.width}" height="${size.height}" rx="${radius}" fill="${hasBackground ? background : 'none'}" stroke="${borderWidth > 0 ? border : 'none'}" stroke-width="${borderWidth}"/>`
      : ''
    const directText = [...node.childNodes].filter(child => child.nodeType === 3).map(child => child.textContent ?? '').join('').trim()
    const text = directText
      ? `<text x="${x + size.width / 2}" y="${y + size.height / 2}" dominant-baseline="middle" text-anchor="${style.textAlign === 'left' ? 'start' : style.textAlign === 'right' ? 'end' : 'middle'}" fill="${style.color}" font-family="Arial, sans-serif" font-size="${Number.parseFloat(style.fontSize) || 10}" font-weight="${style.fontWeight}">${escapeXml(directText)}</text>`
      : ''
    return shapes + text + [...node.children].map(render).join('')
  }
  return [...element.children].map(render).join('')
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character)
}

export function createSchematicRasterSvg(element: HTMLElement, componentCount: number) {
  const bounds = element.getBoundingClientRect()
  const width = finiteDimension(element.clientWidth || bounds.width)
  const height = finiteDimension(element.clientHeight || bounds.height)
  return createStandaloneSchematicRasterSvg(createRasterMarkup(element), width, height, componentCount)
}

export function downloadSchematic(element: HTMLElement, componentCount: number, format: 'svg' | 'png') {
  const svg = format === 'svg' ? createSchematicSvg(element, componentCount) : createSchematicRasterSvg(element, componentCount)
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  if (format === 'svg') {
    downloadBlob(svgBlob, safeSchematicFilename('mach-mo-so-do', 'svg'))
    return Promise.resolve()
  }
  return new Promise<void>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(svgBlob)
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = finiteDimension(element.clientWidth || element.getBoundingClientRect().width) * 2
      canvas.height = finiteDimension(element.clientHeight || element.getBoundingClientRect().height) * 2
      const context = canvas.getContext('2d')
      if (!context) { URL.revokeObjectURL(url); reject(new Error('Canvas không khả dụng')); return }
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Không tạo được ảnh PNG')); return }
        downloadBlob(blob, safeSchematicFilename('mach-mo-so-do', 'png'))
        resolve()
      }, 'image/png')
    }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không thể đọc SVG để tạo PNG')) }
    image.src = url
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
