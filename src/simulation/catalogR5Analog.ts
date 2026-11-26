import { needR5, type R5Circuit } from './catalogR5Circuit'
import { inspectSpiceNetlist } from './spiceNetlist'

export function compileR5Analog(c: R5Circuit) {
  const { pin, gnd } = c
  const relative = new Map([[gnd, '0']])
  const node = (net: string) => {
    if (!relative.has(net)) relative.set(net, 'n' + relative.size)
    return relative.get(net)!
  }
  const p = (name: string) => node(pin(name))
  const lines = ['Mach Mo R5 ' + c.model.mpn]
  const probes: Record<string, string> = {}
  const probe = (key: string, net: string) => { probes[key] = 'v(' + node(net) + ')' }
  const positive = (value: number | undefined, max: number) => !!value && value > 0 && value <= max
  let label: string

  if (c.model.catalogId === 'lm386') {
    c.rail('vs', 9)
    needR5(pin('inminus') === gnd, 'Nối IN− của LM386 về mass.')
    c.coupledSine(pin('inplus'), 100e-9)
    c.cap(pin('bypass'), gnd, 10e-6, 'BYPASS')
    const output = c.capacitors.find(item => item.a === pin('out') && item.value === 220e-6)
    needR5(output && output.b !== gnd, 'Hở tụ ghép 220 µF hoặc sai cực.')
    const speaker = c.load(output.b, gnd, 'loa sau tụ ghép', 'resistive')
    needR5(speaker.ohm === 8, 'Bài LM386 dùng loa 8 Ω.')
    const gain1 = pin('gain1'), gain8 = pin('gain8')
    const gainOpen = !c.wired(c.partId, 'gain1') && !c.wired(c.partId, 'gain8')
    if (!gainOpen) c.cap(gain1, gain8, 10e-6, 'gain 10 µF giữa chân 1 và 8')
    const gain = gainOpen ? 20 : 200
    lines.push(
      'BMMR5L1 lmcore 0 V=0.5*V(' + p('vs') + ')+min(max(' + gain + '*V(' + p('inplus') + ',' + p('inminus') + '),-2.2),2.2)',
      'Rmmout lmcore ' + p('out') + ' 0.05',
      'Rmmin ' + p('inplus') + ' 0 50k',
      'Rbypass ' + p('bypass') + ' 0 50k',
    )
    if (!gainOpen) lines.push('Rgain1 ' + p('gain1') + ' 0 1meg', 'Rgain8 ' + p('gain8') + ' 0 1meg')
    probe('load', output.b)
    probe('ampout', pin('out'))
    label = 'LM386 ' + gain + '× · loa'
  } else {
    c.rail('vp', 12)
    c.rail('vn', -12)
    needR5(c.sines.some(item => item.a === pin('in1p') && item.b === gnd && Math.abs(item.value ?? Infinity) <= 0.25),
      'Nối nguồn sin 1 kHz với IN1+ và mass.')
    const feedback = c.resistance(pin('out1'), pin('in1n'), 'hồi tiếp A')
    const gain = 1 + feedback / c.resistance(pin('in1n'), gnd, 'Rg')
    needR5(gain <= 20 && pin('in2p') === pin('out1') && pin('in2n') === pin('out2'),
      'Dùng hồi tiếp không đảo đến 20× và hồi tiếp unity ở kênh B.')
    c.load(pin('out1'), gnd, 'kênh A', 'resistive')
    c.load(pin('out2'), gnd, 'kênh B', 'resistive')
    for (const channel of [1, 2]) {
      const plus = p('in' + channel + 'p'), minus = p('in' + channel + 'n')
      const out = p('out' + channel)
      const pole = 'nepole' + channel
      const core = 'necore' + channel
      // A dominant pole keeps the feedback loop continuous. 100k DC gain
      // and a 100 Hz open-loop pole give a 10 MHz unity-gain reference.
      lines.push('BMMR5G' + channel + ' ' + pole + ' 0 I=-0.001*V(' + plus + ',' + minus + ')',
        'Rmmgain' + channel + ' ' + pole + ' 0 100meg',
        'Cmmpole' + channel + ' ' + pole + ' 0 15.9155p',
        'BMMR5O' + channel + ' ' + core + ' 0 V=min(max(V(' + pole + '),V(' + p('vn') + ')+2),V(' + p('vp') + ')-2)',
        'Rmmout' + channel + ' ' + core + ' ' + out + ' 1')
    }
    probe('outa', pin('out1'))
    probe('outb', pin('out2'))
    label = 'NE5532 ' + Number(gain.toFixed(3)) + '× · kênh A và B'
  }

  c.dc.forEach((source, index) => {
    needR5(source.a && source.b && source.a !== source.b && source.value !== undefined && Math.abs(source.value) <= 12, 'Nguồn DC nằm ngoài bài R5.')
    lines.push('VDC' + index + ' ' + node(source.a) + ' ' + node(source.b) + ' DC ' + source.value)
  })
  c.sines.forEach((source, index) => {
    needR5(source.a !== source.b && source.value !== undefined && Math.abs(source.value) <= 0.25, 'Nguồn sin nằm ngoài bài R5.')
    const phase = source.value < 0 ? ' 0 0 180' : ''
    lines.push('VSin' + index + ' ' + node(source.a) + ' ' + node(source.b) + ' SIN(0 ' + Math.abs(source.value) + ' 1000' + phase + ')')
  })
  c.resistors.forEach((r, index) => {
    needR5(r.a !== r.b && positive(r.value, 1e7), 'Trị số điện trở không hợp lệ.')
    lines.push('R' + index + ' ' + node(r.a) + ' ' + node(r.b) + ' ' + r.value)
  })
  c.capacitors.forEach((cap, index) => {
    needR5(cap.a !== cap.b && positive(cap.value, 0.001), 'Trị số hoặc cách nối tụ không hợp lệ.')
    lines.push('C' + index + ' ' + node(cap.a) + ' ' + node(cap.b) + ' ' + cap.value)
  })
  c.loads.forEach((load, index) => {
    needR5(load.a !== load.b && positive(load.ohm, 1e5) && load.henry === 0, 'Tải analog phải là điện trở thuần.')
    lines.push('RLoad' + index + ' ' + node(load.a) + ' ' + node(load.b) + ' ' + load.ohm)
  })
  const netlist = [...lines, '.tran 5u 12m 0 5u', '.end'].join('\n')
  const inspection = inspectSpiceNetlist(netlist)
  needR5(!inspection.errors.length, inspection.errors.join(' '))
  return { ok: true as const, kind: 'spice' as const, text: label, netlist, probes }
}

type Series = { name: string; values: number[] }
export function r5SpicePeaks(probes: Record<string, string>, series: Series[]) {
  const time = series.find(item => item.name.toLowerCase() === 'time')?.values
  if (!time) throw new Error('Thiếu trục thời gian ngspice.')
  return Object.fromEntries(Object.entries(probes).map(([key, name]) => {
    const probe = series.find(item => item.name.toLowerCase() === name)
    const samples = probe?.values.filter((_, i) => time[i] >= 0.009) ?? []
    if (!samples.length || samples.some(value => !Number.isFinite(value))) throw new Error('Thiếu mẫu cuối kỳ tại ' + name + '.')
    return [key, (Math.max(...samples) - Math.min(...samples)) / 2]
  }))
}
