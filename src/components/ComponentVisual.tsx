import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { componentMeshKindLabels, componentMeshNotes, getComponentMesh, getComponentMeshForCatalog, kicadModelSource } from '../data/componentModels'
import { getComponentVisualNotice } from '../lib/componentVisualStatus'
import { ComponentIllustration } from './ComponentIllustration'
import { ComponentAnatomy } from './ComponentAnatomy'
import { getComponentAnatomy } from '../data/componentAnatomy'

const ComponentModelViewer = lazy(() => import('./ComponentModelViewer').then((module) => ({ default: module.ComponentModelViewer })))
const ComponentTopView = lazy(() => import('./ComponentTopView'))
const formatSize = (size: number[]) => size.map((value) => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })).join(' × ')

type Props = {
  illustrationId: string
  modelId?: string
  name: string
  className?: string
  showModelStatus?: boolean
  boardModelHref?: string
  preview?: ReactNode
  pins?: readonly { id: string; label: string }[]
}

/** Starts on the light 2D drawing; the mesh and its WebGL code load only when asked for. */
export function ComponentVisual({ illustrationId, modelId, name, className, showModelStatus = false, boardModelHref, preview, pins }: Props) {
  const mesh = getComponentMeshForCatalog(illustrationId) ?? (modelId ? getComponentMesh(modelId) : undefined)
  const [view, setView] = useState<'overview' | 'top' | '3d'>('overview')
  const [failed, setFailed] = useState(false)
  const [selectedPin, setSelectedPin] = useState<string>()
  const modelPins = useMemo(() => pins?.filter(pin => mesh?.pinsMm[pin.id]?.length === 3), [pins, mesh])
  const anatomy = getComponentAnatomy(illustrationId)
  const illustration = anatomy ? <ComponentAnatomy anatomy={anatomy} /> : preview
    ?? <ComponentIllustration id={illustrationId} name={name} className={`${className ?? ''} mm-keep-light`} />
  if (!mesh) {
    if (!showModelStatus) return illustration
    const notice = getComponentVisualNotice({ hasPartMesh: false, boardModelHref })
    return <div className="component-visual">{illustration}<p className="component-visual-source"><strong>{notice?.title}</strong> · {notice?.description}{notice?.href && <> <Link to={notice.href}>{notice.linkLabel}</Link></>}</p></div>
  }
  const show3d = view === '3d' && !failed
  const selected = modelPins?.find(pin => pin.id === selectedPin)
  return <div className="component-visual">
    {show3d ? <Suspense fallback={<p className="component-visual-status" role="status">Đang tải mô hình 3D…</p>}>
      <ComponentModelViewer mesh={mesh} name={name} onError={() => setFailed(true)}
        pins={modelPins} selectedPin={selectedPin} onPinSelect={modelPins?.length ? setSelectedPin : undefined} />
    </Suspense> : view === 'top' ? <Suspense fallback={<p role="status">Đang mở mặt trên 2D…</p>}>
      <ComponentTopView mesh={mesh} name={name} pins={modelPins ?? []} selectedPin={selectedPin} onPinSelect={setSelectedPin} />
    </Suspense> : illustration}
    {failed && <p className="component-visual-status" role="status">Không mở được mô hình 3D trên trình duyệt này, nên đang hiện hình 2D.</p>}
    <div className="component-visual-modes" role="group" aria-label="Chế độ xem linh kiện">
      {showModelStatus && <button type="button" className="component-visual-toggle" aria-pressed={view === 'top'}
        onClick={() => setView(view === 'top' ? 'overview' : 'top')}>{view === 'top' ? 'Xem hình tham khảo' : 'Mặt trên 2D'}</button>}
      {!failed && <button type="button" className="component-visual-toggle" aria-pressed={show3d}
        onClick={() => setView(show3d ? 'overview' : '3d')}>{show3d ? 'Xem hình 2D' : 'Xem mô hình 3D'}</button>}
    </div>
    {view !== 'overview' && Boolean(modelPins?.length) && <div className="component-visual-pins">
      <label>Chân trên mô hình tham chiếu <select value={selectedPin ?? ''} onChange={event => setSelectedPin(event.target.value || undefined)}>
        <option value="">Chọn chân</option>
        {modelPins?.map(pin => <option key={pin.id} value={pin.id}>{pin.label}</option>)}
      </select></label>
      {selected && <span role="status">Đang xem chân {selected.label}</span>}
    </div>}
    {showModelStatus && !show3d && <p className="component-visual-source"><strong>{componentMeshKindLabels[mesh.kind]}</strong>{mesh.packageName ? ` · ${mesh.packageName}` : ''}</p>}
    {show3d && !failed && <p className="component-visual-source"><strong>{componentMeshKindLabels[mesh.kind]}</strong>{mesh.packageName ? ` · ${mesh.packageName}` : ''} · khoảng {formatSize(mesh.sizeMm)} mm. {mesh.modelNote ?? componentMeshNotes[mesh.kind]}{mesh.kind === 'source-cad-mesh' && <> Nguồn: <a href={kicadModelSource.url} target="_blank" rel="noreferrer">{kicadModelSource.label}</a>, {kicadModelSource.license}.</>}</p>}
  </div>
}
