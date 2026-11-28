import source from '../../docs/research/2026-11-26-catalog-model-remaining-13-proposal.json'
import type assets from './remaining-catalog-parts-assets.json'
import type { ElectricalType } from './componentRegistry'

function electricalType(label: string): ElectricalType {
  if (label === 'GND') return 'ground'
  if (/^(VCC|VDD|COM)/.test(label)) return 'power'
  return label.startsWith('DATA') ? 'bidirectional' : 'passive'
}

const sources: Record<string, { url?: string; path: string }> = source.sourceLocks

export const approvedRemainingParts = source.components.map(part => ({
  id: part.catalogId + '-reference-1',
  catalogId: part.catalogId,
  packageKey: part.catalogId as keyof typeof assets,
  revision: 'KIT-1' as const,
  simulation: 'reference' as const,
  mpn: part.mpn,
  manufacturer: part.manufacturer,
  packageName: { dht11: 'THT 4 chân', 'dht22-bare': 'THT 4 chân', 'keypad-4x4': 'Keypad cứng + socket 1×8', 'seven-segment-anode': 'LED 7 đoạn anode chung' }[part.catalogId]!,
  source: sources[part.sourceIds[0]].url!,
  datasheet: 'Thông số và sơ đồ chân',
  pinoutPage: part.catalogId === 'dht11' ? 10 : 1,
  scope: 'Đối chiếu hình học và chân theo phiên bản đã duyệt.',
  pins: part.pins.map(pin => ({
    id: pin.libraryPinId ?? 'nc-' + pin.pad,
    pad: pin.pad,
    label: pin.label,
    electricalType: electricalType(pin.label),
  })),
}))

export function getApprovedRemainingPart(id: string) {
  return approvedRemainingParts.find(part => part.catalogId === id || part.id === id)
}
