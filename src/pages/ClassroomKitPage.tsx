import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { boards } from '../data/boards'
import { componentRegistry } from '../data/componentRegistry'
import { curriculumLessons } from '../data/curriculumSchema'
import type { BuilderLessonId } from '../data/builderLessons'
import {
  createDefaultClassroomKitBundle,
  getKitInventory,
  parseClassroomKitImport,
  parseClassroomKitBundle,
  serializeClassroomKitBundle,
  serializeClassroomKitCsv,
  serializeClassroomKitSharePack,
  getLegacyResistorOverridePreview,
  resolveLegacyResistorOverride,
  type ClassroomKitBundle,
} from '../lib/classroomKit'
import './ClassroomKitPage.css'

const STORAGE_KEY = 'mach-mo-classroom-kit-plan-v1'

function readSavedState() {
  try {
    const source = window.localStorage.getItem(STORAGE_KEY)
    if (source === null) return { bundle: createDefaultClassroomKitBundle(), pendingLegacy: null, storageRecovery: null }
    let bundle: ClassroomKitBundle
    try {
      bundle = parseClassroomKitBundle(source)
    } catch (error) {
      return {
        bundle: createDefaultClassroomKitBundle(),
        pendingLegacy: null,
        storageRecovery: {
          raw: source,
          reason: error instanceof Error ? error.message : 'Không đọc được gói đã lưu.',
        },
      }
    }
    const preview = getLegacyResistorOverridePreview(bundle)
    return { bundle, pendingLegacy: preview?.ambiguous ? { bundle, preview } : null, storageRecovery: null }
  } catch {
    return { bundle: createDefaultClassroomKitBundle(), pendingLegacy: null, storageRecovery: null }
  }
}

export function ClassroomKitPage() {
  const [initial] = useState(readSavedState)
  const [bundle, setBundle] = useState(initial.bundle)
  const [message, setMessage] = useState('')
  const [componentToAdd, setComponentToAdd] = useState('')
  const [pendingLegacy, setPendingLegacy] = useState<{ bundle: ClassroomKitBundle; preview: NonNullable<ReturnType<typeof getLegacyResistorOverridePreview>> } | null>(initial.pendingLegacy)
  const [legacyTarget, setLegacyTarget] = useState(initial.pendingLegacy?.preview.variantKeys[0] ?? '')
  const [storageRecovery, setStorageRecovery] = useState<{ raw: string; reason: string } | null>(initial.storageRecovery)
  const fileInput = useRef<HTMLInputElement>(null)
  const inventory = useMemo(
    () => getKitInventory(bundle.lessonIds, bundle.stationCount, bundle.quantityOverrides, bundle.boardId, bundle.variantOverrides),
    [bundle.lessonIds, bundle.stationCount, bundle.quantityOverrides, bundle.variantOverrides, bundle.boardId],
  )
  const safetyNotes = useMemo(() => [...new Set(curriculumLessons.filter(lesson => bundle.lessonIds.includes(lesson.id)).flatMap(lesson => lesson.safetyNotes))], [bundle.lessonIds])
  const usedIds = new Set(inventory.map(row => row.componentId))
  if (inventory.some(row => row.bomKey?.startsWith('resistor:ohm:'))) usedIds.add('resistor')
  const remainingComponents = componentRegistry.filter(item => item.id !== 'board' && !usedIds.has(item.id))

  useEffect(() => {
    if (storageRecovery) return
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeClassroomKitBundle(bundle))
      setMessage('Đã lưu kế hoạch trên thiết bị này.')
    } catch {
      setMessage('Không lưu được trên thiết bị này. Hãy tải gói JSON để giữ bản sao.')
    }
  }, [bundle, storageRecovery])

  function updateBundle(patch: Partial<ClassroomKitBundle>) {
    setBundle(current => ({ ...current, ...patch }))
  }

  function setQuantity(componentId: string, quantity: number) {
    const safeQuantity = Math.max(1, Math.min(9999, Math.round(quantity)))
    updateBundle({ quantityOverrides: { ...bundle.quantityOverrides, [componentId]: safeQuantity } })
  }

  function setVariantQuantity(row: (typeof inventory)[number], quantity: number) {
    if (!row.bomKey || row.value === undefined) return
    const safeQuantity = Math.max(1, Math.min(9999, Math.round(quantity)))
    updateBundle({
      schemaVersion: 2,
      variantOverrides: {
        ...bundle.variantOverrides,
        [row.bomKey]: { value: row.value, unit: 'ohm', package: row.package ?? 'unknown', quantity: safeQuantity },
      },
    })
  }

  function exportBundle() {
    const blob = new Blob([serializeClassroomKitBundle(bundle)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${bundle.title.trim().replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '') || 'mach-mo-kit'}.json`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Đã tải gói kit JSON xuống thiết bị.')
  }

  function exportCsv() {
    const csv = serializeClassroomKitCsv(bundle, inventory)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${bundle.title.trim().replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '') || 'mach-mo-kit'}.csv`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Đã tải bảng số lượng CSV xuống thiết bị.')
  }

  function exportSharePack() {
    const pack = serializeClassroomKitSharePack(bundle)
    const blob = new Blob([pack], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${bundle.title.trim().replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '') || 'mach-mo-classroom-share'}.share.json`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Đã tải gói chia sẻ thủ công gồm bài học, board/revision, năng lực mô phỏng và lưu ý an toàn; không có dữ liệu học sinh.')
  }

  function exportUnparsedSavedBundle() {
    if (!storageRecovery) return
    const blob = new Blob([storageRecovery.raw], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'mach-mo-classroom-kit-recovery.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Đã tải nguyên văn gói đã lưu để bạn giữ bản sao.')
  }

  async function importBundle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (file.size > 64 * 1024) {
      setMessage('Tệp vượt giới hạn 64 kB; chưa thay đổi kế hoạch hiện tại.')
      return
    }
    try {
      const next = parseClassroomKitImport(await file.text())
      const preview = getLegacyResistorOverridePreview(next)
      if (preview?.ambiguous) {
        setPendingLegacy({ bundle: next, preview })
        setLegacyTarget(preview.variantKeys[0] ?? '')
        setMessage('Tệp có override điện trở theo họ linh kiện. Chọn biến thể đích hoặc giữ số lượng mặc định trước khi nhập.')
        return
      }
      setPendingLegacy(null)
      setBundle(next)
      setMessage('Đã nhập gói hợp lệ. Dữ liệu chỉ nằm trên thiết bị này.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được gói kit; kế hoạch hiện tại được giữ nguyên.')
    }
  }

  function resolveLegacyImport(choice: { kind: 'map'; bomKey: string } | { kind: 'leave-defaults' }) {
    if (!pendingLegacy) return
    const resolved = resolveLegacyResistorOverride(pendingLegacy.bundle, choice)
    setBundle(resolved)
    setPendingLegacy(null)
    setLegacyTarget('')
    setMessage(choice.kind === 'map'
      ? `Đã nhập và gán override cũ riêng cho ${choice.bomKey}.`
      : 'Đã nhập; override điện trở cũ được bỏ và từng biến thể giữ số lượng mặc định.')
  }

  function addComponent() {
    if (!componentToAdd) return
    const component = componentRegistry.find(item => item.id === componentToAdd)
    if (!component) return
    const defaultQuantity = Math.max(1, getKitInventory(bundle.lessonIds, bundle.stationCount).find(row => row.componentId === component.id)?.quantity ?? 1)
    updateBundle({ quantityOverrides: { ...bundle.quantityOverrides, [component.id]: defaultQuantity } })
    setComponentToAdd('')
  }

  function toggleLesson(lessonId: BuilderLessonId, checked: boolean) {
    if (!checked && bundle.lessonIds.length === 1) {
      setMessage('Giữ lại ít nhất một bài để kế hoạch và danh sách kit luôn hợp lệ.')
      return
    }
    const lessonIds = checked
      ? [...bundle.lessonIds, lessonId]
      : bundle.lessonIds.filter(id => id !== lessonId)
    updateBundle({ lessonIds })
  }

  return (
    <div className="classroom-kit-page">
      <header className="classroom-kit-hero">
        <div>
          <p className="eyebrow">LỚP HỌC · CHUẨN BỊ KIT</p>
          <h1>Lên kế hoạch lớp thực hành</h1>
          <p className="classroom-kit-intro">Chọn board, bài học và số trạm để tính danh sách dụng cụ dùng lại qua các buổi. Lưu trên thiết bị hoặc xuất gói để chia sẻ thủ công.</p>
        </div>
        <div className="classroom-kit-actions">
          <button type="button" className="secondary" onClick={() => window.print()}>In phiếu chuẩn bị</button>
          <button type="button" onClick={exportBundle}>Tải gói JSON</button>
          <button type="button" className="secondary" onClick={exportSharePack}>Tải gói chia sẻ</button>
          <button type="button" className="secondary" onClick={exportCsv}>Tải danh sách CSV</button>
          <button type="button" className="secondary" onClick={() => fileInput.current?.click()}>Nhập gói</button>
          <input ref={fileInput} className="classroom-kit-file" type="file" accept=".json,.csv,application/json,text/csv" onChange={importBundle} aria-label="Chọn tệp gói kit JSON hoặc CSV để nhập" />
        </div>
      </header>

      <p className="classroom-kit-status" role="status" aria-live="polite">{message || (storageRecovery ? 'Kế hoạch đang mở chưa được lưu; gói cũ được giữ nguyên.' : 'Kế hoạch được lưu cục bộ; chưa có tài khoản hoặc đồng bộ trực tuyến.')}</p>

      {storageRecovery && <section className="classroom-kit-privacy" role="alert" aria-labelledby="classroom-kit-storage-recovery-title">
        <span aria-hidden="true">!</span>
        <div>
          <strong id="classroom-kit-storage-recovery-title">Gói lớp học đã lưu chưa thể mở</strong>
          <p>{storageRecovery.reason} Dữ liệu gốc vẫn được giữ nguyên; kế hoạch mặc định bên dưới chưa ghi đè lên gói cũ. Tải bản sao nguyên trạng hoặc chủ động thay thế gói đã lưu bằng kế hoạch đang mở.</p>
          <div className="classroom-kit-actions">
            <button type="button" className="secondary" onClick={exportUnparsedSavedBundle}>Tải bản sao nguyên trạng</button>
            <button type="button" onClick={() => { setStorageRecovery(null); setMessage('Đang thay gói cũ bằng kế hoạch đang mở.') }}>Thay gói đã lưu bằng kế hoạch mới</button>
          </div>
        </div>
      </section>}

      {pendingLegacy && <section className="classroom-kit-privacy" aria-labelledby="legacy-override-title" role="group">
        <span aria-hidden="true">!</span>
        <div>
          <strong id="legacy-override-title">Cần xác nhận override điện trở trong tệp cũ</strong>
          <p>Gói cũ đặt số lượng {pendingLegacy.preview.quantity} cho cả họ điện trở. Bài đã chọn có {pendingLegacy.preview.variantKeys.length} biến thể có mã{pendingLegacy.preview.hasUnknownVariant ? ' và điện trở chưa rõ trị số' : ''}. Không áp số lượng này hàng loạt.</p>
          {pendingLegacy.preview.variantKeys.length > 0 && <label className="classroom-kit-field">Chỉ gán override cho biến thể này
            <select value={legacyTarget} onChange={event => setLegacyTarget(event.target.value)}>
              {pendingLegacy.preview.variantKeys.map(key => <option key={key} value={key}>{key}</option>)}
            </select>
          </label>}
          <div className="classroom-kit-actions">
            {pendingLegacy.preview.variantKeys.length > 0 && <button type="button" onClick={() => resolveLegacyImport({ kind: 'map', bomKey: legacyTarget })} disabled={!legacyTarget}>Gán riêng cho biến thể đã chọn</button>}
            <button type="button" className="secondary" onClick={() => resolveLegacyImport({ kind: 'leave-defaults' })}>Nhập, giữ mặc định từng biến thể</button>
            <button type="button" className="secondary" onClick={() => { setPendingLegacy(null); setMessage('Đã hủy nhập; kế hoạch hiện tại được giữ nguyên.') }}>Hủy nhập</button>
          </div>
        </div>
      </section>}

      <section className="classroom-kit-privacy" aria-labelledby="classroom-kit-privacy-title">
        <span aria-hidden="true">i</span>
        <div><strong id="classroom-kit-privacy-title">Kế hoạch cục bộ, không chứa hồ sơ học sinh</strong><p>Gói chia sẻ thủ công có board/revision, liên kết bài, nhãn mô phỏng, kit và lưu ý an toàn; không có tên, email, điểm số hay mã học sinh. Giấy phép chỉ áp dụng cấu hình bạn tạo, không đổi quyền ảnh/model/nội dung có sẵn. Tệp không được tải lên máy chủ; chưa có lớp nhiều người hay bảng tin trực tuyến.</p></div>
      </section>

      <div className="classroom-kit-grid">
        <section className="classroom-kit-card" aria-labelledby="classroom-kit-setup-title">
          <p className="eyebrow">01 · THIẾT LẬP</p>
          <h2 id="classroom-kit-setup-title">Thông tin buổi thực hành</h2>
          <label className="classroom-kit-field">Tên kế hoạch
            <input value={bundle.title} maxLength={100} onChange={event => updateBundle({ title: event.target.value })} onBlur={event => {
              const title = event.currentTarget.value.trim()
              updateBundle({ title: title || 'Bộ thực hành Mạch Mở' })
            }} />
          </label>
          <label className="classroom-kit-field">Board chính
            <select value={bundle.boardId} onChange={event => updateBundle({ boardId: event.target.value })}>
              {boards.map(board => <option key={board.id} value={board.id}>{board.name}{board.availability === 'preview' ? ' · tham khảo' : ''}</option>)}
            </select>
          </label>
          <label className="classroom-kit-field">Số trạm thực hành
            <input type="number" min={1} max={100} step={1} value={bundle.stationCount} onChange={event => {
              const value = Number(event.currentTarget.value)
              if (Number.isInteger(value) && value >= 1 && value <= 100) updateBundle({ stationCount: value })
            }} />
            <small>Từ 1 đến 100 trạm. Số lượng đề xuất tính cho cấu hình lớn nhất của một bài tại mỗi trạm.</small>
          </label>
          <label className="classroom-kit-field">Quyền chia sẻ cấu hình do bạn tạo
            <select value={bundle.configurationLicense} onChange={event => updateBundle({ configurationLicense: event.target.value as ClassroomKitBundle['configurationLicense'] })}>
              <option value="private">Giữ riêng tư</option>
              <option value="CC-BY-SA-4.0">CC BY-SA 4.0 · cho phép chia sẻ lại có ghi công</option>
            </select>
            <small>Lựa chọn này chỉ áp dụng cho file cấu hình xuất ra, không đổi giấy phép của model, ảnh hay nội dung bài học.</small>
          </label>
        </section>

        <section className="classroom-kit-card" aria-labelledby="classroom-kit-lessons-title">
          <p className="eyebrow">02 · NỘI DUNG</p>
          <h2 id="classroom-kit-lessons-title">Chọn bài cho lớp</h2>
          <fieldset className="classroom-kit-lessons">
            <legend>Bài học cần chuẩn bị</legend>
            {curriculumLessons.map(lesson => <label className="classroom-kit-lesson" key={lesson.id}>
              <input type="checkbox" checked={bundle.lessonIds.includes(lesson.id)} onChange={event => toggleLesson(lesson.id, event.currentTarget.checked)} />
              <span><strong>{lesson.title}</strong><small>{lesson.durationMinutes} phút · {lesson.level}</small></span>
            </label>)}
          </fieldset>
        </section>
      </div>

      <section className="classroom-kit-card classroom-kit-inventory" aria-labelledby="classroom-kit-inventory-title">
        <div className="classroom-kit-section-heading">
          <div><p className="eyebrow">03 · DANH SÁCH DỤNG CỤ</p><h2 id="classroom-kit-inventory-title">Kit cần chuẩn bị</h2><p>Ước lượng cho bài có nhu cầu lớn nhất, không cộng dồn các buổi học. Bạn có thể sửa số lượng trước khi xuất.</p></div>
          <span className="classroom-kit-count">{inventory.length} loại · {bundle.stationCount} trạm</span>
        </div>
        {inventory.length ? <div className="classroom-kit-table-wrap"><table>
          <thead><tr><th scope="col">Linh kiện / board</th><th scope="col">Số lượng tổng</th><th scope="col">Thao tác</th></tr></thead>
          <tbody>{inventory.map(row => <tr key={row.componentId}>
            <th scope="row">{row.label}<small>{row.kind === 'board' ? boards.find(board => board.id === bundle.boardId)?.revision ?? 'Chưa ghi revision' : row.note ?? 'Linh kiện thực hành · đối chiếu đúng trị số và package'}</small></th>
            <td>{row.kind !== 'component' ? <span className="classroom-kit-fixed-quantity">{row.quantity}{row.kind === 'board' ? ' board · 1/trạm' : ' · ước lượng theo số trạm'}</span> : <label className="classroom-kit-quantity"><span className="visually-hidden">Số lượng {row.label}</span><input type="number" min={1} max={9999} step={1} value={row.quantity} onChange={event => { const value = Number(event.currentTarget.value); if (Number.isInteger(value) && value >= 1 && value <= 9999) row.bomKey ? setVariantQuantity(row, value) : setQuantity(row.componentId, value) }} /></label>}</td>
            <td>{row.kind === 'component' && <button className="classroom-kit-remove" type="button" onClick={() => {
              if (row.bomKey) {
                const variantOverrides = { ...bundle.variantOverrides }
                delete variantOverrides[row.bomKey]
                updateBundle({ schemaVersion: Object.keys(variantOverrides).length ? 2 : 1, variantOverrides })
              } else {
                const quantityOverrides = { ...bundle.quantityOverrides }
                delete quantityOverrides[row.componentId]
                updateBundle({ quantityOverrides })
              }
            }}>Dùng mặc định</button>}</td>
          </tr>)}</tbody>
        </table></div> : <p className="classroom-kit-empty">Chọn bài học để tạo danh sách kit đề xuất.</p>}
        <div className="classroom-kit-add-row">
          <label htmlFor="classroom-kit-add-component">Thêm linh kiện tùy chọn</label>
          <select id="classroom-kit-add-component" value={componentToAdd} onChange={event => setComponentToAdd(event.target.value)}>
            <option value="">Chọn từ thư viện linh kiện</option>
            {remainingComponents.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <button type="button" className="secondary" disabled={!componentToAdd} onClick={addComponent}>Thêm vào kit</button>
        </div>
      </section>

      <section className="classroom-kit-card classroom-kit-safety" aria-labelledby="classroom-kit-safety-title">
        <p className="eyebrow">04 · CHECKLIST TRƯỚC BUỔI HỌC</p>
        <h2 id="classroom-kit-safety-title">Lưu ý cho board và các bài đã chọn</h2>
        <ul>
          <li>Kiểm tra đúng biến thể và revision của board; tên cùng dòng sản phẩm không đảm bảo pinout hoặc linh kiện giống hệt.</li>
          <li>Ngắt nguồn trước khi thay dây. Thử một trạm trước khi phát kit cho cả lớp.</li>
          <li>Không xem mô hình CAD, kiểm tra heuristic hay SPICE analog là phép kiểm chứng phần cứng hoặc firmware.</li>
          {safetyNotes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}
        </ul>
      </section>

      <section className="classroom-kit-next" aria-labelledby="classroom-kit-next-title">
        <div><p className="eyebrow">BƯỚC TIẾP THEO</p><h2 id="classroom-kit-next-title">Chuẩn bị từng trạm</h2><p>Mở bài học để xem sơ đồ, cảnh 3D và lưu ý của board đã chọn. Model trong web là tài liệu tham khảo; cần đối chiếu revision và phần cứng thật trước khi lắp.</p></div>
        <Link to={`/app/learn/${encodeURIComponent(bundle.lessonIds[0])}?board=${encodeURIComponent(bundle.boardId)}`}>Mở bài học với board này <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  )
}
