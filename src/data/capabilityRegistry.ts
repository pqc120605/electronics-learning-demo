export type CapabilityId =
  | 'behavior-simulation'
  | 'concept-illustration'
  | 'electrical-simulation'
  | 'firmware-execution'
  | 'cad-reference'
  | 'model-not-available'
  | 'present-in-sample'
  | 'visual-reference'
  | 'catalog-only'

export type CapabilityDefinition = {
  label: string
  description: string
  state: 'available' | 'limited' | 'planned' | 'reference'
}

/** Shared wording for capability claims across lesson, board, component and project views. */
export const capabilityRegistry: Record<CapabilityId, CapabilityDefinition> = {
  'behavior-simulation': {
    label: 'Mô phỏng hành vi cơ bản',
    description: 'Chỉ chạy cú pháp được parser hỗ trợ trong bài này; đây không phải firmware thật hoặc phép tính điện.',
    state: 'limited',
  },
  'concept-illustration': {
    label: 'Minh họa khái niệm',
    description: 'Hiển thị kịch bản giải thích định trước; code mẫu không được thực thi và kết quả không phải số đo điện.',
    state: 'limited',
  },
  'electrical-simulation': {
    label: 'Mô phỏng điện',
    description: 'Có SPICE analog với netlist và mạch subset đã hỗ trợ; không chạy firmware MCU hoặc tự mô phỏng mọi board/linh kiện.',
    state: 'limited',
  },
  'firmware-execution': {
    label: 'Firmware emulator · target cụ thể',
    description: 'Không có firmware runtime tổng quát trong workspace. Công cụ HEX riêng có thể chạy firmware AVR8js cho target ATmega328P sau khi xác nhận target; không áp dụng cho mọi bài hoặc mọi MCU.',
    state: 'limited',
  },
  'cad-reference': {
    label: 'Mô hình CAD tham chiếu',
    description: 'Hình học theo nguồn/revision được ghi kèm; không tự xác nhận mọi clone, BOM hoặc chức năng điện.',
    state: 'reference',
  },
  'model-not-available': {
    label: 'Chưa có model tương tác',
    description: 'Có thể có thông tin hoặc tài liệu board, nhưng chưa phát hành viewer tương tác cho hồ sơ này.',
    state: 'planned',
  },
  'present-in-sample': {
    label: 'Có trong một số bài mẫu',
    description: 'Linh kiện có thể xuất hiện trong topology/luồng của bài được chỉ định; không có nghĩa đặc tuyến điện được tính.',
    state: 'limited',
  },
  'visual-reference': {
    label: 'Chỉ hiển thị / tra cứu',
    description: 'Dùng để nhận diện và học vai trò; chưa có hành vi mô phỏng cho linh kiện này.',
    state: 'reference',
  },
  'catalog-only': {
    label: 'Chỉ tra cứu',
    description: 'Có mô tả tham khảo nhưng chưa có component tương ứng trong workspace lắp mạch.',
    state: 'reference',
  },
}

export function getCapability(id: CapabilityId): CapabilityDefinition {
  return capabilityRegistry[id]
}
