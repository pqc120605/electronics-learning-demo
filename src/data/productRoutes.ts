import { builderLessons } from './builderLessons'

/** Canonical URLs for the public website and guest-first Mạch Mở workspace. */
export const PRODUCT_ROUTES = {
  publicHome: '/',
  appHome: '/app',
  appLearn: '/app/learn',
  appLesson: '/app/learn/esp32-led',
  appBoards: '/app/boards',
  appComponents: '/app/components',
  appLab: '/app/lab',
  appProjects: '/app/projects',
  appClassroomKit: '/app/classroom-kits',
  appCalculators: '/app/tools/calculators',
  appFirmware: '/app/tools/firmware',
  appSpice: '/app/tools/spice',
  publicBoards: '/boards',
  publicComponents: '/components',
  publicLab: '/build',
  publicTopics: '/topics',
  publicProjects: '/projects',
  publicLesson: '/learn/esp32-led',
  publicCalculators: '/tools/electronics-calculators',
  publicFirmware: '/tools/firmware-hex',
  publicSpice: '/tools/spice',
  privacy: '/privacy',
} as const

/** Legacy URLs remain valid and resolve to their app-workspace destination. */
export const PUBLIC_TO_APP_ROUTE: Readonly<Record<string, string>> = {
  [PRODUCT_ROUTES.publicBoards]: PRODUCT_ROUTES.appBoards,
  [PRODUCT_ROUTES.publicComponents]: PRODUCT_ROUTES.appComponents,
  [PRODUCT_ROUTES.publicLab]: PRODUCT_ROUTES.appLab,
  [PRODUCT_ROUTES.publicTopics]: PRODUCT_ROUTES.appLearn,
  [PRODUCT_ROUTES.publicProjects]: PRODUCT_ROUTES.appProjects,
  [PRODUCT_ROUTES.publicLesson]: PRODUCT_ROUTES.appLesson,
  [PRODUCT_ROUTES.publicCalculators]: PRODUCT_ROUTES.appCalculators,
  [PRODUCT_ROUTES.publicFirmware]: PRODUCT_ROUTES.appFirmware,
  [PRODUCT_ROUTES.publicSpice]: PRODUCT_ROUTES.appSpice,
}

const PAGE_TITLES: Readonly<Record<string, string>> = {
  [PRODUCT_ROUTES.publicHome]: 'Mạch Mở — Học Điện tử qua thực hành',
  [PRODUCT_ROUTES.appHome]: 'Không gian học — Mạch Mở',
  [PRODUCT_ROUTES.publicLesson]: 'Làm đèn LED với ESP32 — Mạch Mở',
  [PRODUCT_ROUTES.publicBoards]: 'Thư viện board — Mạch Mở',
  [PRODUCT_ROUTES.publicComponents]: 'Thư viện linh kiện — Mạch Mở',
  [PRODUCT_ROUTES.publicLab]: 'Lắp mạch & mô phỏng — Mạch Mở',
  [PRODUCT_ROUTES.publicFirmware]: 'Kiểm tra firmware HEX — Mạch Mở',
  [PRODUCT_ROUTES.publicCalculators]: 'Công cụ tính điện tử — Mạch Mở',
  [PRODUCT_ROUTES.publicSpice]: 'Mô phỏng SPICE — Mạch Mở',
  [PRODUCT_ROUTES.privacy]: 'Quyền riêng tư — Mạch Mở',
  [PRODUCT_ROUTES.publicTopics]: 'Chủ đề học — Mạch Mở',
  [PRODUCT_ROUTES.publicProjects]: 'Dự án thực hành — Mạch Mở',
  [PRODUCT_ROUTES.appClassroomKit]: 'Lớp học & bộ kit — Mạch Mở',
}

const APP_TO_PUBLIC_ROUTE = Object.fromEntries(Object.entries(PUBLIC_TO_APP_ROUTE).map(([publicRoute, appRoute]) => [appRoute, publicRoute]))

/** One readable tab title per page, shared by the public and app URLs. */
export function getPageTitle(pathname: string): string {
  const title = PAGE_TITLES[APP_TO_PUBLIC_ROUTE[pathname] ?? pathname]
  if (title) return title
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
    : pathname.startsWith('/learn/')
      ? `/app${pathname}`
      : PUBLIC_TO_APP_ROUTE[pathname]
  return destination ? `${destination}${search}` : path
}
