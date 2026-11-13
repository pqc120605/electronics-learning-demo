import { calculateI2cPullup, type I2cSpeed } from './electronicsCalculators'

type FieldError = string | undefined

function positiveField(value: string, label: string): FieldError {
  const parsed = Number(value)
  return value.trim() === '' || !Number.isFinite(parsed) || parsed <= 0
    ? `${label} phải là số dương.`
    : undefined
}

export function getLedFieldErrors(values: { supply: string; vf: string; current: string }) {
  const errors: { supply?: string; vf?: string; current?: string } = {
    supply: positiveField(values.supply, 'V nguồn'),
    vf: positiveField(values.vf, 'Vf LED'),
    current: positiveField(values.current, 'Dòng LED'),
  }
  if (!errors.supply && !errors.vf && Number(values.supply) <= Number(values.vf)) {
    errors.vf = 'V nguồn phải lớn hơn Vf LED để có thể giới hạn dòng bằng điện trở.'
  }
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error)) as typeof errors
}

export function getAdcFieldErrors(values: { input: string; maximum: string; lower: string }) {
  const errors: { input?: string; maximum?: string; lower?: string } = {
    input: positiveField(values.input, 'Vin'),
    maximum: positiveField(values.maximum, 'V ADC'),
    lower: positiveField(values.lower, 'R2'),
  }
  if (!errors.input && !errors.maximum && Number(values.maximum) >= Number(values.input)) {
    errors.maximum = 'V ADC phải nhỏ hơn Vin để tính bộ chia áp hạ áp.'
  }
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error)) as typeof errors
}

export function getI2cFieldErrors(values: { supply: string; capacitance: string; speed: I2cSpeed }) {
  const errors: { supply?: string; capacitance?: string } = {
    supply: positiveField(values.supply, 'VDD'),
    capacitance: positiveField(values.capacitance, 'Điện dung bus'),
  }
  if (!errors.supply && !errors.capacitance) {
    try {
      calculateI2cPullup(Number(values.supply), Number(values.capacitance), values.speed)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('VOL phải nhỏ hơn VDD')) errors.supply = message
      else if (message.includes('Không có dải điện trở') || message.includes('Không có giá trị E24')) errors.capacitance = message
    }
  }
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error)) as typeof errors
}

export function getRcFieldErrors(values: { resistance: string; capacitance: string }) {
  const errors: { resistance?: string; capacitance?: string } = {
    resistance: positiveField(values.resistance, 'R'),
    capacitance: positiveField(values.capacitance, 'C'),
  }
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error)) as typeof errors
}
