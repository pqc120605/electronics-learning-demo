import type { BoardFeature, BoardModelManifest, BoardPin } from '../components/board/boardSceneTypes'
import { getBoardAssetVersion } from './boardAssetVersions'
import bluePillPads from './stm32-blue-pill-f103.pads.json'
import nucleoPads from './stm32-nucleo-f401re.pads.json'

/**
 * STM32 boards rebuilt by scripts/build-stm32-education-boards.py from KiCad library footprints and
 * 3D models (2026-11-14). Not vendor CAD: board size, header pitch and pin order follow public
 * documentation, positions of secondary parts are approximate. No STM32 code simulator exists in
 * this project, so these boards are reference views only ("chưa chạy code").
 */
type PadFootprint = { footprint: string; value: string; side: string; x: number; y: number; rotation: number; pads: Array<{ number: string; x: number; y: number }> }
type PadData = Record<string, PadFootprint>
type PartInfo = { name: string; role: string }
type BoardSource = {
  id: string; asset: string; title: string; mcu: string; revision: string; pads: PadData
  parts: Record<string, PartInfo>
  headers: Array<{ ref: string; side: BoardPin['side']; labels: string[] }>
  sourceRefs: NonNullable<BoardModelManifest['audit']>['sourceRefs']
  pinSource: { summary: string; sourceLabel: string; sourceUrl: string }
}

const BOARD_TOP_MM = 1.6
const nucleoArduino: Record<string, string> = {
  D0: 'PA3 · USART2_RX', D1: 'PA2 · USART2_TX', D2: 'PA10', D3: 'PB3 · TIM2_CH2', D4: 'PB5', D5: 'PB4 · TIM3_CH1', D6: 'PB10 · TIM2_CH3', D7: 'PA8',
  D8: 'PA9', D9: 'PC7 · TIM3_CH2', D10: 'PB6 · SPI1_CS', D11: 'PA7 · SPI1_MOSI', D12: 'PA6 · SPI1_MISO', D13: 'PA5 · SPI1_SCK · LD2', D14: 'PB9 · I2C1_SDA', D15: 'PB8 · I2C1_SCL',
  A0: 'PA0 · ADC1_IN0', A1: 'PA1 · ADC1_IN1', A2: 'PA4 · ADC1_IN4', A3: 'PB0 · ADC1_IN8', A4: 'PC1 · ADC1_IN11', A5: 'PC0 · ADC1_IN10',
}

const sources: BoardSource[] = [
  {
    id: 'stm32-blue-pill-f103', asset: 'stm32-blue-pill-f103', title: 'STM32F103C8T6 Blue Pill', mcu: 'STM32F103C8T6', revision: 'Tái dựng giáo dục · bản Blue Pill phổ biến 53,34 × 22,86 mm', pads: bluePillPads as PadData,
    parts: {
      U1: { name: 'Vi điều khiển STM32F103C8T6 (LQFP-48)', role: 'Arm Cortex-M3 72 MHz; chạy firmware và điều khiển GPIO.' },
      J1: { name: 'Header 1×20 cạnh trên', role: 'Hàng chân GPIO/nguồn (chân cắm hướng xuống để cắm breadboard).' },
      J2: { name: 'Header 1×20 cạnh dưới', role: 'Hàng chân GPIO/nguồn (chân cắm hướng xuống để cắm breadboard).' },
      J3: { name: 'Cổng micro-USB', role: 'Cấp 5 V và USB device của STM32; không có chip USB–UART.' },
      J4: { name: 'Jumper BOOT0/BOOT1', role: 'Chọn chế độ khởi động; BOOT0 = 1 khi reset để nạp qua UART1.' },
      J5: { name: 'Header SWD 4 chân', role: '3.3 · SWDIO · SWCLK · GND để nạp và debug bằng ST-LINK.' },
      Y1: { name: 'Thạch anh 8 MHz', role: 'Xung HSE cho PLL lên 72 MHz.' },
      Y2: { name: 'Thạch anh 32,768 kHz', role: 'Xung LSE cho RTC.' },
      U2: { name: 'Ổn áp 3,3 V (LDO)', role: 'Hạ 5 V từ USB xuống 3,3 V.' },
      SW1: { name: 'Nút RESET', role: 'Kéo NRST xuống để khởi động lại.' },
      D1: { name: 'LED nguồn', role: 'Báo có 3,3 V.' },
      D2: { name: 'LED PC13', role: 'LED người dùng, sáng khi PC13 ở mức LOW.' },
    },
    headers: [
      { ref: 'J2', side: 'left', labels: ['PB12', 'PB13', 'PB14', 'PB15', 'PA8', 'PA9', 'PA10', 'PA11', 'PA12', 'PA15', 'PB3', 'PB4', 'PB5', 'PB6', 'PB7', 'PB8', 'PB9', '5V', 'GND', '3V3'] },
      { ref: 'J1', side: 'right', labels: ['GND', 'GND', '3V3', 'NRST', 'PB11', 'PB10', 'PB1', 'PB0', 'PA7', 'PA6', 'PA5', 'PA4', 'PA3', 'PA2', 'PA1', 'PA0', 'PC15', 'PC14', 'PC13', 'VBAT'] },
    ],
    sourceRefs: [
      { path: 'scripts/build-stm32-education-boards.py', role: 'Board assembly script (KiCad 10.0.7 pcbnew)' },
      { url: 'https://stm32-base.org/boards/STM32F103C8T6-Blue-Pill.html', role: 'Common Blue Pill dimensions and header pin order' },
      { url: 'https://gitlab.com/kicad/libraries/kicad-packages3D', license: 'CC BY-SA 4.0 with KiCad library exception', role: 'Package 3D models' },
    ],
    pinSource: { summary: 'Thứ tự chân theo sơ đồ Blue Pill phổ biến (USB ở đầu chân 1). Đây là họ board clone: luôn đối chiếu chữ in trên board thật.', sourceLabel: 'stm32-base.org · Blue Pill', sourceUrl: 'https://stm32-base.org/boards/STM32F103C8T6-Blue-Pill.html' },
  },
  {
    id: 'stm32-nucleo', asset: 'stm32-nucleo-f401re', title: 'STM32 NUCLEO-F401RE', mcu: 'STM32F401RET6', revision: 'Tái dựng giáo dục · Nucleo-64 70 × 82,5 mm (không dùng CAD của ST)', pads: nucleoPads as PadData,
    parts: {
      U1: { name: 'Vi điều khiển STM32F401RET6 (LQFP-64)', role: 'Arm Cortex-M4F 84 MHz; MCU mục tiêu chạy chương trình của người học.' },
      U2: { name: 'ST-LINK/V2-1 (STM32F103CBT6)', role: 'Mạch nạp/debug tích hợp và cổng COM ảo qua USB.' },
      CN1: { name: 'Cổng mini-USB (ST-LINK)', role: 'Cấp 5 V và kết nối ST-LINK với máy tính.' },
      CN2: { name: 'Jumper ST-LINK/Nucleo', role: 'Chọn ST-LINK nạp cho MCU trên board hay board ngoài.' },
      CN4: { name: 'Header SWD 6 chân', role: 'Dùng ST-LINK của board để nạp mạch ngoài.' },
      CN5: { name: 'Header Arduino D8–D15', role: 'Tương thích shield Arduino Uno.' },
      CN9: { name: 'Header Arduino D0–D7', role: 'Tương thích shield Arduino Uno.' },
      CN6: { name: 'Header nguồn kiểu Arduino', role: 'IOREF, RESET, 3V3, 5V, GND, VIN.' },
      CN8: { name: 'Header Arduino A0–A5', role: 'Đầu vào analog.' },
      CN7: { name: 'Header ST morpho CN7 (2×19)', role: 'Đưa ra phần lớn chân MCU; tên chân xem bảng CN7 trong UM1724.' },
      CN10: { name: 'Header ST morpho CN10 (2×19)', role: 'Đưa ra phần lớn chân MCU; tên chân xem bảng CN10 trong UM1724.' },
      B1: { name: 'Nút USER (xanh)', role: 'Nối PC13, mức LOW khi nhấn.' },
      B2: { name: 'Nút RESET (đen)', role: 'Kéo NRST của MCU mục tiêu.' },
      LD1: { name: 'LED COM', role: 'Trạng thái giao tiếp ST-LINK.' },
      LD2: { name: 'LED người dùng LD2', role: 'Nối D13 / PA5.' },
      LD3: { name: 'LED nguồn', role: 'Báo có nguồn 5 V.' },
      U5: { name: 'Ổn áp 3,3 V', role: 'Cấp 3,3 V cho MCU.' },
      X2: { name: 'Thạch anh 32,768 kHz', role: 'Xung LSE cho RTC; HSE mặc định lấy từ MCO của ST-LINK.' },
    },
    headers: [
      { ref: 'CN6', side: 'left', labels: ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND', 'GND', 'VIN'] },
      { ref: 'CN8', side: 'left', labels: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'] },
      { ref: 'CN5', side: 'right', labels: ['D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'GND', 'AREF', 'D14', 'D15'] },
      { ref: 'CN9', side: 'right', labels: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'] },
    ],
    sourceRefs: [
      { path: 'scripts/build-stm32-education-boards.py', role: 'Board assembly script (KiCad 10.0.7 pcbnew)' },
      { url: 'https://www.st.com/resource/en/user_manual/dm00105823-nucleo-f401re-user-manual-stmicroelectronics.pdf', role: 'UM1724: board size, connector numbering, Arduino pin mapping' },
      { path: 'assets/boards/arduino-reference/arduino-uno-r3-viewer.kicad_pcb', license: 'CC BY-SA 4.0 (Arduino)', role: 'Arduino Uno R3 connector geometry reused for CN5/CN6/CN8/CN9' },
      { url: 'https://gitlab.com/kicad/libraries/kicad-packages3D', license: 'CC BY-SA 4.0 with KiCad library exception', role: 'Package 3D models' },
    ],
    pinSource: { summary: 'Header Arduino theo bảng UM1724 (NUCLEO-F401RE). Chân morpho CN7/CN10 chỉ được đánh số, chưa gắn tên; vị trí header morpho là ước lượng.', sourceLabel: 'ST UM1724', sourceUrl: 'https://www.st.com/resource/en/user_manual/dm00105823-nucleo-f401re-user-manual-stmicroelectronics.pdf' },
  },
]

const kindOf = (label: string) => /GND/.test(label) ? 'ground' : /^(3V3|5V|VIN|IOREF|VBAT|AREF)$/.test(label) ? 'power' : /^(NRST|RESET)$/.test(label) ? 'reset' : label === 'NC' ? 'nc' : 'gpio'

function pinsFor(source: BoardSource): BoardPin[] {
  return source.headers.flatMap(({ ref, side, labels }) => {
    const pads = [...source.pads[ref].pads].sort((a, b) => Number(a.number) - Number(b.number))
    return pads.map((pad, index): BoardPin => {
      const label = labels[index]
      const stm = source.id === 'stm32-nucleo' ? nucleoArduino[label] : undefined
      const kind = kindOf(label)
      return {
        id: `${ref.toLowerCase()}-${pad.number}`, side, position: index + 1, label: stm ? `${label} · ${stm.split(' · ')[0]}` : label,
        headerReference: ref, padNumber: pad.number,
        anchor: [pad.x / 1000, BOARD_TOP_MM / 1000, pad.y / 1000],
        plainDescription: kind === 'ground' ? 'Chân đất chung.' : kind === 'power' ? `Chân nguồn ${label}.` : kind === 'reset' ? 'Chân reset (NRST), kéo xuống để khởi động lại.' : kind === 'nc' ? 'Không kết nối.' : `Chân ${label}${stm ? ` nối ${stm}` : ''}; mức logic 3,3 V.`,
        technicalRole: stm ?? label,
        connection: `${ref} chân ${pad.number}. Vị trí lấy từ footprint trong mô hình tái dựng, không phải CAD của hãng.`,
        safetyNote: 'I/O STM32 là 3,3 V; chỉ chân có ký hiệu FT trong datasheet mới chịu 5 V. Đối chiếu board thật trước khi đấu dây.',
        functions: stm ? stm.split(' · ') : [label],
      }
    })
  })
}

function makeManifest(source: BoardSource): BoardModelManifest {
  const assetVersion = getBoardAssetVersion(`/models/${source.asset}.glb`)
  const assetUrl = `/models/${source.asset}.glb?v=${assetVersion}`
  const features: BoardFeature[] = Object.entries(source.pads).filter(([ref]) => source.parts[ref]).map(([ref, fp]) => {
    const info = source.parts[ref]
    return {
      id: `component-${ref.toLowerCase()}`, designator: ref, name: `${info.name} (${ref})`,
      plainDescription: `${info.role} Thân 3D là package chuẩn của thư viện KiCad (${fp.footprint}).`,
      technicalRole: info.role,
      connection: `Footprint ${fp.footprint} đặt tại (${fp.x.toFixed(2)}, ${fp.y.toFixed(2)}) mm, xoay ${fp.rotation}°, mặt ${fp.side === 'back' ? 'dưới' : 'trên'} trong mô hình tái dựng.`,
      placementReason: 'Vị trí là ước lượng giáo dục theo ảnh/tài liệu công khai; không lấy từ CAD của hãng.',
      placementEvidence: 'principle', roleEvidence: 'unverified',
      safetyNote: `${source.title} trong viewer là tái dựng giáo dục; board thật có thể khác bố trí và linh kiện.`,
      relatedLessonPartIds: [],
    }
  })
  const hotspots = features.map((feature) => ({ id: `hotspot-${feature.id}`, featureId: feature.id, label: feature.name, nodeNames: [feature.designator ?? ''] }))
  const pins = pinsFor(source)
  return {
    id: source.id, assetUrl, assetVersion, features, hotspots, pins, signalFlows: [], pinPicking: true,
    pinoutEvidence: source.pinSource,
    audit: { status: 'educational-reconstruction', revision: source.revision, sourceRefs: source.sourceRefs, unverifiedReferences: [], auditNotes: ['Chưa chạy code: dự án chưa có trình giả lập STM32; board chỉ dùng để tra cứu cấu tạo và chân.', 'Package 3D lấy từ thư viện KiCad 10.0.7 (CC BY-SA 4.0), không phải model riêng của hãng.'] },
    scenes: [{ id: 'pcb', label: 'PCB · tái dựng giáo dục', assetUrl, assetVersion, hotspots, note: `${source.title}: tái dựng giáo dục từ footprint và model thư viện KiCad. Kích thước và thứ tự chân theo tài liệu công khai; vị trí linh kiện phụ là ước lượng. Chưa chạy code STM32.` }],
  }
}

export const stm32BoardModels: BoardModelManifest[] = sources.map(makeManifest)
