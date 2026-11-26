import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CatalogBreadboardExplorer } from '../components/CatalogBreadboardExplorer'
import { CatalogPartExplorer } from '../components/CatalogPartExplorer'
import { ComponentVisual } from '../components/ComponentVisual'
import { ComponentReferencePhotoGallery } from '../components/ComponentReferencePhotoGallery'
import { componentSourceLevels, getComponentReferences, getComponentSourceLevel } from '../data/componentReferences'
import { CapabilityBadge, CapabilityLegend } from '../components/CapabilityBadge'
import { getCatalogModel, getLessonsUsingComponent } from '../lib/componentCatalog'
import { useProductRoute } from '../lib/useProductRoute'
import { matchesCatalogSearch } from '../lib/catalogSearch'
import { getFreestylePartId } from '../lib/catalogPracticeLinks'
import { freestyleSamples } from '../lib/freestyle/freestyleSampleLibrary'
import { spicePractices } from '../simulation/spicePractice'
import { digitalLabLessons } from '../data/digitalLabLessons'
import { GuideContextBridge } from '../components/guide/GuideContext'
import { catalogGroups, groupLabel, partsGallery } from '../data/partsGallery'
import './ComponentsPage.css'

type Part = (typeof partsGallery)[number]

function PartThumbnail({ item }: { item: Part }) {
  if (item.preview) return <img className="parts-thumbnail-image" src={item.preview} alt="" loading="lazy" decoding="async" />
  return <div className={'parts-package parts-package--' + (item.illustration?.family ?? 'chip')} aria-hidden="true">
    <span className="parts-package-body">{item.illustration?.code}</span>
  </div>
}

function PartDetail({ item, backHref }: { item: Part; backHref: string }) {
  const productRoute = useProductRoute()
  const current = item.part
  const { variant, breadboard } = item
  const model = getCatalogModel(current.id)
  const capabilityId = model?.simulation === 'supported' ? 'present-in-sample'
    : model || current.boardViewerRoute ? 'visual-reference' : 'catalog-only'
  const freestylePartId = getFreestylePartId(current.id)
  const practiceSamples = freestyleSamples.filter(sample => sample.parts.some(id => id === current.id))
  const analogPractices = spicePractices.filter(practice => practice.parts.includes(current.id))
  const digitalPractices = digitalLabLessons.filter(lesson => lesson.parts.some(id => id === current.id))
  const lessons = getLessonsUsingComponent(current.id)
  const source = componentSourceLevels[getComponentSourceLevel(current.id)]
  const references = getComponentReferences(current.id)
  const referencePhotos = references.flatMap((reference) => reference.photos ?? [])
  const detailHeadingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    detailHeadingRef.current?.focus({ preventScroll: true })
  }, [current.id])
  return <>
    <GuideContextBridge snapshot={{ owner: 'component-library', priority: 60,
      part: { id: current.id, type: current.id, name: current.name, summary: current.summary, pins: [current.pins], note: current.caution },
      status: 'Hồ sơ tham khảo của linh kiện' }} />
    <Link className="parts-back" to={backHref}>← Quay lại kho linh kiện</Link>
    <article className="component-catalog-detail parts-detail">
      <p className="eyebrow">{groupLabel(item.group)}</p>
      <h1 ref={detailHeadingRef} tabIndex={-1}>{current.name}</h1>
      <CapabilityBadge id={analogPractices.length ? 'electrical-simulation' : digitalPractices.length || breadboard || variant?.simulation === 'digital' ? 'present-in-sample' : capabilityId} />
      <p className="component-summary">{current.summary}</p>
      {(breadboard || freestylePartId) && <Link className="component-freestyle-link"
        to={productRoute('/build/freestyle?' + new URLSearchParams(breadboard ? {breadboard:breadboard.catalogId,resume:'1'} : {part:freestylePartId!}))}>
        Lắp thử trên bàn tự do <span aria-hidden="true">↗</span>
      </Link>}
      <div className="parts-detail-layout">
        <div>
          {breadboard ? <CatalogBreadboardExplorer key={breadboard.spec} profile={breadboard} /> : variant ? <CatalogPartExplorer key={variant.id} id={variant.id} /> : item.isNewReference ? <figure className="parts-detail-preview">
            <div className="parts-thumbnail"><PartThumbnail item={item} /></div>
            <figcaption>Minh họa dạng linh kiện. Xem dạng vỏ và chân trong tài liệu hãng.</figcaption>
          </figure> : <ComponentVisual key={current.id} illustrationId={current.id} modelId={model?.id}
            name={current.name} showModelStatus boardModelHref={current.boardViewerRoute ? productRoute(current.boardViewerRoute) : undefined} />}
          <ComponentReferencePhotoGallery photos={referencePhotos} />
        </div>
        <div>
          <dl>
            <div><dt>Chân và kết nối</dt><dd>{breadboard ? (breadboard.railHoles ? 'Bốn rail độc lập, mỗi rail 50 lỗ. Hai dải 5 lỗ mỗi cột.' : 'Hai dải 5 lỗ mỗi cột, 17 cột.') : variant ? variant.pins.map(pin => pin.pad + ' · ' + pin.label).join(', ') : current.pins}</dd></div>
            <div><dt>{item.isNewReference ? 'Điều kiện sử dụng' : 'Ứng dụng'}</dt><dd>{current.use}</dd></div>
            {!item.isNewReference && <div className="component-safety"><dt>Lưu ý</dt><dd>{current.caution}</dd></div>}
          </dl>
          {model && <div className="component-capability">
            <strong>Trong bàn lắp mạch</strong>
            <p>{model.explanation}</p>
            <p>Chân mô hình: {model.pins.map(({ label, id }) => label + ' (' + id + ')').join(' · ')}</p>
          </div>}
          {lessons.length > 0 && <section className="component-lessons" aria-labelledby="component-lessons-title">
            <h2 id="component-lessons-title">Dùng trong bài</h2>
            <ul>{lessons.map((lesson) => <li key={lesson.id}><Link to={productRoute(lesson.route)}>{lesson.title}</Link></li>)}</ul>
          </section>}
          {(practiceSamples.length + (variant ? 0 : analogPractices.length) + digitalPractices.length > 0) &&
            <section className="component-lessons" aria-labelledby="component-practice-title">
              <h2 id="component-practice-title">Mạch mẫu dùng linh kiện này</h2>
              <ul>
                {practiceSamples.map((sample) => <li key={sample.id}>
                  <Link to={productRoute('/build/freestyle?' + new URLSearchParams({ resume: '1', sample: sample.id }))}>{sample.title}</Link>
                </li>)}
                {analogPractices.map((practice) => <li key={practice.id}>
                  <Link to={productRoute('/tools/spice?' + new URLSearchParams({ lab: practice.id }))}>{practice.name} · SPICE</Link>
                </li>)}
                {digitalPractices.map((lesson) => <li key={lesson.id}>
                  <Link to={productRoute('/learn/digital-lab?' + new URLSearchParams({ lab: lesson.id }))}>{lesson.name} · Thực hành</Link>
                </li>)}
              </ul>
            </section>}
          <section className="component-references" aria-labelledby="component-references-title">
            <h2 id="component-references-title">Tài liệu tham khảo</h2>
            <p><strong>{source.label}.</strong> {source.note}</p>
            {references.length ? <ul>{references.map((reference) => <li key={reference.url}>
              <a href={reference.url} target="_blank" rel="noreferrer">{reference.label} ↗</a>
              <span>{reference.kind} · {reference.note}</span>
            </li>)}</ul> : <p>Hãy tra datasheet của đúng mã linh kiện hoặc module trước khi đấu phần cứng.</p>}
          </section>
          {current.boardProfileRoute && <Link className="button-secondary" to={productRoute(current.boardProfileRoute)}>Xem hồ sơ board ↗</Link>}
        </div>
      </div>
    </article>
  </>
}

export function ComponentsPage() {
  const productRoute = useProductRoute()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const group = catalogGroups.find((category) => category === searchParams.get('group')) ?? ''
  const source = searchParams.get('source') ?? ''
  const practice = searchParams.get('practice') === '1'
  const componentId = searchParams.get('component')
  const detail = partsGallery.find(({ part }) => part.id === componentId)
  const filters = new URLSearchParams(searchParams)
  filters.delete('component')
  const galleryHref = productRoute('/components' + (filters.size ? '?' + filters : ''))
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(filters)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }
  const results = partsGallery.filter(({ part, variant, group: category, productSource, hasPractice }) =>
    (!group || group === category)
    && (source === 'product' ? productSource : source === 'general' ? !productSource : true)
    && (!practice || hasPractice)
    && matchesCatalogSearch([part.id, part.name, variant?.mpn, part.summary, part.use, ...part.tags].join(' '), query),
  )

  if (detail) return <div className="catalog-page parts-library"><PartDetail item={detail} backHref={galleryHref} /></div>
  return <div className="catalog-page parts-library">
    <header className="parts-header">
      <div><h1>Kho linh kiện</h1><p>Tra mã linh kiện, mở tài liệu hãng và tìm bài thực hành liên quan.</p></div>
      <Link className="button-primary" to={productRoute('/build')}>Mở bàn lắp mạch <span aria-hidden="true">↗</span></Link>
    </header>
    <section className="parts-controls" aria-label="Tìm và lọc linh kiện">
      <label className="parts-search">
        <input type="search" aria-label="Tìm linh kiện" placeholder="Tìm theo tên hoặc mã, ví dụ 74HC08…"
          value={query} onChange={(event) => update('q', event.target.value)} />
      </label>
      <label className="parts-field">Nhóm
        <select value={group} onChange={(event) => update('group', event.target.value)} aria-label="Nhóm linh kiện">
          <option value="">Tất cả nhóm</option>
          {catalogGroups.map((category) => <option key={category} value={category}>{groupLabel(category)}</option>)}
        </select>
      </label>
      <label className="parts-field">Nguồn
        <select value={source} onChange={(event) => update('source', event.target.value)} aria-label="Nguồn tài liệu">
          <option value="">Tất cả nguồn</option>
          <option value="product">Có tài liệu hãng</option>
          <option value="general">Hướng dẫn tham khảo</option>
        </select>
      </label>
      <div className="parts-results">
        <output aria-live="polite">{results.length === partsGallery.length ? partsGallery.length : results.length + ' / ' + partsGallery.length} linh kiện</output>
        {(query || group || source || practice) && <button type="button" onClick={() => setSearchParams({}, { replace: true })}>Xóa bộ lọc</button>}
      </div>
      <label className="parts-practice-filter">
        <input type="checkbox" checked={practice} onChange={(event) => update('practice', event.target.checked ? '1' : '')} />
        Có bài thực hành
      </label>
    </section>
    {componentId && <p className="board-reference-warning" role="status">Không tìm thấy linh kiện trong liên kết.</p>}
    <div className="component-catalog-list parts-gallery">
      {catalogGroups.map((category, index) => {
        const items = results.filter((item) => item.group === category)
        if (!items.length) return null
        const titleId = 'parts-group-' + index
        return <section key={category} className="parts-group" aria-labelledby={titleId}>
          <h2 id={titleId}>{groupLabel(category)} <span>{items.length}</span></h2>
          <ul>{items.map((item) => {
            const next = new URLSearchParams(filters)
            next.set('component', item.part.id)
            const availability = item.canBuild ? 'Lắp mạch'
              : item.hasPractice ? 'Có bài thực hành' : item.part.boardViewerRoute ? 'Xem board' : 'Tra cứu'
            return <li key={item.part.id}>
              <Link className="parts-card" to={productRoute('/components?' + next)}>
                <div className="parts-thumbnail"><PartThumbnail item={item} /></div>
                <div className="parts-card-body">
                  <strong>{item.part.name}</strong>
                  <span className="parts-card-status" data-active={item.canBuild || item.hasPractice}>{availability}</span>
                </div>
              </Link>
            </li>
          })}</ul>
        </section>
      })}
      {!results.length && <p className="catalog-empty">Không tìm thấy linh kiện phù hợp. Thử mã khác hoặc xóa bộ lọc.</p>}
    </div>
    <footer className="parts-notes">
      <p>Ảnh thẻ minh họa hình dáng linh kiện. Tra tài liệu hãng để xác định mã, phiên bản và chân khi lắp thật. <a href="/component-catalog/NOTICE.txt">Nguồn ảnh dựng</a>.</p>
      <CapabilityLegend ids={['catalog-only', 'present-in-sample', 'visual-reference', 'electrical-simulation']} title="Cách đọc mức hỗ trợ linh kiện" />
    </footer>
  </div>
}
