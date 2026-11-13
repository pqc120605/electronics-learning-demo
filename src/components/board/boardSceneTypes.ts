export type BoardFeature = {
  id: string
  name: string
  plainDescription: string
  technicalRole: string
  connection: string
  safetyNote: string
  relatedLessonPartIds: string[]
  designator?: string
  placementReason?: string
  placementEvidence?: 'cad' | 'principle'
  /** Exact CAD reference exists, but a mesh body may still be absent from the 3D model. */
  cadFootprint?: { reference: string; value: string; footprint: string; x: number; y: number; rotation: number; side: 'front' | 'back'; has3dBody: boolean; pads?: Array<{ number: string; net: string | null }> }
  roleEvidence?: 'source-backed' | 'unverified'
}

export type BoardModelEvidence = {
  status: 'source-verified-cad' | 'educational-reconstruction' | 'preview-only'
  revision: string
  sourceUrl: string
  licenseName: string
  attribution: string
  confidenceNote: string
  unresolvedIssues: string[]
  published: boolean
  /** Bundled license or notice file that has to travel with the model. */
  noticeUrl?: string
}

export type BoardHotspot = {
  id: string
  featureId: string
  label: string
  nodeNames: string[]
}

export type BoardSceneDefinition = {
  id: 'pcb' | 'assembly'
  label: string
  assetUrl: string
  assetVersion: string
  hotspots: BoardHotspot[]
  note: string
}

export type BoardPin = {
  id: string
  side: 'left' | 'right' | 'reference'
  position: number
  label: string
  /** Optional CAD/header identity used for board-specific pinout inspectors. */
  headerReference?: string
  padNumber?: string
  netName?: string
  gpio?: number
  /** Present only when a pad center has been derived from the matching board CAD. */
  anchor?: [number, number, number]
  plainDescription: string
  technicalRole: string
  connection: string
  safetyNote: string
  functions: string[]
}

export type BoardSignalFlow = {
  id: string
  title: string
  summary: string
  steps: string[]
  relatedPinIds: string[]
  note: string
}

export type BoardPinoutEvidence = {
  /** Board-specific scope and provenance for the selectable pin anchors. */
  summary: string
  sourceLabel?: string
  sourceUrl?: string
}

export type BoardModelManifest = {
  id: string
  assetUrl: string
  assetVersion: string
  features: BoardFeature[]
  hotspots: BoardHotspot[]
  pins: BoardPin[]
  signalFlows: BoardSignalFlow[]
  scenes: BoardSceneDefinition[]
  /** Disable coordinate-based pin picking until anchors have been sourced from the board CAD. */
  pinPicking?: boolean
  /** Explain the source and limits of the pin anchors shown in the board catalog. */
  pinoutEvidence?: BoardPinoutEvidence
  audit?: { status: 'cad-reference' | 'educational-reconstruction' | 'assembly-verified'; revision: string; sourceRefs: Array<{ path?: string; sha256?: string; url?: string; license?: string; role?: string }>; unverifiedReferences: string[]; auditNotes: string[] }
}

export type BoardSceneSelection = {
  hotspotId: string
  featureId: string
}

export type BoardSceneApi = {
  load(manifest: BoardModelManifest, scene: BoardSceneDefinition): Promise<void>
  setSelection(featureId: string): void
  setHighlights(featureIds: string[]): void
  resetView(): void
  rotate(horizontal: number, vertical: number): void
  zoom(direction: -1 | 1): void
  dispose(): void
}
