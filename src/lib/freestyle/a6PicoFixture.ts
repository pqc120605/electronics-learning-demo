
import type { CircuitDocV2 } from '../circuitDocV2'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { buttonLedCircuit } from './buttonLedCircuit'
import { a6Pins, a6Revision, getA6Board, getA6Fixture, type A6Board } from './a6PicoProfiles'

export const a6ButtonId = 'a6-button'
export const a6LedId = 'a6-led'
const circuit = buttonLedCircuit('a6', a6Pins.button.gpio, a6Pins.led.gpio)

function boardLabel(profile: A6Board) {
  return a6Revision + ' · ' + profile.revision
}

function installedBoard(doc: CircuitDocV2) {
  return doc.parts.find(part => part.type === 'board' && part.id === 'board')
}

export function getActiveA6Board(boardId: string, doc: CircuitDocV2) {
  const profile = getA6Board(boardId)
  return profile && (installedBoard(doc)?.value?.label?.startsWith(a6Revision + ' · ')
    || doc.parts.some(part => part.id === a6ButtonId || part.id === a6LedId)) ? profile : undefined
}

export function buildA6Fixture(fixtureId: string) {
  const profile = getA6Fixture(fixtureId)
  if (!profile) return
  const boardId = profile.id
  const doc = circuit.build()
  const board = installedBoard(doc)!
  board.value = { label: boardLabel(profile) }
  return { boardId, doc, pinMap: getFreestyleBoard(boardId).defaultPins }
}

export function validateA6Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap) {
  const profile = getA6Board(boardId)
  if (!profile || installedBoard(doc)?.value?.label !== boardLabel(profile)
    || pinMap.input !== a6Pins.button.gpio || pinMap.ledOut !== a6Pins.led.gpio) {
    return ['Chọn đúng phiên bản board, GP14 và GP15 của mạch mẫu A6.']
  }
  return circuit.validate(doc)
}

export const a6DcNetlist = circuit.dcNetlist
