export type AnalogWaveformSample = { time: number; value: number }
export type LogicWaveformEvent = { time: number; level: boolean }

export function formatAxisDeltaSymbol(axisType: string) {
  return axisType === 'frequency' ? 'Δf' : 'Δt'
}

export function measureAnalogCursors(
  samples: readonly AnalogWaveformSample[],
  cursorA: number,
  cursorB: number,
  timeUnit: string,
  valueUnit: string,
) {
  if (samples.length < 2 || !Number.isInteger(cursorA) || !Number.isInteger(cursorB)
    || cursorA < 0 || cursorB < 0 || cursorA >= samples.length || cursorB >= samples.length) return null
  if (samples.some((sample, index) => !Number.isFinite(sample.time) || !Number.isFinite(sample.value)
    || (index > 0 && sample.time < samples[index - 1].time))) return null
  return {
    deltaTime: Math.abs(samples[cursorB].time - samples[cursorA].time),
    deltaValue: samples[cursorB].value - samples[cursorA].value,
    timeUnit,
    valueUnit,
  }
}

export function measureLogicSignal(events: readonly LogicWaveformEvent[]) {
  if (!Array.isArray(events) || events.length < 4) return null
  let previousTime = -Infinity
  for (const event of events) {
    if (!event || typeof event !== 'object' || Array.isArray(event)
      || typeof event.level !== 'boolean' || !Number.isFinite(event.time)
      || event.time < 0 || event.time <= previousTime) return null
    previousTime = event.time
  }
  const rising = events.filter((event, index) => index > 0 && event.level && !events[index - 1].level)
  const periods: Array<{ duration: number; high: number }> = []
  for (let index = 0; index < rising.length - 1; index += 1) {
    const start = rising[index]
    const end = rising[index + 1]
    const falling = events.find(event => !event.level && event.time > start.time && event.time < end.time)
    const duration = end.time - start.time
    if (falling && duration > 0) periods.push({ duration, high: falling.time - start.time })
  }
  if (!periods.length) return null
  const mean = (key: 'duration' | 'high') => periods.reduce((sum, period) => sum + period[key], 0) / periods.length
  const period = mean('duration')
  const frequencyHz = 1000 / period
  const dutyCycle = mean('high') / period * 100
  if (!Number.isFinite(frequencyHz) || !Number.isFinite(dutyCycle) || frequencyHz <= 0 || dutyCycle < 0 || dutyCycle > 100) return null
  return { frequencyHz, dutyCycle, periods: periods.length, valueUnit: 'logic' as const }
}
