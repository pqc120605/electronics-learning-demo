import { builderLessons } from './builderLessons'

/** Canonical URLs for the public website and guest-first Mạch Mở workspace. */
export const PRODUCT_ROUTES = {
  publicHome: '/',
  appHome: '/app',
  appLearn: '/app/learn',
  appBasics: '/app/learn/basics',
  publicBasics: '/learn/basics',
  appLesson: '/app/learn/esp32-led',
  appBoards: '/app/boards',
  appComponents: '/app/components',
  appLab: '/app/lab',
  appProjects: '/app/projects',
  appClassroomKit: '/app/classroom-kits',
  appCalculators: '/app/tools/calculators',
  appFirmware: '/app/tools/firmware',
  appSpice: '/app/tools/spice',
  appSketch: '/app/tools/sketch',
  publicBoards: '/boards',
  publicComponents: '/components',
  publicLab: '/build',
  publicFreestyle: '/build/freestyle',
  appFreestyle: '/app/lab/freestyle',
  publicTopics: '/topics',
  publicProjects: '/projects',
  publicLesson: '/learn/esp32-led',
  publicCalculators: '/tools/electronics-calculators',
  publicFirmware: '/tools/firmware-hex',
  publicSpice: '/tools/spice',
  publicSketch: '/tools/sketch',
  privacy: '/privacy',
  publicFeedback: '/feedback',
  appFeedback: '/app/feedback',
  appCommunity: '/app/community',
  publicCommunity: '/community',
  appLogin: '/app/login',
  publicLogin: '/login',
  authCallback: '/auth/callback',
} as const

/** Legacy URLs remain valid and resolve to their app-workspace destination. */
export const PUBLIC_TO_APP_ROUTE: Readonly<Record<string, string>> = {
  [PRODUCT_ROUTES.publicBasics]: PRODUCT_ROUTES.appBasics,
  [PRODUCT_ROUTES.publicFeedback]: PRODUCT_ROUTES.appFeedback,
  [PRODUCT_ROUTES.publicBoards]: PRODUCT_ROUTES.appBoards,
  [PRODUCT_ROUTES.publicComponents]: PRODUCT_ROUTES.appComponents,
  [PRODUCT_ROUTES.publicLab]: PRODUCT_ROUTES.appLab,
  [PRODUCT_ROUTES.publicFreestyle]: PRODUCT_ROUTES.appFreestyle,
  [PRODUCT_ROUTES.publicTopics]: PRODUCT_ROUTES.appLearn,
  [PRODUCT_ROUTES.publicProjects]: PRODUCT_ROUTES.appProjects,
  [PRODUCT_ROUTES.publicLesson]: PRODUCT_ROUTES.appLesson,
  [PRODUCT_ROUTES.publicCalculators]: PRODUCT_ROUTES.appCalculators,
  [PRODUCT_ROUTES.publicFirmware]: PRODUCT_ROUTES.appFirmware,
  [PRODUCT_ROUTES.publicSpice]: PRODUCT_ROUTES.appSpice,
  [PRODUCT_ROUTES.publicSketch]: PRODUCT_ROUTES.appSketch,
  [PRODUCT_ROUTES.publicCommunity]: PRODUCT_ROUTES.appCommunity,
  [PRODUCT_ROUTES.publicLogin]: PRODUCT_ROUTES.appLogin,
}

const PAGE_TITLES: Readonly<Record<string, string>> = {
  [PRODUCT_ROUTES.publicBasics]: 'Nền tảng điện tử — Mạch Mở',
  [PRODUCT_ROUTES.publicHome]: 'Mạch Mở — Học Điện tử qua thực hành',
  [PRODUCT_ROUTES.appHome]: 'Không gian học — Mạch Mở',
  [PRODUCT_ROUTES.publicLesson]: 'Làm đèn LED với ESP32 — Mạch Mở',
  [PRODUCT_ROUTES.publicBoards]: 'Thư viện board — Mạch Mở',
  [PRODUCT_ROUTES.publicComponents]: 'Thư viện linh kiện — Mạch Mở',
  [PRODUCT_ROUTES.publicLab]: 'Lắp mạch & mô phỏng — Mạch Mở',
  [PRODUCT_ROUTES.publicFreestyle]: 'Bàn lắp mạch tự do — Mạch Mở',
  [PRODUCT_ROUTES.publicFirmware]: 'Kiểm tra firmware HEX — Mạch Mở',
  [PRODUCT_ROUTES.publicCalculators]: 'Công cụ tính điện tử — Mạch Mở',
  [PRODUCT_ROUTES.publicSpice]: 'Mô phỏng SPICE — Mạch Mở',
  [PRODUCT_ROUTES.publicSketch]: 'Chạy code Arduino/ESP32 — Mạch Mở',
  [PRODUCT_ROUTES.privacy]: 'Quyền riêng tư — Mạch Mở',
  [PRODUCT_ROUTES.publicFeedback]: 'Góp ý & báo lỗi — Mạch Mở',
  [PRODUCT_ROUTES.publicTopics]: 'Chủ đề học — Mạch Mở',
  [PRODUCT_ROUTES.publicProjects]: 'Dự án thực hành — Mạch Mở',
  [PRODUCT_ROUTES.appClassroomKit]: 'Lớp học & bộ kit — Mạch Mở',
  '/app/robot-simulation': 'Khám phá robot · mô phỏng khái niệm — Mạch Mở',
  [PRODUCT_ROUTES.publicCommunity]: 'Cộng đồng — Mạch Mở',
  [PRODUCT_ROUTES.publicLogin]: 'Đăng nhập — Mạch Mở',
  [PRODUCT_ROUTES.authCallback]: 'Hoàn tất đăng nhập — Mạch Mở',
}

const APP_TO_PUBLIC_ROUTE = Object.fromEntries(Object.entries(PUBLIC_TO_APP_ROUTE).map(([publicRoute, appRoute]) => [appRoute, publicRoute]))

/** One readable tab title per page, shared by the public and app URLs. */
export function getPageTitle(pathname: string): string {
  const title = PAGE_TITLES[APP_TO_PUBLIC_ROUTE[pathname] ?? pathname]
  if (title) return title
  if (/^(?:\/app)?\/community\/new$/.test(pathname)) return 'Viết bài mới — Cộng đồng Mạch Mở'
  // Trang chi tiết tự đặt tiêu đề theo tên bài sau khi tải.
  if (/^(?:\/app)?\/community\/[^/]+$/.test(pathname)) return 'Thảo luận — Cộng đồng Mạch Mở'
  const lessonRoute = /^(?:\/app)?\/learn\/([^/]+)$/.exec(pathname)
  const isKnownLesson = lessonRoute && builderLessons.some((lesson) => lesson.id === lessonRoute[1])
  return isKnownLesson ? 'Chuẩn bị bài học — Mạch Mở' : 'Không tìm thấy trang — Mạch Mở'
}

/** Converts old/public feature paths into the equivalent app path. */
export function toAppRoute(path: string): string {
  const queryAt = path.indexOf('?')
  const pathname = queryAt < 0 ? path : path.slice(0, queryAt)
  const search = queryAt < 0 ? '' : path.slice(queryAt)
  const destination = pathname === PRODUCT_ROUTES.publicLab
    ? PRODUCT_ROUTES.appLab
    : pathname === PRODUCT_ROUTES.publicFreestyle
      ? PRODUCT_ROUTES.appFreestyle
    : pathname.startsWith('/learn/')
      ? `/app${pathname}`
      : PUBLIC_TO_APP_ROUTE[pathname]
  return destination ? `${destination}${search}` : path
}
