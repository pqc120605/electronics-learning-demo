import { insufficient, validateAnswer, validateInput } from './schema.mjs'
import { mockAnswer } from './providers/mock.mjs'
import { openAiAnswer } from './providers/openai.mjs'

const modelId = /^[a-z0-9._:-]{1,64}$/i
const highRisk = /\b(?:dien luoi|cao ap|2[23]0\s*v|cau (?:tat|chi)|vo hieu hoa bao ve|noi truc tiep vao o cam|thao (?:roi )?pin lithium|pin lithium thao roi)\b/

function setup(env) {
  const askedForOpenAi = env.GUIDE_AI_PROVIDER === 'openai'
  const ready = askedForOpenAi && modelId.test(env.OPENAI_MODEL ?? '') && Boolean(env.OPENAI_API_KEY?.trim())
  return ready ? { provider: 'openai', model: env.OPENAI_MODEL, key: env.OPENAI_API_KEY, state: 'ready' }
    : { provider: 'mock', model: 'mock', state: env.GUIDE_AI_PROVIDER === 'mock' ? 'ready' : 'unavailable' }
}

export function handleStatus(env = {}) {
  const { state, provider, model } = setup(env)
  return { status: 200, body: { state, provider, model } }
}

export async function handleChat(body, env = {}, context = {}) {
  const input = validateInput(body)
  if (!input) return { status: 400, body: { error: 'request' } }
  const config = setup(env)
  const normalized = input.question.toLowerCase().normalize('NFD').replaceAll('đ', 'd').replace(/\p{Mark}/gu, '')
  const answer = highRisk.test(normalized) ? null : config.provider === 'openai'
    ? await openAiAnswer(input, config, context) : mockAnswer(input)
  return { status: 200, body: { ...(validateAnswer(answer, input.evidence) ?? insufficient()), model: config.model } }
}
