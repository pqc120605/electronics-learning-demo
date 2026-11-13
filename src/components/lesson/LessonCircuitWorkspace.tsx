import { useMemo, useState } from 'react'
import { componentRegistry } from '../../data/componentRegistry'
import { esp32DevkitModel } from '../../data/esp32DevkitModel'
import { getBoardModelEvidence } from '../../data/boardModelSources'
import { addWire, editWireEndpoint, removeWire, setWireRole } from '../../lib/circuitDocEdits'
import { createNetIndexV2 } from '../../lib/circuitNetsV2'
import type { CircuitDocV2, CircuitEndpointV2 } from '../../lib/circuitDocV2'
import { BreadboardEditor } from '../builder/BreadboardEditor'
import { CircuitSchematicV2 } from '../builder/CircuitSchematicV2'
import './LessonCircuitWorkspace.css'

export type LessonCircuitAction = { kind: 'pinMode' | 'write' | 'delay'; pin: number; value?: 'HIGH' | 'LOW'; previousLedLit?: boolean; line?: number }
export type LessonCircuitFlow = { wireIds: Set<string>; activeKeys: Set<string>; complete: boolean; label: string }

export function isLessonCircuitConnected(doc: CircuitDocV2): boolean {
  const index = createNetIndexV2(doc)
  return Boolean(index.netOf('board-1:ledOut')?.endpoints.has('res-1:a')
    && index.netOf('res-1:b')?.endpoints.has('led-1:anode')
    && index.netOf('led-1:cathode')?.endpoints.has('board-1:gnd'))
}

/** Educational code-to-topology mapping. It highlights declared nets, never voltage/current. */
export function getLessonCircuitFlow(doc: CircuitDocV2, action: LessonCircuitAction | null): LessonCircuitFlow {
  const empty = (label: string): LessonCircuitFlow => ({ wireIds: new Set(), activeKeys: new Set(), complete: false, label })
  if (!action) return empty('Chưa có dòng lệnh được chọn.')
  if (action.pin !== 23) return empty(`GPIO ${action.pin} chưa có ánh xạ đường mạch trong bài này.`)
  if (action.kind === 'pinMode') return empty('Cấu hình GPIO 23 là OUTPUT; chưa có lệnh đặt mức.')
  const level = action.kind === 'write' ? action.value : action.previousLedLit ? 'HIGH' : 'LOW'
  if (!level) return empty('Đang chờ; chưa có mức đầu ra để biểu diễn.')
  const index = createNetIndexV2(doc)
  const source = index.netOf('board-1:ledOut')
  const resistorOut = index.netOf('res-1:b')
  const ground = index.netOf('led-1:cathode')
  const outputConnected = Boolean(source?.endpoints.has('res-1:a'))
  const ledConnected = Boolean(resistorOut?.endpoints.has('led-1:anode'))
  const groundConnected = Boolean(ground?.endpoints.has('board-1:gnd'))
  if (!source || !outputConnected || !resistorOut || !ledConnected || !ground || !groundConnected) {
    const wires = new Set(source?.wireIds ?? [])
    return { wireIds: wires, activeKeys: new Set(source?.endpoints ?? []), complete: false, label: `GPIO 23 = ${level}; đường đi chưa khép kín theo các net hiện tại.` }
  }
  const nets = [source, resistorOut, ground]
  return {
    wireIds: new Set(nets.flatMap(net => [...net.wireIds])),
    activeKeys: new Set(nets.flatMap(net => [...net.endpoints])),
    complete: true,
    label: `GPIO 23 = ${level} · đường khai báo đi qua điện trở, LED và GND. Đây là trace bài học, không phải dòng điện hay điện áp đã giải.`
  }
}

type Props = {
  doc: CircuitDocV2
  activeAction: LessonCircuitAction | null
  selectedPartId: string
  onSelectPart: (partId: string) => void
  onSelectFeature?: (featureId: string) => void
}

type InfoTab = 'overview' | 'pins' | 'example' | 'specs'

export function LessonCircuitWorkspace({ doc: initialDoc, activeAction, selectedPartId, onSelectPart, onSelectFeature = () => {} }: Props) {
  const [doc, setDoc] = useState(() => structuredClone(initialDoc))
  const [view, setView] = useState<'breadboard' | 'schematic'>('breadboard')
  const [infoTab, setInfoTab] = useState<InfoTab>('overview')
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null)
  const [pendingEndpoint, setPendingEndpoint] = useState<CircuitEndpointV2 | null>(null)
  const [notice, setNotice] = useState('')
  const [featureId, setFeatureId] = useState(esp32DevkitModel.features[0]?.id ?? '')
  const flow = useMemo(() => getLessonCircuitFlow(doc, activeAction), [doc, activeAction])
  const part = doc.parts.find(item => item.id === selectedPartId) ?? doc.parts[0]
  const definition = componentRegistry.find(item => item.id === part?.type)
  const feature = esp32DevkitModel.features.find(item => item.id === featureId)
  const connected = isLessonCircuitConnected(doc)

  function update(result: { doc: CircuitDocV2; issues: Array<{ severity: string; message: string }> }) {
    const error = result.issues.find(issue => issue.severity === 'error')
    if (error) { setNotice(error.message); return }
    setDoc(result.doc)
    setNotice('Đã cập nhật mạch trong phiên bài học này. Để lưu dự án, mở Phòng lắp mạch và tạo bản nháp v5.')
  }

  function commitWire(from: CircuitEndpointV2, to: CircuitEndpointV2) {
    const id = `lesson-${Date.now()}-${doc.wires.length + 1}`
    update(addWire(doc, { id, from, to, role: 'signal' }))
  }

  return <section className="lesson-circuit-workspace" aria-label="Mạch bài học dùng CircuitDocV2">
    <div className="lesson-circuit-heading"><div><p className="eyebrow">MẠCH BÀI HỌC · CÙNG MỘT TOPOLOGY</p><h3>Lắp dây, sơ đồ và đường lệnh</h3></div><span>{doc.parts.length} linh kiện · {doc.wires.length} dây</span></div>
    <div className="lesson-circuit-layout">
      <div className="lesson-circuit-main">
        <div className="lesson-circuit-view-tabs" role="tablist" aria-label="Chế độ xem mạch bài học">
          <button type="button" role="tab" aria-selected={view === 'breadboard'} onClick={() => setView('breadboard')}>Breadboard và dây</button>
          <button type="button" role="tab" aria-selected={view === 'schematic'} onClick={() => setView('schematic')}>Schematic</button>
        </div>
        {view === 'breadboard'
          ? <BreadboardEditor doc={doc} selectedWireId={selectedWireId} pendingEndpoint={pendingEndpoint} activeWireIds={flow.wireIds} onSelectEndpoint={endpoint => { setPendingEndpoint(endpoint); if (endpoint.kind === 'pin') onSelectPart(endpoint.partId) }} onSelectWire={setSelectedWireId} onCommitWire={commitWire} onEditWireEndpoint={(id, end, endpoint) => update(editWireEndpoint(doc, id, end, endpoint))} onSetWireRole={(id, role) => update(setWireRole(doc, id, role))} onRemoveWire={id => update(removeWire(doc, id))} notice={notice} />
          : <CircuitSchematicV2 doc={doc} selectedKey={selectedPartId} selectedWireId={selectedWireId} activeKeys={flow.activeKeys} onSelectPart={onSelectPart} onSelectWire={setSelectedWireId} />}
        <div className={`lesson-signal-flow ${flow.complete ? 'is-complete' : ''}`} role="status" aria-live="polite">
          <strong>Luồng theo dòng code đang chọn</strong><p>{flow.label}</p>
          <ol><li className={flow.complete ? 'flow-step-done' : ''}>GPIO 23 · đầu ra trong bài</li><li className={flow.complete ? 'flow-step-done' : ''}>Điện trở R1 · 220 Ω trong fixture giáo dục</li><li className={flow.complete ? 'flow-step-done' : ''}>LED → GND</li></ol>
          <small>Trace logic của bài học; không tính dòng/áp và không xác nhận mạch vật lý.</small>
        </div>
      </div>
      <aside className="lesson-circuit-inspector" aria-label="Thông tin linh kiện và board">
        <div className="lesson-circuit-part-list" role="group" aria-label="Chọn linh kiện trong sơ đồ">{doc.parts.map(item => <button key={item.id} type="button" aria-pressed={item.id === selectedPartId} onClick={() => onSelectPart(item.id)}>{componentRegistry.find(entry => entry.id === item.type)?.label ?? item.type}<small>{item.id}</small></button>)}</div>
        <div className="lesson-info-tabs" role="tablist" aria-label="Thông tin linh kiện"><button role="tab" aria-selected={infoTab === 'overview'} onClick={() => setInfoTab('overview')}>Tổng quan</button><button role="tab" aria-selected={infoTab === 'pins'} onClick={() => setInfoTab('pins')}>Chân</button><button role="tab" aria-selected={infoTab === 'example'} onClick={() => setInfoTab('example')}>Trong bài</button><button role="tab" aria-selected={infoTab === 'specs'} onClick={() => setInfoTab('specs')}>Thông số</button></div>
        {infoTab === 'overview' && <div><h4>{definition?.label ?? part?.type ?? 'Linh kiện'}</h4><p>{definition?.explanation ?? 'Chưa có mô tả registry.'}</p><p className="lesson-circuit-safety"><strong>Lưu ý:</strong> {definition?.safetyNotes ?? 'Chưa có dữ liệu an toàn.'}</p></div>}
        {infoTab === 'pins' && <div><h4>Chân và net đã khai báo</h4><ul>{(definition?.pins ?? []).map(pin => <li key={pin.id}><code>{part?.id}:{pin.id}</code> · {pin.label} · {pin.electricalType}</li>)}</ul></div>}
        {infoTab === 'example' && <div><h4>Board: khối chức năng</h4><label>Chọn khối board<select aria-label="Chọn khối chức năng board" value={featureId} onChange={event => { setFeatureId(event.target.value); onSelectFeature(event.target.value) }}>{esp32DevkitModel.features.map(item => <option key={item.id} value={item.id}>{item.designator ? `${item.designator} · ` : ''}{item.name}</option>)}</select></label><p>{feature?.technicalRole}</p><p>{feature?.connection}</p><small>{feature?.roleEvidence === 'source-backed' ? 'Vai trò có nguồn theo hồ sơ board.' : 'Chi tiết có thể chưa được xác minh trên mọi board clone.'}</small></div>}
        {infoTab === 'specs' && <div><h4>Nguồn và giới hạn dữ liệu</h4><p>{definition?.sourceRefs.length ? definition.sourceRefs.join(' · ') : 'Registry chưa ghim datasheet/revision cho linh kiện này.'}</p><p>{part?.value?.ohm !== undefined ? `Giá trị fixture: ${part.value.ohm} Ω.` : part?.value?.label ?? 'Không có thông số định mức được khai báo.'}</p><small>{part?.geometrySource === 'cad' ? 'Geometry source: CAD' : part?.geometrySource === 'parametric' ? 'Geometry source: tham số' : 'Geometry chưa được xác minh cho đúng linh kiện/revision.'}</small>{part?.type === 'board' && (() => { const evidence = getBoardModelEvidence(esp32DevkitModel.id); return evidence ? <p className="lesson-circuit-source"><strong>{evidence.revision}</strong> · {evidence.confidenceNote} <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Nguồn model ↗</a></p> : <p className="lesson-circuit-source">Chưa có hồ sơ nguồn của model board này.</p> })()}</div>}
        <p className="lesson-circuit-persistence">Chỉnh sửa ở đây chỉ giữ trong phiên hiện tại; không ghi đè bản nháp của bạn.</p>
      </aside>
    </div>
    <div className="lesson-circuit-check" role="status"><strong>{connected ? 'Đường mạch mẫu đang nối theo các net kỳ vọng' : 'Đường mạch chưa đủ kết nối theo các net kỳ vọng'}</strong><span>Kiểm tra topology theo pin, chân linh kiện và lỗ; đây không phải ERC.</span></div>
  </section>
}
