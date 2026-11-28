import type { CircuitDocV2 } from '../circuitDocV2'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { buttonLedCircuit } from './buttonLedCircuit'
import { a5Pins, a5Revision, getA5Board, getA5Fixture, type A5Board } from './a5PicoProfiles'

export const a5ButtonId = 'a5-button'
export const a5LedId = 'a5-led'
const a5Circuit = buttonLedCircuit('a5', a5Pins.button.gpio, a5Pins.led.gpio)

function boardLabel(profile: A5Board) {
  return `${a5Revision} · ${profile.pcbRevision}`
}

function installedBoard(doc: CircuitDocV2) {
  return doc.parts.find(part => part.id === 'board' && part.type === 'board')
}

export function getActiveA5Board(boardId: string, doc: CircuitDocV2) {
  const profile = getA5Board(boardId)
  const marked = installedBoard(doc)?.value?.label?.startsWith(a5Revision + ' · ')
  return profile && (marked || doc.parts.some(part => part.id === a5ButtonId || part.id === a5LedId)) ? profile : undefined
}

export function buildA5Fixture(fixtureId: string) {
  const profile = getA5Fixture(fixtureId)
  if (!profile) return
  const boardId = profile.id
  const doc = a5Circuit.build()
  const board = installedBoard(doc)
  if (board) board.value = { label: boardLabel(profile) }
  const pinMap = { ...getFreestyleBoard(boardId).defaultPins, input: profile.button.gpio, ledOut: profile.led.gpio, trig: -1, echo: -1 }
  return { boardId, doc, pinMap }
}

export function validateA5Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap) {
  const profile = getA5Board(boardId)
  if (!profile || installedBoard(doc)?.value?.label !== boardLabel(profile)
    || pinMap.input !== profile.button.gpio || pinMap.ledOut !== profile.led.gpio) {
    return ['Chọn đúng phiên bản board, GP14 và GP15 của mạch mẫu A5.']
  }
  return a5Circuit.validate(doc)
}

export const a5DcNetlist = a5Circuit.dcNetlist
