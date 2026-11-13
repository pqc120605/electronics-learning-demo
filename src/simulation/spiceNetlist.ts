const MAX_NETLIST_CHARACTERS = 16_000
const MAX_NETLIST_LINES = 160
const MAX_LINE_CHARACTERS = 400
const MAX_ANALYSIS_POINTS = 20_000
export const MAX_SPICE_RESULT_POINTS = MAX_ANALYSIS_POINTS
const NUMBER = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?(?:meg|[tgkmunpf])?[a-z]*'
const SPICE_NUMBER = new RegExp(`^${NUMBER}$`, 'i')
const MODEL_PARAMETERS: Readonly<Record<string, ReadonlySet<string>>> = {
  D: new Set(['IS', 'N', 'RS', 'TT', 'CJO', 'VJ', 'M', 'EG', 'BV', 'IBV']),
  NPN: new Set(['IS', 'BF', 'NF', 'ISE', 'NE', 'BR', 'NR', 'ISC', 'NC', 'VAF', 'VAR', 'IKF', 'IKR', 'RC', 'RB', 'RE', 'CJE', 'VJE', 'MJE', 'TF', 'TR', 'CJC', 'VJC', 'MJC', 'XTB', 'EG']),
  PNP: new Set(['IS', 'BF', 'NF', 'ISE', 'NE', 'BR', 'NR', 'ISC', 'NC', 'VAF', 'VAR', 'IKF', 'IKR', 'RC', 'RB', 'RE', 'CJE', 'VJE', 'MJE', 'TF', 'TR', 'CJC', 'VJC', 'MJC', 'XTB', 'EG']),
  NMOS: new Set(['VTO', 'KP', 'LAMBDA', 'PHI', 'GAMMA', 'IS', 'JS', 'PB', 'CJ', 'CJSW', 'MJ', 'MJSW', 'TOX', 'NSUB', 'UO', 'THETA', 'ETA', 'KAPPA']),
  PMOS: new Set(['VTO', 'KP', 'LAMBDA', 'PHI', 'GAMMA', 'IS', 'JS', 'PB', 'CJ', 'CJSW', 'MJ', 'MJSW', 'TOX', 'NSUB', 'UO', 'THETA', 'ETA', 'KAPPA']),
}

function validSource(source: string): boolean {
  const value = `(${NUMBER})`
  if (new RegExp(`^DC\\s+${NUMBER}$`, 'i').test(source)) return true
  if (new RegExp(`^AC\\s+${NUMBER}(?:\\s+${NUMBER})?$`, 'i').test(source)) return true
  const args = `${NUMBER}(?:\\s+${NUMBER})*`
  const pulse = new RegExp(`^PULSE\\s*\\(\\s*${args}\\s*\\)$`, 'i').exec(source)
  if (pulse) {
    const count = pulse[0].match(new RegExp(NUMBER, 'gi'))?.length ?? 0
    if (count >= 7 && count <= 8) return true
  }
  const sine = new RegExp(`^SIN\\s*\\(\\s*${args}\\s*\\)$`, 'i').exec(source)
  if (sine) {
    const count = sine[0].match(new RegExp(NUMBER, 'gi'))?.length ?? 0
    if (count >= 3 && count <= 6) return true
  }
  return new RegExp(`^EXP\\s*\\(\\s*${value}\\s+${value}\\s+${value}\\s+${value}\\s+${value}\\s+${value}\\s*\\)$`, 'i').test(source)
}

function validModel(line: string): boolean {
  const match = /^\.model\s+[A-Za-z][\w$.-]*\s+(D|NPN|PNP|NMOS|PMOS)\s*\(([^()]*)\)$/i.exec(line)
  const allowed = match && MODEL_PARAMETERS[match[1].toUpperCase()]
  if (!match || !allowed) return false
  const parameters = match[2].trim().split(/\s+/).filter(Boolean)
  return parameters.length > 0 && parameters.every((parameter) => {
    const pair = /^([A-Za-z][A-Za-z0-9]*)=([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:meg|[tgkmunpf])?[a-z]*)$/i.exec(parameter)
    return !!pair && allowed.has(pair[1].toUpperCase()) && SPICE_NUMBER.test(pair[2])
  })
}

function intervalCount(distance: number, step: number): number {
  const ratio = Math.abs(distance) / Math.abs(step)
  const nearest = Math.round(ratio)
  const isNearInteger = Math.abs(ratio - nearest) <= Math.max(1, ratio) * Number.EPSILON * 16
  return isNearInteger ? nearest : Math.ceil(ratio)
}

const suffixScale: Readonly<Record<string, number>> = {
  t: 1e12,
  g: 1e9,
  meg: 1e6,
  k: 1e3,
  m: 1e-3,
  u: 1e-6,
  n: 1e-9,
  p: 1e-12,
  f: 1e-15,
}

/** Convert a common SPICE engineering value to SI; trailing unit letters are ignored. */
export function spiceNumberValue(source: string): number | undefined {
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(meg|[tgkmunpf])?[a-z]*$/i.exec(source.trim())
  if (!match) return undefined
  const value = Number(match[1])
  const scale = match[2] ? suffixScale[match[2].toLowerCase()] : 1
  const scaled = value * scale
  return Number.isFinite(scaled) ? scaled : undefined
}

export type SpiceNetlistInspection = {
  errors: string[]
  maxAnalysisPoints: number
  analysis: 'op' | 'tran' | 'ac' | 'dc' | undefined
  elementCount: number
}

/** ngspice may add adaptive transient points beyond the input estimate; guard the returned dataset too. */
export function assertSpiceResultPointBudget(numPoints: number): void {
  if (!Number.isInteger(numPoints) || numPoints < 1) {
    throw new Error('Ngspice không trả về số điểm kết quả hợp lệ.')
  }
  if (numPoints > MAX_SPICE_RESULT_POINTS) {
    throw new Error(`Ngspice tạo ${numPoints.toLocaleString('vi-VN')} điểm, vượt giới hạn ${MAX_SPICE_RESULT_POINTS.toLocaleString('vi-VN')}. Hãy giảm thời gian hoặc tăng bước phân tích.`)
  }
}

/** Keep the learner's Unicode title in the editor but send a safe ASCII title to ngspice. */
export function normalizeSpiceNetlistForEngine(source: string): string {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const title = (lines[0] ?? '')
    .replace(/[ΩΩ]/g, ' ohm ')
    .replace(/[µμ]/g, 'u')
    .replace(/[·•]/g, ' ')
    .replace(/[–—−]/g, '-')
    .replace(/°/g, ' deg ')
    .replace(/×/g, 'x')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  lines[0] = title || 'MACH MO SPICE'
  return lines.join('\n')
}

/** Conservative netlist gate for a local learning tool: no shell, file, include, or control directives. */
export function inspectSpiceNetlist(source: string): SpiceNetlistInspection {
  const errors: string[] = []
  if (source.length > MAX_NETLIST_CHARACTERS) errors.push(`Netlist tối đa ${MAX_NETLIST_CHARACTERS.toLocaleString('en-US')} ký tự.`)
  if (source.includes('\0')) errors.push('Netlist chứa ký tự không hợp lệ.')

  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  if (lines.length > MAX_NETLIST_LINES) errors.push(`Netlist tối đa ${MAX_NETLIST_LINES} dòng.`)

  const meaningful = lines.map((line) => line.trim()).filter((line) => line && !line.startsWith('*'))
  if (meaningful.length < 2) errors.push('Thêm tiêu đề, linh kiện, một phép phân tích và dòng .end.')

  const body = meaningful.slice(1)
  const analyses: Array<{ kind: 'op' | 'tran' | 'ac' | 'dc'; maxPoints: number }> = []
  let elementCount = 0
  let endCount = 0

  for (const [index, line] of body.entries()) {
    if (line.length > MAX_LINE_CHARACTERS) {
      errors.push(`Dòng ${index + 2} vượt quá ${MAX_LINE_CHARACTERS} ký tự.`)
      continue
    }
    if (!/^[\w.$+\-*/(),= \t]+$/.test(line)) {
      errors.push(`Dòng ${index + 2} có ký tự ngoài phạm vi netlist hỗ trợ.`)
      continue
    }

    const tokens = line.split(/\s+/)
    if (line.startsWith('.')) {
      const directive = tokens[0].slice(1).toLowerCase()
      if (directive === 'end') {
        endCount += 1
        if (tokens.length !== 1) errors.push('Dòng .end không nhận tham số.')
      } else if (directive === 'op') {
        analyses.push({ kind: 'op', maxPoints: 1 })
        if (tokens.length !== 1) errors.push('.op không nhận tham số.')
      } else if (directive === 'tran') {
        const step = spiceNumberValue(tokens[1] ?? '')
        const stop = spiceNumberValue(tokens[2] ?? '')
        const start = tokens[3] === undefined ? 0 : spiceNumberValue(tokens[3])
        const maximumStep = tokens[4] === undefined ? undefined : spiceNumberValue(tokens[4])
        if (!step || step < 0 || !stop || stop < 0 || start === undefined || start < 0 || stop <= start || (tokens[4] !== undefined && (!maximumStep || maximumStep < 0)) || tokens.length < 3 || tokens.length > 5) errors.push('.tran cần bước thời gian và thời điểm dừng hợp lệ.')
        else {
          const points = intervalCount(stop - start, step) + 1
          analyses.push({ kind: 'tran', maxPoints: points })
          if (points > MAX_ANALYSIS_POINTS) errors.push(`Phân tích quá lớn: tối đa ${MAX_ANALYSIS_POINTS.toLocaleString('en-US')} điểm thời gian.`)
        }
      } else if (directive === 'dc') {
        const start = spiceNumberValue(tokens[2] ?? '')
        const stop = spiceNumberValue(tokens[3] ?? '')
        const step = spiceNumberValue(tokens[4] ?? '')
        if (tokens.length !== 5 || start === undefined || stop === undefined || !step || !Number.isFinite(step) || intervalCount(stop - start, step) + 1 > MAX_ANALYSIS_POINTS) errors.push(`.dc cần nguồn, dải hợp lệ và tối đa ${MAX_ANALYSIS_POINTS.toLocaleString('en-US')} điểm.`)
        else analyses.push({ kind: 'dc', maxPoints: intervalCount(stop - start, step) + 1 })
      } else if (directive === 'ac') {
        const mode = (tokens[1] ?? '').toLowerCase()
        const pointsPer = Number(tokens[2])
        const start = spiceNumberValue(tokens[3] ?? '')
        const stop = spiceNumberValue(tokens[4] ?? '')
        const points = mode === 'lin' ? pointsPer : mode === 'oct' ? pointsPer * Math.log2((stop ?? 0) / (start ?? 1)) : pointsPer * Math.log10((stop ?? 0) / (start ?? 1))
        if (!['lin', 'oct', 'dec'].includes(mode) || !Number.isInteger(pointsPer) || pointsPer < 1 || !start || !stop || stop <= start || !Number.isFinite(points) || points > MAX_ANALYSIS_POINTS || tokens.length !== 5) errors.push(`.ac cần dải tần hợp lệ và tối đa ${MAX_ANALYSIS_POINTS.toLocaleString('en-US')} điểm.`)
        else analyses.push({ kind: 'ac', maxPoints: Math.ceil(points) })
      } else if (directive === 'model') {
        if (!validModel(line)) errors.push('Model chỉ nhận các tham số số đã hỗ trợ cho diode, BJT hoặc MOSFET.')
      } else {
        errors.push(`Chưa hỗ trợ lệnh .${directive}. Lệnh đọc/ghi file và .control bị chặn.`)
      }
      continue
    }

    const name = tokens[0]
    const prefix = name[0]?.toUpperCase()
    const terminalCount = prefix === 'R' || prefix === 'C' || prefix === 'L' || prefix === 'D' ? 4
      : prefix === 'V' || prefix === 'I' ? 4
        : prefix === 'Q' ? 5
          : prefix === 'M' ? 6
            : 0
    if (!terminalCount || !/^[A-Za-z][\w$.-]*$/.test(name) || tokens.length < terminalCount) {
      errors.push(`Chưa hỗ trợ linh kiện ở dòng ${index + 2}; dùng R, C, L, V, I, D, Q hoặc M.`)
      continue
    }

    if (['R', 'C', 'L'].includes(prefix!)) {
      const value = spiceNumberValue(tokens[3])
      if (tokens.length !== 4 || !value || value < 0) errors.push(`${name}: trị số cần là số SPICE dương hữu hạn.`)
    } else if (prefix === 'V' || prefix === 'I') {
      if (!validSource(tokens.slice(3).join(' '))) errors.push(`${name}: chỉ hỗ trợ nguồn DC, AC, PULSE, SIN hoặc EXP với trị số số học.`)
    } else if (prefix === 'D') {
      if (tokens.length !== 4 || !/^[A-Za-z][\w$.-]*$/.test(tokens[3])) errors.push(`${name}: diode cần đúng hai nút và tên model.`)
    } else if (prefix === 'Q') {
      if (tokens.length !== 5 || !/^[A-Za-z][\w$.-]*$/.test(tokens[4])) errors.push(`${name}: BJT cần collector, base, emitter và tên model.`)
    } else if (prefix === 'M') {
      if (tokens.length !== 6 || !/^[A-Za-z][\w$.-]*$/.test(tokens[5])) errors.push(`${name}: MOSFET cần drain, gate, source, bulk và tên model.`)
    }
    elementCount += 1
  }

  if (endCount !== 1 || body.at(-1)?.toLowerCase() !== '.end') errors.push('Netlist cần đúng một dòng .end ở cuối.')
  if (analyses.length !== 1) errors.push('Chọn đúng một phép phân tích: .op, .tran, .ac hoặc .dc.')
  if (!elementCount) errors.push('Netlist cần ít nhất một linh kiện được hỗ trợ.')

  return {
    errors: [...new Set(errors)],
    maxAnalysisPoints: analyses.reduce((maximum, item) => Math.max(maximum, item.maxPoints), 0),
    analysis: analyses.length === 1 ? analyses[0].kind : undefined,
    elementCount,
  }
}
