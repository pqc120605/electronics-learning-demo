import { esp32DevkitModel } from '../../data/esp32DevkitModel'
import { arduinoBoardModels } from '../../data/arduinoBoardModels'
import { espressifBoardModels } from '../../data/espressifBoardModels'
import { raspberryPiBoardModels } from '../../data/raspberryPiBoardModels'
import { stm32BoardModels } from '../../data/stm32BoardModels'
import { getBoardModelEvidence } from '../../data/boardModelSources'
import anchors from '../../data/board-pin-anchors.json'
import { getFreestyleBoard, pinDisplayName, SIGNAL_PINS, type PinMap, type SignalPin } from './freestyleCircuit'
import type { BoardModelManifest } from '../../components/board/boardSceneTypes'
import type { Bounds, Vec3 } from '../assemblyLayout'
import {getBoardTopView,type BoardDiagramPresentation} from '../boardTopView'

const models = [esp32DevkitModel,...arduinoBoardModels,...espressifBoardModels,...raspberryPiBoardModels,...stm32BoardModels]
const canonical: Record<string,string> = {'arduino-nano':'arduino-nano-classic','arduino-mega-2560':'arduino-mega-2560-r3','stm32-nucleo-f401re':'stm32-nucleo'}

export type FreestylePresentation = BoardDiagramPresentation & {canonicalId:string;family:string;photo?:string;pinMap?:PinMap;model:BoardModelManifest}
/** Bounds extracted from the existing GLBs by parseBoardGlb, in mm; visualization only. */
export const freestyleModelBounds: Record<string,Bounds> = {
 'esp32-devkit':{min:[120.799999,-8.625,91.465399],max:[173.65402,4.695,120.650001]},
 'esp32-s3-devkitc-1':{min:[-271.238988,-8.62429,170.1788],max:[-245.558988,8.88429,239.318803]},
 'arduino-uno-r3':{min:[107.450001,-2.305,78.333601],max:[182.791099,12.5,132.073596]},
 'arduino-nano-classic':{min:[126.911104,-8.545,96.1136],max:[170.091093,5.590904,113.8936]},
 'arduino-mega-2560-r3':{min:[90.970002,-2.305,78.333601],max:[199.301094,12.5,131.673604]},
 'raspberry-pi-pico':{min:[0,-0.5,-52.299999],max:[21,3.23,0]},
 'stm32-blue-pill-f103':{min:[-2.319751,-8.625,0],max:[60.84,10.135,22.86]},
 'stm32-nucleo':{min:[0,-1.505,-2.2],max:[70,10.135,82.500003]},
}
export function freestylePresentation(boardId: string, pinMap: PinMap): FreestylePresentation {
  const board = getFreestyleBoard(boardId), id = canonical[board.id] ?? board.id
  const model = id==='esp32-devkit'?esp32DevkitModel:models.find(m=>m.id===id)!
  const view:FreestylePresentation={ id: board.id,canonicalId:id,name:board.name,family:board.id.startsWith('esp32')?'esp32':board.id.startsWith('arduino')?'arduino':board.id.includes('pico')?'pico':'stm32',photo:`/board-reference/freestyle/${board.id}-top.png`,topView:getBoardTopView(id),pinMap,pinAnchors:{},revision:model.audit?.revision??getBoardModelEvidence(model.id)?.revision??'Mô hình tham chiếu',model,pinLabels:{...Object.fromEntries(SIGNAL_PINS.map(role=>[role,pinDisplayName(board.id,pinMap[role])])),gnd:'GND',vcc:board.id==='raspberry-pi-pico'?'3V3(OUT)':board.logic==='5 V'?'5V':'3V3',v5:board.id==='raspberry-pi-pico'?'VBUS':'5V'} }
  view.pinAnchors=Object.fromEntries(Object.keys(view.pinLabels).flatMap(role=>{const point=freestylePinAnchor(view,pinMap,role);return point?[[role,point]]:[]}))
  return view
}
/** Exact known source anchors only. Arduino's generated manifest positions are NOT used as CAD pads. */
export function freestylePinAnchor(view: FreestylePresentation, pinMap: PinMap, role: string): Vec3 | undefined {
  // STM32 manifests are educational reconstructions; estimated headers are not exact wire anchors.
  if(view.family==='stm32')return undefined
  const source = (anchors as unknown as Record<string,{boundsMm:Bounds;topYMm?:number;pins:Record<string,number[]>}>)[view.canonicalId]
  const label = view.pinLabels[role]
  if (view.family==='arduino') {
    const xy=source?.pins[label]
    return xy && source.topYMm!==undefined ? [xy[0],source.topYMm,xy[1]] : undefined
  }
  const num=pinMap[role as SignalPin]
  const pin = view.model.pins.find(pin=> Number.isFinite(num) && pin.gpio===num || (label && (pin.label===label || pin.label.split(' ')[0]===label)))
  return pin?.anchor ? pin.anchor.map(value=>value*1000) as Vec3 : undefined
}
