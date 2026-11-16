import {getInputAlias,type BuilderLessonId} from '../data/builderLessons'
import type {SimulationTarget} from '../data/simulationTargets'
import {freestyleBoards,type PinMap} from './freestyle/freestyleCircuit'
import {freestylePresentation,freestylePinAnchor} from './freestyle/freestylePresentation'
import type {BoardDiagramPresentation} from './boardTopView'
import {getLessonPreflight} from './lessonPreflight'
const freestyleIds:Record<string,string>={'arduino-nano-classic':'arduino-nano','arduino-mega-2560-r3':'arduino-mega-2560','stm32-nucleo':'stm32-nucleo-f401re'}
export function lessonBoardPresentation(target:SimulationTarget,lesson:BuilderLessonId):BoardDiagramPresentation {
 const id=freestyleIds[target.boardId]??target.boardId,board=freestyleBoards.find(board=>board.id===id)
 if(!board){const preflight=getLessonPreflight(lesson,target.boardId);return {id:target.boardId,name:target.name,revision:preflight.revision,pinLabels:Object.fromEntries(preflight.pins.map(pin=>[pin.boardPinId,pin.boardLabel])),pinAnchors:{}}}
 const input=getInputAlias(target,lesson).pin,pinMap:PinMap={...board.defaultPins,ledOut:target.codePin,input,trig:input,echo:input+1}
 const result=freestylePresentation(board.id,pinMap)
 for(const [index,pin]of (target.sevenSegmentPins??[]).entries()){
  const role=`seg${index}`,label=target.boardId==='esp32-devkit'?`GPIO ${pin}`:`D${pin}`
  result.pinLabels[role]=label
  const point=freestylePinAnchor(result,{...pinMap,[role]:pin},role)
  if(point)result.pinAnchors[role]=point
 }
 return {...result,id:target.boardId,name:target.name}
}
