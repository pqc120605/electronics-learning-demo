import type { CircuitDocV2 } from '../circuitDocV2'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'
import { buttonLedCircuit } from './buttonLedCircuit'
import { a4Revision, getA4Board, getA4Fixture, type A4Board } from './a4EspProfiles'

export const a4ButtonId = 'a4-button'
export const a4LedId = 'a4-led'
const a4Circuit = buttonLedCircuit('a4', 5, 6)

function boardLabel(profile: A4Board) {
  return `${a4Revision} · ${profile.hardwareVariant} · ${profile.revision}`
}

function installedBoard(doc: CircuitDocV2) {
  return doc.parts.find(part => part.id === 'board' && part.type === 'board')
}

export function getActiveA4Board(boardId: string, doc: CircuitDocV2) {
  const profile = getA4Board(boardId)
  const label = installedBoard(doc)?.value?.label
  // Legacy DevKit drafts use the same board ID but carry no A4 circuit marker.
  return profile && (label?.startsWith(a4Revision + ' · ') || doc.parts.some(part => part.id === a4ButtonId || part.id === a4LedId))
    ? profile : undefined
}

export function buildA4Fixture(fixtureId: string) {
  const profile = getA4Fixture(fixtureId)
  if (!profile) return
  const boardId = profile.id
  const doc = a4Circuit.build()
  const board = installedBoard(doc)
  if (board) board.value = { label: boardLabel(profile) }
  // The generic DevKit also uses GPIO6 for TRIG, which is unused in A4.
  const pinMap = { ...getFreestyleBoard(boardId).defaultPins, input: profile.button.gpio, ledOut: profile.led.gpio, trig: -1, echo: -1 }
  return { boardId, doc, pinMap }
}

export function validateA4Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap) {
  const profile = getA4Board(boardId)
  if (!profile || installedBoard(doc)?.value?.label !== boardLabel(profile)
    || pinMap.input !== profile.button.gpio || pinMap.ledOut !== profile.led.gpio) {
    return ['Chọn đúng phiên bản board và hai chân GPIO của mạch mẫu A4.']
  }
  return a4Circuit.validate(doc)
}

export const a4DcNetlist = a4Circuit.dcNetlist
