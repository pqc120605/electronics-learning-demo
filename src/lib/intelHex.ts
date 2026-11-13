export type IntelHexSegment = {
  address: number
  data: number[]
}

export type IntelHexImage = {
  segments: IntelHexSegment[]
  byteLength: number
  recordCount: number
  entryAddress?: number
}

export type IntelHexLimits = {
  maxInputCharacters?: number
  maxRecords?: number
  maxBytes?: number
}

const DEFAULT_LIMITS: Required<IntelHexLimits> = {
  maxInputCharacters: 2 * 1024 * 1024,
  maxRecords: 100_000,
  maxBytes: 1024 * 1024,
}

/**
 * Validates an Intel HEX artifact and turns sparse records into address-sorted
 * contiguous segments. It does not execute or establish that the image matches
 * a particular MCU.
 */
export function inspectIntelHex(source: string, limits: IntelHexLimits = {}): IntelHexImage {
  const maxInputCharacters = limits.maxInputCharacters ?? DEFAULT_LIMITS.maxInputCharacters
  const maxRecords = limits.maxRecords ?? DEFAULT_LIMITS.maxRecords
  const maxBytes = limits.maxBytes ?? DEFAULT_LIMITS.maxBytes
  if (![maxInputCharacters, maxRecords, maxBytes].every((limit) => Number.isSafeInteger(limit) && limit > 0)) {
    throw new Error('Giới hạn Intel HEX phải là số nguyên dương an toàn.')
  }
  if (source.length > maxInputCharacters) throw new Error(`Intel HEX vượt giới hạn đầu vào ${maxInputCharacters} ký tự.`)

  const records = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!records.length) throw new Error('Intel HEX không có bản ghi.')
  if (records.length > maxRecords) throw new Error(`Intel HEX vượt giới hạn ${maxRecords} bản ghi.`)

  const memory = new Map<number, number>()
  let addressBase = 0
  let entryAddress: number | undefined
  let eofSeen = false

  for (let index = 0; index < records.length; index += 1) {
    const line = records[index]
    if (eofSeen) throw new Error(`Có bản ghi sau EOF tại dòng ${index + 1}.`)
    const match = /^:([\da-fA-F]+)$/.exec(line)
    if (!match || match[1].length % 2 !== 0) throw new Error(`Bản ghi Intel HEX không hợp lệ tại dòng ${index + 1}.`)

    const bytes = match[1].match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []
    const byteCount = bytes[0]
    if (bytes.length !== byteCount + 5) throw new Error(`Độ dài bản ghi không khớp tại dòng ${index + 1}.`)
    if ((bytes.reduce((sum, byte) => sum + byte, 0) & 0xff) !== 0) throw new Error(`Sai checksum tại dòng ${index + 1}.`)

    const address = (bytes[1] << 8) | bytes[2]
    const type = bytes[3]
    const data = bytes.slice(4, 4 + byteCount)

    if (type === 0x00) {
      const absoluteAddress = addressBase + address
      if (absoluteAddress + data.length > 0x1_0000_0000) throw new Error(`Địa chỉ dữ liệu vượt không gian 32-bit tại dòng ${index + 1}.`)
      for (let offset = 0; offset < data.length; offset += 1) {
        const byteAddress = absoluteAddress + offset
        const previous = memory.get(byteAddress)
        if (previous !== undefined && previous !== data[offset]) throw new Error(`Các bản ghi dữ liệu chồng lấn khác giá trị tại dòng ${index + 1}.`)
        if (previous === undefined) {
          memory.set(byteAddress, data[offset])
          if (memory.size > maxBytes) throw new Error(`Ảnh firmware vượt giới hạn ${maxBytes} byte.`)
        }
      }
      continue
    }

    if (type === 0x01) {
      if (byteCount !== 0 || address !== 0) throw new Error(`Bản ghi EOF không hợp lệ tại dòng ${index + 1}.`)
      eofSeen = true
      continue
    }

    if (type === 0x02 || type === 0x04) {
      if (byteCount !== 2 || address !== 0) throw new Error(`Bản ghi địa chỉ mở rộng không hợp lệ tại dòng ${index + 1}.`)
      const value = (data[0] << 8) | data[1]
      addressBase = type === 0x02 ? value * 16 : value * 0x1_0000
      continue
    }

    if (type === 0x03 || type === 0x05) {
      if (byteCount !== 4 || address !== 0) throw new Error(`Bản ghi địa chỉ bắt đầu không hợp lệ tại dòng ${index + 1}.`)
      const value = type === 0x03
        ? (((data[0] << 8) | data[1]) * 16) + ((data[2] << 8) | data[3])
        : (((data[0] * 0x1_000000) + (data[1] << 16) + (data[2] << 8) + data[3]) >>> 0)
      if (entryAddress !== undefined && entryAddress !== value) throw new Error(`Intel HEX có nhiều địa chỉ bắt đầu khác nhau (dòng ${index + 1}).`)
      entryAddress = value
      continue
    }

    throw new Error(`Loại bản ghi Intel HEX 0x${type.toString(16).padStart(2, '0')} chưa được hỗ trợ.`)
  }

  if (!eofSeen) throw new Error('Intel HEX thiếu bản ghi EOF kết thúc.')
  if (memory.size === 0) throw new Error('Intel HEX không chứa byte dữ liệu firmware.')

  const addresses = [...memory.keys()].sort((left, right) => left - right)
  const segments: IntelHexSegment[] = []
  for (const address of addresses) {
    const current = segments[segments.length - 1]
    if (current && current.address + current.data.length === address) current.data.push(memory.get(address)!)
    else segments.push({ address, data: [memory.get(address)!] })
  }

  return { segments, byteLength: memory.size, recordCount: records.length, entryAddress }
}
