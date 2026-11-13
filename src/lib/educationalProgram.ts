import type { BuilderLessonId } from '../data/builderLessons'
import { getBuilderLesson, getInputAlias, getLessonBoardSupport } from '../data/builderLessons'
import { simulationTargets, type SimulationTarget } from '../data/simulationTargets'
import { calculateLdrDivider } from './analogDivider'

type LogicLevel = 'HIGH' | 'LOW'
type InputBranchSourceLines = Partial<Record<'read' | 'branch' | 'whenTrue' | 'whenFalse', number>>
type InputBranchEvents = [
  { kind: 'read'; pin: number; level: LogicLevel; line?: number },
  { kind: 'branch'; condition: LogicLevel; level: LogicLevel; branch: 'if' | 'else'; line?: number },
  { kind: 'write'; pin: number; level: LogicLevel; line?: number },
]
export type EducationalProgramEvent = InputBranchEvents[number]

export type EducationalProgram =
  | { kind:'blink'; pin:number; onMs:number; offMs:number; on:'HIGH'|'LOW'; off:'HIGH'|'LOW' }
  | { kind:'input-branch'; inputPin:number; outputPin:number; source:'button'|'sensor'; condition:LogicLevel; whenTrue:LogicLevel; whenFalse:LogicLevel; debounceMs:number; sourceLines?:InputBranchSourceLines }
  | { kind:'ultrasonic'; outputPin:number; triggerPin:number; echoPin:number; thresholdCm:number; whenNear:'HIGH'|'LOW'; whenFar:'HIGH'|'LOW'; sampleMs:number }
  | { kind:'seven-segment'; pins:number[]; digits:number[][]; common:'cathode'|'anode'; stepMs:number }
  | { kind:'analog-threshold'; inputPin:number; outputPin:number; threshold:number; above:'HIGH'|'LOW'; below:'HIGH'|'LOW'; sampleMs:number; sensor:'potentiometer'|'ldr'; adcFullScale:number }
  | { kind:'concept'; lesson:'buck-boost-concept'|'dc-motor-driver'|'mosfet-switch' }
export type ProgramParseResult = {ok:true;program:EducationalProgram}|{ok:false;line:number;message:string}

const MAX_SOURCE_CHARACTERS=20_000
const strip=(source:string)=>source.replace(/\/\*[\s\S]*?\*\//g,'').split(/\r?\n/).map((line)=>line.replace(/\/\/.*$/,'').trim()).filter(Boolean)
const fail=(message:string,line=1):ProgramParseResult=>({ok:false,line,message})
function hasMain(source:string){let depth=0;for(const char of source){if(char==='{')depth++;if(char==='}')depth--;if(depth<0)return false}return depth===0&&/void\s+setup\s*\(\s*\)\s*\{/.test(source)&&/void\s+loop\s*\(\s*\)\s*\{/.test(source)}
function functionBlock(source: string, name: string) {
  const start = new RegExp(`void\\s+${name}\\s*\\(\\s*\\)\\s*\\{`).exec(source)
  if (!start) return undefined
  const bodyStart = start.index + start[0].length
  let depth = 1
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === '{') depth++
    else if (source[index] === '}' && --depth === 0) {
      return { start: start.index, bodyStart, end: index + 1, body: source.slice(bodyStart, index) }
    }
  }
}
const functionBody = (source: string, name: string) => functionBlock(source, name)?.body
function readPin(source:string,name:string){const match=new RegExp(`(?:const\\s+int|int)\\s+${name}\\s*=\\s*(\\d+)\\s*;`).exec(source);return match?Number(match[1]):undefined}
function outputs(source:string){const match=/digitalWrite\s*\(\s*ledPin\s*,\s*(HIGH|LOW)\s*\)/g;return [...source.matchAll(match)].map(item=>item[1] as 'HIGH'|'LOW')}

function parseInputBranch(source: string, lesson: 'button-led' | 'ir-alert', boardId?: string): ProgramParseResult {
  const button = lesson === 'button-led'
  const inputName = button ? 'buttonPin' : 'sensorPin'
  const inputPin = readPin(source, inputName)
  const outputPin = readPin(source, 'ledPin')
  const setup = functionBlock(source, 'setup')
  const loop = functionBlock(source, 'loop')
  if (inputPin === undefined || outputPin === undefined || !setup || !loop) {
    return fail(`Thiếu khai báo và pinMode(${inputName}, INPUT...).`)
  }

  const [first, second] = setup.start < loop.start ? [setup, loop] : [loop, setup]
  const decimal = '(?:0|[1-9]\\d*)'
  const declaration = (pin: string) => String.raw`(?:const\s+)?int\s+${pin}\s*=\s*${decimal}\s*;`
  const pinDeclarations = new RegExp(`^\\s*(?:${declaration('ledPin')}\\s*${declaration(inputName)}|${declaration(inputName)}\\s*${declaration('ledPin')})\\s*$`)
  if (!pinDeclarations.test(source.slice(0, first.start)) || source.slice(first.end, second.start).trim() || source.slice(second.end).trim()) {
    return fail('Chỉ hỗ trợ khai báo chân LED và chân đầu vào cùng setup() và loop() của bài mẫu.')
  }

  const outputMode = String.raw`pinMode\s*\(\s*ledPin\s*,\s*OUTPUT\s*\)\s*;`
  const inputMode = String.raw`pinMode\s*\(\s*${inputName}\s*,\s*${button ? 'INPUT_PULLUP' : 'INPUT(?:_PULLUP)?'}\s*\)\s*;`
  if (!new RegExp(`^\\s*(?:${outputMode}\\s*${inputMode}|${inputMode}\\s*${outputMode})\\s*$`).test(setup.body)) {
    return fail(button ? 'Mạch mẫu nối nút xuống GND và không có điện trở kéo lên, nên cần pinMode(buttonPin, INPUT_PULLUP).' : 'setup() cần đúng hai lệnh pinMode cho sensorPin và ledPin.')
  }

  const read = String.raw`(?<read>digitalRead)\s*\(\s*${inputName}\s*\)`
  const prefix = button ? '' : String.raw`int\s+detected\s*=\s*${read}\s*;\s*`
  const write = (branch: string) => String.raw`\{\s*(?<${branch}>digitalWrite)\s*\(\s*ledPin\s*,\s*(?<${branch}Level>HIGH|LOW)\s*\)\s*;\s*\}`
  const pattern = new RegExp(String.raw`^\s*${prefix}(?<branch>if)\s*\(\s*${button ? read : 'detected'}\s*==\s*(?<condition>LOW|HIGH)\s*\)\s*${write('whenTrue')}\s*else\s*${write('whenFalse')}\s*delay\s*\(\s*(?<delay>${decimal})\s*\)\s*;\s*$`, 'd')
  const match = pattern.exec(loop.body)
  const debounceMs = Number(match?.groups?.delay)
  if (!match?.groups || !Number.isSafeInteger(debounceMs)) {
    return fail('Chưa hỗ trợ: loop cần đúng mẫu đọc input, một nhánh if/else điều khiển LED và một delay; lệnh ngoài mẫu bị từ chối.')
  }

  if (boardId !== undefined) {
    const target = simulationTargets.find(profile => profile.boardId === boardId)
    if (!target || !getLessonBoardSupport(target, lesson).supported
      || target.codePin !== outputPin || getInputAlias(target, lesson).pin !== inputPin) {
      return fail('Alias chân đầu vào hoặc LED không khớp với profile board được hỗ trợ.')
    }
  }

  const sourceLines: InputBranchSourceLines = {}
  for (const key of ['read', 'branch', 'whenTrue', 'whenFalse'] as const) {
    const offset = match.indices?.groups?.[key]?.[0]
    if (offset !== undefined) {
      sourceLines[key] = source.slice(0, loop.bodyStart + offset).split(/\r\n|\r|\n/).length
    }
  }
  return { ok: true, program: {
    kind: 'input-branch', inputPin, outputPin, source: button ? 'button' : 'sensor', debounceMs, sourceLines,
    condition: match.groups.condition as LogicLevel,
    whenTrue: match.groups.whenTrueLevel as LogicLevel,
    whenFalse: match.groups.whenFalseLevel as LogicLevel,
  } }
}

/** A deliberately small parser for documented teaching patterns. It never evaluates source text. */
export function parseEducationalProgram(source:string,lesson:BuilderLessonId,boardId?:string):ProgramParseResult {
  if(typeof source!=='string')return fail('Bản nháp code không hợp lệ. Hãy khôi phục code mẫu của bài.')
  if(source.length>MAX_SOURCE_CHARACTERS)return fail(`Code quá dài cho mô phỏng bài học (tối đa ${MAX_SOURCE_CHARACTERS} ký tự). Hãy khôi phục code mẫu.`)
  if(lesson==='buck-boost-concept'||lesson==='dc-motor-driver'||lesson==='mosfet-switch'){
    const expected=getBuilderLesson(lesson).code({codePin:0} as SimulationTarget,0)
    if(source.trim()!==expected.trim())return fail('Bài này dùng kịch bản khái niệm có kiểm soát; sửa code tùy ý chưa được chạy mô phỏng. Khôi phục code mẫu hoặc dùng bài GPIO để tự luyện cú pháp được hỗ trợ.')
    return {ok:true,program:{kind:'concept',lesson}}
  }
  if(lesson==='source-led')lesson='blink'
  const inputLesson = lesson === 'button-led' || lesson === 'ir-alert' ? lesson : undefined
  // C++ splices continued lines before interpreting comments. Reject that syntax before masking.
  if (inputLesson && /\\[ \t\f\v]*(?:\r\n|\r|\n)/.test(source)) {
    return fail('Bài học chưa hỗ trợ nối dòng bằng dấu gạch chéo ngược.')
  }
  // Mask comments for input traces so captured token offsets still refer to the original source.
  const clean = inputLesson
    ? source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, comment => comment.replace(/[^\r\n]/g, ' '))
    : strip(source).join('\n')
  if(!hasMain(clean))return fail('Cần đúng hai hàm setup() và loop() với khối lệnh hợp lệ.')
  // The teaching parser accepts only a small, known subset. Never execute or silently
  // pretend to simulate arbitrary C++ pasted into this editor.
  if(/#\s*include|\b(while|do|switch|case|goto|class|struct|new|delete|Serial|analogWrite|attachInterrupt|millis|micros|String)\b/i.test(clean))return fail('Có cú pháp ngoài phạm vi mô phỏng bài học. Hãy dùng code mẫu và các lệnh được hướng dẫn.')
  const functionHeaders=[...clean.matchAll(/\b(?:void|int|long|float|byte)\s+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/g)].map(match=>match[1])
  if(functionHeaders.length!==2||functionHeaders.some(name=>name!=='setup'&&name!=='loop')||!/^\s*(?:const\s+int|int|const\s+byte|byte)\b/.test(clean))return fail('Chỉ hỗ trợ khai báo biến đơn giản cùng setup() và loop() của bài mẫu.')
  const callNames=[...clean.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)].map(match=>match[1])
  if(callNames.some(name=>!['setup','loop','pinMode','digitalWrite','digitalRead','analogRead','map','delay','delayMicroseconds','pulseIn','if','for'].includes(name)))return fail('Có lời gọi hàm không nằm trong tập lệnh được hỗ trợ; luồng mô phỏng đã dừng.')
  if((clean.match(/void\s+setup\s*\(\s*\)/g)??[]).length!==1||(clean.match(/void\s+loop\s*\(\s*\)/g)??[]).length!==1)return fail('Chương trình cần đúng một setup() và một loop().')
  const loops=[...clean.matchAll(/for\s*\(([^)]*)\)/g)].map(match=>match[1].replace(/\s+/g,''))
  if(lesson!=='seven-segment-counter'&&loops.length)return fail('Vòng lặp for chỉ được hỗ trợ trong bài LED 7 đoạn.')
  if (inputLesson) return parseInputBranch(clean, inputLesson, boardId)
  const ledPin=lesson==='seven-segment-counter'?0:readPin(clean,'ledPin');if(ledPin===undefined)return fail('Thiếu khai báo const int ledPin = số;')
  if(lesson!=='seven-segment-counter'&&!/pinMode\s*\(\s*ledPin\s*,\s*OUTPUT\s*\)/.test(clean))return fail('setup() cần cấu hình ledPin là OUTPUT.')
  const writes=outputs(clean)
  if(lesson!=='seven-segment-counter'&&!/^\s*(?:pinMode\s*\(\s*\w+\s*,\s*(?:OUTPUT|INPUT|INPUT_PULLUP)\s*\)\s*;\s*)+$/.test(functionBody(clean,'setup')??''))return fail('setup() chỉ hỗ trợ các lệnh pinMode; lệnh điều khiển cần nằm trong loop().')
  if(lesson==='blink'&&/\bif\s*\(|\belse\b/.test(clean))return fail('Bài LED nhấp nháy chỉ hỗ trợ hai pha digitalWrite/delay; không hỗ trợ nhánh điều kiện trong loop().')
  if(lesson==='analog-potentiometer'||lesson==='analog-ldr'){
    const isLdr=lesson==='analog-ldr',inputName=isLdr?'ldrPin':'potPin',valueName=isLdr?'lightPercent':'potPercent',inputPin=readPin(clean,inputName)
    if(/analogRead\s*\([^)]*\)\s*\*/.test(clean))return fail('Biểu thức analogRead(...) * 100 có thể tràn int 16-bit trên Arduino AVR. Hãy dùng map(analogRead(chân), 0, ADC_MAX, 0, 100).')
    const scaledRead=`int\\s+${valueName}\\s*=\\s*map\\s*\\(\\s*analogRead\\s*\\(\\s*${inputName}\\s*\\)\\s*,\\s*0\\s*,\\s*(\\d+)\\s*,\\s*0\\s*,\\s*100\\s*\\)\\s*;`
    const read=new RegExp(scaledRead).exec(clean)
    const threshold=new RegExp(`if\\s*\\(\\s*${valueName}\\s*>\\s*(\\d+)\\s*\\)\\s*\\{\\s*digitalWrite\\s*\\(\\s*ledPin\\s*,\\s*(HIGH|LOW)\\s*\\)\\s*;?\\s*\\}\\s*else\\s*\\{\\s*digitalWrite\\s*\\(\\s*ledPin\\s*,\\s*(HIGH|LOW)\\s*\\)\\s*;?\\s*\\}`,'s').exec(clean)
    const sampleBody=functionBody(clean,'loop')
    const validLoop=sampleBody&&new RegExp(`^\\s*${scaledRead}\\s*if\\s*\\(\\s*${valueName}\\s*>\\s*\\d+\\s*\\)\\s*\\{\\s*digitalWrite\\s*\\(\\s*ledPin\\s*,\\s*(?:HIGH|LOW)\\s*\\)\\s*;?\\s*\\}\\s*else\\s*\\{\\s*digitalWrite\\s*\\(\\s*ledPin\\s*,\\s*(?:HIGH|LOW)\\s*\\)\\s*;?\\s*\\}\\s*delay\\s*\\(\\s*\\d+\\s*\\)\\s*;\\s*$`).test(sampleBody)
    if(inputPin===undefined||!read||!threshold||writes.length!==2||!validLoop)return fail(isLdr?'Bài LDR cần mẫu map(analogRead(...), 0, ADC_MAX, 0, 100), đúng nhánh if/else và một delay lấy mẫu, không có lệnh phụ trong loop.':'Bài biến trở cần mẫu map(analogRead(...), 0, ADC_MAX, 0, 100), đúng nhánh if/else và một delay lấy mẫu, không có lệnh phụ trong loop.')
    if(!new RegExp(`pinMode\\s*\\(\\s*${inputName}\\s*,\\s*INPUT\\s*\\)`).test(clean))return fail(`setup() cần cấu hình ${inputName} là INPUT.`)
    const delays=[...clean.matchAll(/delay\s*\(\s*(\d+)\s*\)/g)].map(match=>Number(match[1]))
    if(!delays.length||delays.some(ms=>ms<1||ms>10000))return fail(`Bài ${isLdr?'LDR':'biến trở'} cần delay lấy mẫu từ 1 đến 10000 ms.`)
    return {ok:true,program:{kind:'analog-threshold',inputPin,outputPin:ledPin,threshold:Number(threshold[1]),above:threshold[2] as 'HIGH'|'LOW',below:threshold[3] as 'HIGH'|'LOW',sampleMs:delays[0],sensor:isLdr?'ldr':'potentiometer',adcFullScale:Number(read![1])}}
  }
  if(lesson==='blink'){
    const delays=[...clean.matchAll(/delay\s*\(\s*(\d+)\s*\)/g)].map(match=>Number(match[1]))
    if(writes.length!==2||delays.length!==2||delays.some(ms=>ms<1||ms>10000))return fail('Bài LED nhấp nháy hỗ trợ hai lần digitalWrite(ledPin, HIGH/LOW) và hai delay từ 1 đến 10000 ms.')
    if(!/^\s*digitalWrite\s*\(\s*ledPin\s*,\s*(?:HIGH|LOW)\s*\)\s*;\s*delay\s*\(\s*\d+\s*\)\s*;\s*digitalWrite\s*\(\s*ledPin\s*,\s*(?:HIGH|LOW)\s*\)\s*;\s*delay\s*\(\s*\d+\s*\)\s*;\s*$/.test(functionBody(clean,'loop')??''))return fail('Mô phỏng chỉ diễn giải loop() theo đúng thứ tự: ghi mức → delay → ghi mức → delay. Hãy sắp xếp lại các lệnh.')
    return {ok:true,program:{kind:'blink',pin:ledPin,onMs:delays[0],offMs:delays[1],on:writes[0],off:writes[1]}}
  }
  if(lesson==='ultrasonic-distance'){
    const trig=readPin(clean,'trigPin'),echo=readPin(clean,'echoPin'),threshold=/if\s*\(\s*distanceCm\s*<\s*(\d+(?:\.\d+)?)\s*\)/.exec(clean),pulse=/pulseIn\s*\(\s*echoPin\s*,\s*HIGH\s*\)/.test(clean),near=/if\s*\(\s*distanceCm[\s\S]*?digitalWrite\s*\(\s*ledPin\s*,\s*(HIGH|LOW)\s*\)/.exec(clean),far=/else\s*\{\s*digitalWrite\s*\(\s*ledPin\s*,\s*(HIGH|LOW)\s*\)/.exec(clean)
    const loop=functionBody(clean,'loop'),delays=[...clean.matchAll(/delay\s*\(\s*(\d+)\s*\)/g)]
    const validTail=loop&&/else\s*\{\s*digitalWrite\s*\(\s*ledPin\s*,\s*(?:HIGH|LOW)\s*\)\s*;?\s*\}\s*delay\s*\(\s*\d+\s*\)\s*;?\s*$/.test(loop)
    if(!/^digitalWrite\(trigPin,LOW\);delayMicroseconds\(\d+\);digitalWrite\(trigPin,HIGH\);delayMicroseconds\(\d+\);digitalWrite\(trigPin,LOW\);longduration=pulseIn\(echoPin,HIGH\);floatdistanceCm=duration\*0\.034\/2;if\(/.test(loop?.replace(/\s+/g,'')??''))return fail('Bài siêu âm cần phát xung TRIG (LOW → HIGH → LOW) rồi mới đo pulseIn trên ECHO và tính distanceCm theo mẫu.')
    if(trig===undefined||echo===undefined||!pulse||!threshold||!near||!far||!validTail||writes.length!==2||delays.length!==1)return fail('Bài siêu âm cần đúng mẫu TRIG/ECHO, hai nhánh LED và một delay cuối loop; lệnh ngoài mẫu bị từ chối.')
    if(!/pinMode\s*\(\s*trigPin\s*,\s*OUTPUT\s*\)/.test(clean)||!/pinMode\s*\(\s*echoPin\s*,\s*INPUT\s*\)/.test(clean))return fail('setup() cần cấu hình TRIG là OUTPUT và ECHO là INPUT.')
    return {ok:true,program:{kind:'ultrasonic',outputPin:ledPin,triggerPin:trig,echoPin:echo,thresholdCm:Number(threshold[1]),whenNear:near[1] as 'HIGH'|'LOW',whenFar:far[1] as 'HIGH'|'LOW',sampleMs:Number(/delay\s*\(\s*(\d+)\s*\)/.exec(clean)?.[1]??100)}}
  }
  if(lesson!=='seven-segment-counter')return fail('Bài học này chưa được hỗ trợ trong bộ diễn giải code.')
  const pinArray=/segPins\s*\[\s*7\s*\]\s*=\s*\{([^}]+)\}/.exec(clean),table=/digits\s*\[\s*10\s*\]\s*\[\s*7\s*\]\s*=\s*\{([\s\S]*?)\};/.exec(clean)
  if(!pinArray||!table)return fail('Bài LED 7 đoạn cần khai báo segPins[7] và digits[10][7].')
  const pins=pinArray[1].split(',').map(value=>Number(value.trim())),digits=[...table[1].matchAll(/\{([^{}]+)\}/g)].map(row=>row[1].split(',').map(bit=>Number(bit.trim())))
  if(pins.length!==7||pins.some(pin=>!Number.isInteger(pin)||pin<0||pin>99)||digits.length!==10||digits.some(row=>row.length!==7||row.some(bit=>bit!==0&&bit!==1)))return fail('Bảng LED 7 đoạn phải có đúng 7 GPIO và 10 hàng, mỗi hàng gồm 7 bit 0/1.')
  const delay=Number(/delay\s*\(\s*(\d+)\s*\)/.exec(clean)?.[1]??0);if(delay<1||delay>10000)return fail('Thời gian mỗi số phải từ 1 đến 10000 ms.')
  if(!/digitalWrite\s*\(\s*segPins\s*\[\s*segment\s*\]\s*,\s*digits\s*\[\s*number\s*\]\s*\[\s*segment\s*\]\s*\)/.test(clean))return fail('Mô phỏng chỉ hỗ trợ vòng lặp ghi từng bit trong bảng digits lên segPins.')
  if(loops.length!==3||!loops.includes('inti=0;i<7;i++')||!loops.includes('intnumber=0;number<10;number++')||!loops.includes('intsegment=0;segment<7;segment++')||(clean.match(/digitalWrite\s*\(/g)??[]).length!==1)return fail('Bài LED 7 đoạn chỉ hỗ trợ ba vòng lặp giới hạn để quét đúng 10 số và 7 đoạn.')
  return {ok:true,program:{kind:'seven-segment',pins,digits,common:'cathode',stepMs:delay}}
}

export function evaluateProgram(program:EducationalProgram,inputs:{pressed?:boolean;detected?:boolean;distanceCm?:number;potPercent?:number;lightPercent?:number;elapsedMs?:number;digit?:number;conceptValue?:number;converterMode?:'buck'|'boost';motorCommand?:'forward'|'reverse'|'stop'}){
  if(program.kind==='concept'){
    const command=inputs.motorCommand??'forward'
    if(program.lesson==='buck-boost-concept'){const input=inputs.conceptValue??5,mode=inputs.converterMode??'buck',output=mode==='buck'?input/2:input*2;return {pin:0,level:'LOW' as const,ledOn:false,digit:0,converter:{input,output,mode},trace:[`Nguồn đầu vào ảo: ${input.toFixed(1)} V.`,`Chọn ${mode} (${mode==='buck'?'hạ áp':'tăng áp'}) với mục tiêu minh họa ${output.toFixed(1)} V.`,`Đây chỉ là tỷ lệ khái niệm, không phải phép tính điện áp đầu ra module thật.`]}}
    if(program.lesson==='dc-motor-driver'){const direction=command==='stop'?'Dừng':command==='reverse'?'Đảo chiều':'Thuận chiều';return {pin:0,level:'LOW' as const,ledOn:false,digit:0,motor:{direction,enabled:command!=='stop',pwm:command==='stop'?0:65},trace:[`AIN1/AIN2 biểu diễn lệnh ${direction.toLocaleLowerCase('vi-VN')}.`,`PWMA ảo: ${command==='stop'?0:65}% · STBY được giả định HIGH.`,`Hình ảnh không tính RPM, mô-men, dòng, nhiệt hoặc stall; cần kiểm tra đúng module và datasheet.`]}}
    const enabled=Boolean(inputs.pressed);return {pin:0,level:'LOW' as const,ledOn:false,digit:0,loadEnabled:enabled,trace:[`GPIO điều khiển Gate: ${enabled?'HIGH · MOSFET bật theo giả định logic-level':'LOW · MOSFET tắt'}.`,`Nguồn tải đi qua tải và đường Drain–Source; GPIO không cấp dòng cho motor.`,`Tải cảm cần diode hồi tiếp đúng chiều; mô phỏng không tính dòng hay xung áp.`]}
  }
  if(program.kind==='blink'){const phase=(inputs.elapsedMs??0)%(program.onMs+program.offMs);const level=phase<program.onMs?program.on:program.off;return {pin:program.pin,level,ledOn:level==='HIGH',digit:inputs.digit??0,trace:[`GPIO ${program.pin} → ${level}`,`Giữ trạng thái ${phase<program.onMs?program.onMs:program.offMs} ms theo delay trong code.`]}}
  if (program.kind === 'input-branch') {
    const active = program.source === 'button' ? inputs.pressed : inputs.detected
    const levelRead = active ? 'LOW' : 'HIGH'
    const conditionTrue = levelRead === program.condition
    const branch = conditionTrue ? 'if' : 'else'
    const level = conditionTrue ? program.whenTrue : program.whenFalse
    const { read, branch: branchLine, whenTrue, whenFalse } = program.sourceLines ?? {}
    const writeLine = conditionTrue ? whenTrue : whenFalse
    const events: InputBranchEvents = [
      { kind: 'read', pin: program.inputPin, level: levelRead, ...(read === undefined ? {} : { line: read }) },
      { kind: 'branch', condition: program.condition, level: levelRead, branch, ...(branchLine === undefined ? {} : { line: branchLine }) },
      { kind: 'write', pin: program.outputPin, level, ...(writeLine === undefined ? {} : { line: writeLine }) },
    ]
    return { pin: program.outputPin, level, ledOn: level === 'HIGH', digit: inputs.digit ?? 0, events, trace: [
      `digitalRead(GPIO ${program.inputPin}) → ${levelRead} từ đầu vào ảo${program.source === 'sensor' ? ` (${inputs.detected ? 'có' : 'không có'} vật, module tham chiếu active LOW)` : ''}.`,
      `So sánh với ${program.condition} → ${conditionTrue ? 'đúng' : 'sai'}; nhánh ${branch} đặt LED ${level}.`,
    ] }
  }
  if(program.kind==='ultrasonic'){const near=(inputs.distanceCm??35)<program.thresholdCm,level=near?program.whenNear:program.whenFar;return {pin:program.outputPin,level,ledOn:level==='HIGH',digit:inputs.digit??0,trace:[`TRIG phát xung; ECHO ảo tương ứng ${inputs.distanceCm??35} cm.`,`So sánh ${inputs.distanceCm??35} < ${program.thresholdCm} cm → ${near?'đúng':'sai'}, LED ${level}.`]}}
  if(program.kind==='analog-threshold'){
    const divider=program.sensor==='ldr'?calculateLdrDivider(inputs.lightPercent??0):undefined
    const percent=divider?.normalizedPercent??Math.max(0,Math.min(100,inputs.potPercent??0)),above=percent>program.threshold,level=above?program.above:program.below
    const trace=program.sensor==='ldr'?[`Ánh sáng ảo ${Math.max(0,Math.min(100,inputs.lightPercent??0))}% → LDR giả định ${Math.round(divider!.ldrResistanceOhms)} Ω → điểm giữa bộ chia áp.`,`VCC 3,3 V · R cố định 10 kΩ · Vout ${divider!.outputVoltageVolts.toFixed(2)} V → GPIO analog ${program.inputPin} (${percent.toFixed(1)}% của VCC).`,`So sánh analog ${percent.toFixed(1)} > ${program.threshold} → ${above?'đúng':'sai'}; LED ${level}. Điện trở/điện áp là kết quả mô hình giáo dục, không phải lux hay đo thực.`]:[`Wiper biến trở → đầu vào analog GPIO ${program.inputPin}.`,`Giá trị mô phỏng chuẩn hóa: ${percent}/100 (không phải số đếm ADC của board).`,`So sánh ${percent} > ${program.threshold} → ${above?'đúng':'sai'}; LED ${level}.`]
    return {pin:program.outputPin,level,ledOn:level==='HIGH',digit:inputs.digit??0,analogPercent:percent,...(divider?{divider}:{}),trace}
  }
  const digit=(inputs.digit??0)%10;return {pin:program.pins[0],level:'HIGH' as const,ledOn:false,digit,segments:program.digits[digit],trace:[`Đọc hàng ${digit} từ bảng digits trong code.`,`Các bit ${program.digits[digit].join(' ')} lần lượt điều khiển A–G.`,`Giữ số ${program.stepMs} ms theo delay trong code.`]}
}
