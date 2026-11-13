export type LedAction =
  | { kind: 'pinMode'; pin: number; line?: number }
  | { kind: 'write'; pin: number; value: 'HIGH' | 'LOW'; line?: number }
  | { kind: 'delay'; milliseconds: number; line?: number }

export type LedProgramIr = { pin: number; setup: LedAction[]; loop: LedAction[] }

export const starterLedProgram: LedProgramIr = {
  pin: 23,
  setup: [{ kind: 'pinMode', pin: 23 }],
  loop: [
    { kind: 'write', pin: 23, value: 'HIGH' },
    { kind: 'delay', milliseconds: 500 },
    { kind: 'write', pin: 23, value: 'LOW' },
    { kind: 'delay', milliseconds: 500 },
  ],
}

export function generateLedCpp(program: LedProgramIr): string {
  const setup = program.setup.map((action) => action.kind === 'pinMode' ? `  pinMode(ledPin, OUTPUT);` : '')
  const loop = program.loop.map((action) => {
    if (action.kind === 'write') return `  digitalWrite(ledPin, ${action.value});`
    if (action.kind === 'delay') return `  delay(${action.milliseconds});`
    return `  pinMode(ledPin, OUTPUT);`
  })
  return `const int ledPin = ${program.pin};\n\nvoid setup() {\n${setup.join('\n')}\n}\n\nvoid loop() {\n${loop.join('\n')}\n}`
}

export function getProgramActions(program: LedProgramIr) {
  let ledLit = false
  return [...program.setup, ...program.loop].map((action, index) => {
    if (action.kind === 'write') ledLit = action.value === 'HIGH'
    return {
      action,
      index,
      section: index < program.setup.length ? 'setup' as const : 'loop' as const,
      ledLit,
      title: action.kind === 'pinMode' ? `Cấu hình GPIO ${action.pin} là đầu ra`
        : action.kind === 'write' ? `Đưa GPIO ${action.pin} về mức ${action.value}`
          : `Chờ ${action.milliseconds} ms`,
      explanation: action.kind === 'pinMode' ? 'Board chuẩn bị chân này để gửi tín hiệu điều khiển ra mạch.'
        : action.kind === 'write' ? action.value === 'HIGH' ? 'Tín hiệu đầu ra ở mức cao; trong ví dụ, LED được biểu diễn là sáng.' : 'Tín hiệu đầu ra ở mức thấp; trong ví dụ, LED được biểu diễn là tắt.'
          : 'Chương trình tạm dừng; trạng thái LED giữ nguyên trong khoảng chờ này.',
      featureIds: action.kind === 'pinMode' ? ['pin-headers'] : ['external-led', 'external-resistor', 'jumper-wires'],
    }
  })
}
