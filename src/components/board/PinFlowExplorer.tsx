import type { BoardModelManifest } from './boardSceneTypes'

type PinFlowExplorerProps = {
  manifest: BoardModelManifest
  selectedPinId: string
  onSelectPin: (pinId: string) => void
  activeFlowId: string
  onSelectFlow: (flowId: string) => void
}

export function PinFlowExplorer({ manifest, selectedPinId, onSelectPin, activeFlowId, onSelectFlow }: PinFlowExplorerProps) {
  const selectedFlow = manifest.signalFlows.find((flow) => flow.id === activeFlowId) ?? manifest.signalFlows[0]
  if (!selectedFlow) return null
  const pinButton = (pin: BoardModelManifest['pins'][number]) => <button key={pin.id} type="button" className={`pinout-item ${selectedPinId === pin.id ? 'pinout-item-active' : ''} ${selectedFlow.relatedPinIds.includes(pin.id) ? 'pinout-item-flow-related' : ''}`} onClick={() => onSelectPin(pin.id)} aria-pressed={selectedPinId === pin.id}><span>{pin.label}</span><small>{manifest.pinPicking === false ? pin.functions.join(' · ') : pin.gpio === undefined ? (pin.label === 'GND' ? 'mass' : pin.label === 'EN' ? 'reset' : 'nguồn') : `GPIO${pin.gpio}`}</small></button>
  return <section className="pin-flow-explorer" aria-label="Tra cứu chân và luồng hoạt động">
    <div className="pin-flow-heading"><div><p className="eyebrow">PINOUT &amp; LUỒNG TÍN HIỆU</p><h3>Hiểu chân trước khi nối mạch</h3></div><p>{manifest.pinPicking === false ? 'Tra cứu chức năng chân theo tên, rồi lần theo các luồng hoạt động mẫu.' : 'Chọn một chân để xem vai trò, hoặc lần theo các luồng hoạt động mẫu.'}</p></div>
    <div className="pin-explorer-grid">
      <div className="pinout-card">
        <div className="pinout-title"><strong>{manifest.pinPicking === false ? `Danh sách ${manifest.pins.length} chân tham chiếu` : `Bản đồ ${manifest.pins.length} chân tham chiếu`}</strong><span>Chọn chân để xem chức năng</span></div>
        {manifest.pinPicking === false ? <div role="group" className="pinout-columns" aria-label="Danh sách tên chân tham chiếu">{(['left', 'right'] as const).map((side) => <div role="group" className="pinout-column" key={side} aria-label={side === 'left' ? 'Danh sách chân' : 'Danh sách chân tiếp theo'}>{manifest.pins.filter((pin) => pin.side === side).map(pinButton)}</div>)}</div> : <div className="pinout-columns">{(['left', 'right'] as const).map((side) => <div role="group" className="pinout-column" key={side} aria-label={side === 'left' ? 'Hàng chân bên trái' : 'Hàng chân bên phải'}>{manifest.pins.filter((pin) => pin.side === side).sort((a, b) => b.position - a.position).map(pinButton)}</div>)}</div>}
        <p className="pinout-caveat">{manifest.pinPicking === false ? 'Danh sách này giải thích tên và chức năng, không thể hiện vị trí vật lý trên board. Đối chiếu silkscreen, sơ đồ chân và datasheet đúng phiên bản trước khi đấu nối.' : 'Pinout mang tính tham khảo; đối chiếu đúng phiên bản board và datasheet trước khi cắm dây.'}</p>
      </div>
      <div className="signal-flow-card">
        <div className="pinout-title"><strong>Luồng hoạt động</strong><span>Chọn chủ đề</span></div>
        <div role="group" className="flow-tabs" aria-label="Chủ đề luồng tín hiệu">{manifest.signalFlows.map((flow) => <button key={flow.id} type="button" aria-pressed={selectedFlow.id === flow.id} className={selectedFlow.id === flow.id ? 'flow-tab-active' : ''} onClick={() => onSelectFlow(flow.id)}>{flow.title}</button>)}</div>
        <article className="flow-content"><h4>{selectedFlow.title}</h4><p>{selectedFlow.summary}</p><ol>{selectedFlow.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}</ol><p className="flow-note">{selectedFlow.note}</p><div role="group" className="flow-related-pins" aria-label="Chân liên quan đến luồng này">{selectedFlow.relatedPinIds.map((id) => { const pin = manifest.pins.find((item) => item.id === id); return pin && <button key={id} type="button" aria-pressed={selectedPinId === id} onClick={() => onSelectPin(id)}>{pin.label}{pin.gpio === undefined ? '' : ` · GPIO${pin.gpio}`}</button> })}</div></article>
      </div>
    </div>
  </section>
}
