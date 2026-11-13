export type PcbPoint = [number, number]

export type PcbPad = {
  number: string
  x: number
  y: number
  width: number
  height: number
  shape: string
  rotation: number
  layer: string
  layers?: string[]
  netId: string | null
  netName: string
}

export type PcbComponent = {
  reference: string
  value: string
  footprint: string
  x: number
  y: number
  rotation: number
  side: 'front' | 'back'
  pads: PcbPad[]
}

export type PcbCopperFeature = {
  id: string
  kind: 'track' | 'via' | 'zone'
  layerId: string
  netId: string | null
  netName: string
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  width?: number
  x?: number
  y?: number
  diameter?: number
  drill?: number
  contours?: PcbPoint[][]
}

export type PcbBoardManifest = {
  schemaVersion: number
  boardId: string
  revision: string
  sourceFiles: string[]
  sourceHash: string
  attribution: string
  license: string
  units: 'mm'
  bounds: { width: number; height: number }
  layers: Array<{ id: string; label: string; side: string }>
  outline: string[]
  components: PcbComponent[]
  nets: Array<{ id: string; name: string; kind: string }>
  copperFeatures: PcbCopperFeature[]
  pinToNet: Record<string, string>
  verifiedMappings: Array<{
    lessonId: string
    codePin: number
    pinLabel: string
    netId: string
    description: string
    sourcePads: Array<{ reference: string; pad: string }>
  }>
  checkedOmissions: string[]
  verification: string
}
