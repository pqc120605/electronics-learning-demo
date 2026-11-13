import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { getAdminAccess, type AdminAccess } from '../lib/admin'
import { isSupabaseConfigured } from '../lib/supabase'

type GateState =
  | { status: 'checking' }
  | { status: 'unconfigured' }
  | { status: 'signed-out' }
  | { status: 'forbidden' }
  | { status: 'error'; message: string }
  | { status: 'admin'; access: AdminAccess }

export function AdminGate({ children }: { children: (access: AdminAccess) => ReactNode }) {
  const [gate, setGate] = useState<GateState>({ status: 'checking' })
  const location = useLocation()

  useEffect(() => {
    let active = true
    document.title = 'Quản trị — Mạch Mở'
    if (!isSupabaseConfigured) {
      setGate({ status: 'unconfigured' })
      return () => { active = false }
    }

    getAdminAccess()
      .then((access) => {
        if (!active) return
        if (!access) setGate({ status: 'signed-out' })
        else if (!access.isAdmin) setGate({ status: 'forbidden' })
        else setGate({ status: 'admin', access })
      })
      .catch(() => {
        if (active) setGate({ status: 'error', message: 'Không kiểm tra được quyền truy cập. Hãy thử tải lại trang.' })
      })

    return () => { active = false }
  }, [])

  if (gate.status === 'checking') return <main className="admin-state"><div className="admin-state-card"><span className="admin-state-symbol">…</span><h1>Đang kiểm tra quyền truy cập</h1><p>Vui lòng đợi trong giây lát.</p></div></main>
  if (gate.status === 'unconfigured') return <main className="admin-state"><div className="admin-state-card"><span className="admin-state-symbol">⚙</span><p className="eyebrow">CẦN CẤU HÌNH BACKEND</p><h1>Thống kê chưa được kết nối</h1><p>Website học vẫn hoạt động. Để dùng khu quản trị, hãy tạo Supabase project riêng, chạy migration và khai báo biến môi trường theo README.</p><Link className="button-primary" to="/">Về trang học</Link></div></main>
  if (gate.status === 'signed-out') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (gate.status === 'forbidden') return <main className="admin-state"><div className="admin-state-card"><span className="admin-state-symbol">×</span><p className="eyebrow">KHÔNG CÓ QUYỀN</p><h1>Tài khoản này chưa được cấp quyền admin</h1><p>Chỉ user được thêm vào danh sách site admins trong Supabase mới xem được thống kê.</p><Link className="button-primary" to="/admin/login">Quay lại đăng nhập</Link></div></main>
  if (gate.status === 'error') return <main className="admin-state"><div className="admin-state-card"><span className="admin-state-symbol">!</span><h1>Không tải được quyền truy cập</h1><p>{gate.message}</p><button className="button-primary" type="button" onClick={() => window.location.reload()}>Thử lại</button></div></main>
  return <>{children(gate.access)}</>
}
