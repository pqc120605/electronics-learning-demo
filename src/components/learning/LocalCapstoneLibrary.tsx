import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CAPSTONE_STORAGE_KEY, encodeCapstone, type CapstoneReport } from '../../lib/localCapstone'
import { CAPSTONE_LIBRARY_KEY, CAPSTONE_LIBRARY_LIMIT, CAPSTONE_LIBRARY_RECOVERY_KEY, copyCapstoneSnapshot, readCapstoneLibrary, recoverCapstoneLibrary, removeCapstoneSnapshot, replaceActiveCapstone, saveCapstoneSnapshot, type CapstoneSnapshot } from '../../lib/localCapstoneLibrary'
import { downloadBeginnerText } from '../../lib/useBeginnerCourse'
import { useProductRoute } from '../../lib/useProductRoute'
import '../../pages/LocalCapstonePage.css'

// Access through methods so browsers that reject the localStorage getter are recoverable too.
const storage = { getItem: (key: string) => localStorage.getItem(key), setItem: (key: string, value: string) => localStorage.setItem(key, value) }

function readRecovery() {
  try { return storage.getItem(CAPSTONE_LIBRARY_RECOVERY_KEY) } catch { return null }
}

export function LocalCapstoneLibrary({ report, onOpen }: { report?: CapstoneReport; onOpen?: (report: CapstoneReport) => boolean }) {
  const [state, setState] = useState(() => readCapstoneLibrary(storage))
  const [name, setName] = useState('')
  const [notice, setNotice] = useState('')
  const [stale, setStale] = useState(false)
  const [recovery, setRecovery] = useState(readRecovery)
  const [confirmRecovery, setConfirmRecovery] = useState(false)
  const [pending, setPending] = useState<{ entry: CapstoneSnapshot; raw: string | null; action: 'open' | 'delete' } | null>(null)
  const route = useProductRoute()
  const navigate = useNavigate()
  useEffect(() => {
    function lockIfChanged() {
      try { if (storage.getItem(CAPSTONE_LIBRARY_KEY) === state.raw) return }
      catch { return }
      setStale(true)
      setPending(null)
      setConfirmRecovery(false)
      setNotice('Thư viện đã đổi ở tab khác. Làm mới thư viện để xem dữ liệu mới trước khi lưu.')
    }
    function changed(event: StorageEvent) {
      if (event.key === CAPSTONE_LIBRARY_KEY || event.key === null) lockIfChanged()
      if (event.key === CAPSTONE_STORAGE_KEY || event.key === null) setPending(null)
      if (event.key === CAPSTONE_LIBRARY_RECOVERY_KEY || event.key === null) setRecovery(readRecovery())
    }
    window.addEventListener('storage', changed)
    window.addEventListener('focus', lockIfChanged)
    if (state.kind === 'ready') lockIfChanged()
    return () => {
      window.removeEventListener('storage', changed)
      window.removeEventListener('focus', lockIfChanged)
    }
  }, [state.raw, state.kind])
  const writable = state.kind === 'ready' && !stale
  function change(action: () => typeof state) {
    try { setState(action()); setNotice('Đã lưu thư viện trên trình duyệt này.'); return true }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Không ghi được thư viện.'); return false }
  }
  function review(entry: CapstoneSnapshot, action: 'open' | 'delete') {
    try { setPending({ entry, raw: storage.getItem(CAPSTONE_STORAGE_KEY), action }); setNotice('') }
    catch { setNotice('Không đọc được hồ sơ đang làm. Hãy tải hồ sơ JSON trước khi đóng tab.') }
  }
  function confirm() {
    if (!pending) return
    if (pending.action === 'delete') {
      if (change(() => removeCapstoneSnapshot(storage, state.raw, pending.entry.id))) setPending(null)
      return
    }
    try {
      if (storage.getItem(CAPSTONE_LIBRARY_KEY) !== state.raw) throw Error('Thư viện đã đổi ở tab khác. Làm mới thư viện trước khi mở hồ sơ.')
      // Recheck the active bytes reviewed in this confirmation, even on the live editor page.
      if (storage.getItem(CAPSTONE_STORAGE_KEY) !== pending.raw) throw Error('Hồ sơ đang làm đã đổi ở tab khác. Mở lại xác nhận trước khi tiếp tục.')
      if (onOpen) {
        if (!onOpen(pending.entry.report)) return
      } else {
        replaceActiveCapstone(storage, pending.raw, pending.entry.report)
        navigate(route('/learn/mini-project'))
      }
      setPending(null)
      setNotice(`Đã mở “${pending.entry.name}”. Bản trong thư viện được giữ nguyên.`)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không mở được hồ sơ.'); setPending(null) }
  }
  return <section className="capstone-library capstone-card" aria-labelledby="capstone-library-title">
    <h2 id="capstone-library-title">Thư viện mini-project</h2>
    <p>Lưu từng bản theo tên để so sánh phép thử. Các bản chỉ nằm trong trình duyệt này, có thể mất khi xóa dữ liệu trình duyệt. Tải JSON để giữ bản dự phòng hoặc chuyển máy.</p>
    <p>Mô hình logic giáo dục của đèn cảnh báo; các hồ sơ này không xác nhận mạch thật.</p>
    {report ? <form className="capstone-library-save" onSubmit={event => {
      event.preventDefault()
      if (writable && change(() => saveCapstoneSnapshot(storage, state.raw, name, report))) setName('')
    }}>
      <label htmlFor="capstone-snapshot-name">Tên bản lưu<input id="capstone-snapshot-name" value={name} maxLength={80} required onChange={event => setName(event.target.value)} /></label>
      <button type="submit" disabled={!writable || state.entries.length >= CAPSTONE_LIBRARY_LIMIT}>Lưu bản vào thư viện</button>
    </form> : <Link to={route('/learn/mini-project')}>Tiếp tục hoặc tạo mini-project đèn cảnh báo →</Link>}
    <p>{state.entries.length}/{CAPSTONE_LIBRARY_LIMIT} bản lưu. Mỗi lần lưu tạo một snapshot riêng; “Tạo bản sao độc lập” cấp mã project mới.</p>
    {state.entries.length >= CAPSTONE_LIBRARY_LIMIT && <p role="status">Thư viện đã đầy. Tải JSON rồi xóa một bản không còn cần để lưu tiếp.</p>}
    {state.message && <p role="alert">{state.message}</p>}
    {notice && <p role="status">{notice}</p>}
    <div className="capstone-actions">
      <button type="button" onClick={() => { setState(readCapstoneLibrary(storage)); setStale(false); setPending(null); setConfirmRecovery(false); setRecovery(readRecovery()); setNotice('Đã đọc lại thư viện. Hồ sơ đang làm được giữ nguyên.') }}>Làm mới thư viện</button>
      {state.kind === 'protected' && state.raw !== null && <button type="button" onClick={() => downloadBeginnerText(state.raw!, 'mach-mo-thu-vien-goc.json')}>Tải thư viện gốc</button>}
      {state.kind === 'protected' && !stale && <button type="button" onClick={() => setConfirmRecovery(true)}>Bắt đầu thư viện mới</button>}
      {recovery !== null && <button type="button" onClick={() => downloadBeginnerText(recovery, 'mach-mo-thu-vien-da-sao-luu.json')}>Tải thư viện đã sao lưu</button>}
    </div>
    {confirmRecovery && <div className="capstone-import" role="group" aria-label="Xác nhận khôi phục thư viện">
      <p>Mạch Mở sẽ giữ nguyên bản gốc ở mục sao lưu, rồi mở một thư viện trống trên trình duyệt này.</p>
      <button type="button" onClick={() => {
        if (state.raw !== null && change(() => recoverCapstoneLibrary(storage, state.raw!))) setConfirmRecovery(false)
        setRecovery(readRecovery())
      }}>Sao lưu và mở thư viện trống</button>
      <button type="button" onClick={() => setConfirmRecovery(false)}>Hủy khôi phục</button>
    </div>}
    {state.kind === 'ready' && state.entries.length === 0 && <p>Chưa có bản lưu mini-project. Mở đèn cảnh báo, đặt tên rồi lưu vào thư viện.</p>}
    <div className="capstone-library-list">{state.entries.map(entry => <article key={entry.id} className="capstone-library-entry">
      <h3>{entry.name}</h3>
      <p>{new Date(entry.savedAt).toLocaleString('vi-VN')} · {entry.report.observations.length} lần thử · Ngưỡng {entry.report.settings.threshold}%</p>
      <div className="capstone-actions">
        <button type="button" disabled={!writable} onClick={() => review(entry, 'open')}>Mở {entry.name}</button>
        <button type="button" onClick={() => downloadBeginnerText(encodeCapstone(entry.report), 'mach-mo-mini-project.json')}>Tải JSON {entry.name}</button>
        <button type="button" disabled={!writable || state.entries.length >= CAPSTONE_LIBRARY_LIMIT} onClick={() => change(() => copyCapstoneSnapshot(storage, state.raw, entry.id))}>Tạo bản sao độc lập {entry.name}</button>
        <button type="button" disabled={!writable} onClick={() => review(entry, 'delete')}>Xóa {entry.name}</button>
      </div>
    </article>)}</div>
    {pending && <div role="group" aria-label="Xác nhận thao tác thư viện" className="capstone-import">
      <p>{pending.action === 'open' ? `Mở “${pending.entry.name}” sẽ thay hồ sơ đang làm. Bản lưu trong thư viện vẫn giữ nguyên. Tải hồ sơ đang làm hoặc lưu một snapshot trước nếu cần.` : `Xóa “${pending.entry.name}” khỏi thư viện? Tải JSON trước nếu cần giữ bản này.`}</p>
      {pending.action === 'open' && <button type="button" onClick={() => {
        if (report) downloadBeginnerText(encodeCapstone(report), 'mach-mo-ho-so-dang-lam.json')
        else if (pending.raw !== null) downloadBeginnerText(pending.raw, 'mach-mo-ho-so-dang-lam.json')
      }} disabled={!report && pending.raw === null}>Tải hồ sơ đang làm</button>}
      <button type="button" onClick={confirm}>{pending.action === 'open' ? 'Xác nhận mở và thay hồ sơ đang làm' : 'Xác nhận xóa bản lưu'}</button>
      <button type="button" onClick={() => setPending(null)}>Hủy thao tác thư viện</button>
    </div>}
  </section>
}
