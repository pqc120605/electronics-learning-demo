import { calculateAdcDivider, calculateI2cPullup, calculateLedResistor, calculateRc, type I2cSpeed } from './electronicsCalculators'
import { calculateLdrDivider } from './analogDivider'
import { inspectSpiceNetlist } from '../simulation/spiceNetlist'

export type CalculatorSpiceId = 'led' | 'adc-divider' | 'i2c-pullup' | 'rc' | 'ldr-divider'
export type CalculatorSpiceHandoff = {
  schemaVersion: 1
  calculator: CalculatorSpiceId
  title: string
  assumption: string
  netlist: string
  returnTo?: string
}

export type CalculatorSpiceInputMap = {
  led: { supplyVolts: number; forwardVolts: number; currentMilliAmps: number }
  'adc-divider': { inputMaxVolts: number; adcMaxVolts: number; lowerResistorKOhms: number }
  'i2c-pullup': { supplyVolts: number; busCapacitancePf: number; speed: I2cSpeed }
  rc: { resistanceKOhms: number; capacitanceMicroFarads: number }
  'ldr-divider': { lightPercent: number }
}
type CalculatorInputs = CalculatorSpiceInputMap

const titles: Record<CalculatorSpiceId, string> = {
  led: 'LED và điện trở hạn dòng',
  'adc-divider': 'Bộ chia áp bảo vệ ADC',
  'i2c-pullup': 'Sườn lên I²C · mô hình RC',
  rc: 'Mạch RC bậc một',
  'ldr-divider': 'Bộ chia áp LDR · mạch DC tương đương',
}

function spiceNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error('Không thể chuyển trị số này sang netlist SPICE.')
  return value.toExponential(8).replace(/\.?(?:0+)e/, 'e')
}

function diodeSaturationCurrent(forwardVolts: number, currentMilliAmps: number): number {
  // Calibrate a simple Shockley diode at the calculator's E24 operating point.
  // n=2 and Vt=25.852 mV are explicit educational assumptions, not a part model.
  const exponent = forwardVolts / (2 * 0.025852)
  const logDenominator = exponent > 50
    ? exponent + Math.log1p(-Math.exp(-exponent))
    : Math.log(Math.expm1(exponent))
  const saturationCurrent = Math.exp(Math.log(currentMilliAmps / 1000) - logDenominator)
  if (!(saturationCurrent > 0) || !Number.isFinite(saturationCurrent)) {
    throw new Error('Không thể dựng model diode số học cho Vf này. Hãy kiểm tra thông số LED.')
  }
  return saturationCurrent
}

function makeNetlist(calculator: CalculatorSpiceId, input: CalculatorInputs[CalculatorSpiceId]): { netlist: string; assumption: string } {
  if (calculator === 'led') {
    const values = input as CalculatorInputs['led']
    const result = calculateLedResistor(values.supplyVolts, values.forwardVolts, values.currentMilliAmps)
    const saturationCurrent = diodeSaturationCurrent(values.forwardVolts, result.actualCurrentMilliAmps)
    return {
      netlist: `LED calculator equivalent · operating point\nV1 VIN 0 DC ${spiceNumber(values.supplyVolts)}\nR1 VIN ANODE ${spiceNumber(result.standardOhms)}\nD1 ANODE 0 DLED\n.model DLED D(IS=${spiceNumber(saturationCurrent)} N=2)\n.op\n.end`,
      assumption: `Điện trở dùng giá trị E24 ${spiceNumber(result.standardOhms)} Ω; diode Shockley lý tưởng được hiệu chỉnh tại Vf ${spiceNumber(values.forwardVolts)} V và dòng ước tính ${spiceNumber(result.actualCurrentMilliAmps)} mA (n=2, Vt=25,852 mV). Đây không phải model datasheet của một mã LED cụ thể.`,
    }
  }

  if (calculator === 'adc-divider') {
    const values = input as CalculatorInputs['adc-divider']
    const result = calculateAdcDivider(values.inputMaxVolts, values.adcMaxVolts, values.lowerResistorKOhms)
    return {
      netlist: `ADC divider calculator equivalent · DC\nV1 IN 0 DC ${spiceNumber(values.inputMaxVolts)}\nR1 IN OUT ${spiceNumber(result.standardR1Ohms)}\nR2 OUT 0 ${spiceNumber(result.lowerResistorOhms)}\n.op\n.end`,
      assumption: `Nguồn Vin lý tưởng, không có tải ADC; R1 dùng E24 ${spiceNumber(result.standardR1Ohms)} Ω và R2 ${spiceNumber(result.lowerResistorOhms)} Ω. Chưa mô hình hóa trở kháng đầu vào, nhiễu, dung sai hoặc giới hạn tuyệt đối của MCU.`,
    }
  }

  if (calculator === 'i2c-pullup') {
    const values = input as CalculatorInputs['i2c-pullup']
    const result = calculateI2cPullup(values.supplyVolts, values.busCapacitancePf, values.speed)
    const resistance = result.recommendedOhms
    const capacitanceFarads = values.busCapacitancePf * 1e-12
    const timeConstant = resistance * capacitanceFarads
    const stepEdge = Math.max(timeConstant / 1000, 1e-12)
    const pulseStart = 2 * timeConstant
    return {
      netlist: `I2C pull-up release · RC rise approximation\nV1 DRIVE 0 PULSE(0 ${spiceNumber(values.supplyVolts)} ${spiceNumber(pulseStart)} ${spiceNumber(stepEdge)} ${spiceNumber(stepEdge)} ${spiceNumber(5 * timeConstant)} ${spiceNumber(12 * timeConstant)})\nR1 DRIVE SDA ${spiceNumber(resistance)}\nC1 SDA 0 ${spiceNumber(capacitanceFarads)}\n.tran ${spiceNumber(timeConstant / 100)} ${spiceNumber(7 * timeConstant)}\n.end`,
      assumption: `Mô hình tương đương chỉ quan sát sườn lên khi bus được nhả: VDD lý tưởng, Rpull-up ${spiceNumber(resistance)} Ω và Cbus ${spiceNumber(values.busCapacitancePf)} pF. Không mô phỏng transistor open-drain, sườn xuống, nhiều thiết bị, điện dung phân bố hay toàn bộ giao thức I²C.`,
    }
  }

  if (calculator === 'ldr-divider') {
    const values = input as CalculatorInputs['ldr-divider']
    if (!Number.isFinite(values.lightPercent) || values.lightPercent < 0 || values.lightPercent > 100) {
      throw new RangeError('Mức sáng LDR phải nằm trong khoảng 0 đến 100%.')
    }
    const result = calculateLdrDivider(values.lightPercent)
    return {
      netlist: `LDR divider educational equivalent · DC operating point\nV1 VCC 0 DC 3.3\nR1 VCC MID ${spiceNumber(result.ldrResistanceOhms)}\nR2 MID 0 1e+4\n.op\n.end`,
      assumption: `Mô hình giáo dục dùng VCC lý tưởng 3,3 V, LDR ${spiceNumber(result.ldrResistanceOhms)} Ω và điện trở cố định 10 kΩ; mức sáng ${spiceNumber(values.lightPercent)}% ánh xạ theo giả định 100 kΩ khi tối → 1 kΩ khi sáng. Không phải đặc tuyến datasheet, lux, số đếm ADC, mạch LED hoặc firmware của board thật.`,
    }
  }

  const values = input as CalculatorInputs['rc']
  const result = calculateRc(values.resistanceKOhms, values.capacitanceMicroFarads)
  const resistanceOhms = values.resistanceKOhms * 1000
  const capacitanceFarads = values.capacitanceMicroFarads * 1e-6
  const tauSeconds = result.timeConstantMs / 1000
  return {
    netlist: `RC calculator equivalent · ideal 5 V step\nV1 IN 0 PULSE(0 5 0 ${spiceNumber(tauSeconds / 1000)} ${spiceNumber(tauSeconds / 1000)} ${spiceNumber(10 * tauSeconds)} ${spiceNumber(20 * tauSeconds)})\nR1 IN OUT ${spiceNumber(resistanceOhms)}\nC1 OUT 0 ${spiceNumber(capacitanceFarads)}\n.tran ${spiceNumber(tauSeconds / 100)} ${spiceNumber(5 * tauSeconds)}\n.end`,
    assumption: `Nguồn bước lý tưởng 5 V; R=${spiceNumber(resistanceOhms)} Ω, C=${spiceNumber(capacitanceFarads)} F. Mạch không có tải và linh kiện lý tưởng; 5 V chỉ là kích thích mặc định để quan sát dạng nạp, không phải giá trị đầu vào của phép tính.`,
  }
}

/** Create an explicit, limited equivalent netlist from a valid calculator input. */
export function createCalculatorSpiceHandoff<T extends CalculatorSpiceId>(calculator: T, input: CalculatorInputs[T]): CalculatorSpiceHandoff {
  const generated = makeNetlist(calculator, input)
  const netlist = `${titles[calculator]}\n${generated.netlist.split('\n').slice(1).join('\n')}`
  const inspection = inspectSpiceNetlist(netlist)
  if (inspection.errors.length) throw new Error(`Netlist tương đương chưa hợp lệ: ${inspection.errors.join(' ')}`)
  return { schemaVersion: 1, calculator, title: titles[calculator], assumption: generated.assumption, netlist }
}

function isSafeLdrReturnTo(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('#')) return false
  try {
    const url = new URL(value, 'https://machmo.invalid')
    if (url.origin !== 'https://machmo.invalid' || !['/build', '/app/lab'].includes(url.pathname)) return false
    const params = url.searchParams
    if (params.getAll('lesson').length !== 1 || params.get('lesson') !== 'analog-ldr' ||
      params.getAll('guided').length !== 1 || params.get('guided') !== '1' || params.getAll('board').length > 1) return false
    if ([...params.keys()].some(key => !['lesson', 'guided', 'board'].includes(key))) return false
    const board = params.get('board')
    return board === null || /^[a-z0-9-]{1,80}$/i.test(board)
  } catch {
    return false
  }
}

/** Validate route state before a netlist from another screen reaches the solver. */
export function parseCalculatorSpiceHandoff(value: unknown): CalculatorSpiceHandoff | undefined {
  if (!value || typeof value !== 'object') return undefined
  const candidate = value as Partial<CalculatorSpiceHandoff>
  if (candidate.schemaVersion !== 1 || !['led', 'adc-divider', 'i2c-pullup', 'rc', 'ldr-divider'].includes(candidate.calculator ?? '')) return undefined
  if (typeof candidate.title !== 'string' || candidate.title.length > 120 || typeof candidate.assumption !== 'string' || candidate.assumption.length > 800) return undefined
  if (typeof candidate.netlist !== 'string' || candidate.netlist.length > 16_000) return undefined
  if (candidate.returnTo !== undefined && (typeof candidate.returnTo !== 'string' || candidate.returnTo.length > 256 || !isSafeLdrReturnTo(candidate.returnTo))) return undefined
  if (inspectSpiceNetlist(candidate.netlist).errors.length) return undefined
  return candidate as CalculatorSpiceHandoff
}

/** Serialize only a validated, size-bounded handoff so a generated draft survives refresh/share. */
export function serializeCalculatorSpiceHandoff(value: unknown): string | undefined {
  const handoff = parseCalculatorSpiceHandoff(value)
  return handoff ? JSON.stringify(handoff) : undefined
}

/** Read route state first, then the optional URL handoff used after a reload. */
export function readCalculatorSpiceHandoff(routeValue: unknown, search: string): CalculatorSpiceHandoff | undefined {
  const routeHandoff = parseCalculatorSpiceHandoff(routeValue)
  if (routeHandoff) return routeHandoff

  const encoded = new URLSearchParams(search).get('calculatorSpice')
  if (!encoded || encoded.length > 24_000) return undefined
  try {
    return parseCalculatorSpiceHandoff(JSON.parse(encoded))
  } catch {
    return undefined
  }
}
