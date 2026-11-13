import { boards } from '../data/boards'
import { componentRegistry } from '../data/componentRegistry'
import { curriculumLessons, simulationModeLabels } from '../data/curriculumSchema'
import type { BuilderLessonId } from '../data/builderLessons'
import { circuitForLesson } from '../data/lessonCircuits'
import { getLessonEntryRoute } from '../data/learningPath'
import { resolveResistorVariant } from './componentCatalog'

type ClassroomKitFields = {
  title: string
  boardId: string
  lessonIds: BuilderLessonId[]
  stationCount: number
  quantityOverrides: Record<string, number>
  configurationLicense: 'private' | 'CC-BY-SA-4.0'
}

export type ClassroomKitVariantOverride = {
  value: number
  unit: 'ohm'
  package: string
  quantity: number
}

export type ClassroomKitBundle = ClassroomKitFields & {
  schemaVersion: 1 | 2
  /** Present only for v2 bundles; keys use the canonical component catalog bomKey. */
  variantOverrides?: Record<string, ClassroomKitVariantOverride>
}

export type KitInventoryRow = {
  componentId: string
  label: string
  quantity: number
  kind: 'board' | 'component' | 'accessory'
  note?: string
  bomKey?: string
  value?: number
  unit?: 'ohm'
  package?: string
}

type LegacyResistorOverridePreview = {
  quantity: number
  ambiguous: boolean
  variantKeys: string[]
  hasUnknownVariant: boolean
}

// Exact reference variants only. Unlisted clones/boards require checking their connector.
const usbConnectors: Record<string, string> = {
  'arduino-uno-r3': 'Type-B', 'arduino-mega-2560-r3': 'Type-B',
  'arduino-nano-classic': 'Mini-B', 'esp32-devkit': 'Micro-B',
  'raspberry-pi-pico': 'Micro-B', 'raspberry-pi-pico-w': 'Micro-B', 'raspberry-pi-pico-2': 'Micro-B', 'raspberry-pi-pico-2-h': 'Micro-B',
  'seeed-xiao-esp32c3': 'Type-C', 'seeed-xiao-esp32-s3': 'Type-C',
}

const MAX_IMPORT_CHARACTERS = 64 * 1024
const knownLessons = new Set<BuilderLessonId>(curriculumLessons.map(lesson => lesson.id))
function isKnownLesson(id: unknown): id is BuilderLessonId {
  return typeof id === 'string' && knownLessons.has(id as BuilderLessonId)
}
const knownBoards = new Set(boards.map(board => board.id))
const knownComponents = new Map(componentRegistry.map(component => [component.id, component]))

function resistorValueFromBomKey(bomKey: string): number | undefined {
  const match = /^resistor:ohm:(0|[1-9]\d*(?:\.\d+)?)$/.exec(bomKey)
  if (!match) return undefined
  const value = Number(match[1])
  return Number.isFinite(value) && value > 0 && String(value) === match[1] ? value : undefined
}
function resistanceLabel(value: number): string {
  if (value >= 1000 && value % 1000 === 0) return `Điện trở ${value / 1000} kΩ`
  return `Điện trở ${value} Ω`
}
function normalizeVariantOverrides(value: unknown): Record<string, ClassroomKitVariantOverride> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Bảng số lượng theo biến thể không hợp lệ.')
  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length > 1000) invalid('Bảng biến thể vượt giới hạn.')
  const result: Record<string, ClassroomKitVariantOverride> = {}
  for (const [bomKey, raw] of entries) {
    const keyValue = resistorValueFromBomKey(bomKey)
    if (keyValue === undefined || !raw || typeof raw !== 'object' || Array.isArray(raw)) invalid('Có bomKey hoặc dữ liệu biến thể không hợp lệ.')
    const candidate = raw as Record<string, unknown>
    const allowed = ['value', 'unit', 'package', 'quantity']
    if (Object.keys(candidate).some(key => !allowed.includes(key)) || allowed.some(key => !(key in candidate))) invalid('Dữ liệu biến thể có trường lạ hoặc thiếu trường bắt buộc.')
    if (candidate.value !== keyValue || candidate.unit !== 'ohm') invalid('Trị số hoặc đơn vị không khớp bomKey của biến thể.')
    if (typeof candidate.package !== 'string' || !candidate.package.trim() || candidate.package.length > 80) invalid('Package của biến thể cần là nhãn rõ ràng; dùng unknown khi chưa có dữ liệu.')
    if (!Number.isInteger(candidate.quantity) || Number(candidate.quantity) < 1 || Number(candidate.quantity) > 9999) invalid('Số lượng biến thể cần là số nguyên từ 1 đến 9.999.')
    result[bomKey] = { value: keyValue, unit: 'ohm', package: candidate.package.trim(), quantity: Number(candidate.quantity) }
  }
  return result
}

function getLessonResistorNeeds(lessonIds: readonly string[]) {
  const maximum = new Map<string, { perStation: number; value: number; package: string }>()
  let maximumUnknown = 0
  for (const lessonId of new Set(lessonIds)) {
    if (!isKnownLesson(lessonId)) continue
    const counts = new Map<string, { count: number; value: number; package: string }>()
    let unknownCount = 0
    for (const part of circuitForLesson(lessonId).placed) {
      if (part.type !== 'resistor') continue
      const resolved = resolveResistorVariant({ type: 'resistor', value: part.value }, { lessonId })
      if ((resolved?.status === 'known' || resolved?.status === 'custom') && 'nominal' in resolved && resolved.bomKey) {
        const entry = counts.get(resolved.bomKey) ?? { count: 0, value: resolved.nominal.value, package: 'unknown' }
        entry.count += 1
        counts.set(resolved.bomKey, entry)
      } else {
        unknownCount += 1
      }
    }
    maximumUnknown = Math.max(maximumUnknown, unknownCount)
    for (const [bomKey, item] of counts) {
      const prior = maximum.get(bomKey)
      if (!prior || item.count > prior.perStation) maximum.set(bomKey, { perStation: item.count, value: item.value, package: item.package })
    }
  }
  return { maximum, maximumUnknown }
}

/** Select reusable quantities for the largest simultaneous circuit at each station. */
export function getKitInventory(
  lessonIds: readonly string[],
  stationCount: number,
  quantityOverrides: Readonly<Record<string, number>> = {},
  boardId?: string,
  variantOverrides: Readonly<Record<string, ClassroomKitVariantOverride>> = {},
): KitInventoryRow[] {
  if (!Number.isInteger(stationCount) || stationCount < 1 || stationCount > 100) return []
  const lessons = [...new Set(lessonIds)].filter(isKnownLesson)
  if (!lessons.length) return []
  const maximumPerStation = new Map<string, number>()
  for (const lessonId of lessons) {
    const counts = new Map<string, number>()
    for (const part of circuitForLesson(lessonId).placed) {
      if (part.type === 'resistor' || !knownComponents.has(part.type)) continue
      counts.set(part.type, (counts.get(part.type) ?? 0) + 1)
    }
    for (const [componentId, count] of counts) maximumPerStation.set(componentId, Math.max(maximumPerStation.get(componentId) ?? 0, count))
  }
  for (const componentId of Object.keys(quantityOverrides)) {
    if (componentId !== 'resistor' && knownComponents.has(componentId) && !maximumPerStation.has(componentId)) maximumPerStation.set(componentId, 0)
  }

  const { maximum: resistorNeeds, maximumUnknown } = getLessonResistorNeeds(lessons)
  for (const [bomKey, override] of Object.entries(variantOverrides)) {
    if (!resistorNeeds.has(bomKey)) resistorNeeds.set(bomKey, { perStation: 0, value: override.value, package: override.package })
  }
  const resistorIdentityCount = resistorNeeds.size + Number(maximumUnknown > 0)
  const legacyResistorQuantity = resistorIdentityCount <= 1 ? quantityOverrides.resistor : undefined

  const parts: KitInventoryRow[] = [...maximumPerStation]
    .filter(([componentId]) => !boardId || componentId !== 'board')
    .map(([componentId, count]) => ({
      componentId,
      label: knownComponents.get(componentId)?.label ?? componentId,
      quantity: quantityOverrides[componentId] ?? count * stationCount,
      kind: 'component' as const,
    }))
  for (const [bomKey, item] of resistorNeeds) {
    const override = variantOverrides[bomKey]
    parts.push({
      componentId: bomKey,
      bomKey,
      value: item.value,
      unit: 'ohm',
      package: override?.package ?? item.package,
      label: resistanceLabel(item.value),
      quantity: override?.quantity ?? (legacyResistorQuantity ?? item.perStation * stationCount),
      kind: 'component',
      note: `Trị số đã lấy từ cấu hình bài học hoặc gói nhập. Package: ${override?.package ?? item.package}.`,
    })
  }
  if (maximumUnknown > 0) {
    parts.push({
      componentId: 'resistor',
      label: 'Điện trở · chưa rõ trị số',
      quantity: legacyResistorQuantity ?? maximumUnknown * stationCount,
      kind: 'component',
      note: 'Giá trị chưa có trong dữ liệu bài học; cần xác minh trước khi mua hoặc lắp.',
    })
  }
  parts.sort((a, b) => a.label.localeCompare(b.label, 'vi'))
  const selectedBoard = boards.find(board => board.id === boardId)
  if (selectedBoard) parts.unshift({ componentId: `board:${selectedBoard.id}`, label: selectedBoard.name, quantity: stationCount, kind: 'board' })
  const wiresPerStation = Math.max(...lessons.map(id => circuitForLesson(id).wires.length))
  const connector = boardId && usbConnectors[boardId]
  parts.push({ componentId: 'accessory:jumper', label: 'Dây jumper cắm thử', quantity: (wiresPerStation + 2) * stationCount, kind: 'accessory', note: `${wiresPerStation} dây theo bài nhiều dây nhất + 2 dây dự phòng/trạm. Chọn đầu đực/cái theo header thực tế; dây nguồn đỏ, GND đen chỉ là quy ước.` })
  parts.push({ componentId: 'accessory:usb', label: connector ? `Cáp USB dữ liệu · ${connector}` : 'Cáp USB dữ liệu · kiểm tra cổng board', quantity: stationCount, kind: 'accessory', note: '1 cáp/trạm; chọn đầu phía máy tính và kiểm tra đúng board/revision. Cáp phải truyền dữ liệu, không chỉ sạc; xác nhận nhu cầu nguồn riêng cho tải.' })
  return parts
}

function invalid(message: string): never { throw new Error(message) }

function validateCommon(candidate: Record<string, unknown>): ClassroomKitFields {
  if (typeof candidate.title !== 'string' || !candidate.title.trim() || candidate.title.length > 100) invalid('Tên gói cần có từ 1 đến 100 ký tự.')
  if (typeof candidate.boardId !== 'string' || !knownBoards.has(candidate.boardId)) invalid('Board trong gói không có trong danh mục hiện tại.')
  if (!Array.isArray(candidate.lessonIds) || candidate.lessonIds.length < 1 || candidate.lessonIds.length > curriculumLessons.length || candidate.lessonIds.some(id => !isKnownLesson(id)) || new Set(candidate.lessonIds).size !== candidate.lessonIds.length) invalid(`Số bài cần từ 1 đến ${curriculumLessons.length}; chỉ chọn bài hợp lệ và không trùng lặp.`)
  if (!Number.isInteger(candidate.stationCount) || Number(candidate.stationCount) < 1 || Number(candidate.stationCount) > 100) invalid('Số trạm cần là số nguyên từ 1 đến 100.')
  if (candidate.configurationLicense !== 'private' && candidate.configurationLicense !== 'CC-BY-SA-4.0') invalid('Chọn quyền chia sẻ cấu hình: giữ riêng tư hoặc CC BY-SA 4.0.')
  if (!candidate.quantityOverrides || typeof candidate.quantityOverrides !== 'object' || Array.isArray(candidate.quantityOverrides)) invalid('Bảng số lượng kit không hợp lệ.')
  const quantityOverrides: Record<string, number> = {}
  for (const [componentId, quantity] of Object.entries(candidate.quantityOverrides as Record<string, unknown>)) {
    if (!knownComponents.has(componentId) || !Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 9999) invalid('Có linh kiện hoặc số lượng kit không hợp lệ (mỗi số lượng từ 1 đến 9.999).')
    quantityOverrides[componentId] = Number(quantity)
  }
  return {
    title: candidate.title.trim(),
    boardId: candidate.boardId,
    lessonIds: [...candidate.lessonIds] as BuilderLessonId[],
    stationCount: Number(candidate.stationCount),
    quantityOverrides,
    configurationLicense: candidate.configurationLicense,
  }
}

/** Read both strict bundle versions. v1 remains canonical and old clients reject v2 clearly. */
export function parseClassroomKitBundle(source: string): ClassroomKitBundle {
  if (typeof source !== 'string' || source.length > MAX_IMPORT_CHARACTERS) invalid('Tệp bộ kit vượt giới hạn 64 kB.')
  let value: unknown
  try { value = JSON.parse(source) } catch { return invalid('Tệp JSON không đọc được.') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Gói lớp học không hợp lệ.')
  const candidate = value as Record<string, unknown>
  const version = candidate.schemaVersion
  if (version !== 1 && version !== 2) invalid('Phiên bản gói lớp học chưa được hỗ trợ bởi bản này.')
  const allowedKeys = version === 1
    ? ['schemaVersion', 'title', 'boardId', 'lessonIds', 'stationCount', 'quantityOverrides', 'configurationLicense']
    : ['schemaVersion', 'title', 'boardId', 'lessonIds', 'stationCount', 'quantityOverrides', 'configurationLicense', 'variantOverrides']
  if (Object.keys(candidate).some(key => !allowedKeys.includes(key)) || allowedKeys.some(key => !(key in candidate))) invalid('Gói lớp học không hợp lệ: có trường lạ hoặc thiếu trường bắt buộc; dữ liệu học sinh/tài khoản không được hỗ trợ.')
  const common = validateCommon(candidate)
  if (version === 1) return { schemaVersion: 1, ...common }
  const variantOverrides = normalizeVariantOverrides(candidate.variantOverrides)
  // Empty v2 maps carry no variant-specific data; canonical output stays v1.
  if (Object.keys(variantOverrides).length === 0) return { schemaVersion: 1, ...common }
  return { schemaVersion: 2, ...common, variantOverrides }
}

export function serializeClassroomKitBundle(value: ClassroomKitBundle): string {
  return JSON.stringify(parseClassroomKitBundle(JSON.stringify(value)), null, 2)
}

function csvCell(value: string | number): string {
  let text = String(value)
  // Prefix formula-like user text so spreadsheet programs treat it as data.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

/** Export a readable teacher-facing list and a canonical bundle cell for lossless import. */
export function serializeClassroomKitCsv(bundle: ClassroomKitBundle, inventory: readonly KitInventoryRow[]): string {
  const normalized = parseClassroomKitBundle(JSON.stringify(bundle))
  const board = boards.find(item => item.id === normalized.boardId)
  const lessonNames = normalized.lessonIds
    .map(id => curriculumLessons.find(lesson => lesson.id === id)?.title)
    .filter((title): title is string => Boolean(title))
  const rows: Array<Array<string | number>> = [
    ['Kế hoạch kit Mạch Mở'],
    ['Mạch Mở bundle JSON', JSON.stringify(normalized)],
    ['Tên kế hoạch', normalized.title],
    ['Board', board?.name ?? normalized.boardId],
    ['Revision tham chiếu', board?.revision ?? 'Chưa ghi nhận'],
    ['Số trạm', normalized.stationCount],
    ['Bài học', lessonNames.join(' | ')],
    [],
    ['Loại', 'Linh kiện / board', 'Mã', 'Số lượng tổng', 'Trị số', 'Đơn vị', 'Package'],
    ...inventory.map(row => [row.kind === 'board' ? 'Board' : row.kind === 'accessory' ? 'Phụ kiện' : 'Linh kiện', row.label, row.bomKey ?? row.componentId, row.quantity, row.value ?? '', row.unit ?? '', row.package ?? '']),
  ]
  return `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}\r\n`
}

function parseCsvRows(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1 }
      else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"' && cell.length === 0) quoted = true
    else if (char === ',') { row.push(cell); cell = '' }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += char
  }
  if (quoted) invalid('Tệp CSV có dấu ngoặc kép chưa đóng.')
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row) }
  if (rows.length > 2000 || rows.some(item => item.length > 20 || item.some(value => value.length > MAX_IMPORT_CHARACTERS))) invalid('Tệp CSV vượt giới hạn cấu trúc.')
  return rows
}

export function parseClassroomKitCsv(source: string): ClassroomKitBundle {
  if (typeof source !== 'string' || source.length > MAX_IMPORT_CHARACTERS) invalid('Tệp bộ kit vượt giới hạn 64 kB.')
  const metadata = parseCsvRows(source).find(row => row[0] === 'Mạch Mở bundle JSON')
  if (!metadata || typeof metadata[1] !== 'string' || !metadata[1]) invalid('CSV không có dữ liệu gói Mạch Mở để nhập lại.')
  return parseClassroomKitBundle(metadata[1])
}

/** Preview a legacy family override before the UI accepts a mapping for mixed resistor variants. */
export function getLegacyResistorOverridePreview(bundle: ClassroomKitBundle): LegacyResistorOverridePreview | undefined {
  const quantity = bundle.quantityOverrides.resistor
  if (quantity === undefined) return undefined
  const needs = getLessonResistorNeeds(bundle.lessonIds)
  const variantKeys = [...needs.maximum.keys()].sort()
  const hasUnknownVariant = needs.maximumUnknown > 0
  const identities = variantKeys.length + Number(hasUnknownVariant)
  return { quantity, ambiguous: identities > 1, variantKeys, hasUnknownVariant }
}

/** Apply a user's explicit choice for an ambiguous pre-v2 family-level override. */
export function resolveLegacyResistorOverride(
  bundle: ClassroomKitBundle,
  choice?: { kind: 'map'; bomKey: string } | { kind: 'leave-defaults' },
): ClassroomKitBundle {
  const preview = getLegacyResistorOverridePreview(bundle)
  if (!preview) return bundle
  if (preview.ambiguous && !choice) invalid('Cần lựa chọn rõ cách xử lý override resistor cũ.')
  const quantityOverrides = { ...bundle.quantityOverrides }
  delete quantityOverrides.resistor
  let variantOverrides = { ...(bundle.variantOverrides ?? {}) }
  if (choice?.kind === 'map') {
    if (!preview.variantKeys.includes(choice.bomKey)) invalid('Chỉ được gán override vào biến thể có trong preview.')
    const value = resistorValueFromBomKey(choice.bomKey)
    if (value === undefined) invalid('bomKey của biến thể không hợp lệ.')
    variantOverrides[choice.bomKey] = { value, unit: 'ohm', package: 'unknown', quantity: preview.quantity }
  }
  const entries = Object.keys(variantOverrides).length ? variantOverrides : undefined
  return entries
    ? { ...bundle, schemaVersion: 2, quantityOverrides, variantOverrides: entries }
    : { schemaVersion: 1, title: bundle.title, boardId: bundle.boardId, lessonIds: [...bundle.lessonIds], stationCount: bundle.stationCount, quantityOverrides, configurationLicense: bundle.configurationLicense }
}

/** Portable, manual-share pack for a teacher/community post; contains no learner accounts or progress. */
export function serializeClassroomKitSharePack(value: ClassroomKitBundle): string {
  const bundle = parseClassroomKitBundle(JSON.stringify(value))
  const board = boards.find(item => item.id === bundle.boardId)
  const lessons = bundle.lessonIds.map(id => curriculumLessons.find(item => item.id === id)!).map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    route: getLessonEntryRoute(lesson, bundle.boardId),
    level: lesson.level,
    durationMinutes: lesson.durationMinutes,
    capabilityLabel: simulationModeLabels[lesson.simulationMode],
    supportedBehavior: lesson.supportedBehavior,
    boardProfile: lesson.boardProfile,
    componentIds: lesson.components,
    safetyNotes: lesson.safetyNotes,
  }))
  return JSON.stringify({
    schema: 'mach-mo/classroom-kit-share',
    schemaVersion: 1,
    title: bundle.title,
    configuration: bundle,
    board: board ? {
      id: board.id,
      name: board.name,
      revision: board.revision ?? 'Chưa ghi nhận',
      logicLevel: board.logicLevel ?? 'Cần đối chiếu datasheet',
      sourceUrl: board.sourceUrl,
      evidenceUrl: board.sourceEvidenceUrl,
    } : { id: bundle.boardId, name: bundle.boardId, revision: 'Chưa ghi nhận', logicLevel: 'Cần đối chiếu datasheet' },
    lessons,
    stationCount: bundle.stationCount,
    inventory: getKitInventory(bundle.lessonIds, bundle.stationCount, bundle.quantityOverrides, bundle.boardId, bundle.variantOverrides),
    safetyNotes: [...new Set(lessons.flatMap(lesson => lesson.safetyNotes))],
    attribution: { name: 'Mạch Mở', project: 'Kế hoạch kit giáo dục do giáo viên tạo', url: '/' },
    license: bundle.configurationLicense,
    limitations: [
      'Gói chỉ chia sẻ kế hoạch kit và liên kết bài học; không chứa dữ liệu học sinh, tiến độ cá nhân hoặc tài khoản.',
      'Nhãn mô phỏng mô tả phạm vi giáo dục của từng bài; không khẳng định firmware MCU hoặc hành vi phần cứng đã được mô phỏng.',
      'Board/revision và lưu ý an toàn cần được đối chiếu với datasheet của phần cứng thực tế.',
      'Đây là tệp để người dùng tự gửi/nhận; Mạch Mở chưa có bảng tin cộng đồng hay tải nội dung lên máy chủ.',
    ],
  }, null, 2)
}

/** Accept the local JSON bundle, CSV export, or manual-share wrapper. */
export function parseClassroomKitImport(source: string): ClassroomKitBundle {
  if (typeof source !== 'string' || source.length > MAX_IMPORT_CHARACTERS) invalid('Tệp bộ kit vượt giới hạn 64 kB.')
  let value: unknown
  try { value = JSON.parse(source) } catch {
    return parseClassroomKitCsv(source)
  }
  if (value && typeof value === 'object' && !Array.isArray(value) && (value as Record<string, unknown>).schema === 'mach-mo/classroom-kit-share') {
    const pack = value as Record<string, unknown>
    const allowedKeys = ['schema', 'schemaVersion', 'title', 'configuration', 'board', 'lessons', 'stationCount', 'inventory', 'safetyNotes', 'attribution', 'license', 'limitations']
    if (Object.keys(pack).some(key => !allowedKeys.includes(key)) || pack.schemaVersion !== 1 || typeof pack.configuration !== 'object' || !pack.configuration || Array.isArray(pack.configuration)) invalid('Gói chia sẻ lớp học không hợp lệ: có trường lạ hoặc thiếu dữ liệu kế hoạch.')
    if (!Array.isArray(pack.lessons) || pack.lessons.length < 1 || pack.lessons.length > curriculumLessons.length || !Array.isArray(pack.inventory) || pack.inventory.length > 1000 || !Array.isArray(pack.safetyNotes) || pack.safetyNotes.length > 100 || !Array.isArray(pack.limitations) || pack.limitations.length > 20) invalid('Gói chia sẻ lớp học có danh sách vượt giới hạn.')
    return parseClassroomKitBundle(JSON.stringify(pack.configuration))
  }
  return parseClassroomKitBundle(source)
}

export function createDefaultClassroomKitBundle(): ClassroomKitBundle {
  const boardId = knownBoards.has('esp32-devkit') ? 'esp32-devkit' : boards[0]?.id ?? ''
  const firstLesson = curriculumLessons[0]?.id ?? ''
  return { schemaVersion: 1, title: 'Bộ thực hành Mạch Mở', boardId, lessonIds: [firstLesson], stationCount: 4, quantityOverrides: {}, configurationLicense: 'private' }
}
