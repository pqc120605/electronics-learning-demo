import type { CircuitDocV2 } from '../circuitDocV2'
import { buttonLedCircuit } from './buttonLedCircuit'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { a11Revision, a11Settings, getA11Board, getA11Fixture, type A11Board } from './a11EspRuntime'

export const a11ButtonId = 'a11-button'
export const a11LedId = 'a11-led'
const circuit = buttonLedCircuit('a11', a11Settings.firmware.inputGpio, a11Settings.firmware.outputGpio)
const label = (board: A11Board) => `${a11Revision} · ${board.revision}`
const boardPart = (doc: CircuitDocV2) => doc.parts.find(part => part.type === 'board' && part.id === 'board')

export function getActiveA11Board(boardId: string, doc: CircuitDocV2) {
  const board = getA11Board(boardId)
  return board && (boardPart(doc)?.value?.label?.startsWith(a11Revision + ' · ')
    || doc.parts.some(part => part.id === a11ButtonId || part.id === a11LedId)) ? board : undefined
}

export function buildA11Fixture(fixtureId: string) {
  const board = getA11Fixture(fixtureId)
  if (!board) return
  const doc = circuit.build()
  boardPart(doc)!.value = { label: label(board) }
  const boardId = board.id
  const pinMap = { ...getFreestyleBoard(boardId).defaultPins, input: board.button.gpio, ledOut: board.led.gpio, trig: -1, echo: -1 }
  return { boardId, doc, pinMap }
}

export function validateA11Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap) {
  const board = getA11Board(boardId)
  if (!board || boardPart(doc)?.value?.label !== label(board) || pinMap.input !== board.button.gpio || pinMap.ledOut !== board.led.gpio) {
    return ['Chọn đúng board, GPIO25 và GPIO26 của mạch mẫu A11.']
  }
  return circuit.validate(doc)
}

export const a11DcNetlist = circuit.dcNetlist
