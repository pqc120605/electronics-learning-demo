import { useState } from 'react'
import { initialsOf } from '../lib/authUser'

/** Avatar người dùng: ảnh https nếu có, không thì chữ cái đầu. Ảnh chỉ trang trí, tên luôn hiện cạnh bên. */
export function UserAvatar({ name, url, size = 28 }: { name: string; url: string | null; size?: number }) {
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) }
  if (url && !failed) return <img className="user-avatar" src={url} alt="" width={size} height={size} style={style} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  return <span className="user-avatar user-avatar-fallback" style={style} aria-hidden="true">{initialsOf(name)}</span>
}
