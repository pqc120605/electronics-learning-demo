export type DhtProtocol = 'dht11' | 'dht22'

export const dhtStimulusLimits = {
  dht11: { temperature: { min: 0, max: 50, step: 1 }, humidity: { min: 20, max: 90, step: 1 } },
  dht22: { temperature: { min: -40, max: 80, step: 0.1 }, humidity: { min: 0, max: 100, step: 0.1 } },
} as const

/** Encode only values representable by the selected sensor. Bus timing uses simulated microseconds. */
export function dhtPacket(protocol: DhtProtocol, temperature: number, humidity: number): number[] {
  const clamp = (value: number, { min, max }: { min: number; max: number }) => Math.max(min, Math.min(max, value))
  const limits = dhtStimulusLimits[protocol]
  const t = clamp(Number.isFinite(temperature) ? temperature : 23, limits.temperature)
  const h = clamp(Number.isFinite(humidity) ? humidity : 55, limits.humidity)
  const payload = protocol === 'dht11'
    ? [Math.round(h), 0, Math.round(t), 0]
    : (() => {
      const rh = Math.round(h * 10)
      const temp = Math.round(Math.abs(t) * 10) | (t < 0 ? 0x8000 : 0)
      return [rh >> 8, rh & 255, temp >> 8, temp & 255]
    })()
  return [...payload, payload.reduce((sum, value) => sum + value, 0) & 255]
}

export function createDhtWire(protocol: DhtProtocol) {
  let hostLowSince: number | undefined
  let nextAllowed = 0
  let edges: number[] = []
  let cursor = 0

  return {
    step(now: number, hostLow: boolean, outputHigh: boolean, temperature: number, humidity: number) {
      if (hostLow) {
        hostLowSince ??= now
        edges = []
        cursor = 0
      } else if (hostLowSince !== undefined) {
        const start = now - hostLowSince
        hostLowSince = undefined
        if (!outputHigh && now >= nextAllowed && start >= (protocol === 'dht11' ? 18_000 : 1_000)) {
          nextAllowed = now + 2_500_000
          let edge = now + 30
          edges = [edge, edge += 80, edge += 80]
          for (const byte of dhtPacket(protocol, temperature, humidity)) {
            for (let bit = 7; bit >= 0; bit--) {
              edges.push(edge += 50, edge += byte & (1 << bit) ? 70 : 27)
            }
          }
          edges.push(edge + 50)
          cursor = 0
        }
      }
      if (outputHigh) { edges = []; cursor = 0 }
      while (cursor < edges.length && edges[cursor] <= now) cursor++
      return { low: cursor % 2 === 1, nextMicroseconds: edges[cursor] ?? Infinity }
    },
  }
}
