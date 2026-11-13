export type LdrDividerOptions = {
  supplyVolts?: number
  fixedResistorOhms?: number
  darkResistanceOhms?: number
  brightResistanceOhms?: number
  ldrPosition?: 'high' | 'low'
}

export type LdrDividerResult = {
  ldrResistanceOhms: number
  outputVoltageVolts: number
  normalizedPercent: number
}

const isPositiveFinite = (value: number) => Number.isFinite(value) && value > 0

/**
 * Educational divider model. The light-to-resistance curve is a stated assumption,
 * not a lux calibration or a model for any particular LDR part.
 */
export function calculateLdrDivider(lightPercent: number, options: LdrDividerOptions = {}): LdrDividerResult {
  const supplyVolts = options.supplyVolts ?? 3.3
  const fixedResistorOhms = options.fixedResistorOhms ?? 10_000
  const darkResistanceOhms = options.darkResistanceOhms ?? 100_000
  const brightResistanceOhms = options.brightResistanceOhms ?? 1_000
  const ldrPosition = options.ldrPosition ?? 'high'

  for (const [name, value] of Object.entries({ supplyVolts, fixedResistorOhms, darkResistanceOhms, brightResistanceOhms })) {
    if (!isPositiveFinite(value)) throw new RangeError(`${name} must be positive finite number`)
  }
  if (ldrPosition !== 'high' && ldrPosition !== 'low') throw new RangeError('ldrPosition must be high or low')

  const light = Math.max(0, Math.min(100, Number.isFinite(lightPercent) ? lightPercent : 0))
  const resistanceRatio = brightResistanceOhms / darkResistanceOhms
  const ldrResistanceOhms = darkResistanceOhms * resistanceRatio ** (light / 100)
  const outputVoltageVolts = ldrPosition === 'high'
    ? supplyVolts * fixedResistorOhms / (ldrResistanceOhms + fixedResistorOhms)
    : supplyVolts * ldrResistanceOhms / (fixedResistorOhms + ldrResistanceOhms)

  return {
    ldrResistanceOhms,
    outputVoltageVolts,
    normalizedPercent: outputVoltageVolts / supplyVolts * 100,
  }
}
