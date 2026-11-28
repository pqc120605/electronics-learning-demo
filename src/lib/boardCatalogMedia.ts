import { boards, type BoardSummary } from '../data/boards'
import { getBoardTopView } from './boardTopView'

const boardDirectory = '/board-reference/catalog/'
const manufacturerBoards = new Set([
  'esp32-c3-devkitm-1', 'esp32-devkitm-1', 'esp32-s2-devkitc-1',
  'esp32-c6-devkitc-1', 'esp32-h2-devkitm-1', 'esp32-s3-devkitc-1',
])
const espDiagramDetails: Record<string, { label: string; note: string }> = {
  'esp32-c3-devkitm-1': { label: 'Pinout Espressif', note: 'ESP32-C3-DevKitM-1 v1' },
  'esp32-devkitm-1': { label: 'Pinout Espressif', note: 'ESP32-DevKitM-1 v1 · ESP32-MINI-1' },
  'esp32-s2-devkitc-1': { label: 'Pinout Espressif', note: 'ESP32-S2-DevKitC-1 v1' },
  'esp32-c6-devkitc-1': { label: 'Pinout Espressif', note: 'ESP32-C6-DevKitC-1 v1.2' },
  'esp32-h2-devkitm-1': { label: 'Pinout Espressif', note: 'ESP32-H2-DevKitM-1 v1.2' },
  'esp32-s3-devkitc-1': { label: 'Pinout Espressif', note: 'ESP32-S3-DevKitC-1 v1.1' },
}
const otherBoardImages: Record<string, BoardCatalogImage> = {
  'arduino-nano-every': { src: boardDirectory + 'arduino-nano-every-photo.webp', label: 'Hình board từ pinout Arduino', note: 'Nano Every · ABX00028', creditUrl: boardDirectory + 'NOTICE.md' },
  'arduino-nano-esp32': { src: boardDirectory + 'arduino-nano-esp32-photo.webp', label: 'Hình board từ pinout Arduino', note: 'Nano ESP32 · ABX00083', creditUrl: boardDirectory + 'NOTICE.md' },
  'stm32-nucleo-f411re': { src: boardDirectory + 'stm32-nucleo-f411re-photo.webp', label: 'Ảnh NUCLEO-F411RE tại Embedded World 2016', note: 'Ảnh nhận diện STM32F411RET6', creditUrl: boardDirectory + 'NOTICE.md' },
  'stm32-nucleo-f446re': { src: boardDirectory + 'stm32-nucleo-f446re-photo.webp', label: 'Ảnh NUCLEO-F446RE trong thử nghiệm CAN', note: 'STM32 NUCLEO-F446RE · ảnh board đang nối dây thử nghiệm', creditUrl: boardDirectory + 'NOTICE.md' },
  'stm32-nucleo-l476rg': { src: boardDirectory + 'stm32-nucleo-l476rg-photo.webp', label: 'Ảnh NUCLEO-L476RG có chú thích', note: 'STM32L476RG và phần ST-LINK', creditUrl: boardDirectory + 'NOTICE.md' },
  'adafruit-feather-esp32-s3-tft-5483': { src: boardDirectory + 'adafruit-feather-esp32-s3-tft-5483-photo.webp', label: 'Hình board từ pinout Adafruit', note: 'ESP32-S3 TFT Feather #5483 · phiên bản MAX17048', creditUrl: boardDirectory + 'NOTICE.md' },
  'adafruit-feather-esp32-s3-5323': { src: boardDirectory + 'adafruit-feather-esp32-s3-5323-photo.webp', label: 'Ảnh mặt trên từ Adafruit', note: 'Feather ESP32-S3 #5323 · 8 MB flash, phiên bản MAX17048', creditUrl: boardDirectory + 'NOTICE.md' },
  'adafruit-qtpy-esp32-c3-5405': { src: boardDirectory + 'adafruit-qtpy-esp32-c3-5405-photo.webp', label: 'Hình lắp mạch từ thư viện Fritzing của Adafruit', note: 'QT Py ESP32-C3 · #5405', creditUrl: boardDirectory + 'NOTICE.md' },
  'raspberry-pi-pico-2-h': { src: boardDirectory + 'raspberry-pi-pico-2-h-photo.webp', label: 'Ảnh mặt trên từ Raspberry Pi', note: 'Pico 2 with headers · SC1632', creditUrl: boardDirectory + 'NOTICE.md' },
}
const otherBoardDiagrams: Partial<Record<string, { label: string; note: string; sourceUrl: string; sourceLabel?: string }>> = {
  'arduino-nano-every': { label: 'Pinout Arduino', note: 'Nano Every · ABX00028', sourceUrl: 'https://docs.arduino.cc/resources/pinouts/ABX00028-full-pinout.pdf' },
  'arduino-nano-esp32': { label: 'Pinout Arduino', note: 'Nano ESP32 · ABX00083 · mặt trên, trang 1/4', sourceUrl: 'https://docs.arduino.cc/resources/pinouts/ABX00083-full-pinout.pdf' },
  'adafruit-feather-esp32-s3-tft-5483': { label: 'Pinout Adafruit', note: 'ESP32-S3 TFT Feather #5483 · phiên bản MAX17048', sourceUrl: 'https://learn.adafruit.com/adafruit-esp32-s3-tft-feather/pinouts' },
  'stm32-nucleo-l476rg': { label: 'Sơ đồ khối NUCLEO-L476RG', note: 'Hình nhận diện và các khối chính. Tra sơ đồ theo số chân trong tài liệu ST.', sourceUrl: 'https://doi.org/10.3390/en17020387', sourceLabel: 'Bài báo nguồn' },
}
const directPinoutSources: Record<string, string> = {
  'arduino-uno-r4-minima': 'https://docs.arduino.cc/resources/pinouts/ABX00080-full-pinout.pdf',
  'arduino-uno-r4-wifi': 'https://docs.arduino.cc/resources/pinouts/ABX00087-full-pinout.pdf',
  'adafruit-qtpy-esp32-c3-5405': 'https://learn.adafruit.com/adafruit-qt-py-esp32-c3-wifi-dev-board/pinouts',
  'adafruit-feather-esp32-s3-5323': 'https://learn.adafruit.com/adafruit-esp32-s3-feather/pinouts',
  'stm32-nucleo-f411re': 'https://www.st.com/resource/en/user_manual/dm00105823.pdf',
  'stm32-nucleo-f446re': 'https://www.st.com/resource/en/user_manual/dm00105823.pdf',
  'stm32-nucleo-l476rg': 'https://www.st.com/resource/en/user_manual/dm00105823.pdf',
}

export function getBoardPinoutSource(board: BoardSummary) {
  return directPinoutSources[board.id]
}

const boardIdsByComponentId: Record<string, string> = {
  'arduino-uno': 'arduino-uno-r3',
  'arduino-nano': 'arduino-nano-classic',
  'arduino-mega': 'arduino-mega-2560-r3',
  'stm32-f401': 'stm32-nucleo',
  'stm32-blue-pill': 'stm32-blue-pill-f103',
  'rp2040-pico': 'raspberry-pi-pico',
  'rp2350-pico-2-h': 'raspberry-pi-pico-2-h',
  'esp32-s3': 'esp32-s3-devkitc-1',
}
const boardsById = new Map(boards.map(board => [board.id, board]))

export function getBoardForComponent(id: string) {
  return boardsById.get(boardIdsByComponentId[id] ?? id)
}

export type BoardCatalogImage = { src: string; label: string; note?: string; creditUrl?: string; width?: number; height?: number }

export function getBoardCatalogImage(board: BoardSummary): BoardCatalogImage | undefined {
  if (otherBoardImages[board.id]) return otherBoardImages[board.id]
  if (manufacturerBoards.has(board.id)) {
    return { src: boardDirectory + board.id + '-photo.webp', label: 'Ảnh hãng Espressif', note: espDiagramDetails[board.id].note, creditUrl: boardDirectory + 'NOTICE.md' }
  }
  const top = getBoardTopView(board.id)
  if (board.id === 'esp32-devkit' && top) {
    return { src: top.image, label: 'Mặt board 2D từ PCB tham chiếu', note: top.revision, width: top.width, height: top.height, creditUrl: '/board-reference/topview/NOTICE.md' }
  }
  const photo = board.photos?.[0]
  if (photo) return { src: photo.src, label: photo.label, note: photo.variantNote, creditUrl: photo.sourceUrl }
}

export function getBoardReferenceDiagram(board: BoardSummary): (BoardCatalogImage & { sourceUrl?: string; sourceLabel?: string }) | undefined {
  const official = otherBoardDiagrams[board.id]
  const details = official ?? espDiagramDetails[board.id]
  if (details) return {
    label: details.label, note: details.note, src: boardDirectory + board.id + '-diagram.webp',
    creditUrl: boardDirectory + 'NOTICE.md', sourceUrl: official?.sourceUrl ?? board.sourceEvidenceUrl,
    sourceLabel: official?.sourceLabel,
  }
}
