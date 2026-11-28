import type { BoardModelManifest, BoardPin } from '../components/board/boardSceneTypes'

/** Join the evidence already present in the selected board's manifest without creating wiring aliases. */
export function indexBoardHeaderPins(model: BoardModelManifest, revision: string): BoardPin[] {
  const keys = new Set<string>()
  return model.pins.map(pin => {
    const name = pin.label.trim()
    const header = pin.headerReference
    const pad = pin.padNumber
    const key = [model.id, revision, header ?? pin.side, pad ?? pin.id].map(encodeURIComponent).join('/')
    if (keys.has(key)) throw new Error('Trùng định danh chân trong thư viện: ' + key)
    keys.add(key)
    const nc = /^(NC|N\/C)\b|^Không kết nối/i.test(name)
    const reserved = /^(reserved|dành riêng)\b/i.test(name)
    const hasIdentity = Boolean(header && pad && name && !/^(pin|pad|chân|header)\s+\d+$/i.test(name))
    const status = nc ? 'nc' : reserved ? 'reserved' : hasIdentity ? 'named' : 'unresolved'
    const role = status !== 'named' ? 'unresolved'
      : /^(A?GND|GROUND)\b/i.test(name) ? 'ground'
      : /^(?:\+?(?:3[.,]3V|3V3|5V|5 V|3[.,]3 V)|VBUS|VSYS|VIN|VDDA?|VCC|VBAT|VREF|AVDD|E5V|U5V|IOREF|AREF)(?:\b|$)/i.test(name) ? 'power'
      : /^(RST|RESET|NRST|RUN|BOOT0|EN)\b/i.test(name) ? 'control'
      : pin.gpio !== undefined || /^(?:GPIO|IO|I|D|A|GP)\s*\d+\b|^P[A-K]\d+\b|^(?:[RT]X[D0-9]*|SD[AC]|SCL|SCK|MISO|MOSI)\b/i.test(name)
        ? 'signal' : 'unresolved'
    return { ...pin, catalog: { key, revision, sourceUrl: model.pinoutEvidence?.sourceUrl, status, role } }
  })
}
