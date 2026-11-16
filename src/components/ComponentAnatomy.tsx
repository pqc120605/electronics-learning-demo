import { useState, type KeyboardEvent, type ReactNode } from 'react'
import type { AnatomyPart, ComponentAnatomy as Anatomy } from '../data/componentAnatomy'
import './ComponentAnatomy.css'

const PIN_COLORS = { power: '#c8372d', ground: '#2b3242', signal: '#0f7c80', analog: '#8a4f06', bus: '#5a4fb0' } as const

function chipLegs(part: AnatomyPart): ReactNode {
  const count = Math.max(2, Math.min(14, Math.round(part.w / 10)))
  const step = part.w / (count + 1)
  return Array.from({ length: count }, (_, index) => <g key={index}><rect x={part.x + step * (index + 1) - 2} y={part.y - 5} width="4" height="5" className="anat-leg" /><rect x={part.x + step * (index + 1) - 2} y={part.y + part.h} width="4" height="5" className="anat-leg" /></g>)
}

function Shape({ part }: { part: AnatomyPart }) {
  const { x, y, w, h } = part
  const cx = x + w / 2
  const cy = y + h / 2
  switch (part.shape) {
    case 'chip': return <>{chipLegs(part)}<rect x={x} y={y} width={w} height={h} rx="3" className="anat-chip" /><circle cx={x + 6} cy={y + 6} r="2.5" className="anat-pin1" /></>
    case 'module': return <><rect x={x} y={y} width={w} height={h} rx="4" className="anat-pcb-module" /><rect x={x + 8} y={y + h * .32} width={w - 16} height={h * .62} rx="3" className="anat-can" /><path d={`M${x + 10} ${y + 10}h${w * .7}v${h * .08}h-${w * .6}v${h * .08}h${w * .6}`} className="anat-antenna" /></>
    case 'crystal': return <rect x={x} y={y} width={w} height={h} rx={h / 2} className="anat-crystal" />
    case 'cap': return <>{[0, 1, 2].map(index => <rect key={index} x={x + index * (w / 3) + 2} y={y} width={w / 3 - 4} height={h} rx="2" className="anat-smd-cap" />)}</>
    case 'elcap': return <>{[0, 1].map(index => { const r = Math.min(w / 4, h / 2) - 1; const ox = x + w / 4 + index * w / 2; return <g key={index}><circle cx={ox} cy={cy} r={r} className="anat-elcap" /><path d={`M${ox - r} ${cy}a${r} ${r} 0 0 1 ${r * .6} ${-r * .8}`} className="anat-elcap-band" /></g> })}</>
    case 'resistor': return <>{[0, 1, 2].map(index => <g key={index}><rect x={x + index * (w / 3) + 2} y={y} width={w / 3 - 4} height={h} rx="1.5" className="anat-smd-res" /></g>)}</>
    case 'led': return <><circle cx={cx} cy={cy} r={Math.min(w, h) / 2} className="anat-led" /><circle cx={cx - w * .12} cy={cy - h * .12} r={Math.min(w, h) / 7} className="anat-led-shine" /></>
    case 'button': return <><rect x={x} y={y} width={w} height={h} rx="3" className="anat-button" /><circle cx={cx} cy={cy} r={Math.min(w, h) * .3} className="anat-button-cap" /></>
    case 'pot': return <><rect x={x} y={y} width={w} height={h} rx="3" className="anat-pot" /><circle cx={cx} cy={cy} r={Math.min(w, h) * .32} className="anat-pot-knob" /><path d={`M${cx - 6} ${cy}h12M${cx} ${cy - 6}v12`} className="anat-pot-cross" /></>
    case 'transducer': { const r = Math.min(w, h) / 2; return <><circle cx={cx} cy={cy} r={r} className="anat-can" /><circle cx={cx} cy={cy} r={r * .78} className="anat-mesh" />{[-.4, 0, .4].map(offset => <path key={offset} d={`M${cx - r * .7} ${cy + offset * r}h${r * 1.4}`} className="anat-mesh-line" />)}</> }
    case 'terminal': { const n = Math.max(2, Math.round(Math.max(w, h) / 40)); const vertical = h > w; return <><rect x={x} y={y} width={w} height={h} rx="3" className="anat-terminal" />{Array.from({ length: n }, (_, index) => { const px = vertical ? cx : x + w * (index + .5) / n; const py = vertical ? y + h * (index + .5) / n : cy; return <g key={index}><circle cx={px} cy={py} r="7" className="anat-screw" /><path d={`M${px - 5} ${py}h10`} className="anat-screw-slot" /></g> })}</> }
    case 'relay': return <><rect x={x} y={y} width={w} height={h} rx="4" className="anat-relay" /></>
    case 'heatsink': return <><rect x={x} y={y} width={w} height={h} rx="2" className="anat-heatsink" />{Array.from({ length: Math.floor(w / 14) }, (_, index) => <rect key={index} x={x + 6 + index * 14} y={y + 4} width="6" height={h - 8} className="anat-fin" />)}</>
    case 'usb': return <><rect x={x} y={y} width={w} height={h} rx="3" className="anat-usb" /><rect x={x + w * .25} y={y + h * .3} width={w * .5} height={h * .4} rx="2" className="anat-usb-mouth" /></>
    case 'lens': return <><ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} className="anat-lens" />{[.25, .5, .75].map(f => <ellipse key={f} cx={cx} cy={cy} rx={w / 2 * f} ry={h / 2 * f} className="anat-lens-ring" />)}</>
    case 'display': return <><rect x={x} y={y} width={w} height={h} rx="4" className="anat-display" /><rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} rx="2" className="anat-display-glass" /></>
    case 'jumper': { const n = Math.max(2, Math.round(Math.max(w, h) / 12)); return <><rect x={x} y={y} width={w} height={h} rx="2" className="anat-jumper" />{Array.from({ length: n }, (_, index) => <circle key={index} cx={w >= h ? x + w * (index + .5) / n : cx} cy={w >= h ? cy : y + h * (index + .5) / n} r="2.5" className="anat-jumper-pin" />)}</> }
    case 'diode': { const n = Math.max(1, Math.round(w / 26)); return <>{Array.from({ length: n }, (_, index) => { const dw = w / n - 4; const dx = x + index * (w / n) + 2; return <g key={index}><rect x={dx} y={y} width={dw} height={h} rx="2" className="anat-diode" /><rect x={dx + dw - 5} y={y} width="3" height={h} className="anat-diode-band" /></g> })}</> }
    case 'sensor': return <circle cx={cx} cy={cy} r={Math.min(w, h) / 2} className="anat-sensor" />
    default: return <rect x={x} y={y} width={w} height={h} className="anat-chip" />
  }
}

export function ComponentAnatomy({ anatomy }: { anatomy: Anatomy }) {
  const [selectedId, setSelectedId] = useState(anatomy.parts[0]?.id ?? '')
  const selected = anatomy.parts.find(part => part.id === selectedId)
  const pad = 24
  const pinBand = 46
  const { w, h } = anatomy.board
  const width = w + pad * 2 + (anatomy.pinEdge === 'left' ? pinBand : 0)
  const height = h + pad * 2 + (anatomy.pinEdge === 'left' ? 0 : pinBand)
  const ox = pad + (anatomy.pinEdge === 'left' ? pinBand : 0)
  const oy = pad + (anatomy.pinEdge === 'top' ? pinBand : 0)
  const choose = (event: KeyboardEvent<SVGGElement>, id: string) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(id) } }

  return <figure className="component-anatomy">
    <figcaption><strong>Cấu tạo mạch · {anatomy.title}</strong><span>Bấm vào từng linh kiện trên board để xem vai trò. Sơ đồ vẽ lại theo bản phổ biến, không phải ảnh hay CAD của hãng.</span></figcaption>
    <div className="component-anatomy-body">
      <svg className="mm-keep-light" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`Sơ đồ cấu tạo ${anatomy.title}`}>
        <g transform={`translate(${ox} ${oy})`}>
          <rect width={w} height={h} rx="10" fill={anatomy.board.color} className="anat-board" />
          {[[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]].map(([hx, hy]) => <circle key={`${hx}-${hy}`} cx={hx} cy={hy} r="5" className="anat-hole" />)}
          {anatomy.parts.map(part => <g key={part.id} className={`anat-part ${selectedId === part.id ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-pressed={selectedId === part.id} aria-label={`${part.label} · ${part.name}`} onClick={() => setSelectedId(part.id)} onKeyDown={event => choose(event, part.id)}>
            <Shape part={part} />
            <rect x={part.x - 4} y={part.y - 8} width={part.w + 8} height={part.h + 16} rx="6" className="anat-focus" />
            <text x={part.x + part.w / 2} y={part.shape === 'chip' || part.shape === 'module' ? part.y + part.h / 2 + 4 : part.y + part.h + 16} className={`anat-label ${part.shape === 'chip' || part.shape === 'module' ? 'is-inside' : ''}`}>{part.label}</text>
          </g>)}
        </g>
        <g className="anat-header" transform={anatomy.pinEdge === 'left' ? `translate(${pad} ${oy + 20})` : `translate(${ox + 20} ${anatomy.pinEdge === 'top' ? pad : oy + h + 8})`}>
          {anatomy.pins.map((pin, index) => {
            const step = anatomy.pinEdge === 'left' ? Math.min(40, (h - 40) / Math.max(1, anatomy.pins.length - 1)) : Math.min(80, (w - 40) / Math.max(1, anatomy.pins.length - 1))
            const px = anatomy.pinEdge === 'left' ? 14 : index * step
            const py = anatomy.pinEdge === 'left' ? index * step : 10
            return <g key={pin.label} transform={`translate(${px} ${py})`}>
              <rect x="-6" y="-6" width="12" height="12" rx="2" className="anat-header-pin" />
              <circle r="3" fill={PIN_COLORS[pin.kind]} />
              <text x={anatomy.pinEdge === 'left' ? -12 : 0} y={anatomy.pinEdge === 'left' ? 4 : 24} textAnchor={anatomy.pinEdge === 'left' ? 'end' : 'middle'} className="anat-pin-label" fill={PIN_COLORS[pin.kind]}>{pin.label}<title>{pin.role}</title></text>
            </g>
          })}
        </g>
      </svg>
      <aside className="component-anatomy-info" aria-live="polite">
        {selected && <><p className="eyebrow">{selected.label}</p><h3>{selected.name}</h3><p>{selected.role}</p></>}
        <dl className="component-anatomy-pins">{anatomy.pins.map(pin => <div key={pin.label}><dt style={{ color: PIN_COLORS[pin.kind] }}>{pin.label}</dt><dd>{pin.role}</dd></div>)}</dl>
        <p className="component-anatomy-note">{anatomy.note}</p>
        <p className="component-anatomy-source">Nguồn đối chiếu: {anatomy.sources.join(' · ')}</p>
      </aside>
    </div>
  </figure>
}
