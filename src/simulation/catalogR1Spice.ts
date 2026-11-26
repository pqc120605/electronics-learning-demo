import type { SpicePractice } from './spicePractice'

export const diodeModel = '.model MM4148 D(IS=4.5n N=1.9 RS=0.65)'
export const bjtModel = '.model MM3904 NPN(IS=2e-14 BF=200 BR=3 VAF=70 IKF=0.12 RB=8 RC=1 RE=0.2)'
const dc25 = (title: string, body: string) => [title, body, '.temp 25', '.op', '.end'].join('\n')

const forwardDiode = (ma: number) => dc25('Vishay 1N4148-TAP forward DC', `IF 0 A DC ${ma}m\nD1 A 0 MM4148\n${diodeModel}`)
const saturatedBjt = (ma: number) => dc25('onsemi 2N3904BU saturation', `IC 0 C DC ${ma}m\nIB 0 B DC ${ma / 10}m\nQ1 C B 0 MM3904\n${bjtModel}`)
const tmp36 = (celsius: number) => `TMP36GT9Z temperature fixture
VS VS 0 DC 3.3
VOUT OUT 0 DC ${(0.5 + celsius / 100).toFixed(3)}
RL OUT 0 1meg
.op
.end`

export const catalogR1Spice: readonly SpicePractice[] = [
  {
    id: 'r1-1n4148-forward', name: '1N4148-TAP · đặc tuyến thuận',
    description: 'Dùng nguồn dòng để tìm điện áp thuận ở 25 °C.',
    model: 'Model DC của Mạch Mở theo đặc tuyến điển hình Vishay 81857 Rev. 1.6, hình 2. So sánh 1 và 10 mA với đường điển hình rồi dùng 5 mA làm điểm kiểm trung gian. Datasheet công bố VF tối đa 1 V tại 10 mA.',
    parts: ['1n4148'], analysis: 'op', measure: { signal: 'v(a)', unit: 'V', min: 0, max: 1.2 },
    variants: [
      { label: '1 mA', netlist: forwardDiode(1), explanation: 'Ghi điện áp ở đầu dải thử, sau đó tăng lên 5 mA.' },
      { label: '5 mA', netlist: forwardDiode(5), explanation: 'Điểm kiểm độc lập ở giữa dải. So sánh với hình 2 của datasheet.' },
      { label: '10 mA', netlist: forwardDiode(10), explanation: 'Đối chiếu giới hạn 1 V của datasheet ở đúng dòng thử.' },
    ],
  },
  {
    id: 'r1-1n4148-leak', name: '1N4148-TAP · dòng rò ngược',
    description: 'Đọc dòng ngược ở điện áp −20 V và 25 °C.',
    model: 'Source current dùng dấu dương theo độ lớn dòng rò ngược trong cấu hình này. Giá trị datasheet tối đa là 25 nA tại 20 V và 25 °C. Model DC chưa khảo sát dòng rò theo nhiệt độ hoặc đánh thủng.',
    parts: ['1n4148'], analysis: 'op', measure: { signal: 'i(vbias)', unit: 'nA', min: 0, max: 40 },
    variants: [{ label: 'Phân cực ngược 20 V', netlist: dc25('Vishay 1N4148-TAP reverse DC', `VBIAS A 0 DC -20\nD1 A 0 MM4148\n${diodeModel}`),
      explanation: 'Đối chiếu dòng đo với giới hạn 25 nA trong bảng Electrical Characteristics.' }],
  },
  {
    id: 'r1-2n3904-saturation', name: '2N3904BU · bão hòa',
    description: 'Đo VCE với dòng collector và base được ấn định theo bảng đo của onsemi.',
    model: 'BJT DC do Mạch Mở xây theo miền đặc tuyến của onsemi 2N3904/D Rev. 3. Fixture dùng 25 °C, bỏ qua tự gia nhiệt. Datasheet dùng phép đo xung cho các thông số vùng dẫn.',
    parts: ['2n3904'], analysis: 'op', measure: { signal: 'v(c)', unit: 'V', min: 0, max: 1 },
    variants: [
      { label: 'IC 10 mA · IB 1 mA', netlist: saturatedBjt(10), explanation: 'VCE(sat) tối đa 0,2 V tại điểm này.' },
      { label: 'IC 50 mA · IB 5 mA', netlist: saturatedBjt(50), explanation: 'Đối chiếu điểm kiểm tải lớn hơn, VCE(sat) tối đa 0,3 V.' },
    ],
  },
  {
    id: 'r1-2n3904-active', name: '2N3904BU · vùng khuếch đại',
    description: 'Giữ VCE = 1 V, đặt IB = 50 µA rồi đo dòng collector.',
    model: 'Model DC cùng biến thể ở 25 °C. Bảng datasheet cho hFE từ 100 tới 300 tại IC = 10 mA và VCE = 1 V. Đây là phép thử phân cực cố định để quan sát IC/IB gần điểm đó.',
    parts: ['2n3904'], analysis: 'op', measure: { signal: 'i(vsense)', unit: 'mA', min: 0, max: 25 },
    variants: [{ label: 'VCE 1 V · IB 50 µA', netlist: dc25('onsemi 2N3904BU forward active', `V1 SUP 0 DC 1\nVSENSE SUP C DC 0\nIB 0 B DC 50u\nQ1 C B 0 MM3904\n${bjtModel}`),
      explanation: 'Chia dòng thu được cho 0,05 mA để tính hFE tại điểm làm việc của model.' }],
  },
  {
    id: 'r1-2n3904-cutoff', name: '2N3904BU · vùng ngắt',
    description: 'Đo dòng rò với VCE = 30 V, VEB = 3 V và 25 °C.',
    model: 'Kiểm điều kiện ICEX trong bảng OFF CHARACTERISTICS. Model DC trong phạm vi các điểm thử, bỏ qua tự gia nhiệt.',
    parts: ['2n3904'], analysis: 'op', measure: { signal: 'i(vsense)', unit: 'nA', min: 0, max: 60 },
    variants: [{ label: 'VCE 30 V · VEB 3 V', netlist: dc25('onsemi 2N3904BU cutoff', `VC SUP 0 DC 30\nVSENSE SUP C DC 0\nVB B 0 DC -3\nQ1 C B 0 MM3904\n${bjtModel}`),
      explanation: 'So sánh độ lớn dòng thu được với giới hạn 50 nA ở 25 °C.' }],
  },
  {
    id: 'r1-tmp36', name: 'TMP36GT9Z · điện áp theo nhiệt độ',
    description: 'So sánh ba điểm nhiệt độ với VCC = 3,3 V và tải 1 MΩ.',
    model: 'Nguồn áp tương đương theo hàm điển hình 500 mV + 10 mV/°C × T ở nguồn và tải cố định. Sai số ghi cho TMP36GT9Z là ±3 °C trên dải quy định. Dung sai cảm biến và sai số ADC không cộng vào số điển hình.',
    parts: ['tmp36'], analysis: 'op', measure: { signal: 'v(out)', unit: 'V', min: 0, max: 2 },
    variants: [
      { label: '0 °C', netlist: tmp36(0), explanation: 'Điểm 0 °C có offset 500 mV.' },
      { label: '25 °C', netlist: tmp36(25), explanation: 'Mức điển hình là 750 mV.' },
      { label: '75 °C', netlist: tmp36(75), explanation: 'Tăng 50 °C từ ca trước làm đầu ra điển hình tăng 500 mV.' },
    ],
  },
]
