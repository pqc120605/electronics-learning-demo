/** Deterministic educational GPIO simulator. It models logic events, not analog electricity. */
export type EduInstruction =
  | { op: 'pinMode'; pin: number; mode: 'INPUT'|'OUTPUT' }
  | { op: 'digitalWrite'; pin: number; value: 0|1 }
  | { op: 'delay'; ms: number }
  | { op: 'readInput'; pin: number; source: 'button' }
export type EduProgram = { setup: EduInstruction[]; loop: EduInstruction[] }
export type EduState = { pc: number; output: Record<number,0|1>; modes: Record<number,'INPUT'|'OUTPUT'>; ledOn: boolean; elapsedMs: number; messages: string[]; halted: boolean }
export const starterEduProgram: EduProgram = {setup:[{op:'pinMode',pin:23,mode:'OUTPUT'}],loop:[{op:'digitalWrite',pin:23,value:1},{op:'delay',ms:500},{op:'digitalWrite',pin:23,value:0},{op:'delay',ms:500}]}
/** GPIO follows the program; the LED also needs a valid circuit path. */
export function deriveOutputState({active,gpioHigh,ledOn,circuitValid}:{active:boolean;gpioHigh:boolean;ledOn:boolean;circuitValid:boolean}) { return {gpioHigh:active&&gpioHigh,ledLit:active&&ledOn&&circuitValid} }
export function initialEduState(pin=23): EduState { return {pc:0,output:{},modes:{[pin]:'OUTPUT'},ledOn:false,elapsedMs:0,messages:[`Mô phỏng bắt đầu. Chân ${pin} được cấu hình làm đầu ra.`],halted:false} }
export function stepEduProgram(state:EduState, program:EduProgram=starterEduProgram, inputButton=false):EduState {
  if(state.halted || program.loop.length===0)return {...state,halted:true}
  const instruction=program.loop[state.pc%program.loop.length]
  const next={...state,output:{...state.output},modes:{...state.modes},messages:[] as string[],pc:(state.pc+1)%program.loop.length,halted:false}
  if(instruction.op==='pinMode'){next.modes[instruction.pin]=instruction.mode;next.messages=[`GPIO ${instruction.pin} → ${instruction.mode}`]}
  else if(instruction.op==='digitalWrite'){next.output[instruction.pin]=instruction.value;next.ledOn=instruction.value===1;next.messages=[`digitalWrite(${instruction.pin}, ${instruction.value?'HIGH':'LOW'})`,next.ledOn?'LED sáng theo trạng thái logic HIGH.':'LED tắt theo trạng thái logic LOW.']}
  else if(instruction.op==='delay'){next.elapsedMs+=instruction.ms;next.messages=[`delay(${instruction.ms}) · trạng thái đầu ra được giữ trong khoảng chờ.`]}
  else { next.output[instruction.pin]=inputButton?1:0; next.messages=[`digitalRead(${instruction.pin}) → ${inputButton?'HIGH':'LOW'} (đầu vào ảo)`] }
  return next
}
export function runEduSteps(state:EduState,count:number,program:EduProgram=starterEduProgram,inputButton=false):EduState {
  let current=state
  for(let i=0;i<Math.max(0,Math.min(count,100));i++) current=stepEduProgram(current,program,inputButton)
  return current
}
