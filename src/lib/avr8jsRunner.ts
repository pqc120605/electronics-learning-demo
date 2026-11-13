import {
  AVRADC,
  AVRIOPort,
  AVRUSART,
  AVRTimer,
  CPU,
  PinState,
  adcConfig,
  avrInstruction,
  portBConfig,
  portCConfig,
  portDConfig,
  timer0Config,
  timer1Config,
  timer2Config,
  usart0Config,
} from 'avr8js'
import { inspectIntelHex } from './intelHex'
import { getAtmega328pFirmwareTarget, type Atmega328pBoardId, type Atmega328pFirmwareTarget } from './firmwareTarget'

const D13_MASK = 1 << 5
const MAX_TRANSITIONS = 128
const MAX_SERIAL_BYTES = 4_096

export type Atmega328pSnapshot = {
  target: `${Atmega328pBoardId}-atmega328p`
  cycles: number
  pc: number
  led13: 'input' | 'on' | 'off'
  pinTransitions: boolean[]
  pinTransitionEvents: Array<{ level: boolean; cycles: number; simulatedMilliseconds: number }>
  traceTruncated: boolean
  serialText: string
  serialByteCount: number
  serialTruncated: boolean
  simulatedMilliseconds: number
}

/** A bounded ATmega328P core + Uno/Nano port/timer/ADC/UART model for the isolated firmware spike. */
export function createAtmega328pMachine(hex: string, targetId: Atmega328pBoardId = 'arduino-uno-r3') {
  const target: Atmega328pFirmwareTarget = getAtmega328pFirmwareTarget(targetId) ?? (() => {
    throw new Error('Board đích này chưa được hỗ trợ ATmega328P.')
  })()
  const image = inspectIntelHex(hex, { maxBytes: target.flashBytes })
  if (image.segments.some((segment) => segment.address + segment.data.length > target.flashBytes)) {
    throw new Error('Firmware vượt bộ nhớ flash 32 KB của ATmega328P.')
  }

  const flash = new Uint8Array(target.flashBytes).fill(0xff)
  for (const segment of image.segments) flash.set(segment.data, segment.address)
  const program = new Uint16Array(target.flashBytes / 2)
  for (let index = 0; index < program.length; index += 1) {
    program[index] = flash[index * 2] | (flash[index * 2 + 1] << 8)
  }

  const cpu = new CPU(program, target.sramBytes)
  const portB = new AVRIOPort(cpu, portBConfig)
  new AVRIOPort(cpu, portCConfig)
  new AVRIOPort(cpu, portDConfig)
  new AVRTimer(cpu, timer0Config)
  new AVRTimer(cpu, timer1Config)
  new AVRTimer(cpu, timer2Config)
  new AVRADC(cpu, adcConfig)
  const usart = new AVRUSART(cpu, usart0Config, target.clockHz)

  const pinTransitions: boolean[] = []
  const pinTransitionEvents: Atmega328pSnapshot['pinTransitionEvents'] = []
  const serialBytes: number[] = []
  let traceTruncated = false
  let serialTruncated = false
  usart.onByteTransmit = (value) => {
    if (serialBytes.length < MAX_SERIAL_BYTES) serialBytes.push(value & 0xff)
    else serialTruncated = true
  }
  portB.addListener((value) => {
    if (!(cpu.data[portBConfig.DDR] & D13_MASK)) return
    const next = Boolean(value & D13_MASK)
    if (pinTransitionEvents.at(-1)?.level === next) return
    if (pinTransitions.length < MAX_TRANSITIONS) {
      pinTransitions.push(next)
      pinTransitionEvents.push({
        level: next,
        cycles: cpu.cycles,
        simulatedMilliseconds: cpu.cycles / (target.clockHz / 1000),
      })
    }
    else traceTruncated = true
  })

  function snapshot(): Atmega328pSnapshot {
    const pinState = portB.pinState(5)
    return {
      target: `${target.boardId}-atmega328p`,
      cycles: cpu.cycles,
      pc: cpu.pc,
      led13: pinState === PinState.High ? 'on' : pinState === PinState.Low ? 'off' : 'input',
      pinTransitions: [...pinTransitions],
      pinTransitionEvents: [...pinTransitionEvents],
      traceTruncated,
      serialText: new TextDecoder('utf-8').decode(new Uint8Array(serialBytes)),
      serialByteCount: serialBytes.length,
      serialTruncated,
      simulatedMilliseconds: cpu.cycles / (target.clockHz / 1000),
    }
  }

  return {
    step(cycleBudget: number): Atmega328pSnapshot {
      if (!Number.isSafeInteger(cycleBudget) || cycleBudget < 1) throw new Error('Ngân sách chu kỳ phải là số nguyên dương.')
      const targetCycle = Math.min(cpu.cycles + cycleBudget, target.clockHz)
      while (cpu.cycles < targetCycle) {
        avrInstruction(cpu)
        cpu.tick()
      }
      return snapshot()
    },
    snapshot,
    maxCycles: target.clockHz,
  }
}
