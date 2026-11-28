import type { CircuitDocV2 } from '../circuitDocV2'
import { buttonLedCircuit } from './buttonLedCircuit'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { a9Revision, getA9Board, getA9Fixture, type A9Board } from './a9Stm32Profiles'

export const a9ButtonId = 'a9-button'
export const a9LedId = 'a9-led'
const circuit = buttonLedCircuit('a9', 10, 5)
const labelFor = (board: A9Board) => a9Revision + ' · ' + board.revision
const boardPart = (doc: CircuitDocV2) => doc.parts.find(part => part.type === 'board' && part.id === 'board')

export function getActiveA9Board(boardId: string, doc: CircuitDocV2) {
  const board = getA9Board(boardId)
  return board && (boardPart(doc)?.value?.label?.startsWith(a9Revision + ' · ')
    || doc.parts.some(part => part.id === a9ButtonId || part.id === a9LedId)) ? board : undefined
}

export function buildA9Fixture(fixtureId: string) {
  const board = getA9Fixture(fixtureId)
  if (!board) return
  const doc = circuit.build()
  boardPart(doc)!.value = { label: labelFor(board) }
  const pinMap = { ...getFreestyleBoard(board.id).defaultPins, input: board.button.gpio, ledOut: board.led.gpio }
  return { boardId: board.id, doc, pinMap }
}

export function validateA9Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap) {
  const board = getA9Board(boardId)
  if (!board || boardPart(doc)?.value?.label !== labelFor(board)
    || pinMap.input !== board.button.gpio || pinMap.ledOut !== board.led.gpio) {
    return ['Chọn đúng phiên bản STM32, PA10 và PB5 của mạch mẫu A9.']
  }
  return circuit.validate(doc)
}

export const a9DcNetlist = circuit.dcNetlist
