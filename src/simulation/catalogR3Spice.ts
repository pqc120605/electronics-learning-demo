import { catalogR3Parts } from '../data/catalogR3Parts'
import { compileFreestyleAnalog } from '../lib/freestyle/freestyleAnalogSpice'
import { r3FixtureCases } from './catalogR3Fixtures'
import type { SpicePractice, SpicePracticeVariant } from './spicePractice'

export const catalogR3Spice: readonly SpicePractice[] = catalogR3Parts.map(part => {
  const variants = r3FixtureCases[part.catalogId]().map((fixture): SpicePracticeVariant => {
    const result = compileFreestyleAnalog(fixture.doc, '', 25)
    if (!result.ok) throw new Error(part.id + ': ' + result.issues.join(' '))
    const signal = fixture.unit === 'V' ? result.pinSignals?.[fixture.probe] : result.sourceSignals?.[fixture.probe]
    if (!signal) throw new Error(part.id + ': thiếu kênh đo ' + fixture.probe)
    return {
      label: fixture.label, explanation: fixture.explanation, netlist: result.netlist,
      measure: { signal, unit: fixture.unit, min: fixture.unit === 'V' ? 0 : -510, max: fixture.unit === 'V' ? 16 : 510 },
    }
  })
  const [first, ...more] = variants
  return {
    id: 'r3-' + part.catalogId, name: part.mpn + ' · điểm làm việc DC', parts: [part.catalogId],
    description: 'Chọn điều kiện thử rồi đo điện áp hoặc dòng từ mạch đã nối.',
    model: part.scope + ' Số đo nằm trong miền thử mô hình ở 25 °C.',
    analysis: 'op', measure: first.measure!, variants: [first, ...more],
  }
})
