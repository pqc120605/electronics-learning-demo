import type { LivePinState } from '../lib/avrLiveMachine'

/** Giao thức chung cho worker chạy firmware liên tục (AVR thật, MicroPython trên RP2040) — 2026-11-14. */
export type RuntimeInput = { pin: number; digital: boolean; analog: number }

export type LiveStartRequest =
  | { type: 'start'; runId: string; engine: 'avr'; board: string; hex: string; inputs: readonly RuntimeInput[] }
  | { type: 'start'; runId: string; engine: 'micropython'; bootrom: ArrayBuffer; firmware: ArrayBuffer; code: string; inputs: readonly RuntimeInput[] }

export type LiveWorkerRequest =
  | LiveStartRequest
  | { type: 'digital'; runId: string; pin: number; level: boolean }
  | { type: 'analog'; runId: string; pin: number; ratio: number }
  | { type: 'stop'; runId: string }

export type LiveFrame = {
  pins: Record<number, LivePinState>
  /** Serial mới kể từ khung trước. */
  serial: string
  simulatedMilliseconds: number
  /** Tỉ lệ thời gian mô phỏng / thời gian thực trong khung gần nhất. */
  speed: number
}

export type LiveWorkerResponse =
  | { type: 'frame'; runId: string; frame: LiveFrame }
  | { type: 'status'; runId: string; text: string }
  | { type: 'error'; runId: string; message: string }
  | { type: 'stopped'; runId: string; reason: string }

/** Dừng sau 10 phút mô phỏng để worker không chạy vô hạn khi người dùng quên tab. */
export const LIVE_MAX_SIMULATED_MS = 10 * 60 * 1000
