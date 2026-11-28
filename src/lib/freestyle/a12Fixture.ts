import type { CircuitDocV2 } from '../circuitDocV2'
import { a12Boards, a12Revision, getA12Board, type A12Board } from './a12Profiles'
import { buttonLedCircuit } from './buttonLedCircuit'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'

export { getA12Board } from './a12Profiles'
export const a12ButtonId = 'a12-button'
export const a12LedId = 'a12-led'

const label = (board: A12Board) => `${a12Revision} · ${board.revision}`
const boardPart = (doc: CircuitDocV2) => doc.parts.find(part => part.id === 'board' && part.type === 'board')
const circuit = (board: A12Board) => buttonLedCircuit('a12', board.button.gpio, board.led.gpio, board.voltageV)

export function getActiveA12Board(boardId: string, doc: CircuitDocV2) {
  const board = getA12Board(boardId)
  return board && (boardPart(doc)?.value?.label?.startsWith(a12Revision + ' · ')
    || doc.parts.some(part => part.id === a12ButtonId || part.id === a12LedId)) ? board : undefined
}

export function buildA12Fixture(fixtureId: string) {
  const board = a12Boards.find(item => item.fixtureId === fixtureId)
  if (!board) return
  const doc = circuit(board).build()
  boardPart(doc)!.value = { label: label(board) }
  return { boardId: board.id, doc, pinMap: getFreestyleBoard(board.id).defaultPins }
}

export function validateA12Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap) {
  const board = getA12Board(boardId)
  if (!board || boardPart(doc)?.value?.label !== label(board) ||
    pinMap.input !== board.button.gpio || pinMap.ledOut !== board.led.gpio) {
    return ['Chọn đúng board và chân tín hiệu của mạch mẫu A12.']
  }
  return circuit(board).validate(doc)
}

export const a12DcNetlist = (board: A12Board, pressed: boolean, outputHigh: boolean) =>
  circuit(board).dcNetlist(pressed, outputHigh)
