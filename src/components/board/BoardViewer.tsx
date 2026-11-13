import { useEffect, useRef, useState } from 'react'
import type { BoardFeature, BoardModelManifest } from './boardSceneTypes'
import { BoardScene } from './BoardScene'
import { getBoardFeaturePickerEntries } from '../../lib/boardFeatureFiltering'
import { formatBoardModelStats, getBoardModelStats, getFeatureEvidence } from '../../lib/boardFeatureEvidence'
import { isFocusableFeatureNode } from '../../lib/boardFeatureFocus'

/** Long enough for the 16 MB Mega model on a slow link; a stalled request must still end. */
const MODEL_LOAD_TIMEOUT_MS = 60_000

type BoardViewerProps = {
  manifest: BoardModelManifest
  selectedSceneId: 'pcb' | 'assembly'
  onSelectScene: (sceneId: 'pcb' | 'assembly') => void
  selectedFeatureId: string
  highlightedFeatureIds: string[]
  onSelectFeature: (featureId: string) => void
  onHoverFeature: (featureId: string) => void
  selectedPinId: string
  onSelectPin: (pinId: string) => void
}

export function BoardViewer({ manifest, selectedSceneId, onSelectScene, selectedFeatureId, highlightedFeatureIds, onSelectFeature, onHoverFeature, selectedPinId, onSelectPin }: BoardViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const pinMarkerRef = useRef<HTMLSpanElement>(null)
  const sceneRef = useRef<BoardScene | null>(null)
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [showFootprints, setShowFootprints] = useState(false)
  const [featureQuery, setFeatureQuery] = useState('')
  const activeScene = manifest.scenes.find((scene) => scene.id === selectedSceneId) ?? manifest.scenes[0]
  const visibleFeatureIds = new Set(activeScene.hotspots.map((hotspot) => hotspot.featureId))
  const isArduinoPcb = manifest.id.startsWith('arduino-') && selectedSceneId === 'pcb'
  const hasFootprintDetails = selectedSceneId === 'pcb' && manifest.features.some((feature) => feature.cadFootprint)
  const pickerFeatures = getBoardFeaturePickerEntries(manifest.features, visibleFeatureIds, !hasFootprintDetails || showFootprints, featureQuery)
  const hiddenFootprintCount = hasFootprintDetails ? manifest.features.filter((feature) => visibleFeatureIds.has(feature.id) && feature.cadFootprint && !feature.cadFootprint.has3dBody).length : 0
  const selectedFeatureHasMesh = activeScene.hotspots.some((hotspot) => hotspot.featureId === selectedFeatureId && hotspot.nodeNames.some(isFocusableFeatureNode))
  const selectedPinLabel = manifest.pins.find((pin) => pin.id === selectedPinId)?.label ?? ''

  function refreshPinMarker() {
    const marker = pinMarkerRef.current
    const stage = stageRef.current
    const projected = selectedPinId ? sceneRef.current?.projectPin(selectedPinId) : null
    if (!marker || !stage || !projected?.visible) {
      if (marker) marker.hidden = true
      return
    }
    const stageRect = stage.getBoundingClientRect()
    marker.hidden = false
    marker.style.left = `${projected.x - stageRect.left}px`
    marker.style.top = `${projected.y - stageRect.top}px`
  }

  useEffect(() => {
    setShowFootprints((manifest.id === 'seeed-xiao-esp32c3' || manifest.id === 'esp32-s3-devkitc-1') && selectedSceneId === 'pcb')
    setFeatureQuery('')
  }, [manifest.id, selectedSceneId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let timedOut = false
    const abortController = new AbortController()
    const loadTimeout = window.setTimeout(() => { timedOut = true; abortController.abort() }, MODEL_LOAD_TIMEOUT_MS)
    let observer: ResizeObserver | undefined
    setStatus('loading')
    setError('')
    try {
      const scene = BoardScene.create(canvas)
      sceneRef.current = scene
      void scene.load(manifest, activeScene, abortController.signal).then(() => {
        window.clearTimeout(loadTimeout)
        if (cancelled) return
        setStatus('ready')
        scene.setSelection(selectedFeatureId)
        scene.setHighlights(highlightedFeatureIds)
        window.requestAnimationFrame(refreshPinMarker)
      }).catch((reason: unknown) => {
        window.clearTimeout(loadTimeout)
        if (cancelled) return
        scene.dispose()
        sceneRef.current = null
        setError(timedOut ? 'Tải mô hình quá lâu. Kiểm tra mạng rồi thử lại.' : reason instanceof Error ? reason.message : 'Có lỗi khi tải mô hình PCB.')
        setStatus('error')
      })
      observer = new ResizeObserver(() => { scene.resize(); refreshPinMarker() })
      observer.observe(canvas)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không khởi tạo được khung nhìn PCB.')
      setStatus('error')
    }
    return () => {
      cancelled = true
      window.clearTimeout(loadTimeout)
      abortController.abort()
      observer?.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [manifest, activeScene, retry])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onLost = (event: Event) => {
      event.preventDefault()
      setError('Trình duyệt tạm mất kết nối đồ họa. Mô hình sẽ tự mở lại khi có thể; danh sách linh kiện vẫn dùng được.')
      setStatus('error')
    }
    const onRestored = () => setRetry((value) => value + 1)
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
    }
  }, [])

  useEffect(() => { sceneRef.current?.setSelection(selectedFeatureId) }, [selectedFeatureId])
  useEffect(() => { sceneRef.current?.setHighlights(highlightedFeatureIds) }, [highlightedFeatureIds])
  useEffect(() => { refreshPinMarker() }, [selectedPinId, status, selectedSceneId])

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || event.button !== 0) return
    dragRef.current = { x: event.clientX, y: event.clientY, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    if (!drag) {
      const featureId = sceneRef.current?.pick(event.clientX, event.clientY) ?? ''
      sceneRef.current?.setHover(featureId)
      onHoverFeature(featureId)
      event.currentTarget.style.cursor = featureId ? 'pointer' : 'grab'
      return
    }
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
    if (drag.moved) {
      sceneRef.current?.setHover('')
      onHoverFeature('')
      event.currentTarget.style.cursor = 'grabbing'
      sceneRef.current?.rotate(dx * 0.012, -dy * 0.012)
      refreshPinMarker()
    }
    drag.x = event.clientX
    drag.y = event.clientY
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    if (drag && !drag.moved) {
      const pinId = sceneRef.current?.pickPin(event.clientX, event.clientY)
      if (pinId) { onSelectPin(pinId); dragRef.current = null; return }
      const featureId = sceneRef.current?.pick(event.clientX, event.clientY)
      if (featureId) onSelectFeature(featureId)
    }
    dragRef.current = null
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      sceneRef.current?.zoom(event.deltaY < 0 ? 1 : -1)
      refreshPinMarker()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [selectedPinId])

  function onPointerLeave(event: React.PointerEvent<HTMLCanvasElement>) {
    if (dragRef.current) return
    sceneRef.current?.setHover('')
    onHoverFeature('')
    event.currentTarget.style.cursor = 'grab'
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const scene = sceneRef.current
    if (!scene) return
    if (event.key === 'ArrowLeft') scene.rotate(-0.12, 0)
    else if (event.key === 'ArrowRight') scene.rotate(0.12, 0)
    else if (event.key === 'ArrowUp') scene.rotate(0, 0.12)
    else if (event.key === 'ArrowDown') scene.rotate(0, -0.12)
    else if (event.key === '+' || event.key === '=') scene.zoom(1)
    else if (event.key === '-') scene.zoom(-1)
    else if (event.key === 'Home') scene.resetView()
    else return
    event.preventDefault()
  }

  return (
    <div className="board-viewer" role="group" aria-label={`Mô hình mạch ${manifest.id} tương tác`}>
      <div className="board-scene-switch" role="group" aria-label="Chế độ xem mạch">{manifest.scenes.map((scene) => <button key={scene.id} type="button" aria-pressed={selectedSceneId === scene.id} className={selectedSceneId === scene.id ? 'board-scene-active' : ''} onClick={() => onSelectScene(scene.id)}>{scene.label}</button>)}</div>
      {manifest.audit && <div className="board-audit-status" role="note"><strong>CAD tham chiếu · {manifest.audit.revision}</strong><span>{manifest.id.startsWith('raspberry-pi-') ? `${manifest.features.filter((feature) => feature.roleEvidence === 'source-backed').length} nhóm đã nhận diện · ${manifest.features.filter((feature) => feature.roleEvidence !== 'source-backed').length} nhóm chưa xác minh` : formatBoardModelStats(getBoardModelStats(manifest))}.{hiddenFootprintCount > 0 && !showFootprints ? ' Mở phần footprint để tra cứu mục chưa có mesh 3D.' : ''}</span></div>}
      <div ref={stageRef} className="board-viewer-stage">
        <canvas
          ref={canvasRef}
          className="board-viewer-canvas"
          aria-label={`${activeScene.label}. Rê chuột để xem linh kiện, nhấp để chọn; kéo theo mọi hướng để xoay toàn vòng và xem mặt dưới, cuộn để phóng to. Dùng phím mũi tên để xoay, cộng trừ để zoom, Home để đặt lại.`}
          role="application"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          onPointerCancel={() => { dragRef.current = null }}
          onKeyDown={onKeyDown}
        />
        {status === 'loading' && <div className="board-viewer-overlay" role="status">Đang tải mô hình PCB…</div>}
        {status === 'error' && <div className="board-viewer-overlay board-viewer-error" role="alert"><strong>Chưa hiển thị được mô hình</strong><span>{error}</span><button type="button" onClick={() => setRetry((value) => value + 1)}>Thử lại</button></div>}
        <span className="board-viewer-hint">Kéo để xoay 360° · lăn chuột để phóng to · chọn “Lật mặt” để xem đáy PCB</span>
        <div role="group" className="board-viewer-controls" aria-label="Điều khiển góc nhìn">
          <button type="button" aria-label="Xoay trái 90 độ" title="Xoay trái 90°" onClick={() => { sceneRef.current?.rotate(-Math.PI / 2, 0); refreshPinMarker() }}>↶</button>
          <button type="button" aria-label="Xoay phải 90 độ" title="Xoay phải 90°" onClick={() => { sceneRef.current?.rotate(Math.PI / 2, 0); refreshPinMarker() }}>↷</button>
          <button type="button" aria-label="Lật sang mặt đối diện" title="Lật mặt PCB" onClick={() => { sceneRef.current?.flipView(); refreshPinMarker() }}>⇅</button>
          <button type="button" aria-label="Tập trung vào linh kiện đang chọn" title={selectedFeatureHasMesh ? 'Đưa linh kiện đang chọn vào giữa khung nhìn' : 'Linh kiện này chưa có mesh 3D để lấy nét'} disabled={status !== 'ready' || !selectedFeatureHasMesh} onClick={() => sceneRef.current?.focusFeature(selectedFeatureId)}>◎</button>
          <span aria-hidden="true" />
          <button type="button" aria-label="Thu nhỏ" onClick={() => { sceneRef.current?.zoom(-1); refreshPinMarker() }}>−</button>
          <button type="button" aria-label="Phóng to" onClick={() => { sceneRef.current?.zoom(1); refreshPinMarker() }}>＋</button>
          <button type="button" aria-label="Đặt lại góc nhìn" onClick={() => { sceneRef.current?.resetView(); refreshPinMarker() }}>⌂</button>
        </div>
        {selectedPinLabel && <span ref={pinMarkerRef} className="board-pin-target-marker" aria-hidden="true" hidden><i/><b>{selectedPinLabel}</b></span>}
        <span className="board-viewer-axis">{selectedSceneId === 'assembly' ? 'LẮP MẠCH · GPIO23 → LED → GND' : `PCB · ${manifest.id.toUpperCase().replaceAll('-', ' ')}`}</span>
        {selectedPinId && <span className="board-selected-pin">CHÂN ĐANG XEM · {selectedPinLabel}</span>}
      </div>
      <div className={`board-feature-picker ${isArduinoPcb ? 'board-feature-picker-dense' : ''}`} role="group" aria-label="Chọn linh kiện để xem thông tin">
        <p>{selectedSceneId === 'assembly' ? 'LINH KIỆN TRONG MẠCH LẮP' : hasFootprintDetails ? 'CHỌN HOẶC RÊ LÊN DESIGNATOR' : manifest.pinPicking === false ? 'CHỌN KHỐI CHỨC NĂNG ĐỂ TÌM HIỂU' : 'LINH KIỆN TRÊN PCB'}</p>
        {manifest.audit && selectedSceneId === 'pcb' && <div className="board-feature-search-row"><label className="sr-only" htmlFor="board-feature-search">Tìm linh kiện trên board</label><input id="board-feature-search" type="search" value={featureQuery} onChange={(event) => setFeatureQuery(event.target.value)} placeholder="Tìm tên hoặc designator, ví dụ U1, LED…" /><span>{pickerFeatures.length} mục</span></div>}
        {hasFootprintDetails && hiddenFootprintCount > 0 && <button className="board-footprint-toggle" type="button" aria-expanded={showFootprints} onClick={() => setShowFootprints((value) => !value)}>{showFootprints ? `Ẩn ${hiddenFootprintCount} footprint không có mesh` : `Hiện thêm ${hiddenFootprintCount} footprint không có mesh`}</button>}
        <div className="board-feature-list">{pickerFeatures.map((feature: BoardFeature) => <button key={feature.id} type="button" aria-pressed={selectedFeatureId === feature.id} className={selectedFeatureId === feature.id ? 'board-feature-active' : ''} onFocus={() => { sceneRef.current?.setHover(feature.id); onHoverFeature(feature.id) }} onBlur={() => { sceneRef.current?.setHover(''); onHoverFeature('') }} onClick={() => onSelectFeature(feature.id)}>{feature.name}{getFeatureEvidence(feature).labels.map((label) => <small key={label} className="board-feature-model-status">{label}</small>)}</button>)}</div>
        {pickerFeatures.length === 0 && <p className="board-feature-empty">Không tìm thấy linh kiện khớp. Thử designator như C1, U1 hoặc xóa cụm tìm kiếm.</p>}
      </div>
      <p className="board-viewer-note">{activeScene.note}</p>
    </div>
  )
}
