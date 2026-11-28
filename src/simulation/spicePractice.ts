import { catalogR1Spice } from './catalogR1Spice'
import { catalogR2bSpice } from './catalogR2bSpice'
import { catalogR3Spice } from './catalogR3Spice'
import { unoA1Spice } from './unoA1Spice'
import { probeValue, type SpiceSeriesLike } from './spiceProbes'

type PracticeMeasure = { signal: string; unit: 'V' | 'mA' | 'nA'; min: number; max: number }

export type SpicePracticeVariant = {
  label: string
  netlist: string
  explanation: string
  sampleTime?: number
  measure?: PracticeMeasure
}

export type SpicePractice = {
  id: string
  name: string
  description: string
  model: string
  parts: readonly string[]
  analysis: 'op' | 'tran'
  measure: PracticeMeasure
  variants: readonly [SpicePracticeVariant, ...SpicePracticeVariant[]]
}

const rcNetlist = (capacitance: number) => `RC step experiment
V1 IN 0 PULSE(0 5 0 1us 1us 70ms 150ms)
R1 IN OUT 1k
C1 OUT 0 ${capacitance}u
.tran 50us 50ms
.end`

const rlNetlist = (inductance: number) => `RL step experiment
V1 IN 0 PULSE(0 5 0 1us 1us 20ms 50ms)
R1 IN OUT 100
L1 OUT 0 ${inductance}m
.tran 10us 12ms
.end`

const diodeNetlist = (source: number, model: string) => `Junction bias experiment
V1 IN 0 DC ${source}
R1 IN ANODE 1k
D1 ANODE 0 JUNCTION
.model JUNCTION D(${model})
.op
.end`

const bjtNetlist = (input: number) => `NPN switch experiment
VCC SUPPLY 0 DC 5
VCTRL IN 0 DC ${input}
RB IN BASE 4.7k
RL SUPPLY OUT 1k
Q1 OUT BASE 0 SWITCHNPN
.model SWITCHNPN NPN(IS=1e-14 BF=100 BR=2)
.op
.end`

const mosfetNetlist = (threshold: number) => `NMOS threshold experiment
VCC SUPPLY 0 DC 5
VG GATE 0 DC 3.3
RL SUPPLY OUT 1k
M1 OUT GATE 0 0 SWITCHMOS
.model SWITCHMOS NMOS(VTO=${threshold} KP=0.02)
.op
.end`

export const spicePractices: readonly SpicePractice[] = [
  ...catalogR1Spice,
  ...catalogR2bSpice,
  ...catalogR3Spice,
  unoA1Spice,
  {
    id: 'rc-charge', name: 'Tụ điện nạp qua điện trở',
    description: 'Đổi điện dung rồi đo điện áp trên tụ tại một hằng số thời gian τ.',
    model: 'Tụ và điện trở lý tưởng. Bài này bỏ qua điện trở nối tiếp, dòng rò và dung sai.',
    parts: ['capacitor', 'resistor'], analysis: 'tran',
    measure: { signal: 'v(out)', unit: 'V', min: 0, max: 5 },
    variants: [
      { label: 'Tụ 10 µF · đo ở 10 ms', netlist: rcNetlist(10), sampleTime: 0.01, explanation: 'R = 1 kΩ và C = 10 µF cho τ = 10 ms. Sau một τ, tụ đã đi được khoảng 63% quãng đường từ 0 V tới 5 V.' },
      { label: 'Tụ 22 µF · đo ở 22 ms', netlist: rcNetlist(22), sampleTime: 0.022, explanation: 'Tụ lớn hơn nạp chậm hơn. Ở thời điểm τ mới, điện áp vẫn gần 63% điện áp đích.' },
    ],
  },
  {
    id: 'rl-current', name: 'Dòng điện tăng qua cuộn cảm',
    description: 'Đổi độ tự cảm và đo dòng qua L1 sau một hằng số thời gian τ.',
    model: 'Cuộn cảm tuyến tính lý tưởng. Bài này bỏ qua điện trở cuộn dây, bão hòa lõi và tổn hao.',
    parts: ['resistor'], analysis: 'tran',
    measure: { signal: 'i(l1)', unit: 'mA', min: 0, max: 50 },
    variants: [
      { label: 'Cuộn 100 mH · đo ở 1 ms', netlist: rlNetlist(100), sampleTime: 0.001, explanation: 'τ = L/R = 1 ms. Dòng đích là 5 V / 100 Ω = 50 mA. Dòng tại một τ đạt khoảng 63% giá trị đó.' },
      { label: 'Cuộn 220 mH · đo ở 2,2 ms', netlist: rlNetlist(220), sampleTime: 0.0022, explanation: 'Tăng L kéo dài thời gian dòng tăng. R và nguồn giữ nguyên nên dòng đích vẫn là 50 mA.' },
    ],
  },
  {
    id: 'diode-bias', name: 'Diode dẫn thuận và phân cực ngược',
    description: 'So sánh điện áp anode khi đảo nguồn hoặc đổi giữa hai model diode.',
    model: 'Hai model diode giáo dục dùng IS, N và RS. Chúng minh họa xu hướng silicon và Schottky, với phân tích DC ở các trị số đã chọn.',
    parts: ['diode', 'resistor'], analysis: 'op',
    measure: { signal: 'v(anode)', unit: 'V', min: -5, max: 5 },
    variants: [
      { label: 'Silicon thuận · nguồn 5 V', netlist: diodeNetlist(5, 'IS=1e-12 N=1 RS=1'), explanation: 'Khi diode dẫn, dòng qua R1 làm giảm điện áp ở anode. Trên sơ đồ đo, chọn D1 để xem dòng nhánh và nút ANODE để xem điện áp so với GND.' },
      { label: 'Silicon ngược · nguồn −5 V', netlist: diodeNetlist(-5, 'IS=1e-12 N=1 RS=1'), explanation: 'Dòng ngược rất nhỏ trong dải đang thử, nên gần như toàn bộ điện áp nguồn nằm trên diode.' },
      { label: 'Schottky thuận · nguồn 5 V', netlist: diodeNetlist(5, 'IS=2e-7 N=1.12 RS=1'), explanation: 'Ở mạch này, model Schottky có điện áp thuận thấp hơn model silicon. So sánh hai lần chạy ở cùng nguồn 5 V.' },
    ],
  },
  {
    id: 'bjt-switch', name: 'BJT NPN đóng cắt tải',
    description: 'Đổi điện áp điều khiển và dự đoán mức điện áp tại collector.',
    model: 'BJT NPN giáo dục với hệ số khuếch đại dòng BF = 100. Phép thử dùng điểm làm việc DC tại hai mức điều khiển.',
    parts: ['transistor-bjt', 'resistor'], analysis: 'op',
    measure: { signal: 'v(out)', unit: 'V', min: 0, max: 5 },
    variants: [
      { label: 'Đầu vào 0 V', netlist: bjtNetlist(0), explanation: 'Khi dòng base gần bằng 0, transistor ngắt. Điện trở tải kéo collector lên gần nguồn 5 V.' },
      { label: 'Đầu vào 3,3 V', netlist: bjtNetlist(3.3), explanation: 'Dòng base qua RB làm transistor dẫn. Điện áp collector hạ xuống và dòng tăng qua điện trở tải.' },
    ],
  },
  {
    id: 'mosfet-gate', name: 'Ngưỡng cổng của MOSFET kênh N',
    description: 'Giữ cùng điện áp cổng 3,3 V và so sánh hai model có VTO khác nhau.',
    model: 'Hai model NMOS giáo dục thay đổi VTO, giữ KP cố định. Phạm vi là xu hướng đóng cắt DC ở tải đã cho.',
    parts: ['mosfet', 'resistor'], analysis: 'op',
    measure: { signal: 'v(out)', unit: 'V', min: 0, max: 5 },
    variants: [
      { label: 'Model VTO = 1,5 V', netlist: mosfetNetlist(1.5), explanation: 'VGS cao hơn VTO của model này. Dòng qua kênh làm điện áp tại drain giảm.' },
      { label: 'Model VTO = 4 V', netlist: mosfetNetlist(4), explanation: 'VGS thấp hơn VTO của model này. Drain gần 5 V vì dòng qua kênh rất nhỏ trong mô hình.' },
    ],
  },
]

export function findSpicePractice(id: string | null) {
  return spicePractices.find(practice => practice.id === id)
}

export function practiceValue(practice: SpicePractice, variant: SpicePracticeVariant, series: readonly SpiceSeriesLike[]) {
  const { signal, unit } = variant.measure ?? practice.measure
  const scale = unit === 'nA' ? 1e9 : unit === 'mA' ? 1e3 : 1
  if (variant.sampleTime === undefined) {
    const value = probeValue(series, signal, 0)
    return value === undefined ? undefined : scale * value
  }
  const time = series.find(item => item.type === 'time')?.values
  if (!time?.length || time[0] > variant.sampleTime) return undefined
  if (series.find(item => item.name.toLowerCase() === signal)?.values.length !== time.length) return undefined

  const sampleTime = variant.sampleTime
  const right = time.findIndex(point => point >= sampleTime)
  if (right < 0) return undefined
  const nextValue = probeValue(series, signal, right)
  if (nextValue === undefined) return undefined
  if (right === 0 || time[right] === sampleTime) return scale * nextValue

  const previousValue = probeValue(series, signal, right - 1)
  if (previousValue === undefined) return undefined
  const fraction = (sampleTime - time[right - 1]) / (time[right] - time[right - 1])
  return scale * (previousValue + (nextValue - previousValue) * fraction)
}
