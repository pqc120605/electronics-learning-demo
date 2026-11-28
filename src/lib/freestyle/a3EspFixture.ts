import type { CircuitDocV2 } from '../circuitDocV2'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { buttonLedCircuit } from './buttonLedCircuit'
import { getA3Board, getA3Fixture } from './a3EspProfiles'

export { getA3Board, getA3Fixture } from './a3EspProfiles'
export const a3ButtonId = 'a3-button'
export const a3LedId = 'a3-led'

export function buildA3Fixture(fixtureId: string) {
  const profile = getA3Fixture(fixtureId)
  if (!profile) return
  const { id: boardId, button, revision } = profile
  const doc = buttonLedCircuit('a3', button.gpio).build()
  doc.parts = doc.parts.map(part => part.type === 'board' ? { ...part, value: { label: revision } } : part)
  return { boardId, doc, pinMap: { ...getFreestyleBoard(boardId).defaultPins } }
}

export function validateA3Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap) {
  const profile = getA3Board(boardId)
  const installed = doc.parts.find(part => part.id === 'board' && part.type === 'board')
  if (!profile || profile.revision !== installed?.value?.label || pinMap.input !== profile.button.gpio || pinMap.ledOut !== profile.led.gpio) {
    return ['Chọn đúng board và hai chân GPIO của mạch mẫu A3.']
  }
  return buttonLedCircuit('a3', profile.button.gpio).validate(doc)
}

export function a3DcNetlist(boardId: string, pressed: boolean, outputHigh: boolean) {
  const profile = getA3Board(boardId)
  if (!profile) throw new Error('Chọn board ESP32 được hỗ trợ cho A3.')
  return buttonLedCircuit('a3', profile.button.gpio).dcNetlist(pressed, outputHigh)
}
