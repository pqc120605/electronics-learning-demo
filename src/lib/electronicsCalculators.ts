const e24Base = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]

function positive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} phải là số dương.`)
}

export function nearestE24AtOrAbove(ohms: number): number {
  positive(ohms, 'Điện trở')
  for (let exponent = Math.max(-12, Math.floor(Math.log10(ohms)) - 1); exponent <= 12; exponent += 1) {
    const multiplier = 10 ** exponent
    const candidate = e24Base.map(value => value * multiplier).find(value => value >= ohms * (1 - 1e-12))
    if (candidate !== undefined) return candidate
  }
  throw new Error('Giá trị vượt dải điện trở E24 được hỗ trợ.')
}

export function calculateLedResistor(supplyVolts: number, forwardVolts: number, currentMilliAmps: number) {
  positive(supplyVolts, 'V nguồn')
  positive(forwardVolts, 'Vf LED')
  positive(currentMilliAmps, 'Dòng LED')
  if (supplyVolts <= forwardVolts) throw new Error('V nguồn phải lớn hơn Vf LED để có thể giới hạn dòng bằng điện trở.')
  const idealOhms = Number(((supplyVolts - forwardVolts) / (currentMilliAmps / 1000)).toPrecision(12))
  const standardOhms = nearestE24AtOrAbove(idealOhms)
  const actualCurrentMilliAmps = (supplyVolts - forwardVolts) / standardOhms * 1000
  const resistorPowerMilliwatts = actualCurrentMilliAmps ** 2 / 1000 * standardOhms
  return { idealOhms, standardOhms, actualCurrentMilliAmps, resistorPowerMilliwatts }
}

export function calculateAdcDivider(inputMaxVolts: number, adcMaxVolts: number, lowerResistorKOhms: number) {
  positive(inputMaxVolts, 'Vin')
  positive(adcMaxVolts, 'V ADC')
  positive(lowerResistorKOhms, 'R2')
  if (adcMaxVolts >= inputMaxVolts) throw new Error('V ADC phải nhỏ hơn Vin để tính bộ chia áp hạ áp.')
  const lowerResistorOhms = lowerResistorKOhms * 1000
  const idealR1Ohms = Number((lowerResistorOhms * (inputMaxVolts / adcMaxVolts - 1)).toPrecision(12))
  const standardR1Ohms = nearestE24AtOrAbove(idealR1Ohms)
  const outputAtMaxVolts = inputMaxVolts * lowerResistorOhms / (standardR1Ohms + lowerResistorOhms)
  const inputCurrentMicroAmps = inputMaxVolts / (standardR1Ohms + lowerResistorOhms) * 1_000_000
  return { idealR1Ohms, standardR1Ohms, lowerResistorOhms, outputAtMaxVolts, inputCurrentMicroAmps }
}

export type I2cSpeed = 'standard' | 'fast' | 'fastPlus'

const i2cTiming: Record<I2cSpeed, { maximumRiseTimeNs: number; maximumSinkCurrentMilliAmps: number }> = {
  standard: { maximumRiseTimeNs: 1000, maximumSinkCurrentMilliAmps: 3 },
  fast: { maximumRiseTimeNs: 300, maximumSinkCurrentMilliAmps: 3 },
  fastPlus: { maximumRiseTimeNs: 120, maximumSinkCurrentMilliAmps: 20 },
}

function e24ValuesBetween(minimum: number, maximum: number): number[] {
  const values: number[] = []
  for (let exponent = -1; exponent <= 8; exponent += 1) {
    for (const base of e24Base) {
      const value = base * 10 ** exponent
      if (value >= minimum && value <= maximum) values.push(value)
    }
  }
  return values
}

export function calculateI2cPullup(supplyVolts: number, busCapacitancePf: number, speed: I2cSpeed, lowLevelVolts = 0.4) {
  positive(supplyVolts, 'VDD')
  positive(busCapacitancePf, 'Điện dung bus')
  positive(lowLevelVolts, 'VOL')
  const timing = i2cTiming[speed]
  if (!timing) throw new Error('Tốc độ I²C không hợp lệ.')
  if (lowLevelVolts >= supplyVolts) throw new Error('VOL phải nhỏ hơn VDD.')
  const minimumOhms = (supplyVolts - lowLevelVolts) / (timing.maximumSinkCurrentMilliAmps / 1000)
  const maximumOhms = timing.maximumRiseTimeNs * 1e-9 / (0.8473 * busCapacitancePf * 1e-12)
  if (minimumOhms > maximumOhms) throw new Error('Không có dải điện trở thỏa cả giới hạn dòng kéo xuống và thời gian sườn lên. Hãy giảm tốc độ/điện dung bus hoặc dùng bộ đệm phù hợp.')
  const target = Math.sqrt(minimumOhms * maximumOhms)
  const candidates = e24ValuesBetween(minimumOhms, maximumOhms)
  if (candidates.length === 0) throw new Error('Không có giá trị E24 tiêu chuẩn trong dải cho phép; hãy chọn linh kiện chính xác hoặc điều chỉnh thông số bus.')
  const recommendedOhms = candidates.reduce((best, value) => Math.abs(Math.log(value / target)) < Math.abs(Math.log(best / target)) ? value : best, candidates[0])
  return { minimumOhms, maximumOhms, recommendedOhms, maximumRiseTimeNs: timing.maximumRiseTimeNs, maximumSinkCurrentMilliAmps: timing.maximumSinkCurrentMilliAmps }
}

export function calculateRc(resistanceKOhms: number, capacitanceMicroFarads: number) {
  positive(resistanceKOhms, 'R')
  positive(capacitanceMicroFarads, 'C')
  const timeConstantMs = resistanceKOhms * capacitanceMicroFarads
  const cutoffHz = 1 / (2 * Math.PI * resistanceKOhms * capacitanceMicroFarads * 0.001)
  return { timeConstantMs, oneTimeConstantPercent: 1 - Math.exp(-1), fiveTimeConstantsPercent: 1 - Math.exp(-5), cutoffHz }
}
