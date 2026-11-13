import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCatalogEvidenceUrl, boards } from '../data/boards'
import { getBoardCapability } from '../data/boardCapabilityRegistry'
import { BoardComparison } from '../components/BoardComparison'
import { BoardProfile } from '../components/board/BoardProfile'
import { BoardViewer } from '../components/board/BoardViewer'
import { BoardModelEvidencePanel } from '../components/board/BoardModelEvidencePanel'
import { BoardPinoutExplorer } from '../components/board/BoardPinoutExplorer'
import { Pcb2DViewer } from '../components/pcb/Pcb2DViewer'
import { raspberryPiBoardModels } from '../data/raspberryPiBoardModels'
import { communityBoardModels } from '../data/communityBoardModels'
import { adafruitBoardModels } from '../data/adafruitBoardModels'
import { seeedBoardModels } from '../data/seeedBoardModels'
import { espressifBoardModels } from '../data/espressifBoardModels'
import { getBoardModelEvidence } from '../data/boardModelSources'
import { arduinoBoardModels } from '../data/arduinoBoardModels'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import { simulationTargets } from '../data/simulationTargets'
import { CapabilityBadge, CapabilityLegend } from '../components/CapabilityBadge'
import { useProductRoute } from '../lib/useProductRoute'
import { getBoardCatalogView, resolveBoardLink } from '../lib/boardCatalogView'
import { formatBoardModelStats, getBoardModelStats, getFeatureEvidence } from '../lib/boardFeatureEvidence'
import { getDefaultBoardFeatureId } from '../lib/boardSelection'
import { getCadViewerDownloadLabel } from '../lib/boardModelDownload'
import { getDocumentedPinForNet } from '../lib/boardPadPinout'
import { canExploreBoardPinout } from '../lib/boardPinoutPresentation'

const cadModels = [...arduinoBoardModels, ...raspberryPiBoardModels, ...communityBoardModels, ...adafruitBoardModels, ...seeedBoardModels, ...espressifBoardModels]
const cadBoardIds = new Set(['esp32-devkit', ...cadModels.map((model) => model.id)])
const knownBoardIds = new Set(boards.map((board) => board.id))
const labBoardIds = new Set(simulationTargets.map((target) => target.boardId))

export function BoardCatalogPage() {
  const productRoute = useProductRoute()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('Tất cả')
  const [compare, setCompare] = useState<string[]>(['arduino-uno-r3', 'esp32-devkit'])
  const [hoveredCadFeatureId, setHoveredCadFeatureId] = useState('')
  const panelHeadingRef = useRef<HTMLHeadingElement>(null)
  const filtered = useMemo(() => boards.filter((board) => {
    const text = `${board.id} ${board.name} ${board.mcu ?? ''} ${board.revision ?? ''}`.toLocaleLowerCase('vi')
    return (family === 'Tất cả' || board.platform === family) && text.includes(query.trim().toLocaleLowerCase('vi'))
  }), [family, query])
  const selected = boards.filter((board) => compare.includes(board.id))
  const link = resolveBoardLink(searchParams.get('board'), knownBoardIds, cadBoardIds, 'esp32-devkit')
  const activeBoard = boards.find((board) => board.id === link.boardId)!
  const manifest = link.boardId === 'esp32-devkit' ? esp32DevkitModel : cadModels.find((model) => model.id === link.boardId)
  const activeCadView = getBoardCatalogView(activeBoard.id, searchParams.get('view') === '2d' ? '2d' : '3d')
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
    updateQuery({ board: boardId, feature: null, view: null, pin: null })
    panelHeadingRef.current?.focus({ preventScroll: true })
    document.querySelector('.board-cad-viewer')?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }
  const toggle = (id: string) => setCompare((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current)
  return <div className="catalog-page">
    <section className="catalog-page-heading"><p className="eyebrow">THƯ VIỆN · BOARD</p><h1>Chọn board để bắt đầu</h1><p>Tra cứu khả năng, mức điện áp và nguồn CAD. Một số board có viewer CAD tham chiếu tương tác; các board còn lại hiện là thông tin tra cứu, chưa có mô hình tương tác.</p><div className="catalog-actions"><Link className="button-primary" to={productRoute('/build')}>Thử trong phòng lắp mạch ↗</Link><Link to={productRoute('/components')}>Xem linh kiện →</Link></div><CapabilityLegend ids={['cad-reference', 'model-not-available']} title="Cách đọc trạng thái model board" /></section>
    <section className="content-section board-section catalog-page-section">
      <div className="catalog-controls"><label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm board hoặc MCU…" aria-label="Tìm board hoặc vi điều khiển" /></label><div className="catalog-filters" role="group" aria-label="Lọc họ board">{['Tất cả','ESP','Arduino','STM32','Raspberry Pi'].map((item) => <button type="button" key={item} aria-pressed={family === item} className={family === item ? 'catalog-filter-active' : ''} onClick={() => setFamily(item)}>{item}</button>)}</div><button className="catalog-reset" type="button" onClick={() => { setQuery(''); setFamily('Tất cả') }} disabled={!query && family === 'Tất cả'}>Xóa bộ lọc</button></div>
      <section className="board-cad-viewer" aria-labelledby="board-cad-viewer-title">
        {link.status === 'unknown' && <p className="board-reference-warning board-link-notice" role="status">Không tìm thấy board trong liên kết. Trang đang hiện {activeBoard.name}.</p>}
        <div className="board-cad-viewer-heading"><div><p className="eyebrow">{manifest ? 'CAD THAM CHIẾU · 3D TƯƠNG TÁC' : 'HỒ SƠ TRA CỨU · CHƯA CÓ VIEWER'}</p><h2 id="board-cad-viewer-title" ref={panelHeadingRef} tabIndex={-1}>{manifest ? `Khám phá ${activeBoard.name}` : `Hồ sơ ${activeBoard.name}`}</h2><p>{manifest ? 'Kéo để xoay toàn vòng, phóng to và chọn linh kiện trên mô hình hoặc trong danh sách để xem giải thích. Mô hình tham chiếu không chạy firmware hay mô phỏng điện.' : 'Board này chỉ có thông tin tra cứu. Chưa có mô hình tương tác, nên không có hình để chọn linh kiện.'}</p></div><div className="board-cad-viewer-actions">{activeBoard.cadDownloadUrl && <a className="board-source-link board-cad-link" href={activeBoard.cadDownloadUrl} download>{activeBoard.cadDownloadLabel} ↓</a>}{activeBoard.cadViewerUrl && <a className="board-source-link" href={activeBoard.cadViewerUrl} download>{getCadViewerDownloadLabel(activeBoard.cadViewerUrl)} ↓</a>}{getCatalogEvidenceUrl(activeBoard) && <a className="board-source-link" href={getCatalogEvidenceUrl(activeBoard)} target="_blank" rel="noreferrer">Tài liệu hãng ↗</a>}{activeBoard.referenceDocs?.map((doc) => <a key={doc.url} className="board-source-link" href={doc.url} target="_blank" rel="noreferrer">{doc.label} ↗</a>)}</div></div>
        <BoardProfile board={activeBoard} />
        {!manifest && <div className="board-profile-evidence"><BoardModelEvidencePanel evidence={evidence} /></div>}
        {manifest && activeFeature && shownFeature && <>
          <div className="catalog-filters board-cad-view-tabs" role="group" aria-label="Chọn góc nhìn CAD">
            <button type="button" aria-pressed={activeCadView === '3d'} className={activeCadView === '3d' ? 'catalog-filter-active' : ''} onClick={() => updateQuery({ view: null })}>PCB 3D</button>
            {getBoardCatalogView(activeBoard.id, '2d') === '2d' && <button type="button" aria-pressed={activeCadView === '2d'} className={activeCadView === '2d' ? 'catalog-filter-active' : ''} onClick={() => updateQuery({ view: '2d' })}>Lớp đồng PCB 2D</button>}
          </div>
          {activeCadView === '2d'
            ? <Pcb2DViewer key={`2d-${activeBoard.id}`} boardId={activeBoard.id} />
          : <div className="board-cad-interactive"><BoardViewer key={activeBoard.id} manifest={manifest} selectedSceneId="pcb" onSelectScene={() => undefined} selectedFeatureId={activeFeature.id} highlightedFeatureIds={[]} onSelectFeature={(featureId) => updateQuery({ feature: featureId })} onHoverFeature={setHoveredCadFeatureId} selectedPinId={selectedPinId} onSelectPin={(pinId) => updateQuery({ pin: pinId })} /><section className="board-cad-details" aria-live={hoveredCadFeatureId ? 'off' : 'polite'}>{canExploreBoardPinout(manifest) && <BoardPinoutExplorer pins={manifest.pins} selectedPinId={selectedPinId} onSelectPin={(pinId) => updateQuery({ pin: pinId })} evidence={manifest.pinoutEvidence} />}<p className="eyebrow">{hoveredCadFeatureId ? 'ĐANG DI CHUỘT LÊN' : 'LINH KIỆN ĐANG CHỌN'}</p><h3>{shownFeature.name}</h3>{getFeatureEvidence(shownFeature).labels.length > 0 && <p className="board-evidence-tags">{getFeatureEvidence(shownFeature).labels.map((label) => <span key={label}>{label}</span>)}</p>}<p>{shownFeature.plainDescription}</p><dl><dt>{shownFeature.roleEvidence === 'source-backed' ? 'Vai trò được nguồn xác nhận' : shownFeature.roleEvidence === 'unverified' ? 'Vai trò chức năng · chưa xác minh' : 'Giải thích mô hình'}</dt><dd>{shownFeature.technicalRole}</dd><dt>Vị trí</dt><dd>{shownFeature.placementReason}</dd><dt>Kết nối</dt><dd>{shownFeature.connection}</dd></dl>{shownFeature.cadFootprint?.pads && shownFeature.cadFootprint.pads.length > 0 && <details className="board-pad-net-details"><summary>Pad và net từ PCB KiCad · {shownFeature.cadFootprint.pads.length} pad</summary><div className="board-pad-net-scroll"><table><caption>Gán pad–net theo PCB CAD · {activeBoard.name}</caption><thead><tr><th scope="col">Pad</th><th scope="col">Net CAD</th><th scope="col">Pinout hãng khi tên net trùng</th></tr></thead><tbody>{shownFeature.cadFootprint.pads.map((pad, index) => { const pinout = getDocumentedPinForNet(pad.net, getBoardCapability(activeBoard.id).pinMap); return <tr key={`${pad.number}-${index}`}><th scope="row">{pad.number}</th><td>{pad.net ?? 'Chưa gán net'}</td><td>{pinout?.label ?? '—'}</td></tr> })}</tbody></table></div><p className="board-pad-net-note">Số pad/net lấy từ PCB KiCad v1.3. Cột pinout được ghép khi tên net CAD khớp chính xác D0–D10 trong tài liệu Seeed; bảng này chỉ tra cứu tĩnh, không chọn pad và chưa tô đường đồng/net theo chân đã chọn.</p></details>}<p className="board-cad-caveat">{shownFeature.safetyNote}</p><BoardModelEvidencePanel evidence={evidence} /></section></div>}
          <div className="board-cad-viewer-note"><span>CAD tham chiếu · không chạy firmware hay mô phỏng điện</span><span>{formatBoardModelStats(getBoardModelStats(manifest))}; footprint không có mesh chỉ tra được trong danh sách</span></div>
        </>}
      </section>
      <p className="catalog-hint" aria-live="polite">{filtered.length}/{boards.length} board trong bộ lọc. Chọn tối đa ba board để đối chiếu. {compare.length >= 3 ? 'Đã đủ ba board; bỏ một lựa chọn để thêm board khác.' : 'Bảng so sánh cập nhật ngay bên dưới.'}</p>
      <div className="board-list">{filtered.map((board) => <article className={`board-row ${board.availability === 'lesson' ? 'board-row-ready' : 'board-row-preview'}`} key={board.id}>
        <div className={`board-glyph ${board.platform === 'ESP' ? 'esp-glyph' : board.platform === 'Arduino' ? 'arduino-glyph' : board.platform === 'Raspberry Pi' ? 'rp-glyph' : 'stm-glyph'}`} aria-hidden="true"><span>{board.platform === 'ESP' ? board.id.includes('s3') ? 'S3' : board.id.includes('c3') ? 'C3' : board.id.includes('c6') ? 'C6' : 'ESP' : board.platform === 'Arduino' ? board.id.includes('nano') ? 'NANO' : board.id.includes('mega') ? 'MEGA' : 'UNO' : board.platform === 'Raspberry Pi' ? board.id.includes('pico-2') ? 'PICO 2' : 'PICO' : board.id.includes('blue') ? 'F1' : 'STM'}</span><i /><i /><i /></div>
        <div className="board-copy"><h2>{board.name}</h2><p>{board.description}</p><small className="board-model-note">{[board.mcu,board.revision].filter(Boolean).join(' · ')}</small>{board.modelNote && <small className="board-model-note">{board.modelNote}</small>}<button type="button" className="board-source-link board-cad-open" aria-pressed={activeBoard.id === board.id} onClick={() => selectBoard(board.id)}>{cadBoardIds.has(board.id) ? 'Xem mô hình 3D' : 'Xem hồ sơ tra cứu'} ↗</button>{board.id === 'stm32-nucleo' && <details className="board-pinout"><summary>Pinout Arduino đã đối chiếu manual ST</summary><div className="board-pinout-grid">{Object.entries(getBoardCapability(board.id).pinMap).filter(([key]) => /^[da]\d+$/.test(key)).sort(([a],[b]) => a.localeCompare(b, undefined, { numeric: true })).map(([key, value]) => <span key={key}><b>{key.toUpperCase()}</b> {value.label}</span>)}</div><small>A4/A5 có thể đổi chức năng theo solder bridge; xem UM1724 Rev 17 trước khi đấu thật.</small></details>}{board.id === 'stm32-nucleo' && board.sourceEvidenceUrl && <a className="board-source-link" href={board.sourceEvidenceUrl} target="_blank" rel="noreferrer">Manual pinout ST (UM1724) ↗</a>}{board.referenceDocs?.map((doc) => <a key={doc.url} className="board-source-link" href={doc.url} target="_blank" rel="noreferrer">{doc.label} ↗</a>)}{board.cadDownloadUrl && <a className="board-source-link board-cad-link" href={board.cadDownloadUrl} download>{board.cadDownloadLabel ?? 'Tải CAD STEP'} ↓</a>}{board.sourceUrl && <a className="board-source-link" href={board.sourceUrl} target="_blank" rel="noreferrer">Nguồn kỹ thuật ↗</a>}{board.alternateModelUrl && <a className="board-source-link board-alt-model-link" href={board.alternateModelUrl} target="_blank" rel="noreferrer">{board.alternateModelLabel ?? 'Nguồn model thay thế'} ↗</a>}</div>
        <CapabilityBadge className={`board-status ${getBoardModelEvidence(board.id)?.published ? 'status-ready' : 'status-preview'}`} id={getBoardModelEvidence(board.id)?.published ? 'cad-reference' : 'model-not-available'} />
        <label className="compare-checkbox"><input type="checkbox" checked={compare.includes(board.id)} disabled={!compare.includes(board.id) && compare.length >= 3} onChange={() => toggle(board.id)} /><span>So sánh</span></label>
        {labBoardIds.has(board.id) ? <Link className="row-arrow" aria-label={`Thử ${board.name} trong phòng lắp mạch`} to={productRoute(`/build?board=${encodeURIComponent(board.id)}`)}>↗</Link> : <span className="row-arrow muted-arrow" title="Board này chưa có trong phòng lắp mạch"><span aria-hidden="true">· · ·</span><span className="sr-only">Chưa có trong phòng lắp mạch</span></span>}
      </article>)}{!filtered.length && <p className="catalog-empty">Không tìm thấy board. Hãy đổi từ khóa hoặc xóa bộ lọc.</p>}</div>
      <BoardComparison boards={selected} onRemove={toggle} onClear={() => setCompare([])} />
    </section>
  </div>
}
