import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { GUEST_AUTHOR, type CommunityAuthor } from '../../lib/community'
import { canUseOnlineCommunity, getCommunityRepository, loginPath, setCommunitySource } from '../../lib/communityStore'

/** Nhãn bắt buộc: dữ liệu chưa đồng bộ máy chủ. */
export function PreviewBanner() {
  const remote = getCommunityRepository().mode === 'remote'
  const [error, setError] = useState('')
  return (
    <p className="community-preview-banner" role="note">
      <strong>{remote ? 'Cộng đồng online' : 'Bản xem trước'}</strong>
      <span>{remote ? 'Nguồn máy chủ: bài đã công bố dùng chung. Lỗi kết nối sẽ được báo; dữ liệu cục bộ không tự tải lên.' : 'Bài viết chưa đồng bộ: bài mẫu và bài/bình luận cục bộ chỉ có trên thiết bị này. Chữ lưu localStorage, tệp lưu IndexedDB; có thể bị trình duyệt xoá. Tệp đang chọn chỉ ở bộ nhớ cho tới khi đăng thành công.'}</span>
      {!canUseOnlineCommunity && <span>Tính năng chia sẻ bài trực tuyến chưa được bật. Bạn vẫn có thể viết và lưu trên thiết bị này.</span>}
      {canUseOnlineCommunity && <button type="button" onClick={() => { try { setCommunitySource(remote ? 'preview' : 'remote') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không đổi được nguồn.') } }}>{remote ? 'Xem bài trên thiết bị' : 'Mở cộng đồng online'}</button>}
      {error && <span role="alert">{error}</span>}
    </p>
  )
}

export const COMMUNITY_RULES: readonly string[] = [
  'Tôn trọng người hỏi; ai cũng từng là người mới.',
  'Mô tả rõ board, sơ đồ nối dây, code và lỗi gặp phải.',
  'Dán code trong khối ``` để dễ đọc; không đăng mật khẩu Wi-Fi, token hay khoá API.',
  'Không hướng dẫn thao tác điện lưới 220V hay sạc pin Li-ion thiếu bảo vệ mà không cảnh báo an toàn.',
  'Không spam, quảng cáo hay nội dung xúc phạm. Dùng nút “Báo cáo” khi thấy vi phạm.',
]

export function CommunityRules({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`community-rules${compact ? ' community-rules-compact' : ''}`} aria-labelledby="community-rules-title">
      <h2 id="community-rules-title">Quy tắc cộng đồng</h2>
      <ol>{COMMUNITY_RULES.map(rule => <li key={rule}>{rule}</li>)}</ol>
    </section>
  )
}

export type WriteAccess =
  | { canWrite: true; author: CommunityAuthor; note: string }
  | { canWrite: false; loginTo: string; note: string }

/**
 * Quyền viết: có Supabase thì phải đăng nhập; chưa cấu hình thì cho viết nháp cục bộ dưới tên khách.
 */
export function useWriteAccess(): WriteAccess | null {
  const auth = useAuth()
  const { pathname, search } = useLocation()
  if (getCommunityRepository().mode === 'preview') return { canWrite: true, author: auth.status === 'signed-in' ? { id: auth.user.id, name: auth.user.displayName, avatarUrl: auth.user.avatarUrl } : GUEST_AUTHOR, note: auth.status === 'signed-in' ? 'Bản xem trước: chỉ lưu trên thiết bị, không gửi lên cộng đồng online.' : 'Bạn đang viết nháp dưới tên khách, chỉ lưu trên thiết bị này.' }
  if (auth.status === 'loading') return null
  if (auth.status === 'signed-in') return { canWrite: true, author: { id: auth.user.id, name: auth.user.displayName, avatarUrl: auth.user.avatarUrl }, note: `Đăng online với tên ${auth.user.displayName}.` }
  if (auth.status === 'unconfigured') return { canWrite: true, author: GUEST_AUTHOR, note: 'Đăng nhập chưa được kết nối: bạn đang viết nháp dưới tên khách, chỉ lưu trên thiết bị này.' }
  return { canWrite: false, loginTo: loginPath(pathname, `${pathname}${search}`), note: 'Cần đăng nhập để viết bài hoặc bình luận.' }
}

export function LoginRequired({ access }: { access: Extract<WriteAccess, { canWrite: false }> }) {
  return <p className="community-login-required">{access.note} <Link to={access.loginTo}>Đăng nhập bằng Google hoặc GitHub</Link></p>
}
