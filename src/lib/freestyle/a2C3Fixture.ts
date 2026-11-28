import type { CircuitDocV2 } from '../circuitDocV2'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { buttonLedCircuit } from './buttonLedCircuit'

export const a2BoardId = 'esp32-c3-devkitm-1'
export const a2FixtureId = 'a2-c3-button-led'
export const a2ButtonId = 'a2-button'
export const a2LedId = 'a2-led'
const circuit = buttonLedCircuit('a2', 4)

export function buildA2C3Fixture() {
  return { boardId: a2BoardId, doc: circuit.build(), pinMap: { ...getFreestyleBoard(a2BoardId).defaultPins } }
}

export function validateA2C3Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap): string[] {
  if (boardId !== a2BoardId || pinMap.input !== 4 || pinMap.ledOut !== 10) return ['Chọn ESP32-C3-DevKitM-1 với GPIO4 vào và GPIO10 ra.']
  return circuit.validate(doc)
}

export const a2DcNetlist = circuit.dcNetlist
