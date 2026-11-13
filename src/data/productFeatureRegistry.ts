import { PRODUCT_ROUTES as R } from './productRoutes'

export type ProductFeatureId = 'intro' | 'dashboard' | 'learning' | 'lesson' | 'boards' | 'components' | 'lab' | 'projects' | 'classroom' | 'calculators' | 'firmware' | 'spice'
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
    state: 'limited', publicRoute: R.publicLab, appRoute: R.appLab, publicLabel: 'Phòng thử', appLabel: 'Phòng lắp mạch', icon: '⌁',
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
  spice: {
    id: 'spice', title: 'Mô phỏng điện SPICE', summary: 'Chạy netlist analog giới hạn bằng ngspice WASM; nhận subset analog từ workspace và XML netlist KiCad, không chạy firmware MCU hay chuyển trọn board.',
    state: 'limited', publicRoute: R.publicSpice, appRoute: R.appSpice, publicLabel: 'Mô phỏng SPICE', appLabel: 'Mô phỏng SPICE', icon: '∿',
  },
}

export const publicFeatureOrder: readonly ProductFeatureId[] = ['learning', 'boards', 'components', 'lab', 'calculators', 'spice', 'firmware', 'projects']
export const appNavigationGroups: ReadonlyArray<{ id: string; label: string; features: readonly ProductFeatureId[] }> = [
  { id: 'learn', label: 'KHÔNG GIAN HỌC', features: ['dashboard', 'learning', 'lesson'] },
  { id: 'practice', label: 'TRA CỨU & THỰC HÀNH', features: ['boards', 'components', 'lab', 'projects', 'classroom'] },
  { id: 'tools', label: 'CÔNG CỤ', features: ['calculators', 'spice', 'firmware'] },
]

export function getProductFeature(id: ProductFeatureId): ProductFeature {
  return productFeatureRegistry[id]
}
