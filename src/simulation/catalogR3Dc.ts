import type { R3Model } from '../data/catalogR3Parts'

const discrete = {
  '1n4007': ['D', 'a k', 'MM4007', 'D(IS=2e-9 N=1.7 RS=0.5 BV=1000 IBV=5u)'],
  '1n5819': ['D', 'a k', 'MM5819', 'D(IS=2e-7 N=1.08 RS=0.4 BV=40 IBV=1m)'],
  '1n4733a': ['D', 'a k', 'MM4733', 'D(IS=6e-10 N=1.6 RS=0.45 BV=5.1 IBV=49m)'],
  '2n3906': ['Q', 'c b e', 'MM3906', 'PNP(IS=2e-14 BF=150 BR=4 VAF=50 RB=7 RC=1 RE=0.4)'],
  irlz44n: ['M', 'd g s s', 'MMIRLZ44', 'NMOS(VTO=2 KP=12 IS=1e-10)'],
  '2n7000': ['M', 'd g s s', 'MM7000', 'NMOS(VTO=2 KP=0.08 IS=1e-13)'],
} as const

export const r3Converters = {
  lm2596: { vin: 12, out: 5, load: 20, inductance: 33e-6, cin: 470e-6, cout: 220e-6, topology: 'buck-diode',
    input: [7, 16], reference: 5, upper: 0, lower: 0 },
  lm2577: { vin: 5, out: 12, load: 120, inductance: 100e-6, cin: 100e-6, cout: 680e-6, topology: 'boost-diode',
    input: [4, 8], reference: 1.23, upper: 8760, lower: 1000 },
  tps61023: { vin: 3.3, out: 5, load: 50, inductance: 1e-6, cin: 22e-6, cout: 44e-6, topology: 'boost-sync',
    input: [1.8, 4.5], reference: 0.595, upper: 741000, lower: 100000 },
  tps5430: { vin: 12, out: 5, load: 20, inductance: 15e-6, cin: 10e-6, cout: 220e-6, topology: 'buck-diode',
    input: [7, 16], reference: 1.221, upper: 10000, lower: 3240 },
  tps62160: { vin: 5, out: 3.3, load: 16.5, inductance: 2.2e-6, cin: 10e-6, cout: 22e-6, topology: 'buck-sync',
    input: [3.1, 8], reference: 0.8, upper: 312000, lower: 100000 },
} as const

export type R3Converter = keyof typeof r3Converters
export function isR3Converter(model: R3Model): model is R3Converter { return Object.hasOwn(r3Converters, model) }

export type R3Branch = { id: string; type: 'resistor' | 'capacitor' | 'r3-inductor' | '1n5819-r3'; a: string; b: string; value: number }
type Context = {
  model: R3Model
  ordinal: number
  ground: string
  pin: (id: string) => string
  node: (key: string) => string
  wired: (key: string) => boolean
  voltage: (key: string) => number | undefined
  branches: readonly R3Branch[]
}

type Stamp = { ok: true; lines: string[]; models: string[]; absorbed: string[]; note: string } | { ok: false; issue: string }

export function stampR3(ctx: Context): Stamp {
  const { model, ordinal: n, ground, pin, node, wired, voltage, branches } = ctx
  const lines: string[] = [], models: string[] = [], absorbed: string[] = []
  const success = (note: string): Stamp => ({ ok: true, lines, models, absorbed, note })
  const fail = (issue: string): Stamp => ({ ok: false, issue })
  const connected = (...ids: string[]) => ids.every(id => wired(pin(id)))
  const find = (type: R3Branch['type'], a: string, b: string) => branches.find(item =>
    a !== b && item.type === type && (item.a === a && item.b === b || item.a === b && item.b === a))
  const other = (edge: R3Branch, key: string) => edge.a === key ? edge.b : edge.a
  const resistor = (a: string, b: string) => find('resistor', a, b)?.value
  const loadConductance = (out: string) => branches.filter(edge => edge.type === 'resistor' &&
    (edge.a === out && edge.b === ground || edge.b === out && edge.a === ground))
    .reduce((sum, edge) => sum + 1 / edge.value, 0)
  const divider = (out: string, feedback: string, lo = ground) => {
    const top = resistor(out, feedback), bottom = resistor(feedback, lo)
    const connections = branches.filter(edge => edge.type === 'resistor' && (edge.a === feedback || edge.b === feedback))
    return top && bottom && connections.length === 2 && voltage(feedback) === undefined ? [top, bottom] as const : undefined
  }
  const regulated = (out: string, target: number, on = true) => {
    const internal = 'mmo' + n
    lines.push('VMMR3S' + n + ' ' + internal + ' 0 DC ' + (on ? target : 0),
      'RMMR3O' + n + ' ' + internal + ' ' + node(out) + (on ? ' 0.02' : ' 100meg'))
  }
  const inputCurrent = (supply: string) => {
    lines.push('BMMR3I' + n + ' ' + node(supply) + ' 0 I=max(-I(VMMR3S' + n + '),0)')
  }
  const shunt = (out: string, control: string, target: number, limit: number) => {
    lines.push('BMMR3C' + n + ' ' + node(out) + ' 0 I=min(' + limit + ',max(0,100*(V(' + node(control) + ')-' + target + ')))')
  }

  if (Object.hasOwn(discrete, model)) {
    const [prefix, spec, name, card] = discrete[model as keyof typeof discrete]
    const pins = spec.split(' ')
    if (!connected(...pins)) return fail('Nối đủ các chân của model DC.')
    if (new Set(pins.map(pin)).size !== new Set(pins).size && prefix === 'D') return fail('Anode và cathode đang cùng một net.')
    lines.push(prefix + 'MMR3' + n + ' ' + pins.map(id => node(pin(id))).join(' ') + ' ' + name)
    models.push('.model ' + name + ' ' + card)
    return success('Bán dẫn DC, 25 °C.')
  }
  if (model === 'tip120') {
    if (!connected('b', 'c', 'e') || pin('b') === pin('c') || pin('c') === pin('e')) return fail('Nối B, C và E theo mạch Darlington.')
    const [b, c, e] = ['b','c','e'].map(id => node(pin(id)))
    const drive = 'mmd' + n
    lines.push('QMMR3A' + n + ' ' + c + ' ' + b + ' ' + drive + ' MMTIP',
      'QMMR3B' + n + ' ' + c + ' ' + drive + ' ' + e + ' MMTIP',
      'RMMR3A' + n + ' ' + b + ' ' + drive + ' 8k',
      'RMMR3B' + n + ' ' + drive + ' ' + e + ' 120')
    models.push('.model MMTIP NPN(IS=4e-14 BF=120 BR=3 VAF=50 RB=5 RC=1 RE=0.1)')
    return success('Hai transistor NPN mắc Darlington, 25 °C.')
  }
  if (model === 'tl431' || model === 'lm4040') {
    const k = pin('k')
    const ref = model === 'tl431' ? pin('ref') : k
    if (pin('a') !== ground || !wired(k) || k === ground || voltage(k) !== undefined) return fail('Nối A về GND và cấp dòng phân cực qua điện trở vào K.')
    if (model === 'lm4040' && wired(pin('nc3'))) return fail('Giữ chân 3 hở như cấu hình R3.')
    const ratio = ref === k ? 1 : (() => { const pair = divider(k, ref); return pair ? 1 + pair[0] / pair[1] : 0 })()
    if (!ratio) return fail('Nối REF với K hoặc dùng đúng hai điện trở chia áp K → REF → A.')
    const reference = model === 'tl431' ? 2.495 : 2.5
    const expected = reference * ratio
    const feed = branches.find(edge => edge.type === 'resistor' && (edge.a === k || edge.b === k) && (voltage(other(edge, k)) ?? 0) > expected)
    const feedCurrent = feed ? ((voltage(other(feed, k)) ?? 0) - expected) / feed.value : 0
    const limit = model === 'tl431' ? 0.1 : 0.015
    const bias = feedCurrent - (ref === k ? 0 : expected / ((resistor(k, ref) ?? 0) + (resistor(ref, ground) ?? 0)))
    if (bias < (model === 'tl431' ? 0.001 : 60e-6) || feedCurrent > limit) return fail('Dòng phân cực nằm ngoài vùng kiểm của tham chiếu shunt.')
    shunt(k, ref, reference, limit)
    return success('Tham chiếu shunt DC tại 25 °C.')
  }

  const vin = pin('vin')
  const supply = voltage(vin)
  const grounds = model === 'tps62160' ? ['agnd','pgnd','ep'] : model === 'bq24074' ? ['vss','ep'] : model === 'tps5430' ? ['gnd','ep'] : ['gnd']
  if (model !== 'lm317' && grounds.some(id => pin(id) !== ground)) return fail('Nối đúng các chân GND và pad EP nếu có.')
  if (supply === undefined || supply <= 0) return fail('Nối VIN vào nguồn DC riêng trong dải thử.')

  function outputUsable(out: string) { return out !== ground && voltage(out) === undefined && wired(out) }
  function logic(id: string, floating?: number) {
    const key = pin(id)
    return wired(key) ? voltage(key) : floating
  }
  function pullDown(id: string, active: boolean | { output: string; below: number }) {
    const key = pin(id)
    if (!wired(key)) return true
    const pullup = branches.some(edge => edge.type === 'resistor' && (edge.a === key || edge.b === key) &&
      (voltage(other(edge, key)) ?? 0) > 0 && edge.value >= 1000 && edge.value <= 100000)
    if (!pullup || voltage(key) !== undefined) return false
    if (typeof active === 'object') {
      const output = node(key)
      lines.push('BMMR3G' + n + ' ' + output + ' 0 I=V(' + output + ')*u(' + active.below + '-V(' + node(active.output) + '))/10')
    } else if (active) lines.push('RMMR3' + id + n + ' ' + node(key) + ' 0 10')
    return true
  }

  if (isR3Converter(model)) {
    const spec = r3Converters[model]
    if (supply < spec.input[0] || supply > spec.input[1]) return fail('VIN nằm ngoài dải thử của mô hình trung bình (' + spec.input.join('–') + ' V).')
    const switchNode = pin('sw')
    const boost = spec.topology.startsWith('boost')
    const coil = branches.find(edge => edge.type === 'r3-inductor' && edge.value > 0 && (edge.a === switchNode || edge.b === switchNode))
    if (!coil || switchNode === ground || voltage(switchNode) !== undefined || boost && other(coil, switchNode) !== vin) {
      return fail('Kiểm đường cuộn cảm nối với nút SW/PH theo sơ đồ mẫu.')
    }
    const boostDiode = branches.find(edge => edge.type === '1n5819-r3' && edge.a === switchNode)
    const out = model === 'tps61023' ? pin('vout') : boost ? boostDiode?.b : other(coil, switchNode)
    if (!out || !outputUsable(out)) return fail('Thiếu ngõ ra riêng hoặc diode boost mắc sai chiều.')
    const diode = boost ? boostDiode : branches.find(edge => edge.type === '1n5819-r3' && edge.a === ground && edge.b === switchNode)
    if (spec.topology.endsWith('diode') && !diode) return fail('Thiếu diode Schottky hoặc diode đang ngược chiều.')
    if (!find('capacitor', vin, ground) || !find('capacitor', out, ground)) return fail('Nối Cin và Cout về GND.')
    if (model === 'tps5430') {
      const boot = find('capacitor', pin('boot'), switchNode)
      if (!boot) return fail('Nối tụ bootstrap giữa BOOT và PH.')
      absorbed.push(boot.id)
    }
    if (model === 'tps62160' && pin('vos') !== out) return fail('Nối VOS về ngõ ra sau cuộn cảm.')
    if (model === 'lm2577') {
      const comp = branches.find(edge => edge.type === 'resistor' &&
        (edge.a === pin('comp') || edge.b === pin('comp')) && find('capacitor', other(edge, pin('comp')), ground))
      const compCap = comp && find('capacitor', other(comp, pin('comp')), ground)
      if (!comp || !compCap) return fail('Nối mạng RC nối tiếp COMP → GND.')
      absorbed.push(comp.id, compCap.id)
    }
    const feedback = pin('fb')
    const pair = spec.upper ? divider(out, feedback) : undefined
    if (spec.upper ? !pair : feedback !== out) return fail('Kiểm hồi tiếp FB từ ngõ ra. Dùng đúng cấu hình chia áp của mẫu.')
    const target = pair ? spec.reference * (1 + pair[0] / pair[1]) : spec.reference
    if (target < (boost ? supply + 0.15 : 1) || target > (boost ? 12.6 : model === 'tps62160' ? 5.5 : supply - 0.25) ||
      model === 'tps61023' && target > 5.5) return fail('Điện áp đặt nằm ngoài miền buck/boost đã kiểm.')
    const limit = 2 * spec.out / spec.load
    const load = loadConductance(out)
    if (!load || target * (load + (pair ? 1 / (pair[0] + pair[1]) : 0)) > limit) return fail('Nối tải điện trở về GND trong giới hạn ' + Math.round(limit * 1000) + ' mA của fixture.')
    const enable = model === 'lm2596' ? logic('onoff', 0) : model === 'lm2577' ? 5 : logic('en', model === 'tps5430' ? 5 : undefined)
    if (enable === undefined || enable > 0.5 && enable < 1.3) return fail('Dùng mức thấp hoặc cao xác định cho chân bật/tắt.')
    const on = model === 'lm2596' ? enable <= 0.5 : enable >= 1.3
    absorbed.push(coil.id)
    if (diode && spec.topology.endsWith('diode')) absorbed.push(diode.id)
    regulated(out, model === 'tps62160' ? Math.min(target, supply - 0.25) : target, on)
    lines.push('BMMR3P' + n + ' ' + node(vin) + ' 0 I=max(-I(VMMR3S' + n + '),0)*V(' + node(out) + ')/' + (supply * (boost ? 0.8 : 0.85)))
    if (model === 'tps62160' && !pullDown('pg', on && { output: out, below: 0.9 * target })) return fail('PG là open-drain. Dùng điện trở kéo lên để đọc mức.')
    return success('Mô hình trung bình DC ' + (boost ? 'boost · η 80%' : 'buck · η 85%') +
      '. L và diode chuyển mạch nằm trong mô hình tương đương. Dòng tải giới hạn ' + Math.round(limit * 1000) + ' mA.')
  }

  if (model === 'bq24074') {
    const out = pin('out10'), bat = pin('bat2'), cell = voltage(bat)
    const sysCurrent = 4.4 * loadConductance(out)
    const ce = logic('ce'), en1 = logic('en1'), en2 = logic('en2')
    const rIset = resistor(pin('iset'), ground), rTs = resistor(pin('ts'), ground), rIlim = resistor(pin('ilim'), ground)
    if (supply < 4.75 || supply > 5.25 || bat === vin || cell === undefined || cell < 3.6 || cell > 4.25 ||
      !outputUsable(out) || out !== pin('out11') || bat !== pin('bat3') || sysCurrent <= 0 || sysCurrent > 0.2 ||
      !rIset || rIset < 890 || rIset > 8900 || rTs !== 10000 || !rIlim || rIlim < 1100 || rIlim > 8000 ||
      en1 === undefined || en1 < 1.3 || en2 !== 0 || ce === undefined || ce > 0 && ce < 1.3 ||
      wired(pin('tmr')) || wired(pin('iterm')) ||
      ![vin, out, bat].every(net => find('capacitor', net, ground))) {
      return fail('Mô hình USB500 cần nguồn 5 V, pin ảo 3,6–4,25 V, hai pad BAT, hai pad OUT, tải, Cin/Cout/Cbat, TS/ISET/ILIM và TMR/ITERM để hở.')
    }
    const set = 890 / rIset
    const current = Math.min(set, 0.5 - sysCurrent, Math.max(0, (4.2 - cell) / 0.1))
    const charging = ce === 0 && current > set * 0.10
    regulated(out, 4.4)
    inputCurrent(vin)
    lines.push('IMMR3BAT' + n + ' ' + node(vin) + ' ' + node(bat) + ' DC ' + (charging ? current : 0))
    if (!pullDown('chg', charging) || !pullDown('pgood', true)) return fail('CHG và PGOOD cần điện trở kéo lên nếu nối để quan sát.')
    return success('USB500, nguồn 5 V và pin ảo DC. Giới hạn dòng chia giữa OUT và BAT. CHG và PGOOD là open-drain.')
  }

  const out = pin('vout')
  if (!outputUsable(out) || !['lm317','lm7805','lm1117','ref5025'].includes(model)) return fail('Nối OUT đến tải, giữ tách khỏi nguồn và GND.')
  if (model === 'lm317') {
    const pair = divider(out, pin('adj'))
    if (!pair) return fail('Nối cặp điện trở OUT → ADJ → GND.')
    const [top, bottom] = pair
    const target = Math.max(0, Math.min(1.25 * (1 + bottom / top) + 50e-6 * bottom, supply - 2.5))
    if (target * (loadConductance(out) + 1 / (top + bottom)) > 0.2) return fail('Tải vượt miền thử 200 mA.')
    regulated(out, target)
    lines.push('IMMR3ADJ' + n + ' ' + node(vin) + ' ' + node(pin('adj')) + ' DC 50u')
  } else {
    const [target, dropout] = model === 'lm7805' ? [5, 2] : model === 'lm1117' ? [3.3, 1.2] : [2.5, 0.2]
    if (model === 'ref5025') {
      if (supply < target + dropout) return fail('REF5025 cần VIN ≥ 2,7 V để dùng mô hình danh định.')
      if (['dnc1','dnc8','temp','trim'].some(id => wired(pin(id)))) return fail('Giữ DNC, TEMP và TRIM/NR hở trong bài thử.')
    }
    const voltage = Math.max(0, Math.min(target, supply - dropout))
    const limit = model === 'ref5025' ? 0.01 : 0.2
    if (voltage * loadConductance(out) > limit) return fail('Tải vượt miền thử ' + (limit * 1000) + ' mA.')
    regulated(out, voltage)
  }
  inputCurrent(vin)
  return success('Nguồn tuyến tính DC ở 25 °C, xấp xỉ dự trữ điện áp trong miền tải thử.')
}
