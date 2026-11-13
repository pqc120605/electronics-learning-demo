import { curriculumLessons } from '../data/curriculumSchema'
import { getInputAlias, type BuilderLessonId } from '../data/builderLessons'
import type { SimulationTarget } from '../data/simulationTargets'
import { parseEducationalProgram, type EducationalProgram } from './educationalProgram'

type ArduinoSketchExportInput = {
  code: string
  lessonId: BuilderLessonId
  target: SimulationTarget
}

export type ArduinoSketchExportResult =
  | { ok: true; fileName: string; contents: string }
  | { ok: false; message: string }

export function canExportArduinoSketch(boardId:string,lessonId:BuilderLessonId):boolean {
  return ['arduino-uno-r3','arduino-nano-classic','arduino-mega-2560-r3'].includes(boardId)&&['blink','source-led'].includes(lessonId)
}

export function findProgramTargetMismatch(program: EducationalProgram, target: SimulationTarget, lessonId: BuilderLessonId): string | undefined {
  const outputPin = program.kind === 'input-branch' || program.kind === 'ultrasonic' || program.kind === 'analog-threshold'
    ? program.outputPin
    : program.kind === 'blink' ? program.pin : undefined
  if (outputPin !== undefined && outputPin !== target.codePin) {
    return `Code điều khiển GPIO ${outputPin}, nhưng profile đang chọn alias ${target.codePin} (${target.pinLabel}).`
  }

  if (program.kind === 'analog-threshold' && program.adcFullScale !== target.adcFullScale) {
    return target.adcFullScale === undefined
      ? `Chưa xác minh dải ADC của ${target.name}.`
      : `Code dùng dải ADC 0–${program.adcFullScale}, nhưng ${target.name} đọc 0–${target.adcFullScale}.`
  }
  if (program.kind === 'seven-segment' && program.pins.join() !== target.sevenSegmentPins?.join()) {
    return target.sevenSegmentPins
      ? `Code dùng GPIO ${program.pins.join(', ')}, nhưng bảng chân của ${target.name} là ${target.sevenSegmentPins.join(', ')}. Khôi phục code mẫu để dùng chân đúng board.`
      : `Chưa có bảng chân LED 7 đoạn đã xác minh cho ${target.name}.`
  }

  const inputAlias = getInputAlias(target, lessonId)
  if ((program.kind === 'input-branch' || program.kind === 'analog-threshold') && program.inputPin !== inputAlias.pin) {
    return `Code đọc GPIO ${program.inputPin}, nhưng alias đầu vào của profile là ${inputAlias.pin} (${inputAlias.label}).`
  }
  if (program.kind === 'ultrasonic' && (program.triggerPin !== inputAlias.pin || program.echoPin !== inputAlias.pin + 1)) {
    return `Code TRIG/ECHO đang dùng GPIO ${program.triggerPin}/${program.echoPin}; profile này minh họa ${inputAlias.pin}/${inputAlias.pin + 1}.`
  }
  return undefined
}

export function prepareArduinoSketchExport({ code, lessonId, target }: ArduinoSketchExportInput): ArduinoSketchExportResult {
  const curriculum = curriculumLessons.find((lesson) => lesson.id === lessonId)
  if (curriculum?.simulationMode !== 'code-subset') {
    return { ok: false, message: 'Xuất sketch chỉ dành cho bài có code-subset; bài kịch bản khái niệm không tạo firmware.' }
  }
  if(!canExportArduinoSketch(target.boardId,lessonId))return {ok:false,message:'Xuất .ino hiện chỉ bật cho bài LED cơ bản trên Uno R3, Nano classic và Mega 2560. Các profile/chân ngoại vi khác cần được đối chiếu core và pinout trước khi mở.'}

  const parsed = parseEducationalProgram(code, lessonId)
  if (!parsed.ok) return { ok: false, message: `Không thể xuất sketch: lỗi ở dòng ${parsed.line}. ${parsed.message}` }

  const mismatch = findProgramTargetMismatch(parsed.program, target, lessonId)
  if (mismatch) return { ok: false, message: `Chưa xuất sketch vì pin trong code không khớp board. ${mismatch}` }

  const boardSlug = target.boardId.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const contents = [
    `// Mạch Mở · ${curriculum.title}`,
    `// Board target: ${target.name} (${target.mcu})`,
    `// Logic tham chiếu: ${target.logicLevel} · chân output alias ${target.pinLabel} / GPIO ${target.codePin}`,
    target.sourceUrl ? `// Tài liệu board: ${target.sourceUrl}` : '// Tài liệu board: chưa khai báo trong hồ sơ board.',
    '// Sketch giáo dục: cần chọn đúng board/core và tự biên dịch trong Arduino IDE.',
    '// Mô phỏng Mạch Mở không biên dịch hay xác nhận firmware này cho board thật.',
    '// Đối chiếu pinout, mức điện áp và mạch ngoài trước khi nạp phần cứng.',
    '',
    code.trim(),
    '',
  ].join('\n')

  return { ok: true, fileName: `mach-mo-${lessonId}-${boardSlug}.ino`, contents }
}
