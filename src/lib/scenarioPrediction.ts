/** Compare learner input with one explicit, provider-reported educational scenario result. */
export function compareScenarioPrediction(expected: unknown, prediction: unknown): boolean | null {
  if (typeof expected !== 'string' || typeof prediction !== 'string' || !expected.trim() || !prediction.trim()) return null
  return expected === prediction
}
