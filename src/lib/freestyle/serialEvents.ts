import type { SerialEntry } from '../signalFlow'
import { MAX_SERIAL_LINE } from './serialPlot'

type SerialEvents = { entries: SerialEntry[]; partial: string; droppingLine: boolean }

export function createSerialEvents(): SerialEvents {
  return { entries: [], partial: '', droppingLine: false }
}

/** Uses the simulated time of the frame in which a complete line became visible. */
export function appendSerialEvents(previous: SerialEvents, chunk: string, atMs: number): SerialEvents {
  if (!chunk) return previous
  const state = { ...previous, entries: [...previous.entries] }
  for (const char of chunk) {
    if (char === '\n') {
      const text = state.partial.trimEnd()
      if (!state.droppingLine && text) state.entries.push({ text, atMs })
      state.partial = ''
      state.droppingLine = false
    } else if (!state.droppingLine) {
      if (state.partial.length < MAX_SERIAL_LINE) state.partial += char
      else {
        state.partial = ''
        state.droppingLine = true
      }
    }
  }
  state.entries = state.entries.slice(-12)
  return state
}
