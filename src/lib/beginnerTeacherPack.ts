import { BEGINNER_ACTIVITIES, type BeginnerActivityId } from '../data/beginnerCourse'
import {
  createBeginnerSession, getBeginnerBoardOptions, getBeginnerCaseOptions,
  getBeginnerCode, getBeginnerResult,
} from './beginnerCourse'

const facilitation: Record<BeginnerActivityId, { minutes: string; materials: string; mistake: string; prompt: string }> = {
  'closed-loop': {
    minutes: '6–8 phút', materials: 'Nguồn giả định, điện trở nối tiếp, LED và dây hồi trong mô hình.',
    mistake: 'Chỉ tìm đường từ cực dương mà bỏ qua đường về cực âm.',
    prompt: 'Mời người học chỉ cả đường đi lẫn đường hồi trước khi đổi một kết nối.',
  },
  breadboard: {
    minutes: '6–8 phút', materials: 'Breadboard 400 lỗ giả định, hai cặp lỗ 10a/10e và 10e/10f.',
    mistake: 'Cho rằng hai lỗ gần nhau hoặc cùng hàng chữ luôn nối điện.',
    prompt: 'Yêu cầu chỉ dải năm lỗ và rãnh giữa, rồi so sánh hai cặp lỗ.',
  },
  'led-polarity': {
    minutes: '8–10 phút', materials: 'LED có anode/cathode, điện trở và nguồn giả định trong mô hình.',
    mistake: 'Cho rằng LED sáng ở cả hai chiều hoặc có thể bỏ điện trở.',
    prompt: 'Giữ đường hồi kín; lần lượt đổi chiều LED, rồi xét điều kiện thiếu điện trở.',
  },
  'button-logic': {
    minutes: '8–10 phút', materials: 'Profile board, nút INPUT_PULLUP, LED và code mẫu trong bài học.',
    mistake: 'Đồng nhất nhấn nút với HIGH hoặc bỏ qua điều kiện trong code.',
    prompt: 'Lần từ trạng thái nút tới mức đọc, phép so sánh và nhánh LED.',
  },
  'sensor-threshold': {
    minutes: '8–10 phút', materials: 'Profile board, đầu vào phần trăm giả định, ngưỡng và LED trong bài học.',
    mistake: 'Coi dấu > giống >= khi đầu vào bằng ngưỡng.',
    prompt: 'Giữ ngưỡng 50%; hỏi riêng về 49%, 50% và 51% trước khi xem trace.',
  },
}

/** Takes only an explicit board id; never a learner session or persisted state. */
export function createBeginnerTeacherPack(boardId?: unknown) {
  const board = typeof boardId === 'string'
    ? getBeginnerBoardOptions().find(item => item.boardId === boardId)
    : undefined
  const activities = BEGINNER_ACTIVITIES.map(activity => {
    const fresh = { ...createBeginnerSession(), activityId: activity.id, boardId: board?.boardId ?? null }
    const cases = getBeginnerCaseOptions(fresh).map(option => {
      const session = { ...fresh, controls: { ...fresh.controls, ...option.controls } }
      return { label: option.label, controls: session.controls, result: getBeginnerResult(session), code: getBeginnerCode(session) }
    })
    return { ...activity, ...facilitation[activity.id], cases }
  })
  const downloadReady = Boolean(board) && activities.every(activity => activity.cases.every(item => item.result.status === 'ready'))
  return {
    boardId: board?.boardId ?? null, boardName: board?.name ?? 'Chưa chọn board được hỗ trợ',
    downloadReady,
    reason: downloadReady ? '' : 'Chọn board được hỗ trợ để tải đủ gói. Ba hoạt động nền tảng vẫn xem được; hai hoạt động code chưa thể đánh giá khi thiếu board hợp lệ.',
    activities,
  }
}

export type BeginnerTeacherPackModel = ReturnType<typeof createBeginnerTeacherPack>

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

const outcomeLabels = {
  on: 'LED sáng', off: 'LED tắt', connected: 'Có nối điện', separate: 'Tách rời',
  blocked: 'Cần thêm điện trở trước khi chạy',
}

const printCss = `
*{box-sizing:border-box}html{color:#172d3e;background:#fff;font:16px/1.55 system-ui,sans-serif}
body{max-width:900px;padding:24px;margin:auto}h1,h2,h3{line-height:1.25}h1{font-size:2rem}h2{font-size:1.5rem;margin-top:30px}h3{font-size:1.15rem}
p,li{max-width:80ch}header{border-bottom:3px solid #176b79;padding-bottom:12px}.notice{border-left:3px solid #176b79;padding:8px 14px;background:#eef6f7}
article{margin:24px 0}.worksheet-case{border-top:1px solid #738591;padding:12px 0}.blank{min-height:48px;border-bottom:1px dotted #738591;margin:8px 0 14px}
.answer-case{border-top:1px solid #b7c5cd;padding:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace;padding:12px;background:#f2f5f6}ul,ol{padding-left:24px}
@page{size:A4;margin:16mm}
@media print {
 html{font-size:10pt}
 body{max-width:none;padding:0}
 h1{margin:0 0 8px}
 h2{margin:16px 0 6px}
 h3{margin:6px 0}
 p,ol{margin:5px 0}
 h2,h3{break-after:avoid}
 article{margin:14px 0}
 #learner-worksheet,#teacher-answer-key{break-before:page}
 .worksheet-case{break-inside:avoid;padding:6px 0}
 .blank{min-height:8mm;margin:3px 0 7px}
 .answer-case{padding:6px 0}
 pre{break-inside:avoid;border:1px solid #aaa;background:white;font-size:9pt}
}
@media(max-width:480px){body{padding:14px}h1{font-size:1.6rem}}
`

/** Standalone UTF-8 document: all variable text is escaped; no scripts or assets. */
export function renderBeginnerTeacherPackHtml(pack: BeginnerTeacherPackModel): string {
  const e = escapeHtml
  const preparation = pack.activities.map(activity => `<article><h3>${e(activity.title)}</h3>
    <p><strong>Mục tiêu:</strong> ${e(activity.goal)}</p><p><strong>Thời lượng ước lượng:</strong> ${e(activity.minutes)}</p>
    <p><strong>Thành phần khái niệm:</strong> ${e(activity.materials)}</p>
    <p><strong>Lỗi thường gặp:</strong> ${e(activity.mistake)}</p><p><strong>Dẫn dắt:</strong> ${e(activity.prompt)}</p></article>`).join('')
  const worksheets = pack.activities.map(activity => `<article><h2>${e(activity.title)}</h2><p>${e(activity.goal)}</p><p>${e(activity.instruction)}</p>
    ${activity.cases.map((entry, index) => `<section class="worksheet-case"><h3>Trường hợp ${index + 1}: ${e(entry.label)}</h3>
      ${['Dự đoán trước khi thử', 'Quan sát tự ghi', 'Giải thích', 'Điều đã sửa / muốn thử tiếp'].map(label => `<p>${e(label)}:</p><div class="blank"></div>`).join('')}</section>`).join('')}
    <p>${e(activity.explanationQuestion)}</p><div class="blank"></div></article>`).join('')
  const answers = pack.activities.map(activity => `<article><h2>${e(activity.title)}</h2>
    ${activity.cases.map(entry => `<section class="answer-case"><h3>${e(entry.label)}</h3>
      <p><strong>${e(entry.result.status === 'ready' && entry.result.outcome ? outcomeLabels[entry.result.outcome] : 'Chưa thể đánh giá')}</strong></p>
      <p>${e(entry.result.message)}</p><p>Nguồn: ${e(entry.result.evidenceKind === 'topology-check' ? 'kiểm tra kết nối' : 'trace mô hình bài học')}.</p>
      <ol>${entry.result.trace.map(line => `<li>${e(line)}</li>`).join('')}</ol>
      ${entry.code ? `<h3>Code mẫu của board đã chọn</h3><pre><code>${e(entry.code)}</code></pre>` : ''}</section>`).join('')}
    <p><strong>Giải thích:</strong> ${e(activity.explanationChoices.find(choice => choice.id === activity.correctExplanationId)?.label ?? 'Chưa có đáp án hợp lệ.')}</p>
    <h3>Gợi ý từng bước</h3><ol>${activity.hints.map(hint => `<li>${e(hint)}</li>`).join('')}</ol></article>`).join('')
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gói thực hành giáo viên — Nền tảng điện tử</title><style>${printCss}</style></head><body><main tabindex="0" aria-label="Nội dung gói thực hành giáo viên">
    <header><h1>Gói thực hành cho giáo viên</h1><p>Nền tảng điện tử · Khóa cơ bản phiên bản 1 · 5 hoạt động / 13 trường hợp</p><p>Board của gói: ${e(pack.boardName)} (${e(pack.boardId ?? 'chưa chọn')})</p></header>
    <div class="notice"><p>Mô hình giáo dục và kiểm tra kết nối; không phải chạy firmware, giải mạch analog hay phép đo kit thật. Vật liệu dưới đây là thành phần khái niệm, không phải BOM hoặc hướng dẫn đấu kit vật lý.</p>
    <p>Phiếu điền tay không tự tạo bằng chứng trong ứng dụng và không xác nhận đã đạt kỹ năng. Gói không chứa tiến độ, quan sát hoặc code riêng của người học.</p>${pack.reason ? `<p>${e(pack.reason)}</p>` : ''}</div>
    <section id="teacher-preparation"><h2>Chuẩn bị và nhịp học</h2><p>Mở ứng dụng Mạch Mở local để thực hiện hoạt động. File này chỉ dùng đọc và in offline; không chạy mô hình.</p>
    <p>Chuẩn bị trình duyệt và ứng dụng local, kiểm tra đúng profile board cho hai bài code, in phiếu trống; giữ phần đáp án riêng. Không cần tài khoản hoặc kit thật.</p>
    <p>Ước lượng cả buổi: 45–60 phút, gồm 5–10 phút giới thiệu và trao đổi cuối buổi; điều chỉnh theo nhịp nhóm, chưa phải thời lượng đã đo trong lớp.</p>
    <p>Với mỗi trường hợp: dự đoán → thử trong ứng dụng → tự ghi quan sát → giải thích → đổi một điều. Hỏi lý do khi dự đoán khác mô hình; không chấm từ việc bấm chạy.</p>${preparation}</section>
    <section id="learner-worksheet"><h1>Phiếu thực hành trống</h1><p>Họ tên / nhóm: ____________________ Ngày: ____________________</p><p>Board của gói: ${e(pack.boardName)}. Ngưỡng bài cảm biến: 50%.</p><p>Ghi tay những gì bạn dự đoán và quan sát. Đây là ghi chú của người học, không phải bằng chứng tự động.</p>${worksheets}</section>
    <section id="teacher-answer-key"><h1>Đáp án dành cho giáo viên</h1><p>Giữ riêng phần này khi phát phiếu. Kết quả lấy từ engine của khóa cơ bản cho board của gói: ${e(pack.boardName)}. Ngưỡng cố định 50%.</p>${answers}</section>
    </main></body></html>`
}
