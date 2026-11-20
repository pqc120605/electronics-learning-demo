import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCatalogEvidenceUrl, boards } from '../data/boards'
import { getBoardCapability } from '../data/boardCapabilityRegistry'
import { BoardComparison } from '../components/BoardComparison'
import { BoardProfile } from '../components/board/BoardProfile'
import { BoardViewer } from '../components/board/BoardViewer'
import { BoardModelEvidencePanel } from '../components/board/BoardModelEvidencePanel'
import { BoardPinoutExplorer } from '../components/board/BoardPinoutExplorer'
import type { BoardModelManifest } from '../components/board/boardSceneTypes'
import { getBoardModelEvidence } from '../data/boardModelSources'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import { simulationTargets } from '../data/simulationTargets'
import { CapabilityBadge, CapabilityLegend } from '../components/CapabilityBadge'
import { useProductRoute } from '../lib/useProductRoute'
import { getFreestyleBoardId } from '../lib/catalogPracticeLinks'
import { getBoardCatalogView, resolveBoardLink } from '../lib/boardCatalogView'
import { formatBoardModelStats, getBoardModelStats, getFeatureEvidence } from '../lib/boardFeatureEvidence'
import { getDefaultBoardFeatureId } from '../lib/boardSelection'
import { getCadViewerDownloadLabel } from '../lib/boardModelDownload'
import { getDocumentedPinForNet } from '../lib/boardPadPinout'
import { canExploreBoardPinout } from '../lib/boardPinoutPresentation'
import { getBoardTopView } from '../lib/boardTopView'

const BoardTopInspector = lazy(() => import('../components/board/BoardTopInspector'))
const Pcb2DViewer = lazy(() => import('../components/pcb/Pcb2DViewer').then(({ Pcb2DViewer }) => ({ default: Pcb2DViewer })))
const topInspectorBoards = new Set(['arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3', 'esp32-devkit', 'raspberry-pi-pico'])
const cadModelFamilies = [
  { ids: ['arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3'], load: () => import('../data/arduinoBoardModels').then(module => module.arduinoBoardModels) },
  { ids: ['raspberry-pi-pico', 'raspberry-pi-pico-w', 'raspberry-pi-pico-2', 'raspberry-pi-pico-2-h'], load: () => import('../data/raspberryPiBoardModels').then(module => module.raspberryPiBoardModels) },
  { ids: ['adafruit-qtpy-esp32-c3-5405', 'adafruit-feather-esp32-s3-5323', 'adafruit-feather-esp32-s3-tft-5483'], load: () => import('../data/adafruitBoardModels').then(module => module.adafruitBoardModels) },
  { ids: ['seeed-xiao-esp32c3', 'seeed-xiao-esp32-s3'], load: () => import('../data/seeedBoardModels').then(module => module.seeedBoardModels) },
  { ids: ['esp32-s3-devkitc-1'], load: () => import('../data/espressifBoardModels').then(module => module.espressifBoardModels) },
  { ids: ['stm32-blue-pill-f103', 'stm32-nucleo'], load: () => import('../data/stm32BoardModels').then(module => module.stm32BoardModels) },
]
const cadBoardIds = new Set(['esp32-devkit', ...cadModelFamilies.flatMap(({ ids }) => ids)])
const knownBoardIds = new Set(boards.map((board) => board.id))
const labBoardIds = new Set(simulationTargets.map((target) => target.boardId))

import { GuideContextBridge } from '../components/guide/GuideContext'

export function BoardCatalogPage() {
  const productRoute = useProductRoute()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('Tất cả')
  const [showAllBoards, setShowAllBoards] = useState(false)
  const [compare, setCompare] = useState<string[]>(['arduino-uno-r3', 'esp32-devkit'])
  const [hoveredCadFeatureId, setHoveredCadFeatureId] = useState('')
  const [loadedModel, setLoadedModel] = useState<{ boardId: string; manifest?: BoardModelManifest }>()
  const panelHeadingRef = useRef<HTMLHeadingElement>(null)
  const filtered = useMemo(() => boards.filter((board) => {
    const text = `${board.id} ${board.name} ${board.mcu ?? ''} ${board.revision ?? ''}`.toLocaleLowerCase('vi')
    return (family === 'Tất cả' || board.platform === family) && text.includes(query.trim().toLocaleLowerCase('vi'))
  }), [family, query])
  const selected = boards.filter((board) => compare.includes(board.id))
  const link = resolveBoardLink(searchParams.get('board'), knownBoardIds, cadBoardIds, 'esp32-devkit')
  const activeBoard = boards.find((board) => board.id === link.boardId)!
  const firstBoards = filtered.slice(0, 8)
  const visibleBoards = showAllBoards || query.trim() || family !== 'Tất cả' ? filtered
    : firstBoards.some(board => board.id === activeBoard.id) ? firstBoards : [...firstBoards.slice(0, 7), activeBoard]
  const activeFreestyleBoardId = getFreestyleBoardId(activeBoard.id)
  const modelFamily = cadModelFamilies.find(({ ids }) => ids.includes(link.boardId))
  const manifest = link.boardId === 'esp32-devkit' ? esp32DevkitModel
    : loadedModel?.boardId === link.boardId ? loadedModel.manifest : undefined
  const modelLoadFailed = loadedModel?.boardId === link.boardId && !manifest
  useEffect(() => {
    if (!modelFamily) return
    const boardId = link.boardId
    let active = true
    void modelFamily.load().then(
      models => { if (active) setLoadedModel({ boardId, manifest: models.find(model => model.id === boardId) }) },
      () => { if (active) setLoadedModel({ boardId }) },
    )
    return () => { active = false }
  }, [link.boardId, modelFamily])
  const topView = topInspectorBoards.has(activeBoard.id) ? getBoardTopView(activeBoard.id) : undefined
  const requestedView = searchParams.get('view')
  const activeCadView = requestedView === 'top' && topView ? 'top'
    : getBoardCatalogView(activeBoard.id, requestedView === '2d' ? '2d' : '3d')
  const featureById = (id: string | null) => manifest?.features.find((feature) => feature.id === id)
  const activeFeature = featureById(searchParams.get('feature')) ?? featureById(getDefaultBoardFeatureId(activeBoard.id)) ?? manifest?.features[0]
  const selectedPinId = manifest?.pins.find((pin) => pin.id === searchParams.get('pin'))?.id ?? ''
  const shownFeature = featureById(hoveredCadFeatureId) ?? activeFeature
  const evidence = getBoardModelEvidence(activeBoard.id)
  useEffect(() => { setHoveredCadFeatureId('') }, [link.boardId])
  const updateQuery = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) { if (value === null) next.delete(key); else next.set(key, value) }
    setSearchParams(next, { replace: true })
  }
  const selectBoard = (boardId: string) => {
    updateQuery({ board: boardId, feature: null, part: null, view: null, pin: null })
    panelHeadingRef.current?.focus({ preventScroll: true })
    document.querySelector('.board-cad-viewer')?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
  }
  const toggle = (id: string) => setCompare((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current)
  return <div className="catalog-page"><GuideContextBridge snapshot={{owner:"board-library",priority:60,board:{id:activeBoard.id,name:activeBoard.name,reference:link.status==='unknown'},part:activeFeature?{id:activeFeature.id,type:"board-feature",name:activeFeature.name,summary:activeFeature.plainDescription,pins:selectedPinId?[selectedPinId]:[],note:activeFeature.safetyNote}:undefined,status:activeBoard.modelNote??activeBoard.description,issues:link.status==='unknown'?['Không tìm thấy board trong liên kết; đang hiện board tham chiếu.']:[]}} />
    <section className="catalog-page-heading"><p className="eyebrow">THƯ VIỆN · BOARD</p><h1>Chọn board để bắt đầu</h1><p>Tra cứu khả năng, mức điện áp và nguồn CAD. Một số board có viewer CAD tham chiếu tương tác; các board còn lại hiện là thông tin tra cứu, chưa có mô hình tương tác.</p><div className="catalog-actions"><Link className="button-primary" to={productRoute('/build')}>Thử trong phòng lắp mạch ↗</Link><Link to={productRoute('/components')}>Xem linh kiện →</Link></div><CapabilityLegend ids={['cad-reference', 'model-not-available']} title="Cách đọc trạng thái model board" /></section>
    <section className="content-section board-section catalog-page-section">
      <div className="catalog-controls"><label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm board hoặc MCU…" aria-label="Tìm board hoặc vi điều khiển" /></label><div className="catalog-filters" role="group" aria-label="Lọc họ board">{['Tất cả','ESP','Arduino','STM32','Raspberry Pi'].map((item) => <button type="button" key={item} aria-pressed={family === item} className={family === item ? 'catalog-filter-active' : ''} onClick={() => setFamily(item)}>{item}</button>)}</div><button className="catalog-reset" type="button" onClick={() => { setQuery(''); setFamily('Tất cả'); setShowAllBoards(false) }} disabled={!query && family === 'Tất cả'}>Xóa bộ lọc</button><a className="button-secondary" href="#board-results">Đến danh sách board ↓</a></div>
      <section className="board-cad-viewer" aria-labelledby="board-cad-viewer-title">
        {link.status === 'unknown' && <p className="board-reference-warning board-link-notice" role="status">Không tìm thấy board trong liên kết. Trang đang hiện {activeBoard.name}.</p>}
        <div className="board-cad-viewer-heading"><div><p className="eyebrow">{manifest || modelFamily ? 'CAD THAM CHIẾU · 3D TƯƠNG TÁC' : 'HỒ SƠ TRA CỨU · CHƯA CÓ VIEWER'}</p><h2 id="board-cad-viewer-title" ref={panelHeadingRef} tabIndex={-1}>{manifest || modelFamily ? `Khám phá ${activeBoard.name}` : `Hồ sơ ${activeBoard.name}`}</h2><p>{manifest || modelFamily ? 'Kéo để xoay toàn vòng, phóng to và chọn linh kiện trên mô hình hoặc trong danh sách để xem giải thích. Mô hình tham chiếu không chạy firmware hay mô phỏng điện.' : 'Board này chỉ có thông tin tra cứu. Chưa có mô hình tương tác, nên không có hình để chọn linh kiện.'}</p></div><div className="board-cad-viewer-actions">{activeFreestyleBoardId && <Link className="board-freestyle-link" to={productRoute(`/build/freestyle?board=${encodeURIComponent(activeFreestyleBoardId)}`)}>Lắp thử {activeBoard.name} <span aria-hidden="true">↗</span></Link>}{activeBoard.cadDownloadUrl && <a className="board-source-link board-cad-link" href={activeBoard.cadDownloadUrl} download>{activeBoard.cadDownloadLabel} ↓</a>}{activeBoard.cadViewerUrl && <a className="board-source-link" href={activeBoard.cadViewerUrl} download>{getCadViewerDownloadLabel(activeBoard.cadViewerUrl)} ↓</a>}{getCatalogEvidenceUrl(activeBoard) && <a className="board-source-link" href={getCatalogEvidenceUrl(activeBoard)} target="_blank" rel="noreferrer">Tài liệu hãng ↗</a>}{activeBoard.referenceDocs?.map((doc) => <a key={doc.url} className="board-source-link" href={doc.url} target="_blank" rel="noreferrer">{doc.label} ↗</a>)}</div></div>
        <BoardProfile board={activeBoard} />
        {modelFamily && !manifest && <p className="board-cad-viewer-note" role="status">{modelLoadFailed ? 'Không tải được dữ liệu CAD. Hãy tải lại trang để thử lại.' : 'Đang tải dữ liệu CAD của board…'}</p>}
        {!manifest && <div className="board-profile-evidence"><BoardModelEvidencePanel evidence={evidence} /></div>}
        {manifest && activeFeature && shownFeature && <>
          <div className="catalog-filters board-cad-view-tabs" role="group" aria-label="Chọn góc nhìn CAD">
            <button type="button" aria-pressed={activeCadView === '3d'} className={activeCadView === '3d' ? 'catalog-filter-active' : ''} onClick={() => updateQuery({ view: null })}>PCB 3D</button>
            {topView && <button type="button" aria-pressed={activeCadView === 'top'} className={activeCadView === 'top' ? 'catalog-filter-active' : ''} onClick={() => updateQuery({ view: 'top' })}>Mặt board 2D</button>}
            {getBoardCatalogView(activeBoard.id, '2d') === '2d' && <button type="button" aria-pressed={activeCadView === '2d'} className={activeCadView === '2d' ? 'catalog-filter-active' : ''} onClick={() => updateQuery({ view: '2d' })}>Lớp đồng PCB 2D</button>}
          </div>
          {activeCadView === '2d'
            ? <Suspense fallback={<p role="status">Đang tải lớp đồng PCB…</p>}>
                <Pcb2DViewer key={`2d-${activeBoard.id}`} boardId={activeBoard.id} />
              </Suspense>
          : activeCadView === 'top' && topView
            ? <Suspense fallback={<p role="status">Đang tải mặt board 2D…</p>}>
                <BoardTopInspector key={activeBoard.id} top={topView} pins={manifest.pins} selectedPinId={selectedPinId}
                  featureRef={searchParams.get('part') ?? activeFeature.designator} onSelectPin={pin => updateQuery({ pin: pin || null })}
                  onSelectComponent={ref => updateQuery({ part: ref || null, feature: manifest.features.find(feature => feature.designator === ref)?.id ?? null, pin: null })} />
              </Suspense>
          : <div className="board-cad-interactive"><BoardViewer key={activeBoard.id} manifest={manifest} selectedSceneId="pcb" onSelectScene={() => undefined} selectedFeatureId={activeFeature.id} highlightedFeatureIds={[]} onSelectFeature={(featureId) => updateQuery({ feature: featureId })} onHoverFeature={setHoveredCadFeatureId} selectedPinId={selectedPinId} onSelectPin={(pinId) => updateQuery({ pin: pinId })} /><section className="board-cad-details" aria-live={hoveredCadFeatureId ? 'off' : 'polite'}>{canExploreBoardPinout(manifest) && <BoardPinoutExplorer pins={manifest.pins} selectedPinId={selectedPinId} onSelectPin={(pinId) => updateQuery({ pin: pinId })} evidence={manifest.pinoutEvidence} coordinatePicking={manifest.pinPicking === true} />}<p className="eyebrow">{hoveredCadFeatureId ? 'ĐANG DI CHUỘT LÊN' : 'LINH KIỆN ĐANG CHỌN'}</p><h3>{shownFeature.name}</h3>{getFeatureEvidence(shownFeature).labels.length > 0 && <p className="board-evidence-tags">{getFeatureEvidence(shownFeature).labels.map((label) => <span key={label}>{label}</span>)}</p>}<p>{shownFeature.plainDescription}</p><dl><dt>{shownFeature.roleEvidence === 'source-backed' ? 'Vai trò được nguồn xác nhận' : shownFeature.roleEvidence === 'unverified' ? 'Vai trò chức năng · chưa xác minh' : 'Giải thích mô hình'}</dt><dd>{shownFeature.technicalRole}</dd><dt>Vị trí</dt><dd>{shownFeature.placementReason}</dd><dt>Kết nối</dt><dd>{shownFeature.connection}</dd></dl>{shownFeature.cadFootprint?.pads && shownFeature.cadFootprint.pads.length > 0 && <details className="board-pad-net-details"><summary>Pad và net từ PCB CAD · {shownFeature.cadFootprint.pads.length} pad</summary><div className="board-pad-net-scroll"><table><caption>Gán pad–net theo PCB CAD · {activeBoard.name}</caption><thead><tr><th scope="col">Pad</th><th scope="col">Net CAD</th><th scope="col">Pinout hãng khi tên net trùng</th></tr></thead><tbody>{shownFeature.cadFootprint.pads.map((pad, index) => { const pinout = getDocumentedPinForNet(pad.net, getBoardCapability(activeBoard.id).pinMap); return <tr key={`${pad.number}-${index}`}><th scope="row">{pad.number}</th><td>{pad.net ?? 'Chưa gán net'}</td><td>{pinout?.label ?? '—'}</td></tr> })}</tbody></table></div><p className="board-pad-net-note">Nguồn pad/net: {manifest.audit?.revision ?? activeBoard.revision ?? activeBoard.name}. {manifest.pinoutEvidence?.summary} {activeBoard.id === 'seeed-xiao-esp32c3' ? 'Cột pinout được ghép khi tên net CAD khớp chính xác D0–D10 trong tài liệu Seeed.' : 'Cột pinout chỉ ghép khi tên net CAD khớp chính xác một tên chân có nguồn của board này.'} Ô trống không xác nhận chức năng. Bảng chỉ tra cứu tĩnh, không chọn pad và chưa tô đường đồng/net theo chân đã chọn.</p></details>}<p className="board-cad-caveat">{shownFeature.safetyNote}</p><BoardModelEvidencePanel evidence={evidence} /></section></div>}
          <div className="board-cad-viewer-note"><span>CAD tham chiếu · không chạy firmware hay mô phỏng điện</span><span>{formatBoardModelStats(getBoardModelStats(manifest))}; footprint không có mesh chỉ tra được trong danh sách</span></div>
        </>}
      </section>
      <p id="board-results" className="catalog-hint" aria-live="polite">Hiện {visibleBoards.length}/{filtered.length} board khớp bộ lọc. {compare.length >= 3 ? 'Đã đủ ba board; bỏ một lựa chọn để thêm board khác.' : 'Chọn tối đa ba board để đối chiếu.'}</p>
      <div className="board-list">{visibleBoards.map((board) => { const freestyleBoardId = getFreestyleBoardId(board.id); return <article className={`board-row ${board.availability === 'lesson' ? 'board-row-ready' : 'board-row-preview'}`} key={board.id}>
        <div className={`board-glyph ${board.platform === 'ESP' ? 'esp-glyph' : board.platform === 'Arduino' ? 'arduino-glyph' : board.platform === 'Raspberry Pi' ? 'rp-glyph' : 'stm-glyph'}`} aria-hidden="true"><span>{board.platform === 'ESP' ? board.id.includes('s3') ? 'S3' : board.id.includes('c3') ? 'C3' : board.id.includes('c6') ? 'C6' : 'ESP' : board.platform === 'Arduino' ? board.id.includes('nano') ? 'NANO' : board.id.includes('mega') ? 'MEGA' : 'UNO' : board.platform === 'Raspberry Pi' ? board.id.includes('pico-2') ? 'PICO 2' : 'PICO' : board.id.includes('blue') ? 'F1' : 'STM'}</span><i /><i /><i /></div>
        <div className="board-copy"><h2>{board.name}</h2><p>{board.description}</p><small className="board-model-note">{[board.mcu,board.revision].filter(Boolean).join(' · ')}</small>{board.modelNote && <small className="board-model-note">{board.modelNote}</small>}{freestyleBoardId && <Link className="board-freestyle-link" to={productRoute(`/build/freestyle?board=${encodeURIComponent(freestyleBoardId)}`)}>Lắp thử trên bàn tự do <span aria-hidden="true">↗</span></Link>}<button type="button" className="board-source-link board-cad-open" aria-pressed={activeBoard.id === board.id} onClick={() => selectBoard(board.id)}>{cadBoardIds.has(board.id) ? 'Xem mô hình 3D' : 'Xem hồ sơ tra cứu'} ↗</button>{board.id === 'stm32-nucleo' && <details className="board-pinout"><summary>Pinout Arduino đã đối chiếu manual ST</summary><div className="board-pinout-grid">{Object.entries(getBoardCapability(board.id).pinMap).filter(([key]) => /^[da]\d+$/.test(key)).sort(([a],[b]) => a.localeCompare(b, undefined, { numeric: true })).map(([key, value]) => <span key={key}><b>{key.toUpperCase()}</b> {value.label}</span>)}</div><small>A4/A5 có thể đổi chức năng theo solder bridge; xem UM1724 Rev 17 trước khi đấu thật.</small></details>}{board.id === 'stm32-nucleo' && board.sourceEvidenceUrl && <a className="board-source-link" href={board.sourceEvidenceUrl} target="_blank" rel="noreferrer">Manual pinout ST (UM1724) ↗</a>}{board.referenceDocs?.map((doc) => <a key={doc.url} className="board-source-link" href={doc.url} target="_blank" rel="noreferrer">{doc.label} ↗</a>)}{board.cadDownloadUrl && <a className="board-source-link board-cad-link" href={board.cadDownloadUrl} download>{board.cadDownloadLabel ?? 'Tải CAD STEP'} ↓</a>}{board.sourceUrl && <a className="board-source-link" href={board.sourceUrl} target="_blank" rel="noreferrer">Nguồn kỹ thuật ↗</a>}{board.alternateModelUrl && <a className="board-source-link board-alt-model-link" href={board.alternateModelUrl} target="_blank" rel="noreferrer">{board.alternateModelLabel ?? 'Nguồn model thay thế'} ↗</a>}</div>
        <CapabilityBadge className={`board-status ${getBoardModelEvidence(board.id)?.published ? 'status-ready' : 'status-preview'}`} id={getBoardModelEvidence(board.id)?.published ? 'cad-reference' : 'model-not-available'} />
        <label className="compare-checkbox"><input type="checkbox" checked={compare.includes(board.id)} disabled={!compare.includes(board.id) && compare.length >= 3} onChange={() => toggle(board.id)} /><span>So sánh</span></label>
        {labBoardIds.has(board.id) ? <Link className="row-arrow" aria-label={`Thử ${board.name} trong phòng lắp mạch`} to={productRoute(`/build?board=${encodeURIComponent(board.id)}`)}>↗</Link> : <span className="row-arrow muted-arrow" title="Board này chưa có trong phòng lắp mạch"><span aria-hidden="true">· · ·</span><span className="sr-only">Chưa có trong phòng lắp mạch</span></span>}
      </article>})}{!filtered.length && <p className="catalog-empty">Không tìm thấy board. Hãy đổi từ khóa hoặc xóa bộ lọc.</p>}</div>
      {visibleBoards.length < filtered.length && <button className="button-secondary" type="button" onClick={() => setShowAllBoards(true)}>Xem thêm {filtered.length - visibleBoards.length} board</button>}
      <BoardComparison boards={selected} onRemove={toggle} onClear={() => setCompare([])} />
    </section>
  </div>
}
