import type { ComponentPin, ElectricalType } from './componentRegistry'

export const r5ControllerType = 'r5-controller'
export const r5SignalPins = [
  'din', 'bclk', 'lrclk', 'g1', 'g0', 'sdl', 'sdr', 'sd', 'ena', 'enb',
  'a1', 'a2', 'b1', 'b2', 'sleep', 'reset', 'dir', 'step', 'disable', 'm0', 'm1', 'm2',
  'in1', 'in2', 'in3', 'in4', 'in5', 'in6', 'in7', 'in8',
] as const

const roles: Record<string, ElectricalType> = { i: 'input', o: 'output', v: 'power', g: 'ground', p: 'passive' }
const ti = (name: string) => 'https://www.ti.com/lit/ds/symlink/' + name + '.pdf'
const adr = 'https://www.analog.com/media/en/technical-documentation/data-sheets/max98357a-max98357b.pdf'
const st = 'https://www.st.com/resource/en/datasheet/uln2801a.pdf'

function channels(label: string, count: number, role: string, reverse = false) {
  return Array.from({ length: count }, (_, index) => label + (reverse ? count - index : index + 1) + ':' + role).join(' ')
}

function define<Id extends string>(catalogId: Id, mpn: string, packageName: string,
  source: string, pinoutPage: number, pinList: string, scope: string, manufacturer = 'Texas Instruments') {
  return {
    catalogId, id: `${catalogId}-r5` as const, packageKey: `${catalogId}R5` as const,
    mpn, packageName, source, datasheet: mpn, pinoutPage, manufacturer, scope,
    revision: 'R5' as const, simulation: 'behavioral' as const,
    pins: pinList.split(' ').map((entry, index): ComponentPin & { pad: number } => {
      const [id, role = 'p', label] = entry.split(':')
      return { id, label: label?.replaceAll('_', ' ') ?? id.toUpperCase(), electricalType: roles[role], pad: index + 1 }
    }),
  }
}

export const catalogR5Parts = [
  define('lm386', 'LM386N-1/NOPB', 'PDIP-8 P', ti('lm386'), 3,
    'gain1 inminus:i:IN− inplus:i:IN+ gnd:g out:o:VOUT vs:v bypass gain8',
    'Đo tín hiệu loa qua tụ ghép, độ lợi 20/200 và biên độ khi bão hòa bằng ngspice WASM.'),
  define('max98357a', 'MAX98357AETE+T', 'TQFN-16 T1633+4', adr, 15,
    'din:i gain:p:GAIN_SLOT gnd:g sd:i:SD_MODE nc5 nc6 vdd:v vdd8:v:VDD outp:o outn:o gnd11:g:GND nc12 nc13 lrclk:i gnd15:g:GND bclk:i ep:g',
    'Giải mã I²S 16 bit, chọn kênh hoặc trộn kênh và đo biên độ vi sai trung bình tại loa ảo.', 'Analog Devices'),
  define('tpa2012d2', 'TPA2012D2RTJR', 'WQFN-20 RTJ0020D', ti('tpa2012d2'), 3,
    'g1:i outlp:o:OUTL+ pvdd:v pgnd:g outln:o:OUTL− nc6 sdl:i:/SDL sdr:i:/SDR avdd:v nc10 outrn:o:OUTR− pgnd12:g:PGND pvdd13:v:PVDD outrp:o:OUTR+ g0:i inrp:i:INR+ inrn:i:INR− agnd:g inln:i:INL− inlp:i:INL+ ep:g',
    'Đo độ lợi vi sai 2×, 4×, 8×, 16× và tắt từng kênh. Biên độ trung bình của mô hình Class D.'),
  define('ne5532', 'NE5532P', 'PDIP-8 P', ti('ne5532'), 2,
    'out1:o in1n:i:IN1− in1p:i:IN1+ vn:v:VCC− in2p:i:IN2+ in2n:i:IN2− out2:o vp:v:VCC+',
    'Đo độ lợi tầng không đảo và tầng đệm bằng ngspice WASM với hai rail ±12 V.'),
  define('l293d', 'L293DNE', 'PDIP-16 NE', ti('l293'), 2,
    'ena:i:1,2EN in1:i:1A out1:o:1Y gnd:g gnd5:g:GND out2:o:2Y in2:i:2A vcc2:v enb:i:3,4EN in3:i:3A out3:o:3Y gnd12:g:GND gnd13:g:GND out4:o:4Y in4:i:4A vcc1:v',
    'Hai cầu H, chiều quay, Hi-Z và phanh. Dòng khóa trục theo sụt áp của mô hình.'),
  define('drv8833', 'DRV8833PWPR', 'HTSSOP-16 PWP0016C', ti('drv8833'), 3,
    'aisen aout2:o bout2:o bisen bout1:o fault:o:/FAULT bin1:i bin2:i vcp vm:v gnd:g vint ain2:i ain1:i sleep:i:/SLEEP aout1:o ep:g',
    'Hai cầu H độc lập, chế độ ngủ và ngưỡng dòng xác định bởi hai điện trở sense.'),
  define('drv8825', 'DRV8825PWPR', 'HTSSOP-28 PWP0028V', ti('drv8825'), 3,
    'cp1 cp2 vcp vma:v aout1:o isena aout2:o bout2:o isenb bout1:o vmb:v avref:v bvref:v gnd:g v3p3out reset:i:/RESET sleep:i:/SLEEP fault:o:/FAULT decay:i dir:i disable:i:/ENBL step:i nc23 m0:i:MODE0 m1:i:MODE1 m2:i:MODE2 home:o:/HOME gnd28:g:GND ep:g',
    'Kiểm bộ đếm bước, DIR, /HOME và dòng hai pha với full step, half step và 1/8 step.'),
  define('uln2003a', 'ULN2003AN', 'PDIP-16 N', ti('uln2003a'), 3,
    channels('in', 7, 'i') + ' gnd:g:E/GND com ' + channels('out', 7, 'o', true),
    'Bảy kênh đóng cắt low-side, tải RL và diode hồi dòng về COM.'),
  define('uln2803a', 'ULN2803A', 'PDIP-18', st, 2,
    channels('in', 8, 'i') + ' gnd:g:E/GND com ' + channels('out', 8, 'o', true),
    'Tám kênh đóng cắt low-side, tải RL và diode hồi dòng về COM.', 'STMicroelectronics'),
  define('drv8871', 'DRV8871DDAR', 'HSOIC-8 DDA0008B', ti('drv8871'), 3,
    'gnd:g in2:i in1:i ilim vm:v out1:o pgnd:g out2:o ep:g',
    'Cầu H đơn, chế độ ngủ và giới hạn dòng danh định theo điện trở ILIM.'),
] as const

export type R5Part = typeof catalogR5Parts[number]
export type R5Model = R5Part['catalogId']
export const getR5PartByType = (type: string) => catalogR5Parts.find(part => part.id === type)
