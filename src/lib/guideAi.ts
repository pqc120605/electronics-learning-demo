import { findGuideAnswers, type GuideArticle, type GuideSnapshot, type GuideSource } from './guideKnowledge'
import { guideSourceKind, normalizeGuideText } from './guideSearch'

export type GuideAiTurn = { question: string; answer: string }
export type GuideAiEvidence = { id: string; title: string; text: string; sources: GuideSource[] }
export type GuideAiStatus = { state: 'ready' | 'model-missing' | 'unavailable' | 'invalid-model'; model: string }
export type GuideAiReply = { status: 'answered' | 'insufficient'; model: string; answer: string; sourceIds: string[] }
const endpoint = '/api/guide-ai'
const knownModels = new Set(['qwen3.5:2b', 'qwen3.5:4b', 'qwen3.5:9b'])
const followup = /^(?:vi sao vay|tai sao vay|no hoat dong the nao|giai thich them|noi ro hon|cho vi du|cho mot vi du|toi nen thu gi tiep)$/
const highRisk = /\b(?:dien luoi|cao ap|220\s*v|230\s*v|cau (?:tat|chi)|vo hieu hoa bao ve|noi truc tiep vao o cam)\b/

function sourcesFor(article: GuideArticle) {
  const sources = [article.source, ...(article.sources ?? [])]
  return sources.filter((source, index) => guideSourceKind(source.href) !== 'invalid'
    && sources.findIndex(other => other.href === source.href) === index).slice(0, 3)
}

export function prepareGuideAi(question: string, previousQuestions: readonly string[], snapshot?: GuideSnapshot) {
  const normalized = normalizeGuideText(question)
  if (highRisk.test(normalized)) return { kind: 'unknown' as const, message: 'Phần hướng dẫn AI chỉ giải thích mạch điện tử điện áp thấp trên mô hình học tập. Hãy hỏi về linh kiện hoặc mạch mô phỏng đang học.' }
  const referencedQuestion = previousQuestions.findLast(text => !followup.test(normalizeGuideText(text)))
  const query = referencedQuestion && followup.test(normalized) ? referencedQuestion : question
  const result = findGuideAnswers(query, snapshot)
  if (result.kind === 'unknown') return result
  const exact = result.articles.find(article => normalizeGuideText(article.title) === normalizeGuideText(query))
  const selected = exact ? [exact] : result.articles.slice(0, 2)
  const evidence: GuideAiEvidence[] = selected.map((article, index) => ({
    id: `S${index + 1}`, title: article.title.slice(0, 180),
    text: article.paragraphs.join('\n').slice(0, 1_100),
    sources: sourcesFor(article),
  }))
  return { kind: 'ready' as const, evidence }
}

export async function readGuideAiStatus(signal: AbortSignal): Promise<GuideAiStatus> {
  try {
    const response = await fetch(`${endpoint}/status`, { signal, cache: 'no-store' })
    if (!response.ok) throw new Error()
    const data = await response.json()
    if (data.state === 'invalid-model') return { state: 'invalid-model', model: '' }
    if (!knownModels.has(data.model) || !['ready', 'model-missing', 'unavailable'].includes(data.state)) throw new Error()
    return { state: data.state, model: data.model }
  } catch {
    return { state: 'unavailable', model: '' }
  }
}

export async function requestGuideAi(question: string, evidence: GuideAiEvidence[], history: GuideAiTurn[], signal: AbortSignal): Promise<GuideAiReply> {
  const response = await fetch(`${endpoint}/chat`, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question, history: history.slice(-2).map(turn => ({ question: turn.question, answer: turn.answer.slice(0, 450) })),
      evidence: evidence.map(({ id, title, text }) => ({ id, title, text })),
    }),
  })
  if (!response.ok) throw new Error('ai-unavailable')
  const result: GuideAiReply = await response.json()
  const validSourceIds = Array.isArray(result?.sourceIds) && result.sourceIds.every(id => evidence.some(source => source.id === id))
  if (!knownModels.has(result?.model) || !validSourceIds || typeof result.answer !== 'string' ||
    (result.status === 'answered' ? !result.sourceIds.length || !result.answer.trim() || result.answer.length > 1_600
      : result.status !== 'insufficient' || result.answer !== '' || result.sourceIds.length !== 0)) throw new Error('ai-unavailable')
  return result
}
