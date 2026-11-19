export type BoardComponentSource = { file: string; revision: string; license: string; sha256: string }

export type BoardPad = {
  padNumber: string
  name: string
  electricalType: 'input' | 'output' | 'bidirectional' | 'tri_state' | 'passive' | 'power_in' | 'power_out'
    | 'open_collector' | 'open_emitter' | 'no_connect' | 'unspecified'
  net?: string
  xMm: number
  yMm: number
  side: 'front' | 'back'
  pinId?: string
}

export type BoardComponent = {
  ref: string
  value: string
  description: string
  footprint: string
  side: BoardPad['side']
  xMm: number
  yMm: number
  rotationDeg: number
  /** Bounds of pads in the board plane, when the PCB source exposes pad geometry. */
  bboxMm: { w: number; h: number; x: number; y: number } | null
  pin1?: { xMm: number; yMm: number }
  datasheetUrl?: string
  mpn?: string
  pads: BoardPad[]
  source: BoardComponentSource
}

export type BoardComponents = {
  boardId: string
  modelSha256: string
  modelOffsetMm: { x: number; z: number }
  components: BoardComponent[]
}
