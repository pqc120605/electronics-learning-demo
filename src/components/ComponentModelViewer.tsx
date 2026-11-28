import { useEffect, useRef } from 'react'
import { BoardScene } from './board/BoardScene'
import type { BoardModelManifest, BoardSceneDefinition } from './board/boardSceneTypes'
import type { ComponentMesh } from '../data/componentModels'

type Props = { mesh: ComponentMesh; name: string; onError: () => void
  pins?: readonly { id: string; label: string; pad?: number }[]; selectedPin?: string; onPinSelect?: (id: string) => void }

const MODEL_LOAD_TIMEOUT_MS = 30_000

export function ComponentModelViewer({ mesh, name, onError, pins, selectedPin, onPinSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BoardScene | null>(null)
  const dragRef = useRef<{ x: number; y: number; distance: number } | null>(null)
  const errorRef = useRef(onError)
  errorRef.current = onError
  const pinRef = useRef(selectedPin)
  pinRef.current = selectedPin
  const markerRef = useRef<HTMLSpanElement>(null)
  const placeMarker = useRef(() => {})
  placeMarker.current = () => {
    const marker = markerRef.current
    const canvas = canvasRef.current
    const projected = pinRef.current ? sceneRef.current?.projectPin(pinRef.current) : null
    if (!marker || !canvas) return
    marker.hidden = !projected?.visible
    if (projected?.visible) {
      const rect = canvas.getBoundingClientRect()
      marker.style.left = (projected.x - rect.left + canvas.offsetLeft) + 'px'
      marker.style.top = (projected.y - rect.top + canvas.offsetTop) + 'px'
    }
  }
  useEffect(() => { placeMarker.current() }, [selectedPin])

  function pan(azimuth: number, elevation: number) {
    sceneRef.current?.rotate(azimuth, elevation)
    placeMarker.current()
  }

  function zoom(direction: -1 | 1) {
    sceneRef.current?.zoom(direction)
    placeMarker.current()
  }


  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), MODEL_LOAD_TIMEOUT_MS)
    let disposed = false
    const fail = () => { if (!disposed) errorRef.current() }
    let observer: ResizeObserver | undefined
    let scene: BoardScene | undefined
    const assetVersion = mesh.sha256.slice(0, 8)
    const assetUrl = `${mesh.file}?v=${assetVersion}`
    const definition: BoardSceneDefinition = { id: 'pcb', label: mesh.id, assetUrl, assetVersion, hotspots: [], note: '' }
    const mappedPins = (pins ?? []).flatMap((pin, index) => {
      const anchor = mesh.pinsMm[pin.id]
      if (!anchor || anchor.length !== 3) return []
      return [{ id: pin.id, position: pin.pad ?? index + 1, label: pin.label, side: 'reference' as const,
        padNumber: pin.pad === undefined ? undefined : String(pin.pad), anchor: anchor.map(value => value / 1000) as [number, number, number],
        plainDescription: '', technicalRole: '', connection: '', safetyNote: '', functions: [] }]
    })
    const manifest: BoardModelManifest = { id: mesh.id, assetUrl, assetVersion, features: [], hotspots: [], pins: mappedPins,
      signalFlows: [], scenes: [definition], pinPicking: Boolean(mappedPins.length) }
    try {
      scene = BoardScene.create(canvas)
      sceneRef.current = scene
      scene.load(manifest, definition, controller.signal).then(() => placeMarker.current()).catch(fail).finally(() => window.clearTimeout(timeout))
      canvas.addEventListener('webglcontextlost', fail)
      observer = new ResizeObserver(() => { scene?.resize(); placeMarker.current() })
      observer.observe(canvas)
    } catch {
      errorRef.current()
    }
    return () => {
      disposed = true
      window.clearTimeout(timeout)
      canvas.removeEventListener('webglcontextlost', fail)
      controller.abort()
      observer?.disconnect()
      scene?.dispose()
      sceneRef.current = null
    }
  }, [mesh, pins])

  return <div className="component-model-viewer">
    <canvas ref={canvasRef} role="img" aria-label={`Mô hình 3D ${name}`}
      onPointerDown={(event) => {
        dragRef.current = { x: event.clientX, y: event.clientY, distance: 0 }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current
        if (!drag) return
        const dx = event.clientX - drag.x
        const dy = event.clientY - drag.y
        dragRef.current = { x: event.clientX, y: event.clientY, distance: drag.distance + Math.hypot(dx, dy) }
        if (dragRef.current.distance > 4 || !onPinSelect) pan(dx * 0.012, -dy * 0.012)
      }}
      onPointerUp={(event) => {
        if ((dragRef.current?.distance ?? Infinity) <= 4 && onPinSelect) {
          const pin = sceneRef.current?.pickPin(event.clientX, event.clientY)
          if (pin) onPinSelect(pin)
        }
        dragRef.current = null
      }} onPointerCancel={() => { dragRef.current = null }} />
    {pins && <span ref={markerRef} className="component-model-marker" aria-hidden="true" hidden />}
    <div role="group" aria-label="Điều khiển mô hình 3D">
      <button type="button" aria-label="Xoay sang trái" onClick={() => pan(-0.4, 0)}>←</button>
      <button type="button" aria-label="Xoay sang phải" onClick={() => pan(0.4, 0)}>→</button>
      <button type="button" aria-label="Xoay lên" onClick={() => pan(0, 0.3)}>↑</button>
      <button type="button" aria-label="Xoay xuống" onClick={() => pan(0, -0.3)}>↓</button>
      <button type="button" aria-label="Phóng to" onClick={() => zoom(1)}>+</button>
      <button type="button" aria-label="Thu nhỏ" onClick={() => zoom(-1)}>−</button>
      <button type="button" onClick={() => { sceneRef.current?.resetView(); placeMarker.current() }}>Đặt lại</button>
    </div>
  </div>
}
