import { lazy, Suspense, useMemo, useState, type FormEvent } from 'react'
import { getComponentMesh } from '../data/componentModels'
import type { R2cBreadboard } from '../data/catalogR2cBoards'
import { adjacentBreadboardHole } from '../lib/breadboardDiagram'
import { allBreadboardHoles, formatHole, holeNet, parseHole } from '../lib/breadboardGrid'
import type { CircuitDocV2 } from '../lib/circuitDocV2'
import { createNetIndexV2 } from '../lib/circuitNetsV2'
import './CatalogBreadboardExplorer.css'

const ModelViewer = lazy(() => import('./ComponentModelViewer').then(module => ({default: module.ComponentModelViewer})))
const labelOf = (id: string) => id.slice(4)
const centerFormat = (value: number) => value.toLocaleString('vi-VN',{maximumFractionDigits:2})

export function BreadboardContinuity({ doc, disabled = false }: { doc: CircuitDocV2; disabled?: boolean }) {
  const board = doc.breadboards[0]
  const nets = useMemo(() => createNetIndexV2(doc),[doc])
  const [reading,setReading] = useState<{ doc:CircuitDocV2; message:string }>()
  const supplied = doc.parts.some(part => {
    const pins = part.type==='board' ? ['vcc','v5'] : part.type==='battery' ? ['positive'] : []
    return pins.some(pin => {
      const net = nets.netOf(part.id + ':' + pin)
      return Boolean(net?.wireIds.size && net.holes.size)
    })
  })
  function measure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const read = (name: string) => {
      const raw = String(data.get(name)).trim()
      const input = raw.replace(/^bb1:/i,'').replace(/[a-j]$/i,letter=>letter.toLowerCase())
      const id = 'bb1:' + input.charAt(0).toUpperCase() + input.slice(1)
      return board && parseHole(id, board.spec) ? nets.netOf(id) : undefined
    }
    const first = read('first'), second = read('second')
    setReading({doc,message: !first || !second ? 'Lỗ không có trên mẫu.' : first === second ? 'Thông mạch · Hai lỗ cùng net.' : 'Hở · Hai lỗ khác net.'})
  }

  return <details className="r2c-continuity">
    <summary>Đo thông mạch ảo</summary>
    {supplied || disabled ? <p>Tạm dừng mô phỏng và ngắt dây nguồn khỏi breadboard để đo.</p> :
      <form onSubmit={measure}>
        <label>Đầu dò 1<input name="first" defaultValue="1a" maxLength={15} required /></label>
        <label>Đầu dò 2<input name="second" defaultValue="1e" maxLength={15} required /></label>
        <button type="submit">Đo thông mạch</button>
      </form>}
    {!supplied && !disabled && reading?.doc===doc && <output aria-label="Kết quả thông mạch">{reading.message}</output>}
  </details>
}

export function CatalogBreadboardExplorer({ profile }: { profile: R2cBreadboard }) {
  const [view,setView] = useState<'2d'|'footprint'|'3d'>('2d')
  const [selected,setSelected] = useState('bb1:1a')
  const [failed,setFailed] = useState(false)
  const [jumper,setJumper] = useState(false)
  const mesh = getComponentMesh(profile.catalogId)!
  const spec = profile.spec
  const { grid, sizeMm:[length,height,width] } = profile
  const pins = useMemo(() => allBreadboardHoles(spec).map((hole,index) => {
    const id = formatHole(hole,spec)!
    return { id, label:labelOf(id), pad:index+1, kind:hole.kind, net:holeNet(hole,{spec}) }
  }),[spec])
  const selectedNet = holeNet(selected,{spec})
  const coordinate = mesh.pinsMm[selected]
  const testDoc = useMemo<CircuitDocV2>(() => {
    const first = profile.railHoles ? 'bb1:T+:1' : 'bb1:1e'
    const second = profile.railHoles ? 'bb1:B+:1' : 'bb1:1f'
    return { schema:2, lessonId:'freestyle', breadboards:[{id:'bb1',spec,railSplit:false}], parts:[],
      wires:jumper ? [{id:'jumper',from:{kind:'hole',holeId:first},to:{kind:'hole',holeId:second}}] : [],
      expect:{partCount:0,wireCount:Number(jumper),netCount:Number(jumper)} }
  },[profile, spec, jumper])
  const name = 'Adafruit ' + profile.pid
  const labels = pins.filter(pin => pin.id.endsWith('j') &&
    (pin.id === 'bb1:1j' || pin.id === 'bb1:'+grid.columns+'j' || Number(labelOf(pin.id).slice(0,-1)) % 5 === 0))
  return <section className="part-r1 r2c-explorer" aria-label={'Biến thể '+name}>
    <header>
      <strong>{name} · {profile.pointCount} điểm</strong>
      <p>{[length,width,height].map(centerFormat).join(' × ')} mm · thân tham chiếu · bước 2,54 mm</p>
      <a href={profile.drawing} target="_blank" rel="noreferrer">Bản vẽ kỹ thuật ↗</a>
    </header>
    <div role="group" aria-label="Biểu diễn breadboard" className="part-r1-tabs">
      <button type="button" aria-pressed={view==='2d'} onClick={()=>setView('2d')}>Sơ đồ lỗ 2D</button>
      <button type="button" aria-pressed={view==='footprint'} onClick={()=>setView('footprint')}>Footprint</button>
      <button type="button" aria-pressed={view==='3d'} onClick={()=>setView('3d')}>Mô hình 3D</button>
    </div>
    {view!=='3d' && <div className="r2c-map-scroll" role="region" tabIndex={0} aria-label="Bản đồ lỗ breadboard có thể cuộn">
      <svg className={'r2c-map r2c-map--'+profile.pid} viewBox={[-length/2-1,-width/2-4,length+2,width+5].join(' ')}
        role="group" aria-label={view==='2d'?'Sơ đồ lỗ':'Footprint cơ khí'}>
        <rect x={-length/2} y={-width/2} width={length} height={width} rx="0.8" className="r2c-body" />
        <rect x={-length/2+1} y={-2} width={length-2} height={4} rx="0.4" className="r2c-gap" />
        {view==='2d' && profile.railHoles>0 && [[-25.7,'–'],[-18.85,'+'],[18.85,'–'],[25.7,'+']].map(([z,sign])=>
          <line key={z} className={sign==='+'?'r2c-rail-plus':'r2c-rail-minus'} x1={-length/2+3} x2={length/2-3} y1={z} y2={z}/>)}
        {view==='2d' && labels.map(pin=><text key={pin.id} x={mesh.pinsMm[pin.id][0]} y={-width/2-1} textAnchor="middle">{pin.label.slice(0,-1)}</text>)}
        {pins.map(pin=>{
          const [x,,z]=mesh.pinsMm[pin.id]
          return <g key={pin.id}>
            <rect aria-hidden="true" x={x-.5} y={z-.5} width={1} height={1}
              className={pin.id===selected?'is-selected':pin.net===selectedNet?'is-same-net':undefined} />
            <circle cx={x} cy={z} r={1.2} role="button" aria-label={'Lỗ '+pin.label} aria-pressed={pin.id===selected}
              data-r2c-hole={pin.id} tabIndex={pin.id===selected?0:-1} onClick={()=>setSelected(pin.id)}
              onKeyDown={event=>{
                if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(pin.id);return}
                const next=adjacentBreadboardHole(pin.id,event.key,spec)
                if(next){event.preventDefault();setSelected(next);event.currentTarget.ownerSVGElement?.querySelector<SVGCircleElement>('[data-r2c-hole="'+next+'"]')?.focus()}
              }} />
          </g>
        })}
      </svg>
    </div>}
    {view==='footprint' && <p>
      <a href={'/models/components/catalog-r2c/'+profile.footprintFile} download>Tải footprint cơ khí KiCad ↧</a>
      <br /><span className="part-r1-caption">Đường bao và lỗ tham chiếu trên Dwgs.User.</span>
    </p>}
    {view==='3d' && (failed ? <p role="status">WebGL không mở được. Dùng sơ đồ lỗ để tiếp tục.</p> :
      <Suspense fallback={<p role="status">Đang tải mô hình 3D…</p>}>
        <ModelViewer mesh={mesh} name={name} pins={pins} selectedPin={selected} onPinSelect={setSelected} onError={()=>setFailed(true)} />
      </Suspense>)}
    <label>Chọn lỗ
      <select value={selected} onChange={event=>setSelected(event.target.value)}>
        {pins.map(pin=><option key={pin.id} value={pin.id}>{pin.label}</option>)}
      </select>
    </label>
    <output className="r2c-hole-info" aria-label="Lỗ đang chọn">
      {labelOf(selected)} · X {centerFormat(coordinate[0])} mm · Z {centerFormat(coordinate[2])} mm · {pins.filter(pin=>pin.net===selectedNet).length} lỗ cùng dải
    </output>
    <label className="r2c-jumper"><input type="checkbox" checked={jumper} onChange={event=>setJumper(event.target.checked)}/>
      {profile.railHoles?'Nối jumper T+:1 với B+:1':'Nối jumper 1e với 1f'}</label>
    <BreadboardContinuity doc={testDoc}/>
  </section>
}
