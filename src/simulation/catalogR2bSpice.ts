import type { SpicePractice } from './spicePractice'

export type R2bAnalogDc = 'lm358' | 'lm393'

export function r2bDcElement(model: R2bAnalogDc, index: number, out: string, plus: string, minus: string) {
  return model === 'lm358'
    ? 'BMMAMP' + index + ' ' + out + ' 0 V=min(max(100000*V(' + plus + ',' + minus + '),0),3.3)'
    : 'BMMCMP' + index + ' ' + out + ' 0 I=V(' + out + ')*u(V(' + minus + ',' + plus + '))/10'
}

export function r2bDcNetlist(model: R2bAnalogDc, condition: 'buffer' | 'gain' | 'limit' | 'low' | 'high', channel = 1) {
  const lines = ['Mach Mo R2B ' + model + ' DC', 'VS VCC 0 DC 5']
  const out = channel === 1 ? 'OUT' : 'OUT2'
  if (model === 'lm358') {
    const plus = condition === 'buffer' ? .5 : condition === 'gain' ? 1 : 2
    lines.push('VIN P 0 DC ' + plus, 'RL ' + out + ' 0 10k')
    if (condition !== 'buffer') lines.push('RF ' + out + ' N 10k', 'RG N 0 10k')
    lines.push(r2bDcElement(model, channel, out, 'P', condition === 'buffer' ? out : 'N'))
  } else {
    const low = condition === 'low'
    lines.push('VINP P 0 DC ' + (low ? 1 : 2), 'VINN N 0 DC ' + (low ? 2 : 1), 'RP VCC ' + out + ' 10k')
    lines.push(r2bDcElement(model, channel, out, 'P', 'N'))
  }
  return [...lines, '.temp 25', '.op', '.end'].join('\n')
}

export const catalogR2bSpice: readonly SpicePractice[] = [
  {
    id:'r2b-lm358-dc', name:'LM358P · khuếch đại DC', description:'Đo bộ đệm và mạch khuếch đại không đảo.',
    model:'Model hành vi ở 5 V, 25 °C, tải 10 kΩ. Độ lợi hở 100.000. Ngõ vào chung 0–3,0 V và đầu ra giới hạn 0–3,3 V trong phép thử.',
    parts:['lm358'], analysis:'op', measure:{signal:'v(out)',unit:'V',min:0,max:3.3},
    variants:[
      {label:'Bộ đệm · 0,50 V', netlist:r2bDcNetlist('lm358','buffer'), explanation:'Đưa OUT về ngõ đảo để gain vòng kín bằng 1.'},
      {label:'Không đảo · gain 2', netlist:r2bDcNetlist('lm358','gain'), explanation:'Hai điện trở hồi tiếp 10 kΩ cho gain vòng kín xấp xỉ 2.'},
      {label:'Bão hòa · giới hạn mô hình', netlist:r2bDcNetlist('lm358','limit'), explanation:'Đầu ra chạm giới hạn 3,3 V của model.'},
    ],
  },
  {
    id:'r2b-lm393-dc', name:'LM393P · đầu ra open-collector', description:'Đảo hai mức vào rồi đo OUT qua điện trở kéo lên 10 kΩ.',
    model:'Model hành vi ở 5 V và 25 °C. Khi dẫn, nhánh kéo xuống tương đương 10 Ω. Khi ngắt, điện trở kéo lên ấn định điện áp OUT.',
    parts:['lm393'], analysis:'op', measure:{signal:'v(out)',unit:'V',min:0,max:5},
    variants:[
      {label:'V+ = 1 V, V− = 2 V', netlist:r2bDcNetlist('lm393','low'), explanation:'Ngõ ra kéo thấp. Kiểm điện áp nhỏ hơn 0,4 V.'},
      {label:'V+ = 2 V, V− = 1 V', netlist:r2bDcNetlist('lm393','high'), explanation:'Đầu ra nhả. Điện trở kéo OUT lên gần 5 V.'},
    ],
  },
]
