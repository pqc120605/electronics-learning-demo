import type { BoardFeature, BoardModelEvidence } from '../components/board/boardSceneTypes'
import type { ComponentDefinition } from '../data/componentRegistry'
import { componentMeshKindLabels, componentMeshNotes, getComponentMesh, kicadModelSource } from '../data/componentModels'
import type { CurriculumLesson } from '../data/curriculumSchema'
import type { CircuitPart } from '../types/circuitTopology'
import type { AssemblyModelKind } from './assemblyLayout'

export type PartInfoTab = 'overview' | 'pins' | 'example' | 'limits' | 'source'
export type PartSource = { note: string; revision?: string; url?: string; license?: string; attribution?: string; issues?: string[] }
export type PartInfo = {
  title: string
  category: string
  summary: string
  facts: string[]
  modelKind: AssemblyModelKind
  modelLabel: string
  exampleLines: string[]
  limits: string[]
  source: PartSource
  tabs: PartInfoTab[]
}
export type FeatureInfo = { title: string; designator?: string; summary: string; role: string; connection: string; limits: string[]; evidenceLabel: string; cadLine?: string; source: PartSource }

const codePatterns: Record<string, RegExp> = {
  led: /ledPin|LED_BUILTIN/, resistor: /ledPin/, button: /buttonPin/, 'ir-sensor': /sensorPin|detected/, potentiometer: /potPin/, ldr: /ldrPin/,
  ultrasonic: /trig|echo/i, 'seven-segment': /segment|digits/i, board: /pinMode/,
}

function codeLinesFor(type: string, code: string) {
  const pattern = codePatterns[type]
  if (!pattern) return []
  return code.split('\n').map((line) => line.trim()).filter((line) => pattern.test(line)).slice(0, 6)
}

export const assemblyModelLabels: Record<AssemblyModelKind, string> = {
  'board-cad': 'Model board từ CAD tham chiếu',
  'component-cad': componentMeshKindLabels['source-cad-mesh'],
  'component-parametric': componentMeshKindLabels['parametric-mesh'],
  'fallback-box': 'Khối thay thế, chưa có model',
}

type PartInfoInput = { part: CircuitPart; definition: ComponentDefinition; code: string; lessonMode: CurriculumLesson['simulationMode']; boardEvidence?: BoardModelEvidence; title?: string; modelFailed?: boolean }

export function getPartInfo({ part, definition, code, lessonMode, boardEvidence, title, modelFailed = false }: PartInfoInput): PartInfo {
  const mesh = modelFailed ? undefined : getComponentMesh(part.type)
  const isBoardCad = !modelFailed && part.type === 'board' && boardEvidence?.published === true && boardEvidence.status !== 'preview-only'
  const modelKind: AssemblyModelKind = isBoardCad ? 'board-cad' : mesh ? (mesh.kind === 'source-cad-mesh' ? 'component-cad' : 'component-parametric') : 'fallback-box'
  const exampleLines = lessonMode === 'code-subset' ? codeLinesFor(part.type, code) : []
  const source: PartSource = isBoardCad && boardEvidence
    ? { note: boardEvidence.confidenceNote, revision: boardEvidence.revision, url: boardEvidence.sourceUrl, license: boardEvidence.licenseName, attribution: boardEvidence.attribution, issues: boardEvidence.unresolvedIssues }
    : mesh?.kind === 'source-cad-mesh'
      ? { note: componentMeshNotes['source-cad-mesh'], revision: mesh.packageName, url: kicadModelSource.url, license: kicadModelSource.license, attribution: kicadModelSource.label }
      : mesh ? { note: componentMeshNotes['parametric-mesh'] } : { note: modelFailed ? 'Model của mục này không tải được, nên cảnh đang dùng khối thay thế. Vị trí chân trên khối chỉ là minh họa.' : 'Chưa có model cho mục này. Khối trong cảnh chỉ giữ chỗ, không thể hiện hình dạng thật.' }
  const limits = [definition.safetyNotes, definition.simulation === 'supported' ? 'Có hành vi logic trong bài tương ứng; không tính điện áp hay dòng.' : 'Chưa mô phỏng trong bài học.']
  const tabs: PartInfoTab[] = ['overview', ...(definition.pins.length ? ['pins' as const] : []), ...(exampleLines.length ? ['example' as const] : []), 'limits', 'source']
  const facts = [`Nhóm: ${definition.category}`, `${definition.pins.length} chân trong mô hình bài học`]
  return { title: title ?? definition.label, category: definition.category, summary: definition.explanation, facts, modelKind, modelLabel: modelFailed ? 'Model lỗi tải · đang dùng khối thay thế' : assemblyModelLabels[modelKind], exampleLines, limits, source, tabs }
}

export function getFeatureInfo(feature: BoardFeature, evidence?: BoardModelEvidence): FeatureInfo {
  const cad = feature.cadFootprint
  return {
    title: feature.name,
    designator: feature.designator,
    summary: feature.plainDescription,
    role: feature.technicalRole,
    connection: feature.connection,
    limits: [feature.safetyNote],
    evidenceLabel: feature.roleEvidence === 'unverified' ? 'Vai trò chưa xác minh; chỉ biết tham chiếu từ CAD' : feature.roleEvidence === 'source-backed' ? 'Vai trò có nguồn từ BOM, CAD hoặc net' : 'Theo tài liệu thiết kế của board tham chiếu',
    cadLine: cad ? `${cad.reference} · ${cad.value} · ${cad.footprint} · mặt ${cad.side === 'front' ? 'trên' : 'dưới'}` : undefined,
    source: evidence ? { note: evidence.confidenceNote, revision: evidence.revision, url: evidence.sourceUrl, license: evidence.licenseName, attribution: evidence.attribution, issues: evidence.unresolvedIssues } : { note: 'Chưa có hồ sơ nguồn cho board này.' },
  }
}
