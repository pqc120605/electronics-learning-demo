import { PRODUCT_ROUTES as R } from './productRoutes'

export type ProductFeatureId = 'intro' | 'dashboard' | 'learning' | 'lesson' | 'boards' | 'components' | 'lab' | 'freestyle' | 'projects' | 'classroom' | 'calculators' | 'firmware' | 'spice' | 'sketch' | 'community'
export type ProductFeatureState = 'available' | 'limited' | 'reference' | 'planned'

export type ProductFeature = {
  id: ProductFeatureId
  title: string
  summary: string
  state: ProductFeatureState
  publicRoute: string
  appRoute: string
  publicLabel: string
  appLabel: string
  icon: string
}

/** Product map shared by the public site, app workspace, roadmap, and future app shell. */
export const productFeatureRegistry: Record<ProductFeatureId, ProductFeature> = {
  intro: {
    id: 'intro', title: 'Giới thiệu Mạch Mở', summary: 'Giới thiệu điện tử nhập môn, cách học và các khả năng hiện có.',
    state: 'available', publicRoute: R.publicHome, appRoute: R.publicHome, publicLabel: 'Giới thiệu', appLabel: 'Về website', icon: '⌂',
  },
  dashboard: {
    id: 'dashboard', title: 'Tổng quan workspace', summary: 'Điểm bắt đầu trong app, tiếp tục bài vừa học và mở công cụ.',
    state: 'available', publicRoute: R.appHome, appRoute: R.appHome, publicLabel: 'Không gian học', appLabel: 'Tổng quan', icon: '⌂',
  },
  learning: {
    id: 'learning', title: 'Bài học và chủ đề', summary: 'Lộ trình cho người mới, bài hướng dẫn và các bước thực hành.',
    state: 'limited', publicRoute: R.publicTopics, appRoute: R.appLearn, publicLabel: 'Chủ đề học', appLabel: 'Chủ đề học', icon: '◎',
  },
  lesson: {
    id: 'lesson', title: 'Bài LED nhập môn', summary: 'Bài hướng dẫn GPIO, LED và điện trở với trace theo năng lực hỗ trợ.',
    state: 'limited', publicRoute: R.publicLesson, appRoute: R.appLesson, publicLabel: 'Bài LED nhập môn', appLabel: 'Bài LED nhập môn', icon: '◉',
  },
  boards: {
    id: 'boards', title: 'Thư viện board', summary: 'Tra cứu profile, nguồn, revision, pin và model board đã có.',
    state: 'reference', publicRoute: R.publicBoards, appRoute: R.appBoards, publicLabel: 'Board', appLabel: 'Thư viện board', icon: '▦',
  },
  components: {
    id: 'components', title: 'Thư viện linh kiện', summary: 'Tìm linh kiện, vai trò, chân, hình minh họa và tài liệu tham khảo.',
    state: 'reference', publicRoute: R.publicComponents, appRoute: R.appComponents, publicLabel: 'Linh kiện', appLabel: 'Linh kiện', icon: 'Ω',
  },
  lab: {
    id: 'lab', title: 'Phòng lắp mạch', summary: 'Lắp circuit, xem schematic/3D, kiểm tra heuristic và chạy hành vi được hỗ trợ.',
    state: 'limited', publicRoute: R.publicLab, appRoute: R.appLab, publicLabel: 'Phòng lắp mạch theo bài', appLabel: 'Phòng lắp mạch theo bài', icon: '⌁',
  },
  freestyle: {
    id: 'freestyle', title: 'Bàn lắp mạch tự do', summary: 'Chọn board, thêm linh kiện, viết code Arduino/MicroPython và bấm Chạy để xem LED, Serial và luồng tín hiệu.',
    state: 'limited', publicRoute: R.publicFreestyle, appRoute: R.appFreestyle, publicLabel: 'Bàn lắp mạch tự do', appLabel: 'Bàn lắp mạch tự do', icon: '✚',
  },
  projects: {
    id: 'projects', title: 'Dự án thực hành', summary: 'Khám phá bài thực hành và các project mẫu hiện có.',
    state: 'limited', publicRoute: R.publicProjects, appRoute: R.appProjects, publicLabel: 'Dự án', appLabel: 'Dự án', icon: '⌘',
  },
  classroom: {
    id: 'classroom', title: 'Lớp học và bộ kit', summary: 'Lập kế hoạch bài thực hành, tính kit theo số trạm và trao đổi gói cấu hình cục bộ. Chưa có tài khoản lớp hoặc cộng đồng trực tuyến.',
    state: 'limited', publicRoute: R.appClassroomKit, appRoute: R.appClassroomKit, publicLabel: 'Lớp học & kit', appLabel: 'Lớp học & kit', icon: '▤',
  },
  calculators: {
    id: 'calculators', title: 'Bộ tính điện tử', summary: 'Công cụ tính LED, chia áp ADC, pull-up I²C và RC với giả định rõ ràng.',
    state: 'limited', publicRoute: R.publicCalculators, appRoute: R.appCalculators, publicLabel: 'Bộ tính điện tử', appLabel: 'Bộ tính điện tử', icon: '∑',
  },
  firmware: {
    id: 'firmware', title: 'Kiểm tra firmware HEX', summary: 'Đọc Intel HEX và chạy demo AVR giới hạn; không tự nạp board.',
    state: 'limited', publicRoute: R.publicFirmware, appRoute: R.appFirmware, publicLabel: 'Kiểm tra firmware HEX', appLabel: 'Kiểm tra HEX', icon: '⌗',
  },
  sketch: {
    id: 'sketch', title: 'Chạy code Arduino/ESP32', summary: 'Thông dịch sketch Arduino C++ con ngay trên web cho ESP32, Arduino và Pico; xem GPIO, Serial và logic analyzer. Không biên dịch firmware thật.',
    state: 'limited', publicRoute: R.publicSketch, appRoute: R.appSketch, publicLabel: 'Chạy code Arduino/ESP32', appLabel: 'Chạy code', icon: '▷',
  },
  spice: {
    id: 'spice', title: 'Mô phỏng điện SPICE', summary: 'Chạy netlist analog giới hạn bằng ngspice WASM; nhận subset analog từ workspace và XML netlist KiCad, không chạy firmware MCU hay chuyển trọn board.',
    state: 'limited', publicRoute: R.publicSpice, appRoute: R.appSpice, publicLabel: 'Mô phỏng SPICE', appLabel: 'Mô phỏng SPICE', icon: '∿',
  },
  community: {
    id: 'community', title: 'Cộng đồng thảo luận', summary: 'Hỏi đáp điện tử, nhúng và IoT theo nhóm chủ đề. Bản xem trước: bài mẫu + bài nháp lưu trên thiết bị, chưa đồng bộ máy chủ.',
    state: 'limited', publicRoute: R.publicCommunity, appRoute: R.appCommunity, publicLabel: 'Cộng đồng', appLabel: 'Cộng đồng', icon: '◇',
  },
}

export const publicFeatureOrder: readonly ProductFeatureId[] = ['learning', 'boards', 'components', 'lab', 'calculators', 'sketch', 'spice', 'firmware', 'projects', 'community']
/** 2026-11-15: cùng năm khu vực với điều hướng công khai: Học · Lắp mạch · Thư viện · Công cụ · Cộng đồng. */
export const appNavigationGroups: ReadonlyArray<{ id: string; label: string; features: readonly ProductFeatureId[] }> = [
  { id: 'learn', label: 'HỌC', features: ['dashboard', 'lesson', 'learning', 'projects', 'classroom'] },
  { id: 'build', label: 'LẮP MẠCH', features: ['freestyle', 'lab'] },
  { id: 'library', label: 'THƯ VIỆN', features: ['boards', 'components'] },
  { id: 'tools', label: 'CÔNG CỤ', features: ['calculators', 'spice', 'firmware', 'sketch'] },
  { id: 'community', label: 'CỘNG ĐỒNG', features: ['community'] },
]

export function getProductFeature(id: ProductFeatureId): ProductFeature {
  return productFeatureRegistry[id]
}
