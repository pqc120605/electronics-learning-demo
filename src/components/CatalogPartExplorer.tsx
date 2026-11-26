import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCatalogPart } from '../data/catalogParts'
import { catalogPackageAssets, getComponentMesh } from '../data/componentModels'
import { useProductRoute } from '../lib/useProductRoute'
import { catalogR1Spice } from '../simulation/catalogR1Spice'
import { CatalogR1DigitalLab } from './learning/CatalogR1DigitalLab'
import { CatalogR2aLab } from './learning/CatalogR2aLab'
import { CatalogR2bLab } from './learning/CatalogR2bLab'
import { CatalogR4Lab } from './learning/CatalogR4Lab'
import { CatalogR5Lab } from './learning/CatalogR5Lab'
import { catalogR2bSpice } from '../simulation/catalogR2bSpice'
import { catalogR3Spice } from '../simulation/catalogR3Spice'
import './CatalogR1Explorer.css'

const ModelViewer = lazy(() => import('./ComponentModelViewer').then(module => ({ default: module.ComponentModelViewer })))
type View = 'symbol' | 'footprint' | '3d'
type Props = {
  id: string
  pinId?: string
  onPinSelect?: (id: string) => void
  describeNet?: (id: string) => string
  includePractice?: boolean
}

export function CatalogPartExplorer({ id, pinId, onPinSelect, describeNet, includePractice = true }: Props) {
  const part = getCatalogPart(id)
  const route = useProductRoute()
  const [view, setView] = useState<View>('symbol')
  const [localPin, setLocalPin] = useState<string>()
  const [failure, setFailure] = useState(false)
  if (!part) return null
  const mesh = getComponentMesh(part.id)
  const { pads, maxOffsetMm, footprint } = catalogPackageAssets[part.packageKey]
  const selected = part.pins.find(pin => pin.id === (onPinSelect ? pinId : localPin))
  const pick = onPinSelect ?? setLocalPin
  const surfaceMount = pads.every(pad => pad.drill === 0)
  const padTarget = surfaceMount ? 0 : pads.length > 24 ? 16 : 24
  const spiceLabs = [...catalogR1Spice, ...catalogR2bSpice, ...catalogR3Spice].filter(item => item.parts.includes(part.catalogId))
  const diode = ['1n4148','1n4007','1n5819','1n4733a'].includes(part.catalogId)
  const bjt = ['2n3904','2n3906','tip120'].includes(part.catalogId)
  const mosfet = ['irlz44n','2n7000'].includes(part.catalogId)
  const separatesRight = (pin: typeof part.pins[number]) => diode ? pin.id === 'k'
    : bjt ? pin.id === 'c' || pin.id === 'e' : mosfet ? pin.id === 'd' || pin.id === 's' : (pin.electricalType === 'output' || pin.electricalType === 'bidirectional' && /^b/.test(pin.id))
  const left = part.pins.filter(pin => !separatesRight(pin))
  const right = part.pins.filter(separatesRight)
  if (part.catalogId === '2n3904' || part.catalogId === '2n3906' || part.catalogId === '2n7000') right.reverse()
  const xMin = Math.min(...pads.map(pad => pad.x - Math.max(pad.width / 2, 1)))
  const zMin = Math.min(...pads.map(pad => pad.z - Math.max(pad.height / 2, 1)))
  const width = Math.max(...pads.map(pad => pad.x + Math.max(pad.width / 2, 1))) - xMin
  const height = Math.max(...pads.map(pad => pad.z + Math.max(pad.height / 2, 1))) - zMin
  const scale = Math.min(270 / width, 275 / height)
  const pinButton = (pin: typeof part.pins[number]) => <button type="button" key={pin.id}
    aria-label={`Chọn chân ${pin.label} · pad ${pin.pad}`} aria-pressed={selected?.id === pin.id}
    onClick={() => pick(pin.id)}><span>{pin.pad}</span> {pin.label}</button>

  return <section className="part-r1" aria-label={`Biến thể ${part.mpn}`}>
    <header><strong>{part.mpn}</strong><p>{part.manufacturer} · {part.packageName} · {part.revision}</p>{part.revision !== "R1" && <a href={part.source + "#page=" + part.pinoutPage} target="_blank" rel="noreferrer">Pinout {part.datasheet} · trang {part.pinoutPage} ↗</a>}</header>
    <div className="part-r1-tabs" role="group" aria-label="Biểu diễn linh kiện">
      {([['symbol', 'Sơ đồ 2D'], ['footprint', 'Footprint'], ['3d', 'Mô hình 3D']] as const).map(([value, label]) =>
        <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}
    </div>
    {view === 'symbol' && <div className="part-r1-symbol" aria-label="Ký hiệu và chân chức năng">
      <div>{left.map(pinButton)}</div>
      <div className="part-r1-symbol-body">
        {diode ? <svg viewBox="0 0 60 36" role="img" aria-label="Ký hiệu diode">
          <path d="M2 18h16m0-10 20 10-20 10zM38 7v22m0-11h20" fill="none" stroke="currentColor" strokeWidth="2" />
          {part.catalogId === '1n4733a' && <path d="M38 7l5-3M38 29l-5 3" fill="none" stroke="currentColor" strokeWidth="2" />}
          {part.catalogId === '1n5819' && <path d="M34 11V7h4m0 22h4v-4" fill="none" stroke="currentColor" strokeWidth="2" />}
        </svg> : bjt && part.catalogId !== 'tip120' ? <svg viewBox="0 0 60 48" role="img" aria-label={'Ký hiệu transistor ' + (part.catalogId === '2n3906' ? 'PNP' : 'NPN')}>
          <path d={'M2 24h17m0-11v22m0-18L41 8h17M19 31l22 9h17 ' + (part.catalogId === '2n3906' ? 'M26 37l-5-5 7 1' : 'M33 32l6 7-9-1')} fill="none" stroke="currentColor" strokeWidth="2" />
        </svg> : mosfet ? <svg viewBox="0 0 60 48" role="img" aria-label="Ký hiệu MOSFET kênh N">
          <path d="M2 24h17m0-10v20m5-19v18m0-16h15V8h18M24 31h15v9h18M41 23H26m5-4-5 4 5 4m10-4v17" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg> : part.mpn}
      </div>
      <div>{right.map(pinButton)}</div>
    </div>}
    {view === 'footprint' && <>
      <div className="part-r1-pad-area" aria-label="Footprint mặt trên">
        <div className="part-r1-pad-plane" style={{ width: width * scale, height: height * scale }}>
          {!surfaceMount && (part.packageKey.startsWith('dip') || part.revision === 'R5') && <span aria-hidden="true" className="part-r1-footprint-body" />}
          {pads.map((pad, contactIndex) => {
            const pin = part.pins.find(pin => pin.pad === pad.pad)!
            return <button type="button" key={contactIndex} className="part-r1-pad" data-pad={pad.pad}
              style={{ left: (pad.x - xMin) * scale, top: (pad.z - zMin) * scale,
                width: Math.max(padTarget, pad.width * scale), height: Math.max(padTarget, pad.height * scale), minHeight: 0, minWidth: 0,
                borderRadius: pad.shape === 'rect' ? '1px' : pad.shape === 'roundrect' ? '4px' : '50%' }}
              aria-label={`Pad ${pad.pad} · ${pin.label}`} title={pad.drill ? "Lỗ Ø" + pad.drill + " mm" : "Pad dán mặt"}
              aria-pressed={selected?.id === pin.id} onClick={() => pick(pin.id)}>{pad.pad}</button>
          })}
        </div>
      </div>
      <p className="part-r1-caption">KiCad 10.0.7 · {pads.length} pad {surfaceMount ? "SMD" : "xuyên lỗ"} · nhìn từ mặt trên.</p>
      {new Set(pads.map(item => item.pad)).size < pads.length && <p className="part-r1-caption">Các vùng đồng cùng số pad về cùng một chân điện.</p>}
      {part.revision !== 'R1' && <a href={'/models/components/catalog-' + part.revision.toLowerCase() + '/' + footprint.split('/').at(-1)} download>Tải footprint KiCad ↧</a>}
    </>}
    {view === '3d' && mesh && !failure && <Suspense fallback={<p role="status">Đang tải mô hình 3D…</p>}>
      <ModelViewer mesh={mesh} name={part.mpn} onError={() => setFailure(true)}
        pins={part.pins} selectedPin={selected?.id} onPinSelect={pick} />
    </Suspense>}
    {view === '3d' && <p className="part-r1-caption">{failure ? 'WebGL không mở được. Vẫn có thể chọn pin từ footprint.' : (part.revision === 'R4' || part.revision === 'R5') ? mesh?.modelNote : surfaceMount ? 'STEP KiCad, chân SMD khớp vùng pad.' : `STEP KiCad, dạng lắp. Sai lệch tâm chân–pad ${maxOffsetMm} mm trong phép kiểm hình học.`}</p>}
    <div className="part-r1-selection" role="status">
      {selected ? <><strong>Chân {selected.label} · pad {selected.pad}</strong>
        {describeNet && <span> · {describeNet(selected.id)}</span>}</> : 'Chọn một chân để đối chiếu giữa các chế độ xem.'}
    </div>
    {view !== 'symbol' && <details><summary>Danh sách chân</summary><div className="part-r1-pin-list">{part.pins.map(pinButton)}</div></details>}
    {includePractice && <section className="part-r1-practice" aria-label="Bài thử điện theo datasheet">
      <h2>Bài thử điện</h2><p>{part.scope}</p>
      {part.revision === 'R5' ? <CatalogR5Lab part={part} />
        : part.revision === 'R4' ? <CatalogR4Lab part={part} />
        : part.revision === 'R2B' && !spiceLabs.length ? <CatalogR2bLab part={part} />
        : part.simulation === 'digital'
        ? part.revision === 'R2A' ? <CatalogR2aLab part={part} /> : <CatalogR1DigitalLab id={part.catalogId} />
        : <ul>{spiceLabs.map(item => <li key={item.id}>
          <Link to={route('/tools/spice?' + new URLSearchParams({ lab: item.id }))}>{item.name} · ngspice</Link>
        </li>)}</ul>}
      {part.revision === 'R3' && <Link to={route('/build/freestyle?fixture=' + part.id)}>Mở mạch thử đã nối trên bàn tự do</Link>}
    </section>}
  </section>
}
