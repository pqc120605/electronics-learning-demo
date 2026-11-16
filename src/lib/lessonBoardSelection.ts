import {boards,type BoardSummary} from '../data/boards'
import {simulationTargets,type SimulationTarget} from '../data/simulationTargets'
const aliases:Record<string,string>={esp32:'esp32-devkit',uno:'arduino-uno-r3',nano:'arduino-nano-classic',stm32:'stm32-nucleo','arduino-nano':'arduino-nano-classic','arduino-mega-2560':'arduino-mega-2560-r3','stm32-nucleo-f401re':'stm32-nucleo','esp32-devkit-v1-30pin':'esp32-devkit'}
export type LessonBoardChoice={kind:'unselected'}|{kind:'unknown';requestedId:string}|{kind:'reference';requestedId:string;board:BoardSummary}|{kind:'selected';target:SimulationTarget}
/** Never call the legacy normalizer here: its fallback is an implicit ESP32 choice. */
export function resolveLessonBoardChoice(raw:string|null|undefined):LessonBoardChoice {
 if(!raw?.trim())return {kind:'unselected'}
 const id=aliases[raw]??raw,target=simulationTargets.find(target=>target.boardId===id)
 if(target)return {kind:'selected',target}
 const board=boards.find(board=>board.id===id)
 return board?{kind:'reference',requestedId:raw,board}:{kind:'unknown',requestedId:raw}
}
/** Read-only recovery hint; malformed/unknown data is never replaced by a default. */
export function savedLessonBoard(raw:string|null):string|undefined {
 try{if(!raw)return;const value=JSON.parse(raw),id=value?.boardId??value?.board??value?.simBoard;if(typeof id!=='string')return;const choice=resolveLessonBoardChoice(id);return choice.kind==='selected'?choice.target.boardId:undefined}catch{return}
}
