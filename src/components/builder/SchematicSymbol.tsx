type Props = { type: string; label: string; rotation?: number }

/** Compact teaching symbols; circuit validation still comes from the registered pin graph. */
export function SchematicSymbol({ type, label, rotation = 0 }: Props) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return <svg className="schematic-symbol" viewBox="0 0 120 36" role="img" aria-label={`Ký hiệu sơ đồ ${label}`} style={{ transform: `rotate(${rotation}deg)` }}>
    {type === 'resistor' ? <><path {...common} d="M2 18h20m76 0h20M22 18l8-9 12 18 12-18 12 18 12-18 12 18 8-9"/></> :
      type === 'capacitor' ? <><path {...common} d="M2 18h49M69 18h49M52 5v26m16-26v26"/></> :
      type === 'led' || type === 'diode' ? <><path {...common} d="M2 18h35m46 0h35M82 6v24"/><path d="m37 6 44 12-44 12z" fill="currentColor" stroke="currentColor" strokeWidth="2"/>{type === 'led' && <path {...common} d="m56 7 8-7m-2 9 8-7M59 0h5m8-1v5"/>}</> :
      type === 'button' ? <><path {...common} d="M2 18h35m46 0h35M37 18l25-14M78 18h3"/><circle cx="37" cy="18" r="3" fill="currentColor"/><circle cx="81" cy="18" r="3" fill="currentColor"/></> :
      type === 'board' ? <><rect x="24" y="3" width="72" height="30" rx="4" {...common}/><rect x="47" y="9" width="26" height="18" rx="2" {...common}/><text x="60" y="22" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="monospace">MCU</text></> :
      type === 'breadboard' ? <><rect x="8" y="4" width="104" height="28" rx="3" {...common}/>{Array.from({ length: 9 }, (_, index) => <circle key={index} cx={20 + index * 10} cy="18" r="2" fill="currentColor"/>)}</> :
      <><circle cx="60" cy="18" r="13" {...common}/><path {...common} d="M2 18h45m26 0h45"/><text x="60" y="21" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="monospace">{type.slice(0, 4).toUpperCase()}</text></>}
  </svg>
}
