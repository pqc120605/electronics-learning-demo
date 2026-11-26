import { getR5PartByType, r5ControllerType } from '../data/catalogR5Parts'
import { getComponentDefinition } from '../data/componentRegistry'
import type { CircuitDocV2 } from '../lib/circuitDocV2'
import { createNetIndexV2 } from '../lib/circuitNetsV2'

const volts = (value?: string, suffix = 'V') => {
  if (!value?.trim().endsWith(suffix)) return undefined
  const number = Number(value.trim().slice(0, -suffix.length))
  return Number.isFinite(number) ? number : undefined
}
export const r5SinePeak = (value?: string) => volts(value, 'Vpk')
const equal = (actual: number, expected: number) => Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected))

export function needR5(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export function createR5Circuit(doc: CircuitDocV2, partId: string) {
  const part = doc.parts.find(item => item.id === partId)
  const model = part && getR5PartByType(part.type)
  if (!model) throw new Error('Chọn một IC R5 trên bàn lắp mạch.')
  const index = createNetIndexV2(doc)
  const endpoint = (id: string, pin: string) => index.netOf(id + ':' + pin)
  const node = (id: string, pin: string) => endpoint(id, pin)?.key
  const wired = (id: string, pin: string) => {
    const net = endpoint(id, pin)
    return !!net && (net.endpoints.size > 1 || net.wireIds.size > 0)
  }
  const supported = new Set(['battery', 'resistor', 'capacitor', 'r5-sine', 'r5-load', r5ControllerType])
  const unsupported = doc.parts.find(item => item.id !== partId && !supported.has(item.type) &&
    getComponentDefinition(item.type)?.pins.some(pin => wired(item.id, pin.id)))
  needR5(!unsupported, 'Bài đo R5 chưa mô phỏng linh kiện đang nối: ' + (unsupported?.id ?? '') + '.')
  function pin(name: string) {
    const key = node(partId, name)
    needR5(key, 'Thiếu chân ' + name + '.')
    return key
  }
  const controller = doc.parts.find(item => item.type === r5ControllerType)
  const dc = doc.parts.filter(item => item.type === 'battery').map(item => ({
    a: node(item.id, 'positive'), b: node(item.id, 'negative'), value: volts(item.value?.label),
  }))
  const gnd = model.catalogId === 'ne5532'
    ? dc.find(source => source.a === pin('vp'))?.b
    : pin(model.catalogId === 'tpa2012d2' ? 'agnd' : 'gnd')
  needR5(gnd, 'Thiếu mass tham chiếu.')
  const pins = model.pins
  for (const groundPin of pins.filter(pin => pin.electricalType === 'ground')) {
    needR5(wired(partId, groundPin.id) && pin(groundPin.id) === gnd, 'Hở chân mass pad ' + groundPin.pad + '.')
  }
  for (const nc of model.pins.filter(pin => /^nc\d+$/.test(pin.id))) {
    needR5(!wired(partId, nc.id), 'Để hở chân NC pad ' + nc.pad + '.')
  }
  function voltage(net: string | undefined): number | undefined {
    if (net === gnd) return dc.some(item => item.a === gnd && item.b === gnd && item.value !== 0) ? undefined : 0
    const values = dc.flatMap(source => {
      if (source.value === undefined || source.a === source.b) return []
      if (source.a === net && source.b === gnd) return [source.value]
      if (source.b === net && source.a === gnd) return [-source.value]
      return []
    })
    return values.length && values.every(value => value === values[0]) ? values[0] : undefined
  }
  function rail(name: string, expected: number) {
    const value = voltage(pin(name))
    needR5(wired(partId, name) && value !== undefined && equal(value, expected),
      'Kiểm tra rail ' + name.toUpperCase() + ' (' + expected + ' V) và dây mass.')
    return value
  }
  function controlRail(expected: number) {
    needR5(controller && node(controller.id, 'gnd') === gnd && voltage(node(controller.id, 'vref')) === expected,
      'Hở VREF hoặc mass của bộ điều khiển ảo ' + expected + ' V.')
  }
  function signal(name: string, source = name) {
    needR5(controller && node(controller.id, 'gnd') === gnd && pin(name) === node(controller.id, source) && wired(partId, name),
      'Hở hoặc nối sai tín hiệu ' + name.toUpperCase() + '.')
    needR5(voltage(pin(name)) === undefined && !dc.some(item => item.a === pin(name) || item.b === pin(name)),
      'Tín hiệu ' + name.toUpperCase() + ' bị nối với nguồn.')
    needR5(!pins.some(other => other.id !== name && other.electricalType === 'input' && pin(other.id) === pin(name)),
      'Tín hiệu ' + name.toUpperCase() + ' bị chập với ngõ vào khác.')
  }
  const resistors = doc.parts.filter(item => item.type === 'resistor').map(item => ({
    id: item.id, a: node(item.id, 'a')!, b: node(item.id, 'b')!, value: item.value?.ohm,
  }))
  const capacitors = doc.parts.filter(item => item.type === 'capacitor').map(item => ({
    id: item.id, a: node(item.id, 'plus')!, b: node(item.id, 'minus')!, value: item.value?.farad,
  }))
  const loads = doc.parts.filter(item => item.type === 'r5-load').map(item => ({
    id: item.id, a: node(item.id, 'a')!, b: node(item.id, 'b')!, ohm: item.value?.ohm, henry: item.value?.henry ?? 0,
  }))
  const sines = doc.parts.filter(item => item.type === 'r5-sine').map(item => ({
    a: node(item.id, 'plus')!, b: node(item.id, 'minus')!, value: r5SinePeak(item.value?.label),
  }))
  const between = (a: string, b: string, component: { a: string; b: string }) =>
    a !== b && (component.a === a && component.b === b || component.a === b && component.b === a)
  function resistance(a: string, b: string, label: string) {
    const candidates = resistors.filter(item => between(a, b, item))
    const value = candidates[0]?.value
    needR5(candidates.length === 1 && value && value > 0 && Number.isFinite(value), 'Kiểm tra điện trở ' + label + '.')
    return value
  }
  function cap(a: string, b: string, expected: number, label: string) {
    needR5(capacitors.some(item => between(a, b, item) && item.value !== undefined && equal(item.value, expected)),
      'Thiếu tụ ' + label + '.')
  }
  function load(a: string, b: string, label: string, kind: 'speaker' | 'coil' | 'resistive') {
    const candidates = loads.filter(item => between(a, b, item))
    const { ohm, henry } = candidates[0] ?? {}
    needR5(candidates.length === 1 && ohm && ohm >= 1 && ohm <= 100_000 && henry !== undefined &&
      (kind === 'coil' ? henry >= 0.0001 && henry <= 1 : henry === 0),
    'Kiểm tra cách mắc và trị số tải ' + label + '.')
    needR5(kind !== 'speaker' || ohm === 8 && a !== gnd && b !== gnd, 'Loa vi sai 8 Ω cần mắc giữa hai ngõ OUT.')
    return { ohm, henry }
  }
  function coupledSine(target: string, farad: number) {
    const candidates = sines.filter(source => source.b === gnd && capacitors.some(item => between(target, source.a, item)
      && item.value !== undefined && equal(item.value, farad)))
    const value = candidates[0]?.value
    needR5(candidates.length === 1 && value !== undefined && Math.abs(value) <= 0.25, 'Kiểm tra nguồn sin và tụ ghép đầu vào.')
    return value
  }
  return { model, pin, gnd, dc, rail, voltage, controlRail, signal, node, wired, resistance, cap, load, coupledSine,
    resistors, capacitors, loads, sines, partId, net: index.netOf }
}

export type R5Circuit = ReturnType<typeof createR5Circuit>
