import { useEffect, useRef } from 'react'
import { BoardScene } from './board/BoardScene'
import type { BoardModelManifest, BoardSceneDefinition } from './board/boardSceneTypes'
import type { ComponentMesh } from '../data/componentModels'

type Props = { mesh: ComponentMesh; name: string; onError: () => void }

const MODEL_LOAD_TIMEOUT_MS = 30_000

export function ComponentModelViewer({ mesh, name, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BoardScene | null>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const errorRef = useRef(onError)
  errorRef.current = onError

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
    const manifest: BoardModelManifest = { id: mesh.id, assetUrl, assetVersion, features: [], hotspots: [], pins: [], signalFlows: [], scenes: [definition], pinPicking: false }
    try {
      scene = BoardScene.create(canvas)
      sceneRef.current = scene
      scene.load(manifest, definition, controller.signal).catch(fail).finally(() => window.clearTimeout(timeout))
      canvas.addEventListener('webglcontextlost', fail)
      observer = new ResizeObserver(() => scene?.resize())
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
  }, [mesh])

  return <div className="component-model-viewer">
    <canvas ref={canvasRef} role="img" aria-label={`Mô hình 3D ${name}`}
      onPointerDown={(event) => { dragRef.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId) }}
      onPointerMove={(event) => { const drag = dragRef.current; if (!drag) return; sceneRef.current?.rotate((event.clientX - drag.x) * 0.012, -(event.clientY - drag.y) * 0.012); dragRef.current = { x: event.clientX, y: event.clientY } }}
      onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }} />
    <div role="group" aria-label="Điều khiển mô hình 3D">
      <button type="button" aria-label="Xoay sang trái" onClick={() => sceneRef.current?.rotate(-0.4, 0)}>←</button>
      <button type="button" aria-label="Xoay sang phải" onClick={() => sceneRef.current?.rotate(0.4, 0)}>→</button>
      <button type="button" aria-label="Xoay lên" onClick={() => sceneRef.current?.rotate(0, 0.3)}>↑</button>
      <button type="button" aria-label="Xoay xuống" onClick={() => sceneRef.current?.rotate(0, -0.3)}>↓</button>
      <button type="button" aria-label="Phóng to" onClick={() => sceneRef.current?.zoom(1)}>+</button>
      <button type="button" aria-label="Thu nhỏ" onClick={() => sceneRef.current?.zoom(-1)}>−</button>
      <button type="button" onClick={() => sceneRef.current?.resetView()}>Đặt lại</button>
    </div>
  </div>
}
