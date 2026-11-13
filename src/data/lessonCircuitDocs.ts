import type { CircuitDocV2 } from '../lib/circuitDocV2'

const blinkDoc: CircuitDocV2 = {
  schema: 2,
  lessonId: 'blink',
  breadboards: [{ id: 'bb1', spec: '400-30', railSplit: false }],
  parts: [
    { id: 'board-1', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } },
    { id: 'bb-1', type: 'breadboard', mount: { kind: 'bench', lane: 'right', order: 0 } },
    { id: 'res-1', type: 'resistor', value: { ohm: 220 }, mount: { kind: 'breadboard', board: 'bb1', col: 10, row: 2, rotation: 0 } },
    // Rotation 180 puts the LED cathode on column 15 and anode beside R1 on column 14.
    { id: 'led-1', type: 'led', mount: { kind: 'breadboard', board: 'bb1', col: 15, row: 3, rotation: 180 } },
  ],
  wires: [
    { id: 'w-gpio-to-resistor', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'hole', holeId: 'bb1:10a' }, role: 'signal' },
    { id: 'w-led-cathode-to-rail', from: { kind: 'hole', holeId: 'bb1:15a' }, to: { kind: 'hole', holeId: 'bb1:T-:1' }, role: 'ground' },
    { id: 'w-rail-to-gnd', from: { kind: 'hole', holeId: 'bb1:T-:2' }, to: { kind: 'pin', partId: 'board-1', pinId: 'gnd' }, role: 'ground' },
  ],
  expect: { partCount: 4, wireCount: 3, netCount: 3 },
}

const buttonLedDoc: CircuitDocV2 = {
  ...blinkDoc,
  lessonId: 'button-led',
  parts: [
    ...blinkDoc.parts,
    { id: 'button-1', type: 'button', mount: { kind: 'breadboard', board: 'bb1', col: 20, row: 5, rotation: 90 } },
  ],
  wires: [
    ...blinkDoc.wires,
    { id: 'w-input-to-button', from: { kind: 'pin', partId: 'board-1', pinId: 'input' }, to: { kind: 'hole', holeId: 'bb1:20g' }, role: 'signal' },
    { id: 'w-button-to-gnd-rail', from: { kind: 'hole', holeId: 'bb1:22g' }, to: { kind: 'hole', holeId: 'bb1:T-:3' }, role: 'ground' },
  ],
  expect: { partCount: 5, wireCount: 5, netCount: 4 },
}

/** Returns a fresh canonical document for a modeled ESP32 lesson circuit. */
export function getLessonCircuitDoc(lessonId: string): CircuitDocV2 | null {
  if (lessonId === blinkDoc.lessonId) return structuredClone(blinkDoc)
  if (lessonId === buttonLedDoc.lessonId) return structuredClone(buttonLedDoc)
  return null
}
