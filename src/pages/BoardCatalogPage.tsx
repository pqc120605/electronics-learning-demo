import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { boards } from '../data/boards'
import { getBoardCapability } from '../data/boardCapabilityRegistry'
import { BoardComparison } from '../components/BoardComparison'
import { BoardProfile } from '../components/board/BoardProfile'
import { BoardViewer } from '../components/board/BoardViewer'
import { BoardModelEvidencePanel } from '../components/board/BoardModelEvidencePanel'
import { BoardPinoutExplorer } from '../components/board/BoardPinoutExplorer'
import { BoardAuxConnectors } from '../components/board/BoardAuxConnectors'
import { getAnchoredAuxPins, getBoardAuxConnectors } from '../lib/boardAuxConnectors'
import { a2BoardId, a2FixtureId } from '../lib/freestyle/a2C3Fixture'
import { canOpenFirmwareFixture } from '../lib/freestyle/firmwareDelivery'
import { getA3Board } from '../lib/freestyle/a3EspProfiles'
import { getA4Board } from '../lib/freestyle/a4EspProfiles'
import { getA5Board } from '../lib/freestyle/a5PicoProfiles'
import { getA6Board } from '../lib/freestyle/a6PicoProfiles'
import { getA7Board } from '../lib/freestyle/a7Stm32Profiles'
import { getA8Board } from '../lib/freestyle/a8Ra4m1Profiles'
import { getA9Board } from '../lib/freestyle/a9Stm32Profiles'
import { getA10Board } from '../lib/freestyle/a10AvrRuntime'
import { getA11Board } from '../lib/freestyle/a11EspRuntime'
import { getA12Board } from '../lib/freestyle/a12Profiles'
import type { BoardModelManifest } from '../components/board/boardSceneTypes'
import { getBoardModelEvidence } from '../data/boardModelSources'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import { simulationTargets } from '../data/simulationTargets'
import { CapabilityLegend } from '../components/CapabilityBadge'
import { BoardCatalogMedia } from '../components/board/BoardCatalogMedia'
import { getBoardReferenceDiagram, getBoardPinoutSource } from '../lib/boardCatalogMedia'
import { useProductRoute } from '../lib/useProductRoute'
import { getFreestyleBoardId } from '../lib/catalogPracticeLinks'
import { getBoardCatalogView, resolveBoardLink } from '../lib/boardCatalogView'
import { formatBoardModelStats, getBoardModelStats, getFeatureEvidence } from '../lib/boardFeatureEvidence'
import { getDefaultBoardFeatureId } from '../lib/boardSelection'
import { getCadViewerDownloadLabel } from '../lib/boardModelDownload'
import { getDocumentedPinForNet } from '../lib/boardPadPinout'
import { canExploreBoardPinout } from '../lib/boardPinoutPresentation'
import { matchesCatalogSearch } from '../lib/catalogSearch'
import { getBoardTopView } from '../lib/boardTopView'
import { boardCatalogModelIds as cadBoardIds, loadBoardCatalogModel } from '../lib/boardCatalogModels'
import './BoardCatalogPage.css'

const BoardTopInspector = lazy(() => import('../components/board/BoardTopInspector'))
const Pcb2DViewer = lazy(() => import('../components/pcb/Pcb2DViewer').then(({ Pcb2DViewer }) => ({ default: Pcb2DViewer })))
const knownBoardIds = new Set(boards.map((board) => board.id))
const labBoardIds = new Set(simulationTargets.map((target) => target.boardId))

import { GuideContextBridge } from '../components/guide/GuideContext'

export function BoardCatalogPage() {
  const productRoute = useProductRoute()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('Tất cả')
  const [compare, setCompare] = useState<string[]>(['arduino-uno-r3', 'esp32-devkit'])
  const [hoveredCadFeatureId, setHoveredCadFeatureId] = useState('')
  const [loadedModel, setLoadedModel] = useState<{ boardId: string; manifest?: BoardModelManifest }>()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const filtered = useMemo(() => boards.filter((board) => {
    const text = `${board.id} ${board.name} ${board.mcu ?? ''} ${board.revision ?? ''} ${board.description}`
    return (family === 'Tất cả' || board.platform === family) && matchesCatalogSearch(text, query)
  }), [family, query])
  const selected = boards.filter((board) => compare.includes(board.id))
  const requestedBoardId = searchParams.get('board')
  const isDetail = Boolean(requestedBoardId || searchParams.get('view') || searchParams.get('feature') || searchParams.get('pin'))
  const catalogHref = productRoute('/boards')
  const link = resolveBoardLink(requestedBoardId, knownBoardIds, cadBoardIds, 'esp32-devkit')
  const activeBoard = boards.find((board) => board.id === link.boardId)!
  const activeFreestyleBoardId = getFreestyleBoardId(activeBoard.id)
  const loadModel = isDetail && link.boardId !== 'esp32-devkit' && cadBoardIds.has(link.boardId)
  const baseManifest = isDetail && link.boardId === 'esp32-devkit' ? esp32DevkitModel
    : loadedModel?.boardId === link.boardId ? loadedModel.manifest : undefined
  const auxSelected = searchParams.get('pin')?.startsWith('aux-') === true
  const manifest = useMemo(() => baseManifest && auxSelected && baseManifest.pinPicking
    ? { ...baseManifest, pins: [...baseManifest.pins, ...getAnchoredAuxPins(activeBoard.id, activeBoard.revision ?? activeBoard.name)] }
    : baseManifest, [activeBoard.id, activeBoard.name, activeBoard.revision, auxSelected, baseManifest])
  const auxGroups = useMemo(() => getBoardAuxConnectors(activeBoard.id), [activeBoard.id])
  const modelLoadFailed = loadedModel?.boardId === link.boardId && !manifest
  useEffect(() => {
    if (!loadModel) return
    const boardId = link.boardId
    let active = true
    void loadBoardCatalogModel(boardId).then(
      manifest => { if (active) setLoadedModel({ boardId, manifest }) },
      () => { if (active) setLoadedModel({ boardId }) },
    )
    return () => { active = false }
  }, [link.boardId, loadModel])
  const topView = getBoardTopView(activeBoard.id)
  const firmwareAvailable = canOpenFirmwareFixture()
  const a9Board = getA9Board(activeBoard.id)
  const a10Board = getA10Board(activeBoard.id)
  const a11Board = getA11Board(activeBoard.id)
  const a12Board = getA12Board(activeBoard.id)
  // Blue Pill coordinates apply to the approved educational reconstruction.
  const bluePillTopMatches = a9Board && topView?.assetSha256 === a9Board.boardEvidence.model.sha256
    && topView.imageSha256 === a9Board.boardEvidence.topView.sha256
  const hasTopInspector = (manifest?.pinPicking === true || activeBoard.id === 'esp32-devkit')
    && (activeBoard.id !== 'stm32-blue-pill-f103' || bluePillTopMatches)
  const diagram = getBoardReferenceDiagram(activeBoard)
  const pinoutSource = getBoardPinoutSource(activeBoard)
  const requestedView = searchParams.get('view')
  const canView3D = cadBoardIds.has(activeBoard.id)
  const canViewCopper = getBoardCatalogView(activeBoard.id, '2d') === '2d'
  const activeView = requestedView === 'top' && topView ? 'top'
    : requestedView === '2d' && canViewCopper ? '2d'
    : canView3D && (requestedView === '3d' || (!requestedView && searchParams.has('feature'))) ? '3d'
    : requestedView === 'pins' || (!requestedView && searchParams.has('pin')) ? 'pins'
    : 'overview'
  const featureById = (id: string | null) => manifest?.features.find((feature) => feature.id === id)
  const activeFeature = featureById(searchParams.get('feature')) ?? featureById(getDefaultBoardFeatureId(activeBoard.id)) ?? manifest?.features[0]
  const selectedPinId = manifest?.pins.find((pin) => pin.id === searchParams.get('pin'))?.id ?? ''
  const shownFeature = featureById(hoveredCadFeatureId) ?? activeFeature
  const evidence = getBoardModelEvidence(activeBoard.id)
  const documentedPinMap = useMemo(() => getBoardCapability(activeBoard.id, manifest?.pins).pinMap, [activeBoard.id, manifest?.pins])
  const a3Board = getA3Board(activeBoard.id)
  const a4Board = getA4Board(activeBoard.id)
  const a5Board = getA5Board(activeBoard.id)
  const a6Board = getA6Board(activeBoard.id)
  const a7Board = getA7Board(activeBoard.id)
  const a8Board = getA8Board(activeBoard.id)
  useEffect(() => { setHoveredCadFeatureId('') }, [link.boardId])
  useEffect(() => {
    if (!isDetail) return
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [isDetail, link.boardId])
  const updateQuery = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) { if (value === null) next.delete(key); else next.set(key, value) }
    setSearchParams(next, { replace: true })
  }
  const toggle = (id: string) => setCompare((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current)
  const detailViews = [
    { id: 'overview', label: 'Tổng quan', visible: true },
    { id: 'pins', label: 'Chân và linh kiện', visible: true },
    { id: 'top', label: 'Mặt board 2D', visible: Boolean(topView) },
    { id: '3d', label: 'PCB 3D', visible: canView3D },
    { id: '2d', label: 'Lớp đồng PCB 2D', visible: canViewCopper },
  ]

  return <div className="catalog-page board-library">
    {isDetail && <GuideContextBridge snapshot={{ owner: 'board-library', priority: 60,
      board: { id: activeBoard.id, name: activeBoard.name, reference: link.status === 'unknown' },
      part: activeFeature ? { id: activeFeature.id, type: 'board-feature', name: activeFeature.name, summary: activeFeature.plainDescription,
        pins: selectedPinId ? [selectedPinId] : [], note: activeFeature.safetyNote } : undefined,
      status: activeBoard.modelNote ?? activeBoard.description,
      issues: link.status === 'unknown' ? ['Không tìm thấy board trong liên kết; đang hiện board tham chiếu.'] : [] }} />}
    {isDetail ? <section className="catalog-page-section board-detail-section">
      <Link className="board-catalog-back" to={catalogHref}>← Quay lại thư viện board</Link>
      <section className="board-cad-viewer" aria-labelledby="board-cad-viewer-title">
        {link.status === 'unknown' && <p className="board-reference-warning board-link-notice" role="status">Không tìm thấy board trong liên kết. Trang đang hiện {activeBoard.name}.</p>}
        <div className="board-cad-viewer-heading">
          <div>
            <h1 id="board-cad-viewer-title" ref={headingRef} tabIndex={-1}>{canView3D ? `Khám phá ${activeBoard.name}` : `Hồ sơ ${activeBoard.name}`}</h1>
            <p>{activeBoard.description}</p>
          </div>
          <div className="board-cad-viewer-actions">
            {a9Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a9Board.fixtureId}`)}>Mở mạch nút nhấn và LED A9 ↗</Link>}
            {a10Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a10Board.fixtureId}`)}>Mở mạch nút nhấn và LED A10 ↗</Link>}
            {a12Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a12Board.fixtureId}`)}>Mở mạch nút nhấn và LED A12 ↗</Link>}
            {a11Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a11Board.fixtureId}`)}>Mở mạch nút nhấn và LED A11 ↗</Link>}
            {a8Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a8Board.fixtureId}`)}>Mở mạch nút nhấn và LED A8 ↗</Link>}
            {a7Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a7Board.fixtureId}`)}>Mở mạch nút nhấn và LED A7 ↗</Link>}
            {a6Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a6Board.fixtureId}`)}>Mở mạch nút nhấn và LED A6 ↗</Link>}
            {a5Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a5Board.fixtureId}`)}>Mở mạch nút nhấn và LED A5 ↗</Link>}
            {a4Board && firmwareAvailable && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a4Board.fixtureId}`)}>Mở mạch nút nhấn và LED A4 ↗</Link>}
            {activeBoard.id === a2BoardId && firmwareAvailable ? <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a2FixtureId}`)}>Mở mạch nút nhấn và LED A2 ↗</Link> : a3Board && firmwareAvailable ? <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?fixture=${a3Board.fixtureId}`)}>Mở mạch nút nhấn và LED A3 ↗</Link> : activeFreestyleBoardId && <Link className="board-freestyle-link"
              to={productRoute(`/build/freestyle?board=${encodeURIComponent(activeFreestyleBoardId)}`)}>Lắp thử {activeBoard.name} ↗</Link>}
            {labBoardIds.has(activeBoard.id) && <Link className="board-source-link" to={productRoute(`/build?board=${encodeURIComponent(activeBoard.id)}`)}>Mở phòng thử ↗</Link>}
          </div>
        </div>
        <div className="catalog-filters board-cad-view-tabs" role="group" aria-label="Chọn cách xem board">
          {detailViews.filter(view => view.visible).map(view => <button key={view.id} type="button"
            className={activeView === view.id ? 'catalog-filter-active' : ''}
            aria-pressed={activeView === view.id} onClick={() => updateQuery({ view: view.id })}>{view.label}</button>)}
        </div>
        <BoardAuxConnectors key={activeBoard.id} groups={auxGroups} onPick={pin => updateQuery({ pin, view: activeView === '3d' ? '3d' : 'top' })} />
        {activeView === 'overview' && <>
          <div className="board-catalog-overview">
            <BoardCatalogMedia key={activeBoard.id} board={activeBoard} />
            <div className="board-catalog-specs">
              <dl>
                <div><dt>Vi điều khiển</dt><dd>{activeBoard.mcu ?? 'Xem tài liệu hãng'}</dd></div>
                <div><dt>Mức logic</dt><dd>{activeBoard.logicLevel ?? 'Xem tài liệu hãng'}</dd></div>
                {activeBoard.interfaceSummary && <div><dt>Ngoại vi và giao tiếp</dt><dd>{activeBoard.interfaceSummary}</dd></div>}
                {activeBoard.revision && <div><dt>Phiên bản tham chiếu</dt><dd>{activeBoard.revision}</dd></div>}
              </dl>
              {activeBoard.sourceUrl && <a href={activeBoard.sourceUrl} target="_blank" rel="noreferrer">Mở tài liệu hãng ↗</a>}
              <button type="button" className="button-secondary" onClick={() => updateQuery({ view: 'pins' })}>Xem chân và linh kiện</button>
            </div>
          </div>
          <details className="board-catalog-source-details"><summary>Hồ sơ, ảnh tham khảo và nguồn</summary>
            <BoardProfile key={activeBoard.id} board={activeBoard} headerPins={manifest?.pins} />
            <div className="board-profile-evidence"><BoardModelEvidencePanel evidence={evidence} /></div>
          </details>
        </>}
        {activeView === 'pins' && <div className="board-catalog-pins">
          {diagram && <section aria-label={diagram.label}>
            <BoardCatalogMedia key={diagram.src} board={activeBoard} image={diagram} />
            <a href={diagram.src} target="_blank" rel="noreferrer">Mở hình ở kích thước đầy đủ ↗</a>
            {diagram.sourceUrl && <> · <a href={diagram.sourceUrl} target="_blank" rel="noreferrer">{diagram.sourceLabel ?? 'Hướng dẫn của hãng'} ↗</a></>}
          </section>}
          {manifest?.pins.length ? <BoardPinoutExplorer pins={manifest.pins} selectedPinId={selectedPinId}
            onSelectPin={pin => updateQuery({ pin })} evidence={manifest.pinoutEvidence}
            coordinatePicking={manifest.pinPicking === true} standalone />
            : !diagram && <p>Tra sơ đồ và tên chân trong tài liệu nguồn bên dưới. Trang chưa có bảng chân tương tác cho board này.</p>}
          {pinoutSource && <p><a href={pinoutSource} target="_blank" rel="noreferrer">Xem sơ đồ chân trong tài liệu hãng ↗</a></p>}
          {manifest && activeFeature && <details className="board-catalog-features">
            <summary>Tra linh kiện trên PCB</summary>
            <label>Chọn linh kiện <select value={activeFeature.id} onChange={event => updateQuery({ feature: event.target.value })}>
              {manifest.features.map(feature => <option key={feature.id} value={feature.id}>{feature.name}</option>)}
            </select></label>
            <p>{activeFeature.plainDescription}</p>
            <p>{activeFeature.technicalRole}</p>
            {getFeatureEvidence(activeFeature).labels.length > 0 && <p>{getFeatureEvidence(activeFeature).labels.join(' · ')}</p>}
          </details>}
          {!diagram && <BoardProfile key={activeBoard.id} board={activeBoard} />}
        </div>}
        {activeView === '2d' && <Suspense fallback={<p role="status">Đang tải lớp đồng PCB…</p>}>
          <Pcb2DViewer key={activeBoard.id} boardId={activeBoard.id} />
        </Suspense>}
        {activeView === 'top' && topView && manifest && <>
          <Suspense fallback={<p role="status">Đang tải mặt board 2D…</p>}>
            <BoardTopInspector key={activeBoard.id} top={topView} pins={hasTopInspector ? manifest.pins : []}
              selectedPinId={selectedPinId} evidence={manifest.pinoutEvidence}
              featureRef={searchParams.get('part') ?? activeFeature?.designator} onSelectPin={pin => updateQuery({ pin: pin || null })}
              onSelectComponent={ref => updateQuery({ part: ref || null, feature: manifest.features.find(feature => feature.designator === ref)?.id ?? null, pin: null })} />
          </Suspense>
          {!hasTopInspector && <div className="board-catalog-pins">
            <button type="button" className="button-secondary" onClick={() => updateQuery({ view: 'pins' })}>Tra tên và chức năng chân</button>
          </div>}
        </>}
        {activeView === '3d' && manifest && activeFeature && shownFeature && <>
          <div className="board-cad-interactive"><BoardViewer key={activeBoard.id} manifest={manifest} selectedSceneId="pcb" onSelectScene={() => undefined} selectedFeatureId={activeFeature.id} highlightedFeatureIds={[]} onSelectFeature={(featureId) => updateQuery({ feature: featureId })} onHoverFeature={setHoveredCadFeatureId} selectedPinId={selectedPinId} onSelectPin={(pinId) => updateQuery({ pin: pinId })} /><section className="board-cad-details" aria-live={hoveredCadFeatureId ? 'off' : 'polite'}>{canExploreBoardPinout(manifest) && <BoardPinoutExplorer pins={manifest.pins} selectedPinId={selectedPinId} onSelectPin={(pinId) => updateQuery({ pin: pinId })} evidence={manifest.pinoutEvidence} coordinatePicking={manifest.pinPicking === true} />}<p className="eyebrow">{hoveredCadFeatureId ? 'ĐANG DI CHUỘT LÊN' : 'LINH KIỆN ĐANG CHỌN'}</p><h3>{shownFeature.name}</h3>{getFeatureEvidence(shownFeature).labels.length > 0 && <p className="board-evidence-tags">{getFeatureEvidence(shownFeature).labels.map((label) => <span key={label}>{label}</span>)}</p>}<p>{shownFeature.plainDescription}</p><dl><dt>{shownFeature.roleEvidence === 'source-backed' ? 'Vai trò được nguồn xác nhận' : shownFeature.roleEvidence === 'unverified' ? 'Vai trò chức năng · chưa xác minh' : 'Giải thích mô hình'}</dt><dd>{shownFeature.technicalRole}</dd><dt>Vị trí</dt><dd>{shownFeature.placementReason}</dd><dt>Kết nối</dt><dd>{shownFeature.connection}</dd></dl>{shownFeature.cadFootprint?.pads && shownFeature.cadFootprint.pads.length > 0 && <details className="board-pad-net-details"><summary>Pad và net từ PCB CAD · {shownFeature.cadFootprint.pads.length} pad</summary><div className="board-pad-net-scroll"><table><caption>Gán pad–net theo PCB CAD · {activeBoard.name}</caption><thead><tr><th scope="col">Pad</th><th scope="col">Net CAD</th><th scope="col">Pinout hãng khi tên net trùng</th></tr></thead><tbody>{shownFeature.cadFootprint.pads.map((pad, index) => { const pinout = getDocumentedPinForNet(pad.net, documentedPinMap); return <tr key={`${pad.number}-${index}`}><th scope="row">{pad.number}</th><td>{pad.net ?? 'Chưa gán net'}</td><td>{pinout?.label ?? '—'}</td></tr> })}</tbody></table></div><p className="board-pad-net-note">Nguồn pad/net: {manifest.audit?.revision ?? activeBoard.revision ?? activeBoard.name}. {manifest.pinoutEvidence?.summary} {activeBoard.id === 'seeed-xiao-esp32c3' ? 'Cột pinout được ghép khi tên net CAD khớp chính xác D0–D10 trong tài liệu Seeed.' : 'Cột pinout chỉ ghép khi tên net CAD khớp chính xác một tên chân có nguồn của board này.'} Ô trống không xác nhận chức năng. Bảng chỉ tra cứu tĩnh, không chọn pad và chưa tô đường đồng/net theo chân đã chọn.</p></details>}<p className="board-cad-caveat">{shownFeature.safetyNote}</p><BoardModelEvidencePanel evidence={evidence} /></section></div>
          <div className="board-cad-viewer-note"><span>CAD tham chiếu · hình học và vị trí linh kiện</span><span>{formatBoardModelStats(getBoardModelStats(manifest))}</span></div>
          <div className="board-catalog-download">
            {activeBoard.cadDownloadUrl && <a href={activeBoard.cadDownloadUrl} download>{activeBoard.cadDownloadLabel ?? 'Tải CAD STEP'} ↓</a>}
            {activeBoard.cadViewerUrl && activeBoard.cadViewerUrl !== activeBoard.cadDownloadUrl &&
              <a href={activeBoard.cadViewerUrl} download>{getCadViewerDownloadLabel(activeBoard.cadViewerUrl)} ↓</a>}
          </div>
        </>}
        {loadModel && !manifest && activeView !== 'overview' && activeView !== '2d' &&
          <p className="board-cad-viewer-note" role="status">{modelLoadFailed ? 'Không tải được dữ liệu board. Hãy tải lại trang để thử lại.' : 'Đang tải dữ liệu board…'}</p>}
      </section>
    </section> : <>
      <section className="catalog-page-heading">
        <h1>Thư viện board</h1>
        <p>Tìm board theo vi điều khiển, xem hình, tra chân và so sánh trước khi lắp mạch.</p>
        <div className="catalog-actions">
          <Link className="button-primary" to={productRoute('/build')}>Thử trong phòng lắp mạch ↗</Link>
          <Link to={productRoute('/components')}>Xem kho linh kiện →</Link>
        </div>
      </section>
      <section className="catalog-page-section board-gallery-section">
        <div className="catalog-controls">
          <label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" value={query}
            onChange={event => setQuery(event.target.value)} placeholder="Tìm board hoặc MCU…" aria-label="Tìm board hoặc vi điều khiển" /></label>
          <div className="catalog-filters" role="group" aria-label="Lọc họ board">
            {['Tất cả', 'ESP', 'Arduino', 'STM32', 'Raspberry Pi'].map(item => <button type="button" key={item} aria-pressed={family === item}
              className={family === item ? 'catalog-filter-active' : ''} onClick={() => setFamily(item)}>{item}</button>)}
          </div>
          {(query || family !== 'Tất cả') && <button className="catalog-reset" type="button" onClick={() => { setQuery(''); setFamily('Tất cả') }}>Xóa bộ lọc</button>}
        </div>
        <p className="catalog-hint" aria-live="polite">{filtered.length}/{boards.length} board. {compare.length ? `${compare.length}/3 board được chọn để so sánh.` : 'Chọn tối đa ba board để so sánh.'}</p>
        <div className="board-list">{filtered.map(board => {
          const freestyleBoardId = getFreestyleBoardId(board.id)
          const href = productRoute('/boards?' + new URLSearchParams({ board: board.id }))
          return <article className="board-card" key={board.id}>
            <Link className="board-card-link" to={href}>
              <BoardCatalogMedia board={board} thumbnail />
              <h2>{board.name}</h2>
            </Link>
            <p>{[board.mcu, board.logicLevel].filter(Boolean).join(' · ')}</p>
            <div className="board-card-actions">
              {freestyleBoardId && <Link className="board-freestyle-link" aria-label={`Lắp thử ${board.name}`}
                to={productRoute(`/build/freestyle?board=${encodeURIComponent(freestyleBoardId)}`)}>Lắp thử ↗</Link>}
              <label className="compare-checkbox"><input type="checkbox" checked={compare.includes(board.id)}
                disabled={!compare.includes(board.id) && compare.length >= 3} onChange={() => toggle(board.id)}
                aria-label={`So sánh ${board.name}`} /><span>So sánh</span></label>
            </div>
          </article>
        })}</div>
        {!filtered.length && <p className="catalog-empty">Không tìm thấy board. Hãy đổi từ khóa hoặc xóa bộ lọc.</p>}
        <BoardComparison boards={selected} onRemove={toggle} onClear={() => setCompare([])} />
        <CapabilityLegend ids={['cad-reference', 'model-not-available']} title="Cách đọc trạng thái model board" />
      </section>
    </>}
  </div>
}
