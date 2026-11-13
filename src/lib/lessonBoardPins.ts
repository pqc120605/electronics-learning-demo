import { circuitForLesson } from '../data/lessonCircuits'
import type { BuilderLessonId } from '../data/builderLessons'
import type { CircuitConnection } from '../types/circuitTopology'

/** Starter pins plus any additional board pins used by the learner's current wiring. */
export function getLessonBoardPinIds(lessonId: BuilderLessonId, boardPartId: string, currentWires: CircuitConnection[]): string[] {
  const pinIds = new Set<string>()
  const wires = [...circuitForLesson(lessonId).wires, ...currentWires]
  for (const wire of wires) {
    if (wire.from.partId === boardPartId) pinIds.add(wire.from.pinId)
    if (wire.to.partId === boardPartId) pinIds.add(wire.to.pinId)
  }
  return [...pinIds]
}

/** Keeps a board view focused on the lesson while retaining a deliberate way to inspect every pin. */
export function getVisibleBoardPins<T extends { id: string }>(pins: readonly T[], lessonPinIds: readonly string[], showAll: boolean): T[] {
  if (showAll) return [...pins]
  const relevant = new Set(lessonPinIds)
  return pins.filter((pin) => relevant.has(pin.id))
}
