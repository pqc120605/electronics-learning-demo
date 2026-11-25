/**
 * Trình thông dịch Arduino C++ con chạy trong trình duyệt (2026-11-14).
 * KHÔNG biên dịch và KHÔNG chạy firmware thật: đọc mã nguồn, dựng cây cú pháp và thực thi
 * theo ngữ nghĩa Arduino cơ bản trên thời gian ảo. Dùng cho ESP32, Arduino, Pico… với cùng API.
 * Hỗ trợ: biến (int/long/float/bool/byte/String, mảng 1 chiều), #define, hàm người dùng,
 * if/else, switch với nhãn số nguyên, while, do…while, for, break/continue/return,
 * toán tử C, Serial.print/println/printf,
 * pinMode, digitalWrite/Read, analogRead/Write, ledcAttach/ledcWrite, delay, millis, micros,
 * map, constrain, min, max, abs, random, sqrt, pow.
 */

export type SketchBoard = {
  id: string
  name: string
  mcu: string
  ledBuiltin?: number
  adcBits: number
  intBits?: 16
  pwmBits: number
  /** Chân digital hợp lệ. */
  pins: readonly number[]
  /** Ánh xạ A0…An sang số chân. */
  analogAliases: Readonly<Record<string, number>>
  /** Chân có ADC. */
  adcPins: readonly number[]
  note: string
  /** Tên chân kiểu STM32 (PA5, PC13…) → số chân nội bộ của trình thông dịch. */
  nameAliases?: Readonly<Record<string, number>>
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index)
const aliases = (start: number, count: number) => Object.fromEntries(range(0, count - 1).map(index => [`A${index}`, start + index]))

export const sketchBoards: readonly SketchBoard[] = [
  { id: 'esp32-devkit', name: 'ESP32 DevKit V1 (30 chân)', mcu: 'ESP32 · Xtensa LX6', ledBuiltin: 2, adcBits: 12, pwmBits: 8, pins: [...range(0, 5), ...range(12, 19), 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39], analogAliases: {}, adcPins: [32, 33, 34, 35, 36, 39, 25, 26, 27, 14, 12, 13, 15, 2, 4], note: 'GPIO 34–39 chỉ là input; GPIO 6–11 nối flash nên không dùng.' },
  { id: 'esp32-s3-devkitc-1', name: 'ESP32-S3-DevKitC-1', mcu: 'ESP32-S3 · Xtensa LX7', adcBits: 12, pwmBits: 8, pins: [...range(0, 21), ...range(35, 48)], analogAliases: {}, adcPins: range(1, 20), note: 'LED trên board là RGB WS2812 (GPIO 48 hoặc 38 tùy revision), không có LED_BUILTIN đơn.' },
  { id: 'arduino-uno-r3', name: 'Arduino Uno R3', mcu: 'ATmega328P · 16 MHz', intBits: 16, ledBuiltin: 13, adcBits: 10, pwmBits: 8, pins: range(0, 19), analogAliases: aliases(14, 6), adcPins: range(14, 19), note: 'PWM trên D3, D5, D6, D9, D10, D11.' },
  { id: 'arduino-nano', name: 'Arduino Nano classic', mcu: 'ATmega328P · 16 MHz', intBits: 16, ledBuiltin: 13, adcBits: 10, pwmBits: 8, pins: range(0, 21), analogAliases: aliases(14, 8), adcPins: range(14, 21), note: 'A6, A7 chỉ đọc analog.' },
  { id: 'arduino-mega-2560', name: 'Arduino Mega 2560 R3', mcu: 'ATmega2560 · 16 MHz', intBits: 16, ledBuiltin: 13, adcBits: 10, pwmBits: 8, pins: range(0, 69), analogAliases: aliases(54, 16), adcPins: range(54, 69), note: 'PWM trên D2–D13, D44–D46.' },
  { id: 'raspberry-pi-pico', name: 'Raspberry Pi Pico (Arduino-Pico)', mcu: 'RP2040 · Cortex-M0+', ledBuiltin: 25, adcBits: 10, pwmBits: 8, pins: range(0, 29), analogAliases: aliases(26, 3), adcPins: [26, 27, 28], note: 'Mặc định analogRead 10 bit như core Arduino-Pico.' },
  // 2026-11-14: STM32 chỉ chạy bằng trình thông dịch (không có emulator Cortex-M3/M4 mở chạy trong trình duyệt).
  // Blue Pill: số chân nội bộ = cổng × 16 + chân (PA0 = 0, PB0 = 16, PC13 = 45); viết code bằng tên PA5, PC13…
  { id: 'stm32-blue-pill-f103', name: 'STM32F103C8T6 Blue Pill', mcu: 'STM32F103C8 · Cortex-M3 72 MHz', ledBuiltin: 45, adcBits: 10, pwmBits: 8, pins: [...range(0, 15), ...range(16, 31), 45, 46, 47], analogAliases: {}, adcPins: [...range(0, 7), 16, 17], nameAliases: { ...Object.fromEntries(range(0, 15).map(index => [`PA${index}`, index])), ...Object.fromEntries(range(0, 15).map(index => [`PB${index}`, 16 + index])), PC13: 45, PC14: 46, PC15: 47 }, note: 'Logic 3,3 V. LED trên board ở PC13, sáng khi xuất LOW. analogRead 10 bit như mặc định STM32duino. Chỉ chạy bằng trình thông dịch rút gọn.' },
  // Nucleo-F401RE: số chân theo header Arduino D0–D15, A0–A5 = 16–21; tên PAx/PBx/PCx ánh xạ sang header.
  { id: 'stm32-nucleo-f401re', name: 'STM32 NUCLEO-F401RE', mcu: 'STM32F401RE · Cortex-M4 84 MHz', ledBuiltin: 13, adcBits: 10, pwmBits: 8, pins: range(0, 22), analogAliases: aliases(16, 6), adcPins: range(16, 21), nameAliases: { PA3: 0, PA2: 1, PA10: 2, PB3: 3, PB5: 4, PB4: 5, PB10: 6, PA8: 7, PA9: 8, PC7: 9, PB6: 10, PA7: 11, PA6: 12, PA5: 13, PB9: 14, PB8: 15, PA0: 16, PA1: 17, PA4: 18, PB0: 19, PC1: 20, PC0: 21, PC13: 22, USER_BTN: 22 }, note: 'Logic 3,3 V. LED LD2 ở D13/PA5, nút B1 ở PC13. Chỉ chạy bằng trình thông dịch rút gọn.' },
]

export type SketchError = { line: number; message: string }
export type PinState = { mode: 'unset' | 'output' | 'input' | 'input_pullup'; level: boolean; pwm?: number }
export type SketchSnapshot = {
  simulatedMilliseconds: number
  pins: Record<number, PinState>
  serial: string
  serialTruncated: boolean
  events: Record<number, Array<{ level: boolean; cycles: number; simulatedMilliseconds: number }>>
  analogReads: number[]
  digitalReads: number[]
  error?: SketchError
  warnings: string[]
  phase: 'setup' | 'loop' | 'stopped'
}

// ---------- Tokenizer ----------
type Token = { t: 'num' | 'str' | 'char' | 'id' | 'op' | 'eof'; v: string; line: number; float?: boolean }
const OPS = ['<<=', '>>=', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '::', '->', '+', '-', '*', '/', '%', '=', '<', '>', '!', '~', '&', '|', '^', '?', ':', ';', ',', '.', '(', ')', '{', '}', '[', ']']

class CompileError extends Error { line: number; constructor(line: number, message: string) { super(message); this.line = line } }

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  const defines = new Map<string, Token[]>()
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const body: Array<{ text: string; line: number }> = []
  lines.forEach((text, index) => {
    const trimmed = text.trim()
    if (trimmed.startsWith('#include') || trimmed.startsWith('#pragma')) return body.push({ text: '', line: index + 1 })
    const define = /^#define\s+([A-Za-z_]\w*)\s*(.*)$/.exec(trimmed)
    if (define) { defines.set(define[1], lex(define[2].replace(/\/\/.*$/, ''), index + 1)); return body.push({ text: '', line: index + 1 }) }
    if (trimmed.startsWith('#')) throw new CompileError(index + 1, `Chỉ thị ${trimmed.split(/\s/)[0]} chưa được hỗ trợ.`)
    body.push({ text, line: index + 1 })
  })
  const joined = body.map(item => item.text).join('\n')
  for (const token of lex(joined, 1)) {
    const replacement = token.t === 'id' ? defines.get(token.v) : undefined
    if (replacement) tokens.push(...replacement.map(item => ({ ...item, line: token.line })))
    else tokens.push(token)
  }
  tokens.push({ t: 'eof', v: '', line: lines.length })
  return tokens
}

function lex(source: string, firstLine: number): Token[] {
  const tokens: Token[] = []
  let index = 0
  let line = firstLine
  while (index < source.length) {
    const char = source[index]
    if (char === '\n') { line += 1; index += 1; continue }
    if (/\s/.test(char)) { index += 1; continue }
    if (source.startsWith('//', index)) { while (index < source.length && source[index] !== '\n') index += 1; continue }
    if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2)
      if (end < 0) throw new CompileError(line, 'Chú thích /* chưa được đóng.')
      line += source.slice(index, end).split('\n').length - 1
      index = end + 2
      continue
    }
    const number = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|\d+(?:[eE][+-]?\d+)?)[uUlLfF]*/.exec(source.slice(index))
    if (number && /[0-9.]/.test(char) && !(char === '.' && !/\d/.test(source[index + 1] ?? ''))) {
      const raw = number[1]
      tokens.push({ t: 'num', v: raw, line, float: /[.eE]/.test(raw) && !/^0[xX]/.test(raw) || /[fF]$/.test(number[0]) })
      index += number[0].length
      continue
    }
    if (char === '"') {
      let value = ''
      index += 1
      while (index < source.length && source[index] !== '"') {
        if (source[index] === '\n') throw new CompileError(line, 'Chuỗi chưa đóng dấu ".')
        if (source[index] === '\\') { const next = source[index + 1]; value += next === 'n' ? '\n' : next === 't' ? '\t' : next === 'r' ? '\r' : next; index += 2 } else { value += source[index]; index += 1 }
      }
      index += 1
      tokens.push({ t: 'str', v: value, line })
      continue
    }
    if (char === "'") {
      const match = /^'(\\.|[^'\\])'/.exec(source.slice(index))
      if (!match) throw new CompileError(line, 'Ký tự trong dấu nháy đơn không hợp lệ.')
      const raw = match[1]
      tokens.push({ t: 'char', v: String((raw === '\\n' ? '\n' : raw === '\\t' ? '\t' : raw === '\\0' ? '\0' : raw.length === 2 ? raw[1] : raw).charCodeAt(0)), line })
      index += match[0].length
      continue
    }
    const identifier = /^[A-Za-z_]\w*/.exec(source.slice(index))
    if (identifier) { tokens.push({ t: 'id', v: identifier[0], line }); index += identifier[0].length; continue }
    const op = OPS.find(candidate => source.startsWith(candidate, index))
    if (!op) throw new CompileError(line, `Ký tự '${char}' không hợp lệ.`)
    tokens.push({ t: 'op', v: op, line })
    index += op.length
  }
  return tokens
}

// ---------- Parser ----------
type Node = { k: string; line: number; [key: string]: any } // eslint-disable-line @typescript-eslint/no-explicit-any
const TYPE_WORDS = new Set(['void', 'int', 'long', 'short', 'float', 'double', 'bool', 'boolean', 'byte', 'char', 'unsigned', 'signed', 'const', 'static', 'volatile', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'size_t', 'String', 'word', 'auto'])
const FLOAT_TYPES = new Set(['float', 'double'])

function parse(tokens: Token[]) {
  let position = 0
  const peek = (offset = 0) => tokens[Math.min(position + offset, tokens.length - 1)]
  const next = () => tokens[position++]
  const is = (value: string, offset = 0) => { const token = peek(offset); return (token.t === 'op' || token.t === 'id') && token.v === value }
  const expect = (value: string) => {
    const previous = tokens[position - 1]
    const token = next()
    if (token.v !== value || (token.t !== 'op' && token.t !== 'id')) {
      const line = value === ';' && previous && previous.line < token.line ? previous.line : token.line
      throw new CompileError(line, `Thiếu '${value}' (gặp '${token.v || 'hết tệp'}').`)
    }
    return token
  }
  const isTypeStart = () => peek().t === 'id' && TYPE_WORDS.has(peek().v)

  function parseType(): string {
    const words: string[] = []
    while (peek().t === 'id' && TYPE_WORDS.has(peek().v)) words.push(next().v)
    while (is('*') || is('&')) next()
    const base = words.filter(word => !['const', 'static', 'volatile', 'unsigned', 'signed'].includes(word)).at(-1) ?? 'int'
    return words.includes('unsigned') && base === 'char' ? 'byte' : base
  }

  function parseDeclarators(type: string, line: number): Node {
    const items: Node[] = []
    do {
      const name = next()
      if (name.t !== 'id') throw new CompileError(name.line, 'Thiếu tên biến.')
      let size: Node | undefined
      if (is('[')) { next(); size = is(']') ? undefined : parseExpression(); expect(']'); size ??= { k: 'num', line, value: -1 } }
      let init: Node | undefined
      if (is('=')) {
        next()
        if (is('{')) { next(); const values: Node[] = []; while (!is('}')) { values.push(parseAssignment()); if (is(',')) next() } expect('}'); init = { k: 'list', line, values } }
        else init = parseAssignment()
      }
      items.push({ k: 'var', line: name.line, name: name.v, type, size, init })
    } while (is(',') && next())
    return { k: 'decl', line, items }
  }

  function parseStatement(): Node {
    const token = peek()
    if (is('{')) return parseBlock()
    if (is(';')) { next(); return { k: 'empty', line: token.line } }
    if (is('if')) { next(); expect('('); const test = parseExpression(); expect(')'); const then = parseStatement(); let otherwise: Node | undefined; if (is('else')) { next(); otherwise = parseStatement() } return { k: 'if', line: token.line, test, then, otherwise } }
    if (is('while')) { next(); expect('('); const test = parseExpression(); expect(')'); return { k: 'while', line: token.line, test, body: parseStatement() } }
    if (is('do')) { next(); const body = parseStatement(); expect('while'); expect('('); const test = parseExpression(); expect(')'); expect(';'); return { k: 'do', line: token.line, test, body } }
    if (is('for')) {
      next(); expect('(')
      const init = is(';') ? undefined : isTypeStart() ? parseDeclarators(parseType(), token.line) : { k: 'expr', line: token.line, expr: parseExpression() }
      expect(';')
      const test = is(';') ? undefined : parseExpression(); expect(';')
      const update = is(')') ? undefined : parseExpression(); expect(')')
      return { k: 'for', line: token.line, init, test, update, body: parseStatement() }
    }
    if (is('return')) { next(); const value = is(';') ? undefined : parseExpression(); expect(';'); return { k: 'return', line: token.line, value } }
    if (is('break')) { next(); expect(';'); return { k: 'break', line: token.line } }
    if (is('continue')) { next(); expect(';'); return { k: 'continue', line: token.line } }
    if (is('switch')) return parseSwitch()
    if (isTypeStart()) { const decl = parseDeclarators(parseType(), token.line); expect(';'); return decl }
    const expr = parseExpression(); expect(';')
    return { k: 'expr', line: token.line, expr }
  }

  function parseSwitch(): Node {
    const line = expect('switch').line
    expect('(')
    const test = parseExpression()
    expect(')')
    expect('{')
    const cases: Array<{ value: number | null; body: Node[] }> = []
    const labels = new Set<number | null>()
    while (!is('}')) {
      const label = next()
      let value: number | null = null
      if (label.v === 'case' && label.t === 'id') {
        const expression = parseAssignment()
        const literal = expression.k === 'unary' && ['+', '-'].includes(expression.op) ? expression.arg : expression
        if (literal.k !== 'num' || literal.float || !Number.isSafeInteger(literal.value)) {
          throw new CompileError(label.line, 'Nhãn case cần một số nguyên hoặc ký tự. Dùng hằng trực tiếp hoặc biên dịch bằng Arduino CLI.')
        }
        value = expression.op === '-' ? -literal.value : literal.value
      } else if (label.v !== 'default' || label.t !== 'id') {
        throw new CompileError(label.line, "Mong đợi 'case', 'default' hoặc '}'.")
      }
      if (labels.has(value)) throw new CompileError(label.line, `Nhãn ${value === null ? 'default' : 'case'} bị trùng.`)
      labels.add(value)
      expect(':')
      const body: Node[] = []
      while (!is('case') && !is('default') && !is('}')) {
        if (peek().t === 'eof') throw new CompileError(line, 'Khối switch chưa được đóng.')
        body.push(parseStatement())
      }
      cases.push({ value, body })
    }
    expect('}')
    return { k: 'switch', line, test, cases }
  }

  function parseBlock(): Node {
    const line = expect('{').line
    const body: Node[] = []
    while (!is('}')) { if (peek().t === 'eof') throw new CompileError(line, 'Khối { chưa được đóng.'); body.push(parseStatement()) }
    next()
    return { k: 'block', line, body }
  }

  const binaryLevels: string[][] = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']]
  function parseExpression(): Node { let node = parseAssignment(); while (is(',')) { const line = next().line; node = { k: 'seq', line, left: node, right: parseAssignment() } } return node }
  function parseAssignment(): Node {
    const left = parseTernary()
    const token = peek()
    if (token.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='].includes(token.v)) {
      next()
      if (left.k !== 'id' && left.k !== 'index') throw new CompileError(token.line, 'Vế trái của phép gán phải là biến.')
      return { k: 'assign', line: token.line, op: token.v, target: left, value: parseAssignment() }
    }
    return left
  }
  function parseTernary(): Node { const test = parseBinary(0); if (!is('?')) return test; const line = next().line; const then = parseAssignment(); expect(':'); return { k: 'ternary', line, test, then, otherwise: parseAssignment() } }
  function parseBinary(level: number): Node {
    if (level >= binaryLevels.length) return parseUnary()
    let left = parseBinary(level + 1)
    while (peek().t === 'op' && binaryLevels[level].includes(peek().v)) { const op = next(); left = { k: 'binary', line: op.line, op: op.v, left, right: parseBinary(level + 1) } }
    return left
  }
  function parseUnary(): Node {
    const token = peek()
    if (token.t === 'op' && ['!', '-', '+', '~'].includes(token.v)) { next(); return { k: 'unary', line: token.line, op: token.v, arg: parseUnary() } }
    if (token.t === 'op' && (token.v === '++' || token.v === '--')) { next(); return { k: 'update', line: token.line, op: token.v, prefix: true, target: parseUnary() } }
    if (is('(') && peek(1).t === 'id' && TYPE_WORDS.has(peek(1).v) && (is(')', 2) || is('*', 2) || TYPE_WORDS.has(peek(2).v))) { next(); const type = parseType(); expect(')'); return { k: 'cast', line: token.line, type, arg: parseUnary() } }
    return parsePostfix()
  }
  function parsePostfix(): Node {
    let node = parsePrimary()
    for (;;) {
      if (is('(')) { const line = next().line; const args: Node[] = []; while (!is(')')) { args.push(parseAssignment()); if (is(',')) next(); else break } expect(')'); node = { k: 'call', line, callee: node, args } }
      else if (is('[')) { const line = next().line; const index = parseExpression(); expect(']'); node = { k: 'index', line, target: node, index } }
      else if (is('.') || is('->') || is('::')) { next(); const name = next(); node = { k: 'member', line: name.line, object: node, name: name.v } }
      else if (is('++') || is('--')) { const op = next(); node = { k: 'update', line: op.line, op: op.v, prefix: false, target: node } }
      else return node
    }
  }
  function parsePrimary(): Node {
    const token = next()
    if (token.t === 'num') return { k: 'num', line: token.line, value: Number(/^0[bB]/.test(token.v) ? parseInt(token.v.slice(2), 2) : token.v), float: token.float }
    if (token.t === 'char') return { k: 'num', line: token.line, value: Number(token.v) }
    if (token.t === 'str') { let value = token.v; while (peek().t === 'str') value += next().v; return { k: 'str', line: token.line, value } }
    if (token.t === 'id') {
      if (token.v === 'true' || token.v === 'false') return { k: 'num', line: token.line, value: token.v === 'true' ? 1 : 0 }
      if (token.v === 'String' && is('(')) return { k: 'id', line: token.line, name: 'String' }
      return { k: 'id', line: token.line, name: token.v }
    }
    if (token.v === '(') { const expr = parseExpression(); expect(')'); return expr }
    throw new CompileError(token.line, `Không hiểu '${token.v || 'hết tệp'}'.`)
  }

  const globals: Node[] = []
  const functions = new Map<string, Node>()
  while (peek().t !== 'eof') {
    const line = peek().line
    if (!isTypeStart()) throw new CompileError(line, `Mong đợi khai báo biến hoặc hàm, gặp '${peek().v}'.`)
    const type = parseType()
    if (peek().t === 'id' && is('(', 1)) {
      const name = next().v
      expect('(')
      const params: Array<{ name: string; type: string }> = []
      while (!is(')')) {
        if (is('void') && is(')', 1)) { next(); break }
        const paramType = parseType()
        const paramName = next()
        if (paramName.t !== 'id') throw new CompileError(paramName.line, 'Thiếu tên tham số.')
        params.push({ name: paramName.v, type: paramType })
        if (is(',')) next(); else break
      }
      expect(')')
      if (is(';')) { next(); continue } // khai báo trước
      functions.set(name, { k: 'function', line, name, type, params, body: parseBlock() })
    } else {
      globals.push(parseDeclarators(type, line))
      expect(';')
    }
  }
  return { globals, functions }
}

// ---------- Runtime ----------
type Value = number | string | Value[]
type Slot = { value: Value; type: string }
type Yield = { kind: 'delay'; micros: number } | { kind: 'busy' }
class Signal { type: 'break' | 'continue' | 'return'; value?: Value; constructor(type: 'break' | 'continue' | 'return', value?: Value) { this.type = type; this.value = value } }
class RuntimeError extends Error { line: number; constructor(line: number, message: string) { super(message); this.line = line } }

const MAX_SERIAL = 16_000
const MAX_EVENTS_PER_PIN = 512
const OP_MICROS = 0.25
const BUSY_EVERY = 4_000

export type SketchRun = {
  board: SketchBoard
  /** Chạy đến khi thời gian ảo tăng thêm `millis` hoặc hết ngân sách thao tác. */
  advance(millis: number): SketchSnapshot
  setDigitalInput(pin: number, level: boolean): void
  setAnalogInput(pin: number, raw: number): void
  stop(): void
  snapshot(): SketchSnapshot
}

export function compileSketch(source: string, board: SketchBoard): { ok: true; run: SketchRun } | { ok: false; error: SketchError } {
  let program: ReturnType<typeof parse>
  try { program = parse(tokenize(source)) } catch (error) {
    if (error instanceof CompileError) return { ok: false, error: { line: error.line, message: error.message } }
    throw error
  }
  if (!program.functions.has('setup') || !program.functions.has('loop')) return { ok: false, error: { line: 1, message: 'Sketch cần có cả hàm void setup() và void loop().' } }
  return { ok: true, run: createRun(program, board) }
}

function createRun(program: ReturnType<typeof parse>, board: SketchBoard): SketchRun {
  let micros = 0
  let delayUntil: number | undefined
  let phase: SketchSnapshot['phase'] = 'setup'
  let error: SketchError | undefined
  let serial = ''
  let serialTruncated = false
  let ops = 0
  const warnings = new Set<string>()
  const pins: Record<number, PinState> = {}
  const events: SketchSnapshot['events'] = {}
  const digitalInputs = new Map<number, boolean>()
  const analogInputs = new Map<number, number>()
  const analogReads = new Set<number>()
  const digitalReads = new Set<number>()
  const ledc = new Map<number, number>() // channel -> pin
  const globals = new Map<string, Slot>()
  const constants: Record<string, number> = { HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, INPUT_PULLDOWN: 3, DEC: 10, HEX: 16, BIN: 2, OCT: 8, PI: Math.PI, ...board.analogAliases, ...board.nameAliases }
  if (board.ledBuiltin !== undefined) constants.LED_BUILTIN = board.ledBuiltin
  let randomSeed = 1

  const fail = (line: number, message: string): never => { throw new RuntimeError(line, message) }
  const pinOf = (value: Value, line: number) => {
    const pin = Math.trunc(Number(value))
    if (!board.pins.includes(pin)) fail(line, `${board.name} không có chân GPIO ${pin}. ${board.note}`)
    return pin
  }
  const write = (pin: number, level: boolean, pwm?: number) => {
    const state = (pins[pin] ??= { mode: 'unset', level: false })
    if (state.level !== level) {
      const list = (events[pin] ??= [])
      if (list.length < MAX_EVENTS_PER_PIN) list.push({ level, cycles: Math.round(micros), simulatedMilliseconds: micros / 1000 })
    }
    state.level = level
    state.pwm = pwm
  }
  const print = (text: string) => { if (serial.length < MAX_SERIAL) serial += text; else serialTruncated = true }
  function coerce(type: string, value: Value): Value {
    if (typeof value !== 'number') return value
    switch (type) {
      case 'float': case 'double': case 'auto': return value
      case 'bool': case 'boolean': return value ? 1 : 0
      case 'byte': case 'uint8_t': return Math.trunc(value) & 0xff
      case 'int8_t': case 'char': return ((Math.trunc(value) & 0xff) << 24) >> 24
      case 'uint16_t': case 'word': return Math.trunc(value) & 0xffff
      // Model the stored AVR width; signed overflow in C++ itself is undefined.
      case 'int': return board.intBits === 16 ? (Math.trunc(value) << 16) >> 16 : Math.trunc(value)
      case 'int16_t': case 'short': return ((Math.trunc(value) & 0xffff) << 16) >> 16
      case 'uint32_t': case 'size_t': return Math.trunc(value) >>> 0
      case 'String': return String(value)
      default: return Math.trunc(value)
    }
  }

  const formatNumber = (value: Value, base?: number, isFloat = false) => {
    if (typeof value !== 'number') return String(value)
    if (isFloat) {
      const digits = Number.isFinite(base) ? Math.max(0, Math.min(20, Math.trunc(base!))) : 2
      return value.toFixed(digits)
    }
    if (base === 16) return (value >>> 0).toString(16).toUpperCase()
    if (base === 2) return (value >>> 0).toString(2)
    if (base === 8) return (value >>> 0).toString(8)
    return String(value)
  }

  function isFloatExpr(node: Node, scopes: Array<Map<string, Slot>>): boolean {
    switch (node.k) {
      case 'num': return Boolean(node.float)
      case 'id': { const slot = lookup(node.name, scopes); return Boolean(slot && FLOAT_TYPES.has(slot.type)) || node.name === 'PI' }
      case 'binary': return isFloatExpr(node.left, scopes) || isFloatExpr(node.right, scopes)
      case 'unary': return isFloatExpr(node.arg, scopes)
      case 'cast': return FLOAT_TYPES.has(node.type)
      case 'ternary': return isFloatExpr(node.then, scopes) || isFloatExpr(node.otherwise, scopes)
      case 'call': return node.callee.k === 'id' && (['sqrt', 'pow', 'sin', 'cos', 'tan', 'atan2', 'log', 'exp', 'fabs', 'floor', 'ceil'].includes(node.callee.name) || FLOAT_TYPES.has(program.functions.get(node.callee.name)?.type ?? ''))
      case 'index': return isFloatExpr(node.target, scopes)
      default: return false
    }
  }

  function lookup(name: string, scopes: Array<Map<string, Slot>>): Slot | undefined {
    for (let index = scopes.length - 1; index >= 0; index -= 1) { const slot = scopes[index].get(name); if (slot) return slot }
    return globals.get(name)
  }

  function* tick(): Generator<Yield, void, void> {
    ops += 1
    micros += OP_MICROS
    if (ops % BUSY_EVERY === 0) yield { kind: 'busy' }
  }

  function* declare(node: Node, scope: Map<string, Slot>, scopes: Array<Map<string, Slot>>): Generator<Yield, void, void> {
    for (const item of node.items) {
      if (item.size) {
        const size = Number(yield* evaluate(item.size, scopes))
        const values = item.init?.k === 'list' ? [] as Value[] : []
        if (item.init?.k === 'list') for (const value of item.init.values) values.push(coerce(item.type, yield* evaluate(value, scopes)))
        const length = size < 0 ? values.length : size
        if (!Number.isInteger(length) || length < 0 || length > 4096) fail(item.line, 'Kích thước mảng phải từ 0 đến 4096.')
        while (values.length < length) values.push(item.type === 'String' ? '' : 0)
        scope.set(item.name, { value: values, type: item.type })
      } else {
        const value = item.init ? yield* evaluate(item.init, scopes) : item.type === 'String' ? '' : 0
        scope.set(item.name, { value: coerce(item.type, value), type: item.type })
      }
    }
  }

  function* execute(node: Node, scopes: Array<Map<string, Slot>>): Generator<Yield, void, void> {
    yield* tick()
    switch (node.k) {
      case 'block': { const inner = [...scopes, new Map<string, Slot>()]; for (const statement of node.body) yield* execute(statement, inner); return }
      case 'decl': return yield* declare(node, scopes[scopes.length - 1], scopes)
      case 'expr': yield* evaluate(node.expr, scopes); return
      case 'empty': return
      case 'if': if (truthy(yield* evaluate(node.test, scopes))) yield* execute(node.then, scopes); else if (node.otherwise) yield* execute(node.otherwise, scopes); return
      case 'switch': {
        const value = yield* evaluate(node.test, scopes)
        if (typeof value !== 'number' || !Number.isInteger(value)) return fail(node.line, 'Biểu thức switch phải cho giá trị nguyên.')
        const cases: Array<{ value: number | null; body: Node[] }> = node.cases
        const match = cases.findIndex(branch => branch.value === value)
        const start = match < 0 ? cases.findIndex(branch => branch.value === null) : match
        if (start < 0) return
        const inner = [...scopes, new Map<string, Slot>()]
        try {
          for (const branch of cases.slice(start)) {
            for (const statement of branch.body) yield* execute(statement, inner)
          }
        } catch (signal) {
          if (!(signal instanceof Signal && signal.type === 'break')) throw signal
        }
        return
      }
      case 'while': while (truthy(yield* evaluate(node.test, scopes))) { const signal = yield* loopBody(node.body, scopes); if (signal === 'break') break } return
      case 'do': do { const signal = yield* loopBody(node.body, scopes); if (signal === 'break') break } while (truthy(yield* evaluate(node.test, scopes))); return
      case 'for': {
        const inner = [...scopes, new Map<string, Slot>()]
        if (node.init) yield* execute(node.init, inner)
        while (!node.test || truthy(yield* evaluate(node.test, inner))) {
          const signal = yield* loopBody(node.body, inner)
          if (signal === 'break') break
          if (node.update) yield* evaluate(node.update, inner)
        }
        return
      }
      case 'return': throw new Signal('return', node.value ? yield* evaluate(node.value, scopes) : undefined)
      case 'break': throw new Signal('break')
      case 'continue': throw new Signal('continue')
      default: fail(node.line, `Câu lệnh ${node.k} chưa được hỗ trợ.`)
    }
  }

  function* loopBody(body: Node, scopes: Array<Map<string, Slot>>): Generator<Yield, 'break' | 'continue' | undefined, void> {
    try { yield* execute(body, scopes) } catch (signal) {
      if (signal instanceof Signal && signal.type !== 'return') return signal.type
      throw signal
    }
    return undefined
  }

  const truthy = (value: Value) => typeof value === 'string' ? value.length > 0 : Array.isArray(value) ? true : value !== 0

  function* evaluate(node: Node, scopes: Array<Map<string, Slot>>): Generator<Yield, Value, void> {
    yield* tick()
    switch (node.k) {
      case 'num': return node.value
      case 'str': return node.value
      case 'seq': yield* evaluate(node.left, scopes); return yield* evaluate(node.right, scopes)
      case 'id': {
        const slot = lookup(node.name, scopes)
        if (slot) return slot.value
        if (node.name in constants) return constants[node.name]
        if (node.name === 'LED_BUILTIN') return fail(node.line, `${board.name} không có LED_BUILTIN đơn. ${board.note}`)
        return fail(node.line, `Biến '${node.name}' chưa được khai báo.`)
      }
      case 'index': {
        const target = yield* evaluate(node.target, scopes)
        const index = Math.trunc(Number(yield* evaluate(node.index, scopes)))
        if (typeof target === 'string') return target.charCodeAt(index) || 0
        if (!Array.isArray(target)) return fail(node.line, 'Chỉ truy cập [ ] trên mảng hoặc chuỗi.')
        if (index < 0 || index >= target.length) return fail(node.line, `Chỉ số ${index} vượt mảng ${target.length} phần tử.`)
        return target[index]
      }
      case 'ternary': return truthy(yield* evaluate(node.test, scopes)) ? yield* evaluate(node.then, scopes) : yield* evaluate(node.otherwise, scopes)
      case 'cast': { const value = yield* evaluate(node.arg, scopes); return node.type === 'String' ? String(value) : coerce(node.type, Number(value)) }
      case 'unary': {
        const value = yield* evaluate(node.arg, scopes)
        if (node.op === '!') return truthy(value) ? 0 : 1
        if (node.op === '-') return -Number(value)
        if (node.op === '~') return ~Number(value)
        return Number(value)
      }
      case 'binary': {
        if (node.op === '&&') return truthy(yield* evaluate(node.left, scopes)) && truthy(yield* evaluate(node.right, scopes)) ? 1 : 0
        if (node.op === '||') return truthy(yield* evaluate(node.left, scopes)) || truthy(yield* evaluate(node.right, scopes)) ? 1 : 0
        const left = yield* evaluate(node.left, scopes)
        const right = yield* evaluate(node.right, scopes)
        return binary(node, left, right, isFloatExpr(node.left, scopes) || isFloatExpr(node.right, scopes))
      }
      case 'assign': {
        let value = yield* evaluate(node.value, scopes)
        const slot = node.target.k === 'id' ? lookup(node.target.name, scopes) : undefined
        if (node.target.k === 'id' && !slot) return fail(node.line, `Biến '${node.target.name}' chưa được khai báo.`)
        const current = node.op === '=' ? undefined : yield* evaluate(node.target, scopes)
        if (current !== undefined) value = binary({ ...node, op: node.op.slice(0, -1) }, current, value, isFloatExpr(node.target, scopes) || isFloatExpr(node.value, scopes))
        return yield* store(node.target, value, scopes)
      }
      case 'update': {
        const before = Number(yield* evaluate(node.target, scopes))
        const after = yield* store(node.target, before + (node.op === '++' ? 1 : -1), scopes)
        return node.prefix ? after : before
      }
      case 'call': return yield* call(node, scopes)
      case 'member': return fail(node.line, `Thuộc tính '${node.name}' chưa được hỗ trợ.`)
      case 'list': return fail(node.line, 'Danh sách { } chỉ dùng khi khai báo mảng.')
      default: return fail(node.line, `Biểu thức ${node.k} chưa được hỗ trợ.`)
    }
  }

  function binary(node: Node, left: Value, right: Value, isFloat: boolean): Value {
    if (node.op === '+' && (typeof left === 'string' || typeof right === 'string')) return `${typeof left === 'number' && isFloat ? left.toFixed(2) : left}${typeof right === 'number' && isFloat ? right.toFixed(2) : right}`
    if (node.op === '==' || node.op === '!=') { const equal = left === right || (typeof left !== 'string' && typeof right !== 'string' && Number(left) === Number(right)); return (node.op === '==') === equal ? 1 : 0 }
    const a = Number(left)
    const b = Number(right)
    switch (node.op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return isFloat ? a * b : Math.trunc(a * b)
      case '/': if (b === 0) { if (isFloat) return a / b; fail(node.line, 'Chia số nguyên cho 0.') } return isFloat ? a / b : Math.trunc(a / b)
      case '%': if (b === 0) fail(node.line, 'Chia lấy dư cho 0.'); return Math.trunc(a) % Math.trunc(b)
      case '<': return a < b ? 1 : 0
      case '>': return a > b ? 1 : 0
      case '<=': return a <= b ? 1 : 0
      case '>=': return a >= b ? 1 : 0
      case '&': return a & b
      case '|': return a | b
      case '^': return a ^ b
      case '<<': return a << b
      case '>>': return a >> b
      default: return fail(node.line, `Toán tử ${node.op} chưa được hỗ trợ.`)
    }
  }

  function* store(target: Node, value: Value, scopes: Array<Map<string, Slot>>): Generator<Yield, Value, void> {
    if (target.k === 'id') {
      const slot = lookup(target.name, scopes)
      if (!slot) return fail(target.line, `Biến '${target.name}' chưa được khai báo.`)
      slot.value = coerce(slot.type, value)
      return slot.value
    }
    if (target.k === 'index' && target.target.k === 'id') {
      const slot = lookup(target.target.name, scopes)
      if (!slot || !Array.isArray(slot.value)) return fail(target.line, 'Chỉ gán [ ] cho mảng.')
      const index = Math.trunc(Number(yield* evaluate(target.index, scopes)))
      if (index < 0 || index >= slot.value.length) return fail(target.line, `Chỉ số ${index} vượt mảng ${slot.value.length} phần tử.`)
      slot.value[index] = coerce(slot.type, value)
      return slot.value[index]
    }
    return fail(target.line, 'Không gán được giá trị này.')
  }

  function* call(node: Node, scopes: Array<Map<string, Slot>>): Generator<Yield, Value, void> {
    const callee = node.callee
    const args: Value[] = []
    for (const arg of node.args) args.push(yield* evaluate(arg, scopes))
    const argFloat = (index: number) => node.args[index] ? isFloatExpr(node.args[index], scopes) : false
    if (callee.k === 'member' && callee.object.k === 'id' && /^Serial\d?$/.test(callee.object.name)) {
      switch (callee.name) {
        case 'begin': case 'flush': case 'setTimeout': return 0
        case 'available': return 0
        case 'read': return -1
        case 'print': print(formatNumber(args[0] ?? '', args[1] === undefined ? undefined : Number(args[1]), argFloat(0))); return 0
        case 'println': print(`${args.length ? formatNumber(args[0], args[1] === undefined ? undefined : Number(args[1]), argFloat(0)) : ''}\r\n`); return 0
        case 'printf': {
          let index = 1
          print(String(args[0] ?? '').replace(/%(-?\d*)(?:\.(\d+))?([dioufFsxXc%])/g, (_, width: string, precision: string | undefined, type: string) => {
            if (type === '%') return '%'
            const value = args[index++]
            const text = type === 's' ? String(value) : type === 'c' ? String.fromCharCode(Number(value)) : type === 'x' ? (Number(value) >>> 0).toString(16) : type === 'X' ? (Number(value) >>> 0).toString(16).toUpperCase() : type === 'f' || type === 'F' ? Number(value).toFixed(precision === undefined ? 6 : Number(precision)) : String(Math.trunc(Number(value)))
            return width ? (width.startsWith('-') ? text.padEnd(Number(width.slice(1))) : text.padStart(Number(width))) : text
          }))
          return 0
        }
        default: return fail(node.line, `Serial.${callee.name} chưa được mô phỏng.`)
      }
    }
    if (callee.k === 'member' && callee.name === 'length' && args.length === 0) {
      const owner = yield* evaluate(callee.object, scopes)
      if (typeof owner === 'string') return new TextEncoder().encode(owner).byteLength
      return fail(node.line, 'length() chỉ dùng cho String.')
    }
    if (callee.k === 'member') return fail(node.line, `${callee.object.name ?? 'Đối tượng'}.${callee.name} chưa được mô phỏng (ví dụ WiFi, Wire, SPI cần thư viện ngoại vi).`)
    if (callee.k !== 'id') return fail(node.line, 'Lời gọi hàm không hợp lệ.')
    const name: string = callee.name
    const user = program.functions.get(name)
    if (user) {
      if (args.length !== user.params.length) return fail(node.line, `Hàm ${name} cần ${user.params.length} tham số, nhận ${args.length}.`)
      if (scopes.length > 64) return fail(node.line, 'Đệ quy quá sâu (giới hạn 64 tầng).')
      const scope = new Map<string, Slot>(user.params.map((param: { name: string; type: string }, index: number) => [param.name, { value: coerce(param.type, args[index]), type: param.type }]))
      try { yield* execute(user.body, [scope]) } catch (signal) {
        if (signal instanceof Signal && signal.type === 'return') return signal.value === undefined ? 0 : coerce(user.type, signal.value)
        throw signal
      }
      return 0
    }
    const n = (index: number) => Number(args[index] ?? 0)
    switch (name) {
      case 'pinMode': {
        const pin = pinOf(args[0], node.line)
        const mode = n(1)
        const state = (pins[pin] ??= { mode: 'unset', level: false })
        state.mode = mode === 1 ? 'output' : mode === 2 ? 'input_pullup' : 'input'
        if (state.mode === 'output' && board.id === 'esp32-devkit' && pin >= 34) fail(node.line, `GPIO ${pin} của ESP32 chỉ là input.`)
        return 0
      }
      case 'digitalWrite': {
        const pin = pinOf(args[0], node.line)
        if (pins[pin]?.mode !== 'output') warnings.add(`Dòng ${node.line}: digitalWrite(${pin}) khi chân chưa đặt OUTPUT — trên board thật chỉ bật/tắt điện trở kéo lên.`)
        write(pin, truthy(args[1]))
        return 0
      }
      case 'digitalRead': {
        const pin = pinOf(args[0], node.line)
        digitalReads.add(pin)
        const state = pins[pin]
        if (state?.mode === 'output') return state.level ? 1 : 0
        return digitalInputs.get(pin) ?? (state?.mode === 'input_pullup') ? 1 : 0
      }
      case 'analogRead': {
        const pin = pinOf(args[0], node.line)
        if (!board.adcPins.includes(pin)) fail(node.line, `GPIO ${pin} không có ADC trên ${board.name}.`)
        analogReads.add(pin)
        return Math.round(Math.min(1, Math.max(0, analogInputs.get(pin) ?? 0)) * (2 ** board.adcBits - 1))
      }
      case 'analogReadResolution': return 0
      case 'analogWrite': { const pin = pinOf(args[0], node.line); const duty = Math.min(255, Math.max(0, Math.trunc(n(1)))); write(pin, duty > 0, duty / 255); return 0 }
      case 'ledcSetup': return 0
      case 'ledcAttachPin': ledc.set(n(1), pinOf(args[0], node.line)); return 0
      case 'ledcAttach': { const pin = pinOf(args[0], node.line); ledc.set(pin, pin); (pins[pin] ??= { mode: 'output', level: false }).mode = 'output'; return 1 }
      case 'ledcWrite': {
        const pin = ledc.get(n(0)) ?? fail(node.line, `Kênh/chân ${n(0)} chưa ledcAttach.`)
        const duty = Math.min(1, Math.max(0, n(1) / (2 ** board.pwmBits - 1)))
        write(pin, duty > 0, duty)
        return 0
      }
      case 'tone': case 'noTone': write(pinOf(args[0], node.line), name === 'tone'); return 0
      case 'delay': { const ms = n(0); if (ms < 0) fail(node.line, 'delay() nhận số không âm.'); yield { kind: 'delay', micros: ms * 1000 }; return 0 }
      case 'delayMicroseconds': yield { kind: 'delay', micros: Math.max(0, n(0)) }; return 0
      case 'millis': return Math.floor(micros / 1000)
      case 'micros': return Math.floor(micros)
      case 'yield': yield { kind: 'busy' }; return 0
      case 'map': { const [x, inMin, inMax, outMin, outMax] = [0, 1, 2, 3, 4].map(n); if (inMax === inMin) fail(node.line, 'map(): khoảng vào bằng 0.'); return Math.trunc((x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin) }
      case 'constrain': return Math.min(n(2), Math.max(n(1), n(0)))
      case 'min': return Math.min(n(0), n(1))
      case 'max': return Math.max(n(0), n(1))
      case 'abs': case 'fabs': return Math.abs(n(0))
      case 'sqrt': return Math.sqrt(n(0))
      case 'pow': return Math.pow(n(0), n(1))
      case 'sin': return Math.sin(n(0))
      case 'cos': return Math.cos(n(0))
      case 'tan': return Math.tan(n(0))
      case 'atan2': return Math.atan2(n(0), n(1))
      case 'log': return Math.log(n(0))
      case 'exp': return Math.exp(n(0))
      case 'floor': return Math.floor(n(0))
      case 'ceil': return Math.ceil(n(0))
      case 'round': return Math.round(n(0))
      case 'randomSeed': randomSeed = Math.trunc(n(0)) || 1; return 0
      case 'random': {
        randomSeed = (randomSeed * 1103515245 + 12345) & 0x7fffffff
        const [low, high] = args.length > 1 ? [n(0), n(1)] : [0, n(0)]
        return high <= low ? low : low + (randomSeed % Math.trunc(high - low))
      }
      case 'String': return args.length > 1 && typeof args[0] === 'number' ? formatNumber(args[0], n(1), argFloat(0)) : formatNumber(args[0] ?? '', undefined, argFloat(0))
      case 'bitRead': return (n(0) >> n(1)) & 1
      case 'bit': return 1 << n(0)
      default: return fail(node.line, `Hàm '${name}' chưa được mô phỏng${/^(WiFi|Wire|SPI|ble|esp_)/i.test(name) ? ' (thư viện ngoại vi)' : ''}.`)
    }
  }

  function* runProgram(): Generator<Yield, void, void> {
    const scope = new Map<string, Slot>()
    for (const decl of program.globals) yield* declare(decl, scope, [scope])
    for (const [name, slot] of scope) globals.set(name, slot)
    yield* invoke('setup')
    phase = 'loop'
    for (;;) yield* invoke('loop')
  }

  function* invoke(name: string): Generator<Yield, void, void> {
    try { yield* execute(program.functions.get(name)!.body, [new Map()]) } catch (signal) {
      if (signal instanceof Signal && signal.type === 'return') return
      if (signal instanceof Signal) throw new RuntimeError(program.functions.get(name)!.line, `${signal.type} nằm ngoài vòng lặp.`)
      throw signal
    }
  }

  const generator = runProgram()

  function snapshot(): SketchSnapshot {
    return {
      simulatedMilliseconds: micros / 1000,
      pins: Object.fromEntries(Object.entries(pins).map(([pin, state]) => [pin, { ...state }])),
      serial,
      serialTruncated,
      events: Object.fromEntries(Object.entries(events).map(([pin, list]) => [pin, [...list]])),
      analogReads: [...analogReads].sort((a, b) => a - b),
      digitalReads: [...digitalReads].sort((a, b) => a - b),
      error,
      warnings: [...warnings].slice(0, 8),
      phase,
    }
  }

  return {
    board,
    advance(millis) {
      if (phase === 'stopped' || error) return snapshot()
      const target = micros + millis * 1000
      const opBudget = ops + 400_000
      try {
        while (micros < target && ops < opBudget) {
          if (delayUntil !== undefined) {
            if (delayUntil > target) { micros = target; break }
            micros = delayUntil
            delayUntil = undefined
          }
          const step = generator.next()
          if (step.done) break
          if (step.value.kind === 'delay') delayUntil = micros + step.value.micros
        }
      } catch (caught) {
        if (caught instanceof RuntimeError) error = { line: caught.line, message: caught.message }
        else error = { line: 0, message: caught instanceof Error ? caught.message : 'Lỗi khi thông dịch sketch.' }
        phase = 'stopped'
      }
      return snapshot()
    },
    setDigitalInput(pin, level) { digitalInputs.set(pin, level) },
    setAnalogInput(pin, raw) { analogInputs.set(pin, raw) },
    stop() { phase = 'stopped' },
    snapshot,
  }
}
