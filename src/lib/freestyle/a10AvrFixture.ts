import type { CircuitDocV2 } from '../circuitDocV2'
import { createNetIndexV2 } from '../circuitNetsV2'
import { a10Profiles, a10Revision, getA10Board, getA10Fixture, type A10Board } from './a10AvrRuntime'
import { buttonLedCircuit } from './buttonLedCircuit'
import type { CoupledCircuit } from './coupledCircuit'
import { getFreestyleBoard, type PinMap } from './freestyleBoards'

export const a10ButtonId = 'a10-button'
export const a10LedId = 'a10-led'
const circuits = new Map(a10Profiles.map(board => [board.id, buttonLedCircuit('a10', board.button.gpio, board.led.gpio)]))
const circuitFor = (board: A10Board) => circuits.get(board.id)!
const boardPart = (doc: CircuitDocV2) => doc.parts.find(part => part.type === 'board' && part.id === 'board')
const labelFor = (board: A10Board) => `${a10Revision} · ${board.revision}`

export function getActiveA10Board(boardId: string, doc: CircuitDocV2) {
  const board = getA10Board(boardId)
  return board && (boardPart(doc)?.value?.label?.startsWith(a10Revision + ' · ')
    || doc.parts.some(part => part.id === a10ButtonId || part.id === a10LedId)) ? board : undefined
}

export function buildA10Fixture(fixtureId: string) {
  const board = getA10Fixture(fixtureId)
  if (!board) return
  const doc = circuitFor(board).build()
  boardPart(doc)!.value = { label: labelFor(board) }
  const boardId = board.runnerId
  const pinMap = { ...getFreestyleBoard(boardId).defaultPins, input: board.button.gpio, ledOut: board.led.gpio }
  return { boardId, doc, pinMap }
}

export function compileA10Circuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap):
  { issues: string[]; graph?: undefined } | { issues: []; graph: CoupledCircuit } {
  const board = getA10Board(boardId)
  if (!board || boardId !== board.runnerId || boardPart(doc)?.value?.label !== labelFor(board)
      || pinMap.input !== board.button.gpio || pinMap.ledOut !== board.led.gpio) {
    return { issues: ['Chọn đúng board và hai chân GPIO trong mạch mẫu A10.'] }
  }
  const issues = circuitFor(board).validate(doc)
  if (issues.length) return { issues }

  // The topology check above guarantees each endpoint belongs to the five approved nets.
  const index = createNetIndexV2(doc)
  const net = (partId: string, pinId: string) => index.netOf(`${partId}:${pinId}`)!.key
  return { issues: [], graph: {
    board: board.runnerId,
    gpios: [{ pin: board.button.gpio, net: net('board', 'input') }, { pin: board.led.gpio, net: net('board', 'ledOut') }],
    rail5: [net('board', 'vcc')],
    ground: net('board', 'gnd'),
    parts: [
      { id: a10ButtonId, kind: 'button', pins: { contactA: net(a10ButtonId, 'contactA'), contactB: net(a10ButtonId, 'contactB') } },
      { id: a10LedId, kind: 'led', pins: { anode: net(a10LedId, 'anode'), cathode: net(a10LedId, 'cathode') } },
      ...['a10-pullup', 'a10-limit'].map(id => ({ id, kind: 'resistor' as const,
        resistanceOhm: doc.parts.find(part => part.id === id)!.value!.ohm!, pins: { a: net(id, 'a'), b: net(id, 'b') } })),
    ],
  } }
}

export const a10DcNetlist = (board: A10Board, pressed: boolean, outputHigh: boolean) => circuitFor(board).dcNetlist(pressed, outputHigh)
