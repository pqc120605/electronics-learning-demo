export const sevenSegmentIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const
export type SevenSegmentId = typeof sevenSegmentIds[number]

export type SegmentPredictionGrade = {
  correct: boolean
  missing: SevenSegmentId[]
  extra: SevenSegmentId[]
}

/** Compare a learner's A–G prediction with one validated code-table row. */
export function gradeSegmentPrediction(expectedBits: readonly number[], selected: readonly string[]): SegmentPredictionGrade | null {
  if (expectedBits.length !== sevenSegmentIds.length || expectedBits.some(bit => bit !== 0 && bit !== 1)) return null
  if (selected.some(id => !sevenSegmentIds.includes(id as SevenSegmentId))) return null

  const expected = new Set(sevenSegmentIds.filter((_id, index) => expectedBits[index] === 1))
  const predicted = new Set(selected as SevenSegmentId[])
  const missing = sevenSegmentIds.filter(id => expected.has(id) && !predicted.has(id))
  const extra = sevenSegmentIds.filter(id => predicted.has(id) && !expected.has(id))
  return { correct: missing.length === 0 && extra.length === 0, missing, extra }
}
