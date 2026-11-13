import { componentRegistry, resistorVariants, type ResistanceNominal } from '../data/componentRegistry'
import { getComponentMesh } from '../data/componentModels'
import { curriculumLessons } from '../data/curriculumSchema'
import { getLessonEntryRoute, learningPathOrder } from '../data/learningPath'
import { circuitForLesson } from '../data/lessonCircuits'

/** A catalog record has a workspace model only through an explicit catalogId, never by a shared id. */
export function getCatalogModel(componentId: string) {
  return componentRegistry.find((part) => part.catalogId === componentId)
}

export type ComponentLink = { id: string; status: 'found' | 'default' | 'unknown'; requestedId?: string }

export function resolveComponentLink(requestedId: string | null, ids: readonly string[]): ComponentLink {
  if (!requestedId) return { id: ids[0], status: 'default' }
  return ids.includes(requestedId) ? { id: requestedId, status: 'found' } : { id: ids[0], status: 'unknown', requestedId }
}

type ResistorVariant = typeof resistorVariants[number]
type ResistorInput = { type: string; value?: unknown; variantId?: unknown }
type ResistorEvidence = {
  lessonId?: string
  assetStatus?: 'verified' | 'missing' | 'hash-mismatch'
  analogModelAvailable?: boolean
}
type ResistorNominalResolution =
  | { status: 'known'; variant: ResistorVariant; nominal: ResistanceNominal; bomKey: string }
  | { status: 'custom'; reason: 'unlisted-nominal'; nominal: ResistanceNominal; bomKey: string }
  | { status: 'unknown'; reason: 'unknown-variant' | 'missing-value' }
  | { status: 'invalid'; reason: 'invalid-resistance' | 'variant-value-mismatch' }

const resistanceScales: Readonly<Record<string, number>> = {
  '': 1, f: 1e-15, p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6,
  m: 1e-3, k: 1e3, K: 1e3, M: 1e6, meg: 1e6, G: 1e9, T: 1e12,
}

function readResistance(value: unknown): ResistanceNominal | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().replace(/,/g, '.').replace(/ohms?$/i, 'Ω')
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*(meg|[fpnuµμmkKMGT])?\s*[ΩΩ]?$/.exec(normalized)
  if (!match) return undefined
  const ohms = Number(match[1]) * resistanceScales[match[2] ?? '']
  return Number.isFinite(ohms) && ohms > 0 ? { value: ohms, unit: 'ohm' } : undefined
}

function resolveResistorNominal({ value, variantId }: ResistorInput): ResistorNominalResolution {
  const requested = resistorVariants.find(variant => variant.id === variantId)
  if (variantId !== undefined && !requested) return { status: 'unknown', reason: 'unknown-variant' }
  if (value === undefined || (typeof value === 'string' && !value.trim())) return { status: 'unknown', reason: 'missing-value' }
  const nominal = readResistance(value)
  if (!nominal) return { status: 'invalid', reason: 'invalid-resistance' }
  if (requested && requested.nominal.value !== nominal.value) return { status: 'invalid', reason: 'variant-value-mismatch' }
  const variant = requested ?? resistorVariants.find(candidate => candidate.nominal.value === nominal.value)
  const bomKey = `resistor:ohm:${nominal.value}`
  return variant ? { status: 'known', variant, nominal, bomKey } : { status: 'custom', reason: 'unlisted-nominal', nominal, bomKey }
}

/** Catalog evidence only. Callers must independently verify the asset and the circuit/model context. */
export function resolveResistorVariant(part: ResistorInput, evidence: ResistorEvidence = {}) {
  if (part.type !== 'resistor') return undefined
  const resolution = resolveResistorNominal(part)
  const mesh = evidence.assetStatus === 'verified' ? getComponentMesh('resistor') : undefined
  const lesson = resolution.status === 'known' && resolution.variant.source.lessonId === evidence.lessonId
    ? { status: 'documented-example' as const, source: resolution.variant.source }
    : { status: 'unknown' as const }
  const analog = evidence.analogModelAvailable === true && 'nominal' in resolution
    ? { status: 'ideal-model-available' as const, element: 'R' as const }
    : { status: 'unknown' as const, reason: evidence.analogModelAvailable === false ? 'analog-model-missing' : 'analog-context-unverified' }
  return {
    ...resolution,
    rawValue: part.value,
    requestedVariantId: part.variantId,
    familyId: 'resistor' as const,
    symbolId: 'resistor' as const,
    pinIds: ['a', 'b'] as const,
    contexts: {
      geometry: mesh
        ? { status: 'reference-only' as const, representation: 'mesh' as const, assetPath: mesh.file }
        : { status: 'reference-only' as const, representation: 'symbol' as const },
      lesson,
      analog,
      boardFirmware: { status: 'unknown' as const },
      physical: { status: 'unknown' as const },
    },
  }
}

/** Read from the lesson circuits, so the list cannot drift from what a lesson actually wires up. */
export function getLessonsUsingComponent(componentId: string) {
  const model = getCatalogModel(componentId)
  if (!model || model.id === 'board') return []
  return learningPathOrder
    .filter((id) => circuitForLesson(id).placed.some((part) => part.type === model.id))
    .map((id) => ({ id, title: curriculumLessons.find((lesson) => lesson.id === id)?.title ?? id, route: getLessonEntryRoute({ id }) }))
}
