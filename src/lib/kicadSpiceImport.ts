import { inspectSpiceNetlist, spiceNumberValue } from '../simulation/spiceNetlist'

const MAX_XML_BYTES = 1_000_000
const MAX_XML_PARTS = 2_000
const MAX_XML_NETS = 4_000
const MAX_IPC_RECORDS = 20_000

type KicadComponent = { ref: string; value: string }
type KicadNet = { name: string; pins: Array<{ ref: string; pin: string }> }
type ParsedKicadXml = { components: KicadComponent[]; nets: KicadNet[]; noConnectPins: string[] }
export type KicadSpiceImportResult =
  | { ok: true; netlist: string; assumptions: string[]; excludedRefs: string[] }
  | { ok: false; issues: string[]; unsupportedRefs?: string[]; availableNets?: string[] }

export type KicadNetAuditResult =
  | {
      ok: true
      status: 'match' | 'mismatch'
      schematicConnectedPins: number
      comparedPins: number
      matchedPins: number
      missingBoardPins: number
      missingBoardPinSamples: string[]
      extraBoardPins: number
      extraBoardPinSamples: string[]
      pcbPadsOnSchematicNoConnect: number
      noConnectPadsSharingPcbNet: number
      netMismatchPins: number
      netMismatchPinSamples: string[]
      boardOnlyReferences: string[]
    }
  | { ok: false; issues: string[] }

export type KicadExternalTestSource = { positiveNet: string; referenceNet: string; voltage: string }

type IpcPad = { netName: string; ref: string; pin: string }

type KicadSpiceImportFailure = Extract<KicadSpiceImportResult, { ok: false }>

function fail(message: string, unsupportedRefs?: string[]): KicadSpiceImportFailure {
  return { ok: false, issues: [message], ...(unsupportedRefs?.length ? { unsupportedRefs } : {}) }
}

function failWithNets(message: string, availableNets: string[], unsupportedRefs?: string[]): KicadSpiceImportFailure {
  return { ok: false, issues: [message], availableNets, ...(unsupportedRefs?.length ? { unsupportedRefs } : {}) }
}

function decodeXml(value: string): string | undefined {
  if (/&(?!(?:#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);)/i.test(value)) return undefined
  let failed = false
  const decoded = value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, token => {
    const name = token.slice(1, -1)
    if (name === 'amp') return '&'
    if (name === 'lt') return '<'
    if (name === 'gt') return '>'
    if (name === 'quot') return '"'
    if (name === 'apos') return "'"
    const numeric = name[1]?.toLowerCase() === 'x' ? Number.parseInt(name.slice(2), 16) : Number.parseInt(name.slice(1), 10)
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 0x10ffff || (numeric >= 0xd800 && numeric <= 0xdfff)) {
      failed = true
      return ''
    }
    return String.fromCodePoint(numeric)
  })
  if (failed || /&[^\s;]+;/.test(decoded)) return undefined
  return decoded
}

function attribute(source: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(source)
  return match ? decodeXml(match[2]) : undefined
}

function childText(source: string, tag: string): string | undefined {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}\\s*>`, 'i').exec(source)
  return match ? decodeXml(match[1].replace(/<[^>]*>/g, '').trim()) : undefined
}

function blocks(source: string, tag: string): Array<{ attributes: string; body: string }> {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const expression = new RegExp(`<${escaped}\\b([^>]*)>([\\s\\S]*?)<\\/${escaped}\\s*>`, 'gi')
  return [...source.matchAll(expression)].map(match => ({ attributes: match[1], body: match[2] }))
}

function numberText(source: string, expectedKind?: 'R' | 'C' | 'L' | 'V'): string | undefined {
  const normalized = source.trim().replace(/[ΩΩ]/g, 'ohm').replace(/[µμ]/g, 'u').replace(/,/g, '.').replace(/\s+/g, '')
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)([mM][eE][gG]|[TtGgMmKkUuNnPpFf])?([a-zA-Z]*)$/.exec(normalized)
  if (!match) return undefined
  const unit = match[3].toLowerCase()
  const allowedUnits: Record<NonNullable<typeof expectedKind>, string[]> = {
    R: ['', 'ohm', 'ohms'],
    C: ['', 'f'],
    L: ['', 'h'],
    V: ['', 'v'],
  }
  if (expectedKind && !allowedUnits[expectedKind].includes(unit)) return undefined
  const prefix = match[2]?.toLowerCase() === 'meg' || match[2] === 'M' ? 'meg' : match[2]?.toLowerCase() ?? ''
  const spiceValue = `${match[1]}${prefix}`
  const value = spiceNumberValue(spiceValue)
  return value !== undefined && value > 0 ? spiceValue : undefined
}

function parseXml(source: string, allowDuplicateUnsupportedPins: boolean | 'preserve' = false, ignoreNoConnect = false): ParsedKicadXml | Extract<KicadSpiceImportResult, { ok: false }> {
  if (typeof source !== 'string' || source.length === 0 || source.length > MAX_XML_BYTES || new TextEncoder().encode(source).length > MAX_XML_BYTES) return fail('Netlist KiCad phải có dữ liệu và không vượt quá 1 MB.')
  if (/<!\s*(?:DOCTYPE|ENTITY)/i.test(source) || /\0/.test(source)) return fail('Tệp chứa khai báo XML không được hỗ trợ.')
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, '')
  if (/<!--|-->|<!\[CDATA\[|\]\]>/.test(withoutComments)) return fail('Netlist XML có comment/CDATA không hoàn chỉnh hoặc cấu trúc chưa được hỗ trợ.')
  const root = /<export\b([^>]*)>([\s\S]*?)<\/export\s*>/i.exec(withoutComments)
  if (!root) return fail('Không tìm thấy phần tử <export>; hãy xuất netlist XML từ KiCad Eeschema.')
  const componentBlocks = blocks(root[2], 'comp')
  const netBlocks = blocks(root[2], 'net')
  if (!componentBlocks.length || !netBlocks.length || componentBlocks.length > MAX_XML_PARTS || netBlocks.length > MAX_XML_NETS) return fail(`Netlist cần có linh kiện và net; giới hạn ${MAX_XML_PARTS} linh kiện, ${MAX_XML_NETS} net.`)

  const components: KicadComponent[] = []
  const refs = new Set<string>()
  for (const item of componentBlocks) {
    const ref = attribute(item.attributes, 'ref')
    const value = childText(item.body, 'value')
    if (!ref || !/^[A-Za-z][A-Za-z0-9_.+-]{0,39}$/.test(ref) || !value || value.length > 120 || refs.has(ref)) return fail('Netlist có reference/value trống, trùng hoặc không hợp lệ.')
    refs.add(ref)
    components.push({ ref, value })
  }

  const nets: KicadNet[] = []
  const connectedPins = new Set<string>()
  const noConnectPins: string[] = []
  for (const item of netBlocks) {
    const name = attribute(item.attributes, 'name')
    if (!name || name.length > 120) return fail('Net KiCad thiếu tên hoặc tên vượt giới hạn.')
    const pins: KicadNet['pins'] = []
    for (const node of item.body.matchAll(/<node\b([^>]*)\/?\s*>/gi)) {
      const ref = attribute(node[1], 'ref')
      const pin = attribute(node[1], 'pin')
      if (!ref || !refs.has(ref) || !pin || !/^\d{1,4}$/.test(pin)) return fail(`Net “${name}” chứa node không hợp lệ hoặc reference chưa khai báo.`)
      const key = `${ref}:${Number(pin)}`
      if (ignoreNoConnect && /(?:^|[+\s])no_connect(?:$|[+\s])/i.test(attribute(node[1], 'pintype') ?? '')) {
        noConnectPins.push(key)
        continue
      }
      if (connectedPins.has(key)) {
        if (allowDuplicateUnsupportedPins && !/^[RCLV]/i.test(ref)) {
          if (allowDuplicateUnsupportedPins !== 'preserve') continue
        } else return fail(`Chân ${key} xuất hiện ở nhiều net trong file KiCad.`)
      }
      connectedPins.add(key)
      pins.push({ ref, pin: String(Number(pin)) })
    }
    nets.push({ name, pins })
  }
  return { components, nets, noConnectPins }
}

function parseIpcD356(source: string): IpcPad[] | KicadSpiceImportFailure {
  if (typeof source !== 'string' || source.length === 0 || source.length > MAX_XML_BYTES || new TextEncoder().encode(source).length > MAX_XML_BYTES) return fail('IPC-D-356 phải có dữ liệu và không vượt quá 1 MB.')
  if (/\0/.test(source)) return fail('IPC-D-356 chứa byte NUL không hợp lệ.')
  const records: IpcPad[] = []
  const seen = new Map<string, string>()
  for (const line of source.split(/\r?\n/)) {
    if (!/^(?:317|327)/.test(line)) continue
    const match = /^3(?:17|27)(\S+)\s+([A-Za-z][A-Za-z0-9_.+-]{0,39})\s+(\S+)\s+/.exec(line)
    if (!match) return fail('Không đọc được một dòng pad 317/327 trong IPC-D-356; hãy xuất lại bằng KiCad PCB Editor.')
    const [, rawNet, ref, pinField] = match
    if (ref.toUpperCase() === 'VIA') continue
    const pinMatch = /^-?(\d{1,4})$/.exec(pinField)
    if (!pinMatch) return fail(`Pad ${ref} có số chân không hợp lệ trong IPC-D-356.`)
    const rawPin = pinMatch[1]
    const pinNumber = Number(rawPin)
    if (!rawNet || rawNet.length > 120 || !Number.isInteger(pinNumber) || pinNumber < 1) return fail('IPC-D-356 có tên net hoặc số chân không hợp lệ.')
    const pad: IpcPad = { netName: rawNet, ref, pin: String(pinNumber) }
    const key = `${ref}:${pinNumber}`
    const previousNet = seen.get(key)
    if (previousNet === undefined) seen.set(key, rawNet)
    if (previousNet === undefined || previousNet !== rawNet) {
      records.push(pad)
      if (records.length > MAX_IPC_RECORDS) return fail(`IPC-D-356 vượt giới hạn ${MAX_IPC_RECORDS} pad.`)
    }
  }
  if (records.length === 0) return fail('Không tìm thấy pad 317/327 trong IPC-D-356; hãy xuất netlist từ PCB đã có pad được gán net.')
  return records
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function comparableNetName(value: string): string {
  return value.trim().replace(/^\/+/, '').toUpperCase()
}

function normalizedIpcNetName(value: string): string {
  const comparable = comparableNetName(value)
  return ['0', 'GND', 'GROUND'].includes(comparable) ? comparable : value
}

/** Return the actual net labels available in an IPC-D-356 export, preserving their original spelling. */
export function getKicadIpcD356NetNames(source: string): string[] | KicadSpiceImportResult {
  const parsed = parseIpcD356(source)
  if (!Array.isArray(parsed)) return parsed
  return [...new Set(parsed.map(pad => pad.netName))].sort((a, b) => a.localeCompare(b))
}

/**
 * Compare the full connected-pin partition exported from a KiCad schematic and its PCB.
 * Net labels may differ between hierarchical schematic and PCB exports; connectivity is
 * compared by reference/pin membership. This audits CAD exports only, not a manufactured board.
 */
export function compareKicadIpcD356(boardSource: string, schematicSource: string): KicadNetAuditResult {
  const boardPads = parseIpcD356(boardSource)
  if (!Array.isArray(boardPads)) return { ok: false, issues: boardPads.issues }
  const schematic = parseXml(schematicSource, 'preserve', true)
  if ('ok' in schematic) return { ok: false, issues: schematic.issues }

  const schematicRefs = new Set(schematic.components.map(component => component.ref))
  const schematicNoConnectPins = new Set(schematic.noConnectPins)
  const schematicPins = new Map<string, string>()
  for (const net of schematic.nets) {
    for (const pin of net.pins) {
      const key = `${pin.ref}:${pin.pin}`
      const previousNet = schematicPins.get(key)
      if (previousNet !== undefined && previousNet !== net.name) return { ok: false, issues: [`Chân ${key} thuộc nhiều net schematic khác nhau (${previousNet}, ${net.name}); không thể đối chiếu an toàn.`] }
      schematicPins.set(key, net.name)
    }
  }

  const boardPins = new Map<string, string>()
  const boardNetPins = new Map<string, Set<string>>()
  const boardOnlyReferences = new Set<string>()
  for (const pad of boardPads) {
    if (!schematicRefs.has(pad.ref)) {
      boardOnlyReferences.add(pad.ref)
      continue
    }
    const key = `${pad.ref}:${pad.pin}`
    const existing = boardPins.get(key)
    if (existing !== undefined && existing !== pad.netName) {
      return { ok: false, issues: [`Pad ${key} được gán vào nhiều net PCB khác nhau (${existing}, ${pad.netName}).`] }
    }
    boardPins.set(key, pad.netName)
    const netPins = boardNetPins.get(pad.netName) ?? new Set<string>()
    netPins.add(key)
    boardNetPins.set(pad.netName, netPins)
  }

  const missingBoardPinSamples: string[] = []
  const extraBoardPinSamples: string[] = []
  const netMismatchPinSamples: string[] = []
  let missingBoardPins = 0
  let extraBoardPins = 0
  let pcbPadsOnSchematicNoConnect = 0
  let noConnectPadsSharingPcbNet = 0
  for (const key of schematicPins.keys()) {
    if (!boardPins.has(key)) {
      missingBoardPins += 1
      if (missingBoardPinSamples.length < 12) missingBoardPinSamples.push(key)
    }
  }
  for (const key of boardPins.keys()) {
    if (schematicNoConnectPins.has(key)) {
      pcbPadsOnSchematicNoConnect += 1
      const netName = boardPins.get(key)
      if (netName && (boardNetPins.get(netName)?.size ?? 0) > 1) noConnectPadsSharingPcbNet += 1
    } else if (!schematicPins.has(key)) {
      extraBoardPins += 1
      if (extraBoardPinSamples.length < 12) extraBoardPinSamples.push(key)
    }
  }

  const schematicToBoard = new Map<string, string>()
  const boardToSchematic = new Map<string, string>()
  let comparedPins = 0
  let netMismatchPins = 0
  for (const [key, schematicNet] of schematicPins) {
    const boardNet = boardPins.get(key)
    if (boardNet === undefined) continue
    comparedPins += 1
    const mappedBoardNet = schematicToBoard.get(schematicNet)
    const mappedSchematicNet = boardToSchematic.get(boardNet)
    if ((mappedBoardNet !== undefined && mappedBoardNet !== boardNet) || (mappedSchematicNet !== undefined && mappedSchematicNet !== schematicNet)) {
      netMismatchPins += 1
      if (netMismatchPinSamples.length < 12) netMismatchPinSamples.push(key)
      continue
    }
    schematicToBoard.set(schematicNet, boardNet)
    boardToSchematic.set(boardNet, schematicNet)
  }

  const status = missingBoardPins === 0 && extraBoardPins === 0 && netMismatchPins === 0 && noConnectPadsSharingPcbNet === 0 ? 'match' : 'mismatch'
  return {
    ok: true,
    status,
    schematicConnectedPins: schematicPins.size,
    comparedPins,
    matchedPins: comparedPins - netMismatchPins,
    missingBoardPins,
    missingBoardPinSamples,
    extraBoardPins,
    extraBoardPinSamples,
    pcbPadsOnSchematicNoConnect,
    noConnectPadsSharingPcbNet,
    netMismatchPins,
    netMismatchPinSamples,
    boardOnlyReferences: [...boardOnlyReferences].sort((a, b) => a.localeCompare(b)),
  }
}

/**
 * Build a partial SPICE netlist from KiCad's board IPC-D-356 pad topology and a matching
 * Eeschema XML netlist's component values. The relation between all supported pads must
 * match in both exports. This does not model copper parasitics, 3D geometry, ICs, or firmware.
 */
export function compileKicadIpcD356(
  boardSource: string,
  schematicSource: string,
  excludedRefs: readonly string[] = [],
  externalSource?: KicadExternalTestSource,
): KicadSpiceImportResult {
  const boardPads = parseIpcD356(boardSource)
  if (!Array.isArray(boardPads)) return boardPads
  const availableNets = [...new Set(boardPads.map(pad => pad.netName))].sort((a, b) => a.localeCompare(b))
  const parsedSchematic = parseXml(schematicSource, true)
  if ('ok' in parsedSchematic) return { ...parsedSchematic, availableNets }
  if (!Array.isArray(excludedRefs) || excludedRefs.length > MAX_XML_PARTS || excludedRefs.some(ref => typeof ref !== 'string')) return failWithNets('Danh sách loại trừ từ KiCad không hợp lệ.', availableNets)
  const componentByRef = new Map(parsedSchematic.components.map(component => [component.ref, component]))
  const requestedExclusions = new Set(excludedRefs)
  if ([...requestedExclusions].some(ref => !componentByRef.has(ref))) return failWithNets('Danh sách loại trừ có reference không tồn tại trong netlist schematic.', availableNets)
  const unsupportedRefs = parsedSchematic.components.filter(component => !/^[RCLV]/i.test(component.ref)).map(component => component.ref).sort()
  const notExcluded = unsupportedRefs.filter(ref => !requestedExclusions.has(ref))
  if (notExcluded.length) return { ok: false, issues: [`Cần chọn rõ các linh kiện không đưa vào mạch tương đương: ${notExcluded.join(', ')}.`], unsupportedRefs, availableNets }

  const schematicPins = new Map<string, string>()
  for (const net of parsedSchematic.nets) for (const pin of net.pins) schematicPins.set(`${pin.ref}:${pin.pin}`, net.name)
  const pcbPinMap = new Map<string, string>()
  for (const pad of boardPads) {
    if (!componentByRef.has(pad.ref) || !/^[RCLV]/i.test(pad.ref)) continue
    const key = `${pad.ref}:${pad.pin}`
    const existingNet = pcbPinMap.get(key)
    if (existingNet !== undefined && existingNet !== pad.netName) return failWithNets(`Pad ${key} thuộc nhiều net trong IPC-D-356.`, availableNets, unsupportedRefs)
    pcbPinMap.set(key, pad.netName)
  }
  const passiveRefs = parsedSchematic.components.filter(component => /^[RCLV]/i.test(component.ref)).map(component => component.ref)
  const supportedPinKeys: string[] = []
  for (const ref of passiveRefs) {
    const schematicKeys = [...schematicPins.keys()].filter(key => key.startsWith(`${ref}:`)).sort()
    const boardKeys = [...pcbPinMap.keys()].filter(key => key.startsWith(`${ref}:`)).sort()
    if (schematicKeys.length !== 2 || boardKeys.length !== 2 || schematicKeys.join('|') !== boardKeys.join('|')) {
      return failWithNets(`${ref}: số pad hoặc số chân IPC-D-356 không khớp schematic; cần đúng hai chân khớp chính xác trước khi nhập.`, availableNets, unsupportedRefs)
    }
    supportedPinKeys.push(...boardKeys)
  }
  const schematicToBoard = new Map<string, string>()
  const boardToSchematic = new Map<string, string>()
  for (const key of supportedPinKeys) {
    const schematicNet = schematicPins.get(key)
    const boardNet = pcbPinMap.get(key)
    if (!schematicNet || !boardNet) return failWithNets(`${key}: thiếu kết nối trong một trong hai nguồn CAD.`, availableNets, unsupportedRefs)
    const knownBoard = schematicToBoard.get(schematicNet)
    const knownSchematic = boardToSchematic.get(boardNet)
    if ((knownBoard !== undefined && knownBoard !== boardNet) || (knownSchematic !== undefined && knownSchematic !== schematicNet)) {
      return failWithNets(`Topology net của PCB và schematic không khớp tại ${key}; đã dừng để tránh chọn nhầm kết nối.`, availableNets, unsupportedRefs)
    }
    schematicToBoard.set(schematicNet, boardNet)
    boardToSchematic.set(boardNet, schematicNet)
  }

  const sourceComponents = parsedSchematic.components.map(component => ({ ...component }))
  const hasSource = sourceComponents.some(component => /^V/i.test(component.ref))
  const availableGrounds = availableNets.filter(net => ['0', 'GND', 'GROUND'].includes(comparableNetName(net)))
  if (!hasSource && !externalSource) return failWithNets('Schematic không có linh kiện nguồn V; khai báo một nguồn thử DC bên ngoài với net dương, net tham chiếu và điện áp rõ ràng.', availableNets, unsupportedRefs)
  if (externalSource) {
    if (hasSource) return failWithNets('Schematic đã có nguồn V; bỏ nguồn thử ngoài để không mắc song song hai nguồn.', availableNets, unsupportedRefs)
    const positiveNet = availableNets.find(net => net === externalSource.positiveNet)
    const referenceNet = availableNets.find(net => net === externalSource.referenceNet)
    const voltageText = typeof externalSource.voltage === 'string' ? numberText(externalSource.voltage, 'V') : undefined
    const voltageValue = voltageText ? spiceNumberValue(voltageText) : undefined
    if (!positiveNet || !referenceNet || positiveNet === referenceNet || !voltageText || voltageValue === undefined || voltageValue <= 0 || voltageValue > 60) {
      return failWithNets('Nguồn thử ngoài cần chọn hai net PCB khác nhau và điện áp DC dương không vượt quá 60 V.', availableNets, unsupportedRefs)
    }
    if (availableGrounds.length && !availableGrounds.includes(referenceNet)) return failWithNets('Hãy chọn net tham chiếu GND/GROUND/0 có sẵn trên PCB để tránh vô tình đổi mass thiết kế.', availableNets, unsupportedRefs)
    if (!availableGrounds.length && ['0', 'GND', 'GROUND'].includes(comparableNetName(positiveNet))) return failWithNets('Net dương của nguồn thử ngoài không thể đồng thời là điểm tham chiếu SPICE.', availableNets, unsupportedRefs)
    sourceComponents.push({ ref: 'VTEST', value: `DC ${voltageText}` })
  }

  const groupedPads = new Map<string, Array<{ ref: string; pin: string }>>()
  for (const pad of boardPads) {
    if (!componentByRef.has(pad.ref) || !/^[RCLV]/i.test(pad.ref)) continue
    const group = groupedPads.get(pad.netName) ?? []
    group.push({ ref: pad.ref, pin: pad.pin })
    groupedPads.set(pad.netName, group)
  }
  if (externalSource) {
    for (const [netName, group] of groupedPads) {
      if (netName === externalSource.positiveNet) group.push({ ref: 'VTEST', pin: '1' })
      if (netName === externalSource.referenceNet) group.push({ ref: 'VTEST', pin: '2' })
    }
  }
  const componentsXml = sourceComponents.map(component => `<comp ref="${escapeXml(component.ref)}"><value>${escapeXml(component.value)}</value></comp>`).join('')
  const netsXml = [...groupedPads].map(([name, pins]) => {
    const canonicalName = externalSource && name === externalSource.referenceNet ? 'GND' : normalizedIpcNetName(name)
    return `<net name="${escapeXml(canonicalName)}">${pins.map(pin => `<node ref="${escapeXml(pin.ref)}" pin="${escapeXml(pin.pin)}"/>`).join('')}</net>`
  }).join('')
  const syntheticXml = `<export version="E"><components>${componentsXml}</components><nets>${netsXml}</nets></export>`
  const result = compileKicadXmlNetlist(syntheticXml, excludedRefs)
  if (!result.ok) return { ...result, availableNets }
  return {
    ...result,
    assumptions: [
      'Pad/net topology lấy từ IPC-D-356 do KiCad PCB Editor xuất; giá trị linh kiện lấy từ Eeschema XML; chỉ tiếp tục nếu nhóm nối của các chân R/C/L/V khớp nhau giữa hai tệp.',
      'Việc khớp chỉ kiểm tra các pin R/C/L/V có mặt trong hai tệp; công cụ không chứng minh hai file thuộc cùng revision/source hoặc PCB đã sản xuất đúng thiết kế.',
      'IPC-D-356 chỉ cung cấp quan hệ net/pad cho kiểm tra chế tạo; không chứa hình học điện để tính điện trở đường đồng, via, parasitic, nhiệt hay dòng tải.',
      ...(externalSource ? [`Nguồn thử ngoài VTEST được người dùng khai báo ${externalSource.voltage} V giữa net ${externalSource.positiveNet} và net tham chiếu ${externalSource.referenceNet}; đây không phải nguồn được suy ra từ PCB.`] : []),
      ...result.assumptions.filter(item => !/^Netlist đầu vào xuất từ KiCad Eeschema/i.test(item)),
    ],
  }
}

/** Convert a KiCad Eeschema XML netlist into an explicitly partial, passive-only SPICE .op netlist. */
export function compileKicadXmlNetlist(source: string, excludedRefs: readonly string[] = []): KicadSpiceImportResult {
  const parsed = parseXml(source)
  if ('ok' in parsed) return parsed
  if (!Array.isArray(excludedRefs) || excludedRefs.length > MAX_XML_PARTS || excludedRefs.some(ref => typeof ref !== 'string')) return fail('Danh sách loại trừ từ KiCad không hợp lệ.')
  const requestedExclusions = new Set(excludedRefs)
  const componentByRef = new Map(parsed.components.map(component => [component.ref, component]))
  if ([...requestedExclusions].some(ref => !componentByRef.has(ref))) return fail('Danh sách loại trừ có reference không tồn tại trong netlist KiCad.')

  const supported = parsed.components.filter(component => /^[RCLV]/i.test(component.ref))
  const unsupportedRefs = parsed.components.filter(component => !/^[RCLV]/i.test(component.ref)).map(component => component.ref).sort()
  const notExcluded = unsupportedRefs.filter(ref => !requestedExclusions.has(ref))
  if (notExcluded.length) return { ok: false, issues: [`Cần chọn rõ các linh kiện không đưa vào mạch tương đương: ${notExcluded.join(', ')}.`], unsupportedRefs }

  const pinsByRef = new Map<string, Array<{ netName: string; pin: string }>>()
  for (const net of parsed.nets) for (const pin of net.pins) {
    const pins = pinsByRef.get(pin.ref) ?? []
    pins.push({ netName: net.name, pin: pin.pin })
    pinsByRef.set(pin.ref, pins)
  }

  const errors: string[] = []
  const groundNames = new Set(['0', 'GND', 'GROUND'])
  const compiled: Array<{ ref: string; kind: 'R' | 'C' | 'L' | 'V'; first: string; second: string; value: string }> = []
  for (const component of supported.sort((a, b) => a.ref.localeCompare(b.ref))) {
    const kind = component.ref[0].toUpperCase() as 'R' | 'C' | 'L' | 'V'
    const pins = (pinsByRef.get(component.ref) ?? []).sort((a, b) => Number(a.pin) - Number(b.pin))
    if (pins.length !== 2 || pins[0].pin === pins[1].pin) {
      errors.push(`${component.ref}: linh kiện ${kind} cần đúng hai chân số học được nối trong netlist.`)
      continue
    }
    let value = numberText(component.value, kind)
    if (kind === 'V') {
      const dc = /^DC\s*(.+)$/i.exec(component.value.trim())
      value = numberText(dc?.[1] ?? component.value, 'V')
      if (!value) {
        errors.push(`${component.ref}: chỉ chuyển nguồn điện áp DC số học, ví dụ 5 V; nguồn phụ thuộc hoặc nguồn AC bị chặn.`)
        continue
      }
      value = `DC ${value}`
    } else if (!value) {
      const expectedUnit = kind === 'R' ? 'Ω (hoặc tiền tố như kΩ)' : kind === 'C' ? 'F (hoặc tiền tố như µF)' : 'H (hoặc tiền tố như mH)'
      errors.push(`${component.ref}: cần trị số dương tĩnh với đơn vị ${expectedUnit}; biểu thức, biến và đơn vị sai không được chuyển tự động.`)
      continue
    }
    compiled.push({ ref: component.ref, kind, first: pins[0].netName, second: pins[1].netName, value })
  }
  if (errors.length) return { ok: false, issues: errors, unsupportedRefs }

  if (!parsed.nets.some(net => groundNames.has(net.name.trim().toUpperCase()))) return fail('Netlist cần net có tên GND, GROUND hoặc 0 để làm điểm tham chiếu; chưa tự đoán mass từ tên khác.', unsupportedRefs)
  const allUsedNets = new Set(compiled.flatMap(element => [element.first, element.second]))
  const nonGroundNets = [...allUsedNets].filter(name => !groundNames.has(name.trim().toUpperCase())).sort((a, b) => a.localeCompare(b))
  const nodeFor = (name: string) => groundNames.has(name.trim().toUpperCase()) ? '0' : `N${String(nonGroundNets.indexOf(name) + 1).padStart(3, '0')}`
  for (const element of compiled) if (nodeFor(element.first) === nodeFor(element.second)) errors.push(`${element.ref}: hai chân của phần tử cùng một net; không thể tạo SPICE netlist.`)
  if (errors.length) return { ok: false, issues: errors, unsupportedRefs }
  if (!compiled.some(element => element.kind === 'V')) return fail('Phần mạch còn lại cần ít nhất một nguồn điện áp DC được khai báo rõ.', unsupportedRefs)
  if (!compiled.some(element => ['R', 'C', 'L'].includes(element.kind))) return fail('Phần mạch còn lại cần ít nhất một điện trở, tụ điện hoặc cuộn cảm.', unsupportedRefs)

  const lines = [
    'MACH MO KiCad XML passive subset · educational SPICE · not full-board simulation',
    ...compiled.map(element => `${element.kind}${element.ref.slice(1)} ${nodeFor(element.first)} ${nodeFor(element.second)} ${element.value}`),
    '.op',
    '.end',
  ]
  const netlist = lines.join('\n')
  const inspection = inspectSpiceNetlist(netlist)
  if (inspection.errors.length) return { ok: false, issues: inspection.errors, unsupportedRefs }
  const assumptions = [
    'Netlist đầu vào xuất từ KiCad Eeschema; node ID được tạo từ tên net và GND/GROUND/0 được quy về SPICE node 0.',
    'Chỉ giữ R, C, L và nguồn V DC có hai chân cùng trị số tĩnh; linh kiện khác không được mô phỏng.',
    'Nguồn V dùng pin số nhỏ hơn làm cực dương; kiểm tra lại dấu nguồn và node trong schematic trước khi chạy.',
    'PCB copper, parasitic, vias, MCU, firmware, logic số, model vendor và linh kiện bị loại trừ không có trong mạch tương đương.',
    ...(unsupportedRefs.length ? [`Đã loại trừ theo lựa chọn: ${unsupportedRefs.filter(ref => requestedExclusions.has(ref)).join(', ')}; các chân của chúng được coi là điểm hở tại ranh giới mạch analog.`] : []),
  ]
  return { ok: true, netlist, assumptions, excludedRefs: unsupportedRefs.filter(ref => requestedExclusions.has(ref)) }
}
