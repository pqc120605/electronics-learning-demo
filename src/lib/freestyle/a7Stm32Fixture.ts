import type { CircuitDocV2 } from '../circuitDocV2'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { buttonLedCircuit } from './buttonLedCircuit'
import { a7Pins, a7Revision, getA7Board, getA7Fixture, type A7Board } from './a7Stm32Profiles'

export const a7ButtonId = 'a7-button'
export const a7LedId = 'a7-led'
const circuit = buttonLedCircuit('a7', a7Pins.button.gpio, a7Pins.led.gpio)

const boardLabel = (profile: A7Board) => a7Revision + ' · ' + profile.revision
const installedBoard = (doc: CircuitDocV2) => doc.parts.find(part => part.type === 'board' && part.id === 'board')

export function getActiveA7Board(boardId: string, doc: CircuitDocV2) {
  const profile = getA7Board(boardId)
  return profile && (installedBoard(doc)?.value?.label?.startsWith(a7Revision + ' · ')
    || doc.parts.some(part => part.id === a7ButtonId || part.id === a7LedId)) ? profile : undefined
}

export function buildA7Fixture(fixtureId: string) {
  const profile = getA7Fixture(fixtureId)
  if (!profile) return
  const boardId = profile.id
  const doc = circuit.build()
  installedBoard(doc)!.value = { label: boardLabel(profile) }
  return { boardId, doc, pinMap: getFreestyleBoard(boardId).defaultPins }
}

export function validateA7Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap) {
  const profile = getA7Board(boardId)
  if (!profile || installedBoard(doc)?.value?.label !== boardLabel(profile)
    || pinMap.input !== a7Pins.button.gpio || pinMap.ledOut !== a7Pins.led.gpio) {
    return ['Chọn đúng phiên bản board, PA10 và PB5 của mạch mẫu A7.']
  }
  return circuit.validate(doc)
}

export const a7DcNetlist = circuit.dcNetlist
