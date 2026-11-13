/** Transform one pad's local KiCad footprint coordinates into board coordinates (millimetres). */
export function transformPadToBoard(footprint, pad) {
  const radians = footprint.rotation * Math.PI / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return [
    +(footprint.x + pad.x * cos - pad.y * sin).toFixed(4),
    +(footprint.y + pad.x * sin + pad.y * cos).toFixed(4),
  ]
}

export function sexprBlockEnd(text, start) {
  let depth = 0
  let quoted = false
  let escaped = false
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') quoted = false
      continue
    }
    if (char === '"') quoted = true
    else if (char === '(') depth += 1
    else if (char === ')' && --depth === 0) return index + 1
  }
  throw new Error(`KiCad S-expression không đóng ngoặc tại offset ${start}`)
}

export function parseBoardFootprints(text) {
  const footprints = []
  const pattern = /\(footprint\s+"([^"]+)"/g
  for (let match; (match = pattern.exec(text));) {
    const end = sexprBlockEnd(text, match.index)
    const block = text.slice(match.index, end)
    const reference = block.match(/\(property\s+"Reference"\s+"([^"]*)"/)?.[1]
    const placement = block.match(/\(at\s+(-?[\d.]+)\s+(-?[\d.]+)(?:\s+(-?[\d.]+))?\)/)
    if (!reference || !placement) throw new Error(`Không đọc được tọa độ footprint ${reference ?? match[1]}`)
    const pads = []
    const padPattern = /\(pad\s+"([^"]*)"/g
    for (let padMatch; (padMatch = padPattern.exec(block));) {
      const padEnd = sexprBlockEnd(block, padMatch.index)
      const padBlock = block.slice(padMatch.index, padEnd)
      const at = padBlock.match(/\(at\s+(-?[\d.]+)\s+(-?[\d.]+)(?:\s+(-?[\d.]+))?\)/)
      const net = padBlock.match(/\(net\s+\d+\s+"([^"]*)"\)/)?.[1] ?? null
      if (!at) throw new Error(`Không đọc được tọa độ pad ${reference}.${padMatch[1]}`)
      pads.push({ number: padMatch[1], x: Number(at[1]), y: Number(at[2]), net })
      padPattern.lastIndex = padEnd
    }
    footprints.push({
      reference,
      x: Number(placement[1]),
      y: Number(placement[2]),
      rotation: Number(placement[3] ?? 0),
      pads,
    })
    pattern.lastIndex = end
  }
  return footprints
}
