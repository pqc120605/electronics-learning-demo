import { getCapability, type CapabilityId } from '../data/capabilityRegistry'

type Props = {
  id: CapabilityId
  className?: string
}

export function CapabilityBadge({ id, className = '' }: Props) {
  const capability = getCapability(id)
  return <span className={`capability-badge capability-badge--${capability.state} ${className}`.trim()} title={capability.description}>{capability.label}</span>
}

export function CapabilityLegend({ ids, title = 'Cách đọc mức hỗ trợ' }: { ids: CapabilityId[]; title?: string }) {
  return <details className="capability-legend">
    <summary>{title}</summary>
    <ul>{ids.map((id) => {
      const capability = getCapability(id)
      return <li key={id}><CapabilityBadge id={id} /><span>{capability.description}</span></li>
    })}</ul>
  </details>
}
