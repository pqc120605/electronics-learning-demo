import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { components } from '../data/components'
import { ComponentVisual } from '../components/ComponentVisual'
import { ComponentReferencePhotoGallery } from '../components/ComponentReferencePhotoGallery'
import { componentSourceLevels, getComponentReferences, getComponentSourceLevel } from '../data/componentReferences'
import { CapabilityBadge, CapabilityLegend } from '../components/CapabilityBadge'
import { getCatalogModel, getLessonsUsingComponent, resolveComponentLink } from '../lib/componentCatalog'
import { useProductRoute } from '../lib/useProductRoute'

const componentIds = components.map((part) => part.id)
const groups = ['Tất cả', ...Array.from(new Set(components.map((part) => part.category)))]
function getComponentCapability(componentId: string) {
  const model = getCatalogModel(componentId)
  if (!model) return { model, capabilityId: 'catalog-only' as const }
  if (model.simulation === 'supported') return { model, capabilityId: 'present-in-sample' as const }
  return { model, capabilityId: 'visual-reference' as const }
}

export function ComponentsPage() {
  const productRoute = useProductRoute()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('Tất cả')
  const [referenceFilter, setReferenceFilter] = useState<'all' | 'product' | 'general'>('all')
  const hasActiveFilters = Boolean(query.trim()) || group !== 'Tất cả' || referenceFilter !== 'all'
  const link = resolveComponentLink(searchParams.get('component'), componentIds)
  const list = useMemo(() => components.filter((part) => {
    const hasProductSource = getComponentSourceLevel(part.id) !== 'general'
    return (group === 'Tất cả' || part.category === group)
      && (referenceFilter === 'all' || (referenceFilter === 'product' ? hasProductSource : !hasProductSource))
      && `${part.name} ${part.summary} ${part.tags.join(' ')}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))
  }), [group, query, referenceFilter])
  const current = components.find((part) => part.id === link.id)!
  const capability = getComponentCapability(current.id)
  const references = getComponentReferences(current.id)
  const referencePhotos = references.flatMap((reference) => reference.photos ?? [])
  const detailHeadingRef = useRef<HTMLHeadingElement>(null)
  /** In the one-column layout the detail sits below a long list, so it has to be brought into view. */
  const revealDetail = () => {
    if (!window.matchMedia('(max-width: 950px)').matches) return
    detailHeadingRef.current?.closest('article')?.scrollIntoView({ block: 'start', behavior: 'instant' })
    detailHeadingRef.current?.focus({ preventScroll: true })
  }
  useEffect(() => { if (link.status === 'found') revealDetail() }, [])
  const selectComponent = (id: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('component', id)
    setSearchParams(next, { replace: true })
    revealDetail()
  }
  return <div className="catalog-page">
    <section className="catalog-page-heading"><p className="eyebrow">THƯ VIỆN · LINH KIỆN</p><h1>Linh kiện để thử và hiểu</h1><p>Tìm theo tên hoặc chức năng. Mỗi thẻ giải thích vai trò, chân thường gặp và điều cần kiểm tra trước khi nối. Pinout module có thể thay đổi theo nhà sản xuất.</p><div className="catalog-actions"><Link className="button-primary" to={productRoute('/build')}>Thử trong phòng lắp mạch ↗</Link><Link to={productRoute('/boards')}>Chọn board →</Link></div><small className="catalog-reference-note">Thẻ linh kiện là tài liệu tham khảo; hành vi mô phỏng chỉ có ở một số bài mẫu.</small><CapabilityLegend ids={['present-in-sample', 'visual-reference']} title="Cách đọc mức hỗ trợ linh kiện" /></section>
    <section className="content-section catalog-page-section">
      <div className="catalog-controls"><label className="catalog-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Ví dụ: cảm biến, điện trở, I²C…" aria-label="Tìm linh kiện" /></label><div className="catalog-filters" role="group" aria-label="Lọc loại linh kiện">{groups.map((g) => <button key={g} type="button" aria-pressed={g === group} className={g === group ? 'catalog-filter-active' : ''} onClick={() => setGroup(g)}>{g}</button>)}</div>{hasActiveFilters && <button className="catalog-reset" type="button" onClick={() => { setQuery(''); setGroup('Tất cả'); setReferenceFilter('all') }}>Xóa bộ lọc</button>}</div>
      <div className="component-reference-filters" role="group" aria-label="Lọc theo tài liệu nguồn">{([{ id: 'all', label: 'Mọi mức nguồn' }, { id: 'product', label: 'Có nguồn sản phẩm hoặc chip' }, { id: 'general', label: 'Chỉ có hướng dẫn chung' }] as const).map((option) => <button key={option.id} type="button" aria-pressed={referenceFilter === option.id} className={referenceFilter === option.id ? 'catalog-filter-active' : ''} onClick={() => setReferenceFilter(option.id)}>{option.label}</button>)}</div>
      <p className="catalog-hint" aria-live="polite">{list.length} mục trong bộ lọc · {components.filter((part) => getComponentSourceLevel(part.id) !== 'general').length} mục có nguồn sản phẩm hoặc chip · Thông số module cụ thể vẫn cần đối chiếu đúng datasheet.{!list.some((part) => part.id === current.id) && ` “${current.name}” đang xem nằm ngoài bộ lọc này.`}</p>
      {link.status === 'unknown' && <p className="board-reference-warning" role="status">Không tìm thấy linh kiện trong liên kết. Trang đang hiện {current.name}.</p>}
      <div className="component-catalog-layout"><div className="component-catalog-list">{list.map((part) => <button type="button" aria-pressed={part.id === current.id} className={`component-catalog-item ${part.id === current.id ? 'component-catalog-item-active' : ''}`} key={part.id} onClick={() => selectComponent(part.id)}><span className="component-category-icon" aria-hidden="true">{part.category === 'MCU' ? 'µC' : part.category === 'Cảm biến' ? '↗' : part.category === 'Đầu vào' ? '⊙' : part.category === 'Linh kiện cơ bản' ? 'Ω' : part.category === 'Hiển thị' ? '▤' : part.category === 'Cơ điện' ? '⟳' : part.category === 'Nguồn' ? '⏚' : '◇'}</span><span><strong>{part.name}</strong><small>{part.category} · {part.tags.slice(0,3).join(' · ')}</small></span><span className={`component-source-state ${getComponentSourceLevel(part.id) !== 'general' ? 'has-reference' : ''}`}>{componentSourceLevels[getComponentSourceLevel(part.id)].label}</span></button>)}{!list.length && <p className="catalog-empty">Không có kết quả. Hãy thử từ khóa hoặc trạng thái nguồn khác.</p>}</div>
      <article className="component-catalog-detail"><p className="eyebrow">{current.category.toUpperCase()}</p><ComponentVisual key={current.id} illustrationId={current.id} modelId={capability.model?.id} name={current.name} showModelStatus boardModelHref={current.boardViewerRoute ? productRoute(current.boardViewerRoute) : undefined}/><h2 ref={detailHeadingRef} tabIndex={-1}>{current.name}</h2><CapabilityBadge id={capability.capabilityId} /><p className="component-summary">{current.summary}</p><ComponentReferencePhotoGallery photos={referencePhotos}/><dl><div><dt>Chân thường gặp</dt><dd>{current.pins}</dd></div><div><dt>Dùng để làm gì?</dt><dd>{current.use}</dd></div><div className="component-safety"><dt>Điểm cần lưu ý</dt><dd>{current.caution}</dd></div></dl><div className="component-capability"><strong>Trong workspace</strong><p>{capability.model?.explanation ?? 'Chưa có mô hình linh kiện tương ứng trong workspace.'}</p>{capability.model && <p>Chân mô hình: {capability.model.pins.map((item) => `${item.label} (${item.id})`).join(' · ')}</p>}</div><section className="component-lessons" aria-labelledby="component-lessons-title"><h3 id="component-lessons-title">Dùng trong bài</h3>{getLessonsUsingComponent(current.id).length ? <ul>{getLessonsUsingComponent(current.id).map((lesson) => <li key={lesson.id}><Link to={productRoute(lesson.route)}>{lesson.title}</Link></li>)}</ul> : <p>Chưa có bài nào dùng linh kiện này.</p>}</section><section className="component-references" aria-labelledby="component-references-title"><h3 id="component-references-title">Tài liệu tham khảo</h3><p><strong>{componentSourceLevels[getComponentSourceLevel(current.id)].label}.</strong> {componentSourceLevels[getComponentSourceLevel(current.id)].note}</p>{references.length ? <ul>{references.map((reference) => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label} ↗</a><span>{reference.kind} · {reference.note}</span></li>)}</ul> : <p>Chưa gắn tài liệu cho đúng mã linh kiện/module này. Hãy đối chiếu datasheet của nhà sản xuất trước khi đấu phần cứng.</p>}</section><div className="component-tags">{current.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>{current.boardProfileRoute && <Link className="button-secondary" to={productRoute(current.boardProfileRoute)}>Xem hồ sơ board ↗</Link>}<Link className="button-secondary" to={productRoute('/build')}>Thử trong bàn lắp mạch ↗</Link></article></div>
    </section>
  </div>
}
