import type { LedAction, LedProgramIr } from './lessonProgramIr'

export type ParseResult = { ok: true; program: LedProgramIr } | { ok: false; line: number; message: string }

const declarationPattern = /^(?:const\s+int|int)\s+([A-Za-z_]\w*)\s*=\s*(\d+)\s*;?$/
const setupPattern = /^void\s+setup\s*\(\s*\)\s*(\{)?$/
const loopPattern = /^void\s+loop\s*\(\s*\)\s*(\{)?$/

export function parseSupportedArduinoSubset(source: string): ParseResult {
  const lines = source.split(/\r?\n/)
  const clean = lines.map((line) => line.replace(/\/\/.*$/, '').trim())
  const declarations = clean.flatMap((line, index) => declarationPattern.test(line) ? [index] : [])
  if (declarations.length !== 1) return { ok: false, line: declarations[1] === undefined ? 1 : declarations[1] + 1, message: 'Bài học hỗ trợ đúng một khai báo chân bằng const int hoặc int, ví dụ: const int ledPin = 23;' }
  const declarationLine = declarations[0]
  const declaration = declarationPattern.exec(clean[declarationLine])!
  const pinName = declaration[1]
  const pin = Number(declaration[2])
  if (!Number.isInteger(pin) || pin < 0 || pin > 99) return { ok: false, line: declarationLine + 1, message: 'Chân điều khiển cần là số nguyên từ 0 đến 99; ý nghĩa chân phải được đối chiếu với board đang chọn.' }

  const setupStarts = clean.flatMap((line, index) => setupPattern.test(line) ? [index] : [])
  const loopStarts = clean.flatMap((line, index) => loopPattern.test(line) ? [index] : [])
  if (setupStarts.length !== 1 || loopStarts.length !== 1 || setupStarts[0] >= loopStarts[0]) {
    return { ok: false, line: 1, message: 'Cần đúng một setup() đứng trước đúng một loop() theo cấu trúc bài học.' }
  }
  const setupStart = setupStarts[0]
  const loopStart = loopStarts[0]
  const setupEnd = clean.findIndex((line, index) => index > setupStart && line === '}')
  const loopEnd = clean.findIndex((line, index) => index > loopStart && line === '}')
  if (setupEnd < 0 || setupEnd >= loopStart || loopEnd < 0) return { ok: false, line: lines.length, message: 'Thiếu dấu } hoặc cấu trúc setup()/loop() bị sai thứ tự.' }
  const allowedTopLevel = new Set([declarationLine, setupStart, setupEnd, loopStart, loopEnd])
  const extraTopLevel = clean.findIndex((line, index) => Boolean(line) && !allowedTopLevel.has(index) && (index < setupStart || index > setupEnd && index < loopStart || index > loopEnd))
  if (extraTopLevel >= 0) return { ok: false, line: extraTopLevel + 1, message: 'Mạch xem trước chỉ nhận khai báo GPIO cùng hai hàm setup() và loop(); chưa hỗ trợ code bên ngoài các phần này.' }

  function parseBody(start: number, end: number): LedAction[] | ParseResult {
    const actions: LedAction[] = []
    const openBraceOnSignature = /\{$/.test(clean[start])
    const firstBodyLine = openBraceOnSignature ? start + 1 : start + 2
    if (!openBraceOnSignature && clean[start + 1] !== '{') return { ok: false, line: start + 2, message: 'Thiếu dấu { mở khối hàm.' }
    for (let index = firstBodyLine; index < end; index += 1) {
      const line = clean[index]
      if (!line) continue
      let match = /^pinMode\(\s*([A-Za-z_]\w*|\d+)\s*,\s*OUTPUT\s*\)\s*;?$/.exec(line)
      if (match) {
        const value = match[1] === pinName ? pin : Number(match[1])
        if (value !== pin) return { ok: false, line: index + 1, message: 'Bài học chỉ hỗ trợ điều khiển cùng chân GPIO đã khai báo.' }
        actions.push({ kind: 'pinMode', pin, line: index + 1 }); continue
      }
      match = /^digitalWrite\(\s*([A-Za-z_]\w*|\d+)\s*,\s*(HIGH|LOW)\s*\)\s*;?$/.exec(line)
      if (match) {
        const value = match[1] === pinName ? pin : Number(match[1])
        if (value !== pin) return { ok: false, line: index + 1, message: 'Bài học chỉ hỗ trợ điều khiển cùng chân GPIO đã khai báo.' }
        actions.push({ kind: 'write', pin, value: match[2] as 'HIGH' | 'LOW', line: index + 1 }); continue
      }
      match = /^delay\(\s*(\d+)\s*\)\s*;?$/.exec(line)
      if (match) { actions.push({ kind: 'delay', milliseconds: Number(match[1]), line: index + 1 }); continue }
      return { ok: false, line: index + 1, message: `Chưa thể mô phỏng dòng này: “${line}”. Mạch xem trước chỉ hiểu pinMode, digitalWrite và delay trong bài LED.` }
    }
    return actions
  }

  const setup = parseBody(setupStart, setupEnd)
  if (!Array.isArray(setup)) return setup
  const loop = parseBody(loopStart, loopEnd)
  if (!Array.isArray(loop)) return loop
  if (!setup.some((action) => action.kind === 'pinMode')) return { ok: false, line: setupStart + 1, message: 'Trong setup() cần có pinMode(chân, OUTPUT).' }
  if (!loop.some((action) => action.kind === 'write')) return { ok: false, line: loopStart + 1, message: 'Trong loop() cần có ít nhất một digitalWrite() để điều khiển LED.' }
  return { ok: true, program: { pin, setup, loop } }
}
