import type { BoardPin, BoardPinoutEvidence } from '../components/board/boardSceneTypes'
import pinSource from './raspberry-pi-pico.j0-pads.json'

type PinDefinition = {
  label: string
  gpio?: number
  functions: string[]
  description: string
  role: string
  safety: string
}

type VariantTransform = { xOffsetMm: number; zOffsetMm: number; cadOffsetXmm: number; cadOffsetZmm: number; boardTopMm: number; anchorBasis: string }

const pinDefinitions: Record<number, PinDefinition> = {
  1: { label: 'GP0', gpio: 0, functions: ['GPIO', 'PIO', 'PWM', 'UART0 TX', 'I²C0 SDA', 'SPI0 RX'], description: 'GPIO đa chức năng GP0.', role: 'GPIO0; có thể ghép UART0 TX, I²C0 SDA hoặc SPI0 RX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  2: { label: 'GP1', gpio: 1, functions: ['GPIO', 'PIO', 'PWM', 'UART0 RX', 'I²C0 SCL', 'SPI0 CSn'], description: 'GPIO đa chức năng GP1.', role: 'GPIO1; có thể ghép UART0 RX, I²C0 SCL hoặc SPI0 CSn.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  3: { label: 'GND', functions: ['Ground'], description: 'Mass chung của mạch.', role: 'Đường hồi dòng và mốc tham chiếu điện áp.', safety: 'Tắt nguồn trước khi thay dây. Không dùng GND thay cho chân cấp nguồn.' },
  4: { label: 'GP2', gpio: 2, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SDA', 'SPI0 SCK'], description: 'GPIO đa chức năng GP2.', role: 'GPIO2; có thể ghép I²C1 SDA hoặc SPI0 SCK.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  5: { label: 'GP3', gpio: 3, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SCL', 'SPI0 TX'], description: 'GPIO đa chức năng GP3.', role: 'GPIO3; có thể ghép I²C1 SCL hoặc SPI0 TX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  6: { label: 'GP4', gpio: 4, functions: ['GPIO', 'PIO', 'PWM', 'UART1 TX', 'I²C0 SDA', 'SPI0 RX'], description: 'GPIO đa chức năng GP4.', role: 'GPIO4; có thể ghép UART1 TX, I²C0 SDA hoặc SPI0 RX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  7: { label: 'GP5', gpio: 5, functions: ['GPIO', 'PIO', 'PWM', 'UART1 RX', 'I²C0 SCL', 'SPI0 CSn'], description: 'GPIO đa chức năng GP5.', role: 'GPIO5; có thể ghép UART1 RX, I²C0 SCL hoặc SPI0 CSn.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  8: { label: 'GND', functions: ['Ground'], description: 'Mass chung của mạch.', role: 'Đường hồi dòng và mốc tham chiếu điện áp.', safety: 'Tắt nguồn trước khi thay dây. Không dùng GND thay cho chân cấp nguồn.' },
  9: { label: 'GP6', gpio: 6, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SDA', 'SPI0 SCK'], description: 'GPIO đa chức năng GP6.', role: 'GPIO6; có thể ghép I²C1 SDA hoặc SPI0 SCK.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  10: { label: 'GP7', gpio: 7, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SCL', 'SPI0 TX'], description: 'GPIO đa chức năng GP7.', role: 'GPIO7; có thể ghép I²C1 SCL hoặc SPI0 TX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  11: { label: 'GP8', gpio: 8, functions: ['GPIO', 'PIO', 'PWM', 'UART1 TX', 'I²C0 SDA', 'SPI1 RX'], description: 'GPIO đa chức năng GP8.', role: 'GPIO8; có thể ghép UART1 TX, I²C0 SDA hoặc SPI1 RX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  12: { label: 'GP9', gpio: 9, functions: ['GPIO', 'PIO', 'PWM', 'UART1 RX', 'I²C0 SCL', 'SPI1 CSn'], description: 'GPIO đa chức năng GP9.', role: 'GPIO9; có thể ghép UART1 RX, I²C0 SCL hoặc SPI1 CSn.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  13: { label: 'GND', functions: ['Ground'], description: 'Mass chung của mạch.', role: 'Đường hồi dòng và mốc tham chiếu điện áp.', safety: 'Tắt nguồn trước khi thay dây. Không dùng GND thay cho chân cấp nguồn.' },
  14: { label: 'GP10', gpio: 10, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SDA', 'SPI1 SCK'], description: 'GPIO đa chức năng GP10.', role: 'GPIO10; có thể ghép I²C1 SDA hoặc SPI1 SCK.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  15: { label: 'GP11', gpio: 11, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SCL', 'SPI1 TX'], description: 'GPIO đa chức năng GP11.', role: 'GPIO11; có thể ghép I²C1 SCL hoặc SPI1 TX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  16: { label: 'GP12', gpio: 12, functions: ['GPIO', 'PIO', 'PWM', 'UART0 TX', 'I²C0 SDA', 'SPI1 RX'], description: 'GPIO đa chức năng GP12.', role: 'GPIO12; có thể ghép UART0 TX, I²C0 SDA hoặc SPI1 RX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  17: { label: 'GP13', gpio: 13, functions: ['GPIO', 'PIO', 'PWM', 'UART0 RX', 'I²C0 SCL', 'SPI1 CSn'], description: 'GPIO đa chức năng GP13.', role: 'GPIO13; có thể ghép UART0 RX, I²C0 SCL hoặc SPI1 CSn.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  18: { label: 'GND', functions: ['Ground'], description: 'Mass chung của mạch.', role: 'Đường hồi dòng và mốc tham chiếu điện áp.', safety: 'Tắt nguồn trước khi thay dây. Không dùng GND thay cho chân cấp nguồn.' },
  19: { label: 'GP14', gpio: 14, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SDA', 'SPI1 SCK'], description: 'GPIO đa chức năng GP14.', role: 'GPIO14; có thể ghép I²C1 SDA hoặc SPI1 SCK.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  20: { label: 'GP15', gpio: 15, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SCL', 'SPI1 TX'], description: 'GPIO đa chức năng GP15.', role: 'GPIO15; có thể ghép I²C1 SCL hoặc SPI1 TX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  21: { label: 'GP16', gpio: 16, functions: ['GPIO', 'PIO', 'PWM', 'UART0 TX', 'I²C0 SDA', 'SPI0 RX'], description: 'GPIO đa chức năng GP16.', role: 'GPIO16; có thể ghép UART0 TX, I²C0 SDA hoặc SPI0 RX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  22: { label: 'GP17', gpio: 17, functions: ['GPIO', 'PIO', 'PWM', 'UART0 RX', 'I²C0 SCL', 'SPI0 CSn'], description: 'GPIO đa chức năng GP17.', role: 'GPIO17; có thể ghép UART0 RX, I²C0 SCL hoặc SPI0 CSn.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  23: { label: 'GND', functions: ['Ground'], description: 'Mass chung của mạch.', role: 'Đường hồi dòng và mốc tham chiếu điện áp.', safety: 'Tắt nguồn trước khi thay dây. Không dùng GND thay cho chân cấp nguồn.' },
  24: { label: 'GP18', gpio: 18, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SDA', 'SPI0 SCK'], description: 'GPIO đa chức năng GP18.', role: 'GPIO18; có thể ghép I²C1 SDA hoặc SPI0 SCK.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  25: { label: 'GP19', gpio: 19, functions: ['GPIO', 'PIO', 'PWM', 'I²C1 SCL', 'SPI0 TX'], description: 'GPIO đa chức năng GP19.', role: 'GPIO19; có thể ghép I²C1 SCL hoặc SPI0 TX.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  26: { label: 'GP20', gpio: 20, functions: ['GPIO', 'PIO', 'PWM', 'I²C0 SDA'], description: 'GPIO đa chức năng GP20.', role: 'GPIO20; có thể ghép I²C0 SDA.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  27: { label: 'GP21', gpio: 21, functions: ['GPIO', 'PIO', 'PWM', 'I²C0 SCL'], description: 'GPIO đa chức năng GP21.', role: 'GPIO21; có thể ghép I²C0 SCL.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Chọn một chức năng ngoại vi phù hợp trong firmware.' },
  28: { label: 'GND', functions: ['Ground'], description: 'Mass chung của mạch.', role: 'Đường hồi dòng và mốc tham chiếu điện áp.', safety: 'Tắt nguồn trước khi thay dây. Không dùng GND thay cho chân cấp nguồn.' },
  29: { label: 'GP22', gpio: 22, functions: ['GPIO', 'PIO', 'PWM'], description: 'GPIO đa chức năng GP22.', role: 'GPIO22; dùng làm I/O số hoặc chức năng ngoại vi khả dụng.', safety: 'GPIO dùng logic 3,3 V và không chịu 5 V. Kiểm tra cấu hình ngoại vi của chương trình trước khi nối.' },
  30: { label: 'RUN', functions: ['Reset'], description: 'Chân điều khiển reset của MCU.', role: 'Kéo RUN xuống thấp sẽ reset RP2040/RP2350.', safety: 'Không đưa 5 V vào RUN. Tránh giữ chân ở mức thấp khi muốn board chạy.' },
  31: { label: 'GP26 / ADC0', gpio: 26, functions: ['GPIO', 'PIO', 'PWM', 'ADC0', 'I²C1 SDA'], description: 'GPIO26 đồng thời là ngõ vào ADC0.', role: 'GPIO26; ADC0 hoặc I²C1 SDA theo cấu hình.', safety: 'Ngõ GPIO/ADC dùng mức 3,3 V; không đưa 5 V. Giới hạn đầu vào analog phải theo datasheet MCU.' },
  32: { label: 'GP27 / ADC1', gpio: 27, functions: ['GPIO', 'PIO', 'PWM', 'ADC1', 'I²C1 SCL'], description: 'GPIO27 đồng thời là ngõ vào ADC1.', role: 'GPIO27; ADC1 hoặc I²C1 SCL theo cấu hình.', safety: 'Ngõ GPIO/ADC dùng mức 3,3 V; không đưa 5 V. Giới hạn đầu vào analog phải theo datasheet MCU.' },
  33: { label: 'GND / AGND', functions: ['Ground', 'Analog ground'], description: 'Chân mass; tài liệu hãng còn gọi đây là mass analog (AGND).', role: 'Điểm mass chung, có thể dùng làm tham chiếu mass cho cảm biến analog.', safety: 'Nối đúng mass chung của mạch; không xem AGND là chân tín hiệu analog.' },
  34: { label: 'GP28 / ADC2', gpio: 28, functions: ['GPIO', 'PIO', 'PWM', 'ADC2'], description: 'GPIO28 đồng thời là ngõ vào ADC2.', role: 'GPIO28 hoặc ADC2 theo cấu hình.', safety: 'Ngõ GPIO/ADC dùng mức 3,3 V; không đưa 5 V. Giới hạn đầu vào analog phải theo datasheet MCU.' },
  35: { label: 'ADC_VREF', functions: ['ADC reference'], description: 'Chân tham chiếu điện áp cho bộ ADC.', role: 'Tham chiếu analog của ADC; không phải GPIO.', safety: 'Không nối nhầm ADC_VREF với nguồn hoặc tín hiệu 5 V; theo datasheet đúng board/MCU.' },
  36: { label: '3V3(OUT)', functions: ['3.3 V regulated output'], description: 'Nguồn đầu ra 3,3 V đã ổn áp trên board.', role: 'Cấp nguồn phụ tải phù hợp giới hạn thiết kế.', safety: 'Không cấp ngược điện áp vào chân này; tải tối đa phải theo datasheet board.' },
  37: { label: '3V3_EN', functions: ['Regulator enable'], description: 'Chân cho phép bộ ổn áp 3,3 V hoạt động.', role: 'Kéo xuống GND sẽ tắt nguồn 3,3 V của board.', safety: 'Không dùng như GPIO hoặc chân cấp tải; kéo thấp có thể làm board mất nguồn.' },
  38: { label: 'GND', functions: ['Ground'], description: 'Mass chung của mạch.', role: 'Đường hồi dòng và mốc tham chiếu điện áp.', safety: 'Tắt nguồn trước khi thay dây. Không dùng GND thay cho chân cấp nguồn.' },
  39: { label: 'VSYS', functions: ['System supply input'], description: 'Đầu vào nguồn hệ thống của board.', role: 'Nguồn hệ thống, dải danh định 2–5 V theo tài liệu hãng.', safety: 'Kiểm tra cực tính và giới hạn nguồn trước khi cấp; tránh cấp đồng thời các nguồn gây backfeed.' },
  40: { label: 'VBUS', functions: ['USB 5 V'], description: 'Đường 5 V từ cổng USB.', role: 'Nguồn USB 5 V; không phải mức logic GPIO.', safety: 'Không nối VBUS vào GPIO. Tránh cấp ngược hoặc đấu song song nguồn ngoài với USB.' },
}

const picoPinoutPdf = 'https://datasheets.raspberrypi.com/pico/Pico-2-Pinout.pdf'
const picoWPinoutPdf = 'https://datasheets.raspberrypi.com/picow/PicoW-A4-Pinout.pdf'
const productDocs = 'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html'

export function getRaspberryPiPicoPinout(boardId: string): { pins: BoardPin[]; evidence: BoardPinoutEvidence } | undefined {
  const transform = (pinSource.variants as Record<string, VariantTransform>)[boardId]
  if (!transform) return undefined

  const pins = pinSource.pads.map((pad): BoardPin => {
    const detail = pinDefinitions[pad.number]
    const left = pad.number <= 20
    const side = left ? 'left' : 'right'
    const position = left ? pad.number : 41 - pad.number
    const xMm = pad.xMm + transform.cadOffsetXmm - transform.xOffsetMm
    const zMm = pad.yMm + transform.cadOffsetZmm - transform.zOffsetMm
    return {
      id: `j0-${pad.number}`,
      side,
      position,
      label: detail.label,
      headerReference: 'J0',
      padNumber: String(pad.number),
      netName: pad.net,
      gpio: detail.gpio,
      anchor: [xMm / 1000, transform.boardTopMm / 1000, zMm / 1000],
      plainDescription: detail.description,
      technicalRole: detail.role,
      connection: `Pad J0.${pad.number} thuộc net ${pad.net} trong CAD tham chiếu. Chức năng được đối chiếu với pinout chính hãng; chọn chân chỉ tra cứu, không tạo kết nối điện trong mô hình.`,
      safetyNote: detail.safety,
      functions: detail.functions,
    }
  })

  const isPicoW = boardId === 'raspberry-pi-pico-w'
  const inheritedLayout = boardId === 'raspberry-pi-pico-2' || boardId === 'raspberry-pi-pico-2-h'
  const boardName = boardId === 'raspberry-pi-pico' ? 'Pico R3' : isPicoW ? 'Pico W R3' : boardId === 'raspberry-pi-pico-2' ? 'Pico 2' : 'Pico 2 H'
  const sourceBoard = isPicoW ? 'Raspberry Pi Pico W R3 Allegro' : 'Raspberry Pi Pico R3 Allegro'
  const summary = inheritedLayout
    ? `40 chân J0 được căn theo mô hình STEP ${boardName}; vị trí pad dùng layout Pico R3 do Raspberry Pi xác nhận cùng bố trí/pinout. Không có Allegro riêng cho ${boardName} trong nguồn cục bộ, vì vậy phần tọa độ là phép chuyển theo kích thước và hướng USB của STEP, chưa phải đối chiếu PCB ${boardName} riêng.`
    : `40 tâm pad xuyên lỗ J0 lấy từ ${sourceBoard}, nhập bằng KiCad CLI 10.0.7; đã căn trục và mặt board với STEP ${boardName}. Tên net giữ nguyên theo Allegro; tên chân và chức năng lấy từ sơ đồ pinout Raspberry Pi.`

  return {
    pins,
    evidence: {
      summary,
      sourceLabel: isPicoW ? 'Pinout hãng Pico W' : 'Pinout hãng Pico / Pico 2',
      sourceUrl: isPicoW ? picoWPinoutPdf : picoPinoutPdf,
    },
  }
}

export const raspberryPiPicoPinoutSource = {
  data: pinSource,
  productDocs,
  pinoutPdfs: { pico: picoPinoutPdf, picoW: picoWPinoutPdf },
}
