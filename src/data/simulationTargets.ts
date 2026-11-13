import { boards } from './boards'

/**
 * Board-specific mapping for Mạch Mở's deterministic teaching simulator.
 * The integer is an interpreter alias for the selected board, not proof that
 * the sketch compiles for that target. All entries intentionally advertise the
 * same narrow external-LED behavior profile, not MCU firmware emulation.
 */
export type SimulationTarget = {
  boardId: string
  name: string
  mcu: string
  architecture: string
  codePin: number
  pinLabel: string
  logicLevel: string
  exercise: string
  sourceUrl: string
  /** Largest default analogRead() value in the board's Arduino core; set only after checking the source. */
  adcFullScale?: number
  /** Output pins for segments A–G; set only when each pin is safe to drive on this board. */
  sevenSegmentPins?: readonly number[]
}

// ESP32 pins skip flash GPIO 6–11, strapping GPIO 0/2/5/12/15, UART GPIO 1/3 and input-only GPIO 34–39.
const esp32DevkitSegmentPins = [13, 14, 27, 26, 25, 33, 32]
const arduinoSegmentPins = [2, 3, 4, 5, 6, 7, 8]

const targetMappings: Array<Omit<SimulationTarget, 'name' | 'mcu' | 'logicLevel' | 'sourceUrl'> & { pinLabel: string; architecture: string }> = [
  { boardId:'esp32-devkit', architecture:'Xtensa LX6', codePin:23, pinLabel:'GPIO 23', exercise:'LED ngoài · GPIO 23', adcFullScale:4095, sevenSegmentPins:esp32DevkitSegmentPins },
  { boardId:'arduino-uno-r3', architecture:'AVR 8-bit', codePin:13, pinLabel:'D13', exercise:'LED ngoài · D13', adcFullScale:1023, sevenSegmentPins:arduinoSegmentPins },
  { boardId:'arduino-nano-classic', architecture:'AVR 8-bit', codePin:13, pinLabel:'D13', exercise:'LED ngoài · D13', adcFullScale:1023, sevenSegmentPins:arduinoSegmentPins },
  { boardId:'arduino-mega-2560-r3', architecture:'AVR 8-bit', codePin:13, pinLabel:'D13', exercise:'LED ngoài · D13', adcFullScale:1023, sevenSegmentPins:arduinoSegmentPins },
  { boardId:'stm32-nucleo', architecture:'Arm Cortex-M4', codePin:13, pinLabel:'D13 · PA5', exercise:'LED ngoài · D13 / PA5' },
  { boardId:'esp32-c3-devkitm-1', architecture:'RISC-V 32-bit', codePin:3, pinLabel:'GPIO 3', exercise:'LED ngoài · GPIO 3' },
  { boardId:'esp32-s3-devkitc-1', architecture:'Xtensa LX7', codePin:4, pinLabel:'GPIO 4', exercise:'LED ngoài · GPIO 4' },
  { boardId:'stm32-blue-pill-f103', architecture:'Arm Cortex-M3', codePin:5, pinLabel:'PA5', exercise:'LED ngoài · PA5 alias 5' },
  { boardId:'raspberry-pi-pico', architecture:'Arm Cortex-M0+', codePin:15, pinLabel:'GP15', exercise:'LED ngoài · GP15 alias 15' },
  { boardId:'raspberry-pi-pico-w', architecture:'Arm Cortex-M0+', codePin:15, pinLabel:'GP15', exercise:'LED ngoài · GP15 alias 15' },
  { boardId:'raspberry-pi-pico-2', architecture:'Arm Cortex-M33 / Hazard3 RISC-V', codePin:15, pinLabel:'GP15', exercise:'LED ngoài · GP15 alias 15' },
  { boardId:'esp32-c6-devkitc-1', architecture:'RISC-V 32-bit', codePin:3, pinLabel:'GPIO 3', exercise:'LED ngoài · GPIO 3' },
  { boardId:'stm32-nucleo-f411re', architecture:'Arm Cortex-M4', codePin:13, pinLabel:'D13 · PA5', exercise:'LED ngoài · D13 / PA5' },
  { boardId:'arduino-uno-r4-minima', architecture:'Arm Cortex-M4', codePin:13, pinLabel:'D13', exercise:'LED ngoài · D13' },
  { boardId:'arduino-uno-r4-wifi', architecture:'Arm Cortex-M4 + ESP32-S3', codePin:13, pinLabel:'D13', exercise:'LED ngoài · D13' },
  { boardId:'arduino-nano-esp32', architecture:'Xtensa LX7', codePin:4, pinLabel:'GPIO 4', exercise:'LED ngoài · GPIO 4' },
  { boardId:'arduino-nano-every', architecture:'AVR 8-bit', codePin:13, pinLabel:'D13', exercise:'LED ngoài · D13' },
  { boardId:'esp32-s2-devkitc-1', architecture:'Xtensa LX7', codePin:4, pinLabel:'GPIO 4', exercise:'LED ngoài · GPIO 4' },
  { boardId:'esp32-h2-devkitm-1', architecture:'RISC-V 32-bit', codePin:3, pinLabel:'GPIO 3', exercise:'LED ngoài · GPIO 3' },
  { boardId:'stm32-nucleo-l476rg', architecture:'Arm Cortex-M4', codePin:13, pinLabel:'D13 · PA5', exercise:'LED ngoài · D13 / PA5' },
  { boardId:'stm32-nucleo-f446re', architecture:'Arm Cortex-M4', codePin:13, pinLabel:'D13 · PA5', exercise:'LED ngoài · D13 / PA5' },
]

export const simulationTargets: SimulationTarget[] = targetMappings.flatMap(mapping => {
  const board = boards.find(item => item.id === mapping.boardId)
  if (!board) return []
  return [{
    ...mapping,
    name: board.name,
    mcu: board.mcu ?? 'MCU tham chiếu',
    logicLevel: board.logicLevel ?? 'Đối chiếu tài liệu board',
    sourceUrl: board.sourceEvidenceUrl ?? board.sourceUrl ?? '',
  }]
})

export function getSimulationTarget(boardId: string): SimulationTarget {
  return simulationTargets.find(target => target.boardId === boardId)
    ?? simulationTargets[0]
}

/** Migrate the four early demo IDs saved in existing browser sessions. */
export function normalizeSimulationTargetId(value: string | undefined): string {
  const legacy: Record<string, string> = {
    esp32: 'esp32-devkit',
    uno: 'arduino-uno-r3',
    nano: 'arduino-nano-classic',
    stm32: 'stm32-nucleo',
  }
  const candidate = value ? legacy[value] ?? value : ''
  return simulationTargets.some(target => target.boardId === candidate)
    ? candidate
    : 'esp32-devkit'
}
