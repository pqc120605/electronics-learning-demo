import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { componentMeshKindLabels, componentMeshNotes, getComponentMesh, getComponentMeshForCatalog, kicadModelSource } from '../data/componentModels'
import { getComponentVisualNotice } from '../lib/componentVisualStatus'
import { ComponentIllustration } from './ComponentIllustration'

const ComponentModelViewer = lazy(() => import('./ComponentModelViewer').then((module) => ({ default: module.ComponentModelViewer })))
const formatSize = (size: number[]) => size.map((value) => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })).join(' × ')

type Props = { illustrationId: string; modelId?: string; name: string; className?: string; showModelStatus?: boolean; boardModelHref?: string }

/** Starts on the light 2D drawing; the mesh and its WebGL code load only when asked for. */
export function ComponentVisual({ illustrationId, modelId, name, className, showModelStatus = false, boardModelHref }: Props) {
  const mesh = getComponentMeshForCatalog(illustrationId) ?? (modelId ? getComponentMesh(modelId) : undefined)
  const [show3d, setShow3d] = useState(false)
  const [failed, setFailed] = useState(false)
  const illustration = <ComponentIllustration id={illustrationId} name={name} className={className} />
  if (!mesh) {
    if (!showModelStatus) return illustration
    const notice = getComponentVisualNotice({ hasPartMesh: false, boardModelHref })
    return <div className="component-visual">{illustration}<p className="component-visual-source"><strong>{notice?.title}</strong> · {notice?.description}{notice?.href && <> <Link to={notice.href}>{notice.linkLabel}</Link></>}</p></div>
  }
  return <div className="component-visual">
    {show3d && !failed ? <Suspense fallback={<p className="component-visual-status" role="status">Đang tải mô hình 3D…</p>}><ComponentModelViewer mesh={mesh} name={name} onError={() => setFailed(true)} /></Suspense> : illustration}
    {failed && <p className="component-visual-status" role="status">Không mở được mô hình 3D trên trình duyệt này, nên đang hiện hình 2D.</p>}
    {!failed && <button type="button" className="component-visual-toggle" aria-pressed={show3d} onClick={() => setShow3d(!show3d)}>{show3d ? 'Xem hình 2D' : 'Xem mô hình 3D'}</button>}
    {showModelStatus && !show3d && <p className="component-visual-source"><strong>{componentMeshKindLabels[mesh.kind]}</strong>{mesh.packageName ? ` · ${mesh.packageName}` : ''}</p>}
    {show3d && !failed && <p className="component-visual-source"><strong>{componentMeshKindLabels[mesh.kind]}</strong>{mesh.packageName ? ` · ${mesh.packageName}` : ''} · khoảng {formatSize(mesh.sizeMm)} mm. {mesh.modelNote ?? componentMeshNotes[mesh.kind]}{mesh.kind === 'source-cad-mesh' && <> Nguồn: <a href={kicadModelSource.url} target="_blank" rel="noreferrer">{kicadModelSource.label}</a>, {kicadModelSource.license}.</>}</p>}
  </div>
}
