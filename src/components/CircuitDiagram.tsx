import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { CircuitPart } from '../data/lessons'

type CircuitDiagramProps = {
  parts: CircuitPart[]
  selectedId: string
  highlightedIds: string[]
  ledLit?: boolean
  onSelect: (partId: string) => void
}

type SceneStyle = CSSProperties & { '--fit-scale': number }

const componentGlyphs: Record<string, string> = {
  esp32: 'ESP32',
  breadboard: 'BREADBOARD',
  led: 'LED',
  resistor: '220 Ω',
  jumper: 'JUMPER WIRES',
}

export function CircuitDiagram({ parts, selectedId, highlightedIds, ledLit = false, onSelect }: CircuitDiagramProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(-12)
  const [tilt, setTilt] = useState(52)
  const highlighted = new Set(highlightedIds)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => {
      setFitScale(Math.min(1, Math.max(0.38, (entry.contentRect.width - 24) / 760)))
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const sceneStyle: SceneStyle = {
    '--fit-scale': fitScale,
    transform: `translate(-50%, -50%) rotateX(${tilt}deg) rotateZ(${rotation}deg) scale(${zoom * fitScale})`,
  }

  const isActive = (id: string) => selectedId === id || highlighted.has(id)
  const selectByKeyboard = (event: KeyboardEvent<SVGPathElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect('jumper')
    }
  }

  return (
    <figure className="circuit-figure">
      <div className="circuit-toolbar">
        <span><i /> MÔ HÌNH MẠCH TƯƠNG TÁC</span>
        <span>Chọn một linh kiện để khám phá</span>
      </div>
      <div className="circuit-stage" ref={stageRef}>
        <div className="circuit-stage-grid" aria-hidden="true" />
        <div className="circuit-model" style={sceneStyle} role="group" aria-label="Mô hình 3D minh họa mạch ESP32 điều khiển đèn LED">
          <div className="model-ground" aria-hidden="true" />

          <svg className="model-wires" viewBox="0 0 760 440" aria-label="Hai đường nối của mạch">
            <path className={`wire-shadow ${isActive('jumper') ? 'wire-active' : ''}`} d="M259 179H316V164H462 M514 164H542V175H552" />
            <path className="wire-signal" d="M259 179H316V164H462 M514 164H542V175H552" />
            <path className={`wire-shadow wire-ground ${isActive('jumper') ? 'wire-active' : ''}`} d="M259 285H300V384H571V211" />
            <path className="wire-return" d="M259 285H300V384H571V211" />
            <path className="wire-hit" d="M259 179H316V164H462 M514 164H542V175H552" role="button" tabIndex={0} aria-label="Chọn dây tín hiệu từ GPIO 23" aria-pressed={selectedId === 'jumper'} onClick={() => onSelect('jumper')} onKeyDown={selectByKeyboard} />
            <path className="wire-hit" d="M259 285H300V384H571V211" role="button" tabIndex={0} aria-label="Chọn dây nối GND" aria-pressed={selectedId === 'jumper'} onClick={() => onSelect('jumper')} onKeyDown={selectByKeyboard} />
            <circle className="wire-terminal" cx="259" cy="179" r="6" />
            <circle className="wire-terminal" cx="259" cy="285" r="6" />
          </svg>

          <button className={`scene-part scene-esp32 ${isActive('esp32') ? 'part-active' : ''}`} style={{ left: 76, top: 78 }} type="button" onClick={() => onSelect('esp32')} aria-label="Chọn ESP32 DevKit V1" aria-pressed={selectedId === 'esp32'}>
            <span className="usb-port" />
            <span className="esp-shield"><i /><i /><i /><i /><b>ESP32</b><small>WROOM · 32</small></span>
            <span className="esp-led" />
            <span className="esp-pin-label gpio-label">GPIO 23</span>
            <span className="esp-pin-label gnd-label">GND</span>
            <span className="esp-pins esp-pins-left" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</span>
            <span className="esp-pins esp-pins-right" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</span>
            <span className="mesh-caption">{componentGlyphs.esp32}</span>
          </button>

          <button className={`scene-part scene-breadboard ${isActive('breadboard') ? 'part-active' : ''}`} style={{ left: 351, top: 73 }} type="button" onClick={() => onSelect('breadboard')} aria-label="Chọn breadboard" aria-pressed={selectedId === 'breadboard'}>
            <span className="breadboard-rail rail-positive">+</span>
            <span className="breadboard-rail rail-negative">−</span>
            <span className="breadboard-holes" />
            <span className="breadboard-groove" />
            <span className="breadboard-holes lower-holes" />
            <span className="breadboard-rail rail-positive rail-bottom">+</span>
            <span className="breadboard-rail rail-negative rail-bottom">−</span>
            <span className="mesh-caption">{componentGlyphs.breadboard}</span>
          </button>

          <button className={`scene-part scene-resistor ${isActive('resistor') ? 'part-active' : ''}`} style={{ left: 439, top: 144 }} type="button" onClick={() => onSelect('resistor')} aria-label="Chọn điện trở 220 ôm" aria-pressed={selectedId === 'resistor'}>
            <span className="resistor-leg resistor-left" /><span className="resistor-body"><i /><i /><i /><i /></span><span className="resistor-leg resistor-right" />
            <span className="mesh-caption">{componentGlyphs.resistor}</span>
          </button>

          <button className={`scene-part scene-led ${isActive('led') ? 'part-active' : ''} ${ledLit ? 'led-lit' : 'led-unlit'}`} style={{ left: 533, top: 145 }} type="button" onClick={() => onSelect('led')} aria-label={`Chọn đèn LED đỏ, hiện đang ${ledLit ? 'sáng' : 'tắt'}`} aria-pressed={selectedId === 'led'}>
            <span className="led-leg led-anode" /><span className="led-leg led-cathode" /><span className="led-dome" /><span className="led-light" />
            <span className="mesh-caption">LED · A / K</span>
          </button>

          <button className={`scene-part scene-wire-label ${isActive('jumper') ? 'part-active' : ''}`} style={{ left: 285, top: 305 }} type="button" onClick={() => onSelect('jumper')} aria-label="Chọn dây jumper" aria-pressed={selectedId === 'jumper'}>
            <span className="wire-coil"><i /><i /><i /></span><span className="mesh-caption">{componentGlyphs.jumper}</span>
          </button>
        </div>
        <div className="circuit-controls" aria-label="Điều khiển góc nhìn mô hình">
          <button type="button" onClick={() => setRotation((angle) => angle - 12)} aria-label="Xoay mô hình sang trái">↶</button>
          <button type="button" onClick={() => setRotation((angle) => angle + 12)} aria-label="Xoay mô hình sang phải">↷</button>
          <button type="button" onClick={() => setTilt((angle) => Math.max(38, angle - 6))} aria-label="Hạ góc nhìn để xem mạch từ phía trước">⤒</button>
          <button type="button" onClick={() => setTilt((angle) => Math.min(70, angle + 6))} aria-label="Nâng góc nhìn để xem mạch từ phía trên">⤓</button>
          <span className="control-divider" />
          <button type="button" onClick={() => setZoom((value) => Math.max(0.82, Number((value - 0.1).toFixed(2))))} aria-label="Thu nhỏ mô hình">−</button>
          <span className="zoom-readout">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.3, Number((value + 0.1).toFixed(2))))} aria-label="Phóng to mô hình">+</button>
          <button type="button" onClick={() => { setRotation(-12); setTilt(52); setZoom(1) }} aria-label="Đưa mô hình về góc nhìn ban đầu">Đặt lại</button>
        </div>
      </div>
      <figcaption>
        <span><i className="legend-signal" /> GPIO 23 → điện trở → LED</span>
        <span><i className="legend-return" /> LED → GND</span>
        <span>Minh họa 3D · không mô phỏng dòng điện</span>
      </figcaption>
      <div className="part-quick-select" role="group" aria-label="Chọn linh kiện trên mô hình">
        {parts.map((part) => <button key={part.id} type="button" className={selectedId === part.id ? 'quick-part-active' : ''} aria-pressed={selectedId === part.id} onClick={() => onSelect(part.id)}>{part.name}</button>)}
      </div>
    </figure>
  )
}
