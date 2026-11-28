import type { SpicePractice } from './spicePractice'

const netlist = (gpioVolts: 0 | 5) => `SA56-11EWA red segment equivalent at 27 C
VCC vcc 0 DC 5
VOUT gpio 0 DC ${gpioVolts}
DSEG vcc cathode A1_RED
RLIMIT cathode gpio 1000
.model A1_RED D(IS=1e-18 N=2.2 RS=20)
.temp 27
.op
.end`

export const unoA1Spice: SpicePractice = {
  id: 'a1-sa56-segment-dc',
  name: 'SA56-11EWA · dòng qua một đoạn',
  description: 'Đo dòng khi đầu ra giữ mức 0 V hoặc 5 V. Anode nối nguồn 5 V, cathode nối đầu ra qua 1 kΩ.',
  model: 'Một diode LED đỏ tương đương, IS = 10⁻¹⁸ A, N = 2,2 và RS = 20 Ω ở 27 °C. Hai mức đầu ra được mô hình hóa bằng nguồn áp lý tưởng.',
  parts: ['seven-segment-anode'],
  analysis: 'op',
  measure: { signal: 'i(vout)', unit: 'mA', min: 2, max: 4 },
  variants: [
    { label: 'Đầu ra LOW · 0 V', netlist: netlist(0), explanation: 'LED phân cực thuận. So sánh dòng qua VOUT với điện áp hai đầu điện trở 1 kΩ.' },
    { label: 'Đầu ra HIGH · 5 V', netlist: netlist(5), explanation: 'Hai đầu nhánh ở cùng điện áp 5 V. Kiểm dòng qua VOUT gần 0.',
      measure: { signal: 'i(vout)', unit: 'mA', min: -0.001, max: 0.001 } },
  ],
}
