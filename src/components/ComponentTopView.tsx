import { useState } from 'react'
import type { ComponentMesh } from '../data/componentModels'
import componentTopViews from '../data/componentTopViews.json'
import { projectTopViewPoint, type TopViewBounds } from '../lib/boardTopView'

type Projection = { image: string; width: number; height: number; boundsMm: TopViewBounds; front?: boolean }
const projections: Record<string, Projection> = componentTopViews

type Props = {
  mesh: ComponentMesh
  name: string
  pins: readonly { id: string; label: string }[]
  selectedPin?: string
  onPinSelect: (id: string) => void
  sourceHref?: string
}

export default function ComponentTopView({ mesh, name, pins, selectedPin, onPinSelect, sourceHref = '/models/components/NOTICE.txt' }: Props) {
  const [zoom, setZoom] = useState(1)
  const [imageFailed, setImageFailed] = useState(false)
  const view = projections[mesh.sha256.toLowerCase()]
  if (!view || imageFailed) return <p role="status">Hình chiếu 2D chưa mở được. Bạn vẫn có thể xem hình tham khảo và tra chân.</p>
  const rect = { x: 0, y: 0, width: view.width, height: view.height }
  const label = view.front ? 'Mặt trước 2D' : 'Mặt trên 2D'
  return <section className="component-top-view" aria-label={label + ' ' + name}>
    <div className="component-top-viewport">
      <div className="component-top-plane" style={{ width: `${zoom * 100}%` }}>
        <img src={view.image} width={view.width} height={view.height} alt={`Hình chiếu vuông góc của ${name}`} onError={() => setImageFailed(true)} />
        {pins.map(pin => {
          const anchor = mesh.pinsMm[pin.id]
          const point = projectTopViewPoint(view.boundsMm, rect, view.front && anchor ? [anchor[0], anchor[2], -anchor[1]] : anchor ?? [])
          if (!point) return null
          return <button className="component-top-pin" style={{ left: `${point.x / view.width * 100}%`, top: `${point.y / view.height * 100}%` }}
            key={pin.id} type="button" aria-label={`Chọn chân ${pin.label} trên hình`}
            title={pin.label} aria-pressed={selectedPin === pin.id} onClick={() => onPinSelect(pin.id)} />
        })}
      </div>
    </div>
    <div className="component-top-actions" role="group" aria-label="Thu phóng linh kiện 2D">
      <button className="button-secondary" type="button" disabled={zoom === 1} onClick={() => setZoom(zoom - .5)}>Thu nhỏ</button>
      <button className="button-secondary" type="button" disabled={zoom === 2.5} onClick={() => setZoom(zoom + .5)}>Phóng to</button>
    </div>
    <p className="component-visual-source">Hình chiếu từ mô hình tham chiếu. <a href={sourceHref}>Nguồn mô hình</a></p>
  </section>
}
