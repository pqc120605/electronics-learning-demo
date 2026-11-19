export const answerSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'answer', 'sourceIds', 'followUps'],
  properties: {
    status: { type: 'string', enum: ['answered', 'insufficient'] },
    answer: { type: 'string' },
    sourceIds: { type: 'array', items: { type: 'string' } },
    followUps: { type: 'array', items: { type: 'string' } },
  },
}

const objectWith = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max
const unsafeMarkup = /(?:https?:\/\/|www\.|<\/?[a-z]|\]\s*\()/i

export function validateInput(input) {
  if (!objectWith(input, ['question', 'evidence', 'history']) || !text(input.question, 400)
      || !Array.isArray(input.evidence) || input.evidence.length < 1 || input.evidence.length > 5
      || !Array.isArray(input.history) || input.history.length > 2) return null
  const start = input.evidence[0]?.id === 'S0' ? 0 : 1
  if (input.evidence.length > 5 - start) return null
  if (!input.evidence.every((entry, index) => objectWith(entry, ['id', 'title', 'text'])
    && entry.id === `S${start + index}` && text(entry.title, 180) && text(entry.text, entry.id === 'S0' ? 1_200 : 1_100))) return null
  if (!input.history.every(item => objectWith(item, ['question', 'answer']) && text(item.question, 400) && text(item.answer, 450))) return null
  return JSON.stringify(input).length <= 6_500 ? input : null
}

export const insufficient = () => ({ status: 'insufficient', answer: '', sourceIds: [], followUps: [] })

export function validateAnswer(value, evidence) {
  if (!objectWith(value, answerSchema.required) || !Array.isArray(value.sourceIds) || !Array.isArray(value.followUps)
      || value.followUps.length > 3 || !value.followUps.every(question => text(question, 160) && !unsafeMarkup.test(question))) return null
  if (value.status === 'insufficient') return value.answer === '' && value.sourceIds.length === 0 ? value : null
  if (value.status !== 'answered' || !text(value.answer, 1_600) || unsafeMarkup.test(value.answer)) return null
  const sourceIds = new Set(value.sourceIds)
  if (!sourceIds.size || sourceIds.size !== value.sourceIds.length
      || !value.sourceIds.every(id => evidence.some(entry => entry.id === id))) return null
  const cited = [...value.answer.matchAll(/\[(S\d+)\]/g)].map(match => match[1])
  return cited.length > 0 && cited.every(id => sourceIds.has(id)) && value.sourceIds.every(id => cited.includes(id)) ? value : null
}
