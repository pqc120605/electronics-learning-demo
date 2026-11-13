import type { Atmega328pBoardId } from '../lib/firmwareTarget'
import type { Atmega328pSnapshot } from '../lib/avr8jsRunner'

export type AVR8jsWorkerRequest =
  | { type: 'start'; runId: string; hex: string; targetId: Atmega328pBoardId }
  | { type: 'stop'; runId: string }

export type AVR8jsWorkerResponse =
  | { type: 'frame' | 'complete'; runId: string; frame: Atmega328pSnapshot }
  | { type: 'stopped'; runId: string }
  | { type: 'error'; runId: string; message: string }
