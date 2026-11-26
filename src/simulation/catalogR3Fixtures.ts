import type { CircuitDocV2, CircuitPartV2, CircuitEndpointV2 } from '../lib/circuitDocV2'
import { getR3PartByType, type R3Model } from '../data/catalogR3Parts'
import { r3Converters, type R3Converter } from './catalogR3Dc'

type Case = { doc: CircuitDocV2; probe: string; label: string; explanation: string; unit: 'V' | 'mA' }
function fixture(model: R3Model, label: string, explanation: string) {
  const doc: CircuitDocV2 = { schema: 2, lessonId: 'freestyle', parts: [], wires: [], breadboards: [],
    expect: { partCount: 0, wireCount: 0, netCount: 0 } }
  const nets = new Map<string, CircuitEndpointV2[]>()
  function add(id: string, type: string, pins: Record<string, string>, value?: CircuitPartV2['value']) {
    doc.parts.push({ id, type, ...(value ? { value } : {}), mount: { kind: 'bench', lane: 'right', order: doc.parts.length } })
    Object.entries(pins).forEach(([pinId, net]) => {
      const endpoint = { kind: 'pin', partId: id, pinId } as const
      const endpoints = nets.get(net) ?? []
      nets.set(net, [...endpoints, endpoint])
    })
    return id
  }
  const chip = (pins: Record<string, string>) => add('ic', model + '-r3', pins)
  const R = (a: string, b: string, ohm: number) => add('r' + doc.parts.length, 'resistor', { a, b }, { ohm })
  const C = (plus: string, minus: string, microfarad: number) =>
    add('c' + doc.parts.length, 'capacitor', { plus, minus }, { farad: microfarad * 1e-6, label: microfarad + ' µF' })
  const L = (a: string, b: string, henry: number) =>
    add('l' + doc.parts.length, 'r3-inductor', { a, b }, { henry, label: Number((henry * 1e6).toFixed(4)) + ' µH' })
  const V = (id: string, node: string, volts: number) =>
    add(id, 'battery', { positive: node, negative: 'gnd' }, { label: 'Nguồn ' + volts + ' V lý tưởng' })
  const I = (from: string, to: string, milliamps: number) =>
    add('i' + doc.parts.length, 'r3-current', { in: from, out: to }, { amp: milliamps * 1e-3, label: milliamps + ' mA' })
  const schottky = (anode: string, cathode: string) => add('catch', '1n5819-r3', { a: anode, k: cathode })
  function done(probe: string, unit: Case['unit'] = 'V'): Case {
    for (const endpoints of nets.values()) for (let i = 1; i < endpoints.length; i++) {
      doc.wires.push({ id: 'w' + (doc.wires.length + 1), from: endpoints[0], to: endpoints[i] })
    }
    doc.expect = { partCount: doc.parts.length, wireCount: doc.wires.length, netCount: nets.size }
    return { doc, probe, label, explanation, unit }
  }
  return { chip, R, C, L, V, I, schottky, done }
}

function linear(model: 'lm7805' | 'lm317' | 'lm1117' | 'ref5025', vin: number, label: string, explanation: string) {
  const f = fixture(model, label, explanation)
  f.V('supply', 'in', vin)
  f.chip({ vin: 'in', vout: 'out', ...(model === 'lm317' ? { adj: 'adj' } : { gnd: 'gnd' }) })
  if (model === 'lm317') {
    f.R('out','adj',240)
    f.R('adj','gnd',720)
  } else {
    f.C('in','gnd', model === 'lm7805' ? 0.33 : model === 'lm1117' ? 10 : 1)
    f.C('out','gnd', model === 'lm7805' ? 0.1 : model === 'lm1117' ? 10 : 1)
  }
  f.R('out','gnd', model === 'lm7805' ? 100 : model === 'lm317' ? 330 : model === 'lm1117' ? 33 : 1000)
  return f.done('ic:vout')
}

function reference(model: 'tl431' | 'lm4040', divided: boolean, biasResistance: number, label: string, explanation: string) {
  const f = fixture(model, label, explanation)
  f.V('supply','in',model === 'tl431' ? 9 : 5)
  f.R('in','k',biasResistance)
  f.chip({ k: 'k', a: 'gnd', ...(model === 'tl431' ? { ref: divided ? 'ref' : 'k' } : {}) })
  if (divided) {
    f.R('k','ref',10000)
    f.R('ref','gnd',10000)
  }
  return f.done('ic:k')
}

function converter(model: R3Converter, mode: 'normal' | 'disabled' | 'change-feedback' | 'pg' | 'pg-disabled' | 'pg-low'): Case {
  const spec = r3Converters[model]
  const shutdown = mode === 'disabled' || mode === 'pg-disabled'
  const status = mode === 'pg' || mode === 'pg-disabled' || mode === 'pg-low'
  const changing = mode === 'change-feedback'
  const f = fixture(model, status ? (shutdown ? 'PG khi EN thấp' : mode === 'pg-low' ? 'PG khi mất dự trữ · VIN 3,1 V' : 'PG khi ngõ ra ổn định') : shutdown ? 'Tắt chuyển đổi'
    : changing ? 'Tăng Rtop từ 8,76 kΩ lên 9,1 kΩ' : spec.vin + ' V → ' + spec.out + ' V',
    status ? (mode === 'pg-low' ? 'PG kéo xuống khi điện áp ở VOS dưới ngưỡng.' : 'PG open-drain nhả. Điện trở kéo lên được nối về VIN.') : shutdown ? 'Tải vẫn nối. Đọc điện áp DC sau khi ngắt.'
      : 'Đo sau cuộn cảm hoặc tại VOUT. Mô hình trung bình, không có dạng sóng nút chuyển mạch.')
  f.V('supply','in',mode === 'pg-low' ? 3.1 : spec.vin)
  f.C('in','gnd',spec.cin * 1e6)
  const outputCap = f.C('out','gnd',spec.cout * 1e6)
  f.R('out','gnd',spec.load)
  const boost = spec.topology.startsWith('boost')
  f.L('sw',boost ? 'in' : 'out',spec.inductance)
  if (spec.topology.endsWith('diode')) f.schottky(boost ? 'sw' : 'gnd',boost ? 'out' : 'sw')
  if (spec.upper) {
    f.R('out','fb',changing ? 9100 : spec.upper)
    f.R('fb','gnd',spec.lower)
  }
  const pins: Record<string,string> = { vin:'in', sw:'sw', fb:spec.upper ? 'fb' : 'out' }
  if (model === 'tps62160') Object.assign(pins, { vos:'out', agnd:'gnd',pgnd:'gnd',ep:'gnd',en:shutdown ? 'gnd' : 'in' })
  else pins.gnd = 'gnd'
  if (model === 'lm2596') {
    if (shutdown) f.V('control','control',5)
    pins.onoff = shutdown ? 'control' : 'gnd'
  }
  if (model === 'lm2577') {
    pins.comp = 'comp'
    f.R('comp','cz',2000)
    f.C('cz','gnd',0.1)
  }
  if (model === 'tps61023') Object.assign(pins,{ vout:'out',en:shutdown ? 'gnd' : 'in' })
  if (model === 'tps5430') {
    Object.assign(pins,{ ep:'gnd',boot:'boot', ...(shutdown ? {en:'gnd'} : {}) })
    f.C('boot','sw',0.01)
  }
  if (status) {
    pins.pg = 'pg'
    f.R('in','pg',10000)
  }
  f.chip(pins)
  return f.done(status ? 'ic:pg' : outputCap + ':plus')
}

function charger(test: 'cc' | 'cv' | 'done' | 'disabled' | 'system' | 'pgood' | 'chg' | 'chg-done') {
  const cell = test === 'cv' ? 4.19 : test === 'done' || test === 'chg-done' ? 4.199 : 3.6
  const f = fixture('bq24074', ({
    cc: 'CC · pin ảo 3,60 V', cv: 'CV · pin ảo 4,19 V', done: 'Kết thúc · pin ảo 4,199 V',
    disabled: '/CE cao · tắt sạc', system: 'Nguồn hệ thống · OUT', pgood: '/PGOOD · có nguồn',
    chg: '/CHG · đang sạc', 'chg-done': '/CHG · kết thúc',
  })[test], 'Pin ảo DC. EN1 mức cao, EN2 mức thấp. /CHG và /PGOOD là open-drain.')
  f.V('supply','in',5)
  f.V('cell','bat',cell)
  f.R('sys','gnd',44)
  f.R('ts','gnd',10000)
  f.R('il','gnd',1500)
  f.R('is','gnd',1780)
  f.C('in','gnd',1)
  f.C('sys','gnd',4.7)
  f.C('bat','gnd',4.7)
  f.R('in','pgood',10000)
  f.R('in','chg',10000)
  f.chip({ vin:'in', vss:'gnd', ep:'gnd', bat2:'bat', bat3:'bat', out10:'sys', out11:'sys',
    ce:test === 'disabled' ? 'in':'gnd', en1:'in', en2:'gnd', ts:'ts', ilim:'il', iset:'is', pgood:'pgood', chg:'chg' })
  if (test === 'pgood') return f.done('ic:pgood')
  if (test === 'chg' || test === 'chg-done') return f.done('ic:chg')
  return test === 'system' ? f.done('ic:out10') : f.done('cell','mA')
}

function diode(model: '1n4007' | '1n5819' | '1n4733a', mode: 'forward' | 'lo' | 'reverse' | 'breakdown') {
  const reverse = mode === 'reverse' || mode === 'breakdown'
  const volts = model === '1n5819' ? 5 : 12
  const current = mode === 'lo' ? 1 : mode === 'breakdown' ? 49 : 10
  const f = fixture(model, mode === 'reverse' ? 'Ngược · ' + volts + ' V' : reverse ? 'Zener · 49 mA' : 'Thuận · ' + current + ' mA',
    mode === 'reverse' ? 'Đọc độ lớn dòng rò. Dấu âm biểu thị dòng lấy từ nguồn thử.'
      : reverse ? 'Đọc điện áp K so với A ở dòng thử.' : 'Đọc sụt áp từ A sang K.')
  f.V('supply','in',volts)
  if (mode !== 'reverse') f.I('in','test',current)
  const active = mode === 'reverse' ? 'in' : 'test'
  f.chip(reverse ? { k:active, a:'gnd' } : { a:active, k:'gnd' })
  return mode === 'reverse' ? f.done('supply','mA') : f.done(reverse ? 'ic:k' : 'ic:a')
}

function transistor(model: '2n3906' | 'tip120' | 'irlz44n' | '2n7000', mode: 'on' | 'off' | 'body') {
  const f = fixture(model, mode === 'body' ? 'Diode thân · 10 mA' : mode === 'off' ? 'Ngắt · tải vẫn nối' : 'Dẫn · có tải',
    mode === 'body' ? 'Dòng đi từ source sang drain. VGS = 0.'
      : model === '2n3906' ? 'Đọc dòng qua nguồn emitter và điện áp collector.'
        : 'Đọc điện áp trên collector hoặc drain để so sánh hai trạng thái.')
  f.V('supply','in',5)
  if (model === '2n3906') {
    f.R('c','gnd',470)
    if (mode === 'on') f.I('base','gnd',1)
    f.chip({ e:'in', b: mode === 'on' ? 'base' : 'in', c:'c' })
    return f.done('ic:c')
  }
  if (model === 'tip120') {
    f.R('in','c',47)
    f.R(mode === 'on' ? 'in' : 'gnd','base',2200)
    f.chip({ b:'base', c:'c', e:'gnd' })
    return f.done('ic:c')
  }
  if (mode === 'body') {
    f.I('in','source',10)
    f.chip({ g:'source', s:'source', d:'gnd' })
    return f.done('ic:s')
  }
  f.R('in','d',model === 'irlz44n' ? 50 : 250)
  f.chip({ g:mode === 'on' ? 'in' : 'gnd', s:'gnd', d:'d' })
  return f.done('ic:d')
}

export const r3FixtureCases: Record<R3Model, () => [Case, Case, ...Case[]]> = {
  lm7805: () => [linear('lm7805',9,'VIN 9 V','Kiểm đầu ra quanh 5 V ở tải 100 Ω.'),linear('lm7805',6,'VIN 6 V','Thiếu dự trữ. Đầu ra thấp hơn 4,75 V.')],
  lm317: () => [linear('lm317',9,'VIN 9 V','Bộ chia 240 Ω và 720 Ω đặt đầu ra khoảng 5,04 V.'),linear('lm317',6,'VIN 6 V','Thiếu dự trữ 2,5 V.')],
  tl431: () => [reference('tl431',true,1000,'Chia áp 10 kΩ / 10 kΩ','Cathode ở xấp xỉ 4,99 V.'),
    reference('tl431',false,1000,'REF nối thẳng K','Cathode ở xấp xỉ 2,5 V.')],
  lm2596: () => [converter('lm2596','normal'),converter('lm2596','disabled')],
  lm2577: () => [converter('lm2577','normal'),converter('lm2577','change-feedback')],
  tps61023: () => [converter('tps61023','normal'),converter('tps61023','disabled')],
  lm1117: () => [linear('lm1117',5,'VIN 5 V','Đo quanh 3,3 V ở 100 mA.'),linear('lm1117',4,'VIN 4 V','Thiếu dự trữ 1,2 V.')],
  tps5430: () => [converter('tps5430','normal'),converter('tps5430','disabled')],
  tps62160: () => [converter('tps62160','normal'),converter('tps62160','disabled'),converter('tps62160','pg'),converter('tps62160','pg-disabled'),converter('tps62160','pg-low')],
  bq24074: () => [charger('cc'),charger('cv'),charger('done'),charger('disabled'),charger('system'),charger('pgood'),charger('chg'),charger('chg-done')],
  ref5025: () => [linear('ref5025',5,'VIN 5 V','Tham chiếu 2,5 V ở tải 1 kΩ.'),linear('ref5025',3.3,'VIN 3,3 V','Đầu ra vẫn ở vùng tham chiếu.')],
  lm4040: () => [reference('lm4040',false,2490,'Dòng phân cực khoảng 1 mA','Đọc điện áp shunt khoảng 2,5 V.'),
    reference('lm4040',false,10000,'Dòng phân cực khoảng 0,25 mA','Đầu ra vẫn giữ tham chiếu.')],
  '1n4007': () => [diode('1n4007','forward'),diode('1n4007','lo'),diode('1n4007','reverse')],
  '1n5819': () => [diode('1n5819','forward'),diode('1n5819','reverse')],
  '1n4733a': () => [diode('1n4733a','breakdown'),diode('1n4733a','forward')],
  '2n3906': () => [transistor('2n3906','on'),transistor('2n3906','off')],
  tip120: () => [transistor('tip120','on'),transistor('tip120','off')],
  irlz44n: () => [transistor('irlz44n','on'),transistor('irlz44n','off'),transistor('irlz44n','body')],
  '2n7000': () => [transistor('2n7000','on'),transistor('2n7000','off'),transistor('2n7000','body')],
}

export function getR3CircuitFixture(type: string, variant = 0) {
  const part = getR3PartByType(type)
  return part && r3FixtureCases[part.catalogId]()[variant]
}
