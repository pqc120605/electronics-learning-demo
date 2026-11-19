/** OBS-03: complete Serial lines, sample ordinals only; no inferred time or units. */
export const MAX_SERIAL_SAMPLES = 256
export const MAX_SERIAL_SERIES = 4
export const MAX_SERIAL_LINE = 512
export type SerialPlotSample = { ordinal: number; values: Record<string, number> }
export type SerialPlotState = {
  samples: SerialPlotSample[]
  series: string[]
  nextOrdinal: number
  partial: string
  droppingLine: boolean
}

export function createSerialPlot(): SerialPlotState {
  return { samples: [], series: [], nextOrdinal: 1, partial: '', droppingLine: false }
}

const numeric = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?'
const singleNumber = new RegExp(`^${numeric}$`)
const labelledNumber = new RegExp(`^([\\p{L}_][\\p{L}\\p{N}_-]{0,31}):\\s*(${numeric})$`, 'u')

function parseLine(raw: string): Array<[string, number]> | null {
  const line = raw.trim()
  if (!line) return null
  if (singleNumber.test(line)) return Number.isFinite(Number(line)) ? [['Giá trị', Number(line)]] : null
  const pairs: Array<[string, number]> = []
  const labels = new Set<string>()
  // Space after ':' is allowed; separators between pairs are comma, tab or space.
  for (const token of line.replace(/:\s+/g, ':').split(/[,\s]+/)) {
    const match = labelledNumber.exec(token)
    if (!match || labels.has(match[1]) || !Number.isFinite(Number(match[2]))) return null
    labels.add(match[1])
    pairs.push([match[1], Number(match[2])])
  }
  return pairs.length ? pairs : null
}

/** Ingest original runtime chunks before the independent raw monitor buffer rolls. */
export function appendSerialPlot(previous: SerialPlotState, chunk: string): SerialPlotState {
  if (!chunk) return previous
  const state: SerialPlotState = { ...previous, samples: [...previous.samples], series: [...previous.series] }
  for (const char of chunk) {
    if (char === '\n') {
      const parsed = state.droppingLine ? null : parseLine(state.partial)
      state.partial = ''
      state.droppingLine = false
      if (!parsed) continue
      const accepted = parsed.filter(([label]) => {
        if (state.series.includes(label)) return true
        if (state.series.length >= MAX_SERIAL_SERIES) return false
        state.series.push(label)
        return true
      })
      if (accepted.length) {
        state.samples.push({ ordinal: state.nextOrdinal++, values: Object.fromEntries(accepted) })
        if (state.samples.length > MAX_SERIAL_SAMPLES) state.samples.shift()
      }
    } else if (!state.droppingLine) {
      if (state.partial.length >= MAX_SERIAL_LINE) {
        state.partial = ''
        state.droppingLine = true
      } else state.partial += char
    }
  }
  return state
}

export function serialPlotCsv(state: SerialPlotState): string {
  const rows = ['sample,series,value']
  for (const sample of state.samples) {
    for (const [label, value] of Object.entries(sample.values)) {
      rows.push(`${sample.ordinal},"${label.replace(/"/g, '""')}",${value}`)
    }
  }
  return rows.join('\r\n') + '\r\n'
}
