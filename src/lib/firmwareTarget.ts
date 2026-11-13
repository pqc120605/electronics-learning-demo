export type Atmega328pBoardId = 'arduino-uno-r3' | 'arduino-nano-classic'

export type Atmega328pFirmwareTarget = {
  boardId: Atmega328pBoardId
  name: string
  mcu: 'ATmega328P'
  clockHz: number
  flashBytes: number
  sramBytes: number
  d13Alias: 'D13'
  avrPort: 'PB5'
  referenceUrl: string
}

export const atmega328pFirmwareTargets: readonly Atmega328pFirmwareTarget[] = [
  {
    boardId: 'arduino-uno-r3',
    name: 'Arduino Uno R3',
    mcu: 'ATmega328P',
    clockHz: 16_000_000,
    flashBytes: 32 * 1024,
    sramBytes: 2 * 1024,
    d13Alias: 'D13',
    avrPort: 'PB5',
    referenceUrl: 'https://docs.arduino.cc/hardware/uno-rev3/',
  },
  {
    boardId: 'arduino-nano-classic',
    name: 'Arduino Nano classic',
    mcu: 'ATmega328P',
    clockHz: 16_000_000,
    flashBytes: 32 * 1024,
    sramBytes: 2 * 1024,
    d13Alias: 'D13',
    avrPort: 'PB5',
    referenceUrl: 'https://docs.arduino.cc/hardware/nano/',
  },
]

export function getAtmega328pFirmwareTarget(targetId: string | undefined) {
  return atmega328pFirmwareTargets.find((target) => target.boardId === targetId)
}

export function canRunAtmega328pFirmware(targetId: string | undefined, confirmed: boolean) {
  return Boolean(getAtmega328pFirmwareTarget(targetId) && confirmed)
}
