import { useState, type KeyboardEvent } from 'react'
import type { PartPinConnection } from '../../lib/circuitNets'
import type { FeatureInfo, PartInfo, PartInfoTab, PartSource } from '../../lib/partInfo'
import type { ComponentDefinition } from '../../data/componentRegistry'
import type { CircuitEndpoint } from '../../types/circuitTopology'

const tabLabels: Record<PartInfoTab, string> = { overview: 'Tổng quan', pins: 'Chân và nối', example: 'Ví dụ code', limits: 'Lưu ý', source: 'Nguồn model' }

function SourceBlock({ source }: { source: PartSource }) {
  return <>
    <p>{source.note}</p>
    <dl className="part-info-facts">
      {source.revision && <div><dt>Bản tham chiếu</dt><dd>{source.revision}</dd></div>}
      {source.license && <div><dt>Giấy phép</dt><dd>{source.license}</dd></div>}
      {source.attribution && <div><dt>Ghi công</dt><dd>{source.attribution}</dd></div>}
    </dl>
    {source.url && <a href={source.url} target="_blank" rel="noreferrer">Xem nguồn <span aria-hidden="true">↗</span></a>}
    {source.issues?.length ? <ul>{source.issues.map((item) => <li key={item}>{item}</li>)}</ul> : null}
  </>
}

type Props = {
  info: PartInfo
  feature?: FeatureInfo
  definition: ComponentDefinition
  connections: PartPinConnection[]
  pinLabel: (index: number, fallback: string) => string
  describe: (endpoint: CircuitEndpoint) => string
  pinEvidence: string
}

export function PartInfoPanel({ info, feature, definition, connections, pinLabel, describe, pinEvidence }: Props) {
  const tabs: PartInfoTab[] = feature ? ['overview', 'limits', 'source'] : info.tabs
  const [requested, setRequested] = useState<PartInfoTab>('overview')
  const tab = tabs.includes(requested) ? requested : 'overview'
  function onKey(event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length]
    setRequested(next)
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus()
  }
  return <section className="part-info" aria-label={`Thông tin ${feature?.title ?? info.title}`}>
    <header>
      <h3>{feature?.title ?? info.title}</h3>
      <p><span className={`part-info-kind part-info-kind-${info.modelKind}`}>{feature ? 'Linh kiện trên board · dữ liệu CAD' : info.modelLabel}</span>{feature?.designator ? ` · ${feature.designator}` : ''}</p>
    </header>
    <div className="part-info-tabs" role="tablist" aria-label="Mục thông tin">
      {tabs.map((item) => <button key={item} id={`part-tab-${item}`} data-tab={item} type="button" role="tab" aria-selected={item === tab} aria-controls="part-tab-panel" tabIndex={item === tab ? 0 : -1} onKeyDown={onKey} onClick={() => setRequested(item)}>{tabLabels[item]}</button>)}
    </div>
    <div className="part-info-body" id="part-tab-panel" role="tabpanel" aria-labelledby={`part-tab-${tab}`}>
      {tab === 'overview' && (feature ? <>
        <p>{feature.summary}</p>
        <dl className="part-info-facts">
          <div><dt>Vai trò kỹ thuật</dt><dd>{feature.role}</dd></div>
          <div><dt>Kết nối</dt><dd>{feature.connection}</dd></div>
          {feature.cadLine && <div><dt>Dữ liệu CAD</dt><dd>{feature.cadLine}</dd></div>}
        </dl>
        <p className="part-info-evidence">{feature.evidenceLabel}</p>
      </> : <><p>{info.summary}</p><ul>{info.facts.map((item) => <li key={item}>{item}</li>)}</ul></>)}
      {tab === 'pins' && !feature && <>
        <ul className="part-info-pins">{definition.pins.map((pin, index) => {
          const peers = connections.find((item) => item.pinId === pin.id)?.peers ?? []
          return <li key={pin.id}><b>{pinLabel(index, pin.label)}</b><span>{peers.length ? peers.map(describe).join(', ') : 'Chưa nối'}</span></li>
        })}</ul>
        <p className="part-info-evidence">{pinEvidence}</p>
      </>}
      {tab === 'example' && !feature && <><pre><code>{info.exampleLines.join('\n')}</code></pre><p className="part-info-evidence">Các dòng lấy từ code đang mở của bài này.</p></>}
      {tab === 'limits' && <ul>{(feature?.limits ?? info.limits).map((item) => <li key={item}>{item}</li>)}</ul>}
      {tab === 'source' && <SourceBlock source={feature?.source ?? info.source} />}
    </div>
  </section>
}
