/**
 * Tour hướng dẫn lần đầu (2026-11-15).
 * Mỗi bước trỏ tới một vùng giao diện bằng danh sách selector: lấy phần tử đầu tiên đang hiển thị;
 * không có phần tử nào thì hộp thoại hiện giữa màn hình.
 */
export type TourId = 'home' | 'freestyle' | 'lab' | 'lesson' | 'app-home' | 'library' | 'tools'

export type TourStep = {
  target: readonly string[]
  title: string
  body: string
}

export type TourDefinition = {
  id: TourId
  label: string
  invite: string
  publicPath: string
  appPath: string
  steps: readonly TourStep[]
}

const helpStep: TourStep = {
  target: ['.help-menu-button'],
  title: 'Xem lại bất cứ lúc nào',
  body: 'Nút Trợ giúp mở lại hướng dẫn của trang đang xem hoặc của các khu vực khác.',
}

const freestyleSteps: readonly TourStep[] = [
  { target: ['.freestyle-steps'], title: 'Ba bước trên bàn lắp mạch', body: '1 · Chọn board. 2 · Thêm linh kiện. 3 · Viết code rồi bấm Chạy. Có thể quay lại bước nào cũng được.' },
  { target: ['.freestyle-head-actions .freestyle-sample', '.freestyle-head-actions'], title: 'Chưa biết lắp gì? Dùng mạch mẫu', body: 'Chọn một mạch mẫu và bấm “Dựng mạch mẫu”: linh kiện, dây và code được dựng sẵn để bạn chạy thử ngay.' },
  { target: ['.freestyle-stage'], title: 'Breadboard', body: 'Kéo linh kiện thả vào lỗ cắm. Nối dây: bấm một chân hoặc lỗ, rồi bấm điểm đích.' },
  { target: ['.freestyle-run-button'], title: 'Bấm Chạy', body: 'Code chạy trên board mô phỏng: LED sáng, dây tín hiệu đổi màu và Serial Monitor hiện dữ liệu.' },
  { target: ['.freestyle-observe'], title: 'Quan sát kết quả', body: 'Cột này cho thấy đầu vào, trạng thái từng linh kiện, Serial và luồng tín hiệu. Đây là mô phỏng logic, không phải đo trên mạch thật.' },
]

export const TOURS: Readonly<Record<TourId, TourDefinition>> = {
  'app-home': {
    id: 'app-home', label: 'Không gian học', publicPath: '/app', appPath: '/app',
    invite: 'Tìm bài học phù hợp, tiếp tục tiến độ trên thiết bị và mở công cụ khi cần.',
    steps: [
      { target: ['.workspace-sidebar', '.workspace-mobile-nav'], title: 'Năm khu vực của bạn', body: 'Học, Lắp mạch, Thư viện, Công cụ và Cộng đồng. Trên điện thoại, dùng thanh ở đáy màn hình.' },
      { target: ['.app-home-actions .button-primary'], title: 'Bắt đầu hoặc tiếp tục học', body: 'Nút này gợi ý bài tiếp theo theo tiến độ lưu trên trình duyệt này. Bạn vẫn có thể chọn bài khác trong lộ trình.' },
      { target: ['.app-home-path'], title: 'Lộ trình và tiến độ', body: 'Xem các bài đã mở và bài bạn tự đánh dấu hoàn thành. Tiến độ trên web không thay kết quả kiểm chứng phần cứng.' },
      helpStep,
    ],
  },
  library: {
    id: 'library', label: 'Thư viện board và linh kiện', publicPath: '/boards', appPath: '/app/boards',
    invite: 'Tìm board hoặc linh kiện, xem chân kết nối và chuyển sang lắp thử.',
    steps: [
      { target: ['.catalog-page-heading'], title: 'Tra cứu trước khi lắp', body: 'Mỗi hồ sơ nêu phiên bản, nguồn tài liệu và giới hạn mô phỏng. Board tham chiếu 3D có thể chưa hỗ trợ chạy code.' },
      { target: ['.catalog-filters', '.component-filters', '.board-list', '.component-grid'], title: 'Tìm phần bạn cần', body: 'Lọc theo tên hoặc nhóm. Chọn một mục để xem cấu tạo, chân kết nối và tài liệu.' },
      { target: ['.board-freestyle-link', '.component-freestyle-link'], title: 'Lắp thử trên bàn tự do', body: 'Liên kết này mang board hoặc linh kiện được hỗ trợ sang bàn lắp mạch. Nếu chưa có trong bàn, bạn vẫn xem được hồ sơ ở đây.' },
      helpStep,
    ],
  },
  tools: {
    id: 'tools', label: 'Chạy code mô phỏng', publicPath: '/tools/sketch', appPath: '/app/tools/sketch',
    invite: 'Chọn board, sửa code mẫu và xem GPIO trong trình mô phỏng.',
    steps: [
      { target: ['.sketch-runner-page', '.sketch-page'], title: 'Chọn đúng board và mô hình', body: 'Đọc phạm vi hỗ trợ trước khi chạy. Kết quả trình mô phỏng không xác nhận điện áp hay hoạt động trên kit thật.' },
      { target: ['.sketch-editor', '.sketch-code', 'textarea'], title: 'Sửa chương trình', body: 'Thử code mẫu trước, rồi thay từng đoạn nhỏ. Giữ thông báo lỗi để biết dòng cần sửa.' },
      helpStep,
    ],
  },
  home: {
    id: 'home', label: 'Trang chủ Mạch Mở', publicPath: '/', appPath: '/',
    invite: 'Xem nhanh cách dùng Mạch Mở: đi đâu để học, lắp mạch và chạy code.',
    steps: [
      { target: ['.site-header .main-nav', '.site-nav-mobile-toggle'], title: 'Năm khu vực chính', body: 'Học · Lắp mạch · Thư viện · Công cụ · Cộng đồng. Mỗi mục mở ra các trang con liên quan.' },
      { target: ['.hero-actions .button-primary'], title: 'Người mới: bắt đầu ở đây', body: 'Bài đầu tiên cho bạn dự đoán rồi kiểm tra khi nào LED sáng trong một mạch kín.' },
      { target: ['.hero-actions a[href="/build/freestyle"]'], title: 'Mở bàn lắp mạch tự do', body: 'Chọn board, nối dây và chạy code trong bàn lắp riêng. Bản nháp đã lưu có thể mở lại trên trình duyệt này.' },
      helpStep,
    ],
  },
  freestyle: {
    id: 'freestyle', label: 'Bàn lắp mạch tự do', publicPath: '/build/freestyle', appPath: '/app/lab/freestyle',
    invite: 'Năm bước ngắn: chọn board, thêm linh kiện, viết code và bấm Chạy.',
    steps: [...freestyleSteps, helpStep],
  },
  lab: {
    id: 'lab', label: 'Phòng lắp mạch theo bài', publicPath: '/build', appPath: '/app/lab',
    invite: 'Phòng lắp mạch dựng sẵn mạch theo bài. Xem cách đi qua các bước.',
    steps: [
      { target: ['.circuit-builder-page .catalog-page-heading h1'], title: 'Phòng lắp mạch theo bài', body: 'Chọn một bài mẫu để nạp sẵn mạch, code và luồng tín hiệu. Muốn tự lắp từ đầu, dùng Bàn lắp mạch tự do trong menu Lắp mạch.' },
      { target: ['#builder-stepper', '.builder-stepper', '.builder-choose-panel'], title: 'Đi theo từng bước', body: 'Thanh bước cho biết bạn đang ở đâu: chọn bài, lắp mạch, viết code, chạy và quan sát.' },
      { target: ['.builder-main', '.builder-workbench'], title: 'Khu làm việc', body: 'Breadboard, sơ đồ và 3D nằm ở đây. Bấm linh kiện để xem chân và lưu ý an toàn.' },
      { target: ['.builder-guide', '.builder-inspector'], title: 'Hướng dẫn và kiểm tra', body: 'Cột bên phải giải thích bước hiện tại và báo lỗi nối dây trước khi chạy.' },
      helpStep,
    ],
  },
  lesson: {
    id: 'lesson', label: 'Bài học đầu tiên', publicPath: '/learn/esp32-led', appPath: '/app/learn/esp32-led',
    invite: 'Bài học có ba phần: đọc, lắp và chạy. Xem nhanh vị trí từng phần.',
    steps: [
      { target: ['.lesson-heading', '.lesson-intro'], title: 'Mục tiêu bài học', body: 'Tên bài, cấp độ và điều bạn sẽ làm được sau khi học xong.' },
      { target: ['.lesson-studio-tabs'], title: 'Các phần của bài', body: 'Chuyển giữa phần đọc hiểu, lắp mạch và code bằng các thẻ này. Dùng phím mũi tên khi đang ở thẻ.' },
      { target: ['.lesson-stage'], title: 'Mạch đang học', body: 'Mạch, sơ đồ và mô phỏng hiển thị ở đây và cập nhật theo phần bạn chọn.' },
      { target: ['.lesson-studio-dock'], title: 'Bước tiếp theo', body: 'Thanh dưới cùng cho biết bạn đang ở bước nào và nút đi tiếp, gồm nút mở mạch để chạy.' },
      helpStep,
    ],
  },
}

export const TOUR_ORDER: readonly TourId[] = ['home', 'app-home', 'freestyle', 'lab', 'lesson', 'library', 'tools']

/** Trang nào có tour riêng. Giữ nguyên URL hiện có, chỉ đọc pathname. */
export function tourIdForPath(pathname: string): TourId | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'home'
  if (path === '/app') return 'app-home'
  if (['/boards', '/components', '/app/boards', '/app/components'].includes(path)) return 'library'
  if (path === '/tools/sketch' || path === '/app/tools/sketch') return 'tools'
  if (path === '/build/freestyle' || path === '/app/lab/freestyle') return 'freestyle'
  if (path === '/build' || path === '/app/lab') return 'lab'
  if (path === '/learn/esp32-led' || path === '/app/learn/esp32-led') return 'lesson'
  return null
}

export const TOUR_SEEN_KEY = 'mm-tour-seen'
export const TOUR_PENDING_KEY = 'mm-tour-pending'

export function readSeenTours(storage: Pick<Storage, 'getItem'> | null): Partial<Record<TourId, number>> {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(TOUR_SEEN_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Partial<Record<TourId, number>> : {}
  } catch { return {} }
}

export function markTourSeen(storage: Pick<Storage, 'getItem' | 'setItem'> | null, id: TourId, at = Date.now()) {
  try { storage?.setItem(TOUR_SEEN_KEY, JSON.stringify({ ...readSeenTours(storage), [id]: at })) } catch { /* bộ nhớ bị chặn: lời mời có thể hiện lại lần sau */ }
}
