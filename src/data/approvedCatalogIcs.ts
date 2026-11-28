import source from '../../docs/research/2026-11-26-catalog-model-ic-r1-proposal.json'
import type { ElectricalType } from './componentRegistry'
import type assets from './approved-catalog-ic-assets.json'

function pinType(catalogId: string, label: string): ElectricalType {
  if (label === 'GND') return 'ground'
  if (label === 'VCC' || label === 'V+') return 'power'
  if (label === 'NC') return 'passive'
  if (/^\dY$|^OUT$|^DOUT$|^SEG |^DIG[0-7]$|^DISCH$/.test(label)) return 'output'
  if (catalogId === 'logic-74hc4511' && /^[a-g]$/.test(label)) return 'output'
  return 'input'
}

export const approvedCatalogIcs = source.parts.map(part => ({
  id: part.catalogId,
  catalogId: part.catalogId,
  packageKey: part.catalogId as keyof typeof assets,
  revision: 'IC-1' as const,
  simulation: 'reference' as const,
  mpn: part.mpn,
  manufacturer: part.manufacturer,
  packageName: part.package,
  source: part.datasheet,
  datasheet: part.datasheetRevision.split(',')[0],
  pinoutPage: Number(part.datasheetRevision.match(/page (\d+)/)?.[1] ?? 1),
  scope: 'Sơ đồ chân theo datasheet và hình học vỏ tham chiếu KiCad.',
  pins: part.pins.map(pin => ({
    id: 'pad-' + pin.pad,
    pad: pin.pad,
    label: 'datasheetLabel' in pin ? `${pin.label} / ${pin.datasheetLabel}` : pin.label,
    electricalType: pinType(part.catalogId, pin.label),
  })),
}))

export function getApprovedCatalogIc(id: string) {
  return approvedCatalogIcs.find(part => part.id === id)
}
