import { getComponentDefinition } from '../data/componentRegistry'
import { boards } from '../data/boards'
import { simulationTargets } from '../data/simulationTargets'
import { getCircuitPartDisplayLabel } from './componentDisplayLabel'
import { createNetIndex, endpointKey } from './circuitNets'
import { inspectSpiceNetlist, spiceNumberValue } from '../simulation/spiceNetlist'
import type { CircuitConnection, CircuitEndpoint, CircuitPart } from '../types/circuitTopology'

type WorkspaceSpicePart = Pick<CircuitPart, 'id' | 'type' | 'value'>
export type WorkspaceSpiceInput = {
  parts: readonly WorkspaceSpicePart[]
  connections: readonly CircuitConnection[]
  boardLogicLevel: string
  boardId?: string
  boardPinLabels?: Record<string, string>
}

export type WorkspaceSpiceResult =
  | { ok: true; netlist: string; assumptions: string[]; ignoredUnwiredParts: string[] }
  | { ok: false; issues: string[] }

export type WorkspaceSpiceAnalysis =
  | { kind: 'op' }
  | { kind: 'tran'; step: string; stop: string }
  | { kind: 'dc'; source: string; start: string; stop: string; step: string }

export type WorkspaceSpiceAnalysisResult = { ok: true; netlist: string } | { ok: false; issues: string[] }

export type WorkspaceSpiceHandoff = {
  schemaVersion: 1
  title: string
  netlist: string
  assumptions: string[]
  ignoredUnwiredParts: string[]
  returnTo: string
  createdAt: number
  workspaceFingerprint?: string
}

export type WorkspaceSpiceObservation = {
  schemaVersion: 1
  handoffId: string
  workspaceFingerprint: string
  createdAt: number
  analysis: string
  dataType: 'real' | 'complex'
  numPoints: number
  displayedPoints: number
  series: Array<{ name: string; type: string; values: number[] }>
  warnings: string[]
}

const MAX_PARTS = 500
const MAX_WIRES = 1000
const groundPins = new Set(['negative', 'gnd'])

type Quantity = 'resistance' | 'capacitance' | 'voltage'

function normalizeValue(source: string, quantity: Quantity): string | undefined {
  let compact = source.trim().replace(/[ΩΩ]/g, 'ohm').replace(/[µμ]/g, 'u').replace(/,/g, '.').replace(/\s+/g, '')
  if (quantity === 'resistance') compact = compact.replace(/ohms?$/i, '')
  if (quantity === 'capacitance') {
    compact = compact.replace(/farads?$/i, '')
    if (/[tgmunkp]?f$/i.test(compact) && (compact.endsWith('F') || /[tgmunkp]f$/i.test(compact))) compact = compact.slice(0, -1)
  }
  if (quantity === 'voltage') compact = compact.replace(/volts?$/i, '').replace(/v$/i, '')
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(meg|[tgkmunpf])?$/i.exec(compact)
  if (!match) return undefined
  const spice = `${match[1]}${match[2] ?? ''}`
  const parsed = spiceNumberValue(spice)
  return parsed !== undefined && parsed > 0 ? spice : undefined
}

function defaultValue(part: WorkspaceSpicePart): string | undefined {
  const quantity: Quantity = part.type === 'battery' ? 'voltage' : part.type === 'capacitor' ? 'capacitance' : 'resistance'
  if (part.value) return normalizeValue(part.value, quantity)
  const definition = getComponentDefinition(part.type)
  const label = definition?.label ?? ''
  const match = /([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)\s*(?:meg|[tgkmunpf])?\s*(?:Ω|ohms?|[µμ]?F|V)?)/i.exec(label)
  if (match) return normalizeValue(match[1], quantity)
  if (part.type === 'battery') return '5'
  return undefined
}

function isEndpoint(value: unknown): value is CircuitEndpoint {
  if (!value || typeof value !== 'object') return false
  const endpoint = value as Partial<CircuitEndpoint>
  return typeof endpoint.partId === 'string' && typeof endpoint.pinId === 'string'
}

function pinFor(part: WorkspaceSpicePart, pinId: string) {
  return getComponentDefinition(part.type)?.pins.find(pin => pin.id === pinId)
}

function sourceVolts(source: string): string | undefined {
  const normalized = normalizeValue(source, 'voltage')
  if (!normalized) return undefined
  const value = spiceNumberValue(normalized)
  return value !== undefined && value <= 100 ? normalized : undefined
}

function normalizeSweepValue(source: string, allowZero: boolean): string | undefined {
  const compact = source.trim().replace(/,/g, '.').replace(/\s+/g, '').replace(/(?:seconds?|secs?|s)$/i, '')
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(meg|[tgkmunpf])?(?:v)?$/i.exec(compact)
  if (!match) return undefined
  const value = spiceNumberValue(`${match[1]}${match[2] ?? ''}`)
  return value !== undefined && (allowZero ? value >= 0 : value > 0) ? `${match[1]}${match[2] ?? ''}` : undefined
}

/** Compile only explicit workspace wiring and a small educational subset of real circuit elements. */
export function compileWorkspaceSpice(input: WorkspaceSpiceInput): WorkspaceSpiceResult {
  const issues: string[] = []
  if (!input || !Array.isArray(input.parts) || !Array.isArray(input.connections) || typeof input.boardLogicLevel !== 'string') {
    return { ok: false, issues: ['Workspace không có dạng dữ liệu mạch hợp lệ.'] }
  }
  if (input.parts.length > MAX_PARTS || input.connections.length > MAX_WIRES) {
    return { ok: false, issues: [`Giới hạn workspace SPICE là ${MAX_PARTS} linh kiện và ${MAX_WIRES} dây.`] }
  }

  const partsById = new Map<string, WorkspaceSpicePart>()
  for (const part of input.parts) {
    if (!part || typeof part.id !== 'string' || !part.id.trim() || typeof part.type !== 'string' || partsById.has(part.id)) {
      issues.push('Danh sách linh kiện có mã trống, sai dạng hoặc trùng mã.')
      continue
    }
    if (!getComponentDefinition(part.type)) issues.push(`Không nhận diện được linh kiện “${part.type}”.`)
    partsById.set(part.id, part)
  }

  const connectedPartIds = new Set<string>()
  const validWires: CircuitConnection[] = []
  for (const connection of input.connections) {
    if (!connection || typeof connection.id !== 'string' || !isEndpoint(connection.from) || !isEndpoint(connection.to)) {
      issues.push('Có dây thiếu mã hoặc đầu nối không hợp lệ.')
      continue
    }
    const fromPart = partsById.get(connection.from.partId)
    const toPart = partsById.get(connection.to.partId)
    if (!fromPart || !toPart || !pinFor(fromPart, connection.from.pinId) || !pinFor(toPart, connection.to.pinId)) {
      issues.push(`Dây “${connection.id}” trỏ tới linh kiện hoặc chân không tồn tại.`)
      continue
    }
    validWires.push(connection)
    connectedPartIds.add(fromPart.id)
    connectedPartIds.add(toPart.id)
  }
  if (issues.length) return { ok: false, issues: [...new Set(issues)] }

  const target = simulationTargets.find(item => item.boardId === input.boardId)
  const label = (part: WorkspaceSpicePart) => {
    if (part.type === 'board') return boards.find(board => board.id === input.boardId)?.name ?? 'Board vi điều khiển'
    const base = getCircuitPartDisplayLabel(part, getComponentDefinition(part.type)?.label ?? 'Linh kiện')
    const peers = input.parts.filter(item => item.type === part.type)
    return peers.length > 1 ? `${base} · số ${peers.findIndex(item => item.id === part.id) + 1}` : base
  }
  const pinLabel = (part: WorkspaceSpicePart, pinId: string) => part.type === 'board'
    ? input.boardPinLabels?.[pinId] ?? (pinId === 'ledOut' ? target?.pinLabel : undefined) ?? pinFor(part, pinId)?.label ?? 'Chân không xác định'
    : pinFor(part, pinId)?.label ?? 'Chân không xác định'

  const netIndex = createNetIndex(validWires)
  const partByEndpoint = (key: string) => {
    const splitAt = key.lastIndexOf(':')
    return { partId: key.slice(0, splitAt), pinId: key.slice(splitAt + 1) }
  }
  const netKeyFor = (endpoint: CircuitEndpoint) => {
    const wireNet = netIndex.netOf(endpointKey(endpoint))
    return wireNet ? [...wireNet.endpoints].sort()[0] : undefined
  }
  const wiredPins = new Map<string, Set<string>>()
  for (const wire of validWires) for (const endpoint of [wire.from, wire.to]) {
    const pins = wiredPins.get(endpoint.partId) ?? new Set<string>()
    pins.add(endpoint.pinId)
    wiredPins.set(endpoint.partId, pins)
  }

  const ignoredUnwiredParts: string[] = []
  const assumptions: string[] = [
    'Kết nối chỉ lấy từ dây đã nối trong workspace; khoảng cách 3D và đường đồng PCB không được coi là kết nối điện.',
    'SPICE chỉ giải mạch tương đương analog được tạo; không thực thi firmware MCU, GPIO, giao thức số hoặc mạch nguồn trên board.',
    'Breadboard chỉ có các đầu nối nhóm đã khai báo; dây gặp cùng pin nhóm được nối chung, không suy luận continuity giữa lỗ hoặc các nhóm khác nhau.',
    'Chân GND board và cực âm nguồn DC được quy về node tham chiếu SPICE 0.',
  ]
  const elements: Array<{ id: string; type: string; from: string; to: string; value?: string }> = []

  for (const part of input.parts.filter(item => item.type === 'breadboard').sort((a, b) => a.id.localeCompare(b.id))) {
    for (const pinId of [...(wiredPins.get(part.id) ?? [])].sort()) {
      assumptions.push(`${label(part)} · ${pinLabel(part, pinId)}: dây đã nối gặp cùng một đầu nối nhóm; không suy luận thông mạch qua lỗ hoặc sang nhóm khác.`)
    }
  }

  for (const part of [...input.parts].sort((a, b) => a.id.localeCompare(b.id))) {
    const pinIds = wiredPins.get(part.id)
    if (!pinIds?.size) {
      ignoredUnwiredParts.push(part.id)
      continue
    }
    const connectedPins = [...pinIds]
    if (part.type === 'breadboard') continue
    if (part.type === 'board') {
      const signalPins = connectedPins.filter(pinId => pinId !== 'vcc' && pinId !== 'gnd')
      if (signalPins.length) issues.push(`${label(part)} có chân ${signalPins.map(pinId => pinLabel(part, pinId)).join(', ')} đang nối dây. SPICE không chạy GPIO/firmware; hãy tách tín hiệu MCU khỏi mạch tương đương.`)
      if (pinIds.has('vcc') !== pinIds.has('gnd')) issues.push(`${label(part)}: để dùng nguồn lý tưởng phải nối cả VCC và GND.`)
      if (pinIds.has('vcc') && pinIds.has('gnd')) {
        const volts = sourceVolts(input.boardLogicLevel)
        if (!volts) issues.push(`Không đọc được mức nguồn board “${input.boardLogicLevel}”; chọn board có mức điện áp DC rõ ràng.`)
        else {
          elements.push({ id: part.id, type: 'V', from: `${part.id}:vcc`, to: `${part.id}:gnd`, value: `DC ${volts}` })
          assumptions.push(`${label(part)} được rút gọn thành nguồn lý tưởng ${volts} V theo mức logic profile; không mô phỏng bộ ổn áp, USB, bảo vệ hoặc giới hạn dòng.`)
        }
      }
      continue
    }

    const terminalPairs: Record<string, [string, string]> = {
      resistor: ['a', 'b'], capacitor: ['plus', 'minus'], led: ['anode', 'cathode'], diode: ['anode', 'cathode'], ldr: ['a', 'b'], battery: ['positive', 'negative'],
    }
    const terminals = terminalPairs[part.type]
    if (!terminals) {
      issues.push(`${label(part)} đã nối dây nhưng chưa có model điện SPICE được khai báo.`)
      continue
    }
    const missing = terminals.filter(pinId => !pinIds.has(pinId))
    if (missing.length) {
      issues.push(`${label(part)} còn chân ${missing.map(pinId => pinLabel(part, pinId)).join(', ')} chưa được nối dây.`)
      continue
    }
    const value = defaultValue(part)
    if (part.type === 'battery' && !value) {
      issues.push(`${label(part)} cần điện áp DC dương hợp lệ, ví dụ 5 V.`)
      continue
    }
    if ((part.type === 'resistor' || part.type === 'capacitor' || part.type === 'ldr') && !value) {
      issues.push(`${label(part)} cần trị số dương rõ ràng trước khi chuyển sang SPICE.`)
      continue
    }
    elements.push({
      id: part.id,
      type: part.type === 'battery' ? 'V' : part.type === 'resistor' ? 'R' : part.type === 'capacitor' ? 'C' : part.type === 'ldr' ? 'R' : 'D',
      from: `${part.id}:${terminals[0]}`,
      to: `${part.id}:${terminals[1]}`,
      value: part.type === 'battery' ? `DC ${value}` : value,
    })
    if (!part.value && value) assumptions.push(`${label(part)}: dùng trị số mặc định từ tên linh kiện (${value}); sửa trị số theo đúng linh kiện thật trước khi dùng kết quả.`)
    if (part.type === 'led' || part.type === 'diode') assumptions.push(`${label(part)}: dùng model diode giáo dục D(IS=1e-14 N=2), không phải model datasheet.`)
    if (part.type === 'ldr') assumptions.push(`${label(part)}: LDR được xấp xỉ bằng điện trở cố định ${value}; ánh sáng/nhiệt độ không thay đổi trong phép mô phỏng.`)
  }

  if (!elements.some(element => element.type === 'V')) issues.push('Mạch cần ít nhất một nguồn DC có model rõ ràng.')
  if (!elements.some(element => ['R', 'C', 'D'].includes(element.type))) issues.push('Mạch cần ít nhất một tải/linh kiện thụ động được hỗ trợ.')
  if (issues.length) return { ok: false, issues: [...new Set(issues)] }

  const groundNetKeys = new Set<string>()
  for (const wire of validWires) for (const endpoint of [wire.from, wire.to]) {
    const part = partsById.get(endpoint.partId)
    const pin = part && pinFor(part, endpoint.pinId)
    if (part && ((part.type === 'board' && endpoint.pinId === 'gnd') || (part.type === 'battery' && endpoint.pinId === 'negative'))) {
      const netKey = netKeyFor(endpoint)
      if (netKey) groundNetKeys.add(netKey)
      else if (pin && groundPins.has(pin.id)) groundNetKeys.add(endpointKey(endpoint))
    }
  }
  if (!groundNetKeys.size) issues.push('Cần nối ít nhất một cực âm của nguồn hoặc chân GND board làm điểm tham chiếu SPICE (node 0).')
  if (issues.length) return { ok: false, issues: [...new Set(issues)] }

  const connectedNetKeys = new Set<string>()
  for (const element of elements) {
    for (const key of [element.from, element.to]) {
      const endpoint = partByEndpoint(key)
      const netKey = netKeyFor(endpoint)
      if (!netKey) issues.push(`${element.id}: đầu cực ${key} không có dây nối.`)
      else connectedNetKeys.add(netKey)
    }
  }
  const orderedNetKeys = [...connectedNetKeys].sort()
  const nodeFor = (key: string) => {
    const endpoint = partByEndpoint(key)
    const netKey = netKeyFor(endpoint)
    return netKey && groundNetKeys.has(netKey) ? '0' : `N${String(orderedNetKeys.indexOf(netKey ?? '') + 1).padStart(3, '0')}`
  }
  const lines = ['MACH MO workspace equivalent · educational SPICE subset']
  const sortedElements = elements.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id))
  const counters: Record<string, number> = {}
  for (const element of sortedElements) {
    const from = nodeFor(element.from), to = nodeFor(element.to)
    if (from === to) {
      issues.push(`${label(partsById.get(element.id)!)}: hai chân của phần tử đang cùng một net; mạch bị nối tắt trong topology.`)
      continue
    }
    const name = `${element.type}${counters[element.type] = (counters[element.type] ?? 0) + 1}`
    if (element.type === 'D') {
      const model = name === 'D1' ? 'DLED' : `DGEN${counters.D}`
      lines.push(`${name} ${from} ${to} ${model}`)
      lines.push(`.model ${model} D(IS=1e-14 N=2)`)
    } else lines.push(`${name} ${from} ${to} ${element.value}`)
  }
  if (issues.length) return { ok: false, issues: [...new Set(issues)] }
  lines.push('.op', '.end')
  const netlist = lines.join('\n')
  const inspection = inspectSpiceNetlist(netlist)
  if (inspection.errors.length) return { ok: false, issues: inspection.errors }
  return { ok: true, netlist, assumptions: [...new Set(assumptions)], ignoredUnwiredParts: ignoredUnwiredParts.sort() }
}

/** Replace the workspace equivalent's single analysis directive without changing its handoff schema. */
export function setWorkspaceSpiceAnalysis(source: string, analysis: WorkspaceSpiceAnalysis): WorkspaceSpiceAnalysisResult {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const directives = lines.map((line, index) => ({ line: line.trim(), index })).filter(item => /^\.(?:op|tran|dc|ac)\b/i.test(item.line))
  if (directives.length !== 1 || directives[0].line.toLowerCase() !== '.op') {
    return { ok: false, issues: ['Chỉ có thể đổi phép phân tích của netlist workspace còn ở trạng thái .op.'] }
  }

  let directive: string
  if (analysis.kind === 'op') directive = '.op'
  else if (analysis.kind === 'tran') {
    const step = normalizeSweepValue(analysis.step, false)
    const stop = normalizeSweepValue(analysis.stop, false)
    if (!step || !stop) return { ok: false, issues: ['Phân tích .tran cần bước thời gian và thời điểm dừng dương, ví dụ 1 ms và 100 ms.'] }
    directive = `.tran ${step} ${stop}`
  } else {
    const sourceName = analysis.source.trim()
    const start = normalizeSweepValue(analysis.start, true)
    const stop = normalizeSweepValue(analysis.stop, true)
    const step = normalizeSweepValue(analysis.step, false)
    const voltageSources = lines.map(line => /^\s*(V[A-Za-z0-9_.-]+)\s+/i.exec(line)?.[1].toUpperCase()).filter(Boolean)
    if (!/^V[A-Za-z0-9_.-]{0,39}$/i.test(sourceName) || !voltageSources.includes(sourceName.toUpperCase())) {
      return { ok: false, issues: ['Phân tích .dc chỉ quét được nguồn áp độc lập có trong netlist workspace.'] }
    }
    if (!start || !stop || !step || (spiceNumberValue(stop) ?? 0) <= (spiceNumberValue(start) ?? 0)) {
      return { ok: false, issues: ['Phân tích .dc cần khoảng tăng dương với thời điểm cuối lớn hơn đầu.'] }
    }
    directive = `.dc ${sourceName} ${start} ${stop} ${step}`
  }

  lines[directives[0].index] = directive
  const netlist = lines.join('\n')
  const inspection = inspectSpiceNetlist(netlist)
  if (inspection.errors.length) return { ok: false, issues: inspection.errors }
  return { ok: true, netlist }
}

const handoffKey = (id: string) => `machmo-workspace-spice-${id}`
const observationKey = (id: string) => `machmo-workspace-spice-result-${id}`
const HANDOFF_TTL_MS = 30 * 60 * 1000
const MAX_OBSERVATION_BYTES = 1024 * 1024
const MAX_OBSERVATION_SERIES = 64
const safeReturnTo = (path: string) => /^\/(?:build|app\/lab)(?:\?[^#]{0,200})?$/.test(path) && !path.startsWith('//')

/** Store only a validated netlist in tab-scoped storage; URL contains an opaque short-lived id. */
export function storeWorkspaceSpiceHandoff(
  storage: Pick<Storage, 'setItem'>,
  result: WorkspaceSpiceResult,
  title: string,
  now = Date.now(),
  id = globalThis.crypto?.randomUUID?.() ?? `ws-${now}-${Math.random().toString(36).slice(2, 10)}`,
  returnTo = '/build',
  workspaceFingerprint?: string,
): string | undefined {
  if (!result.ok || !/^[A-Za-z0-9-]{1,80}$/.test(id) || !safeReturnTo(returnTo)) return undefined
  if (title.trim().length < 1 || title.length > 120 || result.assumptions.length > 100 || result.ignoredUnwiredParts.length > MAX_PARTS || (workspaceFingerprint !== undefined && !/^[A-Za-z0-9_-]{1,80}$/.test(workspaceFingerprint))) return undefined
  if (inspectSpiceNetlist(result.netlist).errors.length || !Number.isFinite(now)) return undefined
  const handoff: WorkspaceSpiceHandoff = {
    schemaVersion: 1,
    title: title.trim(),
    netlist: result.netlist,
    assumptions: result.assumptions.map(value => value.slice(0, 500)),
    ignoredUnwiredParts: result.ignoredUnwiredParts.map(value => value.slice(0, 100)),
    returnTo,
    createdAt: now,
    workspaceFingerprint,
  }
  const serialized = JSON.stringify(handoff)
  if (serialized.length > 24_000) return undefined
  try { storage.setItem(handoffKey(id), serialized); return id } catch { return undefined }
}

export function readWorkspaceSpiceHandoff(storage: Pick<Storage, 'getItem'>, id: string | null, now = Date.now()): WorkspaceSpiceHandoff | undefined {
  if (!id || !/^[A-Za-z0-9-]{1,80}$/.test(id) || !Number.isFinite(now)) return undefined
  try {
    const raw = storage.getItem(handoffKey(id))
    if (!raw || raw.length > 24_000) return undefined
    const candidate = JSON.parse(raw) as Partial<WorkspaceSpiceHandoff>
    if (candidate.schemaVersion !== 1 || typeof candidate.title !== 'string' || candidate.title.length > 120 ||
      typeof candidate.netlist !== 'string' || candidate.netlist.length > 16_000 ||
      !Array.isArray(candidate.assumptions) || candidate.assumptions.length > 100 || candidate.assumptions.some(item => typeof item !== 'string' || item.length > 500) ||
      !Array.isArray(candidate.ignoredUnwiredParts) || candidate.ignoredUnwiredParts.length > MAX_PARTS || candidate.ignoredUnwiredParts.some(item => typeof item !== 'string' || item.length > 100) ||
      typeof candidate.returnTo !== 'string' || !safeReturnTo(candidate.returnTo) ||
      (candidate.workspaceFingerprint !== undefined && (typeof candidate.workspaceFingerprint !== 'string' || !/^[\w-]{1,80}$/.test(candidate.workspaceFingerprint))) ||
      typeof candidate.createdAt !== 'number' || !Number.isFinite(candidate.createdAt) || candidate.createdAt > now + 5 * 60_000 || now - candidate.createdAt > HANDOFF_TTL_MS ||
      inspectSpiceNetlist(candidate.netlist).errors.length) return undefined
    return candidate as WorkspaceSpiceHandoff
  } catch { return undefined }
}

export function clearWorkspaceSpiceHandoff(storage: Pick<Storage, 'removeItem'>, id: string | null): void {
  if (!id || !/^[A-Za-z0-9-]{1,80}$/.test(id)) return
  try { storage.removeItem(handoffKey(id)) } catch { /* Storage may be disabled; the tab will discard it on close. */ }
}

/** Save bounded solver data for a same-tab return; if this fails, the SPICE page remains the source of truth. */
export function storeWorkspaceSpiceObservation(
  storage: Pick<Storage, 'setItem'>,
  input: Omit<WorkspaceSpiceObservation, 'schemaVersion'>,
): boolean {
  if (!/^[A-Za-z0-9-]{1,80}$/.test(input.handoffId) || !/^[\w-]{1,80}$/.test(input.workspaceFingerprint) ||
    !Number.isFinite(input.createdAt) || input.numPoints < 1 || input.numPoints > 20_000 ||
    input.displayedPoints < 1 || input.displayedPoints > 2_000 || !Array.isArray(input.series) ||
    !input.series.length || input.series.length > MAX_OBSERVATION_SERIES || input.warnings.length > 5 ||
    input.series.some(series => !series || typeof series.name !== 'string' || series.name.length > 120 || typeof series.type !== 'string' || series.type.length > 40 ||
      !Array.isArray(series.values) || series.values.length > 2_000 || series.values.some(value => typeof value !== 'number' || !Number.isFinite(value))) ||
    input.warnings.some(warning => typeof warning !== 'string' || warning.length > 500)) return false
  const observation: WorkspaceSpiceObservation = { schemaVersion: 1, ...input }
  try {
    const serialized = JSON.stringify(observation)
    if (new TextEncoder().encode(serialized).byteLength > MAX_OBSERVATION_BYTES) return false
    storage.setItem(observationKey(input.handoffId), serialized)
    return true
  } catch { return false }
}

export function readWorkspaceSpiceObservation(
  storage: Pick<Storage, 'getItem'>,
  handoffId: string | null,
  expectedFingerprint: string,
  now = Date.now(),
): WorkspaceSpiceObservation | undefined {
  if (!handoffId || !/^[A-Za-z0-9-]{1,80}$/.test(handoffId) || !/^[\w-]{1,80}$/.test(expectedFingerprint) || !Number.isFinite(now)) return undefined
  try {
    const raw = storage.getItem(observationKey(handoffId))
    if (!raw || new TextEncoder().encode(raw).byteLength > MAX_OBSERVATION_BYTES) return undefined
    const candidate = JSON.parse(raw) as Partial<WorkspaceSpiceObservation>
    if (candidate.schemaVersion !== 1 || candidate.handoffId !== handoffId || candidate.workspaceFingerprint !== expectedFingerprint ||
      typeof candidate.createdAt !== 'number' || !Number.isFinite(candidate.createdAt) || candidate.createdAt > now + 5 * 60_000 || now - candidate.createdAt > HANDOFF_TTL_MS ||
      typeof candidate.analysis !== 'string' || candidate.analysis.length > 20 || !['real', 'complex'].includes(candidate.dataType ?? '') ||
      !Number.isInteger(candidate.numPoints) || (candidate.numPoints ?? 0) < 1 || (candidate.numPoints ?? 0) > 20_000 ||
      !Number.isInteger(candidate.displayedPoints) || (candidate.displayedPoints ?? 0) < 1 || (candidate.displayedPoints ?? 0) > 2_000 ||
      !Array.isArray(candidate.series) || !candidate.series.length || candidate.series.length > MAX_OBSERVATION_SERIES ||
      candidate.series.some(series => !series || typeof series.name !== 'string' || series.name.length > 120 || typeof series.type !== 'string' || series.type.length > 40 || !Array.isArray(series.values) || series.values.length > 2_000 || series.values.some(value => typeof value !== 'number' || !Number.isFinite(value))) ||
      !Array.isArray(candidate.warnings) || candidate.warnings.length > 5 || candidate.warnings.some(warning => typeof warning !== 'string' || warning.length > 500)) return undefined
    return candidate as WorkspaceSpiceObservation
  } catch { return undefined }
}

export function clearWorkspaceSpiceObservation(storage: Pick<Storage, 'removeItem'>, id: string | null): void {
  if (!id || !/^[A-Za-z0-9-]{1,80}$/.test(id)) return
  try { storage.removeItem(observationKey(id)) } catch { /* Storage may be disabled; the tab will discard it on close. */ }
}

type LdrWorkspacePart = { id: string; type: string; value?: string }

export type LdrDividerSpiceEligibilityInput = {
  lessonId: string
  boardLogicLevel: string
  hasCircuitErrors: boolean
  placedParts: readonly LdrWorkspacePart[]
}

/** Keep the workspace-to-SPICE bridge scoped to the exact educational divider it represents. */
export function getLdrDividerSpiceBlockReason(input: LdrDividerSpiceEligibilityInput): string | undefined {
  if (input.lessonId !== 'analog-ldr') return 'Chuyển SPICE này chỉ dành cho bài LDR.'
  if (!/^3[.,]3\s*V(?:\s|$)/i.test(input.boardLogicLevel.trim())) {
    return 'Mô hình LDR hiện dùng nguồn 3,3 V; hãy chọn board có mức logic 3,3 V để chuyển sang SPICE.'
  }
  if (input.hasCircuitErrors) return 'Hãy sửa lỗi kết nối trong bài LDR trước khi chuyển mạch sang SPICE.'
  if (!input.placedParts.some(part => part.id === 'ldr-1' && part.type === 'ldr')) {
    return 'Bài cần giữ cảm biến LDR mẫu để tạo mạch tương đương.'
  }
  if (!input.placedParts.some(part => part.id === 'resistor-ldr-1' && part.type === 'resistor' && part.value === '10 kΩ')) {
    return 'Mô hình hiện chỉ hỗ trợ điện trở cố định 10 kΩ của bài mẫu.'
  }
  return undefined
}
