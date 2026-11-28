import { esp32DevkitModel } from '../../data/esp32DevkitModel'
import { arduinoBoardModels } from '../../data/arduinoBoardModels'
import { espressifBoardModels } from '../../data/espressifBoardModels'
import { raspberryPiBoardModels } from '../../data/raspberryPiBoardModels'
import { stm32BoardModels } from '../../data/stm32BoardModels'
import { remainingCatalogBoardModels } from '../../data/remainingCatalogBoardModels'
import { seeedBoardModels } from '../../data/seeedBoardModels'
import { adafruitBoardModels } from '../../data/adafruitBoardModels'
import { getBoardModelEvidence } from '../../data/boardModelSources'
import { getFreestyleBoard, pinDisplayName, SIGNAL_PINS, type PinMap, type SignalPin } from './freestyleCircuit'
import type { BoardModelManifest } from '../../components/board/boardSceneTypes'
import type { Bounds, Vec3 } from '../assemblyLayout'
import {getBoardTopView,type BoardDiagramPresentation} from '../boardTopView'
import { getA3Board } from './a3EspProfiles'
import { getA4Board } from './a4EspProfiles'
import { getActiveA4Board } from './a4EspFixture'
import { getActiveA5Board } from './a5PicoFixture'
import { getActiveA6Board } from './a6PicoFixture'
import { getActiveA7Board } from './a7Stm32Fixture'
import { getA7Board } from './a7Stm32Profiles'
import { getActiveA8Board } from './a8Ra4m1Fixture'
import { getA8Board } from './a8Ra4m1Profiles'
import { getActiveA9Board } from './a9Stm32Fixture'
import { getA9Board } from './a9Stm32Profiles'
import { getActiveA10Board } from './a10AvrFixture'
import { getActiveA11Board } from './a11EspFixture'
import { getActiveA12Board } from './a12Fixture'
import { getA12Board } from './a12Profiles'
import { approvedArduinoBoardModels } from '../../data/approvedArduinoBoardModels'
import type { CircuitDocV2 } from '../circuitDocV2'

const models = [esp32DevkitModel,...arduinoBoardModels,...espressifBoardModels,...raspberryPiBoardModels,...stm32BoardModels,
  ...[...remainingCatalogBoardModels, ...seeedBoardModels, ...adafruitBoardModels, ...approvedArduinoBoardModels].filter(model =>
    model.id === 'esp32-c3-devkitm-1' || model.id === 'esp32-devkitm-1' || getA3Board(model.id) || getA4Board(model.id) || getA8Board(model.id) || getA9Board(model.id) || getA12Board(model.id))]
const canonical: Record<string,string> = {'arduino-nano':'arduino-nano-classic','arduino-mega-2560':'arduino-mega-2560-r3','stm32-nucleo-f401re':'stm32-nucleo'}

export type FreestylePresentation = BoardDiagramPresentation & {canonicalId:string;family:string;photo?:string;pinMap?:PinMap;model:BoardModelManifest;bounds?:Bounds;fixture?: ReturnType<typeof getA3Board> | ReturnType<typeof getA4Board> | ReturnType<typeof getActiveA5Board> | ReturnType<typeof getActiveA6Board> | ReturnType<typeof getActiveA7Board> | ReturnType<typeof getActiveA8Board> | ReturnType<typeof getActiveA9Board> | ReturnType<typeof getActiveA10Board> | ReturnType<typeof getActiveA11Board> | ReturnType<typeof getActiveA12Board>}
/** Bounds extracted from the existing GLBs by parseBoardGlb, in mm; visualization only. */
export const freestyleModelBounds: Record<string,Bounds> = {
 'esp32-devkit':{min:[120.799999,-8.625,91.465399],max:[173.65402,4.695,120.650001]},
 'esp32-s2-devkitc-1':{min:[-12.7,-1.5,-37.769999],max:[12.7,5.9,31.819999]},
 'arduino-nano-every':{min:[-21.59,0,-8.89],max:[21.59,4.35,8.89]},
 'esp32-devkitm-1':{min:[-12.7,-1.5,-21.905],max:[12.7,5.9,22.355]},
 'esp32-c3-devkitm-1':{min:[-12.7,-1.5,-19.455],max:[12.7,5.9,19.905]},
 'seeed-xiao-esp32c3':{min:[137.8706,-0.075,95.478602],max:[158.978596,3.145,114.528596]},
 'adafruit-qtpy-esp32-c3-5405':{min:[-8.89,-1.885,-11.397831],max:[8.89,4.006878,10.3505]},
 'esp32-c6-devkitc-1':{min:[-12.7,-1.5,-32.299999],max:[12.7,5.9,26.350001]},
 'esp32-h2-devkitm-1':{min:[-12.7,-1.5,-30.53],max:[12.7,5.9,24.58]},
 'esp32-s3-devkitc-1':{min:[-271.238988,-8.62429,170.1788],max:[-245.558988,8.88429,239.318803]},
 'seeed-xiao-esp32-s3':{min:[-10.4775,-0.625,-8.89],max:[12.004481,3.835,8.89]},
 'adafruit-feather-esp32-s3-5323':{min:[-26.482999,-0.785,-11.43],max:[25.739999,5.585,11.43]},
 'adafruit-feather-esp32-s3-tft-5483':{min:[-25.4,-5.585,-11.43],max:[26.482999,3.335,11.43]},
 'arduino-nano-esp32':{min:[-22.701954,-3.2,-8.89],max:[21.59,8.5,8.890076]},
 'arduino-uno-r3':{min:[107.450001,-2.305,78.333601],max:[182.791099,12.5,132.073596]},
 'arduino-nano-classic':{min:[126.911104,-8.545,96.1136],max:[170.091093,5.590904,113.8936]},
 'arduino-uno-r4-minima':{min:[-36.25004,-4.686002,-26.67],max:[34.290001,9.813998,26.67]},
 'arduino-uno-r4-wifi':{min:[-36.25004,-4.606321,-26.67],max:[34.290001,9.893678,26.67]},
 'arduino-mega-2560-r3':{min:[90.970002,-2.305,78.333601],max:[199.301094,12.5,131.673604]},
 'raspberry-pi-pico':{min:[0,-0.5,-52.299999],max:[21,3.23,0]},
 'raspberry-pi-pico-w':{min:[0,-0.9607,-52.35],max:[21,2.694706,0]},
 'raspberry-pi-pico-2':{min:[-10.5,-0.075,-26.8],max:[10.5,3.69,25.5]},
 'raspberry-pi-pico-2-h':{min:[-10.5,-6,-26.8],max:[10.5,6.569583,25.5]},
 'stm32-blue-pill-f103':{min:[-2.319751,-8.625,0],max:[60.84,10.135,22.86]},
 'stm32-nucleo-l476rg':{min:[-35,-1.5,-42.5],max:[35,10.91,41.499998]},
 'stm32-nucleo':{min:[0,-1.505,-2.2],max:[70,10.135,82.500003]},
}
export function freestylePresentation(boardId: string, pinMap: PinMap, doc?: CircuitDocV2): FreestylePresentation {
  const board = getFreestyleBoard(boardId), id = canonical[board.id] ?? board.id
  const a7 = getA7Board(board.id)
  const model = id === 'esp32-devkit' ? esp32DevkitModel : (a7 ? remainingCatalogBoardModels : models).find(item => item.id === id)!
  const view:FreestylePresentation={ id: board.id,canonicalId:id,name:board.name,family:board.id.startsWith('esp32')?'esp32':board.id.startsWith('arduino')?'arduino':board.id.includes('pico')?'pico':'stm32',photo:`/board-reference/freestyle/${board.id}-top.png`,topView:getBoardTopView(id),pinMap,pinAnchors:{},revision:model.audit?.revision??getBoardModelEvidence(model.id)?.revision??'Mô hình tham chiếu',model,pinLabels:{...Object.fromEntries(SIGNAL_PINS.map(role=>[role,pinDisplayName(board.id,pinMap[role])])),gnd:'GND',vcc:board.id==='raspberry-pi-pico'?'3V3(OUT)':board.logic==='5 V'?'5V':'3V3',v5:board.id==='raspberry-pi-pico'?'VBUS':'5V'} }
  const a4 = doc && getActiveA4Board(id, doc)
  const a5 = doc && getActiveA5Board(id, doc)
  const a6 = doc && getActiveA6Board(id, doc)
  if (a7) view.bounds = { min: [-35, -1.5, -42.5], max: [35, 10.91, 41.499998] }
  const activeA7 = doc && getActiveA7Board(board.id, doc)
  const activeA8 = doc && getActiveA8Board(board.id, doc)
  const activeA9 = doc && getActiveA9Board(board.id, doc)
  const activeA10 = doc && getActiveA10Board(board.id, doc)
  const activeA11 = doc && getActiveA11Board(board.id, doc)
  const activeA12 = doc && getActiveA12Board(board.id, doc)
  const pinned = activeA12 || activeA11 || activeA10 || activeA9 || activeA8 || activeA7 || a6 || a5 || a4
  const fixture = pinned || getA3Board(id)
  if (fixture) {
    view.fixture = fixture
    view.family = activeA8 || activeA10 || activeA12?.id === 'arduino-nano-every' ? 'arduino' : activeA7 || activeA9 ? 'stm32' : a6 || a5 ? 'pico' : 'esp32'
    view.photo = view.topView?.image
    view.revision = fixture.revision
    view.pinLabels = {
      input: pinned && pinMap.input === pinned.button.gpio ? pinned.button.label : pinDisplayName(board.id, pinMap.input),
      ledOut: pinned && pinMap.ledOut === pinned.led.gpio ? pinned.led.label : pinDisplayName(board.id, pinMap.ledOut),
      vcc: fixture.power.label, gnd: fixture.ground.label,
    }
  }
  view.pinAnchors=Object.fromEntries(Object.keys(view.pinLabels).flatMap(role=>{const point=freestylePinAnchor(view,pinMap,role);return point?[[role,point]]:[]}))
  return view
}
/** Wire endpoints share the CAD pad anchors used by the board inspector. */
export function freestylePinAnchor(view: FreestylePresentation, pinMap: PinMap, role: string): Vec3 | undefined {
  const fixture = view.fixture
  if (fixture) {
    const pads: Record<string, string> = { vcc: fixture.power.pinId, gnd: fixture.ground.pinId }
    if (pinMap.input === fixture.button.gpio) pads.input = fixture.button.pinId
    if (pinMap.ledOut === fixture.led.gpio) pads.ledOut = fixture.led.pinId
    const pad = view.model.pins.find(pin => pin.id === pads[role])
    return pad?.anchor?.map(value => value * 1000) as Vec3 | undefined
  }
  // STM32 manifests are educational reconstructions; estimated headers are not exact wire anchors.
  if(view.family==='stm32')return undefined
  if (view.id === 'esp32-c3-devkitm-1') {
    const pads: Record<string, string> = { vcc: 'J1:2', gnd: 'J1:1', ledOut: 'J1:11', input: 'J3:11' }
    const pin = view.model.pins.find(pin => `${pin.headerReference}:${pin.padNumber}` === pads[role])
    return pin?.anchor?.map(value => value * 1000) as Vec3 | undefined
  }
  const label = view.pinLabels[role]
  if (view.family==='arduino') {
    const pin = view.model.pins.find(pin => /^pin-\d+$/.test(pin.id) && pin.label.split('/')[0] === label)
    return pin?.anchor?.map(value => value * 1000) as Vec3 | undefined
  }
  const num=pinMap[role as SignalPin]
  const pin = view.model.pins.find(pin=> Number.isFinite(num) && pin.gpio===num || (label && (pin.label===label || pin.label.split(' ')[0]===label)))
  return pin?.anchor ? pin.anchor.map(value=>value*1000) as Vec3 : undefined
}
