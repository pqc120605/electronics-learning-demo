import { findGuideAnswers, type GuideArticle, type GuideSnapshot, type GuideSource } from './guideKnowledge'
import { guideSourceKind, normalizeGuideText } from './guideSearch'

export type GuideAiTurn = { question: string; answer: string }
export type GuideAiEvidence = { id: string; title: string; text: string; sources: GuideSource[] }
export type GuideAiProvider = 'openai' | 'ollama' | 'mock'
export type GuideAiStatus = { state: 'ready' | 'model-missing' | 'unavailable' | 'invalid-model' | 'quota-exceeded' | 'signed-out'; model: string; provider?: GuideAiProvider }
export type GuideAiReply = { status: 'answered' | 'insufficient'; model: string; answer: string; sourceIds: string[]; followUps?: string[] }
const endpoint = '/api/guide-ai'
const knownModel = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9._:-]{1,64}$/i.test(value)
const followup = /^(?:vi sao vay|tai sao vay|no hoat dong the nao|giai thich them|noi ro hon|cho vi du|cho mot vi du|toi nen thu gi tiep)$/
const highRisk = /\b(?:dien luoi|cao ap|220\s*v|230\s*v|cau (?:tat|chi)|vo hieu hoa bao ve|noi truc tiep vao o cam)\b/

function sourcesFor(article: GuideArticle) {
  const sources = [article.source, ...(article.sources ?? [])]
  return sources.filter((source, index) => guideSourceKind(source.href) !== 'invalid'
    && sources.findIndex(other => other.href === source.href) === index).slice(0, 3)
}

export function prepareGuideAi(question: string, previousQuestions: readonly string[], snapshot?: GuideSnapshot, provider?: GuideAiProvider) {
  const normalized = normalizeGuideText(question)
  if (highRisk.test(normalized)) return { kind: 'unknown' as const, message: 'Phần hướng dẫn AI chỉ giải thích mạch điện tử điện áp thấp trên mô hình học tập. Hãy hỏi về linh kiện hoặc mạch mô phỏng đang học.' }
  const referencedQuestion = previousQuestions.findLast(text => !followup.test(normalizeGuideText(text)))
  const query = referencedQuestion && followup.test(normalized) ? referencedQuestion : question
  const result = findGuideAnswers(query, snapshot)
  if (result.kind === 'unknown') return result
  const exact = result.articles.find(article => normalizeGuideText(article.title) === normalizeGuideText(query))
  const expanded = provider === 'openai' || provider === 'mock'
  const selected = exact ? [exact] : result.articles.slice(0, expanded ? 4 : 2)
  const evidence: GuideAiEvidence[] = selected.map((article, index) => ({
    id: `S${index + 1}`, title: article.title.slice(0, 180),
    text: article.paragraphs.join('\n').slice(0, 1_100),
    sources: sourcesFor(article),
  }))
  if (expanded && snapshot) {
    const structure = [
      snapshot.board && `Board ${snapshot.board.id} · ${snapshot.board.name}`,
      snapshot.part && `Linh kiện ${snapshot.part.type} · chân ${snapshot.part.pins.slice(0, 20).join(', ')}`,
    ].filter(Boolean).join('\n')
    if (structure) evidence.unshift({ id: 'S0', title: 'Mạch đang mở', text: structure.slice(0, 1_200), sources: [] })
  }
  return { kind: 'ready' as const, evidence }
}

export async function readGuideAiStatus(signal: AbortSignal): Promise<GuideAiStatus> {
  try {
    const response = await fetch(`${endpoint}/status`, { signal, cache: 'no-store' })
    if (!response.ok) throw new Error()
    const data = await response.json()
    if (data.state === 'invalid-model') return { state: 'invalid-model', model: '' }
    if (!knownModel(data.model) || !['ready', 'model-missing', 'unavailable', 'quota-exceeded', 'signed-out'].includes(data.state)) throw new Error()
    const provider = data.provider === 'openai' || data.provider === 'mock' ? data.provider : 'ollama'
    return { state: data.state, model: data.model, provider }
  } catch {
    return { state: 'unavailable', model: '' }
  }
}

export async function requestGuideAi(question: string, evidence: GuideAiEvidence[], history: GuideAiTurn[], signal: AbortSignal): Promise<GuideAiReply> {
  const context = [...evidence]
  const recent = history.slice(-2).map(turn => ({ question: turn.question.slice(0, 400), answer: turn.answer.slice(0, 450) }))
  const encode = () => JSON.stringify({
    question, history: recent, evidence: context.map(({ id, title, text }) => ({ id, title, text })),
  })
  while (context.length > 1 && encode().length > 6_500) context.pop()
  const response = await fetch(`${endpoint}/chat`, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: encode(),
  })
  if (!response.ok) throw new Error('ai-unavailable')
  const result: GuideAiReply = await response.json()
  const validSourceIds = Array.isArray(result?.sourceIds) && result.sourceIds.every(id => context.some(source => source.id === id))
  const validFollowUps = result?.followUps === undefined || (Array.isArray(result.followUps) && result.followUps.length <= 3
    && result.followUps.every(value => typeof value === 'string' && value.length > 0 && value.length <= 160))
  if (!knownModel(result?.model) || !validSourceIds || !validFollowUps || typeof result.answer !== 'string' ||
    (result.status === 'answered' ? !result.sourceIds.length || !result.answer.trim() || result.answer.length > 1_600
      : result.status !== 'insufficient' || result.answer !== '' || result.sourceIds.length !== 0)) throw new Error('ai-unavailable')
  return result
}
