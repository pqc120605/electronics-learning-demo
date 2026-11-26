import type { CircuitDocV2 } from '../circuitDocV2'
import { createNetIndexV2 } from '../circuitNetsV2'
import { getComponentDefinition } from '../../data/componentRegistry'
import { diodeModel, bjtModel } from '../../simulation/catalogR1Spice'
import { r2bDcElement } from '../../simulation/catalogR2bSpice'
import { isR3Converter, stampR3, type R3Branch } from '../../simulation/catalogR3Dc'
import { getR3PartByType } from '../../data/catalogR3Parts'
import { inspectSpiceNetlist } from '../../simulation/spiceNetlist'
import type { WorkspaceSpiceResult } from '../workspaceSpice'
import { SIGNAL_PINS } from './freestyleBoards'

const analogParts: Readonly<Record<string, readonly string[]>> = {
  resistor: ['a', 'b'], '1n4148-r1': ['a', 'k'], '2n3904-r1': ['c', 'b', 'e'], 'tmp36-r1': ['vs', 'vout', 'gnd'],
}

type AnalogResult = WorkspaceSpiceResult & { pinSignals?: Record<string, string>; sourceSignals?: Record<string, string> }

export function compileFreestyleAnalog(doc: CircuitDocV2, logicLevel: string, temperature: number): AnalogResult {
  if (doc.parts.length > 40 || doc.wires.length > 120) return { ok: false, issues: ['Giới hạn SPICE của bàn tự do là 40 linh kiện và 120 dây.'] }
  const index = createNetIndexV2(doc)
  const net = (part: string, pin: string) => index.netOf(part + ':' + pin)?.key ?? part + ':' + pin
  const wired = (key: string) => {
    const item = index.netOf(key)
    return Boolean(item && (item.wireIds.size > 0 || item.endpoints.size > 1))
  }
  const board = doc.parts.find(part => part.type === 'board')
  const batteries = doc.parts.filter(part => part.type === 'battery' && ['negative', 'positive'].some(pin => wired(net(part.id, pin))))
  const ground = board && wired(net(board.id, 'gnd')) ? net(board.id, 'gnd') : batteries[0] && net(batteries[0].id, 'negative')
  if (!ground) return { ok: false, issues: ['Nối GND board hoặc cực âm nguồn DC để chọn nút tham chiếu.'] }
  const issues: string[] = []
  const rails = new Map<string, number>()
  function supply(positive: string, negative: string, volts: number, title: string) {
    if (positive === negative || negative !== ground) { issues.push(title + ': cần nguồn riêng với cực âm về GND chung.'); return }
    const previous = rails.get(positive)
    if (previous !== undefined && previous !== volts) issues.push(title + ': các nguồn khác điện áp dùng chung một net.')
    else rails.set(positive, volts)
  }
  if (board) {
    if (SIGNAL_PINS.some(pin => wired(net(board.id, pin)))) issues.push('Chân GPIO đang nối dây. Tách tín hiệu MCU khi chuyển mạch analog DC sang ngspice.')
    const boardVolt = logicLevel === '5 V' ? 5 : logicLevel === '3,3 V' ? 3.3 : undefined
    const vcc = net(board.id, 'vcc')
    if (wired(vcc)) {
      if (boardVolt === undefined) issues.push('Chưa xác định được điện áp nguồn của board này.')
      else supply(vcc, net(board.id, 'gnd'), boardVolt, 'VCC board')
    }
    const v5 = net(board.id, 'v5')
    if (wired(v5)) supply(v5, net(board.id, 'gnd'), 5, 'Nguồn lý tưởng 5 V')
  }
  const r3 = doc.parts.some(part => getR3PartByType(part.type))
  const voltageLimit = r3 ? 16 : 5
  for (const item of batteries) {
    const raw = item.value?.label?.trim().match(/^(?:Nguồn )?(\d+(?:[.,]\d+)?)\s*V(?: lý tưởng)?$/i)
    const volts = raw ? Number(raw[1].replace(',', '.')) : item.value?.label ? NaN : 5
    if (!Number.isFinite(volts) || volts <= 0 || volts > voltageLimit) {
      issues.push(item.id + ': nguồn thử analog hỗ trợ từ trên 0 đến ' + voltageLimit + ' V.')
    } else if (!wired(net(item.id,'positive')) || !wired(net(item.id,'negative'))) {
      issues.push(item.id + ': nối cả cực dương và cực âm.')
    } else supply(net(item.id,'positive'), net(item.id,'negative'), volts, item.id)
  }
  if (!rails.size) issues.push('Cần ít nhất một nguồn DC trong mạch.')

  const nodes = new Map<string, string>([[ground, '0']])
  function node(net: string) {
    if (!nodes.has(net)) nodes.set(net, 'n' + nodes.size)
    return nodes.get(net)!
  }
  const sourceLines = [...rails].map(([key, volts], index) => 'VCC' + (index + 1) + ' ' + node(key) + ' 0 DC ' + volts)
  const devices: string[] = []
  const models = new Set<string>()
  const ignored: string[] = []
  const assumptions = ['Netlist DC ở 25 °C. Kết nối lấy từ dây và nhóm lỗ breadboard trong CircuitDoc.',
    'Nguồn và rail MCU là nguồn áp lý tưởng. Diode và BJT dùng model DC R1 trong miền đã thử.']
  const absorbed = new Set<string>()
  if (r3) {
    const branches: R3Branch[] = []
    for (const { id, type, value } of doc.parts) {
      const entry = type === 'resistor' ? ['a', 'b', value?.ohm ?? 220] as const
        : type === 'capacitor' ? ['plus', 'minus', value?.farad ?? 100e-6] as const
          : type === 'r3-inductor' ? ['a', 'b', value?.henry ?? 33e-6] as const
            : type === '1n5819-r3' ? ['a', 'k', 1] as const : undefined
      if (!entry) continue
      const [a, b, amount] = entry
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9) {
        issues.push(id + ': trị số linh kiện không hợp lệ.')
        continue
      }
      branches.push({ id, type: type as R3Branch['type'], a: net(id,a), b: net(id,b), value: amount })
    }
    const ranked = doc.parts.map((part, index) => ({ part, index, model: getR3PartByType(part.type) }))
      .sort((a, b) => Number(Boolean(b.model && isR3Converter(b.model.catalogId))) - Number(Boolean(a.model && isR3Converter(a.model.catalogId))))
    for (const { part, index, model } of ranked) {
      if (!model || absorbed.has(part.id)) continue
      if (model.pins.every(pin => !wired(net(part.id, pin.id)))) { ignored.push(part.id); continue }
      if (temperature !== 25) { issues.push(part.id + ': mô hình R3 được kiểm ở 25 °C.'); continue }
      const emitted = stampR3({
        model: model.catalogId, ordinal: index + 1, ground,
        pin: id => net(part.id, id), node, wired, voltage: key => key === ground ? 0 : rails.get(key), branches,
      })
      if (!emitted.ok) { issues.push(part.id + ' · ' + model.mpn + '. ' + emitted.issue); continue }
      emitted.lines.forEach(line => devices.push(line))
      emitted.models.forEach(modelLine => models.add(modelLine))
      if (emitted.absorbed.some(id => absorbed.has(id))) issues.push(part.id + ': mỗi đường công suất chỉ thuộc một bộ chuyển đổi.')
      emitted.absorbed.forEach(id => absorbed.add(id))
      assumptions.push(part.id + ' · ' + model.mpn + '. ' + emitted.note)
    }
  }
  for (const part of doc.parts) {
    const { id, type } = part
    if (type === 'board' || type === 'battery' || type === 'breadboard' || getR3PartByType(type) || absorbed.has(id)) continue
    if (r3 && ['capacitor','r3-current','r3-inductor'].includes(type)) {
      const [a, b, prefix, amount] = type === 'capacitor' ? ['plus','minus','C',part.value?.farad ?? 100e-6] as const
        : type === 'r3-current' ? ['in','out','I',part.value?.amp ?? 0.01] as const
          : ['a','b','L',part.value?.henry ?? 33e-6] as const
      const [na, nb] = [net(id,a), net(id,b)]
      if (!wired(na) && !wired(nb)) { ignored.push(id); continue }
      if (!wired(na) || !wired(nb) || na === nb || typeof amount === 'number' && (!Number.isFinite(amount) || amount <= 0 ||
        (type === 'r3-current' && amount > 0.05))) { issues.push(id + ': kiểm chân và trị số của phần tử DC.'); continue }
      const suffix = devices.length + 1
      devices.push(prefix + 'MMR3AUX' + suffix + ' ' + node(na) + ' ' + node(nb) + (prefix === 'I' ? ' DC ' : ' ') + amount)
      continue
    }
    const registered = getComponentDefinition(type)
    if (type === 'lm358-r2b' || type === 'lm393-r2b') {
      const model = type === 'lm358-r2b' ? 'lm358' : 'lm393'
      const vcc = net(id,'vcc')
      const gnd = net(id,'gnd')
      const channels = [1,2].map(i => [net(id,'out'+i),net(id,'in'+i+'p'),net(id,'in'+i+'n')] as const)
      if (channels.every(pins => pins.every(key => !wired(key)))) { ignored.push(id); continue }
      if (rails.get(vcc) !== 5 || gnd !== ground || temperature !== 25) {
        issues.push(id + ': model DC cần nguồn 5 V, GND chung và 25 °C.')
        continue
      }
      for (const [channel, terminals] of channels.entries()) {
        const [out,plus,minus] = terminals
        if (terminals.every(pin => !wired(pin))) continue
        if (!terminals.every(wired) || out === gnd || rails.has(out)) {
          issues.push(id + ': nối đủ OUT, IN+ và IN−. OUT cần nút riêng.')
          continue
        }
        if ([plus,minus].some(pin => (rails.get(pin) ?? 0) > 3)) {
          issues.push(id + ': ngõ vào ngoài miền thử 0–3 V (X).')
          continue
        }
        if (model === 'lm393') {
          const positive = plus === ground ? 0 : rails.get(plus)
          const negative = minus === ground ? 0 : rails.get(minus)
          if (plus === minus || (positive !== undefined && positive === negative)) {
            issues.push(id + ': hai ngõ vào bằng nhau, đầu ra X trong model.')
            continue
          }
          if (!doc.parts.some(r => r.type === 'resistor' && r.value?.ohm === 10000 &&
            [net(r.id,'a'),net(r.id,'b')].includes(vcc) && [net(r.id,'a'),net(r.id,'b')].includes(out))) {
            issues.push(id + ': ngõ open-collector nhả Z khi thiếu kéo lên 10 kΩ.')
            continue
          }
        }
        devices.push(r2bDcElement(model,devices.length+1,node(out),node(plus),node(minus)))
        assumptions.push(id + ' · kênh ' + (channel+1) + ' · OUT=' + node(out) +
          '. Model DC hành vi ở 5 V. Miền điện áp ngõ vào 0–3 V.')
      }
      continue
    }
    const terminals = analogParts[type]
    if (!registered?.pins.some(pin => wired(net(id, pin.id)))) { ignored.push(id); continue }
    if (!terminals) { issues.push(id + ': chưa có model analog DC cho ' + (registered?.label ?? type) + '.'); continue }
    const nets = terminals.map(pin => net(id, pin))
    if (!nets.every(wired)) { issues.push(id + ': nối đủ các chân của model analog DC.'); continue }
    const labels = nets.map(node)
    const suffix = String(devices.length + 1)
    const pair = labels.join(' ')
    const ref = (prefix: string, body: string) => {
      devices.push(prefix + suffix + ' ' + body)
      assumptions.push(prefix + suffix + ' · ' + id + ' · ' + terminals.map((pin, i) => pin + '=' + labels[i]).join(', '))
    }
    if (type === 'resistor') {
      const ohm = part.value?.ohm ?? 220
      if (!Number.isFinite(ohm) || ohm <= 0 || ohm > 1e9) issues.push(id + ': điện trở phải nằm trong miền 0–1 GΩ.')
      else ref('R', pair + ' ' + ohm)
    } else if (type === '1n4148-r1') {
      models.add(diodeModel); ref('D', pair + ' MM4148')
    } else if (type === '2n3904-r1') {
      models.add(bjtModel); ref('Q', pair + ' MM3904')
    } else if (type === 'tmp36-r1') {
      if (rails.get(nets[0]) !== 3.3 || nets[2] !== ground || !Number.isFinite(temperature) || temperature < 0 || temperature > 75) {
        issues.push(id + ': model TMP36 dùng nguồn 3,3 V, GND chung và 0–75 °C.')
      } else {
        ref('VTMP', labels[1] + ' 0 DC ' + (0.5 + temperature / 100).toFixed(5))
        assumptions.push(id + ': điện áp điển hình ở ' + temperature + ' °C. Nguồn áp tương đương dùng cho tải trở kháng cao.')
      }
    }
  }
  if (!devices.length) issues.push('Nối một phần tử analog được hỗ trợ trước khi tạo netlist.')
  if (issues.length) return { ok: false, issues }
  const netlist = ['Mach Mo freestyle DC', ...sourceLines, ...devices, ...models, '.temp 25', '.op', '.end'].join('\n')
  const errors = inspectSpiceNetlist(netlist).errors
  if (errors.length) return { ok: false, issues: errors }
  if (!r3) return { ok: true, netlist, assumptions, ignoredUnwiredParts: ignored }
  const pinSignals: Record<string,string> = {}
  for (const part of doc.parts) for (const pin of getComponentDefinition(part.type)?.pins ?? []) {
    const value = nodes.get(net(part.id,pin.id))
    if (value && value !== '0') pinSignals[part.id + ':' + pin.id] = 'v(' + value + ')'
  }
  const railSignals = new Map([...rails.keys()].map((key,index) => [key, 'i(vcc' + (index + 1) + ')']))
  const sourceSignals: Record<string,string> = {}
  for (const battery of batteries) {
    const signal = railSignals.get(net(battery.id,'positive'))
    if (signal) sourceSignals[battery.id] = signal
  }
  return { ok: true, netlist, assumptions, ignoredUnwiredParts: ignored, pinSignals, sourceSignals }
}
