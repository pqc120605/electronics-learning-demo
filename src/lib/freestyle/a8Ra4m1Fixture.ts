import type { CircuitDocV2 } from '../circuitDocV2'
import { buttonLedCircuit } from './buttonLedCircuit'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { a8Revision, getA8Board, getA8Fixture, type A8Board } from './a8Ra4m1Profiles'

export const a8ButtonId = 'a8-button'
export const a8LedId = 'a8-led'
const circuit = buttonLedCircuit('a8', 2, 4)
const labelFor = (board: A8Board) => a8Revision + ' · ' + board.revision
const boardPart = (doc: CircuitDocV2) => doc.parts.find(part => part.type === 'board' && part.id === 'board')

export function getActiveA8Board(boardId: string, doc: CircuitDocV2) {
  const profile = getA8Board(boardId)
  return profile && (boardPart(doc)?.value?.label?.startsWith(a8Revision + ' · ')
    || doc.parts.some(part => part.id === a8ButtonId || part.id === a8LedId)) ? profile : undefined
}

export function buildA8Fixture(fixtureId: string) {
  const profile = getA8Fixture(fixtureId)
  if (!profile) return
  const doc = circuit.build()
  boardPart(doc)!.value = { label: labelFor(profile) }
  return { boardId: profile.id, doc, pinMap: getFreestyleBoard(profile.id).defaultPins }
}

export function validateA8Circuit(doc: CircuitDocV2, boardId: string, pins: PinMap) {
  const board = getA8Board(boardId)
  if (!board || boardPart(doc)?.value?.label !== labelFor(board)
    || pins.input !== board.button.gpio || pins.ledOut !== board.led.gpio) {
    return ['Chọn đúng SKU UNO R4 và dùng D2/D4 của mạch mẫu A8.']
  }
  return circuit.validate(doc)
}

export const a8DcNetlist = circuit.dcNetlist
