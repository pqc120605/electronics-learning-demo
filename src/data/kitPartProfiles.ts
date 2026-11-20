type PinRole = 'passive' | 'power' | 'ground'
type KitPin = { id: string; physicalPin: number; name: string; role: PinRole }
type KitProfile = { title: string; model: string; revision: string; url: string; pins: KitPin[]; example: string }

const dhtPins: KitPin[] = [
  { id: 'vcc', physicalPin: 1, name: 'VCC', role: 'power' },
  { id: 'data', physicalPin: 2, name: 'DATA', role: 'passive' },
  // Pin 3 is NC in both cited 4-pin packages and is not a wiring endpoint.
  { id: 'gnd', physicalPin: 4, name: 'GND', role: 'ground' },
]

const segments: KitPin[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'].map((id, index) => ({
  id, physicalPin: [7, 6, 4, 2, 1, 9, 10, 5][index], name: id.toUpperCase(), role: 'passive',
}))
const common = (role: 'power' | 'ground'): KitPin[] => [3, 8].map((physicalPin, index) => ({
  id: `com${index + 1}`, physicalPin, name: `COM${index + 1}`, role,
}))

export const keypadKeys = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'] as const
export function keypadContact(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= keypadKeys.length) return null
  return { row: `r${Math.floor(index / 4) + 1}`, column: `c${index % 4 + 1}`, key: keypadKeys[index] }
}

export const kitPartProfiles = {
  dht11: { title: 'Cảm biến DHT11', model: 'ASAIR DHT11 rời, 4 chân', revision: '2022-12, mục 4',
    url: 'https://www.aosong.com/userfiles/files/media/DHT11%E6%B8%A9%E6%B9%BF%E5%BA%A6%E4%BC%A0%E6%84%9F%E5%99%A8%E8%AF%B4%E6%98%8E%E4%B9%A6%EF%BC%88%E4%B8%AD%EF%BC%89%20A0-1208.pdf', pins: dhtPins,
    example: 'Cấp nguồn VCC và GND, nối DATA với điện trở kéo lên về cùng mức logic. Chân 3 (NC) để hở. Thử thay đổi nhiệt độ và độ ẩm giả lập bên dưới.' },
  'dht22-bare': { title: 'Cảm biến DHT22 rời', model: 'ASAIR AM2302/DHT22 rời, 4 chân', revision: 'V1.0 · 2019-03, bảng 4',
    url: 'https://aosong.com/uploadfiles/2025/04/20250417105409216.pdf', pins: dhtPins,
    example: 'Cấp nguồn VDD/GND, kéo DATA lên mức logic phù hợp. Chân 3 (NC) để hở. Điều chỉnh giá trị nhiệt độ và độ ẩm giả lập để xem đầu ra.' },
  'keypad-4x4': { title: 'Bàn phím ma trận 4 × 4', model: 'Adafruit PID 3844', revision: 'Pinouts · 2024-03-08',
    url: 'https://learn.adafruit.com/matrix-keypad/pinouts',
    pins: Array.from({ length: 8 }, (_, index) => ({ id: `${index < 4 ? 'c' : 'r'}${index % 4 + 1}`, physicalPin: index + 1, name: `${index < 4 ? 'C' : 'R'}${index % 4 + 1}`, role: 'passive' as const })),
    example: 'Chọn phím 5 để đóng R2–C2. Giữ hàng R2 ở LOW và đọc C2 có kéo lên. Đổi phím để quan sát cặp tiếp điểm thay đổi; hai chân NC ngoài cùng để hở.' },
  'seven-segment': { title: 'LED 7 đoạn · cathode chung', model: 'Kingbright SC56-11EWA', revision: 'DSAP6671 · V.1A',
    url: 'https://www.kingbrightusa.com/images/catalog/SPEC/SC56-11EWA.pdf', pins: [...segments, ...common('ground')],
    example: 'Nối COM xuống GND. Đưa A lên HIGH qua điện trở riêng để sáng thanh trên. Kết hợp các đoạn để tạo chữ số.' },
  'seven-segment-anode': { title: 'LED 7 đoạn · anode chung', model: 'Kingbright SA56-11EWA', revision: 'DSAP8372 · V.1A',
    url: 'https://www.kingbrightusa.com/images/catalog/SPEC/SA56-11EWA.pdf', pins: [...segments, ...common('power')],
    example: 'Nối COM với nguồn. Kéo A xuống LOW qua điện trở riêng để sáng thanh trên. Dùng một điện trở cho mỗi đoạn.' },
} satisfies Record<string, KitProfile>

export const getKitPartProfile = (type: string): KitProfile | undefined => Object.hasOwn(kitPartProfiles, type)
  ? kitPartProfiles[type as keyof typeof kitPartProfiles] : undefined

export const isDhtPart = (type: string) => type === 'dht11' || type === 'dht22-bare'
