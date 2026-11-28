import { createNetIndexV2 } from '../circuitNetsV2'
import type { CircuitDocV2, CircuitEndpointV2, CircuitPartV2 } from '../circuitDocV2'

const pin = (partId: string, pinId: string): CircuitEndpointV2 => ({ kind: 'pin', partId, pinId })

export function buttonLedCircuit(prefix: 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8' | 'a9' | 'a10' | 'a11' | 'a12', input: number, output = 10, fixtureVolts?: number) {
  const part = (id: string, type: string, lane: 'left' | 'bottom' | 'right', order: number, ohm?: number): CircuitPartV2 =>
    ({ id, type, mount: { kind: 'bench', lane, order }, ...(ohm ? { value: { ohm } } : {}) })
  const arduino = prefix === 'a8' || prefix === 'a10' || fixtureVolts === 5
  const volts = fixtureVolts ?? (arduino ? 5 : 3.3)
  const voltageLabel = arduino ? '5 V' : '3,3 V'
  const pinLabel = prefix === 'a5' || prefix === 'a6' ? 'GP' : 'GPIO'
  const stm32 = prefix === 'a7' || prefix === 'a9'
  const inputLabel = (arduino ? 'D' : stm32 ? 'PA' : pinLabel) + input
  const outputLabel = (arduino ? 'D' : stm32 ? 'PB' : pinLabel) + output
  const button = prefix + '-button'
  const led = prefix + '-led'
  const pull = prefix + '-pullup'
  const limit = prefix + '-limit'
  const parts = [part('board', 'board', 'left', 0), part(pull, 'resistor', 'bottom', 0, 10000),
    part(button, 'button', 'right', 0), part(limit, 'resistor', 'bottom', 1, 1000), part(led, 'led', 'right', 1)]
  const nets = [
    { name: 'nguồn ' + voltageLabel + ' và điện trở kéo lên', pins: [['board', 'vcc'], [pull, 'a']], role: 'power' },
    { name: `${inputLabel}, điện trở kéo lên và nút nhấn`, pins: [['board', 'input'], [pull, 'b'], [button, 'contactA']], role: 'signal' },
    { name: 'GND, nút nhấn và cathode LED', pins: [['board', 'gnd'], [button, 'contactB'], [led, 'cathode']], role: 'ground' },
    { name: `${outputLabel} và điện trở hạn dòng`, pins: [['board', 'ledOut'], [limit, 'a']], role: 'signal' },
    { name: 'điện trở hạn dòng và anode LED', pins: [[limit, 'b'], [led, 'anode']], role: 'signal' },
  ] as const

  function build(): CircuitDocV2 {
    const wires = nets.flatMap(({ pins, role }, netIndex) => pins.slice(1).map(([partId, pinId], wireIndex) => ({
      id: `${prefix}-${netIndex + 1}-${wireIndex + 1}`, role, from: pin(pins[0][0], pins[0][1]), to: pin(partId, pinId),
    })))
    return {
      schema: 2, lessonId: 'freestyle', breadboards: [], parts: structuredClone(parts), wires,
      expect: { partCount: parts.length, wireCount: wires.length, netCount: nets.length },
    }
  }

  function validate(doc: CircuitDocV2) {
    const name = prefix.toUpperCase()
    if (doc.parts.length !== parts.length || parts.some(expected => !doc.parts.some(p => p.id === expected.id && p.type === expected.type))) {
      return [`Mạch ${name} cần một nút nhấn, một LED và hai điện trở.`]
    }
    if (parts.some(expected => expected.value && doc.parts.find(p => p.id === expected.id)?.value?.ohm !== expected.value.ohm)) {
      return [`Dùng 10 kΩ kéo ${inputLabel} lên ${voltageLabel} và 1 kΩ nối tiếp LED.`]
    }
    const index = createNetIndexV2(doc)
    const problems = nets.flatMap(group => {
      const keys = group.pins.map(([id, key]) => `${id}:${key}`)
      const net = index.netOf(keys[0])
      return net && net.endpoints.size === keys.length && keys.every(key => net.endpoints.has(key))
        ? [] : [`Kiểm tra dây và ngắn mạch ở nhóm ${group.name}.`]
    })
    if (index.netsList().some(net => net.wireIds.size > 0 && !nets.some(({ pins }) => net.endpoints.has(pins[0].join(':'))))) {
      problems.push(`Bỏ nhánh dây ngoài mạch mẫu ${name}.`)
    }
    return problems
  }

  function dcNetlist(pressed: boolean, outputHigh: boolean) {
    return `${prefix === 'a10' || prefix === 'a12' && arduino ? 'AVR' : prefix === 'a8' ? 'RA4M1' : prefix === 'a9' ? 'STM32F1/L4' : prefix === 'a7' ? 'STM32F4' : prefix === 'a6' ? 'RP2350' : prefix === 'a5' ? 'RP2040' : 'ESP32'} ${prefix.toUpperCase()} button and LED at 27 C
VCC vcc 0 DC ${volts}
RPULL vcc gpio${input} 10000
${pressed ? `RBUTTON gpio${input} 0 1\n` : ''}VOUT gpio${output} 0 DC ${outputHigh ? volts : 0}
RLIMIT gpio${output} anode 1000
DLED anode 0 ESP_RED
.model ESP_RED D(IS=1e-18 N=2.2 RS=20)
.temp 27
.op
.end`
  }

  return { build, validate, dcNetlist }
}
